/* River ferry: a water bus on the river between the city and the highway, calling at three quays with
   "next ferry" screens. It stops in a storm (WX, weather.js). Loaded after power-grid.js. */

const FERRY = { stops: [['North Quay', 18, 'E'], ['Bridge Quay', 36, 'W'], ['South Quay', 41.5, 'E']], seq: [0, 1, 2, 1], sched: [], Tc: 1, t: 0, y: 18, dir: 1, at: 0, next: 1, status: 'Docked', pax: 38 };
const FERRY_X = -11.2, fsm = f => f * f * (3 - 2 * f);
(() => {   // dwell 8 s at each call, then a smooth run to the next quay
  let t = 0;
  FERRY.seq.forEach((s, i) => { const to = FERRY.seq[(i + 1) % FERRY.seq.length], d = Math.abs(FERRY.stops[to][1] - FERRY.stops[s][1]), T = Math.max(6, d / 1.6);
    FERRY.sched.push({ i, from: s, to, t0: t, dwell: 8, T }); t += 8 + T; });
  FERRY.Tc = t;
})();
FERRY.eta = k => {   // minutes until a boat arrives at quay k
  const tc = FERRY.t % FERRY.Tc;
  if (FERRY.at === k) return 'Boarding';
  return Math.max(1, Math.round(Math.min(...FERRY.sched.filter(e => e.to === k).map(e => (e.t0 + e.dwell + e.T - tc + FERRY.Tc) % FERRY.Tc)) / 6)) + ' min';
};
function updateFerry(dt) {
  const storm = WX.cur() === 'storm';
  if (!storm) FERRY.t += dt;
  const tc = FERRY.t % FERRY.Tc, e = FERRY.sched.find(e => tc >= e.t0 && tc < e.t0 + e.dwell + e.T) || FERRY.sched[0], u = tc - e.t0, a = FERRY.stops[e.from][1], b = FERRY.stops[e.to][1];
  if (u < e.dwell) { FERRY.y = a; FERRY.at = e.from; FERRY.status = 'Docked at ' + FERRY.stops[e.from][0]; }
  else { FERRY.y = a + (b - a) * fsm((u - e.dwell) / e.T); FERRY.at = -1; FERRY.status = 'Sailing'; FERRY.dir = Math.sign(b - a) || 1; }
  if (storm) FERRY.status = 'Service suspended · storm';
  FERRY.next = e.to;
}
updateFerry(0);

TOPICS.ferry = { icon: '⛴️', color: '#0277bd', kicker: 'Transport', title: 'River Ferry',
  sum: 'A water bus sails up and down the river between the city and the highway, calling at North Quay, Bridge Quay and South Quay. An IRIV EdgeAI CM5 counts the queue at the quay, an IRIV IO Controller lowers the gangway and switches the mooring lights, and Milesight VS133 counters count boarding. Service stops in a storm.',
  how: ['EdgeAI CM5 counts the people waiting on the quay and tells the screen when to expect a full boat.', 'IO Controller MQTT lowers the gangway when the boat is alongside and runs the mooring lights at night.', 'VS133 counts passengers on and off.', 'Every quay screen shows the next ferry; a storm suspends the service.'], ben: ['Skips the traffic', 'Clear arrival times', 'Safe boarding'],
  m: [['Ferry', () => FERRY.status], ['Next stop', () => FERRY.stops[FERRY.next][0]], ['Arrives in', () => FERRY.eta(FERRY.next)], ['Passengers today', () => fint(FERRY.pax + Math.floor(FERRY.t / 4))]],
  chain: [['📷', 'Quay camera', 'Ethernet → EdgeAI CM5'], ['🔀', 'Gangway & lights', 'IO Controller MQTT'], ['👥', 'Boarding counters', 'VS133 · LoRaWAN'], ['☁️', 'IRIV Edge', 'live timetable']],
  say: 'This is the river ferry. It calls at three quays, and every quay has a screen showing the next ferry. An I R I V Edge A I camera counts the queue, and an I O Controller lowers the gangway. In a storm the service stops.' };
ORDER.push('ferry');
ZINFO.ferry = { x: -11, y: 30, z: 2.4 };

// quays: a wooden jetty, a canopy and a "next ferry" screen
FERRY.stops.forEach(([name, y, side], k) => {
  const x0 = side === 'E' ? -10.2 : -13, x1 = side === 'E' ? -9 : -11.9;
  box('ferry', x0, y - .9, x1, y + .9, .12, '#8d6e63', { z0: .03, roof: '#a1887f' });
  box('ferry', x0 + .1, y - .7, x1 - .1, y + .7, .06, '#455a64', { z0: 1.3, roof: '#607d8b' });
  for (const dy of [-.6, .6]) box('ferry', (side === 'E' ? x1 - .2 : x0 + .1), y + dy - .04, (side === 'E' ? x1 - .1 : x0 + .2), y + dy + .04, 1.3, '#90a4ae', { z0: .15 });
  add('fsign', 'ferry', side === 'E' ? -9.6 : -12.4, y, { k });
});
function drawFerry() {
  const y = FERRY.y, c = ['#1565c0', '#fafafa'];
  if (FERRY.at < 0 && WX.cur() !== 'storm') poly(quad(-11.9, y - FERRY.dir * 3.2, -10.5, y - FERRY.dir * 1.2, .016), 'rgba(255,255,255,.38)');   // wake
  drawBox({ x0: -11.8, x1: -10.6, y0: y - 1.4, y1: y + 1.4, z0: .02, h: .28, color: c[0], stripe: c[1] });
  drawBox({ x0: -11.6, x1: -10.8, y0: y - .9, y1: y + .9, z0: .3, h: .4, color: '#fafafa', win: 'bands', id: 1300 });
  drawBox({ x0: -11.45, x1: -10.95, y0: y - .2, y1: y + .2, z0: .7, h: .25, color: '#fafafa' });
  drawBox({ x0: -11.25, x1: -11.1, y0: y + .5, y1: y + .65, z0: .7, h: .3, color: '#e53935' });
}
function drawFerrySign(o) {
  const [name, y, side] = FERRY.stops[o.k], p = P(o.cx, y, 2.0); if (sc < 9 || p.b) return;
  const here = FERRY.at === o.k, txt = WX.cur() === 'storm' ? `${name} · service suspended` : here ? `⛴️ ${name} · boarding → ${FERRY.stops[FERRY.next][0]}` : `${name} · next ferry ${FERRY.eta(o.k)}`;
  pill(p[0], p[1], txt, WX.cur() === 'storm' ? '#7f1d1d' : '#0f1724', here ? '#69f0ae' : '#ffd54f', Math.max(8, Math.min(12, sc * .18)));
}

const _ferryDrawObj = drawObj;
drawObj = function (o, path) { if (o.t === 'ferry') return drawFerry(); if (o.t === 'fsign') return drawFerrySign(o); return _ferryDrawObj(o, path); };
const _ferryUpdate = updateHighway; updateHighway = function (dt) { _ferryUpdate(dt); updateFerry(dt); };
const _ferryEntities = airportEntities; airportEntities = function (list) { _ferryEntities(list); list.push({ o: { t: 'ferry', zone: 'ferry' }, d: depth(FERRY_X, FERRY.y) }); };

DEVICES.push(
  fdev({ id: 'fer-ai', cat: 'ai', brand: 'IRIV', model: 'IRIV EdgeAI CM5', name: 'Quay Queue Camera', icon: '📷', zone: 'ferry', x: -9.4, y: 41.5, z: 2.0, qty: 1,
    conn: 'IP camera (RTSP) · 4G router · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Quay CCTV', 'Ethernet', 'EdgeAI CM5', 'Screen + MQTT', 'IRIV Edge'],
    loc: 'South Quay canopy', short: 'River ferry', what: 'Counts the people waiting on the quay, so the screen can say when the next boat will be full.', why: 'On the canopy, covering the whole queue.',
    m: [['Waiting', () => Math.round(wob(18, 8, .2))], ['Next ferry', () => FERRY.eta(2)], ['Boat full?', () => wob(18, 8, .2) > 24 ? 'Nearly' : 'No'], ['Model', () => 'People count']],
    say: 'This A I camera counts the people waiting for the ferry at the quay.' }),
  fdev({ id: 'fer-ioc', cat: 'controller', brand: 'IRIV', model: 'IRIV IO Controller MQTT', name: 'Quay Gangway & Lights Controller', icon: '🔀', zone: 'ferry', x: -9.4, y: 18.4, z: 1.2, qty: 1,
    conn: '4G router · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Boat sensor, gangway', 'DI / DO', 'IO Controller', '4G · MQTT', 'IRIV Edge'],
    loc: 'North Quay panel', short: 'River ferry', what: 'Lowers the gangway when the boat is alongside and switches the mooring lights at night or in rain.', why: 'In the quay panel, close to the gangway.',
    m: [['Boat alongside', () => FERRY.at === 0 ? 'Yes' : 'No'], ['Gangway', () => FERRY.at === 0 ? 'Down' : 'Up'], ['Mooring lights', () => night > .5 || WX.cur() !== 'clear' ? 'On' : 'Off'], ['MQTT', () => 'Connected']],
    say: 'This I O Controller lowers the ferry gangway when the boat arrives and switches on the lights at night.' }),
  fdev({ id: 'fer-vs', model: 'VS133', name: 'Ferry Boarding Counter', icon: '👥', zone: 'ferry', x: -12.4, y: 36, z: 1.3, qty: 3, power: 'DC / PoE',
    loc: 'The three quays', short: 'River ferry', what: 'Counts passengers boarding and leaving at each quay.', why: 'Above the gangway of each quay.',
    m: [['Boarded today', () => fint(FERRY.pax + Math.floor(FERRY.t / 4))], ['On the boat', () => Math.round(wob(22, 8, .2))], ['Peak', () => '08:05'], ['Battery', () => '—']],
    say: 'These counters count the passengers who board the ferry.' })
);
DEVICES.forEach(d => { if (!DEV[d.id]) DEV[d.id] = d; });
