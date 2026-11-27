// Procedural stars: every instance derives its population, position, colour and brightness
// from its index and the time. No buffers, no compute pass.
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
}
@group(0) @binding(0) var<uniform> cam: Cam;

const PI: f32 = 3.14159265;
const ARMS: f32 = 3.0;

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
  var col = vec3f(1.0);
  var lum = 0.1;
  var onScreen = false;
  var ndc = vec2f(0.0);

  let pop = a.x;
  if (pop < 0.76) {
    // Exponential disk, truncated at 1.5, with 3 log-spiral arms
    let rd = 0.42;
    let r = -rd * log(1.0 - a.y * (1.0 - exp(-1.5 / rd)));
    let inArm = a.z < 0.72;
    var phi = 0.0;
    var young = 0.25;
    if (inArm) {
      phi = armPhase(r) + floor(b.x * ARMS) * 2.0 * PI / ARMS + gauss(c) * 0.22 + cam.spin;
      young = 0.8;
    } else {
      // inter-arm stars rotate differentially: inner ones faster
      phi = b.y * 2.0 * PI + cam.spin * (0.5 + 0.9 / (1.0 + 3.0 * r));
    }
    let z = gauss(d) * (0.015 + 0.03 * r);
    p = vec3f(r * cos(phi), r * sin(phi), z);
    young = clamp(young + r * 0.15 + (b.z - 0.5) * 0.4, 0.0, 1.0);
    col = mix(vec3f(1.0, 0.82, 0.58), vec3f(0.62, 0.76, 1.0), young);
    lum = pow(e.x, 3.0);
    if (inArm && e.y < 0.025) {
      // HII region: a rare pink-red knot
      col = vec3f(1.0, 0.32, 0.5);
      lum = 0.5 + 0.5 * e.z;
    }
  } else if (pop < 0.92) {
    // Bulge: old, warm, flattened, a little faster than the disk
    let g = vec3f(gauss(b), gauss(c), gauss(d));
    let q = g * 0.12 * vec3f(1.0, 1.0, 0.75) * (0.5 + 1.5 * e.x * e.x);
    let ang = cam.spin * 1.3;
    p = vec3f(q.x * cos(ang) - q.y * sin(ang), q.x * sin(ang) + q.y * cos(ang), q.z);
    col = vec3f(1.0, 0.76, 0.44);
    lum = pow(e.y, 4.0) * 0.8;
  } else if (pop < 0.96) {
    // Halo: sparse, dim, old
    let dir = normalize(vec3f(gauss(b), gauss(c), gauss(d)) + vec3f(0.0001));
    p = dir * (0.4 + e.x) * vec3f(1.0, 1.0, 0.7);
    col = vec3f(1.0, 0.85, 0.65);
    lum = pow(e.y, 4.0) * 0.5;
  } else {
    // Foreground field stars, placed straight on the screen
    onScreen = true;
    ndc = vec2f(b.x * 2.0 - 1.0, b.y * 2.0 - 1.0);
    col = mix(vec3f(0.8, 0.85, 1.0), vec3f(1.0, 0.9, 0.75), c.x);
    lum = pow(d.x, 8.0) * 0.5;
  }

  var out: Out;
  out.q = corners[vi];
  out.color = col * (0.15 + lum) * cam.gain;
  var clip = vec4f(2.0, 2.0, 0.5, 1.0); // off-screen unless it projects in front of the camera
  if (onScreen) {
    clip = vec4f(ndc, 0.5, 1.0);
  } else {
    let v = rot(cam.tilt, cam.roll) * p;
    let depth = cam.dist - v.z;
    if (depth > 0.05) {
      let aspect = cam.res.x / cam.res.y;
      let s = cam.focal / depth;
      clip = vec4f(v.x * s / aspect + cam.center.x, v.y * s + cam.center.y, 0.5, 1.0);
    }
  }
  let sizePx = mix(1.0, 2.6, sqrt(lum));
  out.position = vec4f(clip.xy + corners[vi] * sizePx * 2.0 / cam.res, clip.z, clip.w);
  return out;
}

@fragment fn fs_main(@location(0) q: vec2f, @location(1) color: vec3f) -> @location(0) vec4f {
  let a = exp(-dot(q, q) * 3.5);
  return vec4f(color * a, 1.0);
}
