/* Mega Airport east of the city, and the Metro Loop: an elevated railway that circles the city centre,
   runs out to the airport and stops at five stations with live "next stop" screens.
   Loaded after utilities.js and before device-insights.js. */

const AIR = { x0: 60, x1: 112, y0: 2, y1: 46 };
const ROAD_COL = '#6b727b';

// ---------- topics ----------
Object.assign(TOPICS, {
  airport: { icon: '✈️', color: '#0277bd', kicker: 'Mega Airport', title: 'Mega Airport',
    sum: 'A mega airport beside the city: runway, terminal, control tower, apron with gates, baggage hall, fuel farm and a car park, linked to the city by the Metro Loop and the main road. IRIV cameras watch the terminal and apron, an IRIV PiControl runs the runway lights and an IRIV IO Controller runs the baggage belts.',
    how: ['EdgeAI CM5: crowd counting in the departure hall and safety cameras on the apron.', 'PiControl: runway and approach lights follow the ambient light level; RS485 to the PAPI lights.', 'IO Controller MQTT: baggage belts, jam sensors and emergency stops.', 'AM319 air quality in the terminal, VS133 counters at the gates, WTS506 weather stations on the airfield.'],
    ben: ['Shorter queues', 'Safer apron', 'Fewer baggage jams', 'Lights only when needed'],
    m: [['Flights today', () => fint(220 + Math.floor(time / 20))], ['Passengers in terminal', () => fint(FL.pax())], ['Runway', () => AIRFX.runway], ['Wind', () => Math.round(wob(14, 4, .3)) + ' km/h']],
    chain: [['📷', 'Terminal & apron cameras', 'Ethernet → EdgeAI CM5'], ['💡', 'Airfield lighting', 'PiControl'], ['🧳', 'Baggage belts', 'IO Controller MQTT'], ['🌦️', 'Weather stations', 'LoRaWAN'], ['☁️', 'IRIV Edge', 'one view of the airport']],
    extra: () => '<h3>Live departures</h3><table class="bom anpr"><thead><tr><th>Time</th><th>Flight</th><th>To</th><th>Gate</th><th class="q">Status</th></tr></thead><tbody id="flboard">' + flRows() + '</tbody></table><p class="mut" style="font-size:11.5px;margin:6px 0 0">Simulated schedule. The same board is in the check-in hall and the control centre.</p>',
    tick: () => { const t = document.getElementById('flboard'); if (t) t.innerHTML = flRows(); },
    say: 'This is the mega airport next to the city. A I cameras count passengers in the departure hall and keep the apron safe. A PiControl switches the runway lights, and an I O Controller runs the baggage belts. Planes take off and land all day, and the Metro Loop brings passengers from the city.' },
  airstation: { icon: '🚉', color: '#00897b', kicker: 'Mega Airport', title: 'Airport Station',
    sum: 'The Metro Loop stops here, on a raised platform with a covered bridge to the terminal. An IRIV PiControl drives the platform signal, the doors and the "next stop" screens, and an IRIV EdgeAI camera counts the crowd on the platform.',
    how: ['PiControl: platform signal, door release and the next-stop screen.', 'EdgeAI CM5: platform crowd counting.', 'Covered bridge straight to the departure hall.'], ben: ['Clear information', 'Safe boarding', 'No car needed'],
    m: [['Next train', () => RAIL.eta(3)], ['Train now', () => RAIL.status], ['On the platform', () => Math.round(wob(60, 20, .2))], ['Screen', () => RAIL.nextName]],
    extra: () => '<button class="tourbtn" data-ride="1">🚆 Ride the train</button>',
    say: 'This is the airport station. The next stop screen tells passengers when the train arrives, and an A I camera counts the crowd on the platform. A covered bridge leads to the terminal.' },
  airterminal: { icon: '🎫', color: '#0277bd', kicker: 'Mega Airport', title: 'Check-in & Ticketing',
    sum: 'Where passengers buy and print tickets, check in, drop their bags and clear security. IRIV SmartHub CM5 terminals run the check-in counters, an IRIV EdgeAI camera counts the queues and an IRIV IO Controller runs the baggage belts.',
    how: ['SmartHub CM5 at every check-in counter: ticket, boarding pass and bag tag printing.', 'EdgeAI CM5 counts the queue and tells the screens to open another counter.', 'IO Controller MQTT starts the baggage belts and stops them on a jam.', 'AM319 keeps the hall fresh and comfortable.'], ben: ['Short queues', 'Fast bag drop', 'Fewer baggage jams'],
    m: [['Check-ins today', () => fint(3400 + Math.floor(time * 2))], ['Queue', () => Math.round(wob(9, 4, .2)) + ' min'], ['Counters open', () => '8 / 10'], ['Bags / hour', () => fint(wob(1400, 120, .1))]],
    say: 'This is the check-in hall. Passengers buy tickets, check in and drop their bags at the counters. An A I camera counts the queue so another counter can open, and an I O Controller runs the baggage belts.' },
  airarrival: { icon: '🧳', color: '#00838f', kicker: 'Mega Airport', title: 'Arrivals & Baggage Claim',
    sum: 'Where arriving passengers collect their bags and meet their families. When a flight reaches the gate, an IRIV IO Controller starts the carousel, and Milesight VS133 counters count people through the arrivals doors.',
    how: ['IO Controller MQTT starts the carousel when the flight reaches the gate, and stops it on a jam.', 'The arrivals board shows the flight, its origin and the belt.', 'VS133 counts people through the arrivals doors.'], ben: ['Bags arrive with the passengers', 'Fewer jams', 'Clear information'],
    m: [['Flight on belt', () => { const f = FL.board().find(r => r.u >= 24 && r.u < 80) || FL.info(0); return f.arrNo; }], ['From', () => { const f = FL.board().find(r => r.u >= 24 && r.u < 80) || FL.info(0); return f.from; }], ['Carousel', () => FL.board().some(r => r.u >= 28 && r.u < 80) ? 'Running' : 'Stopped'], ['Bags / hour', () => fint(wob(1400, 120, .1))]],
    say: 'This is arrivals and baggage claim. When a plane reaches the gate, the I O Controller starts the carousel and the bags come round. Passengers collect them and walk out to meet their families.' },
  airsecurity: { icon: '🛂', color: '#455a64', kicker: 'Mega Airport', title: 'Security & Immigration',
    sum: 'Every departing passenger passes the X-ray lanes and the passport e-gates. An IRIV IO Controller runs the lane belts, gates and alarm beacon, and Milesight VS133 counters measure the queue on every lane.',
    how: ['IO Controller MQTT runs the lane belts and gates and lights the alarm beacon.', 'VS133 counts people per lane, so the screens show the waiting time.', 'Passport e-gates open for matching faces.'], ben: ['Shorter waits', 'Safe screening'],
    m: [['Lanes open', () => '3 / 3'], ['Waiting time', () => Math.round(wob(8, 3, .2)) + ' min'], ['Screened today', () => fint(3200 + Math.floor(time * 2))], ['Alarms', () => '0']],
    say: 'This is security and immigration. Passengers put their bags through the X-ray, walk through the arch and pass the e-gates. An I O Controller runs the lanes and counters measure the queue.' },
  airfood: { icon: '🍜', color: '#ef6c00', kicker: 'Mega Airport', title: 'Food Court & Duty Free',
    sum: 'Restaurants, cafés and duty-free shops for waiting passengers. Each till is an IRIV SmartHub CM5 that scans, takes payment and syncs sales to the airport control centre.',
    how: ['SmartHub CM5 tills at every stall and in duty free.', 'Queue-number screens over the food stalls.', 'Sales sync to IRIV Edge in the control centre.'], ben: ['Quick service', 'Live sales', 'Stock never runs out'],
    m: [['Diners', () => Math.round(wob(180, 30, .2))], ['Sales today', () => 'RM ' + fint(18000 + time * 4)], ['Stalls open', () => '9 / 10'], ['Queue number', () => 'No. ' + (100 + Math.floor(time / 9) % 90)]],
    say: 'This is the food court and duty free. Every stall has an I R I V SmartHub till, and the sales go straight to the airport control centre.' },
  airgate: { icon: '🛫', color: '#5e35b1', kicker: 'Mega Airport', title: 'Departure Gates',
    sum: 'Gate lounges where passengers wait and board. Milesight VS133 counters count passengers as they board, and the boarding screen shows flight, gate and status.',
    how: ['VS133 counts every passenger through the gate.', 'Boarding screens show the flight and the gate.', 'Jet bridges link each gate to the aircraft.'], ben: ['No one left behind', 'On-time departures'],
    m: [['Gate B3', () => FL.info(2).dep], ['Flight', () => FL.info(2).no + ' → ' + FL.info(2).dest], ['Boarded', () => FL.info(2).u < 52 ? '0' : fint(Math.min(180, Math.round((FL.info(2).u - 52) * 6.5)))], ['Next departure', () => FL.board()[0].no + ' ' + FL.board()[0].t]],
    say: 'These are the departure gates. A people counter counts each passenger who boards, and the screen shows the flight and gate.' },
  aircontrol: { icon: '🖥️', color: '#00695c', kicker: 'Mega Airport', title: 'Airport Control Centre',
    sum: 'Where airport management works. An IRIV EdgeAI CM5 collects data from every IRIV unit and Milesight sensor at the airport and on the Metro Loop, and the video wall shows cameras, the airfield map, passenger counts and the car park.',
    how: ['EdgeAI CM5 operations computer receives MQTT from every unit.', 'Video wall: terminal and apron cameras, airfield map, KPIs.', 'Car park entries and number plates are monitored here.', 'Operators open counters, gates and lanes from this room.'], ben: ['One view of the airport', 'Faster decisions', 'Fewer incidents'],
    m: [['Passengers in terminal', () => fint(FL.pax())], ['Cars in car park', () => ACP.inside + ' / ' + ACP.cap], ['Flights today', () => fint(220 + Math.floor(time / 20))], ['Alarms', () => '0']],
    say: 'This is the airport control centre, where management works. The video wall shows the cameras, the airfield, the passengers and the car park, all from I R I V units across the airport.' },
  aircarpark: { icon: '🅿️', color: '#1565c0', kicker: 'Mega Airport', title: 'Airport Car Park · Pay by Plate',
    sum: 'A long-stay car park next to the airport station. An IRIV EdgeAI CM5 reads the number plate of every car at the entry barrier, opens the barrier and counts the cars inside. The control centre sees the live count and the plate log.',
    how: ['The EdgeAI CM5 reads the plate from the entry camera and opens the barrier through a digital output.', 'An IRIV IO Controller drives the FULL sign and watches the gas level.', 'The count and plate log reach the control centre in real time.'], ben: ['No tickets', 'Live free spaces', 'Plate history for security'],
    m: [['Cars inside', () => ACP.inside + ' / ' + ACP.cap], ['Free spaces', () => ACP.cap - ACP.inside], ['Entries today', () => fint(ACP.entries)], ['Last plate', () => ACP.log[0] ? ACP.log[0].plate : '—']],
    extra: () => '<h3>Live number-plate log (ANPR)</h3><table class="bom anpr"><thead><tr><th>Plate</th><th>In</th><th class="q">Status</th></tr></thead><tbody id="acplog">' + acpRows() + '</tbody></table><p class="mut" style="font-size:11.5px;margin:6px 0 0">Plates are simulated. The same log is on the video wall in the control centre.</p>',
    tick: () => { const t = document.getElementById('acplog'); if (t) t.innerHTML = acpRows(); },
    chain: [['📷', 'Entry camera', 'Ethernet → EdgeAI CM5'], ['🧠', 'IRIV EdgeAI CM5', 'reads the plate'], ['🚧', 'Barrier', 'opened by digital output'], ['🔀', 'IO Controller', 'FULL sign, gas'], ['🖥️', 'Control centre', 'live count and plates']],
    say: 'This is the airport car park, next to the station. An I R I V Edge A I computer reads every number plate at the entry and opens the barrier. The count and the plates show in the control centre.' },
  rail: { icon: '🚆', color: '#455a64', kicker: 'Transport', title: 'Metro Loop',
    sum: 'An elevated loop railway above the city roads. It calls at City Hub, Market, the Airport, Industrial Park and Hospital, with a live "next stop" screen on every platform and above the train.',
    how: ['Elevated deck above the roads, so it never crosses traffic.', 'PiControl at the airport station drives signals and screens.', 'VS133 counters at the stations measure passenger flow.'], ben: ['Fast city to airport', 'Less traffic', 'Live arrival times'],
    m: [['Train', () => RAIL.status], ['Next stop', () => RAIL.nextName], ['Arrives in', () => RAIL.etaNext()], ['Stations', () => '5']],
    extra: () => '<button class="tourbtn" data-ride="1">🚆 Ride the train</button>',
    say: 'This is the Metro Loop, an elevated railway above the city roads. It stops at five stations, including the airport, and every platform shows the next stop.' }
});
ORDER.push('airport', 'airarrival', 'airsecurity', 'airterminal', 'airfood', 'airgate', 'aircontrol', 'aircarpark', 'airstation', 'rail');
ZINFO.airarrival = { x: 71, y: 21, z: 3.4 }; ZINFO.airsecurity = { x: 87.5, y: 21, z: 3.4 };
ZINFO.airterminal = { x: 82, y: 21, z: 3.4 }; ZINFO.airfood = { x: 90, y: 21, z: 3.4 }; ZINFO.airgate = { x: 98, y: 21, z: 3.4 }; ZINFO.aircontrol = { x: 107.5, y: 21, z: 3.4 }; ZINFO.aircarpark = { x: 84, y: 36.5, z: 2.4 };
ZINFO.airport = { x: 90, y: 17, z: 2.2 }; ZINFO.airstation = { x: 90, y: 33, z: 3.6 }; ZINFO.rail = { x: 30, y: 27, z: 1.2 };

// ---------- airport scenery ----------
[['airarrival', 66, 76], ['airterminal', 78, 85], ['airsecurity', 85, 90], ['airfood', 90, 96], ['airgate', 96, 102]].forEach(([z, x0, x1]) => {   // one building, three rooms you can walk into
  box(z, x0, 18, x1, 23, 1.6, '#e8eef3', { win: 'bands', roof: '#90a4ae' });
  box(z, x0 + .2, 22.8, x1 - .2, 23.4, 1.0, '#81d4fa', { roof: '#b3e5fc' });
});
for (let k = 0; k < 4; k++) box('airport', 81 + k * 5.5 + 1.3, 16.4, 81 + k * 5.5 + 1.7, 18, .5, '#b0bec5', { z0: .45 });   // jet bridges
box('airport', 62.5, 20, 63.8, 21.3, 4.2, '#cfd8dc', { win: 'bands', roof: '#90a4ae' });
box('airport', 62.1, 19.6, 64.2, 21.7, .6, '#4fc3f7', { z0: 4.2, roof: '#0277bd' });                                              // tower cab
box('aircontrol', 104, 18, 111, 24, 2.2, '#cfd8dc', { win: 'bands', roof: '#0277bd' });                                           // airport control centre
box('aircontrol', 105.2, 19.2, 109.8, 22.8, .5, '#0277bd', { z0: 2.2, roof: '#4fc3f7' });
add('tank', 'airport', 108.5, 28, { r: .9, h: 1.5 }); add('tank', 'airport', 108.5, 31, { r: .9, h: 1.5 });                      // fuel farm
for (let r = 0; r < 3; r++) for (let k = 0; k < 20; k++) {
  const x = 66 + k * 1.7, y = 35 + r * 1.6;
  box('aircarpark', x, y, x + .6, y + .32, .2, CARCOL[(k * 3 + r) % CARCOL.length], { roof: '#eceff1', lod: 8 });
}
for (let x = 62; x < 108; x += 4.5) { tree('airport', x, 27.2, .6); tree('airport', x, 24.2, .5); }
objs.filter(o => o.t === 'tree' && o.zone === 'airport').forEach(o => { o.lod = 8; });
add('abarrier', 'aircarpark', 63.0, 33.2);
const GATES = [81, 86.5, 92, 97.5];
const AIRFX = { runway: 'Clear' };
let FLT = 0;   // flight clock: runs with `time`, but stops while a storm holds the airport
// A live flight schedule: each gate repeats a 120 s turnaround, 30 s apart. Planes land, taxi to the gate,
// unload, board, push back, taxi out and take off, and every screen reads the same schedule.
const AIRLINES = [['Malaysia Air', 'MY', '#1e88e5'], ['Skyline', 'SK', '#43a047'], ['Orient Jet', 'OJ', '#fb8c00'], ['Pacific', 'PC', '#8e24aa']];
const DESTS = ['Kuala Lumpur', 'Singapore', 'Tokyo', 'London', 'Dubai', 'Sydney', 'Bangkok', 'Seoul'];
function flRows() { return FL.board().map(r => '<tr><td>' + r.t + '</td><td><b>' + r.no + '</b></td><td>' + r.dest + '</td><td>' + r.gate + '</td><td class="q">' + r.dep + '</td></tr>').join(''); }
const FLC = 120, mod = (a, n) => ((a % n) + n) % n;
const PATH_IN = g => [[98, 5.5], [98, 9.0], [GATES[g] + 1.5, 9.0], [GATES[g] + 1.5, 14.2]];
const PATH_OUT = g => [[GATES[g] + 1.5, 14.2], [GATES[g] + 1.5, 9.0], [67, 9.0], [67, 5.5]];
function alongPath(pts, f) {
  const seg = pts.slice(1).map((b, i) => Math.hypot(b[0] - pts[i][0], b[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, f)) * L, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
  const a = pts[i], b = pts[i + 1], u = seg[i] ? d / seg[i] : 0, horiz = a[1] === b[1];
  return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, axis: horiz ? 'x' : 'y', dir: Math.sign(horiz ? b[0] - a[0] : b[1] - a[1]) || 1 };
}
function flightInfo(g, t = FLT) {
  const n = Math.floor((t - 30 * g) / FLC), u = mod(t - 30 * g, FLC), al = AIRLINES[mod(n * 3 + g, 4)];
  const no = al[1] + ' ' + (1000 + mod(n * 37 + g * 211, 900)), dest = DESTS[mod(n * 5 + g * 3, 8)], from = DESTS[mod(n * 3 + g * 5 + 1, 8)];
  const status = u < 10 ? 'Landing' : u < 24 ? 'Taxiing in' : u < 52 ? 'Arrived · deplaning' : u < 80 ? 'Boarding' : u < 92 ? 'Final call' : u < 100 ? 'Gate closed' : u < 110 ? 'Pushback' : 'Departed';
  const hold = WX.cur() === 'storm' && u < 100;   // storm: flights wait
  const dep = hold ? 'Delayed · weather' : status === 'Departed' ? 'Departed' : u < 52 ? 'On time' : status;
  const eta = mod(100 - u, FLC);
  return { g, n, u, al, hold, no: al[1] + ' ' + (1001 + mod(n * 37 + g * 211, 900)), arrNo: no, dest, from, status, dep, eta, gate: 'B' + (g + 1), t: hhmm(new Date(Date.now() + eta * 30000)) };
}
const FL = {
  eta0: () => Math.min(...[0, 1, 2, 3].map(g => mod(100 - mod(FLT - 30 * g, FLC), FLC))),
  claimOn: () => [0, 1, 2, 3].some(g => { const u = mod(FLT - 30 * g, FLC); return u >= 28 && u < 80; }),
  busy: () => [0, 1, 2, 3].filter(g => { const u = mod(FLT - 30 * g, FLC); return u >= 24 && u < 100; }).length,
  pax: () => Math.round(1400 + FL.busy() * 520 + wob(0, 120, .1)),
  info: flightInfo,
  board: () => [0, 1, 2, 3].map(g => flightInfo(g)).sort((a, b) => a.eta - b.eta),
  rows: () => FL.board().map(r => r.t + '  ' + r.dest.padEnd(12).slice(0, 12) + ' ' + r.no + '  ' + r.dep),
  planes: [0, 1, 2, 3].map(g => ({ x: 0, y: 0, axis: 'x', dir: 1, z: 0, col: '#fff', hide: true, g }))
};
function planeState(g, t) {
  const u = mod(t - 30 * g, FLC), p = FL.planes[g], gx = GATES[g] + 1.5, sm = f => f * f * (3 - 2 * f); p.hide = false; p.col = AIRLINES[mod(Math.floor((t - 30 * g) / FLC) * 3 + g, 4)][2]; p.z = 0;
  if (u < 5) { Object.assign(p, { x: 58 + u / 5 * 18, y: 5.5, axis: 'x', dir: 1, z: 1.2 * (1 - u / 5) }); }
  else if (u < 10) { const f = (u - 5) / 5; Object.assign(p, { x: 76 + 22 * (1 - Math.pow(1 - f, 2)), y: 5.5, axis: 'x', dir: 1 }); }
  else if (u < 24) Object.assign(p, alongPath(PATH_IN(g), sm((u - 10) / 14)));
  else if (u < 100) Object.assign(p, { x: gx, y: 14.2, axis: 'y', dir: 1 });
  else if (u < 110) { Object.assign(p, alongPath(PATH_OUT(g), sm((u - 100) / 10))); if (p.axis === 'y') p.dir = 1; }   // pushed back tail-first, nose to the terminal
  else { const f = (u - 110) / 10; Object.assign(p, { x: 67 + 45 * f * f, y: 5.5, axis: 'x', dir: 1, z: Math.max(0, (f - .7) * 8) }); if (p.x > AIR.x1 + 2) p.hide = true; }
  return u < 10 || u >= 110;
}

function airportSlab() {
  const p = new Path2D();
  drawBox({ x0: AIR.x0, y0: AIR.y0, x1: AIR.x1, y1: AIR.y1, z0: -.7, h: .7, color: '#dfe5ea', roof: '#9bbf7a' }, p);
  hits.push({ path: p, zone: 'airport' });
}
function airportGround() {
  const W = '#ffffff', Y = '#f9a825';
  poly(quad(53.6, 29.7, AIR.x1 - 1, 31.3, .012), col(ROAD_COL));                                      // the city road continues to the terminal
  for (let x = 54; x < AIR.x1 - 2; x += 1.6) poly(quad(x, 30.46, x + .8, 30.54, .014), 'rgba(255,255,255,.8)');
  poly(quad(66, 4, 108, 7, .012), col('#454a52'));                                                      // runway
  for (let x = 69; x < 105; x += 2.6) poly(quad(x, 5.46, x + 1.3, 5.54, .014), W);
  for (let k = 0; k < 5; k++) { poly(quad(66.6, 4.3 + k * .55, 68.2, 4.55 + k * .55, .014), W); poly(quad(105.8, 4.3 + k * .55, 107.4, 4.55 + k * .55, .014), W); }
  poly(quad(66, 8.5, 108, 9.5, .012), col('#5b616b')); poly(quad(66, 8.96, 108, 9.04, .014), Y);       // taxiway
  for (const x of [72, 100]) poly(quad(x, 7, x + 1.6, 8.5, .012), col('#5b616b'));
  poly(quad(76, 9.5, 106, 18, .012), col('#6a707a'));                                                   // apron
  GATES.forEach(x => { poly(quad(x + 1.45, 10, x + 1.55, 16.2, .014), Y); });
  poly(quad(76, 23, 102, 29.7, .012), col('#b8c0c8'));                                                  // forecourt
  poly(quad(62.4, 31.3, 63.6, 38.8, .012), col(ROAD_COL)); poly(quad(63.0 - .04, 31.6, 63.0 + .04, 38.6, .014), 'rgba(255,255,255,.7)');   // car park entry lane
  poly(quad(64, 34.4, 104, 39.4, .012), col('#6f7680'));                                                // car park
  for (let k = 0; k <= 20; k++) line(P(66 + k * 1.7 - .1, 34.6, .02), P(66 + k * 1.7 - .1, 39.0, .02), 'rgba(255,255,255,.55)', 1);
}

// ---------- the airfield: one take-off and one landing in every 40 s ----------
function planeParts(p) {
  const f = p.dir, X = (a, b) => p.axis === 'x' ? p.x + f * a : p.x + b, Yv = (a, b) => p.axis === 'x' ? p.y + b : p.y + f * a;
  const bx = (a0, b0, a1, b1, z0, h, color, extra) => {
    const xa = X(a0, b0), xb = X(a1, b1), ya = Yv(a0, b0), yb = Yv(a1, b1);
    drawBox(Object.assign({ x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: Math.min(ya, yb), y1: Math.max(ya, yb), z0: z0 + p.z, h, color }, extra));
  };
  bx(-.3, -.95, .5, -.17, .26, .05, '#cfd8dc'); bx(-.3, .17, .5, .95, .26, .05, '#cfd8dc');            // wings
  bx(-1.4, -.17, 1.4, .17, .12, .34, '#fafafa', { stripe: p.col });                                       // fuselage
  bx(1.4, -.12, 1.75, .12, .17, .24, '#b0bec5');                                                           // nose
  bx(0, -.7, .4, -.5, .12, .14, '#78909c'); bx(0, .5, .4, .7, .12, .14, '#78909c');                      // engines
  bx(-1.4, -.03, -.95, .03, .46, .5, p.col); bx(-1.35, -.45, -1.05, .45, .5, .04, '#cfd8dc');            // tail
  if (night > .3 && Math.sin(time * 6 + p.g) > 0) { const b = P(p.x, p.y, p.z + .75); glow(b[0], b[1], Math.max(4, sc * .25), 'rgba(255,60,60,.9)'); }
}
function updateAirfield() {
  let busy = false; for (let g = 0; g < 4; g++) busy = planeState(g, FLT) || busy;
  AIRFX.runway = WX.cur() === 'storm' ? 'Closed · storm' : busy ? 'In use' : 'Clear';
}

// ---------- Metro Loop: path, stations, train ----------
const LOOP = [[7.5, 46.5], [57.5, 46.5], [57.5, 40], [104, 40], [104, 33], [58.5, 33], [58.5, 7.5], [7.5, 7.5]];
const DECK_Z = 2.2;
let RIDE = false;
const AIRIDS = ['air-ai', 'apron-ai', 'air-pic', 'air-ioc', 'rail-pic', 'rail-ai', 'acp-anpr', 'acp-ioc', 'sec-ioc', 'claim-ioc'];   // IRIV units the control centre watches
const RAIL = { cum: [0], L: 0, st: [], cars: [], status: 'Starting', nextName: '—', at: -1, next: 1, sched: [], Tc: 1 };
for (let i = 0; i < LOOP.length; i++) { const a = LOOP[i], b = LOOP[(i + 1) % LOOP.length]; RAIL.L += Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]); RAIL.cum.push(RAIL.L); }
function railAt(s) {   // point and direction on the loop, s measured along the track
  s = ((s % RAIL.L) + RAIL.L) % RAIL.L;
  let i = 0; while (i < LOOP.length - 1 && s >= RAIL.cum[i + 1]) i++;
  const a = LOOP[i], b = LOOP[(i + 1) % LOOP.length], len = RAIL.cum[i + 1] - RAIL.cum[i], u = (s - RAIL.cum[i]) / len;
  return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, horiz: a[1] === b[1] };
}
function railS(x, y) {
  for (let i = 0; i < LOOP.length; i++) {
    const a = LOOP[i], b = LOOP[(i + 1) % LOOP.length];
    if (a[1] === b[1] && Math.abs(y - a[1]) < .01 && x >= Math.min(a[0], b[0]) - .01 && x <= Math.max(a[0], b[0]) + .01) return RAIL.cum[i] + Math.abs(x - a[0]);
    if (a[0] === b[0] && Math.abs(x - a[0]) < .01 && y >= Math.min(a[1], b[1]) - .01 && y <= Math.max(a[1], b[1]) + .01) return RAIL.cum[i] + Math.abs(y - a[1]);
  }
  throw Error('station is off the loop');
}
[['Market', 20, 46.5, 'rail', 'h'], ['Airport', 90, 33, 'airstation', 'h'], ['Industrial Park', 58.5, 14, 'rail', 'v'], ['Hospital', 18, 7.5, 'rail', 'h'], ['City Hub', 7.5, 40, 'rail', 'v']]
  .forEach(([name, x, y, zone, o]) => RAIL.st.push({ name, x, y, zone, o, s: railS(x, y) }));
// timetable: dwell 8 s, then run to the next station with a smooth start and stop
(() => {
  const n = RAIL.st.length; let t = 0;
  RAIL.st.forEach((a, k) => {
    const b = RAIL.st[(k + 1) % n], d = (b.s - a.s + RAIL.L) % RAIL.L, T = Math.max(6, d / 2.4);
    RAIL.sched.push({ k, t0: t, dwell: 8, T, d }); t += 8 + T;
  });
  RAIL.Tc = t;
})();
RAIL.eta = k => { const tc = time % RAIL.Tc, arr = RAIL.sched[k].t0; return Math.max(1, Math.round(((arr - tc + RAIL.Tc) % RAIL.Tc) / 6)) + ' min'; };
RAIL.etaNext = () => RAIL.at >= 0 ? 'Boarding' : RAIL.eta(RAIL.next);
function updateRail() {
  const tc = time % RAIL.Tc, n = RAIL.st.length;
  const e = RAIL.sched.find(e => tc >= e.t0 && tc < e.t0 + e.dwell + e.T) || RAIL.sched[0], a = RAIL.st[e.k], u = tc - e.t0;
  let s;
  if (u < e.dwell) { s = a.s; RAIL.at = e.k; RAIL.status = 'At ' + a.name; }
  else { const f = (u - e.dwell) / e.T; s = a.s + e.d * f * f * (3 - 2 * f); RAIL.at = -1; RAIL.status = 'Running'; }
  RAIL.next = (e.k + 1) % n; RAIL.nextName = RAIL.st[RAIL.next].name;
  RAIL.sc = s;
  if (RIDE) { const c = railAt(s); cam.tx = c.x; cam.ty = c.y; cam.tz = Math.max(cam.tz, 2.8); }
  RAIL.cars = [0, 1, 2, 3, 4].map(k => { const p = railAt(s + (2 - k) * 1.85); return { k, x: p.x, y: p.y, horiz: p.horiz }; });
}
// deck, pillars and stations
for (let i = 0; i < LOOP.length; i++) {
  const a = LOOP[i], b = LOOP[(i + 1) % LOOP.length], horiz = a[1] === b[1], len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]), dir = horiz ? Math.sign(b[0] - a[0]) : Math.sign(b[1] - a[1]);
  for (let d = 0; d < len; d += 5) {
    const l = Math.min(5, len - d), p0 = horiz ? [a[0] + dir * d, a[1]] : [a[0], a[1] + dir * d], p1 = horiz ? [p0[0] + dir * l, a[1]] : [a[0], p0[1] + dir * l];
    const x0 = Math.min(p0[0], p1[0]), x1 = Math.max(p0[0], p1[0]), y0 = Math.min(p0[1], p1[1]), y1 = Math.max(p0[1], p1[1]);
    box('rail', horiz ? x0 : x0 - .35, horiz ? y0 - .35 : y0, horiz ? x1 : x1 + .35, horiz ? y1 + .35 : y1, .18, '#9aa5ae', { z0: DECK_Z, roof: '#cfd8dc' });
    if (Math.round(d / 5) % 2 === 0) box('rail', (x0 + x1) / 2 - .13, (y0 + y1) / 2 - .13, (x0 + x1) / 2 + .13, (y0 + y1) / 2 + .13, DECK_Z, '#b0bec5', { lod: 8 });
  }
}
RAIL.st.forEach((st, k) => {
  const h = st.o === 'h', pl = 5, w = .9, off = (k % 2 ? -1 : 1) * .95;   // platform beside the track
  const bx = (a, b, z0, hh, color, extra) => h ? box(st.zone, st.x - a, st.y + off - b, st.x + a, st.y + off + b, hh, color, Object.assign({ z0 }, extra))
    : box(st.zone, st.x + off - b, st.y - a, st.x + off + b, st.y + a, hh, color, Object.assign({ z0 }, extra));
  bx(pl, w * .5, DECK_Z, .18, '#eceff1', { roof: '#ffffff' });
  bx(pl * .85, w * .55, DECK_Z + 1.25, .08, '#455a64', { roof: '#607d8b' });
  bx(pl * .8, .05, DECK_Z + .18, 1.07, '#90caf9', { roof: '#bbdefb' });
  add('rsign', st.zone, st.x, st.y, { k, off });
});
// skybridge from the airport station to the terminal
box('airstation', 89.2, 23.4, 90.8, 32.6, .22, '#b0bec5', { z0: DECK_Z, roof: '#e0e0e0' });
box('airstation', 89.0, 23.2, 91.0, 32.8, .5, '#81d4fa', { z0: DECK_Z + .22, roof: '#b3e5fc' });

function drawRailCar(c) {
  const k = c.k, x0 = c.horiz ? c.x - .88 : c.x - .3, x1 = c.horiz ? c.x + .88 : c.x + .3, y0 = c.horiz ? c.y - .3 : c.y - .88, y1 = c.horiz ? c.y + .3 : c.y + .88;
  drawBox({ x0, y0, x1, y1, z0: DECK_Z + .2, h: .6, color: '#fafafa', stripe: '#00897b', win: 'bands', id: 1100 + k });
  if (k === 2 && sc > 9) {
    const p = P(c.x, c.y, DECK_Z + 1.5), txt = RAIL.at >= 0 ? `🚆 ${RAIL.st[RAIL.at].name} · doors open` : `🚆 Next stop: ${RAIL.nextName} · ${RAIL.etaNext()}`;
    pill(p[0], p[1], txt, '#0f1724', '#ffd54f', Math.max(9, Math.min(13, sc * .2)));
  }
}
function drawRailSign(o) {
  const st = RAIL.st[o.k], p = P(st.x, st.y + (st.o === 'h' ? o.off : 0) + (st.o === 'v' ? 0 : 0), DECK_Z + 1.9);
  if (st.o === 'v') { const q = P(st.x + o.off, st.y, DECK_Z + 1.9); p[0] = q[0]; p[1] = q[1]; }
  if (sc < 8 || p.b) return;
  const here = RAIL.at === o.k, txt = here ? `🚆 ${st.name} → ${RAIL.nextName}` : `${st.name} · next train ${RAIL.eta(o.k)}`;
  pill(p[0], p[1], txt, '#0f1724', here ? '#69f0ae' : '#ffd54f', Math.max(8, Math.min(12, sc * .18)));
  if (st.name === 'Airport') { const f = FL.board()[0]; pill(p[0], p[1] - Math.max(18, sc * .3), '✈ ' + f.no + ' → ' + f.dest + ' ' + f.t, '#0277bd', '#fff', Math.max(8, Math.min(11, sc * .16))); }
}

// ---------- hooks into the main loop (all called at run time, after every script has loaded) ----------
const _drawObj = drawObj;
drawObj = function (o, path) {
  if (o.t === 'rcar') return drawRailCar(o.c);
  if (o.t === 'plane') return planeParts(o.p);
  if (o.t === 'rsign') return drawRailSign(o);
  if (o.t === 'abarrier') return drawAirBarrier();
  if (o.t === 'agse') {
    if (o.kind === 'fuel') return (drawBox({ x0: o.gx - 2.0, x1: o.gx - 1.2, y0: 12.8, y1: 13.8, z0: .08, h: .45, color: '#fafafa', stripe: '#e53935' }), drawBox({ x0: o.gx - 2.0, x1: o.gx - 1.5, y0: 12.8, y1: 13.8, z0: .5, h: .22, color: '#e53935' }));
    const off = Math.sin(time * .4 + o.g) * .25;
    drawBox({ x0: o.gx + 1.0, x1: o.gx + 1.4, y0: 11.0 + off, y1: 11.4 + off, z0: .06, h: .3, color: '#fdd835' });
    for (let k = 0; k < 2; k++) drawBox({ x0: o.gx + 1.0, x1: o.gx + 1.4, y0: 11.55 + off + k * .5, y1: 11.95 + off + k * .5, z0: .06, h: .22, color: '#78909c', roof: ['#c62828', '#1565c0'][k] });
    return;
  }
  if (o.t === 'abus') { const x = 66 + mod(time * 1.6, 38); return drawBox({ x0: x, x1: x + 1.8, y0: 28.0, y1: 28.6, z0: .08, h: .6, color: '#fafafa', stripe: '#0277bd', win: 'bands', id: 1200 }); }
  return _drawObj(o, path);
};
const _worldSlabs = worldSlabs; worldSlabs = function () { _worldSlabs(); airportSlab(); };
const _worldGround5 = worldGround5; worldGround5 = function () { _worldGround5(); airportGround(); };
const _updateHighway = updateHighway; updateHighway = function (dt) { _updateHighway(dt); if (WX.cur() !== 'storm') FLT += dt; updateRail(); updateAirfield(); updateAirCarPark(dt); };
document.getElementById('panel').addEventListener('click', e => { if (e.target.closest('[data-ride]')) { closePanel(); RIDE = true; autoRot = false; document.body.classList.add('riding'); } });
cv.addEventListener('pointerdown', () => { RIDE = false; document.body.classList.remove('riding'); });
const _drawHWOverlay = drawHWOverlay;
drawHWOverlay = function () {
  _drawHWOverlay();
  if (RIDE && scene === 'city') pill(W / 2, 128, RAIL.at >= 0 ? '🚆 ' + RAIL.st[RAIL.at].name + ' · doors open' : '🚆 Next stop: ' + RAIL.nextName + ' · ' + RAIL.etaNext(), '#0f1724', '#ffd54f', 15);
  if (RIDE && scene === 'city') pill(W / 2, 160, 'Riding the Metro Loop · click the map to stop', 'rgba(15,23,36,.7)', '#fff', 11);
  if (scene === 'city' && !WALK.on && night > .3 && sc > 5) for (let x = 67; x < 108; x += 3) for (const y of [4.02, 6.98]) { const p = P(x, y, .08); glow(p[0], p[1], Math.max(3, sc * .12), 'rgba(255,240,170,' + (.9 * night) + ')'); }
  if (scene === 'city' && !WALK.on && sc > 8) { const a = P(81.3, 26.3, .9); if (!a.b) pill(a[0], a[1], '🚕 Taxi rank', '#f9a825', '#1a1a1a', Math.max(8, Math.min(11, sc * .17))); const b = P(66 + mod(time * 1.6, 38), 28.3, 1.0); if (!b.b) pill(b[0], b[1], '🚌 Shuttle', '#0277bd', '#fff', Math.max(8, Math.min(11, sc * .17))); }
  if (scene === 'city' && !WALK.on) { const a = P(88, 14, 2.4); if (!a.b) pill(a[0], a[1], '✈️ Mega Airport', '#0277bd', '#fff', 12); }
};
function airportEntities(list) {
  FL.planes.forEach(p => { if (!p.hide) list.push({ o: { t: 'plane', p, zone: 'airport' }, d: depth(p.x, p.y) }); });
  [[80, 26.3], [81.3, 26.3], [82.6, 26.3]].forEach(([x, y]) => list.push({ o: { t: 'vcar', c: { x, y, ax: 'x', col: '#fdd835', sd: 1 }, zone: 'airport' }, d: depth(x, y) }));
  for (let g = 0; g < 4; g++) { const u = mod(FLT - 30 * g, FLC), gx = GATES[g] + 1.5;
    if (u >= 26 && u < 98) list.push({ o: { t: 'agse', kind: 'bag', g, gx, zone: 'airport' }, d: depth(gx + 1.3, 12.6) });
    if (u >= 30 && u < 72) list.push({ o: { t: 'agse', kind: 'fuel', g, gx, zone: 'airport' }, d: depth(gx - 1.6, 13.3) }); }
  list.push({ o: { t: 'abus', zone: 'airport' }, d: depth(66 + mod(time * 1.6, 38), 28.3) });
  ACP.vcars.forEach(c => list.push({ o: { t: 'vcar', c, zone: 'aircarpark' }, d: depth(c.x, c.y) }));
  RAIL.cars.forEach(c => list.push({ o: { t: 'rcar', c, zone: 'rail' }, d: depth(c.x, c.y) }));
}
updateRail(); updateAirfield();

// ---------- devices ----------
const AIRIRIV = { cat: 'ai', brand: 'IRIV', model: 'IRIV EdgeAI CM5', conn: 'IP cameras (RTSP) · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)' };
DEVICES.push(
  fdev(Object.assign({}, AIRIRIV, { id: 'air-ai', name: 'Departure Hall Crowd Camera', icon: '📷', zone: 'airterminal', x: 83, y: 21.4, z: 2.0, qty: 6,
    path: ['Hall CCTV', 'Ethernet', 'EdgeAI CM5', 'Screens + MQTT', 'IRIV Edge'], loc: 'Airport departure hall', short: 'Airport terminal',
    what: 'EdgeAI CM5 units count people in the departure hall and at security, so the airport can open extra lanes before queues build.', why: 'In the hall ceiling, covering the check-in and security queues.',
    m: [['In the hall', () => fint(Math.round(FL.pax() * .55))], ['Security queue', () => Math.round(wob(9, 4, .2)) + ' min'], ['Lanes open', () => '6 / 8'], ['Model', () => 'People count']],
    say: 'These A I cameras count passengers in the departure hall and at security, so extra lanes open before the queue grows.' })),
  fdev(Object.assign({}, AIRIRIV, { id: 'apron-ai', name: 'Apron Safety Camera', icon: '📷', zone: 'airport', x: 88, y: 12, z: 2.4, qty: 2,
    path: ['Apron CCTV', 'Ethernet', 'EdgeAI CM5', 'Beacon + MQTT', 'IRIV Edge'], loc: 'Airport apron', short: 'Airport apron',
    what: 'Watches the apron for people or vehicles too close to a parked aircraft and flashes a warning beacon.', why: 'On the terminal roof edge, looking along the gates.',
    m: [['People on apron', () => Math.round(wob(8, 3, .2))], ['Vehicles', () => Math.round(wob(5, 2, .2))], ['Alerts today', () => '0'], ['Model', () => 'Person + vehicle']],
    say: 'This A I camera watches the apron and warns when someone gets too close to an aircraft.' })),
  fdev({ id: 'air-pic', cat: 'controller', brand: 'IRIV', model: 'IRIV PiControl', name: 'Runway Lighting Controller', icon: '🎛️', zone: 'airport', x: 70, y: 8.2, z: 1.0, qty: 1,
    conn: 'Fibre · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Light sensor & cabinet', 'AI / DI / DO', 'PiControl', 'MQTT', 'IRIV Edge'],
    loc: 'Airfield lighting cabinet', short: 'Airfield', what: 'Switches the runway edge and approach lights from the ambient light level and the flight schedule.', why: 'In the lighting cabinet beside the runway.',
    m: [['Ambient light', () => Math.round(night > .5 ? wob(12, 4, .1) : wob(8000, 800, .1)) + ' lux'], ['Runway lights', () => night > .5 ? 'On' : 'Auto'], ['Approach lights', () => night > .5 ? 'On' : 'Off'], ['MQTT', () => 'Connected']],
    say: 'This I R I V PiControl switches the runway lights when it gets dark.' }),
  fdev({ id: 'air-ioc', cat: 'controller', brand: 'IRIV', model: 'IRIV IO Controller MQTT', name: 'Baggage Belt Controller', icon: '🧳', zone: 'airterminal', x: 79.5, y: 19.4, z: 1.2, qty: 1,
    conn: 'Ethernet · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Belts & sensors', 'DI / DO', 'IO Controller', 'MQTT', 'IRIV Edge'],
    loc: 'Baggage hall panel', short: 'Baggage hall', what: 'Starts the baggage belts, reads the jam sensors and the emergency stops.', why: 'In the baggage hall control panel.',
    m: [['Belts running', () => '3 / 4'], ['Bags / hour', () => fint(wob(1400, 120, .1))], ['Jams today', () => '1'], ['MQTT', () => 'Connected']],
    say: 'This I O Controller runs the baggage belts and stops them safely if there is a jam.' }),
  fdev({ id: 'rail-pic', cat: 'controller', brand: 'IRIV', model: 'IRIV PiControl', name: 'Station Signal & Screen Controller', icon: '🎛️', zone: 'airstation', x: 91.5, y: 33, z: DECK_Z + 1.5, qty: 1,
    conn: 'Fibre · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Train position', 'DI / DO / RS485', 'PiControl', 'MQTT', 'IRIV Edge'],
    loc: 'Airport station platform', short: 'Airport station', what: 'Drives the platform signal, releases the doors and shows the next stop on the screens.', why: 'In the platform equipment room.',
    m: [['Train', () => RAIL.status], ['Next stop', () => RAIL.nextName], ['Arrives in', () => RAIL.etaNext()], ['Signal', () => RAIL.at === 1 ? 'Stop' : 'Proceed']],
    say: 'This I R I V PiControl runs the airport station signal and the next stop screens.' }),
  fdev(Object.assign({}, AIRIRIV, { id: 'rail-ai', name: 'Platform Crowd Camera', icon: '📷', zone: 'airstation', x: 87, y: 33, z: DECK_Z + 1.5, qty: 1,
    path: ['Platform CCTV', 'Ethernet', 'EdgeAI CM5', 'Screen + MQTT', 'IRIV Edge'], loc: 'Airport station platform', short: 'Airport station',
    what: 'Counts the people on the airport platform and warns when it gets too crowded to board safely.', why: 'Under the platform canopy.',
    m: [['On the platform', () => Math.round(wob(60, 20, .2))], ['Crowd level', () => wob(60, 20, .2) > 80 ? 'Busy' : 'Normal'], ['Next train', () => RAIL.eta(1)], ['Model', () => 'People count']],
    say: 'This A I camera counts the people on the airport platform.' })),
  fdev({ id: 'air-am', model: 'AM319', name: 'Terminal Air Quality', icon: '🌡️', zone: 'airterminal', x: 85, y: 19.6, z: 1.2, qty: 24, power: 'DC adapter',
    loc: 'Airport terminal', short: 'Airport terminal', what: 'Air quality and comfort in the terminal.', why: 'On the walls of the halls and gate lounges.',
    m: [['CO₂', () => Math.round(wob(680, 80, .2)) + ' ppm'], ['Temp.', () => wob(23.5, .5, .2).toFixed(1) + ' °C'], ['Humidity', () => Math.round(wob(52, 4, .1)) + '%'], ['Battery', () => '—']],
    say: 'These sensors keep the terminal air fresh and the temperature comfortable.' }),
  fdev({ id: 'air-vs', model: 'VS133', name: 'Gate Passenger Counter', icon: '👥', zone: 'airgate', x: 98, y: 22.6, z: 1.3, qty: 20, power: 'DC / PoE',
    loc: 'Airport gates', short: 'Airport gates', what: 'Counts passengers boarding at each gate.', why: 'Above every boarding gate.',
    m: [['Boarded', () => FL.info(2).u < 52 ? '0' : fint(Math.min(180, Math.round((FL.info(2).u - 52) * 6.5)))], ['Flight', () => FL.info(2).no], ['Gate', () => 'B3'], ['Status', () => FL.info(2).dep]],
    say: 'These counters count passengers as they board at each gate.' }),
  fdev({ id: 'air-wts', model: 'WTS506', name: 'Airfield Weather Station', icon: '🌦️', zone: 'airport', x: 74, y: 3.2, z: 2.3, qty: 2, power: 'Solar + battery',
    loc: 'Beside the runway', short: 'Airfield', what: 'Wind, rain and temperature on the airfield for pilots and tower.', why: 'Beside the runway, in the open.',
    m: [['Wind', () => Math.round(wob(14, 4, .3)) + ' km/h'], ['Rain', () => '0.0 mm/h'], ['Temp.', () => wob(31, 1, .1).toFixed(0) + ' °C'], ['Visibility', () => 'Good']],
    say: 'This weather station reports wind and rain on the airfield.' }),
  fdev({ id: 'rail-vs', model: 'VS133', name: 'Station Gate Counter', icon: '👥', zone: 'rail', x: 18, y: 7.5, z: DECK_Z + 1.0, qty: 5, power: 'DC / PoE',
    loc: 'Metro Loop station gates', short: 'Metro stations', what: 'Counts passengers through each station gate.', why: 'Above the gates of each station.',
    m: [['Entries today', () => fint(1200 + Math.floor(time / 3))], ['Peak', () => '08:10'], ['Waiting', () => Math.round(wob(30, 10, .2))], ['Battery', () => '—']],
    say: 'These counters measure passengers at every Metro Loop station.' })
);
DEVICES.push(
  fdev({ id: 'air-pos', cat: 'edge', brand: 'IRIV', model: 'IRIV SmartHub CM5', name: 'Check-in & Ticketing Terminal', icon: '🎫', zone: 'airterminal', x: 80.5, y: 21, z: 1.0, qty: 12,
    conn: 'Ethernet · USB scanner & printer · HDMI display', power: 'Compact DC adapter (low power)', path: ['Passport & ticket scanner', 'USB', 'SmartHub CM5', 'Ethernet · MQTT', 'IRIV Edge'],
    loc: 'Check-in counters', short: 'Check-in hall', what: 'Runs each check-in counter: scans passports and tickets, prints boarding passes and bag tags.', why: 'At every check-in counter.',
    m: [['Check-ins today', () => fint(3400 + Math.floor(time * 2))], ['Boarding passes', () => fint(3380 + Math.floor(time * 2))], ['Bag tags', () => fint(2100 + Math.floor(time))], ['Sync', () => 'Online']],
    say: 'These I R I V SmartHub computers run the check-in counters and print the boarding passes and bag tags.' }),
  fdev({ id: 'food-pos', cat: 'edge', brand: 'IRIV', model: 'IRIV SmartHub CM5', name: 'Food Court Till', icon: '🧾', zone: 'airfood', x: 90, y: 20.5, z: .8, qty: 10,
    conn: 'Ethernet · USB scanner & printer · HDMI display', power: 'Compact DC adapter (low power)', path: ['Barcode scanner', 'USB', 'SmartHub CM5', 'Ethernet · MQTT', 'IRIV Edge'],
    loc: 'Food court and duty-free tills', short: 'Food court', what: 'The till at every stall and in duty free; shows the queue number on the stall screen.', why: 'At every counter.',
    m: [['Sales today', () => 'RM ' + fint(18000 + time * 4)], ['Receipts', () => fint(1900 + Math.floor(time / 3))], ['Queue number', () => 'No. ' + (100 + Math.floor(time / 9) % 90)], ['Sync', () => 'Online']],
    say: 'These I R I V SmartHub tills run every food stall and the duty-free shop.' }),
  fdev(Object.assign({}, AIRIRIV, { id: 'air-edge', name: 'Airport Operations Computer', icon: '🖥️', zone: 'aircontrol', x: 107.5, y: 21, z: 2.8, qty: 1,
    conn: 'Ethernet · MQTT from every airport unit', path: ['Every IRIV unit', 'MQTT', 'EdgeAI CM5', 'Video wall', 'Operators'], loc: 'Airport control centre', short: 'Control centre',
    what: 'The airport operations computer. It receives data from every IRIV unit and Milesight sensor and shows it on the video wall.', why: 'In the control-centre equipment rack.',
    m: [['Units online', () => AIRIDS.filter(id => !INS.down.has(id)).length + ' / ' + AIRIDS.length], ['MQTT messages / min', () => fint(wob(1800, 150, .2))], ['Video wall', () => 'Live'], ['Alarms', () => '0']],
    say: 'This is the airport operations computer in the control centre. It receives data from every unit at the airport.' })),
  fdev(Object.assign({}, AIRIRIV, { id: 'acp-anpr', name: 'Car Park Entry ANPR', icon: '📷', zone: 'aircarpark', x: 63.4, y: 32.4, z: 1.9, qty: 1,
    path: ['Entry camera', 'Ethernet', 'EdgeAI CM5', 'Barrier + MQTT', 'IRIV Edge'], loc: 'Airport car park entry', short: 'Airport car park',
    what: 'Reads the number plate of every car at the entry, opens the barrier and counts the cars that go in.', why: 'On the barrier post, looking at the front plate.',
    m: [['Cars inside', () => ACP.inside + ' / ' + ACP.cap], ['Entries today', () => fint(ACP.entries)], ['Last plate', () => ACP.log[0] ? ACP.log[0].plate : '—'], ['Barrier', () => ACP.arm > .5 ? 'Open' : 'Closed']],
    say: 'This A I computer reads every number plate at the car park entry, opens the barrier and counts the cars.' })),
  fdev({ id: 'acp-ioc', cat: 'controller', brand: 'IRIV', model: 'IRIV IO Controller MQTT', name: 'Car Park Sign & Gas Controller', icon: '🔀', zone: 'aircarpark', x: 63.4, y: 35.2, z: 1.0, qty: 1,
    conn: 'Ethernet · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Sign, loop, gas sensor', 'DI / DO / AI', 'IO Controller', 'MQTT', 'IRIV Edge'],
    loc: 'Car park entry cabinet', short: 'Airport car park', what: 'Switches the FULL sign when the car park is full and reads the gas sensor.', why: 'In the cabinet beside the barrier.',
    m: [['Sign', () => ACP.inside >= ACP.cap ? 'FULL' : 'Spaces'], ['Free spaces', () => ACP.cap - ACP.inside], ['CO level', () => Math.round(wob(8, 2, .2)) + ' ppm'], ['MQTT', () => 'Connected']],
    say: 'This I O Controller switches the car park FULL sign and watches the gas level.' })
);
DEVICES.push(
  fdev({ id: 'air-gw', cat: 'gateway', brand: 'Milesight', model: 'UG65', name: 'Airport LoRaWAN Gateway', icon: '📡', zone: 'airport', x: 90, y: 17.6, z: 2.4, qty: 1,
    conn: 'LoRaWAN radio in · fibre back to the airport operations computer', power: 'PoE or DC supply', path: ['Terminal sensors', 'LoRaWAN', 'UG65', 'Ethernet · MQTT', 'IRIV Edge'],
    loc: 'Terminal roof', short: 'Airport', what: 'Collects every Milesight sensor in the terminal and forwards it to the airport operations computer.', why: 'On the terminal roof, with a clear view over the whole building.',
    m: [['Sensors linked', () => '56'], ['Uplinks / min', () => Math.round(wob(22, 4, .5))], ['Backhaul', () => 'Fibre'], ['Status', () => 'Online']],
    say: 'This U G 65 gateway on the terminal roof collects every sensor in the terminal.' }),
  fdev({ id: 'sec-ioc', cat: 'controller', brand: 'IRIV', model: 'IRIV IO Controller MQTT', name: 'Security Lane Controller', icon: '🛂', zone: 'airsecurity', x: 87.5, y: 20.5, z: 1.0, qty: 1,
    conn: 'Ethernet · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Belts, arch, gates', 'DI / DO', 'IO Controller', 'MQTT', 'IRIV Edge'],
    loc: 'Security checkpoint panel', short: 'Security', what: 'Runs the X-ray lane belts and gates and lights the alarm beacon when the arch detects metal.', why: 'In the checkpoint control panel.',
    m: [['Lanes running', () => '3 / 3'], ['Arch alarms today', () => '4'], ['Waiting time', () => Math.round(wob(8, 3, .2)) + ' min'], ['MQTT', () => 'Connected']],
    say: 'This I O Controller runs the security lanes and lights a beacon when the arch finds metal.' }),
  fdev({ id: 'sec-vs', model: 'VS133', name: 'Security Lane Counter', icon: '👥', zone: 'airsecurity', x: 86, y: 22.6, z: 1.3, qty: 8, power: 'DC / PoE',
    loc: 'Security lanes', short: 'Security', what: 'Counts the people waiting in every security lane.', why: 'Above each lane entrance.',
    m: [['In the queue', () => Math.round(wob(40, 12, .2))], ['Waiting time', () => Math.round(wob(8, 3, .2)) + ' min'], ['Screened today', () => fint(3200 + Math.floor(time * 2))], ['Battery', () => '—']],
    say: 'These counters measure the queue in every security lane.' }),
  fdev({ id: 'claim-ioc', cat: 'controller', brand: 'IRIV', model: 'IRIV IO Controller MQTT', name: 'Baggage Carousel Controller', icon: '🧳', zone: 'airarrival', x: 71, y: 20, z: 1.0, qty: 1,
    conn: 'Ethernet · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Carousel sensors', 'DI / DO', 'IO Controller', 'MQTT', 'IRIV Edge'],
    loc: 'Baggage claim panel', short: 'Baggage claim', what: 'Starts the carousel when a flight reaches the gate and stops it on a jam.', why: 'In the baggage claim control panel.',
    m: [['Carousel', () => FL.board().some(r => r.u >= 28 && r.u < 80) ? 'Running' : 'Stopped'], ['Bags / hour', () => fint(wob(1400, 120, .1))], ['Jams today', () => '0'], ['MQTT', () => 'Connected']],
    say: 'This I O Controller starts the baggage carousel when the plane reaches the gate.' }),
  fdev({ id: 'arr-vs', model: 'VS133', name: 'Arrivals Door Counter', icon: '👥', zone: 'airarrival', x: 67, y: 22.6, z: 1.3, qty: 2, power: 'DC / PoE',
    loc: 'Arrivals hall doors', short: 'Arrivals', what: 'Counts people through the arrivals doors.', why: 'Above the arrivals doors.',
    m: [['Arrived today', () => fint(3100 + Math.floor(time * 2))], ['Waiting to meet', () => Math.round(wob(60, 20, .2))], ['Peak', () => '14:20'], ['Battery', () => '—']],
    say: 'These counters count the people who come through the arrivals doors.' })
);
DEVICES.forEach(d => { if (!DEV[d.id]) DEV[d.id] = d; });

// ---------- airport car park: cars come in through the ANPR barrier ----------
const ACP = { cap: 800, inside: 412, entries: 1086, exits: 674, arm: 0, atGate: false, vcars: [], t: 2, tx: 5, read: null, log: [] };
(() => { const now = Date.now(); for (let i = 0; i < 6; i++) ACP.log.push({ plate: newPlate(), tin: hhmm(new Date(now - (i + 1) * 420000)), out: false }); })();
const acpRows = () => ACP.log.slice(0, 8).map(r => '<tr><td><span class="plate">' + r.plate + '</span></td><td>' + r.tin + '</td><td class="q">' + (r.out ? '<span class="mut">left</span>' : 'parked') + '</td></tr>').join('');
function updateAirCarPark(dt) {
  ACP.t -= dt; ACP.tx -= dt;
  if (ACP.t < 0 && ACP.vcars.length < 4) { ACP.t = 4 + Math.random() * 3; ACP.vcars.push({ x: 54, y: 30.9, ax: 'x', sd: 1, col: CARCOL[Math.floor(Math.random() * CARCOL.length)], path: [[54, 30.9], [63, 30.9], [63, 33.2, 'gate'], [63, 38.3]], i: 0, plate: newPlate(), gateT: 0, atGate: false }); }
  if (ACP.tx < 0) { ACP.tx = 6 + Math.random() * 5; if (ACP.inside > 0) { ACP.inside--; ACP.exits++; const p = ACP.log.find(r => !r.out); if (p) p.out = true; } }
  let open = false; ACP.atGate = false;
  for (let k = ACP.vcars.length - 1; k >= 0; k--) {
    const c = ACP.vcars[k];
    if (c.atGate) { c.gateT += dt; ACP.atGate = true; if (c.gateT > .7 && !c.read) { c.read = true; ACP.read = { plate: c.plate, t: time }; ACP.log.unshift({ plate: c.plate, tin: hhmm(new Date()), out: false }); ACP.log.length = Math.min(ACP.log.length, 30); } if (c.gateT > 1.6) open = true; if (c.gateT > 2.4) c.atGate = false; else continue; }
    const n = c.path[c.i + 1];
    if (!n) { ACP.inside = Math.min(ACP.cap, ACP.inside + 1); ACP.entries++; ACP.vcars.splice(k, 1); continue; }
    const dx = n[0] - c.x, dy = n[1] - c.y, d = Math.hypot(dx, dy), st = 1.6 * dt;
    c.ax = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; c.sd = Math.sign(c.ax === 'x' ? dx : dy) || 1;
    if (d <= st) { c.x = n[0]; c.y = n[1]; c.i++; if (n[2] === 'gate') { c.atGate = true; c.gateT = 0; } } else { c.x += dx / d * st; c.y += dy / d * st; }
    if (c.read && c.y > 32.6) open = true;
  }
  ACP.arm += ((open ? 1 : 0) - ACP.arm) * Math.min(1, dt * 4);
}
function drawAirBarrier() {
  const a = P(62.5, 33.2, .55), b = P(62.5 + 1.0, 33.2, .55 + ACP.arm * .9);
  line(P(62.5, 33.2, 0), a, col('#546e7a'), Math.max(2, sc * .1));
  line(a, b, ACP.arm > .5 ? col('#66bb6a') : col('#e53935'), Math.max(2, sc * .07));
  if (ACP.read && time - ACP.read.t < 2.2 && sc > 9) { const p = P(63, 33.2, 1.5); pill(p[0], p[1], '📷 ' + ACP.read.plate, '#1565c0', '#fff', Math.max(9, Math.min(12, sc * .2))); }
}

// ---------- rooms you can walk into ----------
const boardDecor = (q, rows, color) => { poly(q, '#0f1724', '#37474f', null, 2);
  rows.forEach((t, i) => { const p = fp(q, .5, .84 - i * (.74 / Math.max(1, rows.length - 1))); ctx.fillStyle = color; ctx.font = '700 ' + Math.max(8, sc * .15) + 'px ui-monospace,Consolas,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, p[0], p[1]); }); };
screenTiles.flights = (q, F) => { poly(q, '#0f1724'); FL.board().forEach((r, i) => { const p = F(.5, .8 - i * .2); ctx.fillStyle = r.dep === 'Boarding' || r.dep === 'Final call' ? '#69f0ae' : '#ffd54f'; ctx.font = '700 ' + Math.max(6, sc * .1) + 'px ui-monospace,Consolas,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(r.t + ' ' + r.no + ' ' + r.gate + ' ' + r.dep, p[0], p[1]); }); };
screenTiles.carpark = (q, F) => { poly(q, '#0f1724'); const a = F(.5, .75), b = F(.5, .45), c = F(.5, .2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#7dd3fc'; ctx.font = '700 ' + Math.max(6, sc * .1) + 'px Inter,sans-serif'; ctx.fillText('CAR PARK', a[0], a[1]);
  ctx.fillStyle = '#fff'; ctx.font = '800 ' + Math.max(8, sc * .22) + 'px Inter,sans-serif'; ctx.fillText(ACP.inside + ' / ' + ACP.cap, b[0], b[1]);
  ctx.fillStyle = '#ffd54f'; ctx.font = '700 ' + Math.max(6, sc * .1) + 'px ui-monospace,Consolas,monospace'; ctx.fillText(ACP.log[0] ? ACP.log[0].plate : '', c[0], c[1]); };
Object.assign(LAYOUTS, {
  control: { name: 'Control centre', floor: '#d5dbe0', tile: '#c3cbd1', build(O) {
      [[3.2, 4.6], [5.6, 4.6], [8.0, 4.6], [3.2, 7.0], [5.6, 7.0], [8.0, 7.0]].forEach(([x, y], i) => workstation(O, x, y, i % 4 ? i : null, 2));
      person(O, 10.6, 6.0, false, 3); plant(O, 12.8, 2.0); Bx(O, { x0: 10.0, y0: 1.0, x1: 12.4, y1: 1.7, h: .8, color: '#546e7a', roof: '#78909c' }); },
    decor() { [['cam', 1], ['map', 5], ['flights', 0], ['cam', 2], ['carpark', 0]].forEach(([k, seed], i) => screenTile(wallB(1.2 + i * 2.6, 3.6 + i * 2.6, 1.6, 3.2), k, seed)); } }
});
SCENES.aircontrol = makeRoom('aircontrol', 'control');

// ---------- one full-scale terminal: landside, check-in, security, gates, food court, arrivals ----------
const BW = 64, BD = 34, hall = { x: 2, y: 2 };
const gateX = g => 41.5 + g * 5.6;
function buildAirHall(O) {
  let n = 3; const man = (x, y, vis) => person(O, x, y, false, n++, vis), sit = (x, y, vis) => person(O, x, y, true, n++, vis);
  const busy = (seed, base, span) => () => hsh(seed) < base + FL.busy() * span;
  // glass partitions between landside and security, and between security and airside
  [[23.6, 0, 23.8, 7.5], [23.6, 12, 23.8, 19.5], [38, 0, 38.2, 4.5], [38, 9.5, 38.2, 19.5]].forEach(([x0, y0, x1, y1]) => Bx(O, { x0, y0, x1, y1, h: 1.6, color: '#b3e5fc', roof: '#e1f5fe' }));
  // check-in: 8 counters, staff, queues that grow before a departure, self-service kiosks
  for (let k = 0; k < 8; k++) { const x = 3 + k * 2.2;
    Bx(O, { x0: x, y0: 2.6, x1: x + 1.5, y1: 3.3, h: .95, color: '#cfd8dc', stripe: AIRLINES[k % 4][2], roof: '#eceff1' }); man(x + .75, 2.1);
    for (let j = 0; j < 4; j++) man(x + .75 + (j % 2 ? .15 : -.15), 4.6 + j * .8, () => FL.eta0() < 100 - j * 22 + (k % 3) * 8); }
  for (let k = 0; k < 5; k++) { Bx(O, { x0: 3 + k * 1.3, y0: 15.0, x1: 3.8 + k * 1.3, y1: 15.5, h: 1.3, color: '#37474f', stripe: '#00acc1' }); if (k % 2) man(3.4 + k * 1.3, 16.2, busy(k + 40, .2, .15)); }
  plant(O, 1.4, 12); plant(O, 22, 17.5); plant(O, 22, 1.4);
  // security: four X-ray lanes with arches, officers and queues, then the passport e-gates
  for (let k = 0; k < 4; k++) { const x = 25 + k * 2.1;
    Bx(O, { x0: x, y0: 4.0, x1: x + .8, y1: 8.5, h: .5, color: '#37474f', stripe: '#ffb300', roof: '#455a64' });
    Bx(O, { x0: x - .15, y0: 5.2, x1: x + .95, y1: 6.4, h: 1.1, color: '#546e7a', roof: '#78909c' });
    Bx(O, { x0: x - .1, y0: 9.8, x1: x, y1: 9.95, h: 2.0, color: '#eceff1' }); Bx(O, { x0: x + .8, y0: 9.8, x1: x + .9, y1: 9.95, h: 2.0, color: '#eceff1' }); Bx(O, { x0: x - .1, y0: 9.8, x1: x + .9, y1: 9.95, z0: 2.0, h: .12, color: '#cfd8dc' });
    man(x + .4, 3.4); man(x + 1.2, 9.0);
    for (let j = 0; j < 4; j++) man(x + .4, 11.2 + j * .8, () => FL.eta0() < 100 - j * 20 + (k % 2) * 10); }
  for (let k = 0; k < 3; k++) { Bx(O, { x0: 34.5, y0: 5 + k * 1.5, x1: 35.3, y1: 5.9 + k * 1.5, h: 1.1, color: '#eceff1', stripe: '#00acc1' }); man(33.6, 5.4 + k * 1.5, busy(k + 60, .3, .15)); }
  // gates: desks, boarding passengers who gather and board with the schedule
  for (let g = 0; g < 4; g++) { const gx = gateX(g);
    Bx(O, { x0: gx, y0: 1.2, x1: gx + 2.4, y1: 1.9, h: .95, color: '#cfd8dc', stripe: AIRLINES[g][2], roof: '#eceff1' }); man(gx + 1.2, 0.8);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const x = gx - .4 + k * .9, y = 4.2 + r * 1.3;
      chair(O, x, y, '#5e35b1', hsh(x * 3 + y) > .3 ? n++ : null, () => { const u = mod(FLT - 30 * g, FLC); return u > 26 && u < 54 + (k + r * 6) * 1.5; }); } }
  // food court: nine stalls, tables, diners
  for (let k = 0; k < 9; k++) Bx(O, { x0: 40 + k * 2.5, y0: 12.2, x1: 42.1 + k * 2.5, y1: 13.4, h: 2.2, color: SHOP_COL[k % 6][0], stripe: SHOP_COL[k % 6][1], win: 'grid', id: 700 + k });
  for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) { const x = 41.8 + k * 3.4, y = 16 + r * 2.6;
    Bx(O, { x0: x - .5, y0: y - .3, x1: x + .5, y1: y + .3, h: .5, color: '#8d6e63', roof: '#a1887f' });
    chair(O, x - .85, y, '#ef6c00', hsh(x + y) < .75 ? n++ : null, busy(x * 7 + y, .2, .12)); chair(O, x + .85, y, '#ef6c00', hsh(x * 2 + y) < .65 ? n++ : null, busy(x * 5 + y, .2, .12)); }
  for (let j = 0; j < 4; j++) man(44 + j * 5, 14.2, busy(j + 80, .3, .15));
  // duty free and the premium lounge
  for (let r = 0; r < 4; r++) Bx(O, { x0: 53, y0: 26 + r * 1.7, x1: 62, y1: 26.6 + r * 1.7, h: 1.4, color: '#cfd8dc', stripe: SHOP_COL[r][1], roof: '#eceff1' });
  for (let j = 0; j < 5; j++) man(52.4 + j * 2, 30.5, busy(j + 90, .3, .12));
  for (let r = 0; r < 2; r++) { Bx(O, { x0: 41, y0: 26 + r * 3, x1: 45, y1: 26.9 + r * 3, h: .5, color: '#6a1b9a', roof: '#8e24aa' }); sit(42 + r, 25.6 + r * 3, busy(r + 100, .4, .1)); sit(44, 25.6 + r * 3, busy(r + 110, .3, .1)); }
  Bx(O, { x0: 46, y0: 27, x1: 47.2, y1: 28.2, h: .45, color: '#8d6e63' }); plant(O, 40.5, 31.5); plant(O, 50, 31.5); plant(O, 63, 20);
  // arrivals: immigration booths, two baggage carousels, customs, meeters and greeters
  for (let k = 0; k < 6; k++) { Bx(O, { x0: 22 + k * 2.3, y0: 21, x1: 23.6 + k * 2.3, y1: 21.8, h: 1.1, color: '#cfd8dc', stripe: '#0277bd', roof: '#eceff1' }); man(22.8 + k * 2.3, 20.4);
    for (let j = 0; j < 3; j++) man(22.8 + k * 2.3, 22.8 + j * .8, () => FL.claimOn() && j < 3 - (k % 2)); }
  [[9, 28.5, 0], [21, 29.5, .5]].forEach(([cx, cy, ph]) => fnObj(O, cx, cy, () => {
    const ring = (rx, ry, z) => Array.from({ length: 28 }, (_, i) => P(cx + rx * Math.cos(i / 28 * 6.2832), cy + ry * Math.sin(i / 28 * 6.2832), z));
    poly(ring(3.4, 1.6, .3), '#37474f', '#263238', null, 2); poly(ring(2.6, 1.0, .32), '#546e7a');
    if (FL.claimOn()) for (let k = 0; k < 9; k++) { const a = (time * .06 + k / 9 + ph) * 6.2832, x = cx + 3.0 * Math.cos(a), y = cy + 1.3 * Math.sin(a); drawBox({ x0: x - .25, x1: x + .25, y0: y - .16, y1: y + .16, z0: .32, h: .3, color: ['#c62828', '#1565c0', '#2e7d32', '#6d4c41', '#37474f'][k % 5] }); } }));
  for (let j = 0; j < 10; j++) man(5.5 + (j % 5) * 3.3 + (j > 4 ? 6 : 0), 25.2 + (j > 4 ? 6.8 : 0) + (j % 2) * .3, () => FL.claimOn() || j < 2);
  Bx(O, { x0: 27, y0: 30.5, x1: 29.5, y1: 31.2, h: 1.0, color: '#2e7d32', roof: '#43a047' }); Bx(O, { x0: 31, y0: 30.5, x1: 33.5, y1: 31.2, h: 1.0, color: '#c62828', roof: '#e53935' }); man(28.2, 30.0); man(32.2, 30.0);
  Bx(O, { x0: 36.4, y0: 24, x1: 36.6, y1: 33, h: .9, color: '#b0bec5', roof: '#eceff1' });
  for (let j = 0; j < 9; j++) man(37.2 + (j % 3) * .9, 25 + Math.floor(j / 3) * 2.4, () => FL.claimOn() || hsh(j + 50) < .4);
  plant(O, 2, 31.5); plant(O, 36, 19.8);
}
function airHallDecor() {
  const day = night < .5;
  // check-in departures board and the apron view from the gate hall
  boardDecor(wallB(2.4, 21.6, 2.4, 4.0), FL.rows(), '#ffd54f');
  const q = wallB(39, 63, .9, 3.9); poly(q, day ? '#bfe4ff' : '#10203a', col('#78909c'), null, 2);
  poly([fp(q, 0, 0), fp(q, 1, 0), fp(q, 1, .32), fp(q, 0, .32)], day ? '#8a95a0' : '#27313d');
  for (let g = 0; g < 4; g++) { const u = mod(FLT - 30 * g, FLC), cx = (gateX(g) + 1.2 - 39) / 24, f = (a, b) => fp(q, cx + a, b);
    if (u >= 24 && u < 100) { poly([f(-.1, .38), f(.09, .38), f(.11, .46), f(.09, .54), f(-.1, .54)], '#fafafa'); poly([f(-.1, .54), f(-.06, .54), f(-.09, .8)], AIRLINES[mod(Math.floor((FLT - 30 * g) / FLC) * 3 + g, 4)][2]); poly([f(-.03, .4), f(.03, .4), f(.0, .32)], '#cfd8dc'); }
    const f0 = FL.info(g); boardDecor(wallB(gateX(g), gateX(g) + 2.4, 2.35, 3.2), ['GATE ' + f0.gate, f0.no + '  ' + f0.dest, f0.dep.toUpperCase()], f0.dep === 'Boarding' || f0.dep === 'Final call' ? '#69f0ae' : '#ffd54f'); }
  poly(wallB(24, 33, 2.4, 3.3), '#0f1724', '#37474f', null, 2);
}
function airHallOverlay() {
  [['🎫 CHECK-IN', 12, 9.5, '#0277bd'], ['🛂 SECURITY', 29, 14, '#455a64'], ['🛫 GATES', 51, 8, '#5e35b1'], ['🍜 FOOD COURT', 51, 18, '#ef6c00'], ['🛍️ DUTY FREE', 57.5, 29, '#ec407a'], ['🛋️ LOUNGE', 45, 29, '#6a1b9a'],
   ['🛃 IMMIGRATION', 29, 24, '#00838f'], ['🧳 BAGGAGE CLAIM', 15, 31.5, '#00838f'], ['👋 ARRIVALS', 38.2, 30, '#00838f']].forEach(([t, x, y, c]) => { const p = P(x, y, .05); if (!p.b) pill(p[0], p[1], t, c, '#fff', Math.max(9, Math.min(13, sc * .22))); });
}
const AIRHALL_DEVS = [   // [id, x, y, z, mount or box]
  ['air-pos', 10, 3.0, .95, { x0: 9.6, y0: 2.7, x1: 10.4, y1: 3.0, z0: .95, h: .25, color: '#212121', stripe: '#ff8f00' }], ['air-ai', 12, 9, 3.2, 'ceil'], ['air-ioc', 13, 24, 1.1, { x0: 12.6, y0: 23.6, x1: 13.4, y1: 24.2, h: 1.1, color: '#212121', stripe: '#ff8f00' }],
  ['air-am', 6, .03, 1.6, 'B'], ['arr-vs', 3, 26, 3.0, 'ceil'], ['sec-ioc', 33, 17.5, 1.1, { x0: 32.6, y0: 17.2, x1: 33.4, y1: 17.8, h: 1.1, color: '#212121', stripe: '#ff8f00' }], ['sec-vs', 28, 13, 3.2, 'ceil'],
  ['air-vs', 50, 3.2, 3.2, 'ceil'], ['claim-ioc', 15.5, 25.5, 1.1, { x0: 15.1, y0: 25.2, x1: 15.9, y1: 25.8, h: 1.1, color: '#212121', stripe: '#ff8f00' }],
  ['food-pos', 46, 13.9, 1.4, { x0: 45.6, y0: 13.6, x1: 46.4, y1: 13.9, z0: 1.0, h: .25, color: '#212121', stripe: '#ff8f00' }], ['air-gw', 2, 4, 3.4, 'B']
];
const airHallDevs = () => AIRHALL_DEVS.map(([id, x, y, z, m]) => { const d = DEV[id], base = { id, qty: d.qty, where: d.loc, why: d.why, can: CAN[id] || [], say: d.say, x, y, z };
  return typeof m === 'string' ? Object.assign(base, { mount: m }) : Object.assign(base, { b: Object.assign({ x: x, y: y }, m) }); });
const aroutes = [];
for (let k = 0; k < 14; k++) {   // each passenger flies out and back: door, check-in, security, gate, food, then arrivals, baggage, door
  const cx = 3.75 + (k % 8) * 2.2, lx = 25.4 + (k % 4) * 2.1, gx = gateX(k % 4) + 1.2, car = k % 2 ? 21 : 9;
  aroutes.push([[-1.2, 26, k * 5], [2.5, 24, 0], [cx, 8, 0], [cx, 4.0, 5], [cx, 9, 0], [lx, 14.5, 0], [lx, 10.6, 3], [lx + .4, 3.0, 0], [36.5, 7, 0], [41, 9.5, 0], [gx, 6.5, 0], [gx, 4.4, 14], [gx, 10, 0], [43 + (k % 5) * 3.4, 14.5, 0], [43 + (k % 5) * 3.4, 18, 7], [38, 22, 0], [24 + (k % 6) * 2.3, 22.6, 4], [car, 26, 0], [car, 27.5, 8], [3, 26, 0]]);
}
SCENES.airhall = {
  title: 'Mega Airport · Terminal', short: 'Mega Airport terminal', wallA: '#e9eef2', wallB: '#f1f4f6', kicker: 'Inside · Mega Airport', icon: '✈️', color: '#0277bd', floor: '#e6ebee', tile: '#d3dade',
  w: BW, d: BD, wallH: 4.4, door: [24, 28], doorY: 26, walk: 1.7, cam: { x: 32, y: 17, tz: .5 }, winZ: [1.0, 3.0], winA: [[2, 9], [12, 19]], sign: 'MEGA AIRPORT',
  starts: { airarrival: [10, 27], airsecurity: [29, 10], airterminal: [11, 8], airfood: [51, 17], airgate: [51, 7] },
  gw: { id: 'air-gw', x: -1.8, y: 4, z: 3.4, label: 'UG65 · terminal roof' }, eb: { id: 'air-edge', x: -1.8, y: 30, z: 3.4, label: 'IRIV Edge · airport control centre' },
  sum: 'The whole terminal in one: landside check-in, security and immigration, the gate hall with the apron view, the food court, duty free, the premium lounge, and arrivals with immigration, baggage claim and customs. Every board and every crowd follows the live flight schedule, and every IRIV unit and Milesight sensor is installed where it would really go.',
  say: 'Welcome to the mega airport terminal. Passengers come in from the left, check in, pass security, wait at their gate and eat at the food court. Arriving passengers go through immigration, collect their bags and meet their families. The boards and the crowds follow the flights.',
  can: ['<b>Check-in</b>: SmartHub terminals print boarding passes; the AI camera opens another counter before queues build.', '<b>Security</b>: an IO Controller runs the lanes; VS133 counters show the wait.', '<b>Gates</b>: boards and counters follow the live schedule.', '<b>Baggage</b>: the carousel starts when the flight reaches the gate.', '<b>Control centre</b>: sees every unit on the video wall.'],
  m: [['Passengers in terminal', () => fint(FL.pax())], ['Next departure', () => FL.board()[0].no + ' ' + FL.board()[0].t], ['Security wait', () => Math.round(wob(8, 3, .2)) + ' min'], ['Carousel', () => FL.claimOn() ? 'Running' : 'Stopped']],
  build(O) { buildAirHall(O); }, decor: airHallDecor, overlay: airHallOverlay, routes: aroutes
};
SCENES.airhall.devs = airHallDevs();
['airarrival', 'airsecurity', 'airterminal', 'airfood', 'airgate'].forEach(z => { SCENES[z] = SCENES.airhall; });
ROOM_FOR.aircarpark = 'kiosk'; SCENES.aircarpark = makeRoom('aircarpark', 'kiosk');

