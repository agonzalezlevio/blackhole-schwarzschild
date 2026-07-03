// Black hole with gravitational lensing. Light bending is obtained by
// integrating, per fragment, the null geodesic of the Schwarzschild metric in
// vector form: d2x/dl2 = -3/2 * h^2 * x / r^5  (with r_s = 1), where
// h = |x x v| is the photon's conserved specific angular momentum. This
// reproduces the horizon, the photon ring (r = 1.5 r_s) and the upper/lower
// images of the disk. The accretion disk and star field are procedural; the
// disk is shaded with approximate relativistic Doppler beaming and
// gravitational redshift.
//
// R_S, DISK_IN, DISK_OUT and ESC_R are injected as #defines from the domain
// BlackHole entity (see ThreeRenderer), so this shader has no magic numbers for
// the physics parameters.

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCamPos;
uniform mat3  uCamBasis;   // columns: right, up, forward
uniform float uFovTan;
uniform int   uSteps;
uniform float uDiskGain;
uniform float uDoppler;

#define PI 3.14159265358979

/* --- hashes and noise --- */
float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3){
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++){
    v += a * vnoise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}
/* seamless polar fbm at phi = +/-PI */
float seamFbm(float r, float phi, float fr, float fp){
  float w = (phi + PI) / (2.0 * PI);
  float a = fbm(vec2(r * fr, phi * fp));
  float b = fbm(vec2(r * fr, (phi - 2.0 * PI) * fp));
  return mix(a, b, w);
}

/* --- disk thermal ramp: white-yellow -> orange -> red --- */
vec3 diskRamp(float t){
  vec3 hot  = vec3(1.60, 1.42, 1.15);
  vec3 mid  = vec3(1.45, 0.80, 0.32);
  vec3 cool = vec3(0.85, 0.26, 0.06);
  return t < 0.5 ? mix(hot, mid, t / 0.5) : mix(mid, cool, (t - 0.5) / 0.5);
}

/* --- sample the disk where the ray crosses the y = 0 plane --- */
vec4 diskSample(vec3 hit, vec3 rayDir){
  float r = length(hit.xz);

  // differential Keplerian rotation of the material (omega ~ r^-1.5)
  float ang = uTime * 0.7 * pow(max(r, 1.0) / DISK_IN, -1.5);
  float ca = cos(ang), sa = sin(ang);
  vec2 mp = vec2(ca * hit.x - sa * hit.z, sa * hit.x + ca * hit.z);
  float phi = atan(mp.y, mp.x);

  float streak = seamFbm(r, phi, 1.15, 2.2);   // wide tangential streaks
  float fine   = seamFbm(r, phi, 3.6, 7.5);    // fine turbulence
  float density = smoothstep(0.22, 0.78, streak * 0.72 + fine * 0.38);
  density = 0.18 + 1.25 * density;

  float innerF = smoothstep(DISK_IN, DISK_IN + 0.55, r);
  float outerF = 1.0 - smoothstep(DISK_OUT - 5.0, DISK_OUT, r);
  float em = pow(DISK_IN / r, 2.0);            // radial emissivity

  float bright = uDiskGain * density * innerF * outerF * em * 3.4;

  float t = clamp((r - DISK_IN) / (DISK_OUT - DISK_IN), 0.0, 1.0);
  t = clamp(t + 0.15 * (0.5 - fine), 0.0, 1.0);
  vec3 col = diskRamp(t) * bright;

  // relativistic Doppler beaming: the approaching side is brighter
  vec3 velDir = normalize(vec3(hit.z, 0.0, -hit.x));
  float v = clamp(sqrt(0.5 / max(r, 1.7)), 0.0, 0.72);
  vec3 photonDir = -normalize(rayDir);         // real photon direction (toward camera)
  float dopp = sqrt(1.0 - v * v) / (1.0 - v * dot(velDir, photonDir));
  col *= mix(1.0, pow(dopp, 3.0), uDoppler);
  float shift = clamp((dopp - 1.0) * 1.4, -1.0, 1.0);
  vec3 shiftCol = shift > 0.0 ? vec3(0.84, 0.95, 1.22) : vec3(1.22, 0.92, 0.75);
  col *= mix(vec3(1.0), shiftCol, abs(shift) * uDoppler);

  // gravitational redshift: dims the inner edge
  float gr = sqrt(max(0.0, 1.0 - R_S / max(r, 1.05)));
  col *= mix(1.0, gr, 0.65);

  float alpha = clamp(density * 1.1, 0.0, 1.0) * innerF * outerF;
  alpha = min(alpha, 0.97);
  return vec4(col, alpha);
}

/* --- star field (also lensed: sampled with the bent ray) --- */
vec3 starLayer(vec3 d, float scale, float thresh, float gain){
  vec3 p = d * scale;
  vec3 id = floor(p);
  vec3 f = fract(p) - 0.5;
  float rn = hash13(id);
  vec3 offs = vec3(hash13(id + 7.1), hash13(id + 19.3), hash13(id + 41.7)) - 0.5;
  float dd = length(f - offs * 0.7);
  float dot_ = exp(-dd * dd * 180.0);
  float s = clamp((rn - thresh) / (1.0 - thresh), 0.0, 1.0);
  float I = pow(s, 6.0) * gain;
  vec3 tint = mix(vec3(1.0, 0.82, 0.62), vec3(0.68, 0.80, 1.0), hash13(id + 3.3));
  return dot_ * I * tint;
}
vec3 background(vec3 d){
  vec3 col = vec3(0.0);
  col += starLayer(d, 34.0, 0.965, 8.0);
  col += starLayer(d, 71.0, 0.980, 4.0);
  // faint nebula
  float n = fbm(d.xy * 2.6 + 11.0) * fbm(d.zy * 2.2 - 5.0);
  col += vec3(0.09, 0.11, 0.20) * n * 0.5;
  // tilted galactic band
  vec3 bn = normalize(vec3(0.42, 0.86, -0.28));
  float band = pow(max(0.0, 1.0 - abs(dot(d, bn))), 6.0);
  col += vec3(0.22, 0.18, 0.15) * band * (0.25 + 0.75 * fbm(d.xz * 3.5 + 2.0)) * 0.5;
  return col;
}

void main(){
  vec2 ndc = vUv * 2.0 - 1.0;
  ndc.x *= uRes.x / uRes.y;
  vec3 rd = normalize(uCamBasis * vec3(ndc * uFovTan, 1.0));

  vec3 pos = uCamPos;
  vec3 dir = rd;
  vec3 hv = cross(pos, dir);
  float h2 = dot(hv, hv);            // h^2 is conserved along the geodesic

  float jit = hash12(gl_FragCoord.xy);
  vec3 col = vec3(0.0);
  float T = 1.0;                     // transmittance
  bool ended = false;

  for (int i = 0; i < 260; i++){
    if (i >= uSteps) break;

    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    float dt = clamp(0.17 * (r - 0.7), 0.028, 1.25);
    if (i == 0) dt *= 0.4 + 0.6 * jit;   // initial jitter: breaks up banding

    // Schwarzschild null geodesic (vector form, r_s = 1)
    vec3 acc = (-1.5 * h2 / (r2 * r2 * r)) * pos;
    dir += acc * dt;
    vec3 prev = pos;
    pos += dir * dt;

    float nr2 = dot(pos, pos);
    if (nr2 < R_S * R_S){ ended = true; break; }   // captured by the horizon

    // disk-plane crossing (y = 0): exact intersection by interpolation
    if (prev.y * pos.y < 0.0){
      float fdt = prev.y / (prev.y - pos.y);
      vec3 hit = mix(prev, pos, fdt);
      float hr = length(hit.xz);
      if (hr > DISK_IN && hr < DISK_OUT){
        vec4 dc = diskSample(hit, dir);
        col += T * dc.rgb;
        T *= 1.0 - dc.a;
        if (T < 0.02){ ended = true; break; }
      }
    }

    // warm volumetric halo above and below the disk
    float hr2 = dot(pos.xz, pos.xz);
    if (hr2 > 4.0 && hr2 < 260.0){
      float hz = exp(-pos.y * pos.y * 6.0);
      float rad = exp(-(sqrt(hr2) - DISK_IN) * 0.35);
      col += T * vec3(1.2, 0.55, 0.2) * hz * rad * dt * 0.02 * uDiskGain;
    }

    // escape: the ray moves away, sample the sky with the already-bent direction
    if (nr2 > ESC_R * ESC_R && dot(pos, dir) > 0.0){
      col += T * background(normalize(dir));
      ended = true; break;
    }
  }

  if (!ended){
    float r = length(pos);
    col += T * background(normalize(dir)) * smoothstep(1.6, 4.0, r);
  }

  fragColor = vec4(col, 1.0);
}
