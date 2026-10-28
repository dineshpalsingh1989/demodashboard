/* Device insights for IRIV hardware: what each controller or AI camera is wired to, the rules
   it runs, live MQTT traffic, health, output tests, network failover, where else the model is
   installed, a model comparison and the official product page. EdgeAI panels lead with the
   camera view, because cameras and CCTV analytics are what EdgeAI is mainly used for. */

// Wiring for the IRIV devices that were added without a pin map.
IO['hw-anpr'] = { ETH1: io('Gantry ANPR cameras ×2 (RTSP)', () => '2 streams'), RS485: io('Radar speed sensor', () => Math.round(wob(96, 8, .4)) + ' km/h'),
  DI1: io('Cabinet door', off), DO1: io('"Slow down" warning sign', () => wob(96, 8, .4) > 102) };
IO['hw-ioc'] = { RS485: io('Variable message sign', () => HW.msg), DI1: io('Cabinet door', off), DI2: io('Mains power OK', on), DO1: io('Sign heater', () => night > .5),
  AI1: io('Cabinet temperature', () => wob(34, 1, .1).toFixed(1) + ' °C') };
IO['sat-ioc'] = { DI1: io('Pump 1 running', on), DI2: io('Pump 2 running', () => Math.sin(time * .05) > .3), DI3: io('Pump fault', off), DO1: io('Start pump 1', on),
  DO2: io('Start pump 2', () => Math.sin(time * .05) > .3), AI1: io('Network pressure (4–20 mA)', () => (Math.sin(time * .05) > .3 ? wob(2.9, .1, .3) : wob(2.4, .1, .3)).toFixed(1) + ' bar') };
['hw-anpr', 'hw-ioc', 'sat-ioc'].forEach(id => { if (DEV[id]) DEV[id].io = IO[id]; });

const INS_KIND = { 'IRIV PiControl': 'pic', 'IRIV IO Controller MQTT': 'ioc', 'IRIV EdgeAI CM5': 'ai' };
const insKind = d => d && d.io ? INS_KIND[d.model] : null;
const INS_LINKS = {
  pic: 'https://www.cytron.io/p-iriv-picontrol-cm4-industrial-controller',
  ioc: 'https://www.cytron.io/p-iriv-io-controller',
  ai: 'https://www.cytron.io/c-industry/c-industrial-edge-controller'
};
const INS = { ovr: {}, down: new Set(), feeds: {}, prev: {}, queue: {}, missed: {}, beat: {}, event: {}, last: {}, cur: null };
const pinGroup = pin => pin.replace(/\d+$/, '');
const PIN_COL = Object.assign({ ETH: '#26a69a' }, GROUP_COL);

// Output tests override a pin for 30 seconds; the terminal, pin table and map all read through this.
DEVICES.forEach(d => {
  if (!insKind(d)) return;
  for (const [pin, e] of Object.entries(d.io)) {
    if (!e.v || e.raw) continue;
    const raw = e.v; e.raw = raw;
    e.v = () => { const o = INS.ovr[d.id]?.[pin]; return o && o.until > Date.now() ? o.v : raw(); };
  }
});
const pinRaw = (id, pin) => { const e = DEV[id]?.io?.[pin]; const f = e && (e.raw || e.v); return f ? f() : null; };
const pinText = (id, pin) => { const e = DEV[id]?.io?.[pin]; if (!e) return ''; const v = pinRaw(id, pin); return `${e.t}: ${v === true ? 'ON' : v === false ? 'off' : v ?? '—'}`; };
const netDown = id => INS.down.has(id);

/* ---------- automation rules: [IF, THEN, active (pin or fn), live (pin or fn)] ---------- */
const crowd = () => Math.round(wob(120, 30, .15));
const INS_RULES = {
  'edge': [['DI1 UPS on battery', 'DO1 alarm beacon + city load-shed plan', 'DI1', 'DI1'], ['Any city alarm (flood, fire, SOS)', 'alert the command center and dispatch', () => FX.alert, () => FX.alert ? 'Alert active' : 'No active alerts']],
  'pic-traffic': [['DI1 queue on the north–south loop', 'DO1 extend north–south green', 'DO1', 'DI1'], ['DI3 pedestrian button pressed', 'add a walk phase next cycle', 'DI3', 'DI3']],
  'pic-energy': [['DI1 grid supply lost', 'DO2 shed load group A, run on battery', 'DO2', 'DI1'], ['AI1 battery room > 35 °C', 'alarm to IRIV Edge', () => false, 'AI1']],
  'farm-pic': [['Edge: soil dry and no rain forecast', 'DO1 pump + DO2 valve zone 1 ON', 'DO1', 'DI1'], ['DI2 pump overload trip', 'stop the pump, alarm the farmer', 'DI2', 'DI2']],
  'sub-pic': [['AI1 T1 oil > 70 °C', 'DO1 T1 cooling fans ON', 'DO1', 'AI1'], ['AI2 T2 oil > 76 °C', 'DO2 T2 cooling fans ON', 'DO2', 'AI2'], ['T1 oil > 85 °C', 'DO3 alarm horn + alarm to Edge', 'DO3', 'AI1']],
  'sub-ioc': [['DI10 yard gate open', 'DO1 floodlights + DO2 siren', 'DI10', 'DI10'], ['Any DI1–8 breaker opens', 'operator alarm in the command center', () => [1, 2, 3, 4, 5, 6, 7, 8].some(i => pinRaw('sub-ioc', 'DI' + i) === false), 'DI1'], ['DI9 SF6 gas low', 'maintenance ticket', 'DI9', 'DI9']],
  'sub-ai': [['Person at the fence (CSI0)', 'DO1 floodlight + DO2 siren + snapshot', 'DO1', () => GRID.intruder ? 'Person detected' : 'Fence clear'], ['Vehicle at the gate (CSI1)', 'log plate, notify the duty engineer', () => false, 'CSI1']],
  'fac-ai': [['Defect seen on the packing line (CSI0)', 'DO1 reject pusher', 'DO1', 'DI1'], ['Label unreadable (CSI1)', 'stop the line through the PLC (RS485)', () => false, 'CSI1']],
  'fac-ioc': [['DI3 labeller stopped', 'DO1 andon light + downtime log', 'DO1', 'DI3'], ['DI7 emergency stop', 'alert the shift supervisor', 'DI7', 'DI7']],
  'res-ioc': [['AI1 raw turbidity > 30 NTU', 'tell the treatment plant to raise dosing', () => WTP.turb > 30, 'AI1'], ['DI7 intake screen blocked', 'alarm + run the screen cleaner', 'DI7', 'DI7']],
  'wtp-pic': [['AI1 raw turbidity > 20 NTU', 'DO1 coagulant to high dose', () => WTP.turb > 20, 'AI1'], ['AI1 raw turbidity > 30 NTU', 'DO4 water quality alarm', 'DO4', 'AI1'], ['DI1 chlorine leak', 'stop DO2 chlorine pump, evacuate alarm', 'DI1', 'DI1']],
  'wtp-ai': [['Person in the chlorine room without PPE (CSI0)', 'DO1 lock the door + DO2 beacon', 'DO1', () => WTP.aiAlert ? 'No PPE detected' : 'PPE OK']],
  'wtp-ioc': [['AI1 filter head-loss > 2.0 m', 'DO1 backwash request filter 1', 'DO1', 'AI1']],
  'cw-ioc': [['AI1 network pressure < 3.0 bar', 'DO3 start pump 3', 'DO3', 'AI1']],
  'ww-ioc': [['AI1 dissolved oxygen < 1.5 mg/L', 'DO3 start blower 3', 'DO3', 'AI1'], ['AI1 dissolved oxygen > 2.5 mg/L', 'stop blower 2 to save energy', () => false, 'AI1']],
  'solar-pic': [['Grid operator asks to curtail', 'DO1 curtail inverter output', 'DO1', 'RS485'], ['Daytime and AI2 module temp. high', 'DO2 station fan ON', 'DO2', 'AI2']],
  'bess-ioc': [['DI7 smoke in any container', 'DO1 beacon + isolate the battery', 'DI7', 'DI7'], ['Battery discharging', 'DO2 extra cooling', 'DO2', 'RS485']],
  'forest-ai': [['Smoke or flame seen (CSI0)', 'DO1 siren + alert the fire service with location', 'DO1', 'CSI0']],
  'cp-anpr': [['DI1 car at entry and plate read', 'DO1 open the entry barrier', 'DO1', 'DI1'], ['DI2 car at exit and fee paid', 'DO2 open the exit barrier', 'DO2', 'DI2']],
  'cp-ai': [['Level occupancy reaches capacity', 'DO1 level FULL sign', 'DO1', 'RS485']],
  'cp-ioc': [['AI1 CO gas > 30 ppm', 'DO2 ventilation fans to high', 'DO2', 'AI1'], ['Car park full', 'DO1 FULL sign', 'DO1', 'DO1']],
  'mall-ai': [['All rooftop bays taken', 'DO1 roof FULL sign', 'DO1', 'RS485']],
  'school-ai': [['Child near the lane while a car moves (CSI0)', 'DO1 warning beacon', 'DO1', 'DI1']],
  'hub-ai': [['More than 140 people on the platform', 'DO1 crowd warning light', 'DO1', () => `People on platform: ${crowd()}`]],
  'mk-anpr': [['DI1 car at the barrier, plate allowed', 'DO1 open the barrier', 'DO1', 'DI1']],
  'pr-anpr': [['DI1 car at the gate, plate allowed', 'DO1 open the gate', 'DO1', 'DI1']],
  'jn-ai': [['Car crosses on red (ETH1)', 'DO1 trigger the red-light camera + save clip', 'DO1', 'ETH1'], ['Queue grows on one approach', 'send a new green split to the PiControl (RS485)', () => true, 'RS485']],
  'hw-anpr': [['Speed > 102 km/h between the cameras', 'DO1 "Slow down" sign + record', 'DO1', 'RS485'], ['Stopped vehicle in a lane', 'warning on the message sign (hw-ioc)', () => false, 'ETH1']],
  'hw-ioc': [['IRIV Edge publishes an incident message', 'RS485 sign shows it', () => true, 'RS485'], ['DI1 cabinet door open', 'tamper alarm', 'DI1', 'DI1']],
  'sat-ioc': [['AI1 network pressure < 2.5 bar', 'DO2 start pump 2', 'DO2', 'AI1']]
};
const ruleState = (id, spec) => typeof spec === 'function' ? !!spec() : pinRaw(id, spec) === true;
const ruleLive = (id, spec) => typeof spec === 'function' ? spec() : pinText(id, spec);

/* ---------- camera views for EdgeAI ---------- */
// Illustrated CCTV frames: each site gets a drawn scene with people and vehicles in it, and the
// AI's detection boxes sit on top of those objects, as an operator would see them.
const CAM_SKINS = ['#f1c27d', '#c68642', '#e0ac69', '#8d5524'];
function camPerson(x, y, h, shirt, i = 0, helmet) {   // x = centre, y = feet
  const s = h / 62;
  return `<g transform="translate(${x} ${y}) scale(${s.toFixed(3)})">
    <rect x="-7" y="-27" width="6" height="27" rx="2.5" fill="#2b3640"/><rect x="1" y="-27" width="6" height="27" rx="2.5" fill="#2b3640"/>
    <rect x="-10" y="-52" width="20" height="29" rx="7" fill="${shirt}"/>
    <rect x="-14" y="-49" width="5" height="20" rx="2.5" fill="${shirt}"/><rect x="9" y="-49" width="5" height="20" rx="2.5" fill="${shirt}"/>
    <circle cy="-56" r="7" fill="${CAM_SKINS[i % CAM_SKINS.length]}"/>
    ${helmet ? '<path d="M-8.5 -57 A8.5 8.5 0 0 1 8.5 -57 Z" fill="#ffd600"/><rect x="-10" y="-58" width="20" height="2.5" rx="1" fill="#ffd600"/>' : '<path d="M-7 -58 A7 7 0 0 1 7 -58 Z" fill="#3e2723"/>'}
  </g>`;
}
const personBox = (x, y, h) => [x - h * .24, y - h * 1.04, h * .48, h * 1.06];
function carFront(cx, y, w, color) {   // y = ground
  const h = w * .62;
  return `<g><rect x="${cx - w * .5}" y="${y - h * .08}" width="${w * .16}" height="${h * .12}" rx="3" fill="#111"/><rect x="${cx + w * .34}" y="${y - h * .08}" width="${w * .16}" height="${h * .12}" rx="3" fill="#111"/>
    <path d="M${cx - w * .36} ${y - h * .55} L${cx - w * .27} ${y - h * .95} Q${cx} ${y - h * 1.02} ${cx + w * .27} ${y - h * .95} L${cx + w * .36} ${y - h * .55} Z" fill="#b0bec5"/>
    <path d="M${cx - w * .31} ${y - h * .57} L${cx - w * .24} ${y - h * .88} Q${cx} ${y - h * .93} ${cx + w * .24} ${y - h * .88} L${cx + w * .31} ${y - h * .57} Z" fill="#9cc3d8"/>
    <rect x="${cx - w * .5}" y="${y - h * .58}" width="${w}" height="${h * .52}" rx="${w * .07}" fill="${color}"/>
    <rect x="${cx - w * .44}" y="${y - h * .48}" width="${w * .17}" height="${h * .1}" rx="3" fill="#fff8e1"/><rect x="${cx + w * .27}" y="${y - h * .48}" width="${w * .17}" height="${h * .1}" rx="3" fill="#fff8e1"/>
    <rect x="${cx - w * .2}" y="${y - h * .47}" width="${w * .4}" height="${h * .1}" rx="2" fill="#263238"/>
    <rect x="${cx - w * .17}" y="${y - h * .28}" width="${w * .34}" height="${h * .13}" rx="2" fill="#fafafa" stroke="#222"/>
    <text x="${cx}" y="${y - h * .185}" font-size="${(w * .075).toFixed(1)}" font-weight="800" text-anchor="middle" fill="#111" data-cam-plate>WBK 1234</text></g>`;
}
function carSide(x, y, w, color) {   // x = left, y = ground
  const h = w * .38;
  return `<g><path d="M${x} ${y - h * .3} Q${x} ${y - h * .62} ${x + w * .12} ${y - h * .62} L${x + w * .28} ${y - h * .62} L${x + w * .4} ${y - h} L${x + w * .72} ${y - h} L${x + w * .86} ${y - h * .62} Q${x + w} ${y - h * .6} ${x + w} ${y - h * .3} L${x + w} ${y - h * .18} L${x} ${y - h * .18} Z" fill="${color}"/>
    <path d="M${x + w * .33} ${y - h * .64} L${x + w * .43} ${y - h * .92} L${x + w * .55} ${y - h * .92} L${x + w * .55} ${y - h * .64} Z M${x + w * .59} ${y - h * .64} L${x + w * .59} ${y - h * .92} L${x + w * .7} ${y - h * .92} L${x + w * .8} ${y - h * .64} Z" fill="#9cc3d8"/>
    <circle cx="${x + w * .22}" cy="${y - h * .16}" r="${h * .19}" fill="#1b1b1b"/><circle cx="${x + w * .78}" cy="${y - h * .16}" r="${h * .19}" fill="#1b1b1b"/>
    <circle cx="${x + w * .22}" cy="${y - h * .16}" r="${h * .08}" fill="#9e9e9e"/><circle cx="${x + w * .78}" cy="${y - h * .16}" r="${h * .08}" fill="#9e9e9e"/>
    <rect x="${x + w * .95}" y="${y - h * .5}" width="${w * .05}" height="${h * .1}" fill="#fff59d"/></g>`;
}
const carTopView = (x, y, w, h, color) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${color}"/><rect x="${x + 4}" y="${y + h * .2}" width="${w - 8}" height="${h * .18}" rx="2" fill="#9cc3d8"/><rect x="${x + 4}" y="${y + h * .66}" width="${w - 8}" height="${h * .13}" rx="2" fill="#9cc3d8"/></g>`;
const bottle = (x, y, ok) => `<g><rect x="${x - 7}" y="${y - 34}" width="14" height="34" rx="4" fill="#4fc3f7" opacity=".85"/><rect x="${x - 4}" y="${y - 42}" width="8" height="9" fill="#81d4fa"/>
  ${ok ? `<rect x="${x - 5}" y="${y - 46}" width="10" height="5" rx="1" fill="#e53935"/>` : ''}<rect x="${x - 7}" y="${y - 24}" width="14" height="10" fill="${ok ? '#fff' : '#ffffffaa'}"/>
  ${ok ? '' : `<path d="M${x - 3} ${y - 32} l4 6 l-3 4 l4 7" stroke="#263238" stroke-width="1.3" fill="none"/>`}</g>`;

// Each detection: [object svg, box [x, y, w, h], label, colour, animation, travel px]
const CAM_SCENES = {
  crowd: () => ({
    bg: `<rect width="320" height="96" fill="#56657a"/><rect width="320" height="10" fill="#3d4a5c"/>
      <rect x="18" y="34" width="92" height="22" rx="3" fill="#0d47a1"/><text x="64" y="49" font-size="10" font-weight="800" fill="#fff" text-anchor="middle">PLATFORM 2 →</text>
      <circle cx="150" cy="46" r="11" fill="#eceff1" stroke="#263238" stroke-width="2"/><path d="M150 46 L150 39 M150 46 L155 48" stroke="#263238" stroke-width="1.5"/>
      <rect x="210" y="16" width="110" height="80" fill="#cfd8dc"/><rect x="210" y="16" width="110" height="10" fill="#00897b"/>
      ${[0, 1, 2].map(k => `<rect x="${220 + k * 34}" y="32" width="26" height="22" rx="3" fill="#455a64"/>`).join('')}<rect x="210" y="62" width="110" height="6" fill="#00897b"/>
      <path d="M0 96 H320 V180 H0Z" fill="#9ea7ad"/><path d="M0 96 H320 V104 H0Z" fill="#ffd600"/>
      <path d="M0 112 H320 M0 140 H320" stroke="#8a9399"/>`,
    objs: [[34, 150, 56, '#1e88e5'], [100, 132, 44, '#e53935'], [164, 158, 60, '#43a047'], [230, 136, 46, '#8e24aa'], [290, 154, 56, '#fb8c00']]
      .map(([x, y, h, c], i) => [camPerson(x, y, h, c, i), personBox(x, y, h), 'person', '#ff8a80', 'walk', i % 2 ? -6 : 6]),
  }),
  plate: () => ({
    bg: `<rect width="320" height="110" fill="#37474f"/><rect width="320" height="14" fill="#263238"/>
      ${[0, 1, 2, 3, 4].map(k => `<rect x="${12 + k * 64}" y="2" width="40" height="7" rx="2" fill="#fff9c4" opacity=".8"/>`).join('')}
      <rect y="40" width="320" height="4" fill="#455a64"/><text x="20" y="62" font-size="12" font-weight="800" fill="#90a4ae">ENTRY · LANE 1</text>
      <path d="M0 110 H320 V180 H0Z" fill="#5d6a72"/><path d="M60 180 L120 110 M260 180 L200 110" stroke="#fff" stroke-width="2" opacity=".6"/>
      <rect x="268" y="56" width="10" height="80" fill="#ffd600"/><rect x="230" y="60" width="44" height="8" fill="#fff"/>
      ${[0, 1].map(k => `<rect x="${232 + k * 20}" y="60" width="10" height="8" fill="#e53935"/>`).join('')}`,
    objs: [[carFront(160, 152, 120, '#eceff1'), [96, 74, 128, 80], 'car', '#40c4ff', 'still', 0],
           ['', [137, 128, 46, 14], 'PLATE', '#ffd740', 'still', 0]]
  }),
  line: () => ({
    bg: `<rect width="320" height="180" fill="#cfd8dc"/><rect width="320" height="70" fill="#b0bec5"/>
      <rect x="20" y="30" width="80" height="30" rx="3" fill="#eceff1" stroke="#90a4ae"/><text x="60" y="49" font-size="9" font-weight="700" text-anchor="middle" fill="#455a64">LINE 3 · 62/min</text>
      <rect x="250" y="22" width="14" height="48" fill="#78909c"/><rect x="236" y="62" width="42" height="10" rx="2" fill="#37474f"/>
      <rect y="128" width="320" height="16" fill="#37474f"/><rect y="144" width="320" height="6" fill="#263238"/>
      ${Array.from({ length: 16 }, (_, k) => `<circle cx="${10 + k * 20}" cy="147" r="3" fill="#90a4ae"/>`).join('')}
      <rect y="150" width="320" height="30" fill="#90a4ae"/>`,
    objs: [[40, true], [110, true], [180, false], [250, true]].map(([x, ok]) =>
      [bottle(x, 128, ok), [x - 13, 80, 26, 50], ok ? 'OK' : 'DEFECT', ok ? '#69f0ae' : '#ff5252', 'belt', 0])
  }),
  room: () => ({
    bg: `<rect width="320" height="180" fill="#dfe6e9"/>${Array.from({ length: 11 }, (_, k) => `<path d="M${k * 32} 0 V120" stroke="#cdd6da"/>`).join('')}
      <path d="M0 120 H320" stroke="#b0bec5" stroke-width="2"/><rect y="120" width="320" height="60" fill="#b8c4c9"/>
      ${[30, 80].map(x => `<rect x="${x}" y="40" width="36" height="86" rx="16" fill="#90a4ae"/><rect x="${x}" y="70" width="36" height="16" fill="#ffd600"/><text x="${x + 18}" y="82" font-size="10" font-weight="800" text-anchor="middle" fill="#263238">Cl₂</text>`).join('')}
      <path d="M48 40 V30 H300" stroke="#78909c" stroke-width="4" fill="none"/><rect x="270" y="36" width="34" height="42" rx="3" fill="#ef5350"/><text x="287" y="61" font-size="8" font-weight="800" text-anchor="middle" fill="#fff">PPE</text>`,
    objs: [[camPerson(170, 160, 78, '#1565c0', 1, true), personBox(170, 160, 78), 'helmet ✓', '#69f0ae', 'walk', 20],
           [camPerson(240, 156, 72, '#f57c00', 2, false), personBox(240, 156, 72), 'no helmet', '#ff5252', 'walk', -26]]
  }),
  forest: () => ({
    bg: `<defs><linearGradient id="camSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#81d4fa"/><stop offset="1" stop-color="#e1f5fe"/></linearGradient></defs>
      <rect width="320" height="180" fill="url(#camSky)"/><path d="M0 100 Q80 60 160 90 T320 80 V180 H0Z" fill="#7cb342"/><path d="M0 130 Q100 100 200 125 T320 115 V180 H0Z" fill="#558b2f"/>
      ${Array.from({ length: 18 }, (_, k) => { const x = 8 + k * 18, y = 150 + (k % 3) * 8; return `<path d="M${x} ${y} l9 -30 l9 30Z" fill="#2e7d32"/>`; }).join('')}
      <g opacity=".75"><circle cx="232" cy="78" r="9" fill="#cfd8dc"><animate attributeName="cy" values="82;60;82" dur="6s" repeatCount="indefinite"/></circle><circle cx="240" cy="66" r="12" fill="#b0bec5"><animate attributeName="cy" values="70;48;70" dur="7s" repeatCount="indefinite"/></circle><circle cx="226" cy="58" r="10" fill="#cfd8dc"><animate attributeName="cy" values="62;42;62" dur="8s" repeatCount="indefinite"/></circle></g>
      <path d="M152 90 h16 M160 82 v16" stroke="#fff" stroke-width="1.5"/><circle cx="160" cy="90" r="22" stroke="#fff" fill="none" opacity=".7"/>`,
    objs: [['', [206, 38, 52, 54], 'smoke?', '#ffd740', 'still', 0]]
  }),
  park: () => ({
    bg: `<rect width="320" height="180" fill="#616d75"/>${Array.from({ length: 7 }, (_, k) => `<path d="M${10 + k * 50} 34 V90 M${10 + k * 50} 104 V160" stroke="#fff" stroke-width="2"/>`).join('')}
      <path d="M0 97 H320" stroke="#ffd600" stroke-dasharray="12 10" stroke-width="2"/>`,
    objs: [[20, 42, '#e53935', 1], [70, 42, '#eceff1', 1], [120, 42, '', 0], [170, 42, '#1e88e5', 1], [220, 42, '#212121', 1], [270, 42, '', 0],
           [20, 108, '#43a047', 1], [70, 108, '', 0], [120, 108, '#fdd835', 1], [170, 108, '#8e24aa', 1], [220, 108, '', 0], [270, 108, '#90a4ae', 1]]
      .map(([x, y, c, car]) => [car ? carTopView(x + 8, y, 24, 46, c) : '', [x + 4, y - 2, 32, 50], car ? 'car' : 'free', car ? '#69f0ae' : '#40c4ff', 'still', 0]),
  }),
  road: () => ({
    bg: `<rect width="320" height="180" fill="#8bc34a"/><rect width="320" height="48" fill="#b3e5fc"/>
      ${[20, 70, 250].map(x => `<rect x="${x}" y="22" width="30" height="26" fill="#cfd8dc"/><rect x="${x + 5}" y="28" width="8" height="8" fill="#90caf9"/><rect x="${x + 17}" y="28" width="8" height="8" fill="#90caf9"/>`).join('')}
      <rect y="48" width="320" height="18" fill="#bdbdbd"/><rect y="66" width="320" height="90" fill="#455a64"/><rect y="156" width="320" height="24" fill="#bdbdbd"/>
      <path d="M0 111 H320" stroke="#fff" stroke-width="2" stroke-dasharray="16 12"/>
      ${Array.from({ length: 8 }, (_, k) => `<rect x="${204 + k * 10}" y="68" width="6" height="86" fill="#fafafa" opacity=".9"/>`).join('')}
      <rect x="180" y="30" width="6" height="36" fill="#37474f"/><rect x="174" y="24" width="18" height="34" rx="3" fill="#263238"/><circle cx="183" cy="32" r="4" fill="#f44336"/><circle cx="183" cy="42" r="4" fill="#5d4037"/><circle cx="183" cy="52" r="4" fill="#5d4037"/>`,
    objs: [[carSide(0, 104, 92, '#1e88e5'), [-4, 66, 100, 40], 'car', '#40c4ff', 'drive', 0],
           [carSide(130, 152, 84, '#e53935'), [126, 118, 92, 36], 'car', '#40c4ff', 'still', 0],
           [camPerson(250, 140, 54, '#fdd835', 3), personBox(250, 140, 54), 'person', '#ff5252', 'walk', 24]]
  }),
  yard: () => ({
    bg: `<rect width="320" height="180" fill="#1f2a33"/><path d="M0 120 H320 V180 H0Z" fill="#37474f"/>
      <rect x="180" y="40" width="96" height="70" rx="6" fill="#546e7a"/><rect x="190" y="30" width="10" height="14" fill="#78909c"/><rect x="226" y="30" width="10" height="14" fill="#78909c"/><rect x="256" y="30" width="10" height="14" fill="#78909c"/>
      ${Array.from({ length: 6 }, (_, k) => `<rect x="${186 + k * 14}" y="54" width="6" height="48" fill="#455a64"/>`).join('')}
      <path d="M20 26 V120" stroke="#607d8b" stroke-width="4"/><path d="M14 28 h24 l-4 8 h-16z" fill="#90a4ae"/><path d="M26 36 L0 120 H70Z" fill="#fff59d" opacity=".12"/>
      <g stroke="#90a4ae" stroke-width=".8" opacity=".55">${Array.from({ length: 34 }, (_, k) => `<path d="M${k * 10 - 60} 70 l60 60 M${k * 10} 70 l-60 60"/>`).join('')}</g>
      <path d="M0 70 H320 M0 130 H320" stroke="#b0bec5" stroke-width="2"/>`,
    objs: [[camPerson(70, 146, 60, '#263238', 1), personBox(70, 146, 60), 'person', '#ff5252', 'walk', 70],
           [carSide(208, 152, 96, '#eceff1'), [204, 116, 104, 38], 'vehicle', '#40c4ff', 'still', 0]]
  }),
  control: () => ({
    bg: `<rect width="320" height="180" fill="#263238"/>
      ${Array.from({ length: 8 }, (_, k) => { const x = 18 + (k % 4) * 72, y = 26 + Math.floor(k / 4) * 40; return `<rect x="${x}" y="${y}" width="66" height="34" rx="2" fill="${['#1565c0', '#2e7d32', '#00838f', '#6a1b9a'][k % 4]}"/><path d="M${x + 6} ${y + 26} l12 -10 l10 6 l14 -12 l16 8" stroke="#ffffffaa" fill="none"/>`; }).join('')}
      <rect y="132" width="320" height="48" fill="#37474f"/>`,
    objs: [[90, '#5c6bc0'], [210, '#26a69a']].map(([x, c], i) => [`<rect x="${x - 50}" y="118" width="100" height="10" rx="2" fill="#546e7a"/><rect x="${x - 26}" y="92" width="52" height="28" rx="2" fill="#111"/><rect x="${x - 23}" y="95" width="46" height="22" fill="#29b6f6" opacity=".7"/>` + camPerson(x + 34, 156, 64, c, i),
      personBox(x + 34, 156, 64), 'person', '#69f0ae', 'still', 0]),
  })
};
const INS_CAMS = {
  'edge': ['control', 'CSI0 · Control-room camera', 'People count'], 'sub-ai': ['yard', 'CSI0 · Fence camera', 'Person + vehicle detection'],
  'fac-ai': ['line', 'CSI0 · Packing-line camera', 'Defect inspection'], 'wtp-ai': ['room', 'CSI0 · Chlorine room camera', 'PPE detection'],
  'forest-ai': ['forest', 'CSI0 · Tower camera (360°)', 'Smoke & fire detection'], 'cp-anpr': ['plate', 'ETH1 · Entry CCTV (RTSP)', 'Number-plate recognition'],
  'cp-ai': ['park', 'ETH1 · Level CCTV ×8 (RTSP)', 'Bay occupancy'], 'mall-ai': ['park', 'ETH1 · Rooftop IP cameras ×6', 'Bay occupancy'],
  'school-ai': ['road', 'CSI0 · Drop-off lane camera', 'Person + vehicle safety'], 'hub-ai': ['crowd', 'ETH1 · Platform CCTV ×4', 'Crowd counting'],
  'mk-anpr': ['plate', 'ETH1 · Barrier IP camera', 'Number-plate recognition'], 'pr-anpr': ['plate', 'ETH1 · Gate camera', 'Number-plate recognition'],
  'jn-ai': ['road', 'ETH1 · Junction CCTV ×4', 'Vehicles, pedestrians, red-light'], 'hw-anpr': ['plate', 'ETH1 · Gantry ANPR ×2', 'Plates, speed, stopped vehicles']
};
function cameraHTML(d) {
  const c = INS_CAMS[d.id]; if (!c) return '';
  const [set, src, model] = c, S = CAM_SCENES[set]();
  const dets = S.objs.map(([svg, [x, y, w, h], lb, col, anim, dx], i) => {
    const tw = Math.max(w, (lb.length + (lb === 'PLATE' || lb === 'free' ? 3 : 6)) * 5 + 6), ly = lb === 'PLATE' ? y + h + 11 : y;
    return `<g class="ins-${anim}" style="--dx:${dx}px;animation-delay:${-i * 1.3}s;animation-duration:${7 + i % 3 * 2}s">${svg}
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${col}" stroke-width="1.6" rx="2"/>
      <rect x="${x}" y="${ly - 11}" width="${tw}" height="11" rx="1.5" fill="${col}"/>
      <text x="${x + 3}" y="${ly - 2.5}" font-size="8" font-weight="700" fill="#111" data-cam-label="${i}" data-base="${lb}">${lb}</text></g>`;
  }).join('');
  return `<h3>📹 Camera view · AI on this device · video never leaves it</h3>
    <div class="ins-cam"><svg viewBox="0 0 320 180" role="img" aria-label="${src}, ${model}">
      <defs><radialGradient id="camVig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
        <pattern id="camScan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".08"/></pattern>
        <clipPath id="camClip"><rect width="320" height="180"/></clipPath></defs>
      <g clip-path="url(#camClip)">${S.bg}${dets}</g>
      <rect width="320" height="180" fill="url(#camScan)"/><rect width="320" height="180" fill="url(#camVig)"/>
      <rect width="320" height="22" fill="#000" opacity=".5"/>
      <circle cx="11" cy="11" r="4" fill="#ff1744"><animate attributeName="opacity" values="1;.2;1" dur="1.2s" repeatCount="indefinite"/></circle>
      <text x="20" y="15" font-size="9.5" font-weight="700" fill="#fff">${src}</text>
      <text x="312" y="15" font-size="9.5" fill="#fff" text-anchor="end" id="camFps">28 fps</text>
      <rect y="160" width="320" height="20" fill="#000" opacity=".5"/>
      <text x="8" y="173" font-size="8.5" fill="#e0e0e0">${model}<tspan font-weight="700" fill="#fff" id="camBadge"></tspan></text>
      <text x="312" y="173" font-size="8.5" fill="#e0e0e0" text-anchor="end" font-family="ui-monospace,Consolas,monospace" id="camClock"></text>
    </svg></div>`;
}
function cameraTick(d) {
  const c = INS_CAMS[d.id]; if (!c) return;
  const plate = INS.plate || 'WBK 1234';
  document.querySelectorAll('[data-cam-label]').forEach(t => {
    const base = t.dataset.base;
    t.textContent = base === 'PLATE' ? plate : base === 'free' ? 'free' : `${base} ${(.86 + Math.random() * .12).toFixed(2)}`;
  });
  document.querySelectorAll('[data-cam-plate]').forEach(t => { t.textContent = plate; });
  const f = document.getElementById('camFps'); if (f) f.textContent = Math.round(wob(28, 2, .7)) + ' fps · Hailo-8';
  const b = document.getElementById('camBadge');
  if (b) b.textContent = c[0] === 'crowd' ? ` · ${crowd()} people` : c[0] === 'park' ? ` · ${Math.round(wob(46, 6, .05))} free bays` : c[0] === 'control' ? ' · 2 people' : '';
  const k = document.getElementById('camClock'); if (k) k.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
}
function aiEvent(d) {
  const set = INS_CAMS[d.id]?.[0], conf = +(.86 + Math.random() * .12).toFixed(2);
  if (set === 'plate') { INS.plate = newPlate(); return { type: 'plate', plate: INS.plate, confidence: conf, camera: 'ETH1', snapshot: `snap_${Date.now() % 1e6}.jpg` }; }
  if (set === 'line') return { type: 'inspection', result: Math.random() < .06 ? 'defect' : 'ok', confidence: conf, item: Math.floor(time * 3) };
  if (set === 'crowd') return { type: 'count', people: crowd(), camera: 'ETH1' };
  if (set === 'park') return { type: 'occupancy', free_bays: Math.round(wob(46, 6, .05)), camera: 'ETH1' };
  if (set === 'forest') return { type: 'scan', smoke: false, heading_deg: Math.round(time * 12) % 360 };
  if (set === 'room') return { type: 'ppe', person: WTP.aiAlert, helmet: !WTP.aiAlert, confidence: conf };
  if (set === 'control') return { type: 'count', people: 2, camera: 'CSI0' };
  return { type: 'detection', label: Math.random() < .5 ? 'person' : 'vehicle', confidence: conf, camera: 'CSI0', snapshot: `snap_${Date.now() % 1e6}.jpg` };
}

/* ---------- MQTT ---------- */
const topicOf = d => `neoville/${d.zone}/${d.id}`;
function insPublish(d, sub, payload, dir = 'up', note) {
  const kind = insKind(d), feed = INS.feeds[d.id] || (INS.feeds[d.id] = []);
  const msg = { t: new Date(), topic: sub, payload, dir, note };
  if (!netDown(d.id)) { msg.st = 'sent'; INS.last[d.id] = Date.now(); }
  else if (dir === 'down') msg.st = 'failed';
  else if (kind === 'ioc') { msg.st = 'not sent'; INS.missed[d.id] = (INS.missed[d.id] || 0) + 1; }
  else { msg.st = 'queued'; (INS.queue[d.id] || (INS.queue[d.id] = [])).push(msg); }
  feed.unshift(msg); feed.length = Math.min(feed.length, 40);
}
function setNet(d, up) {
  if (up) {
    INS.down.delete(d.id);
    const q = INS.queue[d.id] || [];
    if (q.length) { q.forEach(m => { m.st = 'sent (buffered)'; }); INS.queue[d.id] = []; }
    if (insKind(d) === 'ioc') {
      insPublish(d, 'state', Object.fromEntries(Object.entries(d.io).filter(([, e]) => e.v).map(([k, e]) => [k, e.v()])), 'up', 'full resync');
      INS.missed[d.id] = 0;
    }
  } else INS.down.add(d.id);
}

/* ---------- panel sections ---------- */
function connMapHTML(d) {
  const pins = Object.entries(d.io), rowH = 26, h = Math.max(pins.length * rowH + 8, 150), cy = h / 2;
  const short = d.model.replace('IRIV ', '').replace(' MQTT', '');
  const rows = pins.map(([pin, e], i) => {
    const y = 6 + i * rowH, my = y + 10, c = PIN_COL[pinGroup(pin)] || '#90a4ae', out = pinGroup(pin) === 'DO';
    const line = out ? `<path d="M174 ${cy} C 156 ${cy}, 156 ${my}, 136 ${my}" stroke="${c}" fill="none" stroke-width="1.5" marker-end="url(#insA${pinGroup(pin)})"/>`
                     : `<path d="M134 ${my} C 156 ${my}, 156 ${cy}, 172 ${cy}" stroke="${c}" fill="none" stroke-width="1.5" marker-end="url(#insA${pinGroup(pin)})"/>`;
    return `${line}<rect x="0" y="${y}" width="132" height="20" rx="6" fill="#fff" stroke="#d5dde5"/>
      <circle cx="9" cy="${my}" r="3.5" data-pin-led="${pin}" fill="#c9d1d9"/>
      <text x="17" y="${y + 13.5}" font-size="9.5" font-weight="600" fill="#182c40">${e.t.length > 23 ? e.t.slice(0, 22) + '…' : e.t}</text>
      <text x="138" y="${my - 3}" font-size="8" font-weight="700" fill="${c}">${pin.replace('CSI', 'CAM')}</text>`;
  }).join('');
  const marks = Object.entries(PIN_COL).map(([g, c]) => `<marker id="insA${g}" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="${c}"/></marker>`).join('');
  const link = /4G/i.test(d.conn) ? '4G' : 'MQTT';
  const up = d.id === 'edge'
    ? `<g data-dev="ug65" class="ins-node"><rect x="270" y="${cy - 34}" width="86" height="28" rx="8" fill="#ede7f6" stroke="#7e57c2"/><text x="277" y="${cy - 16}" font-size="9.5" font-weight="700" fill="#182c40">📡 UG65 gateway</text></g>`
    : `<g data-dev="edge" class="ins-node"><rect x="270" y="${cy - 34}" width="86" height="28" rx="8" fill="#fff3e0" stroke="#f57c00"/><text x="277" y="${cy - 16}" font-size="9.5" font-weight="700" fill="#182c40">🧠 IRIV Edge</text></g>`;
  return `<h3>Connected to</h3><div class="ins-card"><svg class="ins-map${netDown(d.id) ? ' down' : ''}" viewBox="0 0 358 ${h}"><defs>${marks}</defs>${rows}
    <rect x="174" y="${cy - 28}" width="70" height="56" rx="10" fill="#fdf0f5" stroke="${CAT[d.cat]?.c || '#d81b60'}" stroke-width="1.5"/>
    <text x="209" y="${cy - 5}" font-size="17" text-anchor="middle">${d.icon}</text><text x="209" y="${cy + 14}" font-size="8.5" font-weight="700" text-anchor="middle" fill="#182c40">${short}</text>
    <path class="ins-flow" d="M244 ${cy - 4} L270 ${cy - 18}" stroke="#d81b60" stroke-width="2.5"/><text x="240" y="${cy + 12}" font-size="7.5" font-weight="700" fill="#d81b60">${link}</text>
    ${up}<path class="ins-flow" d="M313 ${cy - 6} L313 ${cy + 6}" stroke="#90a4ae" stroke-width="2"/>
    <g class="ins-node" data-act="cloudinfo"><rect x="270" y="${cy + 6}" width="86" height="28" rx="8" fill="#e3f2fd" stroke="#1e88e5"/><text x="277" y="${cy + 24}" font-size="9.5" font-weight="700" fill="#182c40">☁️ Dashboard</text></g>
  </svg><p class="mut ins-note">Dots show each wire's live state. ${d.id === 'edge' ? 'Click the gateway' : 'Click IRIV Edge'} to open it.</p></div>`;
}
function rulesHTML(d) {
  const rules = INS_RULES[d.id]; if (!rules) return '';
  const where = insKind(d) === 'ioc' ? '<b>IRIV Edge</b> · the IO Controller reports inputs and switches outputs on command' : `<b>this ${d.model.replace('IRIV ', '')}</b> (local)`;
  return `<h3>Automation rules · live</h3>${rules.map((r, i) => `<div class="ins-rule" data-rule="${i}"><code>IF ${r[0]} → ${r[1]}</code><span class="ins-chip"></span><span class="ins-live"></span><span class="ins-runs">Runs on ${where}</span></div>`).join('')}`;
}
function outputsHTML(d) {
  const outs = Object.entries(d.io).filter(([pin, e]) => pinGroup(pin) === 'DO' && e.v); if (!outs.length) return '';
  return `<h3>Try the outputs</h3><div class="ins-outs">${outs.map(([pin, e]) => `<button class="ins-out" data-ins-do="${pin}"><span class="ins-top"><i class="ins-led"></i>${e.t}</span><span class="ins-pin">${pin}</span><small></small></button>`).join('')}</div>
    <p class="mut ins-note">A test command overrides the rule for 30 seconds, then hands control back.</p>`;
}
function networkHTML() { return `<h3>Network failover</h3><div class="ins-card ins-net"><i class="ins-dot"></i><div class="ins-state"></div><button class="ins-btn" data-act="insnet"></button></div>`; }
function feedHTML(d) { return `<h3>Live MQTT messages</h3><p class="mut ins-note" style="margin:0 0 6px">Topic <code>${topicOf(d)}/#</code> · ↑ from the device · ↓ commands to it</p><div class="ins-feed" id="insFeed"></div>`; }
function healthHTML() { return `<h3>Device health</h3><div class="ins-health" id="insHealth"></div><table class="bom ins-bus"><tbody id="insBus"></tbody></table>`; }

function insightTop(d) {
  if (!insKind(d)) return '';
  INS.cur = d.id; INS.prev[d.id] = null;
  return `<div class="ins">${cameraHTML(d)}${connMapHTML(d)}${rulesHTML(d)}${outputsHTML(d)}${networkHTML()}${feedHTML(d)}${healthHTML()}</div>`;
}
function insightBottom(d) {
  const kind = insKind(d); if (!kind) return '';
  const same = DEVICES.filter(x => x.model === d.model);
  const names = { pic: 'PiControl', ioc: 'IO Controller', ai: 'EdgeAI CM5' };
  const cmp = [['Inside', 'Raspberry Pi CM4 or CM5 · Linux', 'RP2350 microcontroller', 'Raspberry Pi CM5 + Hailo-8 AI · Linux'],
    ['Programming', 'Node-RED, Python, Docker', 'C/C++, MicroPython, CircuitPython', 'Python, AI models, Node-RED, Docker'],
    ['Digital I/O', '4 DI + 4 DO, isolated', '11 DI + 4 DO, isolated', '2 DI + 2 DO, isolated'],
    ['Analog in', '4 isolated', '2 × 12-bit', '—'],
    ['Serial', 'RS485 + RS232, isolated', 'RS485, isolated', 'RS485, isolated'],
    ['Cameras', '—', '—', '2 × MIPI CSI + IP cameras (RTSP)'],
    ['Network', 'Gigabit + 10/100 Ethernet, Wi-Fi, BT', '10/100 Ethernet', 'Dual Gigabit Ethernet'],
    ['If the network drops', 'Keeps running its own rules', 'Holds outputs; Edge rules pause', 'Keeps detecting and switching; stores events'],
    ['Best for', 'Local control and protocol conversion', 'Many contacts at low cost', 'Cameras and CCTV analytics']];
  const col = ['pic', 'ioc', 'ai'].map(k => k === kind ? ' class="ins-me"' : '');
  return `<div class="ins">
    <h3>Also installed at</h3><div class="ins-sites">${same.map(x => x.id === d.id
      ? `<div class="ins-site ins-here"><span>${x.icon}</span><span><b>${x.name}</b><small>${TOPICS[x.zone]?.title || x.loc || ''} · you are here</small></span></div>`
      : `<button class="ins-site" data-dev="${x.id}"><span>${x.icon}</span><span><b>${x.name}</b><small>${TOPICS[x.zone]?.title || x.loc || ''}</small></span><span class="ins-go">→</span></button>`).join('')}</div>
    <h3>Which IRIV device do I need?</h3>
    <table class="ins-cmp"><thead><tr><th></th><th${col[0]}>PiControl</th><th${col[1]}>IO Controller</th><th${col[2]}>EdgeAI CM5</th></tr></thead>
      <tbody>${cmp.map(r => `<tr><td>${r[0]}</td><td${col[0]}>${r[1]}</td><td${col[1]}>${r[2]}</td><td${col[2]}>${r[3]}</td></tr>`).join('')}</tbody></table>
    <p class="mut ins-note">They work together: PiControl or EdgeAI as the main controller, IO Controllers as remote I/O. This is a ${names[kind]}.</p>
    <h3>Official product page</h3>
    <a class="ins-prod" href="${INS_LINKS[kind]}" target="_blank" rel="noopener noreferrer">${d.icon} ${kind === 'ai' ? 'IRIV industrial edge controllers' : d.model.replace(' MQTT', '')} on Cytron ↗</a></div>`;
}

/* ---------- live updates (runs with the panel's 600 ms refresh) ---------- */
function insightTick(d) {
  const kind = insKind(d); if (!kind || INS.cur !== d.id) return;
  const down = netDown(d.id), now = Date.now(), topic = topicOf(d);
  // publish on-change for every on/off pin, plus a 10-second heartbeat with the analog values
  const cur = Object.fromEntries(Object.entries(d.io).filter(([, e]) => e.v).map(([k, e]) => [k, e.v()]));
  const prev = INS.prev[d.id];
  if (prev) for (const [k, v] of Object.entries(cur)) if (typeof v === 'boolean' && prev[k] !== v) {
    const o = INS.ovr[d.id]?.[k], src = pinGroup(k) !== 'DO' ? undefined : o && o.until > now ? 'manual test' : kind === 'ioc' ? 'edge rule' : 'local rule';
    insPublish(d, `${topic}/${k.toLowerCase()}`, Object.assign({ ch: k, name: d.io[k].t, state: v ? 'on' : 'off' }, src ? { source: src } : {}));
  }
  INS.prev[d.id] = cur;
  if (!(now < INS.beat[d.id])) {
    INS.beat[d.id] = now + 10000;
    insPublish(d, `${topic}/status`, Object.assign({ online: true }, Object.fromEntries(Object.entries(cur).filter(([, v]) => typeof v === 'string').slice(0, 4))));
  }
  if (kind === 'ai' && !(now < INS.event[d.id])) { INS.event[d.id] = now + 4000 + Math.random() * 3000; insPublish(d, `${topic}/event`, aiEvent(d)); }
  cameraTick(d);

  document.querySelectorAll('[data-pin-led]').forEach(c => {
    const v = d.io[c.dataset.pinLed]?.v?.();
    c.setAttribute('fill', v === true ? '#2e9d16' : v === false ? '#c9d1d9' : v == null ? '#eceff1' : '#0288d1');
  });
  document.querySelector('.ins-map')?.classList.toggle('down', down);
  (INS_RULES[d.id] || []).forEach((r, i) => {
    const el = document.querySelector(`[data-rule="${i}"]`); if (!el) return;
    const paused = down && kind === 'ioc', on = ruleState(d.id, r[2]), chip = el.querySelector('.ins-chip');
    chip.className = 'ins-chip ' + (paused ? 'p' : on ? 't' : 'f'); chip.textContent = paused ? 'PAUSED' : on ? 'ACTIVE' : 'idle';
    el.querySelector('.ins-live').textContent = paused ? 'IRIV Edge cannot reach the controller' : ruleLive(d.id, r[3]);
  });
  document.querySelectorAll('[data-ins-do]').forEach(b => {
    const pin = b.dataset.insDo, v = d.io[pin].v(), o = INS.ovr[d.id]?.[pin], man = o && o.until > now;
    b.querySelector('.ins-led').classList.toggle('on', v === true); b.disabled = down;
    b.querySelector('small').textContent = down ? 'Can’t send: network down' : man ? `Test ${v ? 'ON' : 'OFF'} · auto in ${Math.ceil((o.until - now) / 1000)} s` : `Auto · ${v ? 'ON' : 'OFF'} · click to test`;
  });
  const net = document.querySelector('.ins-net');
  if (net) {
    const q = (INS.queue[d.id] || []).length, miss = INS.missed[d.id] || 0, name = d.model.replace('IRIV ', '');
    net.classList.toggle('off', down);
    net.querySelector('.ins-state').innerHTML = !down ? `<b>Online</b> · ${d.conn}<br><span class="mut">Cut the link to see what the ${name} does on its own.</span>`
      : kind === 'ioc' ? `<b>Offline</b><br><span class="mut">Outputs hold their last state. ${miss} change${miss === 1 ? '' : 's'} not reported yet; the full state is resent on reconnect.</span>`
      : `<b>Offline · local mode</b><br><span class="mut">${kind === 'ai' ? 'Detection and outputs keep running on the device.' : 'Rules keep running on the PiControl.'} ${q} message${q === 1 ? '' : 's'} buffered for later.</span>`;
    const b = net.querySelector('.ins-btn'); b.textContent = down ? 'Reconnect' : 'Cut network'; b.classList.toggle('good', down);
  }
  const feed = document.getElementById('insFeed');
  if (feed) {
    const items = INS.feeds[d.id] || [];
    feed.innerHTML = items.length ? items.map(m => `<div class="ins-msg${m.dir === 'down' ? ' dn' : ''}"><span class="ins-st${m.st === 'queued' ? ' q' : /not|failed/.test(m.st) ? ' x' : ''}">${m.st}</span>${m.t.toTimeString().slice(0, 8)} ${m.dir === 'down' ? '↓' : '↑'} <span class="ins-tp">${m.topic.replace(topic, '…')}</span>${m.note ? ` <i>(${m.note})</i>` : ''}<br><span class="ins-pl">${escapeUI(JSON.stringify(m.payload))}</span></div>`).join('')
      : '<div class="mut">Waiting for the first message…</div>';
  }
  const up = 3 * 86400 + 18000 + (d.id.length * 7919) % 90000 + Math.floor(time), ago = Math.round((now - (INS.last[d.id] || now)) / 1000);
  const upTxt = `${Math.floor(up / 86400)} d ${Math.floor(up % 86400 / 3600)} h ${Math.floor(up % 3600 / 60)} m`, link = down ? 'Down' : /4G/i.test(d.conn) ? '4G router' : kind === 'ioc' ? 'Ethernet 10/100' : 'Gigabit Ethernet';
  const cams = Object.entries(d.io).reduce((n, [k, e]) => n + (k.startsWith('CSI') && e.v ? 1 : k.startsWith('ETH') ? parseInt(e.v?.()) || 1 : 0), 0);
  const H = kind === 'ai'
    ? [['AI accelerator', `Hailo-8 · ${Math.round(wob(46, 8, .5))}% busy`], ['Cameras analysed', `${cams} online`], ['Inference', `${Math.round(wob(28, 2, .7))} fps`], ['CPU temp.', wob(54, 1.5, .3).toFixed(1) + ' °C'], ['Uptime', upTxt], ['Link', link], ['Last message', down ? 'Buffering' : ago + ' s ago'], ['Storage (clips)', Math.round(wob(38, 1, .01)) + '% used']]
    : kind === 'pic'
    ? [['Software', 'Raspberry Pi OS · Node-RED'], ['Uptime', upTxt], ['CPU temp.', wob(51, 1.5, .3).toFixed(1) + ' °C'], ['CPU load', Math.round(wob(14, 4, .7)) + '%'], ['Link', link], ['Last message', down ? 'Buffering' : ago + ' s ago']]
    : [['Firmware', 'IRIV I/O · MQTT build'], ['Uptime', upTxt], ['Link', link], ['Last message', down ? 'Offline' : ago + ' s ago']];
  const hEl = document.getElementById('insHealth'); if (hEl) hEl.innerHTML = H.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  const bus = Object.entries(d.io).filter(([k, e]) => /^(RS485|RS232|ETH)/.test(k) && e.v);
  const bEl = document.getElementById('insBus');
  if (bEl) bEl.innerHTML = bus.length ? bus.map(([k, e]) => `<tr><td class="mdl">${k}</td><td>${e.t}</td><td class="q">${down ? '—' : `<span class="on">● ${e.v()}</span>`}</td></tr>`).join('') : '';
}

panel.addEventListener('click', e => {
  const d = DEV[selDev]; if (!d || !insKind(d)) return;
  const o = e.target.closest('[data-ins-do]');
  if (o && !o.disabled) {
    const pin = o.dataset.insDo, v = !d.io[pin].v();
    insPublish(d, `${topicOf(d)}/${pin.toLowerCase()}/set`, { state: v ? 'on' : 'off', hold_s: 30 }, 'down');
    (INS.ovr[d.id] || (INS.ovr[d.id] = {}))[pin] = { v, until: Date.now() + 30000 };
    insightTick(d); return;
  }
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'insnet') { setNet(d, netDown(d.id)); insightTick(d); }
  if (act === 'cloudinfo') { tip.textContent = '☁️ Summaries and alarms go to the city dashboard'; const r = e.target.getBoundingClientRect(); tip.style.left = r.left + 'px'; tip.style.top = r.top + 'px'; tip.style.opacity = 1; setTimeout(() => { tip.style.opacity = 0; }, 1600); }
});

// Map badges: offline devices and outputs under a manual test stay visible after the panel closes.
function drawDeviceBadges() {
  if (scene !== 'city' || WALK.on || !showDev) return;
  const now = Date.now();
  for (const d of DEVICES) {
    if (d.x === undefined) continue;
    const tests = Object.entries(INS.ovr[d.id] || {}).filter(([, o]) => o.until > now);
    if (!netDown(d.id) && !tests.length) continue;
    const p = P(d.x, d.y, d.z), y = p[1] - 52;
    if (netDown(d.id)) pill(p[0], y, '⚠ Offline', '#c62828', '#fff', 10.5);
    else pill(p[0], y, `🧪 ${tests.map(([k, o]) => k + ' ' + (o.v ? 'ON' : 'OFF')).join(' · ')}`, '#f57c00', '#fff', 10.5);
  }
}
