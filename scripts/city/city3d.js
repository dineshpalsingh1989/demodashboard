/* The map is 3D. This file draws the whole map: city, airport, Metro Loop, ferry, highway, small town, village, farms and utilities.
   three.js r128 loads from a CDN when the page opens. If it cannot load (offline), the map falls back to the 2D canvas.
   Building interiors and walk mode still use the 2D canvas.
   Buildings share the 2D layout: most of the 3D scene is captured from the same draw functions. While capturing,
   P() returns world coordinates, so every drawBox, cylinder and line call becomes a 3D box, tank or pole.
   Buildings and scenery are captured once; people and equipment every frame. Native transport models
   in city3d-details.js use the same traffic, flight and ferry simulation clocks.
   The ground (roads, markings, runway, river, fields) is baked from the 2D ground drawing into one texture.
   Loaded last, after every other script. */

window.City3D = (() => {
  const LIBS = ['https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'];
  const CUSTOM = new Set(['tree', 'lamp', 'tlight', 'turbine', 'rsign', 'fsign', 'psign', 'busstop']);   // built by hand, or text only
  const MOVING = new Set(['wtruck', 'barrier', 'abarrier', 'pspace', 'lot', 'mscp', 'train', 'pivot', 'tractor', 'btractor', 'ftruck', 'farmer', 'diner']);
  const CAP_SC = 30;   // 2D scale used while capturing: full detail, and line widths in px map to pole radii
  let on = false, ready = false, loading = null, failed = false, booting = true, scenic = false;
  const mark = n => performance.mark('3d:' + n);   // read by tools/check-performance.cjs
  const breathe = () => new Promise(r => setTimeout(r, 0));   // let the page paint between build steps, so opening never freezes
  let R, scn, camera, ctl, canvas, hemi, sun, ground, rain, staticBoxes, alphaBoxes, dynBoxes, dynCyl, dynSph, tlLights = [], blades = [], devSprites = [], lampGlow, roofMesh;
  let boxMat, details, staticZones = [], alphaZones = [], dynZones = [], roofZones = [], treeZone = [], treeMeshes = [];
  const seen = { tx: NaN, ty: NaN, tz: NaN }, anim = { t: 1, from: null, to: null, d0: 0, d1: 0 };

  // ---------- loading ----------
  const loadScript = src => new Promise((ok, bad) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => bad(new Error('Could not load ' + src)); document.head.appendChild(s); });
  let libsP = null;
  const libs = () => libsP || (libsP = (window.THREE ? Promise.resolve() : LIBS.reduce((p, u) => p.then(() => loadScript(u)), Promise.resolve())).then(() => mark('lib')));
  function ensure() {
    if (ready) return Promise.resolve();
    if (!loading) loading = libs().then(() => new Promise(r => requestAnimationFrame(r))).then(init);
    return loading;
  }
  function toggle(force) {
    const want = force ?? !on;
    if (!want) { on = false; sync(); return Promise.resolve(); }
    return ensure().then(() => { on = true; }).catch(e => { failed = true; loading = null; console.warn(e.message); tipFlash('The 3D map needs an internet connection · showing the 2D map'); })
      .finally(() => { booting = false; document.body.classList.remove('boot3d'); sync(); });
  }
  function sync() {
    document.body.classList.toggle('view3d', on);
    if (canvas) canvas.style.display = active() ? 'block' : 'none';
  }
  const scenicButton = document.getElementById('bScenic');
  function setScenic(value) {
    scenic = !!value;
    document.body.classList.toggle('scenic-view', scenic);
    scenicButton.setAttribute('aria-pressed', String(scenic));
    scenicButton.title = scenic ? 'Return to the device map' : 'Hide map overlays to explore the city';
    if (scenic) { closePanel(); tip.style.opacity = 0; }
  }
  scenicButton.addEventListener('click', () => setScenic(!scenic));
  document.getElementById('bDev').addEventListener('click', () => { if (scenic) { setScenic(false); setDevLayer(true); } });
  document.getElementById('bFlow').addEventListener('click', () => { if (scenic) setScenic(false); });
  const active = () => on && ready && !WALK.on && (scene === 'city' || (scene === 'inside' && !!curInt));
  function tipFlash(t) { tip.textContent = t; tip.style.left = innerWidth / 2 + 'px'; tip.style.top = '90px'; tip.style.opacity = 1; setTimeout(() => { tip.style.opacity = 0; }, 2500); }

  // ---------- capturing the 2D draw calls ----------
  let rec = null, recZone = null, over = false;
  const ORIG = {};
  const NAMES = ['P', 'drawBox', 'cylinder', 'line', 'poly', 'glow', 'pill', 'drawPed', 'drawHouse', 'drawTree', 'drawHead'];
  const STUB = {
    P: (x, y, z) => [x, y, z],
    drawBox(o) { rec.b.push({ x0: o.x0, y0: o.y0, x1: o.x1, y1: o.y1, z0: o.z0 || 0, h: o.h, color: o.color, roof: o.roof, stripe: o.stripe, win: o.win, alpha: o.alpha, zone: recZone }); if (o.kids) o.kids.forEach(STUB.drawBox); },
    cylinder(x, y, z0, z1, r, color) { rec.c.push({ x, y, z0, z1, r, color, zone: recZone }); return [x, y, z1]; },
    line(a, b, color, w) { if (a && b && a.length === 3 && b.length === 3 && isFinite(a[0] + a[1] + a[2] + b[0] + b[1] + b[2])) rec.l.push({ a, b, color, w, zone: recZone }); },
    poly() {}, glow() {}, pill() {},
    drawPed(p) {
      const x = p.x + (p.ox || 0), y = p.y + (p.oy || 0), bob = p.moving ? Math.abs(Math.sin(time * 9 + p.ph)) * .025 : 0;
      const detailed = camera && (x-camera.position.x)**2 + (y-camera.position.z)**2 + camera.position.y**2 < 1600;
      const humanScale = scene === 'city' ? .56 : 1, base = scene === 'city' && !p.crossing ? .026 : 0;
      STUB.drawBox({ x0: x - .065*humanScale, x1: x + .065*humanScale, y0: y - .045*humanScale, y1: y + .045*humanScale, z0: ((detailed ? .19 : 0) + bob)*humanScale+base, h: (detailed ? .19 : .38)*humanScale, color: p.col });
      const stride = p.moving ? Math.sin(time * 8 + p.ph) * .075 : 0;
      if (detailed) for (const s of [-1, 1]) {
        STUB.line([x + s * .035*humanScale, y, (.21 + bob)*humanScale+base], [x + s * .035*humanScale, y + s * stride*humanScale, .035*humanScale+base], '#344452', 1.8*humanScale);
        STUB.line([x + s * .075*humanScale, y, (.34 + bob)*humanScale+base], [x + s * .085*humanScale, y - s * stride*humanScale, (.20 + bob)*humanScale+base], p.skin, 1.5*humanScale);
      }
      rec.s.push({ x, y, z: (.46 + bob)*humanScale+base, r: .07*humanScale, color: p.skin, zone: recZone });
    },
    drawHouse(o) {
      STUB.drawBox({ x0: o.x0, y0: o.y0, x1: o.x1, y1: o.y1, h: o.h, color: o.wall, roof: o.wall, win: o.nowin ? null : 'grid' });
      rec.r.push({ x0: o.x0, y0: o.y0, x1: o.x1, y1: o.y1, z: o.h, rh: o.rh, color: o.roof, wall: o.wall, solar: o.solar, zone: recZone });
    },
    drawTree() {},
    drawHead(x, y, z, skin) { rec.s.push({ x, y, z, r: .14, color: skin, zone: recZone }); }
  };
  function capture(list, draw = drawObj) {
    const out = { b: [], c: [], l: [], s: [], r: [] }, keep = { sc, night };
    NAMES.forEach(n => { ORIG[n] = window[n]; window[n] = STUB[n]; });
    rec = out; sc = CAP_SC; night = 0;
    try {
      for (const o of list) {
        if (o.hide && o.hide()) continue;
        recZone = o.room || o.zone || null;
        try { draw(o, new Path2D()); } catch (e) { /* a draw that needs real screen space; skip it */ }
      }
    } finally { NAMES.forEach(n => { window[n] = ORIG[n]; }); sc = keep.sc; night = keep.night; rec = null; }
    return out;
  }
  function entities() {   // the same moving things the 2D frame draws
    const list = [];
    peds.forEach(p => list.push({ t: 'ped', p }));
    COWS.forEach(c => list.push({ t: 'cow', c, zone: 'barn' }));
    const more = []; airportEntities(more); more.forEach(e => { if (!['vcar', 'rcar', 'abus', 'plane', 'ferry'].includes(e.o.t)) list.push(e.o); });   // native transport models are updated separately
    if (FX.amb) list.push({ t: 'amb', zone: 'health' });
    return list;
  }

  // ---------- colours ----------
  const colCache = {};
  function C3(s) {
    if (!s) return C3('#9aa5ae');
    if (colCache[s]) return colCache[s];
    const c = new THREE.Color(), m = /rgba?\(([^)]+)\)/.exec(s);
    if (m) { const [r, g, b] = m[1].split(',').map(Number); c.setRGB(r / 255, g / 255, b / 255); } else c.set(s.length > 7 ? s.slice(0, 7) : s);
    return colCache[s] = c.convertSRGBToLinear();   // the renderer outputs sRGB, so all material colours live in linear space
  }

  // ---------- box material: roof colour, stripe and windows drawn in the shader ----------
  const night3 = { value: 0 };
  const surfaceTime = { value: 0 }, surfaceRain = { value: 0 };
  function makeBoxMat(opts = {}) {
    const m = new THREE.MeshPhongMaterial({ shininess: 36, specular: C3('#8395a4'), ...opts });
    m.onBeforeCompile = sh => {
      sh.uniforms.uNight = night3;
      sh.vertexShader = 'attribute vec3 aRoof; attribute vec4 aStripe; attribute float aWin; attribute vec2 aZ;\nvarying vec3 vRoof; varying vec4 vStripe; varying float vWin; varying vec2 vZ; varying vec3 vWP; varying vec3 vWN;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          vRoof = aRoof; vStripe = aStripe; vWin = aWin; vZ = aZ;
          vWP = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
          vWN = normalize((modelMatrix * instanceMatrix * vec4(normal, 0.0)).xyz);`);
      sh.fragmentShader = 'uniform float uNight;\nvarying vec3 vRoof; varying vec4 vStripe; varying float vWin; varying vec2 vZ; varying vec3 vWP; varying vec3 vWN;\nfloat h21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n' +
        sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
          float winLit = 0.0, glazing = 0.0;
          float side = 1.0 - step(0.5, abs(vWN.y));
          diffuseColor.rgb = mix(diffuseColor.rgb, vRoof, step(0.5, vWN.y));
          float hv = (vWP.y - vZ.x) / max(vZ.y, 0.001);
          // Fine mineral variation and a shaded plinth keep walls from looking like plastic.
          float grain = h21(floor(vWP.xz * 65.0) + floor(vWP.y * 65.0));
          diffuseColor.rgb *= 0.97 + grain * 0.06;
          if (vWin > 0.5) diffuseColor.rgb *= mix(0.76, 1.0, smoothstep(0.0, 0.28, vWP.y - vZ.x));
          if (vStripe.a > 0.5 && side > 0.5 && hv > 0.35 && hv < 0.6) diffuseColor.rgb = vStripe.rgb;
          if (vWin > 0.5 && side > 0.5 && vZ.y > 0.3) {
            vec2 t = normalize(vec2(-vWN.z, vWN.x));
            float u = dot(vWP.xz, t), v = vWP.y - vZ.x;
            vec2 cell = vWin < 1.5 ? vec2(0.5, 0.55) : vWin < 2.5 ? vec2(0.5, 0.42) : vec2(0.3, 0.3);
            vec2 f = fract(vec2(u, v) / cell);
            float inside = step(0.12, v) * step(v, vZ.y - 0.12);
            float w = vWin > 1.5 && vWin < 2.5 ? step(0.22, f.y) * step(f.y, 0.78) : step(0.22, f.x) * step(f.x, 0.78) * step(0.25, f.y) * step(f.y, 0.78);
            w *= inside;
            glazing = w;
            vec3 eye = normalize(cameraPosition - vWP);
            float fresnel = pow(1.0 - abs(dot(eye, normalize(vWN))), 3.0);
            float pane = h21(floor(vec2(u, v) / cell));
            float reflection = smoothstep(0.25, 0.85, hv + sin(u * 0.32) * 0.12);
            vec3 glass = mix(vec3(0.025, 0.063, 0.085), vec3(0.22, 0.35, 0.43), reflection * 0.65 + fresnel * 0.35);
            glass *= 0.85 + pane * 0.3;
            diffuseColor.rgb = mix(diffuseColor.rgb, glass * (1.0 - uNight * 0.78), w);
            // Thin floor reveals and window sills read at street scale.
            float reveal = (1.0 - smoothstep(0.025, 0.075, f.y)) * inside;
            diffuseColor.rgb *= 1.0 - reveal * 0.13;
            winLit = w * step(0.38, h21(floor(vec2(u, v) / cell) + floor(vWP.xz * 0.37)));
          }`).replace('#include <specularmap_fragment>', `#include <specularmap_fragment>
          specularStrength = mix(0.035, 0.85, glazing);`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += winLit * uNight * vec3(1.0, 0.66, 0.29) * 0.85;`);
    };
    return m;
  }

  // Procedural finishes add no downloads and reuse the existing ground artwork and markings.
  function groundMaterial(map) {
    const mat = new THREE.MeshLambertMaterial({ map, alphaTest: .5 });
    mat.onBeforeCompile = sh => {
      sh.vertexShader = 'varying vec3 vSurface;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurface = (modelMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = `varying vec3 vSurface;
        float grainHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float groundNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(grainHash(i), grainHash(i + vec2(1,0)), f.x), mix(grainHash(i + vec2(0,1)), grainHash(i + vec2(1,1)), f.x), f.y); }
        ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
          vec3 base = diffuseColor.rgb;
          float grass = step(base.r * 1.13, base.g) * step(base.b * 1.2, base.g);
          float detail = groundNoise(vSurface.xz * 34.0);
          float patches = groundNoise(vSurface.xz * 1.1);
          float farFade = 1.0 - smoothstep(45.0, 150.0, distance(cameraPosition, vSurface));
          diffuseColor.rgb *= 0.95 + (detail - 0.5) * 0.14 * farFade;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.73, 0.82, 0.65) * (0.87 + patches * 0.26), grass);
        `);
    };
    return mat;
  }

  function waterMaterial() {
    const mat = new THREE.MeshPhongMaterial({ color: C3('#247f91'), specular: C3('#d8f4ef'), shininess: 110 });
    mat.onBeforeCompile = sh => {
      sh.uniforms.uWaterTime = surfaceTime; sh.uniforms.uRain = surfaceRain; sh.uniforms.uNight = night3;
      sh.vertexShader = 'varying vec3 vWater;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWater = (modelMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = 'varying vec3 vWater; uniform float uWaterTime; uniform float uRain; uniform float uNight;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
          float waterDetail = 1.0 - smoothstep(60.0, 260.0, distance(cameraPosition, vWater));
          float waves = sin(vWater.x * 2.8 + vWater.z * 1.6 + uWaterTime * 0.9 + sin(vWater.z * 0.43)) * sin(vWater.z * 3.7 - uWaterTime * 0.6);
          float swell = sin(vWater.z * 1.35 + vWater.x * .28 + uWaterTime * 1.3 + sin(vWater.x * .32) * .45);
          vec3 eye = normalize(cameraPosition - vWater);
          float fresnel = pow(1.0 - max(eye.y, 0.0), 3.0);
          diffuseColor.rgb = mix(diffuseColor.rgb * (0.96 + (waves * .07 + swell * .16) * waterDetail), vec3(0.30, 0.46, 0.52), fresnel * 0.65);
          diffuseColor.rgb *= (1.0 - uRain * 0.22);
        `)
        .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
          float ripple = (0.045 + uRain * 0.04) * waterDetail;
          vec3 waveNormal = normalize(vec3(cos(vWater.x * 2.8 + vWater.z * 1.6 + uWaterTime * 0.9 + sin(vWater.z * 0.43)) * ripple, 1.0, (sin(vWater.z * 3.7 - uWaterTime * 0.6) + cos(vWater.z * 1.35 + vWater.x * .28 + uWaterTime * 1.3) * 1.8) * ripple));
          normal = normalize(mat3(viewMatrix) * waveNormal);
        `);
    };
    return mat;
  }
  const unitBox = () => new THREE.BoxGeometry(1, 1, 1);
  function boxMesh(n, mat) {
    const g = unitBox();
    g.setAttribute('aRoof', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aStripe', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
    g.setAttribute('aWin', new THREE.InstancedBufferAttribute(new Float32Array(n), 1));
    g.setAttribute('aZ', new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2));
    const m = new THREE.InstancedMesh(g, mat, n);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
    return m;
  }
  let M4, Q, V, SV, UP, ray, mouse, DAY, NIGHT, STORM, bg, HEMI_D, HEMI_N;   // three.js objects, made in init()
  const WIN = { grid: 1, bands: 2, server: 3 };
  function fillBoxes(mesh, boxes, zones) {
    const g = mesh.geometry, roof = g.attributes.aRoof.array, st = g.attributes.aStripe.array, win = g.attributes.aWin.array, az = g.attributes.aZ.array, ic = mesh.instanceColor.array;
    const n = Math.min(boxes.length, mesh.instanceMatrix.count);
    for (let i = 0; i < n; i++) {
      const b = boxes[i], w = Math.max(.01, b.x1 - b.x0), d = Math.max(.01, b.y1 - b.y0), h = Math.max(.01, b.h);
      V.set((b.x0 + b.x1) / 2, b.z0 + h / 2, (b.y0 + b.y1) / 2); SV.set(w, h, d); Q.identity();
      mesh.setMatrixAt(i, M4.compose(V, Q, SV));
      const c = C3(b.color), r = b.roof ? C3(b.roof) : c, s = b.stripe ? C3(b.stripe) : null;
      ic[i * 3] = c.r; ic[i * 3 + 1] = c.g; ic[i * 3 + 2] = c.b;
      roof[i * 3] = r.r * 1.04; roof[i * 3 + 1] = r.g * 1.04; roof[i * 3 + 2] = r.b * 1.04;
      if (s) { st[i * 4] = s.r; st[i * 4 + 1] = s.g; st[i * 4 + 2] = s.b; st[i * 4 + 3] = 1; } else st[i * 4 + 3] = 0;
      win[i] = WIN[b.win] || 0; az[i * 2] = b.z0; az[i * 2 + 1] = h;
      if (zones) zones[i] = b.zone;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true;
    ['aRoof', 'aStripe', 'aWin', 'aZ'].forEach(k => { g.attributes[k].needsUpdate = true; });
    if (zones) zones.length = n;
  }
  // tanks, silos and poles: oriented cylinders
  function fillCyl(mesh, cyls, lines) {
    let i = 0; const ic = mesh.instanceColor.array, max = mesh.instanceMatrix.count;
    for (const c of cyls) { if (i >= max) break; V.set(c.x, (c.z0 + c.z1) / 2, c.y); SV.set(c.r, Math.max(.01, c.z1 - c.z0), c.r); Q.identity(); mesh.setMatrixAt(i, M4.compose(V, Q, SV)); const k = C3(c.color); ic[i * 3] = k.r; ic[i * 3 + 1] = k.g; ic[i * 3 + 2] = k.b; i++; }
    for (const l of lines) {
      if (i >= max) break;
      const a = new THREE.Vector3(l.a[0], l.a[2], l.a[1]), b = new THREE.Vector3(l.b[0], l.b[2], l.b[1]), len = a.distanceTo(b);
      if (len < .02) continue;
      const r = Math.min(.09, Math.max(.014, (l.w || 1.5) / CAP_SC / 2));
      V.addVectors(a, b).multiplyScalar(.5); Q.setFromUnitVectors(UP, b.sub(a).normalize()); SV.set(r, len, r);
      mesh.setMatrixAt(i, M4.compose(V, Q, SV)); const k = C3(l.color); ic[i * 3] = k.r; ic[i * 3 + 1] = k.g; ic[i * 3 + 2] = k.b; i++;
    }
    mesh.count = i; mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true;
  }
  function fillSph(mesh, list) {
    let i = 0; const ic = mesh.instanceColor.array, max = mesh.instanceMatrix.count;
    for (const s of list) { if (i >= max) break; V.set(s.x, s.z, s.y); SV.setScalar(s.r); Q.identity(); mesh.setMatrixAt(i, M4.compose(V, Q, SV)); const k = C3(s.color); ic[i * 3] = k.r; ic[i * 3 + 1] = k.g; ic[i * 3 + 2] = k.b; i++; }
    mesh.count = i; mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true;
  }
  function inst(geo, mat, n, shadow = true) {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, n) * 3).fill(1), 3);
    m.castShadow = shadow; m.receiveShadow = true; m.frustumCulled = false; m.count = 0; scn.add(m); return m;
  }

  // ---------- ground: bake the 2D ground drawing into a texture ----------
  function bakeGround() {
    // pass 1: find the land slabs (every ground slab is a box with z0 -0.7)
    const slabs = [], save = { W, H, S, C, sc, night, sel, hoverZone, cam: Object.assign({}, cam) };
    const origBox = drawBox;
    drawBox = function (o, path) { if (o.z0 === -.7) { slabs.push(o); return poly(quad(o.x0, o.y0, o.x1, o.y1, 0), col(o.roof || o.color), null, path); } return origBox(o, path); };
    try {
      S = 0; C = 1; night = 0; sel = null; hoverZone = null; cam.offX = 0; cam.offY = 0;
      sc = 1; cam.x = 0; cam.y = 0; W = 100; H = 100; hits = [];
      try { drawGround(); } catch (e) { /* bounds only */ }
      const bx0 = Math.min(...slabs.map(s => s.x0)) - 1, bx1 = Math.max(...slabs.map(s => s.x1)) + 1, by0 = Math.min(...slabs.map(s => s.y0)) - 1, by1 = Math.max(...slabs.map(s => s.y1)) + 1;
      const wU = bx1 - bx0, hU = by1 - by0, px = Math.max(6, Math.min(18, Math.floor(Math.min(R.capabilities.maxTextureSize, 8192) / Math.max(wU, hU))));
      const tw = Math.ceil(wU * px), th = Math.ceil(hU * px);
      // pass 2: draw with a top-down camera; scale(1, 1/TILT) undoes the 2D tilt
      slabs.length = 0;
      cam.x = (bx0 + bx1) / 2; cam.y = (by0 + by1) / 2; sc = px; W = tw; H = th * TILT;
      cv.width = tw; cv.height = th;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, tw, th); ctx.setTransform(1, 0, 0, 1 / TILT, 0, 0);
      hits = [];
      drawGround();
      const tex = document.createElement('canvas'); tex.width = tw; tex.height = th; tex.getContext('2d').drawImage(cv, 0, 0);
      return { tex, x0: bx0, y0: by0, w: wU, h: hU, slabs: slabs.slice() };
    } finally {
      drawBox = origBox;
      ({ W, H, S, C, sc, night, sel, hoverZone } = save); Object.assign(cam, save.cam);
      hits = []; resize();
    }
  }

  // compile shaders one material at a time, with a pause between, so opening never freezes the page.
  // A scratch scene with copies of the same lights and fog gives the same shader keys, so the real frame reuses them.
  async function compileGradually(renderer, root, camera, lights, fog, pause) {
    // one material per shader variant is enough: the rest reuse the compiled program
  const key = (m, o) => [m.type, !!m.map, m.vertexColors, m.transparent, m.alphaTest > 0, m.side, !!o.isInstancedMesh, !!o.instanceColor, !!m.onBeforeCompile && m.onBeforeCompile.toString().length].join();
  const seen = new Map(); root.traverse(o => { const m = o.material; if (m && !Array.isArray(m) && !seen.has(key(m, o))) seen.set(key(m, o), o); });
    for (const o of seen.values()) {
    const mat = o.material;
      const tmp = new THREE.Scene(); tmp.fog = fog; lights.forEach(l => tmp.add(l.clone()));
      tmp.add(o.isInstancedMesh ? new THREE.InstancedMesh(o.geometry, mat, 1) : o.isSprite ? new THREE.Sprite(mat) : o.isPoints ? new THREE.Points(o.geometry, mat) : o.isLineSegments ? new THREE.LineSegments(o.geometry, mat) : new THREE.Mesh(o.geometry, mat));
      renderer.compile(tmp, camera); await pause();
    }
    renderer.compile(root.isScene ? root : root.parent, camera);   // the rest, now all cache hits
  }

  // ---------- build the scene ----------
  async function init() {
    if (!window.THREE || !THREE.OrbitControls) throw new Error('three.js did not load');
    mark('init');
    M4 = new THREE.Matrix4(); Q = new THREE.Quaternion(); V = new THREE.Vector3(); SV = new THREE.Vector3(); UP = new THREE.Vector3(0, 1, 0);
    ray = new THREE.Raycaster(); mouse = new THREE.Vector2();
    DAY = new THREE.Color(0xbfdcf0); NIGHT = new THREE.Color(0x0b1424); STORM = new THREE.Color(0x5b6878); bg = new THREE.Color();   // sky colours stay sRGB: the clear colour is not encoded
    HEMI_D = new THREE.Color(0xdfefff).convertSRGBToLinear(); HEMI_N = new THREE.Color(0x9fb4ff).convertSRGBToLinear();
    canvas = document.createElement('canvas'); canvas.id = 'city3d'; canvas.setAttribute('aria-label', '3D city map. Drag to move, Shift-drag or right-drag to rotate, scroll to zoom, click a building or device for details.');
    canvas.style.display = 'none'; cv.after(canvas);
    R = new THREE.WebGLRenderer({ canvas, antialias: true });
    R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    R.outputEncoding = THREE.sRGBEncoding;   // gamma-correct lighting: colours are converted to linear (C3), lit, and encoded back
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = true;
    scn = new THREE.Scene(); scn.fog = new THREE.Fog(0xbfd8ea, 160, 420);
    details = CityDetails(THREE, scn, C3);
    camera = new THREE.PerspectiveCamera(40, 1, .3, 900);
    ctl = new THREE.OrbitControls(camera, canvas);
    Object.assign(ctl, { enableDamping: true, dampingFactor: .09, screenSpacePanning: false, maxPolarAngle: 1.42, minDistance: 2.5, maxDistance: 300, autoRotateSpeed: .35 });
    ctl.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };   // like the 2D map: drag moves, Shift-drag rotates
    ctl.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    ctl.addEventListener('start', () => { anim.t = 1; rotPauseUntil = performance.now() + 4000; });

    hemi = new THREE.HemisphereLight(C3('#dfefff'), C3('#6b6250'), .62); scn.add(hemi);
    sun = new THREE.DirectionalLight(C3('#fff1d6'), 1.3); sun.castShadow = true; scn.add(sun); scn.add(sun.target);

    // ground texture and land slabs
    const gb = bakeGround();
    mark('bake'); await breathe();
    const gtex = new THREE.CanvasTexture(gb.tex); gtex.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy()); gtex.encoding = THREE.sRGBEncoding;
    ground = new THREE.Mesh(new THREE.PlaneGeometry(gb.w, gb.h), groundMaterial(gtex));
    ground.rotation.x = -Math.PI / 2; ground.position.set(gb.x0 + gb.w / 2, 0, gb.y0 + gb.h / 2); ground.receiveShadow = true; scn.add(ground);
    const waterMat = waterMaterial();
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), waterMat);
    sea.rotation.x = -Math.PI / 2; sea.position.set(gb.x0 + gb.w / 2, -.72, gb.y0 + gb.h / 2); sea.receiveShadow = true; scn.add(sea);
    // Continuous water under the new raised bridge hides the old baked road crossing.
    if (typeof RIVER !== 'undefined' && typeof HWY !== 'undefined') {
      for (const [y0, y1] of [[RIVER.y0, RIVER.y1]]) {
        if (y1 <= y0) continue;
        const water = new THREE.Mesh(new THREE.PlaneGeometry(RIVER.x1 - RIVER.x0, y1 - y0), waterMat);
        water.rotation.x = -Math.PI / 2; water.position.set((RIVER.x0 + RIVER.x1) / 2, .018, (y0 + y1) / 2);
        water.receiveShadow = true; scn.add(water);
      }
    }
    const slabMat = new THREE.MeshLambertMaterial({ color: C3('#dfe5ea') });
    gb.slabs.forEach(s => { const m = new THREE.Mesh(new THREE.BoxGeometry(s.x1 - s.x0, .7, s.y1 - s.y0), slabMat); m.position.set((s.x0 + s.x1) / 2, -.36, (s.y0 + s.y1) / 2); m.receiveShadow = true; scn.add(m); });
    const mid = new THREE.Vector3(gb.x0 + gb.w / 2, 0, gb.y0 + gb.h / 2), span = Math.max(gb.w, gb.h) * .62;
    sun.position.set(mid.x - 60, 120, mid.z - 40); sun.target.position.copy(mid);
    Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 20, far: 400 }); sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0008; sun.shadow.normalBias = .02;

    await breathe();
    // static scenery captured from the 2D draw functions
    boxMat = makeBoxMat();
    const statics = objs.filter(o => !CUSTOM.has(o.t) && !MOVING.has(o.t) && !o.hide &&
      !(o.zone === 'warehouse' && o.y0 >= 44.35 && o.y1 <= 45.85 && o.x1 - o.x0 < .6 && o.h <= .55) &&
      !(o.zone === 'aircarpark' && o.h === .2 && o.x1-o.x0 < .65 && o.y1-o.y0 < .35));
    const st = { b: [], c: [], l: [], s: [], r: [] };
    for (let i = 0; i < statics.length; i += 250) { const part = capture(statics.slice(i, i + 250)); for (const k in st) st[k].push(...part[k]); await breathe(); }
    // Gantries and roadside equipment follow the same road elevation as vehicles.
    st.b.forEach(b => { const y = (b.y0 + b.y1) / 2; if (b.zone === 'highway' && y >= HWY.y0 && y <= HWY.y1) b.z0 += details.roadHeight((b.x0 + b.x1) / 2); });
    objs.filter(o => o.t === 'cctv' || o.t === 'sensor').forEach(o => st.b.push({ x0: o.cx - .13, x1: o.cx + .13, y0: o.cy - .1, y1: o.cy + .1, z0: 1.25, h: .16, color: o.t === 'cctv' ? '#e9edf1' : '#ffffff', zone: o.zone }));
    const solid = st.b.filter(b => !(b.alpha < 1)), clear = st.b.filter(b => b.alpha < 1);
    buildArchitecture(solid, st.r);
    staticBoxes = boxMesh(solid.length, boxMat); fillBoxes(staticBoxes, solid, staticZones); scn.add(staticBoxes);
    alphaBoxes = boxMesh(Math.max(1, clear.length), makeBoxMat({ transparent: true, opacity: .45, depthWrite: false })); fillBoxes(alphaBoxes, clear, alphaZones); alphaBoxes.castShadow = false; scn.add(alphaBoxes);
    const cylMat = new THREE.MeshLambertMaterial();
    const statCyl = inst(new THREE.CylinderGeometry(1, 1, 1, 18), cylMat, st.c.length + st.l.length); fillCyl(statCyl, st.c, st.l);
    const sphMat = new THREE.MeshLambertMaterial();
    const statSph = inst(new THREE.SphereGeometry(1, 10, 8), sphMat, st.s.length); fillSph(statSph, st.s);
    mark('scenery'); await breathe();
    buildRoofs(st.r);
    buildTrees();
    buildStreetFurniture();
    details.environment(gb); await breathe();
    buildLabels();
    buildDevices();
    await breathe(); await buildConnections(); await breathe(); buildFlow(); await buildPins(); buildVehicles();

    // moving things, refilled every frame
    dynBoxes = boxMesh(6000, boxMat); scn.add(dynBoxes);
    dynCyl = inst(new THREE.CylinderGeometry(1, 1, 1, 12), cylMat, 800);
    dynSph = inst(new THREE.SphereGeometry(1, 8, 6), sphMat, 800);
    buildRain();

    // picking and hover
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; RIDE = false; document.body.classList.remove('riding'); FX.follow = null; });
    canvas.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
      down = null;
      const z = pick3(e.clientX, e.clientY);
      rotHold = z ? true : !rotHold;
      if (!z) return;
      if (z.startsWith('dev:')) showDevice(z.slice(4)); else if (z.startsWith('pin:')) show(z.slice(4)); else SCENES[z] ? enterInside(z) : show(z);
    });
    let hoverQ = null;
    canvas.addEventListener('pointermove', e => { if (e.buttons) { tip.style.opacity = 0; return; } if (!hoverQ) hoverQ = requestAnimationFrame(() => { hoverQ = null; hover(e.clientX, e.clientY); }); });
    canvas.addEventListener('pointerenter', () => { over = true; });
    canvas.addEventListener('pointerleave', () => { over = false; tip.style.opacity = 0; hoverZone = null; hoverDev = null; canvas.classList.remove('hover'); });
    addEventListener('resize', size3);
    size3();
    const t = ZINFO.command || { x: CX, y: CX };
    ctl.target.set(t.x, 0, t.y + 6); camera.position.set(t.x - 55, 70, t.y + 85);
    mark('built'); await breathe();
    await compileGradually(R, scn, camera, [hemi, sun], scn.fog, breathe);   // every shader now, in small steps, not on the first visible frame
    mark('compiled'); await breathe();
    ready = true; mark('ready');
    // Secondary scenery can arrive after the first interactive frame using the already compiled material.
    details.finishEnvironment(gb, breathe).catch(e => console.warn('Scenery details:', e));
  }
  function size3() { if (!R) return; R.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }

  function buildArchitecture(boxes, roofs) {
    // Only main buildings receive details; vehicles, equipment and pitched roofs keep their models.
    const buildings = boxes.filter(b => b.win && b.h > 2 && (b.z0 || 0) < .3 && b.x1 - b.x0 > 1.2 && b.y1 - b.y0 > 1.2);
    const details = [];
    for (const b of buildings) {
      if (roofs.some(r => Math.abs(r.x0 - b.x0) < .01 && Math.abs(r.y0 - b.y0) < .01 && Math.abs(r.z - b.h) < .01)) continue;
      const top = (b.z0 || 0) + b.h, w = b.x1 - b.x0, d = b.y1 - b.y0;
      const add = (x0, y0, x1, y1, z0, h, color, roof) => details.push({ x0, y0, x1, y1, z0, h, color, roof, zone: b.zone });
      // A shallow parapet makes a believable edge without changing the building silhouette.
      const e = .075;
      add(b.x0, b.y0, b.x1, b.y0 + e, top, .12, '#a9afb0');
      add(b.x0, b.y1 - e, b.x1, b.y1, top, .12, '#a9afb0');
      add(b.x0, b.y0, b.x0 + e, b.y1, top, .12, '#a9afb0');
      add(b.x1 - e, b.y0, b.x1, b.y1, top, .12, '#a9afb0');
      const x = b.x0 + w * .24, y = b.y0 + d * .28;
      add(x, y, x + Math.min(.65, w * .14), y + Math.min(.9, d * .18), top, .23, '#939e9f', '#c0c8c7');
      for (let k = 0; k < 4; k++) add(x + .06, y + .08 + k * .12, x + Math.min(.59, w * .12), y + .105 + k * .12, top + .23, .012, '#4d5b60');
    }
    boxes.push(...details);

    // Soft contact shading stays visible even where the world-sized sun shadow map is coarse.
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      uniforms: {},
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vUv; void main() { vec2 edge = smoothstep(vec2(0.0), vec2(0.19), vUv) * smoothstep(vec2(0.0), vec2(0.19), 1.0 - vUv); gl_FragColor = vec4(0.025, 0.035, 0.04, edge.x * edge.y * 0.24); }'
    });
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat, Math.max(1, buildings.length));
    buildings.forEach((b, i) => { V.set((b.x0 + b.x1) / 2, .008, (b.y0 + b.y1) / 2); SV.set(b.x1 - b.x0 + .7, 1, b.y1 - b.y0 + .7); Q.identity(); mesh.setMatrixAt(i, M4.compose(V, Q, SV)); });
    mesh.count = buildings.length; mesh.frustumCulled = false; mesh.renderOrder = 1; scn.add(mesh);
  }

  function buildRoofs(roofs) {
    const pos = [], colr = [], e = .1;
    roofZones = [];
    const tri = (a, b, c, k, zone) => { pos.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) colr.push(k.r, k.g, k.b); roofZones.push(zone); };
    for (const o of roofs) {
      const z = o.z, r = o.z + o.rh, yc = (o.y0 + o.y1) / 2, k = C3(o.color), w = C3(o.wall), sol = C3('#2b4f8a');
      const A = [o.x0 - e, z, o.y0 - e], B = [o.x1 + e, z, o.y0 - e], C_ = [o.x1 + e, r, yc], D = [o.x0 - e, r, yc], E = [o.x0 - e, z, o.y1 + e], F = [o.x1 + e, z, o.y1 + e];
      tri(A, D, C_, k, o.zone); tri(A, C_, B, k, o.zone);                       // north slope
      tri(E, F, C_, o.solar ? sol : k, o.zone); tri(E, C_, D, o.solar ? sol : k, o.zone);   // south slope (solar panels)
      tri([o.x0, z, o.y0], [o.x0, z, o.y1], [o.x0, r, yc], w, o.zone); tri([o.x1, z, o.y0], [o.x1, r, yc], [o.x1, z, o.y1], w, o.zone);   // gables
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.computeVertexNormals();
    roofMesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    roofMesh.castShadow = roofMesh.receiveShadow = true; scn.add(roofMesh);
  }
  function buildTrees() {
    const trees = objs.filter(o => o.t === 'tree'), round = trees.filter(o => o.k !== 'cone'), cone = trees.filter(o => o.k === 'cone');
    const trunk = inst(new THREE.CylinderGeometry(.06, .09, 1, 6), new THREE.MeshLambertMaterial(), trees.length);
    const leaf = new THREE.MeshLambertMaterial();
    const crown = inst(new THREE.IcosahedronGeometry(1, 1), leaf, round.length * 4);
    const cone1 = inst(new THREE.ConeGeometry(1, 1, 10), leaf, cone.length), cone2 = inst(new THREE.ConeGeometry(1, 1, 10), leaf, cone.length);
    const put = (m, i, x, y, z, sx, sy, sz, c) => { V.set(x, y, z); SV.set(sx, sy, sz); Q.identity(); m.setMatrixAt(i, M4.compose(V, Q, SV)); if (c) m.setColorAt(i, c); };
    trees.forEach((o, i) => { put(trunk, i, o.cx, .25 * o.s, o.cy, o.s, .5 * o.s, o.s, C3('#7a5a3a')); });
    round.forEach((o, i) => {
      const seed = hsh(o.cx * 9 + o.cy), c = C3(o.c).clone().multiplyScalar(.76 + seed * .24);
      put(crown, i * 4, o.cx, .98 * o.s, o.cy, .46 * o.s, .58 * o.s, .43 * o.s, c);
      for (let j = 1; j < 4; j++) {
        const a = seed * Math.PI * 2 + j * 2.094, r = (.22 + seed * .07) * o.s;
        put(crown, i * 4 + j, o.cx + Math.cos(a) * r, (.88 + j * .1) * o.s, o.cy + Math.sin(a) * r,
          .34 * o.s, (.34 + seed * .09) * o.s, .32 * o.s, c.clone().multiplyScalar(.9 + j * .07));
      }
    });
    cone.forEach((o, i) => { const c = C3(o.c); put(cone1, i, o.cx, .9 * o.s, o.cy, .44 * o.s, 1.1 * o.s, .44 * o.s, c); put(cone2, i, o.cx, 1.5 * o.s, o.cy, .34 * o.s, 1.1 * o.s, .34 * o.s, c); });
    [trunk, crown, cone1, cone2].forEach(m => { m.count = m.instanceMatrix.count; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
    treeMeshes = [crown, cone1, cone2]; treeZone = [round.flatMap(o => [o.zone, o.zone, o.zone, o.zone]), cone.map(o => o.zone), cone.map(o => o.zone)];
  }
  function buildStreetFurniture() {
    const lamps = objs.filter(o => o.t === 'lamp'), tls = objs.filter(o => o.t === 'tlight'), turbines = objs.filter(o => o.t === 'turbine');
    const pole = inst(new THREE.CylinderGeometry(.03, .04, 1, 6), new THREE.MeshLambertMaterial({ color: C3('#5f6b77') }), lamps.length + tls.length);
    const put = (m, i, x, y, z, sx, sy, sz) => { V.set(x, y, z); SV.set(sx, sy, sz); Q.identity(); m.setMatrixAt(i, M4.compose(V, Q, SV)); };
    lamps.forEach((o, i) => put(pole, i, o.cx, .62, o.cy, 1, 1.25, 1));
    tls.forEach((o, i) => put(pole, lamps.length + i, o.cx, .5, o.cy, 1, 1, 1));
    pole.count = lamps.length + tls.length; pole.instanceMatrix.needsUpdate = true;
    const headMat = new THREE.MeshLambertMaterial({ color: C3('#e8edf2'), emissive: C3('#ffd58a'), emissiveIntensity: 0 });
    const heads = inst(new THREE.BoxGeometry(.22, .045, .085), headMat, lamps.length, false);
    lamps.forEach((o, i) => put(heads, i, o.cx, 1.27, o.cy, 1, 1, 1)); heads.count = lamps.length; heads.instanceMatrix.needsUpdate = true;
    heads.userData.mat = headMat; lampGlow = { heads, mat: headMat };
    // warm pools of light under the lamps at night
    const gc = document.createElement('canvas'); gc.width = gc.height = 64; const gx = gc.getContext('2d'), gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,205,120,1)'); gr.addColorStop(1, 'rgba(255,205,120,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64);
    const poolTex = new THREE.CanvasTexture(gc); poolTex.encoding = THREE.sRGBEncoding;
    const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.8, 2.8).rotateX(-Math.PI / 2), poolMat, lamps.length);
    lamps.forEach((o, i) => put(pools, i, o.cx, .03, o.cy, 1, 1, 1)); pools.instanceMatrix.needsUpdate = true; pools.frustumCulled = false; scn.add(pools);
    lampGlow.pools = poolMat;
    const housing = inst(new THREE.BoxGeometry(.2, .32, .12), new THREE.MeshLambertMaterial({ color: C3('#1b232c') }), tls.length);
    tls.forEach((o, i) => put(housing, i, o.cx, 1.0, o.cy, 1, 1, 1)); housing.count = tls.length; housing.instanceMatrix.needsUpdate = true;
    const lights = inst(new THREE.SphereGeometry(.06, 8, 6).translate(0, 0, .075), new THREE.MeshBasicMaterial(), tls.length, false);
    tls.forEach((o, i) => put(lights, i, o.cx, 1.0, o.cy, 1, 1, 1)); lights.count = tls.length; lights.instanceMatrix.needsUpdate = true;
    tlLights = { mesh: lights, list: tls };
    // wind turbines with turning blades
    const white = new THREE.MeshLambertMaterial({ color: C3('#f4f6f8') });
    turbines.forEach(o => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(.07, .15, 5.2, 10), white); tower.position.set(o.cx, 2.6, o.cy); tower.castShadow = true; scn.add(tower);
      const hub = new THREE.Group(); hub.position.set(o.cx, 5.2, o.cy + .12); scn.add(hub);
      for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.16, 2.1, .04).translate(0, 1.05, 0), white); b.rotation.z = k * 2.094; b.castShadow = true; hub.add(b); }
      hub.userData.id = o.id; blades.push(hub);
    });
  }
  function labelSprite(text, bg = '#0f1724', fg = '#fff', h = .045) {
    const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = '700 30px Inter, "Segoe UI Emoji", sans-serif';
    const w = Math.ceil(x.measureText(text).width) + 36; c.width = w; c.height = 50;
    x.font = '700 30px Inter, "Segoe UI Emoji", sans-serif'; x.fillStyle = bg; x.beginPath(); x.roundRect(0, 0, w, 50, 14); x.fill();
    x.fillStyle = fg; x.textBaseline = 'middle'; x.fillText(text, 18, 27);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, sizeAttenuation: false, depthTest: false, transparent: true }));
    s.scale.set(h * w / 50, h, 1); s.renderOrder = 10; return s;
  }
  function buildLabels() {
    const L = [['✈️ Mega Airport', 88, 14, 6, '#0277bd'], ['🏘️ Small Town', SAT.x1 - 1.2, 30.5, 4, '#6d4c41'], ['🌾 Farmland', -58.7, 18, 3, '#9e9d24'], ['🚆 Metro Loop', 57.5, 44, 4.5, '#00897b'], ['⛴️ River Ferry', -11.2, 26, 3, '#0277bd'], ['🏭 Logistics Hub', 75, 42.6, 3.4, '#ef6c00']];
    const ZONE = { '✈️ Mega Airport': 'airport', '🏘️ Small Town': 'satcentre', '🌾 Farmland': 'farmbelt', '🚆 Metro Loop': 'rail', '⛴️ River Ferry': 'ferry', '🏭 Logistics Hub': 'warehouse' };
    L.forEach(([t, x, y, z, bg]) => { const s = labelSprite(t, bg, '#fff', .022); s.position.set(x, z, y); scn.add(s); if (TOPICS[ZONE[t]]) { s.userData.zone = ZONE[t]; s.userData.isLabel = true; pinSprites.push(s); } });   // a click on a place name opens that place
  }
  // a small name tag under a device icon: model and what it is, so it is easy to see what is installed
  const tagCache = {};
  // where a device sends its data: shown on its tag, so you can see what it is connected to
  function linkText(d) {
    if (d.cat === 'sensor') { const g = DEV[d.gw || 'ug65']; return '↳ ' + (g ? g.model : 'UG65') + ' gateway · LoRaWAN'; }
    if (d.cat === 'gateway') return '↳ IRIV Edge · Ethernet / 4G';
    if (d.cat === 'edge') return '↳ Cloud · fibre / 4G';
    const g = d.gw && DEV[d.gw]; return '↳ ' + (g ? g.model : 'IRIV Edge') + ' · MQTT';
  }
  function devTag(d) {
    if (!tagCache[d.id]) {
      const c = document.createElement('canvas'), x = c.getContext('2d'), k = CAT[d.cat] ? CAT[d.cat].c : '#1e88e5', t1 = d.model, t2 = d.name, t3 = linkText(d);
      const f1 = '700 26px Inter, sans-serif', f2 = '500 22px Inter, sans-serif', f3 = '600 20px Inter, sans-serif';
      const wOf = (f, t) => { x.font = f; return x.measureText(t).width; }, w = Math.ceil(Math.max(wOf(f1, t1), wOf(f2, t2), wOf(f3, t3))) + 30;
      c.width = w; c.height = 100; x.fillStyle = 'rgba(255,255,255,.96)'; x.beginPath(); x.roundRect(0, 0, w, 100, 12); x.fill(); x.fillStyle = k; x.fillRect(0, 0, 7, 100);
      x.textBaseline = 'middle'; x.font = f1; x.fillStyle = '#1d2939'; x.fillText(t1, 16, 22); x.font = f2; x.fillStyle = '#5b6b7c'; x.fillText(t2, 16, 51); x.font = f3; x.fillStyle = k; x.fillText(t3, 16, 79);
      const tt = new THREE.CanvasTexture(c); tt.encoding = THREE.sRGBEncoding;
      tagCache[d.id] = { mat: new THREE.SpriteMaterial({ map: tt, sizeAttenuation: false, depthTest: false, transparent: true }), aspect: w / 100 };
    }
    const { mat, aspect } = tagCache[d.id], s = new THREE.Sprite(mat); s.center.set(.5, 1); s.scale.set(.034 * aspect, .034, 1); s.renderOrder = 12; s.userData.dev = d.id; s.userData.tag = true; return s;
  }
  let devTags = [];
  function buildDevices() {
    const cache = {};
    DEVICES.filter(d => d.x !== undefined).forEach(d => {
      const key = d.icon + d.cat;
      if (!cache[key]) {
        const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), k = CAT[d.cat] ? CAT[d.cat].c : '#1e88e5';
        x.fillStyle = '#fff'; x.strokeStyle = k; x.lineWidth = 6; x.beginPath(); x.roundRect(5, 5, 54, 54, 14); x.fill(); x.stroke();
        x.font = '34px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(d.icon, 32, 35);
        const it = new THREE.CanvasTexture(c); it.encoding = THREE.sRGBEncoding;
        cache[key] = new THREE.SpriteMaterial({ map: it, sizeAttenuation: false, depthTest: false, transparent: true });
      }
      const s = new THREE.Sprite(cache[key]); s.scale.set(.02, .02, 1); s.position.set(d.x, (d.z || 0) + .7, d.y); s.renderOrder = 11; s.userData.dev = d.id;
      scn.add(s); devSprites.push(s);
      const tag = devTag(d); tag.position.copy(s.position); tag.position.y -= .05; tag.visible = false; tag.userData.zone = d.zone; scn.add(tag); devTags.push(tag);
    });
  }
  function buildRain() {
    const n = 2600, p = new Float32Array(n * 6);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: C3('#c8dcf0'), transparent: true, opacity: 0 }));
    rain.frustumCulled = false; rain.userData.seed = Array.from({ length: n }, (_, i) => [hsh(i * 3.1), hsh(i * 7.7), hsh(i * 1.3)]); scn.add(rain);
  }

  // ---------- picking ----------
  function zoneAt(x, y) {
    const b = blocks.find(b => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1); if (b) return b.zone;
    if (typeof AIR !== 'undefined' && x >= AIR.x0 && x <= AIR.x1 && y >= AIR.y0 && y <= AIR.y1) return 'airport';
    if (x >= HWY.x0 && x <= HWY.x1 && y >= HWY.y0 && y <= HWY.y1) return 'highway';
    if (x >= 0 && x <= WORLD && y >= 0 && y <= WORLD) return 'mobility';
    return null;
  }
  // icons and pins: the one whose centre is nearest the cursor wins, so stacked icons never hide each other
  const SV2 = () => new THREE.Vector3();
  function spriteAt(cx, cy, list) {
    const p11 = camera.projectionMatrix.elements[5], v = spriteAt.v || (spriteAt.v = SV2());
    let best = null, bd = Infinity;
    for (const s of list) {
      if (!s.visible) continue;
      v.copy(s.position).project(camera); if (v.z > 1) continue;
      const h = p11 * s.scale.y * innerHeight / 2, w = h * s.scale.x / s.scale.y;
      const x = (v.x + 1) / 2 * innerWidth + (.5 - s.center.x) * w, y = (1 - v.y) / 2 * innerHeight - (.5 - s.center.y) * h;
      const d = Math.hypot(cx - x, cy - y);
      if (Math.abs(cx - x) <= w / 2 + 3 && Math.abs(cy - y) <= h / 2 + 3 && d < bd) { bd = d; best = s; }
    }
    return best;
  }
  function pinCentre(z) { const s = pinSprites.find(p => p.userData.zone === z && !p.userData.isLabel); if (!s) return null; const v = s.position.clone().project(camera), h = camera.projectionMatrix.elements[5] * s.scale.y * innerHeight / 2; return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight - (.5 - s.center.y) * h)]; }
  function pick3(cx, cy) {
    mouse.set(cx / innerWidth * 2 - 1, -cy / innerHeight * 2 + 1); ray.setFromCamera(mouse, camera);
    if (scene === 'inside') { const d = IN && showDev && spriteAt(cx, cy, IN.sprites); return d ? 'dev:' + d.userData.dev : null; }
    if (!scenic) { const s = spriteAt(cx, cy, [...(showDev ? devSprites.concat(devTags) : []), ...pinSprites]); if (s) return s.userData.dev ? 'dev:' + s.userData.dev : 'pin:' + s.userData.zone; }
    const hits = ray.intersectObjects([staticBoxes, alphaBoxes, dynBoxes, roofMesh, ...treeMeshes, ...details.pickables, ground]);
    for (const h of hits) {
      let z = null;
      if (h.object === staticBoxes) z = staticZones[h.instanceId];
      else if (h.object === alphaBoxes) z = alphaZones[h.instanceId];
      else if (h.object === dynBoxes) z = dynZones[h.instanceId];
      else if (h.object === roofMesh) z = roofZones[h.faceIndex];
      else if (treeMeshes.includes(h.object)) z = treeZone[treeMeshes.indexOf(h.object)][h.instanceId];
      else if (h.object === ground) z = zoneAt(h.point.x, h.point.z);
      else z = h.object.userData.zone;
      if (z && TOPICS[z]) return z;
    }
    return null;
  }
  function hover(cx, cy) {
    if (!over) { tip.style.opacity = 0; return; }
    let z = pick3(cx, cy); const d = z && z.startsWith('dev:') ? DEV[z.slice(4)] : null, pin = z && z.startsWith('pin:');
    if (pin) z = z.slice(4);
    hoverZone = d || !z ? null : z; hoverDev = d ? d.id : null;
    canvas.classList.toggle('hover', !!z);
    if (!z) { tip.style.opacity = 0; return; }
    tip.textContent = d ? `${d.icon}  ${d.brand === 'IRIV' ? '' : d.brand + ' '}${d.model} · ${d.name}` : TOPICS[z].icon + '  ' + TOPICS[z].title + (SCENES[z] && !pin ? '  ·  🚪 click to go inside' : '');
    tip.style.left = cx + 'px'; tip.style.top = cy + 'px'; tip.style.opacity = 1;
  }

  // ---------- connections: device links, power and water routes, building wires ----------
  // Each connection is a tube with glowing packets moving along it, like the dashed animated lines in 2D.
  const DOT_TEX = () => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  let dotTex, linkSet, routeSet, wireSet = null, wireKey = '', focusKey = '', linkHi = null;
  const W3 = p => new THREE.Vector3(p[0], p[2], p[1]);   // map [x, y, z] → three.js
  // one mesh of tubes plus one cloud of packets for a list of paths; path: { pts: [Vector3], color, speed, n, phase, dead }
  function pathSet(paths, radius, opacity, root = scn) {
    // tubes go straight into typed arrays (indexed): little garbage, so no long garbage-collection pause while the map opens
    const parts = [];
    for (const p of paths) {
      const curve = p.pts.length === 3 && p.arc ? new THREE.QuadraticBezierCurve3(...p.pts) : new THREE.CurvePath();
      if (!p.arc) for (let i = 0; i < p.pts.length - 1; i++) curve.add(new THREE.LineCurve3(p.pts[i], p.pts[i + 1]));
      p.curve = curve; p.len = curve.getLength(); if (p.ups) p.speed = p.ups / Math.max(1, p.len);   // ups: units per second along a long route
      parts.push({ g: new THREE.TubeGeometry(curve, p.arc ? 12 : Math.max(2, (p.pts.length - 1) * 4), radius, 4, false), k: C3(p.dead ? '#e53935' : p.color) });
    }
    const nv = parts.reduce((s, q) => s + q.g.attributes.position.count, 0), ni = parts.reduce((s, q) => s + q.g.index.count, 0);
    const pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = new Uint32Array(ni);
    let v = 0, ii = 0;
    for (const { g, k } of parts) {
      const a = g.attributes.position.array, n = a.length / 3, ix = g.index.array;
      pos.set(a, v * 3); for (let i = 0; i < n; i++) { col[(v + i) * 3] = k.r; col[(v + i) * 3 + 1] = k.g; col[(v + i) * 3 + 2] = k.b; }
      for (let i = 0; i < ix.length; i++) idx[ii + i] = ix[i] + v;
      v += n; ii += ix.length; g.dispose();
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const tube = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity, depthWrite: false }));
    const nDots = paths.reduce((s, p) => s + (p.dead ? 0 : p.n), 0), dp = new Float32Array(Math.max(1, nDots) * 3), dc = new Float32Array(Math.max(1, nDots) * 3);
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dg.setAttribute('color', new THREE.BufferAttribute(dc, 3));
    let j = 0; for (const p of paths) if (!p.dead) { const k = C3(p.color); for (let i = 0; i < p.n; i++, j++) dc.set([k.r, k.g, k.b], j * 3); }
    const dots = new THREE.Points(dg, new THREE.PointsMaterial({ size: 9, sizeAttenuation: false, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    tube.frustumCulled = dots.frustumCulled = false; tube.renderOrder = 4; dots.renderOrder = 5;
    root.add(tube); root.add(dots);
    return { paths, tube, dots, remove() { root.remove(tube); root.remove(dots); tube.geometry.dispose(); dots.geometry.dispose(); } };
  }
  function moveDots(set, only) {
    const a = set.dots.geometry.attributes.position.array, v = new THREE.Vector3(); let j = 0;
    for (const p of set.paths) {
      if (p.dead) continue;
      for (let i = 0; i < p.n; i++, j++) {
        if (only && !only(p)) { a[j * 3 + 1] = -999; continue; }
        let u = (time * p.speed + p.phase + i / p.n) % 1; if (p.back) u = 1 - u;
        p.arc ? p.curve.getPoint(u, v) : p.curve.getPointAt(u, v); a.set([v.x, v.y, v.z], j * 3);   // getPoint skips the arc-length lookup on short arcs
      }
    }
    set.dots.geometry.attributes.position.needsUpdate = true;
  }
  const arc = (a, b) => { const A = W3(a), B = W3(b), m = A.clone().add(B).multiplyScalar(.5); m.y = Math.max(A.y, B.y) + 1.4 + A.distanceTo(B) * .16; return [A, m, B]; };
  const DEVPOS = d => [d.x, d.y, d.z || 0];
  function deviceLinks() {
    const L = [], ug = DEV.ug65, ed = DEV.edge, catC = c => (CAT[c] && CAT[c].c) || '#3949ab';
    DEVICES.forEach((d, i) => {
      if (d.x === undefined) return;
      const dead = typeof netDown === 'function' && netDown(d.id), add = (from, to, cat, speed, n, keys) => L.push({ pts: arc(DEVPOS(from), DEVPOS(to)), arc: true, color: catC(cat), speed, n, phase: i * .29, dead, keys });
      if (d.cat === 'sensor') add(d, d.gw ? DEV[d.gw] : ug, 'sensor', .35, 1, [d.id, d.gw || 'ug65']);
      if (d.cat === 'gateway' && d.id !== 'ug65') add(d, ed, 'gateway', .4, 2, [d.id, 'edge']);
      if (d.cat === 'controller') add(d.gw ? DEV[d.gw] : ed, d, 'controller', .45, 2, [d.id, d.gw || 'edge']);
      if (d.cat === 'ai') add(ed, d, 'ai', .5, 2, [d.id, 'edge']);
    });
    L.push({ pts: arc(DEVPOS(ug), DEVPOS(ed)), arc: true, color: CAT.gateway.c, speed: .6, n: 3, phase: 0, keys: ['ug65', 'edge'] });
    const cl = clouds.reduce((b, c) => Math.hypot(c.x - ed.x, c.y - ed.y) < Math.hypot(b.x - ed.x, b.y - ed.y) ? c : b);
    L.push({ pts: arc(DEVPOS(ed), [cl.x, cl.y, cl.z]), arc: true, color: CAT.edge.c, speed: .3, n: 3, phase: 0, keys: ['edge'] });
    return L;
  }
  function routes() {
    const dead = typeof powerCut === 'function' && powerCut(), R = [];
    [[POWER_ROUTE, '#efa912', 28], [WATER_ROUTE, '#00a7db', 22], [SEWER_ROUTE, '#8d6e63', 15]].forEach(([pts, c, s], i) => R.push({ pts: pts.map(W3), color: c, ups: s / 9, n: Math.max(3, Math.round(pts.length * 1.5)), phase: i * .3 }));
    if (typeof GRIDR !== 'undefined') [...Object.values(GRIDR).filter(Array.isArray), ...GRIDR_CABLES].forEach((pts, i) => R.push({ pts: pts.map(W3), color: dead ? '#90a4ae' : '#efa912', ups: 3, n: dead ? 0 : Math.max(2, pts.length * 2), phase: i * .17 }));
    return R;
  }
  async function buildConnections() {
    dotTex = DOT_TEX();
    linkSet = pathSet(deviceLinks(), .045, .5); await breathe();
    routeSet = pathSet(routes(), .09, .85);
  }
  function updateConnections() {
    const focus = selDev || hoverDev || '';
    linkSet.tube.visible = linkSet.dots.visible = showDev;
    if (showDev) {
      linkSet.tube.material.opacity = focus ? .12 : .5;
      if (focus !== focusKey) {   // the focused device's links, drawn bright
        focusKey = focus; if (linkHi) { linkHi.remove(); linkHi = null; }
        const mine = linkSet.paths.filter(p => p.keys.includes(focus));
        if (focus && mine.length) linkHi = pathSet(mine.map(p => ({ ...p })), .07, .95);
      }
      moveDots(linkSet, focus ? p => p.keys.includes(focus) : null);
      if (linkHi) moveDots(linkHi);
    }
    moveDots(routeSet);
    // a building's own wiring (power, water, data), shown for the selected or hovered district like in 2D
    const z = sel && WIRES[sel] ? sel : hoverZone && WIRES[hoverZone] ? hoverZone : '';
    if (z !== wireKey) {
      wireKey = z; if (wireSet) { wireSet.remove(); wireSet = null; }
      if (z) { const water = WATER_ZONES.includes(z); wireSet = pathSet(WIRES[z].map(([kind, label, ...pts], i) => ({ pts: pts.map(p => W3([M(p[0]), M(p[1]) + (water ? WATER_OFFSET : 0), p[2]])), color: WIRE_COL[kind], ups: kind === 'data' ? 2.5 : 3.5, n: Math.max(2, pts.length), phase: i * .21 })), .06, .95); }
    }
    if (wireSet) { wireSet.tube.material.opacity = z === sel ? .95 : .5; moveDots(wireSet); }
  }

  // ---------- traffic flow: every lane coloured by its average speed, with arrows moving at that speed ----------
  let flow = null;
  function buildFlow() {
    const strips = [], n = ROADS.length * LANES.length * (FLOW_EDGES.length - 1);
    const sm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: .75, depthWrite: false }), n);
    sm.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    const shape = new THREE.Shape(); shape.moveTo(.22, 0); shape.lineTo(-.02, .11); shape.lineTo(.04, 0); shape.lineTo(-.02, -.11); shape.lineTo(.22, 0);
    const cm = new THREE.InstancedMesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false, transparent: true }), n * 6);
    let i = 0;
    for (const c of ROADS) for (const [ax, off, dir] of LANES) for (let e = 0; e < FLOW_EDGES.length - 1; e++) {
      const lane = c + off, a = FLOW_EDGES[e] + (e ? 1.2 : .1), b = FLOW_EDGES[e + 1] - (e < FLOW_EDGES.length - 2 ? 1.2 : .1), mid = (a + b) / 2;
      V.set(ax === 'x' ? mid : lane, .03, ax === 'x' ? lane : mid); SV.set(ax === 'x' ? b - a : .24, 1, ax === 'x' ? .24 : b - a); Q.identity();
      sm.setMatrixAt(i, M4.compose(V, Q, SV)); strips.push({ ax, lane, dir, a, b, key: ax + lane + '|' + e, r: 1 }); i++;
    }
    sm.renderOrder = cm.renderOrder = 3; sm.frustumCulled = cm.frustumCulled = false; sm.visible = cm.visible = false;
    scn.add(sm); scn.add(cm);
    flow = { sm, cm, strips, t: 0 };
  }
  let FLOWC = null;
  function updateFlow(dt) {
    FLOWC = FLOWC || FLOW_COL.map(h => new THREE.Color(h).convertSRGBToLinear());
    const on = flowOn(); flow.sm.visible = flow.cm.visible = on; if (!on) return;
    flow.t -= dt;
    if (flow.t <= 0) {   // lane speeds, a few times a second
      flow.t = .3; const seg = new Map();
      for (const c of cars) { let i = 0; while (i < FLOW_EDGES.length - 2 && c.pos > FLOW_EDGES[i + 1]) i++; const k = c.ax + c.lane + '|' + i, s = seg.get(k) || seg.set(k, { n: 0, v: 0 }).get(k); s.n++; s.v += Math.min(1, c.v / (c.vmax || 1.6)); }
      flow.strips.forEach((s, i) => { const g = seg.get(s.key); s.r = g ? g.v / g.n : 1; flow.sm.setColorAt(i, FLOWC[s.r > .6 ? 2 : s.r > .3 ? 1 : 0]); });
      flow.sm.instanceColor.needsUpdate = true;
    }
    let j = 0; const step = 1.3, max = flow.cm.instanceMatrix.count;
    for (const s of flow.strips) {
      const ph = (time * s.r * 1.6) % step;
      for (let u = s.dir > 0 ? s.a + ph : s.b - ph; (s.dir > 0 ? u < s.b - .25 : u > s.a + .25) && j < max; u += s.dir * step, j++) {
        V.set(s.ax === 'x' ? u : s.lane, .04, s.ax === 'x' ? s.lane : u); Q.setFromAxisAngle(UP, s.ax === 'x' ? (s.dir > 0 ? 0 : Math.PI) : (s.dir > 0 ? -Math.PI / 2 : Math.PI / 2)); SV.set(1, 1, 1);
        flow.cm.setMatrixAt(j, M4.compose(V, Q, SV));
      }
    }
    flow.cm.count = j; flow.cm.instanceMatrix.needsUpdate = true;
  }

  // ---------- district pins, like the 2D map: click one for its details ----------
  let pinSprites = [];
  async function buildPins() {   // drawing emoji is slow: a few pins at a time, so opening stays smooth
    let k = 0;
    for (const z of Object.keys(ZINFO)) {
      const T = TOPICS[z], zi = ZINFO[z]; if (!T) continue;
      if (++k % 12 === 0) await breathe();
      const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
      x.fillStyle = '#ffffff'; x.strokeStyle = T.color; x.lineWidth = 6; x.beginPath(); x.arc(32, 30, 24, 0, 7); x.fill(); x.stroke();
      x.fillStyle = T.color; x.beginPath(); x.moveTo(26, 52); x.lineTo(32, 62); x.lineTo(38, 52); x.fill();
      x.font = '28px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(T.icon, 32, 32);
      const pt = new THREE.CanvasTexture(c); pt.encoding = THREE.sRGBEncoding;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pt, sizeAttenuation: false, depthTest: false, transparent: true }));
      s.center.set(.5, 0); s.scale.set(.03, .03, 1); s.position.set(zi.x, (zi.z || 2) + .4, zi.y); s.renderOrder = 9; s.userData.zone = z;
      scn.add(s); pinSprites.push(s);
    }
  }

  // ---------- building interiors in 3D ----------
  // Rooms come from the same SCENES data as the 2D rooms: floor, back walls, windows, door, furniture, people
  // and devices. Furniture and people are captured from the 2D draw code every frame, like the moving city.
  let IN = null, cityView = null;
  function buildInterior() {
    if (IN) IN.dispose();
    const S = curInt, IW = S.w || 14, ID = S.d || 11, WH = S.wallH || 3.6, [d0, d1] = S.door || [8, 10], [wz0, wz1] = S.winZ || [1.3, 3.0];
    const s3 = new THREE.Scene(); s3.background = new THREE.Color(0xe9eef3);
    const h = new THREE.HemisphereLight(C3('#ffffff'), C3('#8a8f99'), .8); s3.add(h);
    const dl = new THREE.DirectionalLight(C3('#fff4e0'), .75); dl.position.set(IW * .8, 14, ID * 1.2); dl.target.position.set(IW / 2, 0, ID / 2); s3.add(dl); s3.add(dl.target);
    dl.castShadow = true; const r = Math.max(IW, ID) * .8; Object.assign(dl.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 60 }); dl.shadow.mapSize.set(2048, 2048); dl.shadow.bias = -.001;
    const L = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: C3(c) }, o)), bx = (w, hh, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mat); m.position.set(x, y, z); m.receiveShadow = true; s3.add(m); return m; };
    // floor with tiles, back walls with skirting, windows, sliding doors and the sign
    bx(IW, .35, ID, L(S.floor || '#d9dee3'), IW / 2, -.175, ID / 2);
    const tiles = []; for (let x = 1; x < IW; x++) tiles.push(x, .002, 0, x, .002, ID); for (let y = 1; y < ID; y++) tiles.push(0, .002, y, IW, .002, y);
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tiles, 3)); s3.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: C3(S.tile || '#c9d0d6') })));
    bx(.3, WH, ID + .3, L(S.wallA || '#e8e2d6'), -.15, WH / 2, ID / 2 - .15); bx(IW, WH, .3, L(S.wallB || '#efe9dd'), IW / 2, WH / 2, -.15);
    bx(.04, .14, ID, L('#b7bec6'), .02, .07, ID / 2); bx(IW, .14, .04, L('#b7bec6'), IW / 2, .07, .02);
    const glass = L('#cfe8f7', { transparent: true, opacity: .75 });
    (S.winA || []).forEach(([a, b]) => bx(.05, wz1 - wz0, b - a, glass, .03, (wz0 + wz1) / 2, (a + b) / 2));
    bx(.05, 2.6, d1 - d0, L('#a0d2f0', { transparent: true, opacity: .45 }), .04, 1.3, (d0 + d1) / 2);
    bx(.06, .4, d1 - d0, L(S.color || '#1e88e5'), .04, 2.92, (d0 + d1) / 2);
    if (S.sign) { const sp = labelSprite(S.sign, S.color || '#1e88e5', '#fff', .028); sp.position.set(.2, 3.5, (d0 + d1) / 2); s3.add(sp); }
    // furniture and people (refilled every frame), devices and their links
    const boxes = boxMesh(3000, boxMat), cyl = inst(new THREE.CylinderGeometry(1, 1, 1, 12), new THREE.MeshLambertMaterial(), 400), sph = inst(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshLambertMaterial(), 400);
    scn.remove(cyl); scn.remove(sph); s3.add(boxes); s3.add(cyl); s3.add(sph);
    const GB = S.gw || GW_BADGE, EB = S.eb || EDGE_BADGE, edge = S.devs.find(p => p.id === 'edge');
    const needEdge = !edge && S.devs.some(p => ['controller', 'ai'].includes(DEV[p.id].cat) && !DEV[p.id].gw);
    const marks = [...S.devs, GB, ...(needEdge ? [EB] : [])], sprites = [];
    marks.forEach(p => { const d = DEV[p.id]; if (!d) return; const s = devSprite(d); s.position.set(p.x, p.z + .55, p.y); s.userData.dev = p.id; s3.add(s); sprites.push(s);
      const tag = devTag(d); tag.position.set(p.x, p.z + .5, p.y); s3.add(tag); sprites.push(tag); });   // in a room every device shows its name
    S.devs.filter(p => p.mount === 'A' || p.mount === 'B').forEach(p => { const A = p.mount === 'A'; bx(A ? .05 : .4, .4, A ? .4 : .05, L('#ffffff'), A ? .04 : p.x, p.z, A ? p.y : .04); });
    const paths = S.devs.map((p, i) => {
      const cat = DEV[p.id].cat, toEdge = (cat === 'controller' || cat === 'ai') && !DEV[p.id].gw, t = toEdge ? (edge || EB) : GB;
      const color = cat === 'sensor' ? CAT.sensor.c : cat === 'edge' ? CAT.gateway.c : cat === 'ai' ? CAT.ai.c : CAT.controller.c;
      return { pts: arc([p.x, p.y, p.z], [t.x, t.y, t.z]), arc: true, color, speed: .35, n: 1, phase: i * .27, back: cat !== 'sensor', keys: [p.id] };
    }).filter(p => p.pts[0].distanceTo(p.pts[2]) > .1);
    const links = paths.length ? pathSet(paths, .03, .55, s3) : null;
    IN = { zone: curZone, big: IW * ID > 300, s3, boxes, cyl, sph, sprites, links, IW, ID, WH, dispose() { s3.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } };
    // camera: looking into the cut-away room from the open front corner
    if (!cityView) cityView = { t: ctl.target.clone(), p: camera.position.clone(), min: ctl.minDistance, max: ctl.maxDistance };
    const big = Math.max(IW, ID);
    ctl.target.set(IW * .5, .8, ID * .5); camera.position.set(IW * .5 + big * .75, big * .75, ID * .5 + big * .95);
    ctl.minDistance = 2; ctl.maxDistance = big * 3; anim.t = 1;
    // fit the whole room and every device into the part of the screen the details panel does not cover
    const pts = []; for (const x of [0, IW]) for (const y of [0, WH]) for (const z of [0, ID]) pts.push(new THREE.Vector3(x, y, z));
    S.devs.forEach(p => pts.push(new THREE.Vector3(p.x, p.z + .7, p.y)));   // the room and its own devices (badges outside may fall off the edge)
    fitView(pts, { x0: 30, x1: innerWidth - (innerWidth > 820 ? 480 : 30), y0: 170, y1: innerHeight - (innerWidth > 820 ? 140 : 260) });
  }
  // keep the viewing angle, but move and zoom the camera so all the points fit inside a screen rectangle
  // (the part of the screen the panels leave free): fit their bounding sphere, then offset it once
  function fitView(pts, vis) {
    const sph = new THREE.Box3().setFromPoints(pts).getBoundingSphere(new THREE.Sphere());
    const dir = camera.position.clone().sub(ctl.target).normalize(), vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
    const ang = Math.min(Math.atan(Math.tan(vh) * (vis.y1 - vis.y0) / innerHeight), Math.atan(Math.tan(hh) * (vis.x1 - vis.x0) / innerWidth));
    const dist = sph.radius / Math.sin(ang) * .8;
    ctl.target.copy(sph.center); camera.position.copy(sph.center).addScaledVector(dir, dist); camera.updateMatrixWorld();
    const wpp = 2 * dist * Math.tan(vh) / innerHeight, dx = (vis.x0 + vis.x1 - innerWidth) / 2, dy = (vis.y0 + vis.y1 - innerHeight) / 2;
    const shift = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(-dx * wpp).add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).multiplyScalar(dy * wpp));
    ctl.target.add(shift); camera.position.add(shift);
    ctl.maxDistance = Math.max(ctl.maxDistance, dist * 1.6); ctl.minDistance = Math.min(ctl.minDistance, 2);
  }
  function devSprite(d) {
    const key = d.icon + d.cat;
    if (!devSprite.cache[key]) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), k = CAT[d.cat] ? CAT[d.cat].c : '#1e88e5';
      x.fillStyle = '#fff'; x.strokeStyle = k; x.lineWidth = 6; x.beginPath(); x.roundRect(5, 5, 54, 54, 14); x.fill(); x.stroke();
      x.font = '34px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(d.icon, 32, 35);
      const dt2 = new THREE.CanvasTexture(c); dt2.encoding = THREE.sRGBEncoding;
      devSprite.cache[key] = new THREE.SpriteMaterial({ map: dt2, sizeAttenuation: false, depthTest: false, transparent: true });
    }
    const s = new THREE.Sprite(devSprite.cache[key]); s.scale.set(.026, .026, 1); s.renderOrder = 11; return s;
  }
  devSprite.cache = {};
  // what the 2D room loop draws, as one list for the capture
  function interiorDraw(o) {
    if (o.vis && !o.vis()) return;
    if (o.t === 'box') drawBox(o.o);
    else if (o.t === 'person') drawPerson(o);
    else if (o.t === 'head') drawHead(o.x, o.y, o.z, o.skin);
    else if (o.t === 'fn') o.draw();
    else if (o.t === 'plant') { drawBox({ x0: o.x - .22, y0: o.y - .22, x1: o.x + .22, y1: o.y + .22, h: .4, color: '#b0bec5' }); rec.s.push({ x: o.x, y: o.y, z: .85, r: .35, color: '#4c8a35' }); }
    else if (o.t === 'clamp') { line(P(o.x, o.y, Math.max(0, o.z - .7)), P(o.x, o.y, o.z + .7), '#263238', 2); drawBox({ x0: o.x - .1, y0: o.y - .1, x1: o.x + .1, y1: o.y + .1, z0: o.z - .12, h: .24, color: '#ffffff' }); }
    else if (o.t === 'ceil') { line(P(o.x, o.y, o.z + .1), P(o.x, o.y, 3.6), '#8a949e', 2); drawBox({ x0: o.x - .28, y0: o.y - .2, x1: o.x + .28, y1: o.y + .2, z0: o.z - .07, h: .17, color: '#ffffff' }); }
  }
  function renderInterior() {
    if (cityView === null || !IN || IN.zone !== curZone) buildInterior();
    const list = [...curInt.objs, ...walkers.map(w => Object.assign({ t: 'person' }, w))];
    const r = capture(list, interiorDraw);
    fillBoxes(IN.boxes, r.b); fillCyl(IN.cyl, r.c, r.l); fillSph(IN.sph, r.s);
    IN.sprites.forEach(s => {
      if (!s.userData.tag) { s.visible = showDev; s.scale.setScalar(selDev === s.userData.dev ? .036 : .026); }
      else s.visible = showDev && (!IN.big || s.userData.dev === selDev || s.userData.dev === hoverDev);   // big rooms: a name only for the device you point at, so tags never pile up
    });
    if (IN.links) { IN.links.tube.visible = IN.links.dots.visible = showDev; moveDots(IN.links); }
    ctl.autoRotate = false; ctl.update();
    R.shadowMap.needsUpdate = true;
    R.render(IN.s3, camera);
  }
  function leaveInterior() {   // back outside: the city camera returns
    if (!cityView) return;
    ctl.target.copy(cityView.t); camera.position.copy(cityView.p); ctl.minDistance = cityView.min; ctl.maxDistance = cityView.max; cityView = null;
    seen.tx = NaN;   // re-sync with the 2D camera target without animating from the room
  }

  // Transport uses shared native geometry and the existing simulation clocks.
  function buildVehicles() { details.buildModels(); }

  // ---------- the real warehouse, inside the dashboard ----------
  // Going inside the Logistics Hub opens Warehouse Command 3D in a full-screen layer over the map.
  let whLayer = null;
  function openWarehouse() {
    closePanel();
    if (!whLayer) {
      whLayer = document.createElement('div'); whLayer.id = 'whLayer';
      whLayer.innerHTML = '<iframe src="warehouse-3d/?embed=1" title="Warehouse Command 3D" allow="fullscreen"></iframe><button class="backcity" id="whBack">⬅ Back to city <span>· inside the Airport Logistics Hub</span></button>';
      document.body.appendChild(whLayer);
      whLayer.querySelector('#whBack').onclick = closeWarehouse;
    }
    whLayer.hidden = false; document.body.classList.add('in-warehouse');
  }
  function closeWarehouse() { if (!whLayer) return; whLayer.hidden = true; document.body.classList.remove('in-warehouse'); show('warehouse', false, true); }
  // the warehouse has its own "Back to city" button; ours shows only if the warehouse page fails to load
  addEventListener('message', e => { if (e.data === 'warehouse:close') closeWarehouse(); if (e.data === 'warehouse:ready' && whLayer) whLayer.classList.add('ready'); });
  const _enterInside = enterInside;
  enterInside = function (zone, ...rest) { if (scenic) setScenic(false); if ((zone || sel) === 'warehouse') return openWarehouse(); return _enterInside(zone, ...rest); };
  const warehouseOpen = () => !!whLayer && !whLayer.hidden;

  // ---------- per frame ----------
  function followCam() {
    const now = performance.now();
    if (cam.tx !== seen.tx || cam.ty !== seen.ty || cam.tz !== seen.tz) {
      const first = isNaN(seen.tx);
      seen.tx = cam.tx; seen.ty = cam.ty; seen.tz = cam.tz;
      if (!first) { anim.t = 0; anim.from = ctl.target.clone(); anim.to = new THREE.Vector3(cam.tx, 0, cam.ty); anim.d0 = camera.position.distanceTo(ctl.target); anim.d1 = Math.max(6, Math.min(260, 92 / cam.tz)); }
    }
    if (anim.t < 1) {
      anim.t = Math.min(1, anim.t + Math.min(.05, (performance.now() - (anim.last || 0)) / 1000) / 1.1); const k = anim.t * anim.t * (3 - 2 * anim.t);
      const dir = camera.position.clone().sub(ctl.target).normalize();
      ctl.target.lerpVectors(anim.from, anim.to, k);
      camera.position.copy(ctl.target).addScaledVector(dir, anim.d0 + (anim.d1 - anim.d0) * k);
    }
    anim.last = now;
  }
  let lastR = 0, lastShadow = 0;
  function render() {
    if (!ready) return;
    if (canvas.style.display !== 'block') canvas.style.display = 'block';
    const now = performance.now(), dt = Math.min(.1, (now - (lastR || now)) / 1000); lastR = now;
    if (scene === 'inside') { renderInterior(); return; }
    if (cityView) leaveInterior();
    updateConnections(); updateFlow(dt);
    // moving things
    const dyn = capture([...objs.filter(o => (MOVING.has(o.t) && o.t !== 'train' && o.t !== 'wtruck') || (o.hide && !CUSTOM.has(o.t))), ...entities()]);
    details.update(time, night, dt);
    fillBoxes(dynBoxes, dyn.b, dynZones); fillCyl(dynCyl, dyn.c, dyn.l); fillSph(dynSph, dyn.s);
    // traffic lights
    const tc = tlLights.mesh.instanceColor.array, LC = { r: [1, .043, .030], y: [1, .604, 0], g: [.033, .571, .100] };   // linear-space red / amber / green
    tlLights.list.forEach((o, i) => { const c = LC[lightState(o.ax)] || LC.r; tc[i * 3] = c[0]; tc[i * 3 + 1] = c[1]; tc[i * 3 + 2] = c[2]; });
    tlLights.mesh.instanceColor.needsUpdate = true;
    blades.forEach(b => { b.rotation.z = -(time * 1.8 + b.userData.id); });
    devSprites.forEach(s => { s.visible = showDev; const a = selDev === s.userData.dev; s.scale.setScalar(a ? .03 : .02); });
    devTags.forEach(t => { t.visible = showDev && (t.userData.zone === sel || t.userData.dev === selDev || t.userData.dev === hoverDev); });   // names for the place you opened
    pinSprites.forEach(s => { s.visible = !scenic; });
    if (scenic) {
      devSprites.forEach(s => { s.visible = false; }); devTags.forEach(s => { s.visible = false; });
      for (const set of [linkSet, linkHi, routeSet, wireSet]) if (set) set.tube.visible = set.dots.visible = false;
      flow.sm.visible = flow.cm.visible = false;
    } else {
      routeSet.tube.visible = routeSet.dots.visible = true;
      if (wireSet) wireSet.tube.visible = wireSet.dots.visible = true;
      if (linkHi) linkHi.tube.visible = linkHi.dots.visible = showDev;
    }
    // light, sky and weather
    const n = night, wx = WX.k || 0;
    night3.value = n;
    surfaceTime.value = time; surfaceRain.value = wx;
    bg.copy(DAY).lerp(STORM, wx * .7).lerp(NIGHT, n); scn.background = bg; scn.fog.color.copy(bg).convertSRGBToLinear();   // fog is lit in linear space, the sky is not
    hemi.intensity = (.62 - .42 * n) * (1 - .3 * wx) + (WX.flash || 0) * 1.5; hemi.color.lerpColors(HEMI_D, HEMI_N, n);
    sun.intensity = (1.12 - .97 * n) * (1 - .55 * wx);
    lampGlow.mat.emissiveIntensity = n * 1.6; lampGlow.pools.opacity = n * .55;
    rain.material.opacity = wx * .55;
    if (wx > .02) {
      const p = rain.geometry.attributes.position.array, c = ctl.target, fall = 26 + 20 * wx, sd = rain.userData.seed;
      for (let i = 0; i < sd.length; i++) {
        const [a, b, h] = sd[i], x = c.x + (a - .5) * 80, z = c.z + (b - .5) * 80, y = 30 - ((time * fall * (.7 + h * .6) + h * 30) % 30);
        p.set([x, y, z, x + .15, y + .7, z], i * 6);
      }
      rain.geometry.attributes.position.needsUpdate = true;
    }
    ctl.autoRotate = autoRot && !rotHold && performance.now() > rotPauseUntil && anim.t >= 1;
    followCam();
    ctl.update();
    // Sun projection is fixed. Refresh moving shadows at 12 Hz instead of redrawing
    // the entire 4096px world shadow map on every animation frame.
    if (now - lastShadow > 80) { R.shadowMap.needsUpdate = true; lastShadow = now; }
    R.render(scn, camera);
  }

  // places that have no room of their own get a "Go inside" button for the room you would walk into
  const ROOM_LINK = { airport: ['airterminal', 'the terminal'], airstation: ['airterminal', 'the terminal'], rail: ['hub', 'the transport hub'], regionalgrid: ['substation', 'the substation'], powerstation: ['substation', 'the substation'], satkampung: ['sattown', 'a town home'] };
  Object.entries(ROOM_LINK).forEach(([z, [room, name]]) => {
    const T = TOPICS[z]; if (!T || !SCENES[room]) return; const prev = T.extra;
    T.extra = () => `<button class="tourbtn" data-room="${room}">🚪 Go inside ${name}</button>` + (prev ? prev() : '');
  });
  document.getElementById('panel').addEventListener('click', e => { const b = e.target.closest('[data-room]'); if (b) enterInside(b.dataset.room); });
  // "Go inside" sits right under the title of every place that has an inside, not at the bottom of a long panel
  const _show = show;
  show = function (id, ...rest) {
    _show(id, ...rest);
    const panel = document.getElementById('panel'), head = panel.querySelector('.p-head'), room = SCENES[id] ? id : ROOM_LINK[id] && SCENES[ROOM_LINK[id][0]] ? ROOM_LINK[id][0] : null;
    if (!head || !room) return;
    panel.querySelectorAll('[data-act="enter"], [data-room]').forEach(b => b.remove());
    head.insertAdjacentHTML('afterend', `<button class="tourbtn go-inside" data-room="${room}">🚪 Go inside · ${SCENES[room].title}</button>`);
  };

  // ---------- start: the 3D map opens with the page; the 2D canvas stays hidden until it is ready ----------
  document.body.classList.add('boot3d');
  libs().catch(() => {});   // start downloading three.js now, while the page finishes loading
  requestAnimationFrame(() => setTimeout(() => toggle(true), 0));   // build after the first frame, once every script has set up the world

  // called by the 2D frame loop: draws the 3D view and returns true, or hides it when the 2D map should show
  function frame3() { if (warehouseOpen()) return true;   // the embedded warehouse is on screen: the map rests
    if (active()) { render(); return true; } if (booting && !failed && scene === 'city' && !WALK.on) return true;   // skip 2D drawing while the 3D map loads
 if (canvas && canvas.style.display !== 'none') canvas.style.display = 'none'; return false; }

  // for tests: the screen pixel of a building of this place that a click there really picks (tallest first)
  function zoneTarget(z) {
    const cand = []; staticZones.forEach((zz, i) => { if (zz === z) { staticBoxes.getMatrixAt(i, M4); const pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); M4.decompose(pos, q, sc); cand.push({ pos, sc, v: sc.x * sc.y * sc.z }); } });
    cand.sort((a, b) => b.v - a.v);
    for (const { pos, sc } of cand.slice(0, 25)) for (const dy of [.5, .25, 0]) {
      const v = new THREE.Vector3(pos.x, pos.y + sc.y * dy, pos.z).project(camera), px = [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)];
      if (px[0] > 300 && px[0] < innerWidth - 300 && px[1] > 150 && px[1] < innerHeight - 150 && pick3(px[0], px[1]) === z) return px;
    }
    return null;
  }
  // for tests: every device icon in the open room, with its screen centre
  function roomDevices() {
    if (!IN) return [];
    const p11 = camera.projectionMatrix.elements[5];
    return IN.sprites.filter(s => !s.userData.tag && s.visible && DEV[s.userData.dev]).map(s => { const v = s.position.clone().project(camera); return { id: s.userData.dev, x: Math.round((v.x + 1) / 2 * innerWidth), y: Math.round((1 - v.y) / 2 * innerHeight) }; });
  }
  // for tests: map point → screen pixel, and what a click at a pixel would pick
  const project = (x, y, z) => { const v = new THREE.Vector3(x, z, y).project(camera); return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)]; };
  // for tests: what the room shows, and whether every connection line is sound
  const roomInfo = () => IN && { zone: IN.zone, devices: IN.sprites.filter(s => !s.userData.tag).length, things: IN.boxes.count, links: IN.links ? IN.links.paths.length : 0 };
  const bad = set => set ? set.paths.filter(p => p.pts.some(v => !isFinite(v.x + v.y + v.z))).length : 0;
  const lineInfo = () => linkSet && { links: linkSet.paths.length, offline: linkSet.paths.filter(p => p.dead).length, broken: bad(linkSet) + bad(routeSet), routes: routeSet.paths.length, roomBroken: IN ? bad(IN.links) : 0 };
  return { frame: frame3, active, render, toggle, get room() { return roomInfo(); }, get lines() { return lineInfo(); }, project, pickAt: (x, y) => pick3(x, y), _cam: () => ({ ctl, camera }), pinCentre, zoneTarget, roomDevices, get view() { return ctl && { target: ctl.target.toArray().map(v => +v.toFixed(1)), dist: +camera.position.distanceTo(ctl.target).toFixed(1), anim: anim.t }; }, get detailStats() { return details && details.stats; }, get stats() { return R && { calls: R.info.render.calls, triangles: R.info.render.triangles }; }, get ready() { return ready; }, get on() { return on; }, get failed() { return failed; } };
})();
