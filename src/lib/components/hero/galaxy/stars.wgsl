// Procedural stars: every instance derives its population, position, colour and brightness
// from its index and the time. No buffers, no compute pass.
// Same behaviour as the original three.js galaxy: rigid slow rotation, per-star "breathing",
// 12-stop theme palette from the centre to the rim, and a cursor ring that pushes stars out.
import { pcg3d, unitFloat } from "@vgpu/wgsl-std/hash";

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
}
struct Pal {
  c: array<vec4f, 12>,
  space: vec4f,
}
@group(0) @binding(0) var<uniform> cam: Cam;
@group(0) @binding(1) var<uniform> pal: Pal;

const PI: f32 = 3.14159265;
const ARMS: f32 = 3.0;
const GALAXY_R: f32 = 1.5; // the original's radius of 8, scaled down
const SCALE: f32 = 0.1875; // GALAXY_R / 8: converts the original's distances

struct Out {
  @builtin(position) position: vec4f,
  @location(0) q: vec2f,
  @location(1) color: vec3f,
}

fn rnd(i: u32, k: u32) -> vec3f {
  let h = pcg3d(vec3u(i, k, 0x9e3779b9u));
  return vec3f(unitFloat(h.x), unitFloat(h.y), unitFloat(h.z));
}

// ~N(0,1) from three uniforms
fn gauss(u: vec3f) -> f32 {
  return (u.x + u.y + u.z - 1.5) * 2.0;
}

// logarithmic spiral
fn armPhase(r: f32) -> f32 {
  return 2.2 * log(sqrt(r * r + 0.0196) / 0.14);
}

// The original 12-stop gradient: centre -> rim, the core takes the soft c5 tint instead of white
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

@vertex fn vs_main(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> Out {
  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
  );
  let a = rnd(ii, 0u);
  let b = rnd(ii, 1u);
  let c = rnd(ii, 2u);
  let d = rnd(ii, 3u);
  let e = rnd(ii, 4u);

  var p = vec3f(0.0);
  var lum = 0.1;
  var tint = 0.0; // 0: palette by radius, 1: field star (near white)
  var onScreen = false;
  var ndc = vec2f(0.0);

  let pop = a.x;
  if (pop < 0.76) {
    // Exponential disk, truncated at the rim, with 3 log-spiral arms
    let rd = 0.45;
    let r = -rd * log(1.0 - a.y * (1.0 - exp(-GALAXY_R / rd)));
    let inArm = a.z < 0.72;
    var phi = 0.0;
    if (inArm) {
      phi = armPhase(r) + floor(b.x * ARMS) * 2.0 * PI / ARMS + gauss(c) * 0.22 + cam.spin;
    } else {
      phi = b.y * 2.0 * PI + cam.spin;
    }
    let z = gauss(d) * (0.015 + 0.03 * r);
    p = vec3f(r * cos(phi), r * sin(phi), z);
    lum = pow(e.x, 3.0);
    if (inArm) { lum = lum * 1.4; }
  } else if (pop < 0.92) {
    // Bulge: flattened spheroid
    let g = vec3f(gauss(b), gauss(c), gauss(d));
    let q = g * 0.12 * vec3f(1.0, 1.0, 0.75) * (0.5 + 1.5 * e.x * e.x);
    p = vec3f(q.x * cos(cam.spin) - q.y * sin(cam.spin), q.x * sin(cam.spin) + q.y * cos(cam.spin), q.z);
    lum = pow(e.y, 4.0) * 0.8;
  } else if (pop < 0.96) {
    // Halo: sparse and dim
    let dir = normalize(vec3f(gauss(b), gauss(c), gauss(d)) + vec3f(0.0001));
    p = dir * (0.4 + e.x) * vec3f(1.0, 1.0, 0.7);
    lum = pow(e.y, 4.0) * 0.5;
  } else {
    // Field stars of the surrounding space, placed straight on the screen
    onScreen = true;
    ndc = vec2f(b.x * 2.0 - 1.0, b.y * 2.0 - 1.0);
    tint = 1.0;
    lum = pow(d.x, 8.0) * 0.5;
  }

  // Cursor ring, in the galaxy frame: stars near it are pushed outwards, lifted and flared
  var vel = 0.0;
  if (!onScreen) {
    let diff = p.xy - cam.mouse;
    let md = length(diff);
    vel = smoothstep(cam.ring + 0.4 * SCALE, 0.0, md) * cam.hover;
    if (md > 0.0001) {
      p = vec3f(p.xy + diff / md * vel * 0.3 * SCALE, p.z);
    }
    p.z += vel * 0.15 * SCALE;
  }

  // Each star breathes on its own cycle
  let lifeEnd = 3.0 + sin(b.y * 100.0) * 1.5;
  let lifeTime = (b.x * 100.0 + cam.time * 0.5) % lifeEnd;
  let anim = smoothstep(0.01, 0.5, lifeTime) - smoothstep(0.5, 1.0, lifeTime / lifeEnd);
  let breath = 0.3 + 0.7 * anim;

  var out: Out;
  out.q = corners[vi];
  var clip = vec4f(2.0, 2.0, 0.5, 1.0); // off-screen unless it projects in front of the camera
  var depthScale = 1.0;
  var depthDim = 1.0;
  if (onScreen) {
    clip = vec4f(ndc, 0.5, 1.0);
  } else {
    let v = rot(cam.tilt, cam.roll) * p;
    let depth = cam.dist - v.z;
    if (depth > 0.05) {
      let aspect = cam.res.x / cam.res.y;
      let s = cam.focal / depth;
      clip = vec4f(v.x * s / aspect + cam.center.x, v.y * s + cam.center.y, 0.5, 1.0);
      depthScale = clamp(cam.dist / depth, 0.6, 3.0);
      // nearer stars read brighter, farther ones dimmer (the original's depth cueing)
      depthDim = clamp(1.0 + (7.9 - depth / SCALE) * 0.045, 0.55, 1.35);
    }
  }

  var col = pcol(length(p.xy) / GALAXY_R);
  col = mix(col, mix(vec3f(1.0), pal.c[2].rgb, 0.5), tint);
  col = (col + vec3f(vel * 0.4)) * depthDim;
  out.color = col * (0.15 + lum) * cam.gain * breath * (1.0 + vel * 2.0);
  let sizePx = max(mix(1.0, 2.6, sqrt(lum)) * depthScale * (0.6 + 0.4 * breath + vel * 1.2), 0.8);
  out.position = vec4f(clip.xy + corners[vi] * sizePx * 2.0 / cam.res, clip.z, clip.w);
  return out;
}

@fragment fn fs_main(@location(0) q: vec2f, @location(1) color: vec3f) -> @location(0) vec4f {
  let a = exp(-dot(q, q) * 3.5);
  return vec4f(color * a, 1.0);
}
