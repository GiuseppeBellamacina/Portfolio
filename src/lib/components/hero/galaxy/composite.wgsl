// Combine bloom levels, tone map and convert to display output (colour preserved).
struct Composite {
  params: vec4f,
  space: vec4f,
}

@group(0) @binding(0) var<uniform> composite: Composite;
@group(0) @binding(1) var scene: texture_2d<f32>;
@group(0) @binding(2) var bloomNear: texture_2d<f32>;
@group(0) @binding(3) var bloomMedium: texture_2d<f32>;
@group(0) @binding(4) var bloomFar: texture_2d<f32>;
@group(0) @binding(5) var linearSampler: sampler;

fn aces(x: vec3f) -> vec3f {
  return clamp((x * (2.51 * x + vec3f(0.03))) / (x * (2.43 * x + vec3f(0.59)) + vec3f(0.14)), vec3f(0.0), vec3f(1.0));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let sceneColor = textureSample(scene, linearSampler, uv).rgb;
  let bloom =
    textureSample(bloomNear, linearSampler, uv).rgb * 0.50 +
    textureSample(bloomMedium, linearSampler, uv).rgb * 0.32 +
    textureSample(bloomFar, linearSampler, uv).rgb * 0.18;
  var color = aces((sceneColor + bloom * composite.params.x) * composite.params.y);
  let vignette = 1.0 - smoothstep(0.6, 1.2, length(uv - vec2f(0.5)) * 1.6);
  color *= mix(0.8, 1.0, vignette);
  // the page's own background colour, screened under the galaxy so the canvas blends into the Hero
  let lit = pow(color, vec3f(1.0 / 2.2));
  return vec4f(lit + composite.space.rgb * (vec3f(1.0) - lit), 1.0);
}
