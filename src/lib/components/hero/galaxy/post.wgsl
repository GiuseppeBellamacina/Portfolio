// Gas and dust: bulge glow, disk glow and absorbing dust lanes, all analytic and tinted with the
// theme palette. Each pixel is intersected with the galaxy plane; the stars image is dimmed by the
// dust there.
import { hash2 } from "@vgpu/wgsl-std/hash";

struct Cam {
  res: vec2f,
  center: vec2f,
  time: f32,
  tilt: f32,
  roll: f32,
  dist: f32,
  focal: f32,
  spin: f32,
  gain: f32,
  hover: f32,
  mouse: vec2f,
  ring: f32,
  core: f32, // bulge brightness: 1 on desktop, lower on phones where the core is just a few pixels
}
struct Pal {
  c: array<vec4f, 12>,
  space: vec4f,
}
@group(0) @binding(0) var<uniform> cam: Cam;
@group(0) @binding(1) var stars: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> pal: Pal;

const PI: f32 = 3.14159265;
const ARMS: f32 = 3.0;
const GALAXY_R: f32 = 1.5;
const SCALE: f32 = 0.1875;

fn armPhase(r: f32) -> f32 {
  return 2.2 * log(sqrt(r * r + 0.0196) / 0.14);
}

fn pcol(dist: f32) -> vec3f {
  var e = array<f32, 12>(0.0, 0.05, 0.1, 0.17, 0.25, 0.34, 0.44, 0.54, 0.64, 0.74, 0.86, 1.0);
  var col = pal.c[0].rgb;
  for (var i = 1; i < 12; i++) {
    col = mix(col, pal.c[i].rgb, smoothstep(e[i - 1], e[i], dist));
  }
  return mix(pal.c[4].rgb, col, smoothstep(0.0, 0.3, dist));
}

fn rot(tilt: f32, roll: f32) -> mat3x3f {
  let ct = cos(tilt);
  let st = sin(tilt);
  let cr = cos(roll);
  let sr = sin(roll);
  let rx = mat3x3f(vec3f(1.0, 0.0, 0.0), vec3f(0.0, ct, st), vec3f(0.0, -st, ct));
  let rz = mat3x3f(vec3f(cr, sr, 0.0), vec3f(-sr, cr, 0.0), vec3f(0.0, 0.0, 1.0));
  return rz * rx;
}

fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash2(i).x;
  let b = hash2(i + vec2f(1.0, 0.0)).x;
  let c = hash2(i + vec2f(0.0, 1.0)).x;
  let d = hash2(i + vec2f(1.0, 1.0)).x;
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p: vec2f) -> f32 {
  var s = 0.0;
  var amp = 0.5;
  var q = p;
  for (var k = 0; k < 4; k++) {
    s += amp * vnoise(q);
    q = q * 2.03 + vec2f(17.0, 9.0);
    amp *= 0.5;
  }
  return s;
}

// signed angular distance (radians) to the nearest arm
fn armOffset(theta: f32) -> f32 {
  let period = 2.0 * PI / ARMS;
  return theta - period * floor(theta / period + 0.5);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = cam.res.x / cam.res.y;
  let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  let sxy = vec2f((ndc.x - cam.center.x) * aspect, ndc.y - cam.center.y);
  let rt = transpose(rot(cam.tilt, cam.roll));
  let o = rt * vec3f(0.0, 0.0, cam.dist);
  let d = normalize(rt * vec3f(sxy, -cam.focal));

  // Bulge: line-of-sight integral of a flattened gaussian = gaussian of the impact parameter
  let os = vec3f(o.xy, o.z / 0.75);
  let ds = normalize(vec3f(d.xy, d.z / 0.75));
  let tca = -dot(os, ds);
  let closest = os + tca * ds;
  let b2 = dot(closest, closest);
  let bulge = exp(-b2 / (2.0 * 0.14 * 0.14)) + 0.35 * exp(-b2 / (2.0 * 0.32 * 0.32));

  var disk = vec3f(0.0);
  var tau = 0.0;
  var r = 10.0;
  let sHit = -o.z / d.z;
  if (sHit > 0.0 && abs(d.z) > 0.0001) {
    let hit = o + sHit * d;
    r = length(hit.xy);
    let phi = atan2(hit.y, hit.x);
    let theta = phi - armPhase(r) - cam.spin;
    let m = armOffset(theta);
    let arm = exp(-m * m / (2.0 * 0.26 * 0.26));
    let ml = armOffset(theta - 0.14); // dust lanes trail the stars
    let lane = exp(-ml * ml / (2.0 * 0.18 * 0.18));
    let nang = phi - cam.spin;
    let q = vec2f(r * cos(nang), r * sin(nang)) * 6.0;
    let n = fbm(q);
    let path = clamp(1.0 / abs(d.z), 1.0, 5.0);
    let edge = smoothstep(1.55, 1.1, r);

    // the cursor ring also brightens the gas under it
    let flare = 1.0 + 0.25 * smoothstep(cam.ring + 0.4 * SCALE, 0.0, length(hit.xy - cam.mouse)) * cam.hover;
    let glow = mix(cam.core, 1.0, smoothstep(0.0, 0.35, r)) * exp(-r / 0.45) * edge * (0.25 + 0.75 * arm) * (0.6 + 0.8 * n) * sqrt(path);
    disk = pcol(r / GALAXY_R) * glow * 0.16 * flare;
    tau = 2.4 * smoothstep(0.02, 0.2, r) * exp(-r / 0.55) * (0.3 + 0.9 * lane) * (0.45 + 1.1 * n) * edge * path;
  }

  let t = exp(-tau);
  // Stars of the bulge behind the plane are dimmed only where the dust is in front of the centre
  let front = mix(smoothstep(0.45, 0.9, r), 1.0, smoothstep(-0.15, 0.15, tca - sHit));
  let tStars = mix(1.0, t, front);
  let starImg = textureSample(stars, linearSampler, uv).rgb;
  let bulgeCol = pcol(0.02) * bulge * 0.5 * cam.core * tStars;
  return vec4f(starImg * tStars + bulgeCol + disk, 1.0);
}
