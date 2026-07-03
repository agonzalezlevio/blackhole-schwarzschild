// Post-process: separable Gaussian blur.
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tex;
uniform vec2 uDir;   // direction * texel size
void main(){
  float w[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
  vec3 c = texture(tex, vUv).rgb * w[0];
  for (int i = 1; i < 5; i++){
    vec2 o = uDir * float(i);
    c += texture(tex, vUv + o).rgb * w[i];
    c += texture(tex, vUv - o).rgb * w[i];
  }
  fragColor = vec4(c, 1.0);
}
