#ifdef GL_ES
precision highp float;
#endif

#define RES iResolution

uniform vec3  iResolution;
uniform vec4  iMouse;
uniform sampler2D iChannel0;

// smooth min
float smin(float d1, float d2, float k) {
  float h = max(k - abs(d1 - d2), 0.0) / k;
  return min(d1, d2) - h * h * k * 0.25;
}

vec2 mouse;         // XY mouse
vec3 g;             // dominio distorto
float d0 = 1.0;

float map(vec3 p) {
  // Converte le coordinate del mouse da pixel a coordinate normalizzate
  mouse = (iMouse.xy - RES.xy * 0.5) / RES.y;

  // Applica una distorsione basata sulla posizione del mouse
  // Questa è la riga che crea l'effetto "pizzicotto"
  p.xy -= p.z * mouse.xy;

  g = p;

  float plane = p.z;

  p.z -= 1.0;
  // Il cono ora parte dalla posizione del mouse
  float cone = length(p.xy - mouse) + p.z / 10.0;

  p.z *= 3.0;
  float result = smin(plane, cone, 0.5);

  return result / sqrt(3.0);
}

float raymarch(inout vec3 p, vec3 rd) {
  float dd = 0.0;
  for (int i = 0; i < 100; i++) {
    float d = map(p);
    if (d < 1e-4 || dd > d0) break;
    p += rd * d;
    dd += d;
  }
  return dd;
}

vec3 render(vec3 p, vec3 rd) {
  float d = raymarch(p, rd);
  // evita schiacciamento per aspect ratio
  g /= RES.x / RES.y;

  // sample foto
  vec3 col = texture2D(iChannel0, g.xy + 0.5).rgb;
  return col;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = (fragCoord - iResolution.xy * 0.5) / iResolution.y;

  // camera ortografica
  vec3 ro = vec3(uv.x, uv.y, d0);
  vec3 rd = vec3(0.0, 0.0, -1.0);

  vec3 col = render(ro, rd);
  gl_FragColor = vec4(col, 1.0);
}
