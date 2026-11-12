// The 3D film: a three.js factory corner (motor + Wilcoxon 883M, DIN cabinet with the IRIV IO Controller,
// relay, beacon, ACK button, MultiViz screen) filmed by a moving camera, with 2D titles on top.
// Every frame is a pure function of time t, so tools/build-iriv-videos.cjs can encode it with the narration.
// Scene ids and timings come from narration.js; alarm timings match the firmware's latch (DO0 latched, DI1 acknowledges).

const FW = 1920, FH = 1080, FPS = 30;
const FONT = 'Inter, "Segoe UI", system-ui, sans-serif', MONO = 'ui-monospace, Consolas, monospace';
const INK = '#1d1d1f', ACCENT = '#f56300';
const clamp = v => Math.max(0, Math.min(1, v)), ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- scenes: text, overlays and camera keys [fraction, position, target] ---------- */
const SENSOR = V3(-1.1, 0.68, 0.2), IOC_C = V3(0.8, 1.36, -0.412), HOLO = V3(-0.3, 2.05, -0.45), DASH = V3(-0.45, 1.45, 0.55), BTN = V3(1.3, 1.0, -0.24), RELAY = V3(1.02, 1.36, -0.43), BEACON = V3(1.22, 1.86, -0.4);
const SCENE_DEFS = {
  intro: { kicker: 'Vibration monitor', title: 'Motor vibration, on MQTT.', keys: [[0, V3(2.9, 1.8, 3.6), V3(-0.2, 1.1, -0.2)], [1, V3(-0.9, 1.45, 3.5), V3(0.0, 1.15, -0.2)]] },
  overview: { kicker: 'Three parts', title: 'Sense. Bridge. Analyse.', keys: [[0, V3(0.4, 2.3, 4.3), V3(-0.1, 1.2, -0.2)], [1, V3(0.1, 2.1, 3.9), V3(-0.1, 1.25, -0.2)]],
    callouts: [[SENSOR, 'Sense · Wilcoxon 883M', '#8e44ad'], [IOC_C, 'Bridge · IRIV IO Controller', ACCENT], [HOLO, 'Analyse · Viking Analytics', '#0a84ff']] },
  chain: { kicker: 'How it flows', title: 'Motor to MultiViz.', keys: [[0, V3(-0.8, 0.98, 0.7), SENSOR], [0.36, V3(-0.62, 0.85, 0.85), V3(-0.98, 0.5, 0.42)], [0.5, V3(-0.1, 1.0, 1.9), V3(0.55, 0.75, -0.3)], [0.74, V3(1.0, 1.45, 0.35), IOC_C], [0.86, V3(0.4, 1.8, 1.7), V3(0.1, 1.8, -0.4)], [1, V3(-0.2, 2.05, 1.55), HOLO]] },
  sensor: { kicker: 'The sensor', title: 'Wilcoxon 883M.', chips: ['X · Y · Z', '±16 g', '2 Hz – 5 kHz', 'IP67', 'Modbus RTU'], keys: [[0, V3(-0.86, 0.79, 0.44), SENSOR], [1, V3(-1.3, 0.8, 0.46), SENSOR]] },
  rs485: { kicker: 'Wiring · RS485', title: '883M on the RS485 port.', chips: ['A → A', 'B → B', 'Ground → G', '120 Ω ON'], keys: [[0, V3(0.95, 1.38, -0.12), V3(0.8, 1.38, -0.4)], [1, V3(0.88, 1.33, -0.15), V3(0.8, 1.38, -0.4)]],
    callouts: [['term', 1, 'top', 1, 'A', '#0a8a8f'], ['term', 1, 'top', 2, 'B', '#0a8a8f'], ['term', 1, 'top', 3, 'G', '#0a8a8f']] },
  power: { kicker: 'Wiring · Power', title: 'One 24 V rail.', chips: ['V+ 24 V', 'V− 0 V', '883M on the same rail'], keys: [[0, V3(0.66, 1.42, -0.05), V3(0.66, 1.38, -0.42)], [1, V3(0.72, 1.45, -0.02), V3(0.68, 1.38, -0.42)]],
    callouts: [[V3(0.55, 1.36, -0.39), '24 V DC supply', '#e5383b'], ['term', 1, 'top', 0, 'V+', '#e5383b'], ['term', 1, 'bottom', 0, 'V−', '#2a62c9']] },
  setup: { kicker: 'Gateway firmware', title: 'Set up in its own dashboard.', keys: [[0, V3(-0.2, 1.5, 2.15), DASH.clone().add(V3(0.24, 0, 0))], [1, V3(-0.08, 1.48, 2.0), DASH.clone().add(V3(0.24, 0, 0))]],
    cards: [['1 · Install', '#0a8a8f', [['Get', 'Web installer · .uf2'], ['Copy to', 'The RP2350 drive']]], ['2 · Connect', ACCENT, [['MQTT', 'Broker, port 1883'], ['Topic', '883M']]], ['3 · Alarm', '#e5383b', [['Limits', 'Velocity RMS, temp'], ['Output', 'DO0, latched']]]] },
  viking: { kicker: 'Viking Analytics', title: 'MultiViz does the analysis.', keys: [[0, V3(-0.45, 2.0, 0.85), HOLO], [1, V3(-0.15, 2.05, 0.75), HOLO]] },
  do: { kicker: 'Alarm', title: 'DO0 drives the relay.', chips: ['DO0 → relay coil', 'Latched', 'Beacon + buzzer'], keys: [[0, V3(1.1, 2.05, 0.75), V3(1.0, 1.55, -0.42)], [1, V3(0.95, 2.0, 0.68), V3(1.0, 1.57, -0.42)]],
    callouts: [['term', 2, 'top', 0, 'DO0', ACCENT], [RELAY, '24 V relay', ACCENT], [BEACON, 'Beacon + buzzer', '#e5383b']] },
  di: { kicker: 'Alarm', title: 'DI1 acknowledges.', chips: ['DI1 ← ACK button', 'DI0 → capture', 'S/S common'], keys: [[0, V3(1.62, 1.08, 0.3), BTN], [1, V3(1.48, 1.12, 0.22), BTN]],
    callouts: [[BTN.clone().add(V3(0, 0, 0.06)), 'ACK · DI1', '#0a84ff']] },
  alarm: { kicker: 'See it work', title: 'Trip. Flash. Acknowledge.', keys: [[0, V3(-0.1, 1.45, 2.7), V3(-0.15, 1.0, -0.2)], [0.42, V3(0.7, 1.85, 2.0), V3(1.0, 1.45, -0.35)], [1, V3(0.55, 1.82, 2.15), V3(0.95, 1.43, -0.35)]] },
  rule: { kicker: 'The alarm rule', title: 'It runs on the controller.', keys: [[0, V3(2.0, 1.55, 1.2), V3(0.9, 1.3, -0.4)], [1, V3(0.0, 1.55, 1.45), V3(0.9, 1.3, -0.4)]],
    cards: [['Trip', '#e5383b', [['When', 'Velocity or temp high'], ['For', 'The set delay'], ['Then', 'DO0 on, latched']]], ['Clear', '#1a9e45', [['Press', 'DI1, USER or web'], ['And', 'Reading back to normal'], ['Then', 'DO0 off']]]] },
  outro: { kicker: 'IRIV IOC · Wilcoxon 883M · Viking Analytics', title: 'Sense. Analyse. Act.', keys: [[0, V3(0.5, 1.6, 3.1), V3(-0.2, 0.95, -0.2)], [1, V3(0.2, 3.3, 5.6), V3(-0.2, 0.9, -0.2)]] }
};
let acc = 0;
const SCENES = NARRATION.scenes.map(n => { const d = SCENE_DEFS[n.id]; if (!d) throw Error('No 3D shot for scene ' + n.id); const s = { ...d, id: n.id, body: n.display || '', t0: acc, d: n.duration }; acc += n.duration; return s; });
const TOTAL = acc;
const sceneAt = t => { let i = SCENES.length - 1; while (i > 0 && SCENES[i].t0 > t) i--; return i; };

// Alarm sequence inside the 'alarm' scene (seconds from its start); matches the narration cues.
const T_OVER = 2.9, T_TRIP = 5.6, T_ACK = 12.4, T_CLEAR = 17.7, LIMIT = 4.5;
const alVel = u => (u < 1 ? 2.2 : u < 4 ? 2.2 + 3.4 * ease((u - 1) / 3) : u < 16.6 ? 5.6 : 5.6 - 3.6 * ease((u - 16.6) / 3)) + .08 * Math.sin(u * 3.1);

/* ---------- the world ---------- */
let R, scene, camera, W = {};
const IMGS = {};
const loadImg = (k, src) => new Promise((ok, fail) => { const im = new Image(); im.onload = () => { IMGS[k] = im; ok(); }; im.onerror = () => fail(Error('Missing image ' + src)); im.src = src; });
const filmReady = Promise.all([
  loadImg('front', '../short-video-of-iriv-ioc/images/front.webp'),
  document.fonts ? Promise.all(['500', '600', '700', '800'].map(w => document.fonts.load(`${w} 40px Inter`))).catch(() => {}) : null
]).then(build);

function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.encoding = THREE.sRGBEncoding; t.userData = { g, w, h, draw }; return t; }
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, metalness: .1, envMapIntensity: (o.metalness || 0) > .5 ? .7 : .12, ...o });   // RoomEnvironment is bright: plastics would wash out
function mesh(geo, m, pos, parent = scene, rot) { const x = new THREE.Mesh(geo, m); x.position.copy(pos); if (rot) x.rotation.set(...rot); x.castShadow = x.receiveShadow = true; parent.add(x); return x; }
function tube(points, color, r = .007, segments = 160) { const curve = new THREE.CatmullRomCurve3(points); const m = mat(color, { roughness: .45, emissive: color, emissiveIntensity: 0 }); const x = mesh(new THREE.TubeGeometry(curve, segments, r, 8), m, V3(0, 0, 0)); return { curve, mesh: x, mat: m }; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// Scene scale: the cabinet and its parts are modelled at 2× real size (IRIV 140 × 60 × 36 mm → 0.28 × 0.12 × 0.072),
// so close-ups stay readable; proportions follow the IRIV datasheet.
const IOC_W = .072, IOC_H = .28, IOC_D = .12, IOC_TOP = IOC_C.y + IOC_H / 2, IOC_FRONT = IOC_C.z + IOC_D / 2, TB_FRONT = IOC_FRONT + .031;
// The source front image is portrait in model space. Turn the assembly so the
// installed controller has the real 140 × 60 × 36 mm landscape proportions.
const iocPoint = p => {
  const dx = p.x - IOC_C.x, dy = p.y - IOC_C.y, dz = p.z - IOC_C.z;
  return V3(IOC_C.x - dy, IOC_C.y + dx * (5 / 3), IOC_C.z + dz * .6);
};
const iocPart = (geo, material, position) => {
  const part = mesh(geo, material, iocPoint(position));
  part.rotation.z = Math.PI / 2; part.scale.set(5 / 3, 1, .6);
  return part;
};
// A terminal on the front blocks: block 1 = V+, A, B, G, AGND, AGND, AN0, AN1 (row 'top') and V−, DGND, S/S, DI0–DI4 ('bottom');
// block 2 = DO0–DO3 pairs ('top') and DGND, S/S, DI5–DI10 ('bottom'). Positions follow Cytron's front-panel photo.
function termPortrait(block, row, k) {
  const y0 = block === 1 ? IOC_TOP - .393 * IOC_H : IOC_TOP - .607 * IOC_H, len = (block === 1 ? .196 : .205) * IOC_H;
  return V3(IOC_C.x - IOC_W / 2 + (row === 'top' ? .0255 : .0105), y0 - (k + .5) * len / 8, TB_FRONT);
}
const term = (block, row, k) => iocPoint(termPortrait(block, row, k));
const iocFace = (fx, fy) => iocPoint(V3(IOC_C.x - IOC_W / 2 + fx * IOC_W, IOC_TOP - fy * IOC_H, IOC_FRONT + .001));

function glowSprite(color, size) {
  if (!W.glowTex) W.glowTex = canvasTex(128, 128, (g, w) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  s.scale.setScalar(size); scene.add(s); return s;
}
const rbox = (w, h, d, r = .004, seg = 3) => new THREE.RoundedBoxGeometry(w, h, d, seg, r);

function build() {
  const cv = document.createElement('canvas'); cv.width = FW; cv.height = FH;
  R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
  R.setSize(FW, FH, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  R.outputEncoding = THREE.sRGBEncoding; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .9;
  scene = new THREE.Scene(); scene.background = new THREE.Color('#141a24'); scene.fog = new THREE.Fog('#141a24', 7, 16);
  const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(new THREE.RoomEnvironment(), .04).texture;   // studio reflections on metal and plastic
  camera = new THREE.PerspectiveCamera(36, FW / FH, .01, 40);

  scene.add(new THREE.HemisphereLight('#c8d8ff', '#20180f', .25));
  const key = new THREE.DirectionalLight('#fff1dc', 1.6); key.position.set(3, 5, 4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -2, near: 1, far: 15 }); key.shadow.bias = -.0004; key.shadow.normalBias = .01; scene.add(key);
  const rim = new THREE.DirectionalLight('#86b6ff', .5); rim.position.set(-4, 3, -3); scene.add(rim);
  for (const x of [-1.2, 0.9]) { const p = new THREE.SpotLight('#ffffff', 1.1, 7, .55, .7, 1.5); p.position.set(x, 3.6, 1.2); p.target.position.set(x, 0.6, -0.2); scene.add(p, p.target); }   // overhead high-bays

  // polished concrete floor, painted block wall with a cable tray and conduit
  const floorTex = canvasTex(1024, 1024, g => { g.fillStyle = '#5b5f66'; g.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 9000; i++) { const c = 70 + Math.random() * 60 | 0; g.fillStyle = `rgba(${c},${c},${c + 6},${Math.random() * .12})`; g.fillRect(Math.random() * 1024, Math.random() * 1024, 1 + Math.random() * 3, 1 + Math.random() * 3); } g.strokeStyle = 'rgba(20,20,24,.5)'; g.lineWidth = 2; for (let k = 0; k <= 1024; k += 512) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 1024); g.moveTo(0, k); g.lineTo(1024, k); g.stroke(); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(5, 5);
  mesh(new THREE.PlaneGeometry(20, 20), mat('#ffffff', { map: floorTex, roughness: .38, metalness: 0, envMapIntensity: .35 }), V3(0, 0, 0), scene, [-Math.PI / 2, 0, 0]);
  const wallTex = canvasTex(1024, 512, g => { g.fillStyle = '#6d7480'; g.fillRect(0, 0, 1024, 512); g.strokeStyle = 'rgba(40,44,52,.55)'; g.lineWidth = 3; for (let y = 0; y < 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); for (let x = (y / 64) % 2 ? 0 : 64; x < 1024; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); } } for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .06})`; g.fillRect(Math.random() * 1024, Math.random() * 512, 2, 2); } });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(6, 3);
  mesh(new THREE.PlaneGeometry(20, 6), mat('#ffffff', { map: wallTex, roughness: .92 }), V3(0, 3, -0.56));
  mesh(new THREE.BoxGeometry(20, .14, .01), mat('#d4a000', { roughness: .6 }), V3(0, .07, -0.554));
  mesh(new THREE.PlaneGeometry(3.4, .1), mat('#d4a000', { roughness: .5 }), V3(-1.4, .002, .95), scene, [-Math.PI / 2, 0, 0]);
  const galv = mat('#aab1ba', { metalness: .9, roughness: .38 });
  mesh(new THREE.BoxGeometry(6, .015, .3), galv, V3(0, 2.75, -0.4)); for (const z of [-0.55, -0.25]) mesh(new THREE.BoxGeometry(6, .08, .01), galv, V3(0, 2.79, z));
  mesh(new THREE.CylinderGeometry(.018, .018, 6, 16), galv, V3(0, 2.5, -0.52), scene, [0, 0, Math.PI / 2]);

  // motor (TEFC frame, fan cowl, lifting eye, nameplate, terminal box) + coupling guard + pump, in a group so it can vibrate
  const motor = W.motor = new THREE.Group(); scene.add(motor);
  const blue = mat('#2c5d8e', { metalness: .3, roughness: .42 }), steel = mat('#c4cad3', { metalness: .9, roughness: .25 }), dark = mat('#20262e', { metalness: .5, roughness: .45 });
  mesh(new THREE.CylinderGeometry(.215, .215, .62, 48), blue, V3(-1.45, .42, .2), motor, [0, 0, Math.PI / 2]);
  for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; if (Math.sin(a) < -.75) continue; mesh(rbox(.56, .045, .01, .003, 2), blue, V3(-1.45, .42 + Math.sin(a) * .232, .2 + Math.cos(a) * .232), motor, [a, 0, 0]); }
  mesh(new THREE.CylinderGeometry(.215, .225, .07, 48), blue, V3(-1.1, .42, .2), motor, [0, 0, Math.PI / 2]);   // drive-end bracket
  mesh(new THREE.CylinderGeometry(.215, .225, .05, 48), blue, V3(-1.785, .42, .2), motor, [0, 0, Math.PI / 2]);
  const grille = canvasTex(256, 256, (g, w) => { g.fillStyle = '#1b1f25'; g.fillRect(0, 0, w, w); g.fillStyle = '#05070a'; for (let r = 18; r < 128; r += 14) for (let a = 0; a < Math.PI * 2; a += 9 / r) { g.beginPath(); g.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 3.4, 0, 7); g.fill(); } });
  mesh(new THREE.CylinderGeometry(.22, .22, .16, 48, 1, false), [blue, mat('#ffffff', { map: grille, metalness: .5, roughness: .5 }), blue], V3(-1.89, .42, .2), motor, [0, 0, Math.PI / 2]);   // fan cowl
  mesh(new THREE.CylinderGeometry(.032, .032, .3, 24), steel, V3(-0.92, .42, .2), motor, [0, 0, Math.PI / 2]);
  mesh(new THREE.TorusGeometry(.03, .009, 12, 24), steel, V3(-1.45, .68, .2), motor, [0, Math.PI / 2, 0]);   // lifting eye
  mesh(rbox(.17, .1, .12, .01), blue, V3(-1.48, .5, .44), motor);   // terminal box
  mesh(new THREE.CylinderGeometry(.018, .02, .03, 16), dark, V3(-1.48, .5, .515), motor, [Math.PI / 2, 0, 0]);   // cable gland
  const plateTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#d9dde2'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.font = '700 20px ' + FONT; g.fillText('3~ MOTOR  IE3', 14, 30); g.font = '500 15px ' + MONO; ['7.5 kW   1460 r/min', '400 V Δ   14.2 A', 'IP55   cos φ 0.84'].forEach((l, i) => g.fillText(l, 14, 60 + i * 22)); });
  mesh(new THREE.PlaneGeometry(.12, .06), mat('#fff', { map: plateTex, metalness: .6, roughness: .35 }), V3(-1.62, .42, .418), motor, [0, 0, 0]);
  mesh(rbox(.72, .05, .52, .01), dark, V3(-1.15, .025, .2), motor);   // baseplate
  for (const dx of [-.22, .22]) mesh(rbox(.1, .2, .44, .01), blue, V3(-1.45 + dx, .14, .2), motor);
  const guard = new THREE.CylinderGeometry(.09, .09, .22, 32, 1, true, 0, Math.PI);
  mesh(guard, mat('#e8b100', { roughness: .45, side: THREE.DoubleSide }), V3(-0.86, .42, .2), motor, [Math.PI / 2, 0, Math.PI / 2]);   // coupling guard
  // Cast centrifugal pump casing, bolted cover and bearing pedestal.
  const pumpPaint=mat('#24516c',{metalness:.25,roughness:.64});
  mesh(new THREE.CylinderGeometry(.205,.185,.18,64),pumpPaint,V3(-.62,.42,.2),motor,[0,0,Math.PI/2]);
  mesh(new THREE.CylinderGeometry(.17,.17,.025,64),pumpPaint,V3(-.515,.42,.2),motor,[0,0,Math.PI/2]);
  for(let k=0;k<8;k++){const a=k*Math.PI/4;mesh(new THREE.CylinderGeometry(.012,.012,.018,6),steel,V3(-.495,.42+Math.sin(a)*.145,.2+Math.cos(a)*.145),motor,[0,0,Math.PI/2]);}
  mesh(rbox(.3,.16,.35,.018),pumpPaint,V3(-.62,.13,.2),motor);
  mesh(rbox(1.7,.055,.60,.012),dark,V3(-1.2,.035,.2),motor);
  // Discharge riser, gasket joint, flange bolts and pipe support.
  mesh(new THREE.CylinderGeometry(.055,.055,.42,32),pumpPaint,V3(-.62,.76,.2),motor);
  for(const y of [.82,.85])mesh(new THREE.CylinderGeometry(.095,.095,.018,48),steel,V3(-.62,y,.2),motor);
  mesh(new THREE.CylinderGeometry(.086,.086,.009,48),dark,V3(-.62,.835,.2),motor);
  for(let k=0;k<8;k++){const a=k*Math.PI/4;mesh(new THREE.CylinderGeometry(.007,.007,.055,6),steel,V3(-.62+Math.cos(a)*.077,.835,.2+Math.sin(a)*.077),motor);}
  // Motor end-shield bolts and a separate terminal-box lid.
  for(let k=0;k<6;k++){const a=k*Math.PI/3;mesh(new THREE.CylinderGeometry(.009,.009,.018,6),steel,V3(-1.057,.42+Math.sin(a)*.18,.2+Math.cos(a)*.18),motor,[0,0,Math.PI/2]);}
  mesh(rbox(.18,.012,.13,.006),blue,V3(-1.48,.556,.44),motor);
  for(const x of [-1.55,-1.41])for(const z of [.395,.485])mesh(new THREE.CylinderGeometry(.005,.005,.008,6),steel,V3(x,.565,z),motor);
  mesh(new THREE.CylinderGeometry(.1, .1, .12, 32), mat('#3d6b8f', { metalness: .45, roughness: .4 }), V3(-0.62, .42, .2), motor, [0, 0, Math.PI / 2]);
  mesh(new THREE.CylinderGeometry(.06, .06, .55, 24), steel, V3(-0.62, .42, .52), motor, [Math.PI / 2, 0, 0]);
  mesh(new THREE.CylinderGeometry(.09, .09, .02, 24), steel, V3(-0.62, .42, .79), motor, [Math.PI / 2, 0, 0]);
  // 883M on a spot face over the drive-end bearing, where a real one is mounted
  mesh(new THREE.CylinderGeometry(.045, .045, .03, 32), blue, V3(-1.1, .645, .2), motor);
  const s883 = W.s883 = new THREE.Group(); s883.position.set(-1.1, .66, .2); motor.add(s883);
  const topTex = canvasTex(512, 512, (g, w) => {
    g.fillStyle = '#111317'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#f0f1f2'; g.textAlign = 'center';
    // The slashed W and wordmark sit across the lid, as on the product reference.
    g.save(); g.translate(72, 238);
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(i * 17, -31); g.lineTo(i * 17 + 13, -31); g.lineTo(i * 17 + 32, 27); g.lineTo(i * 17 + 19, 27); g.closePath(); g.fill(); }
    g.restore();
    g.textAlign = 'left'; g.font = '700 66px ' + FONT; g.fillText('Wilcoxon', 145, 266);
    g.textAlign = 'center'; g.font = '500 19px ' + FONT; g.letterSpacing = '3px'; g.fillText('SENSING TECHNOLOGIES', 256, 302);
  });
  const sideTex883 = canvasTex(1024, 256, (g,w,h) => {
    g.fillStyle = '#70747a'; g.fillRect(0,0,w,h);
    g.fillStyle = '#cbd0d3'; g.font = '500 75px ' + FONT; g.fillText('CE', 170, 183);
    g.font = '600 25px ' + FONT; g.fillText('883M', 620, 165);
    g.font = '500 18px ' + FONT; g.fillText('X   Y   Z', 620, 195);
  });
  const shell = mat('#b0b4ba', { map: sideTex883, metalness: .28, roughness: .55, envMapIntensity: .07 });
  mesh(new THREE.CylinderGeometry(.035, .035, .006, 64), steel, V3(0, .003, 0), s883);
  // Four shallow wrench flats interrupt the round aluminium housing.
  const housing = new THREE.CylinderGeometry(.0345, .035, .042, 96, 1, true);
  const hp = housing.attributes.position;
  for (let i = 0; i < hp.count; i++) { hp.setX(i, Math.max(-.032,Math.min(.032,hp.getX(i)))); hp.setZ(i,Math.max(-.032,Math.min(.032,hp.getZ(i)))); }
  hp.needsUpdate = true; housing.computeVertexNormals();
  mesh(housing, shell, V3(0, .027, 0), s883);
  mesh(new THREE.CylinderGeometry(.0345, .0345, .003, 64), [shell, mat('#fff', { map: topTex, roughness: .58 }), shell], V3(0, .0495, 0), s883);
  mesh(new THREE.TorusGeometry(.034, .0006, 8, 64), mat('#16191d', { metalness: .35, roughness: .5 }), V3(0, .049, 0), s883, [Math.PI / 2, 0, 0]);
  mesh(new THREE.CylinderGeometry(.009, .009, .015, 24), steel, V3(.041, .028, 0), s883, [0, 0, Math.PI / 2]);
  mesh(new THREE.CylinderGeometry(.0065, .0065, .011, 24), mat('#17191d', { metalness: .3 }), V3(.052, .028, 0), s883, [0, 0, Math.PI / 2]);
  for (let i=0;i<7;i++) mesh(new THREE.TorusGeometry(.0091,.00035,6,32),steel,V3(.035+i*.0018,.028,0),s883,[0,Math.PI/2,0]);
  // Mated cable plug: captive coupling nut and a tapered, ribbed strain-relief boot.
  const cableRubber = mat('#20252a', { roughness: .86, metalness: 0 });
  mesh(new THREE.CylinderGeometry(.0105,.0105,.017,32),steel,V3(.050,.028,0),s883,[0,0,Math.PI/2]);
  for(let i=0;i<10;i++) mesh(new THREE.TorusGeometry(.0106,.00045,6,32),steel,V3(.043+i*.0014,.028,0),s883,[0,Math.PI/2,0]);
  mesh(new THREE.CylinderGeometry(.006,.009,.028,32),cableRubber,V3(.072,.028,0),s883,[0,0,-Math.PI/2]);
  for(let i=0;i<5;i++) mesh(new THREE.TorusGeometry(.0085-i*.00055,.0007,8,24),cableRubber,V3(.061+i*.005,.028,0),s883,[0,Math.PI/2,0]);
  mesh(new THREE.CylinderGeometry(.0052,.0052,.001,32),mat('#090b0d',{roughness:.6}),V3(.016,.0512,-.013),s883);
  W.sensorLed = mesh(new THREE.CylinderGeometry(.0027,.0027,.0005,24), new THREE.MeshBasicMaterial({ color: '#30d158' }), V3(.016, .0518, -.013), s883);
  W.axes = new THREE.Group(); s883.add(W.axes); W.axes.position.y = .055;
  [['#e5383b', V3(1, 0, 0)], ['#30d158', V3(0, 0, 1)], ['#0a84ff', V3(0, 1, 0)]].forEach(([c, d]) => W.axes.add(new THREE.ArrowHelper(d, V3(0, 0, 0), .11, c, .025, .014)));

  // enclosure: RAL 7035 body with an open door, galvanised mounting plate, DIN rail, slotted wire duct
  const ral = mat('#d5d7d6', { roughness: .5, metalness: .05 }), plateM = mat('#c3c8ce', { metalness: .75, roughness: .42 });
  mesh(rbox(1.0, 1.05, .02, .006), ral, V3(0.9, 1.25, -0.52));
  for (const dx of [-.5, .5]) mesh(rbox(.025, 1.05, .32, .008), ral, V3(0.9 + dx, 1.25, -0.37));
  for (const dy of [-.515, .515]) mesh(rbox(1.025, .025, .32, .008), ral, V3(0.9, 1.25 + dy, -0.37));
  const door = new THREE.Group(); door.position.set(0.39, 1.25, -0.21); door.rotation.y = -1.95; scene.add(door);
  mesh(rbox(1.0, 1.05, .025, .01), ral, V3(.5, 0, 0), door); mesh(rbox(.94, .99, .006, .004), mat('#2a2d31', { roughness: .8 }), V3(.5, 0, -.016), door);
  mesh(rbox(.025, .09, .03, .008), mat('#30343a', { metalness: .6, roughness: .3 }), V3(.95, 0, .025), door);
  mesh(rbox(.92, .97, .006, .003), plateM, V3(0.9, 1.25, -0.505));
  mesh(rbox(.86, .035, .008, .002), steel, V3(0.9, 1.36, -0.498));
  const ductBody = mat('#8f969f', { roughness: .55 });
  for (const y of [1.05, 1.66]) {
    mesh(new THREE.BoxGeometry(.86, .006, .06), ductBody, V3(0.9, y - .035, -0.47));
    const fingers = new THREE.InstancedMesh(new THREE.BoxGeometry(.008, .064, .06), ductBody, 54), m4 = new THREE.Matrix4();
    for (let i = 0; i < 54; i++) { m4.makeTranslation(0.475 + i * .016, y, -0.47); fingers.setMatrixAt(i, m4); } fingers.castShadow = fingers.receiveShadow = true; scene.add(fingers);
    mesh(rbox(.87, .008, .066, .002), ductBody, V3(0.9, y + .036, -0.47));
  }
  // DIN power supply: stepped profile, screw terminals top and bottom, DC OK LED
  const psuGrey = mat('#e3e4e6', { roughness: .45 });
  mesh(rbox(.1, .18, .06, .006), psuGrey, V3(0.55, 1.36, -0.46)); mesh(rbox(.1, .11, .04, .006), psuGrey, V3(0.55, 1.36, -0.41));
  const psuTex = canvasTex(256, 280, (g, w, h) => { g.fillStyle = '#e3e4e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b2f36'; g.font = '800 40px ' + FONT; g.fillText('24 V', 24, 70); g.font = '600 22px ' + FONT; g.fillText('DC POWER SUPPLY', 24, 104); g.fillText('2.5 A · 60 W', 24, 134); g.fillStyle = '#666'; g.fillText('DC OK', 24, 230); g.beginPath(); g.arc(196, 222, 14, 0, 7); g.fillStyle = '#9aa0a8'; g.fill(); });
  mesh(new THREE.PlaneGeometry(.096, .105), mat('#fff', { map: psuTex, roughness: .45 }), V3(0.55, 1.36, -0.3895));
  for (const dy of [-.072, .072]) for (let i = 0; i < 4; i++) { const sx = 0.517 + i * .022; mesh(rbox(.018, .02, .025, .002), mat('#3b4048', { roughness: .5 }), V3(sx, 1.36 + dy, -0.425)); mesh(new THREE.CylinderGeometry(.006, .006, .004, 16), steel, V3(sx, 1.36 + dy + (dy > 0 ? .011 : -.011), -0.425)); }
  W.psuLed = mesh(new THREE.SphereGeometry(.004, 10, 10), new THREE.MeshBasicMaterial({ color: '#30d158' }), V3(0.5795, 1.3285, -0.389));

  // IRIV IO Controller: black aluminium body, front from Cytron's photo, label on the side, DIN clip, 3D terminal blocks
  const faceTex = canvasTex(360, 1400, (g, w, h) => { g.fillStyle = '#07080a'; g.fillRect(0, 0, w, h); g.save(); g.translate(67 + 225, 0); g.rotate(Math.PI / 2); g.drawImage(IMGS.front, 114, 1061, 1800, 290, 0, 0, 1400, 225); g.restore(); });
  const sideTex = canvasTex(600, 1400, (g, w, h) => { g.fillStyle = '#07080a'; g.fillRect(0, 0, w, h); g.save(); g.translate(w, 0); g.rotate(Math.PI / 2); g.drawImage(IMGS.front, 900, 790, 920, 300, 520, 60, 820, 268); g.restore(); });
  const alu = mat('#0b0c0e', { metalness: .55, roughness: .32 });
  W.ioc = iocPart(rbox(IOC_W, IOC_H, IOC_D, .006, 4), [mat('#fff', { map: sideTex, metalness: .5, roughness: .35 }), alu, alu, alu, mat('#fff', { map: faceTex, metalness: .45, roughness: .35 }), alu], IOC_C);
  iocPart(rbox(.05, .1, .016, .003), mat('#16181b', { roughness: .6 }), V3(IOC_C.x, 1.36, IOC_C.z - IOC_D / 2 - .008));
  const tbM = mat('#070809', { roughness: .85, envMapIntensity: .04 }), lever = mat('#ff7a10', { roughness: .5, envMapIntensity: .06 }), hole = new THREE.MeshBasicMaterial({ color: '#030304' });
  for (const block of [1, 2]) {
    const a = termPortrait(block, 'top', 0), b = termPortrait(block, 'top', 7), len = a.y - b.y + .007;
    iocPart(rbox(.03, len, .031, .002), tbM, V3(IOC_C.x - IOC_W / 2 + .018, (a.y + b.y) / 2, IOC_FRONT + .0155));
    for (const row of ['top', 'bottom']) for (let k = 0; k < 8; k++) { const p = termPortrait(block, row, k); iocPart(new THREE.BoxGeometry(.0055, .0045, .004), lever, p.clone().add(V3(0, .0018, .001))); iocPart(new THREE.CircleGeometry(.0018, 12), hole, p.clone().add(V3(0, -.0016, .0031))); }
  }
  W.do0Led = mesh(new THREE.SphereGeometry(.0016, 10, 10), new THREE.MeshBasicMaterial({ color: '#3a2a10' }), iocFace(.3125, .273));
  const rj = iocFace(.556, .884); mesh(rbox(.016, .014, .03, .002), mat('#c9ced6', { roughness: .4 }), rj.clone().add(V3(0, 0, .015)));   // RJ45 plug
  W.iocFace = iocFace; W.term = term;

  // DIN relay: grey socket, clear blue relay with its coil LED
  mesh(rbox(.032, .11, .05, .003), mat('#b9bec5', { roughness: .5 }), RELAY.clone().add(V3(0, 0, -.04)));
  mesh(rbox(.028, .06, .04, .003), new THREE.MeshPhysicalMaterial({ color: '#3b78d8', transparent: true, opacity: .72, roughness: .15, metalness: 0, transmission: 0 }), RELAY.clone().add(V3(0, .005, 0)));
  W.relayLed = mesh(new THREE.SphereGeometry(.004, 10, 10), new THREE.MeshBasicMaterial({ color: '#331010' }), RELAY.clone().add(V3(0, .044, .002)));

  // ACK push-button station and stack-light beacon
  const yellow = mat('#e8b100', { roughness: .4 });
  mesh(rbox(.09, .1, .07, .01), yellow, BTN);
  mesh(rbox(.03, .12, .02, .004), plateM, BTN.clone().add(V3(-.06, 0, -.03)));
  mesh(new THREE.CylinderGeometry(.034, .034, .008, 32), mat('#2a2d33', { metalness: .6, roughness: .3 }), BTN.clone().add(V3(0, 0, .037)), scene, [Math.PI / 2, 0, 0]);
  W.btn = mesh(new THREE.CylinderGeometry(.026, .028, .022, 32), mat('#0a6fd6', { roughness: .3, emissive: '#0a6fd6', emissiveIntensity: .05 }), BTN.clone().add(V3(0, 0, .045)), scene, [Math.PI / 2, 0, 0]);
  const btnTex = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '800 40px ' + FONT; g.textAlign = 'center'; g.fillText('ACK', w / 2, 46); });
  mesh(new THREE.PlaneGeometry(.06, .015), new THREE.MeshBasicMaterial({ map: btnTex }), BTN.clone().add(V3(0, -.04, .036)));
  mesh(new THREE.CylinderGeometry(.032, .036, .05, 32), mat('#2a2d33', { metalness: .4, roughness: .4 }), BEACON.clone().add(V3(0, -.07, 0)));
  W.lensMat = new THREE.MeshPhysicalMaterial({ color: '#a51a12', emissive: '#ff2a1a', emissiveIntensity: 0, transparent: true, opacity: .88, roughness: .12, clearcoat: 1 });
  mesh(new THREE.CylinderGeometry(.034, .034, .09, 40), W.lensMat, BEACON.clone());
  mesh(new THREE.SphereGeometry(.034, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#2a2d33', { metalness: .4 }), BEACON.clone().add(V3(0, .045, 0)));
  W.beaconLight = new THREE.PointLight('#ff2a1a', 0, 4, 2); W.beaconLight.position.copy(BEACON); scene.add(W.beaconLight);
  W.glows = { beacon: glowSprite('#ff3b2a', .5), relay: glowSprite('#ff4030', .05), do0: glowSprite('#ffb020', .03), psu: glowSprite('#30d158', .035), sensor: glowSprite('#30d158', .04), btn: glowSprite('#3aa0ff', .16) };
  W.glows.beacon.position.copy(BEACON); W.glows.relay.position.copy(W.relayLed.position); W.glows.do0.position.copy(W.do0Led.position); W.glows.psu.position.copy(W.psuLed.position); W.glows.btn.position.copy(W.btn.position);

  // cables: sensor cable to a split, then its three cores into A, B and G; power, DO0, beacon, DI1 and Ethernet
  const split = V3(0.775, 1.215, -0.315);
  const protectedRoute = [V3(-1.24,.16,.57),V3(-1.65,.12,.57),V3(-2.12,.12,.52),V3(-2.15,.12,-.32),V3(-1.95,.12,-.46),V3(-.8,.12,-.46),V3(.50,.12,-.46),V3(.70,.24,-.40),V3(.70,.55,-.40),V3(.70,.70,-.40)];
  W.sensorCable = tube([V3(-1.014,.688,.2),V3(-.986,.688,.2),V3(-.95,.675,.24),V3(-.97,.59,.40),V3(-1.12,.46,.54),V3(-1.24,.32,.57),...protectedRoute,V3(.70,.80,-.40),V3(.72,1.0,-.47),V3(.76,1.15,-.36),split], '#24292e', .0045, 960);
  // Protected run skirts the machine base and enters the existing bottom gland.
  tube(protectedRoute, '#49535c', .015);
  for(const [x,y,z] of [[-1.12,.46,.54],[-1.24,.32,.57]]) {
    mesh(rbox(.055,.027,.012,.004),steel,V3(x,y,z-.012),motor);
    mesh(new THREE.TorusGeometry(.007,.0025,8,24),cableRubber,V3(x,y,z),motor,[Math.PI/2,0,0]);
    for(const dx of [-.021,.021]) mesh(new THREE.CylinderGeometry(.004,.004,.006,6),steel,V3(x+dx,y,z-.003),motor,[Math.PI/2,0,0]);
  }
  for(const x of [-1.8,-.8,.35]) {
    mesh(rbox(.065,.12,.035,.004),steel,V3(x,.06,-.46));
    mesh(new THREE.TorusGeometry(.017,.003,8,24),steel,V3(x,.12,-.46),scene,[0,Math.PI/2,0]);
  }
  for(const y of [.36,.58]) {
    mesh(rbox(.065,.025,.09,.004),steel,V3(.70,y,-.455));
    mesh(new THREE.TorusGeometry(.017,.003,8,24),steel,V3(.70,y,-.40),scene,[Math.PI/2,0,0]);
  }
  W.cores = [['#3a8f3a', 1], ['#f2f2f2', 2], ['#20252a', 3], ['#d63a2e', 0]].map(([c, k]) => tube([split, split.clone().add(V3(0, .03, .012)), term(1, 'top', k).add(V3(0, -.012, .012)), term(1, 'top', k)], c, .0022));
  W.powerWire = tube([V3(0.535, 1.288, -0.425), V3(0.56, 1.22, -0.37), V3(0.72, 1.24, -0.33), term(1, 'top', 0).add(V3(0, -.01, .012)), term(1, 'top', 0)], '#d63a2e', .0028);
  W.powerNeg = tube([V3(0.557, 1.288, -0.425), V3(0.58, 1.23, -0.37), V3(0.73, 1.25, -0.335), term(1, 'bottom', 0).add(V3(0, -.01, .012)), term(1, 'bottom', 0)], '#2a62c9', .0028);
  W.doWire = tube([term(2, 'top', 0), term(2, 'top', 0).add(V3(.004, -.01, .014)), V3(0.86, 1.2, -0.33), V3(0.98, 1.24, -0.4), RELAY.clone().add(V3(0, -.055, .0))], '#e08a1e', .0028);
  W.beaconWire = tube([RELAY.clone().add(V3(0, .055, -.01)), V3(1.06, 1.62, -0.45), V3(1.22, 1.72, -0.45), BEACON.clone().add(V3(0, -.095, -.02))], '#e08a1e', .0028);
  W.btnWire = tube([BTN.clone().add(V3(-.04, -.05, -.02)), V3(1.18, .9, -0.42), V3(0.92, 1.05, -0.45), V3(0.82, 1.17, -0.34), term(1, 'bottom', 4).add(V3(0, -.012, .012)), term(1, 'bottom', 4)], '#1a9e45', .0028);
  W.ethCable = tube([rj.clone().add(V3(0, 0, .03)), rj.clone().add(V3(0, -.04, .05)), V3(0.78, 1.12, -0.36), V3(0.62, 1.05, -0.46), V3(0.46, 1.1, -0.48), V3(0.45, 1.6, -0.48), V3(0.4, 1.78, -0.49), V3(0.25, 1.73, -0.47)], '#2f6fd0', .005);
  W.pulses = Array.from({ length: 14 }, () => mesh(new THREE.SphereGeometry(.012, 12, 12), new THREE.MeshBasicMaterial({ color: '#58b4ff' }), V3(0, -5, 0)));

  // floating screens: the gateway dashboard and MultiViz
  W.dashTex = canvasTex(1280, 760, drawDash);
  W.dash = mesh(new THREE.PlaneGeometry(1.0, .594), new THREE.MeshBasicMaterial({ map: W.dashTex, transparent: true, opacity: .95, side: THREE.DoubleSide }), DASH, scene, [0, .25, 0]);
  W.holoTex = canvasTex(1280, 720, () => {});
  W.holo = mesh(new THREE.PlaneGeometry(1.25, .703), new THREE.MeshBasicMaterial({ map: W.holoTex, transparent: true, opacity: .95, side: THREE.DoubleSide }), HOLO, scene, [0, 0, 0]);
  mesh(rbox(1.29, .743, .03, .01), mat('#14171c', { metalness: .4, roughness: .4 }), HOLO.clone().add(V3(0, 0, -.02)));   // the screen's bezel on the wall
  W.dash.castShadow = W.holo.castShadow = false;
  // Installation details: enclosure fasteners, hinges, glands and circuit markers.
  for (const x of [.46,1.34]) for (const y of [.82,1.68]) {
    mesh(new THREE.CylinderGeometry(.009,.009,.006,6),steel,V3(x,y,-.491),scene,[Math.PI/2,0,0]);
    mesh(new THREE.BoxGeometry(.01,.0015,.001),dark,V3(x,y,-.487));
  }
  for(const y of [.93,1.57]) mesh(new THREE.CylinderGeometry(.013,.013,.09,16),steel,V3(.39,y,-.22));
  for(const x of [.70,1.05]) {
    mesh(new THREE.CylinderGeometry(.022,.022,.035,6),mat('#424951',{roughness:.65}),V3(x,.73,-.4));
    mesh(new THREE.CylinderGeometry(.012,.012,.05,24),mat('#242b32',{roughness:.7}),V3(x,.70,-.4));
  }
  const marker=(text,pos)=>{const tex=canvasTex(256,64,(g,w,h)=>{g.fillStyle='#ece9d8';g.fillRect(0,0,w,h);g.fillStyle='#202731';g.font='700 28px '+FONT;g.textAlign='center';g.fillText(text,w/2,43);});mesh(new THREE.PlaneGeometry(.075,.019),mat('#fff',{map:tex,roughness:.85}),pos);};
  marker('RS485',V3(.76,1.19,-.30));marker('24 VDC',V3(.61,1.25,-.33));marker('DO0',V3(.98,1.23,-.37));marker('ETH',V3(.57,1.07,-.40));
  marker('883M',V3(-1.24,.27,.58));
  // Subtle chipped paint and anchor bolts on the motor feet.
  for(const x of [-1.67,-1.23]) for(const z of [.02,.38])mesh(new THREE.CylinderGeometry(.012,.012,.012,6),steel,V3(x,.245,z),motor);
  for(let i=0;i<12;i++)mesh(new THREE.BoxGeometry(.012+i%3*.003,.002,.004),mat(i%3?'#687681':'#795541',{roughness:.95}),V3(-1.69+i*.042,.246,.418),motor);
}

function drawDash(g, w, h) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(248,250,252,.97)'; rr(g, 0, 0, w, h, 34); g.fill();
  g.fillStyle = '#0b6bcb'; rr(g, 0, 0, w, 96, 34); g.fill(); g.fillRect(0, 50, w, 46);
  g.fillStyle = '#fff'; g.font = '800 40px ' + FONT; g.fillText('Wilcoxon 883M Gateway · IRIV IO Controller', 44, 62);
  ['X', 'Y', 'Z'].forEach((a, i) => { const x = 44 + i * 300; g.fillStyle = '#fff'; rr(g, x, 130, 280, 170, 22); g.fill(); g.fillStyle = '#5b6470'; g.font = '600 26px ' + FONT; g.fillText(a + '-axis velocity', x + 24, 176); g.fillStyle = '#111'; g.font = '800 64px ' + FONT; g.fillText(['1.9', '2.1', '1.2'][i], x + 24, 254); g.font = '600 26px ' + FONT; g.fillStyle = '#5b6470'; g.fillText('mm/s RMS', x + 140, 254); });
  g.fillStyle = '#fff'; rr(g, 944, 130, 292, 170, 22); g.fill(); g.fillStyle = '#5b6470'; g.font = '600 26px ' + FONT; g.fillText('Temperature', 968, 176); g.fillStyle = '#111'; g.font = '800 64px ' + FONT; g.fillText('41.3 °C', 968, 254);
  const form = (x, y, title, rows) => { g.fillStyle = '#fff'; rr(g, x, y, 580, 410, 22); g.fill(); g.fillStyle = '#111'; g.font = '800 34px ' + FONT; g.fillText(title, x + 26, y + 56); rows.forEach(([k, v], i) => { g.fillStyle = '#5b6470'; g.font = '600 24px ' + FONT; g.fillText(k, x + 26, y + 110 + i * 74); g.strokeStyle = '#cfd6df'; g.lineWidth = 3; rr(g, x + 26, y + 122 + i * 74, 528, 40, 10); g.stroke(); g.fillStyle = '#111'; g.font = '700 24px ' + MONO; g.fillText(v, x + 40, y + 150 + i * 74); }); };
  form(44, 324, 'Machine alarms', [['Velocity RMS limit, any axis (mm/s)', '4.5'], ['Temperature limit (°C)', '70'], ['Sustained exceedance (s)', '3'], ['IOC I/O · DO0 source', 'Dashboard alarm · latched']]);
  form(656, 324, 'MQTT', [['Broker host', 'your-broker.example'], ['Port', '1883'], ['Base topic', '883M'], ['Status', 'Connected']]);
}

function drawHolo(t, u, id) {
  const tex = W.holoTex, { g, w, h } = tex.userData;
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,18,32,.93)'; rr(g, 0, 0, w, h, 30); g.fill(); g.strokeStyle = 'rgba(88,180,255,.7)'; g.lineWidth = 4; rr(g, 2, 2, w - 4, h - 4, 30); g.stroke();
  g.fillStyle = '#58b4ff'; g.font = '700 30px ' + FONT; g.fillText('VIKING ANALYTICS · MULTIVIZ', 40, 60);
  g.fillStyle = '#e8edf5'; g.font = '800 40px ' + FONT; g.fillText('Motor 3 · Wilcoxon 883M', 40, 112);
  const gx = 40, gy = 150, gw = 820, gh = 470, alarmScene = id === 'alarm' || id === 'rule' || id === 'outro';
  g.fillStyle = 'rgba(255,255,255,.04)'; rr(g, gx, gy, gw, gh, 16); g.fill();
  const learned = id !== 'intro' && id !== 'overview' && !(id === 'chain' && u < 11.8);
  if (learned) { g.fillStyle = 'rgba(48,209,88,.16)'; g.fillRect(gx, gy + gh * .48, gw, gh * .2); g.fillStyle = '#30d158'; g.font = '600 24px ' + FONT; g.fillText('learned baseline', gx + gw - 210, gy + gh * .48 - 10); }
  const n = 90, live = (t * 6) % 1;
  g.strokeStyle = '#58b4ff'; g.lineWidth = 4; g.beginPath();
  for (let i = 0; i < n; i++) { const k = i + Math.floor(t * 6), anomaly = alarmScene && i > 60 ? (i - 60) / 30 : 0; const y = gy + gh * .58 - 26 * Math.sin(k * .9) * Math.cos(k * .37) - anomaly * gh * .38; const x = gx + 10 + (i - live) * (gw - 20) / (n - 1); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
  const side = (y, label, value, color) => { g.fillStyle = 'rgba(255,255,255,.06)'; rr(g, 900, y, 340, 130, 16); g.fill(); g.fillStyle = '#8a94a6'; g.font = '600 24px ' + FONT; g.fillText(label, 924, y + 44); g.fillStyle = color; g.font = '800 38px ' + FONT; g.fillText(value, 924, y + 98); };
  if (id === 'viking') { side(150, 'Baseline', 'Per sensor', '#30d158'); side(300, 'Thresholds', 'None to tune', '#e8edf5'); side(450, 'Symptoms', 'Named, ranked', '#58b4ff'); }
  else if (alarmScene) {
    side(150, 'Symptom', alarmScene ? 'Flagged' : 'None', alarmScene ? '#ff453a' : '#30d158');
    side(300, 'Priority', alarmScene ? '1 of 12' : 'Low', alarmScene ? '#ff453a' : '#e8edf5');
    side(450, 'Baseline', 'Learned', '#30d158');
  } else { side(150, 'Status', learned ? 'Learning normal' : 'Receiving', learned ? '#30d158' : '#e8edf5'); side(300, 'Thresholds', 'None to set', '#e8edf5'); side(450, 'Source', 'MQTT · 883M', '#e8edf5'); }
  tex.needsUpdate = true;
}

/* ---------- per-frame state ---------- */
function poseAt(s, u) {
  const k = s.keys, f = u / s.d; let i = 0; while (i < k.length - 2 && f > k[i + 1][0]) i++;
  const a = k[i], b = k[i + 1] || a, p = b === a ? 0 : ease((f - a[0]) / (b[0] - a[0]));
  return { pos: a[1].clone().lerp(b[1], p), tgt: a[2].clone().lerp(b[2], p) };
}
// Shots far apart are joined by a cut (a fly-through would pass through the cabinet); near ones by a camera move.
const isCut = i => i > 0 && poseAt(SCENES[i - 1], SCENES[i - 1].d).pos.distanceTo(poseAt(SCENES[i], 0).pos) > 1.0;
function cameraAt(t) {
  const i = sceneAt(t), s = SCENES[i], u = t - s.t0; let pose = poseAt(s, u);
  if (i > 0 && !isCut(i)) { const prev = poseAt(SCENES[i - 1], SCENES[i - 1].d), m = ease(u / 1.6); pose = { pos: prev.pos.lerp(pose.pos, m), tgt: prev.tgt.lerp(pose.tgt, m) }; }
  pose.pos.y += .006 * Math.sin(t * .9); pose.pos.x += .006 * Math.sin(t * .63);   // a hand-held drift
  camera.position.copy(pose.pos); camera.lookAt(pose.tgt);
}

function updateWorld(t, s, u) {
  const al = s.id === 'alarm', v = al ? alVel(u) : s.id === 'rule' || s.id === 'outro' ? 2.0 : 1.9;
  const relayOn = al && u >= T_TRIP && u < T_CLEAR, pressed = al && u >= T_ACK && u < T_ACK + .7;
  const amp = .0007 * v * v;
  W.motor.position.set(Math.sin(t * 61) * amp, Math.sin(t * 47 + 1) * amp, Math.sin(t * 53 + 2) * amp * .6);
  W.axes.visible = s.id === 'sensor' && u > 5; W.axes.scale.setScalar(ease((u - 5) / 1));
  const flash = relayOn && Math.sin(u * 14) > -.2;
  W.lensMat.emissiveIntensity = relayOn ? (flash ? 2.4 : .25) : 0; W.beaconLight.intensity = relayOn ? (flash ? 3.2 : .3) : 0;
  W.relayLed.material.color.set(relayOn ? '#ff3b30' : '#331010'); W.do0Led.material.color.set(relayOn ? '#ffb020' : '#3a2a10');
  W.btn.position.z = BTN.z + .045 - (pressed ? .012 : 0); W.btn.material.emissiveIntensity = pressed ? .9 : .05;
  const blink = Math.sin(t * 6) > .6; W.sensorLed.material.color.set(blink ? '#30d158' : '#103a1c');
  const G = W.glows; G.beacon.material.opacity = relayOn ? (flash ? 1 : .15) : 0; G.relay.material.opacity = G.do0.material.opacity = relayOn ? .9 : 0; G.psu.material.opacity = .7;
  G.btn.material.opacity = pressed ? .9 : 0; G.btn.position.copy(W.btn.position); W.sensorLed.getWorldPosition(G.sensor.position); G.sensor.material.opacity = blink ? .8 : 0;
  const hi = { rs485: [W.sensorCable, ...W.cores], power: [W.powerWire, W.powerNeg], do: [W.doWire, W.beaconWire], di: [W.btnWire] }[s.id] || [];
  for (const c of [W.sensorCable, ...W.cores, W.ethCable, W.powerWire, W.powerNeg, W.doWire, W.beaconWire, W.btnWire]) c.mat.emissiveIntensity = hi.includes(c) ? .12 + .1 * Math.sin(t * 5) : 0;   // a gentle pulse; callouts do the pointing
  W.ethCable.mat.emissiveIntensity = Math.max(W.ethCable.mat.emissiveIntensity, .08);
  // data pulses: sensor → IOC on the RS485 cable, IOC → MultiViz on Ethernet
  const flowing = !['setup', 'sensor'].includes(s.id) && !(s.id === 'chain' && u < 5.5);
  W.pulses.forEach((p, k) => {
    const onEth = k >= 7, curve = onEth ? W.ethCable.curve : W.sensorCable.curve, f = ((t * (onEth ? .22 : .16)) + (k % 7) / 7) % 1;
    p.visible = flowing && !(onEth && s.id === 'chain' && u < 9);
    p.position.copy(curve.getPointAt(f)); p.material.color.set(onEth ? '#58b4ff' : '#4fe0c0');
  });
  W.dash.visible = s.id === 'setup';
  W.dash.material.opacity = .95;
  drawHolo(t, u, s.id);
}

/* ---------- 2D overlays ---------- */
function screenOf(p) { const v = p.clone().project(camera); return v.z > 1 ? null : [(v.x + 1) / 2 * FW, (1 - v.y) / 2 * FH]; }
function pill(ctx, x, y, text, bg, size = 24) { ctx.font = `700 ${size}px ${FONT}`; const w = ctx.measureText(text).width + size * 1.2, h = size * 1.8; ctx.beginPath(); rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); return w; }
function callouts(ctx, s, a) {
  if (!s.callouts || a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  s.callouts.forEach((c, k) => {
    const t = c[0] === 'term', p = t ? W.term(c[1], c[2], c[3]) : c[0], label = t ? c[4] : c[1], col = t ? c[5] : c[2], sp = screenOf(p);
    if (!sp) return;
    const [x, y] = sp, side = t ? 1 : (k % 2 ? 1 : -1), lx = x + side * (t ? 150 + k * 26 : 140), ly = y - (t ? 30 - k * 4 : 90);
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + side * 9, y); ctx.lineTo(lx, ly); ctx.stroke();
    ctx.font = `700 26px ${FONT}`; const w = ctx.measureText(label).width + 30; pill(ctx, lx + side * w / 2, ly, label, col, 26);
  });
  ctx.restore();
}
function lowerThird(ctx, s, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const g = ctx.createLinearGradient(0, 640, 0, FH); g.addColorStop(0, 'rgba(8,12,20,0)'); g.addColorStop(.55, 'rgba(8,12,20,.72)'); g.addColorStop(1, 'rgba(8,12,20,.9)'); ctx.fillStyle = g; ctx.fillRect(0, 640, FW, FH - 640);
  const dy = (1 - a) * 20, x = 110;
  ctx.fillStyle = ACCENT; ctx.font = `700 28px ${FONT}`; ctx.fillText(s.kicker, x, 838 + dy);
  ctx.fillStyle = '#fff'; ctx.font = `800 72px ${FONT}`; ctx.letterSpacing = '-2px'; ctx.fillText(s.title, x - 3, 916 + dy); ctx.letterSpacing = '0px';
  let cx = x;
  if (s.chips) { ctx.font = `600 24px ${FONT}`; for (const c of s.chips) { const w = ctx.measureText(c).width + 32; ctx.beginPath(); rr(ctx, cx, 944 + dy, w, 44, 22); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(c, cx + 16, 974 + dy); cx += w + 10; } }
  else if (s.body) { ctx.fillStyle = 'rgba(232,237,245,.85)'; ctx.font = `500 30px ${FONT}`; ctx.fillText(s.body, x, 970 + dy); }
  ctx.restore();
}
function cards(ctx, s, u) {
  if (!s.cards) return;
  ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const n = s.cards.length, w = 470, x0 = FW - 110 - w;
  s.cards.forEach(([title, col, rows], j) => {
    const p = ease((u - .6 - j * .35) / .7), h = 96 + rows.length * 74, y = 90 + j * (h + 22) + (n === 2 ? 40 : 0);
    if (p <= 0 || y + h > 780) return;
    ctx.globalAlpha = p; ctx.beginPath(); rr(ctx, x0 + (1 - p) * 40, y, w, h, 26); ctx.fillStyle = 'rgba(10,16,28,.78)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = col; ctx.font = `800 38px ${FONT}`; ctx.fillText(title, x0 + 30 + (1 - p) * 40, y + 56);
    rows.forEach(([k, v], r) => { ctx.fillStyle = '#8a94a6'; ctx.font = `600 21px ${FONT}`; ctx.fillText(k, x0 + 30 + (1 - p) * 40, y + 100 + r * 74); ctx.fillStyle = '#fff'; ctx.font = `700 28px ${FONT}`; ctx.fillText(v, x0 + 30 + (1 - p) * 40, y + 134 + r * 74); });
  });
  ctx.restore();
}
function alarmHud(ctx, u) {
  const v = alVel(u), on = u >= T_TRIP && u < T_CLEAR, state = on ? (u >= T_ACK ? 'ACKNOWLEDGED' : 'ALARM') : u >= T_OVER && u < T_TRIP ? 'DELAY RUNNING' : 'NORMAL';
  const col = { ALARM: '#ff453a', ACKNOWLEDGED: '#ffd60a', 'DELAY RUNNING': '#ffd60a', NORMAL: '#30d158' }[state], x = 110, y = 80;
  ctx.save(); ctx.globalAlpha = ease(u / .8); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.beginPath(); rr(ctx, x, y, 560, 360, 26); ctx.fillStyle = 'rgba(10,16,28,.8)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();
  ctx.fillStyle = '#8a94a6'; ctx.font = `600 22px ${FONT}`; ctx.fillText('883M · VELOCITY RMS, X', x + 28, y + 44);
  ctx.fillStyle = v > LIMIT ? '#ff453a' : '#fff'; ctx.font = `800 76px ${FONT}`; ctx.fillText(v.toFixed(1), x + 28, y + 124); ctx.font = `600 26px ${FONT}`; ctx.fillStyle = '#8a94a6'; ctx.fillText('mm/s', x + 180, y + 124);
  pill(ctx, x + 420, y + 100, state, col, 20);
  const gx = x + 28, gy = y + 160, gw = 504, gh = 120, yy = val => gy + gh - gh * val / 7;
  ctx.setLineDash([8, 6]); ctx.strokeStyle = '#ff453a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, yy(LIMIT)); ctx.lineTo(gx + gw, yy(LIMIT)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ff453a'; ctx.font = `600 18px ${FONT}`; ctx.fillText('limit 4.5', gx + gw - 80, yy(LIMIT) - 8);
  ctx.strokeStyle = '#58b4ff'; ctx.lineWidth = 3; ctx.beginPath(); for (let s = 0; s <= u; s += .1) { const px = gx + gw * s / 22; s ? ctx.lineTo(px, yy(alVel(s))) : ctx.moveTo(px, yy(alVel(s))); } ctx.stroke();
  const io = (lx, label, lit, c) => { ctx.beginPath(); ctx.arc(lx, y + 322, 10, 0, 7); ctx.fillStyle = lit ? c : '#3a4253'; ctx.fill(); ctx.fillStyle = '#e8edf5'; ctx.font = `700 22px ${FONT}`; ctx.fillText(label, lx + 20, y + 330); };
  io(x + 40, 'DO0 relay', on, '#ffb020'); io(x + 230, 'DI1 ACK', u >= T_ACK && u < T_ACK + .7, '#0a84ff'); io(x + 400, 'Beacon', on, '#ff453a');
  ctx.restore();
  const stages=['Vibration rises','IOC reads','Alarm latched','Acknowledged','Normal again'];
  const stage=u<T_OVER?0:u<T_TRIP?1:u<T_ACK?2:u<T_CLEAR?3:4;
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 20px '+FONT;
  stages.forEach((label,i)=>{const x=110+i*340;ctx.fillStyle=i===stage?'#ffad70':'rgba(12,25,38,.85)';rr(ctx,x,700,324,50,12);ctx.fill();ctx.fillStyle=i===stage?'#102432':'#d4e2ed';ctx.fillText(`${i+1} · ${label}`,x+162,725);});ctx.restore();
}
function footer(ctx, i, t) {
  ctx.save(); ctx.font = `600 22px ${FONT}`; ctx.fillStyle = 'rgba(232,237,245,.75)'; ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left'; ctx.fillText(NARRATION.product, 110, 1036); ctx.textAlign = 'right'; ctx.fillText(`${String(i + 1).padStart(2, '0')} / ${SCENES.length}`, FW - 110, 1036);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(110, 1052, FW - 220, 4); ctx.fillStyle = ACCENT; ctx.fillRect(110, 1052, (FW - 220) * Math.min(1, t / TOTAL), 4);
  ctx.restore();
}
function vignette(ctx) { const g = ctx.createRadialGradient(FW / 2, FH / 2, FH * .45, FW / 2, FH / 2, FH * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH); }

function render(ctx, t) {
  t = Math.max(0, Math.min(TOTAL - 1e-3, t));
  const i = sceneAt(t), s = SCENES[i], u = t - s.t0;
  updateWorld(t, s, u); cameraAt(t);
  R.render(scene, camera);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.domElement, 0, 0, FW, FH);
  vignette(ctx);
  const a = ease((u - .5) / .6) * (1 - clamp((u - (s.d - .45)) / .45));
  if (s.id === 'outro') {
    ctx.save(); ctx.fillStyle = `rgba(8,12,20,${.55 * ease(u / 2)})`; ctx.fillRect(0, 0, FW, FH); ctx.globalAlpha = ease((u - .4) / .8); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = ACCENT; ctx.font = `700 30px ${FONT}`; ctx.fillText(s.kicker, FW / 2, 430); ctx.fillStyle = '#fff'; ctx.font = `800 132px ${FONT}`; ctx.letterSpacing = '-4px'; ctx.fillText(s.title, FW / 2, 570); ctx.letterSpacing = '0px';
    ctx.fillStyle = 'rgba(232,237,245,.85)'; ctx.font = `500 38px ${FONT}`; ctx.fillText('One sensor, one controller, one alarm someone must answer.', FW / 2, 640); ctx.restore();
  } else {
    callouts(ctx, s, a); cards(ctx, s, u);
    if (s.id === 'alarm') alarmHud(ctx, u);
    lowerThird(ctx, s, ease((u - .35) / .6) * (1 - clamp((u - (s.d - .4)) / .4)));
  }
  if (t < .8) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .8})`; ctx.fillRect(0, 0, FW, FH); }
  else if (isCut(i) && u < .4) { ctx.fillStyle = `rgba(0,0,0,${.85 * (1 - u / .4)})`; ctx.fillRect(0, 0, FW, FH); }
  footer(ctx, i, t);
}

window.FILM_BITRATE = 2.6e6;   // full-motion 3D: ~45 MB for 2:17 instead of ~89 MB at the tours' 5 Mbps
const exportVideo = exportNarratedTour;
