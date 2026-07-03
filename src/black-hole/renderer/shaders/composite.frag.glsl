// Post-process: composite, ACES tone mapping, vignette and grain.
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tScene;
uniform sampler2D tBloomA;
uniform sampler2D tBloomB;
uniform float uBloom;
uniform float uExpo;
uniform float uRTime;
float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main(){
  vec3 c = texture(tScene, vUv).rgb;
  vec3 b = texture(tBloomA, vUv).rgb * 0.6 + texture(tBloomB, vUv).rgb * 0.9;
  c += b * uBloom;
  c *= uExpo;
  // ACES tone mapping (Narkowicz approx.)
  c = clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0);
  // vignette
  vec2 q = vUv * 2.0 - 1.0;
  c *= 1.0 - 0.26 * dot(q * 0.72, q * 0.72);
  // subtle grain
  float g = hash12(gl_FragCoord.xy + fract(uRTime) * vec2(157.0, 113.0)) - 0.5;
  c += g * 0.012;
  c = pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
  fragColor = vec4(c, 1.0);
}
