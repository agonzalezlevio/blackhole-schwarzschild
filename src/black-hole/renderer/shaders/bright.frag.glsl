// Post-process: brightness threshold for bloom.
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tex;
uniform float uThresh;
uniform float uKnee;
void main(){
  vec3 c = texture(tex, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  float soft = clamp(l - uThresh + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-4);
  float w = max(soft, l - uThresh) / max(l, 1e-4);
  fragColor = vec4(c * max(w, 0.0), 1.0);
}
