/* Airport Logistics Hub: a smart warehouse on the free strip south of the Metro Loop at the airport.
   It is drawn with the same box() helpers as everything else, so it shows in the 2D map and the 3D view.
   Its panel opens Warehouse Command 3D (warehouse-3d/), the full 3D simulation of the inside.
   Loaded after ferry.js and before city3d.js. */

const WH_HUB = { x0: 62, x1: 98, y0: 40.7, y1: 45.95, docks: [66.2, 69.2, 72.2, 75.2, 78.2, 81.2] };

TOPICS.warehouse = { icon: '🏭', color: '#ef6c00', kicker: 'Logistics', keywords: 'warehouse logistical logistic logistics hub cargo freight forklift docks depot distribution centre Warehouse Command 3D', title: 'Airport Logistics Hub',
  sum: 'A smart warehouse beside the airport for air cargo and city deliveries. Forklifts carry anti-collision tags, IRIV EdgeAI cameras read truck plates at the gate and watch people near forklifts, and Milesight sensors cover the cold store, the docks and the air.',
  how: ['EdgeAI CM5 at the gate: number plates, booking check, dock assignment.', 'IO Controller MQTT opens the dock doors and switches the dock lights.', 'EM300-TH and TS302 watch the cold store; EM400-TLD sees each trailer at the dock.', 'Forklifts brake for each other and wait for free aisles (anti-collision).'],
  ben: ['No forklift collisions', 'Faster truck turnaround', 'Cold chain proof', 'Live stock and dock status'],
  m: [['Trucks today', () => 64 + Math.floor(time / 20)], ['Pallets moved', () => fint(1840 + Math.floor(time * 1.3))], ['Docks busy', () => (2 + Math.floor(time / 15) % 4) + ' of 6'], ['Cold store', () => wob(3.8, .5, .05).toFixed(1) + ' °C']],
  chain: [['📷', 'Gate & dock cameras', 'Ethernet → EdgeAI CM5'], ['🚪', 'Dock doors & lights', 'IO Controller MQTT'], ['🌡️', 'Cold store & docks', 'LoRaWAN → UG65'], ['☁️', 'IRIV Edge', 'dock plan, alerts, reports']],
  say: 'This is the airport logistics hub. An A I camera reads truck plates at the gate and sends each truck to a free dock. Inside, forklifts with anti-collision tags brake for each other, and sensors watch the cold store. Open the 3D warehouse to see it working.',
  extra: () => '<h3>Inside the warehouse</h3><a class="tourbtn" style="display:block;text-align:center;text-decoration:none" href="warehouse-3d/" target="_blank" rel="noopener">🏭 Open Warehouse Command 3D ↗</a><p class="mut" style="font-size:12px">Forklifts, trucks, racks, the cold room and all 30 sensors in 3D. Turn anti-collision off to see what it prevents.</p>' };
ORDER.push('warehouse');
// a room you can walk into: racks with pallets, a forklift, a packing table and the installed devices
LAYOUTS.storehouse = { name: 'Warehouse floor', floor: '#a3aab2', tile: '#959ca4', build(O) {
  for (const y of [3.2, 6.4]) { Bx(O, { x0: 4.0, y0: y - .5, x1: 12.6, y1: y + .5, h: 2.6, color: '#1f5fbf', roof: '#f28c28' });
    for (let k = 0; k < 6; k++) Bx(O, { x0: 4.3 + k * 1.4, y0: y + .52, x1: 5.3 + k * 1.4, y1: y + 1.1, h: .7 + (k % 3) * .15, color: ['#c8a46a', '#b98f52', '#9fc6e8'][k % 3], roof: '#d9c29a' }); }
  Bx(O, { x0: 6.0, y0: 8.6, x1: 7.2, y1: 9.4, h: .55, color: '#f4b400', roof: '#2a3038' }); Bx(O, { x0: 7.2, y0: 8.8, x1: 7.35, y1: 9.2, h: 1.9, color: '#2a3038' });   // forklift
  Bx(O, { x0: 9.4, y0: 8.6, x1: 11.4, y1: 9.3, h: .9, color: '#cfd6de', roof: '#e3e8ee' }); person(O, 10.4, 9.8, false, 4); person(O, 8.2, 2.0, false, 6); } };

ZINFO.warehouse = { x: 75, y: 42.6, z: 3.2 };

// buildings: main shed with dock doors, office, cold store, yard clutter and parked trailers
{
  const Z = 'warehouse', H = WH_HUB;
  box(Z, 64, 41.0, 84, 44.2, 1.9, '#d5dce4', { roof: '#a7b2be', stripe: '#ef6c00', deco: ['solar'] });
  H.docks.forEach(x => {
    box(Z, x - .55, 44.2, x + .55, 44.32, 1.15, '#90a4ae', { roof: '#78909c' });             // roll-up door
    box(Z, x - .7, 44.2, x + .7, 44.6, .08, '#455a64', { z0: 1.3, roof: '#37474f' });         // canopy
  });
  box(Z, 84, 41.0, 88, 43.6, 1.5, '#90caf9', { win: 'grid', roof: '#cfd8dc' });              // office
  box(Z, 60.6, 41.2, 63.8, 44.0, 1.35, '#f4f7fa', { stripe: '#29b6f6', roof: '#e3eaf0' });    // cold store
  box(Z, 61.4, 44.0, 62.8, 44.3, .9, '#b0bec5', { roof: '#90a4ae' });
  [[89.2, 41.4], [90.6, 41.4], [89.2, 42.8], [92, 41.4]].forEach(([x, y], i) => box(Z, x, y, x + 1.25, y + .5, .5, ['#1565c0', '#c62828', '#2e7d32', '#ef6c00'][i], { roof: '#cfd8dc' }));   // containers
  for (let k = 0; k < 6; k++) box(Z, 93.5 + (k % 3) * .5, 41.6 + Math.floor(k / 3) * .55, 93.9 + (k % 3) * .5, 42.0 + Math.floor(k / 3) * .55, .3, '#c8a46a', { roof: '#d9c29a' });   // pallets
  [0, 2, 4].forEach(k => { const x = H.docks[k]; box(Z, x - .26, 44.35, x + .26, 45.45, .55, '#eef1f4', { stripe: '#ef6c00', roof: '#ffffff' }); box(Z, x - .24, 45.45, x + .24, 45.85, .45, ['#1565c0', '#c62828', '#2e7d32'][k / 2], { roof: '#263238' }); });
  add('wtruck', Z, 96, 45.3);   // a truck that drives in, docks and leaves
}
// the truck cycle: in from the east along the yard, reverse onto dock 4, wait, leave
function wTruck() {
  const u = time % 46, dock = WH_HUB.docks[3];
  if (u < 10) return { x: 104 - (104 - dock) * (u / 10), y: 45.25, ax: 'x' };
  if (u < 13) return { x: dock, y: 45.25 - (u - 10) / 3 * .65, ax: 'y' };
  if (u < 30) return { x: dock, y: 44.6, ax: 'y' };
  if (u < 33) return { x: dock, y: 44.6 + (u - 30) / 3 * .65, ax: 'y' };
  return { x: dock + (104 - dock) * ((u - 33) / 13), y: 45.25, ax: 'x' };
}
function drawWTruck() {
  const t = wTruck(), L = .7, W = .26;
  if (t.ax === 'x') { drawBox({ x0: t.x - L, x1: t.x + L, y0: t.y - W, y1: t.y + W, z0: .06, h: .55, color: '#eef1f4', stripe: '#ef6c00', roof: '#ffffff' }); drawBox({ x0: t.x - L - .42, x1: t.x - L, y0: t.y - .24, y1: t.y + .24, z0: .06, h: .45, color: '#6a1b9a', roof: '#263238' }); }
  else { drawBox({ x0: t.x - W, x1: t.x + W, y0: t.y - .25, y1: t.y + L * 1.3, z0: .06, h: .55, color: '#eef1f4', stripe: '#ef6c00', roof: '#ffffff' }); drawBox({ x0: t.x - .24, x1: t.x + .24, y0: t.y + L * 1.3, y1: t.y + L * 1.3 + .42, z0: .06, h: .45, color: '#6a1b9a', roof: '#263238' }); }
}

DEVICES.push(
  fdev({ id: 'wh-ai', cat: 'ai', brand: 'IRIV', model: 'IRIV EdgeAI CM5', name: 'Logistics Gate & Dock Cameras', icon: '📷', zone: 'warehouse', x: 96.5, y: 44.6, z: 1.6, qty: 1,
    conn: 'IP cameras (RTSP) · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Gate + dock CCTV', 'Ethernet', 'EdgeAI CM5', 'MQTT', 'IRIV Edge'],
    loc: 'Yard gate, east side', short: 'Logistics hub', what: 'Reads truck plates at the gate, checks the booking and assigns a dock. Inside, it watches people near forklifts.', why: 'At the gate, where every truck must pass.',
    m: [['Last plate', () => 'WXY ' + (1000 + Math.floor(time / 46) % 9000)], ['Trucks today', () => 64 + Math.floor(time / 20)], ['Near-misses', () => '0'], ['Model', () => 'ANPR + people']],
    say: 'This A I computer reads truck plates at the logistics gate and sends each truck to a free dock.' }),
  fdev({ id: 'wh-ioc', cat: 'controller', brand: 'IRIV', model: 'IRIV IO Controller MQTT', name: 'Dock Doors & Lights Controller', icon: '🔀', zone: 'warehouse', x: 73.7, y: 44.4, z: 1.4, qty: 1,
    conn: 'Ethernet · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Door motors, dock lights', 'DI / DO', 'IO Controller', 'MQTT', 'IRIV Edge'],
    loc: 'Between docks 3 and 4', short: 'Logistics hub', what: 'Opens the roll-up doors when a trailer is in place and switches the red and green dock lights.', why: 'Central to the six dock doors.',
    m: [['Doors open', () => (2 + Math.floor(time / 15) % 4) + ' of 6'], ['Dock 4', () => { const u = time % 46; return u >= 13 && u < 30 ? 'Trailer · open' : 'Free'; }], ['Lights', () => 'Auto'], ['MQTT', () => 'Connected']],
    say: 'This I O Controller opens the dock doors and switches the dock lights.' }),
  fdev({ id: 'wh-ts', model: 'TS302', name: 'Cold Store Probes', icon: '❄️', zone: 'warehouse', x: 62.2, y: 42.6, z: 1.5, qty: 2,
    loc: 'Inside the cold store', short: 'Logistics hub', what: 'Two temperature probes in the 2–6 °C cold store, plus the door contact.', why: 'In the air stream and near the door.',
    m: [['Probe 1', () => wob(3.8, .5, .05).toFixed(1) + ' °C'], ['Probe 2', () => wob(4.3, .5, .05, 1).toFixed(1) + ' °C'], ['Door', () => 'Closed'], ['Battery', () => '97%']],
    say: 'These probes check the cold store stays between two and six degrees.' }),
  fdev({ id: 'wh-reefer', model: 'EM320-TH', name: 'Reefer Trailer Monitor', icon: '🚚', zone: 'warehouse', x: 88, y: 45.6, z: .8, qty: 2,
    loc: 'Magnet-mounted inside the refrigerated trailer', short: 'Cold chain on the move',
    what: 'An IP67 temperature and humidity sensor rides inside the refrigerated trailer, so the cold chain is recorded door to door, not only inside the cold store.', why: 'With the goods, where the temperature actually matters.',
    m: [['Trailer temp', () => wob(4.1, .4, .05).toFixed(1) + ' °C'], ['Trailer', () => { const u = time % 46; return u >= 13 && u < 30 ? 'At dock 4 · unloading' : 'On the road'; }], ['Humidity', () => Math.round(wob(68, 3, .05)) + '% RH'], ['Battery', () => '93%']],
    say: 'This sensor rides inside the refrigerated trailer, so the cold chain is proven from the supplier\'s door to the cold store, not only inside the warehouse.' }),
  fdev({ id: 'wh-tld', model: 'EM400-TLD', name: 'Trailer Presence Sensors', icon: '📏', zone: 'warehouse', x: 78.2, y: 44.3, z: 1.4, qty: 6,
    loc: 'Above each dock door', short: 'Logistics hub', what: 'A laser distance sensor over each door sees when a trailer is backed in.', why: 'Looking out at the dock bay.',
    m: [['Docks with a trailer', () => '3 of 6'], ['Dock 4', () => { const u = time % 46; return u >= 13 && u < 30 ? '0.4 m · present' : '> 4 m · free'; }], ['Battery', () => '95%'], ['Link', () => 'LoRaWAN']],
    say: 'These sensors see when a trailer is at each dock door.' })
);
DEVICES.forEach(d => { if (!DEV[d.id]) DEV[d.id] = d; });
SCENES.warehouse = makeRoom('warehouse', 'storehouse');   // after the devices exist, so they are installed in the room
SCENES.warehouse.sum += ' For the whole warehouse with moving forklifts and all 30 sensors, open Warehouse Command 3D from the Logistics Hub panel.';
Object.assign(CAN, {
  'wh-ai': ['Trucks go straight to a free dock', 'Booking check without paperwork', 'People–forklift near-miss alerts'],
  'wh-ioc': ['Doors open only with a trailer in place', 'Red/green lights for drivers', 'Door cycle counts for maintenance'],
  'wh-ts': ['Cold-chain record for every shift', 'Alarm on a warm store or open door'],
  'wh-reefer': ['Door-to-door cold-chain proof for every delivery', 'Alert the driver before goods warm up', 'Trailer history joins the cold-store record automatically'],
  'wh-tld': ['Live dock occupancy', 'Door interlock with the trailer']
});

// yard paving and lines, and the moving truck (the map pin comes from ZINFO)
const _whGround = worldGround5;
worldGround5 = function () {
  _whGround();
  const H = WH_HUB;
  poly(quad(H.x0, H.y0, H.x1, H.y1, .012), col('#8a929c'));
  poly(quad(96, 44.9, AIR.x1 - .5, 45.7, .012), col(ROAD_COL));                 // yard access lane from the east
  H.docks.forEach(x => { for (const s of [-.6, .6]) poly(quad(x + s - .03, 44.4, x + s + .03, 45.9, .014), 'rgba(255,255,255,.75)'); });
  for (let x = 96.5; x < AIR.x1 - 1; x += 1.4) poly(quad(x, 45.27, x + .7, 45.33, .014), 'rgba(255,255,255,.7)');
};
const _whDrawObj = drawObj;
drawObj = function (o, path) { if (o.t === 'wtruck') return drawWTruck(); return _whDrawObj(o, path); };
