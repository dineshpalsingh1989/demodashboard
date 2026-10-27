/* Milesight catalog additions. Product references: MILESIGHT_PRODUCTS.md.
   All quantities, readings, rules and scenarios below are fictional demo data.
   Loaded after the city definitions and before initUI builds search and totals. */
const MILESIGHT_DEMO = { leak: false, leakAck: false, coldDoor: false, coldTemp: null, coldAlert: false };
const MILESIGHT_IDS = [];
const FARM_RADIO_PATH = ['LoRaWAN', 'SG50 solar gateway', '4G', 'LoRaWAN network server', 'MQTT', 'IRIV Edge'];

(() => {
  const product = (family, slug) => `https://www.milesight.com/iot/product/${family}/${slug}`;
  const temp = () => MILESIGHT_DEMO.coldTemp ?? Number(wob(4.6, .2, .15).toFixed(1));
  const pressure = () => Number(wob(340, 10, .3).toFixed(1));
  const binFill = () => Math.round(wob(74, 5, .025));
  const deskBusy = () => Math.floor(time / 18) % 3 !== 0;
  const sound = () => Number(wob(48, 4, .17).toFixed(1));
  const solar = () => night > .5 ? 0 : Number(wob(19, 2, .09).toFixed(1));

  function addProduct(options, can) {
    const d = fdev({ image: options.model + '.svg', imageCredit: 'Product family illustration · Milesight',
      path: ['Sensor', 'LoRaWAN', 'UG65 gateway', 'LoRaWAN network server', 'MQTT', 'IRIV Edge'], ...options });
    d.say = `${d.model}. ${d.what} ${d.why} The readings shown are simulated.`;
    DEVICES.push(d); DEV[d.id] = d; CAN[d.id] = can; MILESIGHT_IDS.push(d.id);
    return d;
  }
  // Map pins represent each installation group; quantity is the project's demo BOM.
  addProduct({ id: 'park-bin', model: 'EM400-TLD', name: 'Smart Bin Fill Sensor', icon: '♻️', zone: 'green',
    x: 5.7, y: 9.2, z: .8, qty: 10, short: 'Park bins', loc: 'Under the lids of small park bins',
    power: '2 × ER26500 batteries', productUrl: product('lorawan-sensor', 'em400-tld'), variant: 'LoRaWAN variant selected.',
    what: 'A laser distance sensor measures the empty space in a bin. This demo converts that distance to a fill percentage using a configured bin height.',
    why: 'Collection teams can prioritise bins nearing capacity and check tilt or temperature alerts.',
    m: [['Estimated fill', () => binFill() + '%'], ['Distance to waste', () => 100 - binFill() + ' cm'], ['Bin position', () => 'Upright'], ['Temperature', () => wob(29, .5, .1).toFixed(1) + ' °C']],
    payload: () => ({ simulated: true, model: 'EM400-TLD', distance_cm: 100 - binFill(), configured_bin_height_cm: 100, estimated_fill_pct: binFill(), tilted: false })
  }, ['Prioritise collection above a demo 80% threshold', 'Track fill history for each bin', 'Flag a tipped bin for inspection']);

  addProduct({ id: 'dc-leak', model: 'EM300-SLD', name: 'Server Room Leak Detector', icon: '💧', zone: 'iot',
    x: ZINFO.iot.x + 1.4, y: ZINFO.iot.y + 1.3, z: .2, qty: 6, short: 'Data center floor', loc: 'Floor probes beside data center cooling units',
    power: 'ER18505 battery', productUrl: product('lorawan-sensor', 'em300-sld-zld'), variant: 'SLD spot probe selected; detects water presence.',
    what: 'A spot probe detects conductive liquid at the cooling-unit drain. The enclosure also measures ambient temperature and humidity.',
    why: 'A small leak can be investigated before water reaches the server racks.', demoScenario: 'leak', demoTitle: 'water-leak response',
    m: [['Leak probe', () => MILESIGHT_DEMO.leak ? '⚠ Water detected' : 'Dry'], ['Incident', () => MILESIGHT_DEMO.leakAck ? 'Acknowledged' : MILESIGHT_DEMO.leak ? 'New alert' : 'Clear'], ['Room temperature', () => wob(21.2, .3, .2).toFixed(1) + ' °C'], ['Humidity', () => wob(48, 2, .1).toFixed(0) + '% RH']],
    payload: () => ({ simulated: true, model: 'EM300-SLD', water_detected: MILESIGHT_DEMO.leak, temperature_c: 21.2, humidity_pct: 48 })
  }, ['Show the affected cooling unit on the dashboard', 'Create a maintenance alert', 'Record detection, acknowledgement and clearance']);

  addProduct({ id: 'water-pressure', model: 'EM500-PP', name: 'Water Network Pressure', icon: '🚰', zone: 'clearwater',
    x: ZINFO.clearwater.x + 1, y: ZINFO.clearwater.y, z: .9, qty: 4, short: 'Water distribution', loc: 'Pressure tapping points on the treated-water outlet',
    power: 'ER34615 battery', productUrl: product('lorawan-sensor', 'em500-pp'),
    what: 'A pipe-pressure sensor reports distribution pressure over LoRaWAN. It measures pressure rather than flow.',
    why: 'Compare pressure trends across the network and flag unusual drops for an engineer to investigate.',
    m: [['Pipe pressure', () => pressure().toFixed(1) + ' kPa'], ['Pressure in bar', () => (pressure() / 100).toFixed(2) + ' bar'], ['Demo low limit', () => '250 kPa'], ['Condition', () => 'Within demo band']],
    payload: () => ({ simulated: true, model: 'EM500-PP', pressure_kpa: pressure(), low_limit_kpa: 250, high_limit_kpa: 450 })
  }, ['Low-pressure alerts', 'Compare outlet and network pressure', 'Inspect unexplained changes before adjusting pumps']);

  addProduct({ id: 'clinic-cold', model: 'TS302', name: 'Cold Cabinet Monitor', icon: '❄️', zone: 'clinic',
    x: ZINFO.clinic.x + .6, y: ZINFO.clinic.y + .3, z: 1, qty: 4, short: 'Clinic cold storage', loc: 'External temperature probe in the cabinet; contact at its door',
    power: '2 × ER18505 batteries', productUrl: product('lorawan-sensor', 'ts30x'), variant: 'TS302 configured with one temperature probe and one door sensor.',
    what: 'A two-channel monitor pairs a temperature probe with a magnetic door sensor to report cabinet temperature and door state.',
    why: 'Staff can connect a temperature excursion with a door left open. The 2–8 °C band here is an illustrative demo setting.', demoScenario: 'coldchain', demoTitle: 'cold-storage response',
    m: [['Cabinet temperature', () => temp().toFixed(1) + ' °C'], ['Door', () => MILESIGHT_DEMO.coldDoor ? 'Open' : 'Closed'], ['Configured demo band', () => '2–8 °C'], ['Temperature status', () => MILESIGHT_DEMO.coldAlert ? '⚠ Above demo limit' : 'Within demo band']],
    payload: () => ({ simulated: true, model: 'TS302', temperature_c: temp(), door_open: MILESIGHT_DEMO.coldDoor, demo_limits_c: [2, 8], alert: MILESIGHT_DEMO.coldAlert })
  }, ['Notice a door left open', 'Alert staff when a configured temperature limit is exceeded', 'Review cabinet temperature history']);

  addProduct({ id: 'office-desk', model: 'VS341', name: 'Desk Occupancy Sensor', icon: '🪑', zone: 'buildings',
    x: ZINFO.buildings.x - 1, y: ZINFO.buildings.y + 1, z: 1, qty: 24, short: 'Office desks', loc: 'Under individual desks on the smart office floor',
    power: 'ER18505 battery', productUrl: product('lorawan-sensor', 'vs34x'), variant: 'VS341 uses PIR plus thermopile sensing.',
    what: 'A desk sensor reports occupied or vacant using motion and thermal sensing, without identifying the person.',
    why: 'Show available desks and compare workspace use over time. Each sensor reports one desk, not a room headcount.',
    m: [['Desk A-12', () => deskBusy() ? 'Occupied' : 'Available'], ['Demo fleet', () => '24 desks'], ['Detection', () => 'PIR + thermopile'], ['Personal data', () => 'No identity collected']],
    payload: () => ({ simulated: true, model: 'VS341', desk: 'A-12', occupied: deskBusy() })
  }, ['Display available desks', 'Compare workspace utilisation', 'Support occupancy-based office planning']);

  addProduct({ id: 'school-sound', model: 'WS302', name: 'Classroom Sound Level', icon: '🔊', zone: 'school',
    x: ZINFO.school.x - .8, y: ZINFO.school.y + .7, z: 1.5, qty: 6, short: 'School classrooms', loc: 'Indoor wall in each monitored classroom',
    power: '2 × ER14505 batteries', productUrl: product('lorawan-sensor', 'ws302'), variant: 'Indoor IP30 installation; A-weighted readings shown.',
    what: 'An indoor sound-level sensor measures sound pressure, equivalent level and maximum level. This dashboard displays levels in dBA.',
    why: 'Teachers and facilities staff can compare room sound levels and investigate sustained disruption.',
    m: [['Sound pressure', () => sound().toFixed(1) + ' dBA'], ['Equivalent level', () => wob(47, 2, .09).toFixed(1) + ' dBA'], ['Maximum level', () => '63.2 dBA'], ['Sample type', () => 'Simulated A-weighted levels']],
    payload: () => ({ simulated: true, model: 'WS302', weighting: 'A', spl_db: sound(), leq_db: Number(wob(47, 2, .09).toFixed(1)), lmax_db: 63.2 })
  }, ['Compare classroom sound trends', 'Flag repeated high-level periods', 'Review levels alongside room occupancy']);

  addProduct({ id: 'farm-valve', model: 'UC511', cat: 'controller', name: 'Solar Irrigation Valve Controller', icon: '🌱', zone: 'farmbelt',
    x: DEV['belt-smtc'].x + 1.8, y: DEV['belt-smtc'].y - .7, z: .5, qty: 4, gw: 'farm-sg50', short: 'Remote irrigation zones', loc: 'Weatherproof valve boxes in the remote vegetable fields',
    power: 'Solar panel + rechargeable batteries', productUrl: product('iot-controller', 'uc51x'), variant: 'UC511 solar variant, driving DC latching solenoid valves.',
    path: ['IRIV Edge rule', 'MQTT', 'LoRaWAN network server', '4G', 'SG50', 'LoRaWAN downlink', 'UC511', 'Latching valve'],
    what: 'A LoRaWAN controller operates two DC latching solenoid valves and accepts two pulse-meter inputs. The demo opens a watering zone when its soil-moisture rule calls for irrigation.',
    why: 'Remote valves can follow a schedule or a soil-based command; the existing PiControl remains responsible for the pump.',
    m: [['Valve 1', () => FARM.pump ? 'Open · watering' : 'Closed'], ['Valve 2', () => 'Closed'], ['Soil moisture', () => FARM.soil.toFixed(0) + '%'], ['Demo rule', () => 'Open below 34%; close above 58%']],
    payload: () => ({ simulated: true, model: 'UC511', valve_1: FARM.pump ? 'open' : 'closed', valve_2: 'closed', rule_source: 'IRIV Edge demo', soil_moisture_pct: Number(FARM.soil.toFixed(1)) })
  }, ['Open only the irrigation zones that need water', 'Use valve schedules', 'Read a connected pulse meter when fitted']);

  addProduct({ id: 'farm-sg50', model: 'SG50', cat: 'gateway', name: 'Solar Farm Gateway', icon: '☀️', zone: 'farmbelt',
    x: -52.4, y: 35.4, z: 2.7, qty: 1, short: 'Remote farm mast', loc: 'Mast beside the remote farmyard, with an exposed solar panel',
    conn: 'LoRaWAN radio · 4G cellular backhaul', power: '30 W solar panel + 25 Ah battery', productUrl: product('lorawan-gateway', 'sg50'),
    path: ['Field devices', ...FARM_RADIO_PATH],
    what: 'A solar-powered LoRaWAN gateway receives the remote farm sensors and forwards their messages over 4G to a LoRaWAN network server, then to IRIV Edge via MQTT.',
    why: 'The farm gateway can operate away from mains power and wired internet. Coverage depends on the site and installation.',
    m: [['Backhaul', () => '4G · online (demo)'], ['Field devices', () => '18 configured'], ['Solar input', () => solar().toFixed(1) + ' W'], ['Battery', () => night > .5 ? '81% · discharging' : '87% · charging']],
    payload: () => ({ simulated: true, model: 'SG50', backhaul: '4G', configured_end_devices: 18, solar_input_w: solar(), battery_pct: night > .5 ? 81 : 87 })
  }, ['Receive remote soil and water-level sensors', 'Deliver irrigation valve commands through the network server', 'Monitor gateway power and connectivity']);

  ['belt-smtc', 'belt-udl'].forEach(id => { DEV[id].gw = 'farm-sg50'; DEV[id].path = ['Sensor', ...FARM_RADIO_PATH]; });
  const farm = TOPICS.farmbelt;
  farm.sum = 'Beyond the small town, rice paddies and vegetable fields use soil and water-level sensors, solar UC511 valve controllers and an SG50 solar gateway. The gateway uses 4G to reach the network server and IRIV Edge. All activity is simulated.';
  farm.how = ['EM500-SMTC reports root-zone soil moisture.', 'EM500-UDL monitors paddy water level.', 'UC511 opens DC latching irrigation valves from the demo soil rule.', 'SG50 provides solar-powered LoRaWAN coverage with a 4G backhaul.'];
  farm.chain = [['🌱', 'Soil & paddy sensors', 'EM500-SMTC, EM500-UDL'], ['☀️', 'SG50 gateway', 'LoRaWAN → 4G'], ['📡', 'Network server', 'LoRaWAN → MQTT'], ['🧠', 'IRIV Edge', 'demo irrigation rule'], ['🌱', 'UC511', 'DC latching valves']];
  farm.say = farm.sum + ' Click the fields to visit the packing shed.';

  function inRoom(zone, id, position) {
    const d = DEV[id];
    SCENES[zone].devs.push({ id, qty: d.qty, where: d.loc, why: d.why, can: CAN[id], say: d.say, ...position });
  }
  inRoom('green', 'park-bin', { x: .03, y: 5.2, z: 1.4, mount: 'A', where: 'Park bins outside; sensor status shown in this control office' });
  inRoom('iot', 'dc-leak', { x: 1.35, y: 2.4, z: .1, b: { x0: 1.2, y0: 2.3, x1: 1.5, y1: 2.5, h: .1 } });
  inRoom('clearwater', 'water-pressure', { x: 12.8, y: 4, z: 1.9, mount: 'clamp' });
  inRoom('clinic', 'clinic-cold', { x: 13.1, y: 1.05, z: 1.3, b: { x0: 13, y0: 1, x1: 13.2, y1: 1.1, z0: 1.2, h: .2 } });
  inRoom('buildings', 'office-desk', { x: 4.6, y: 5.25, z: .6, b: { x0: 4.5, y0: 5.15, x1: 4.7, y1: 5.35, z0: .5, h: .1 } });
  inRoom('school', 'school-sound', { x: .03, y: 6.9, z: 1.7, mount: 'A' });

  // The original farm and the remote farm shared a room object. Give the remote
  // farm its own device list so its SG50 route cannot alter the city farm.
  SCENES.farmbelt = { ...SCENES.farm, objs: undefined, devs: [],
    title: 'Remote Farm Packing Shed', short: 'the Remote Farm', sum: farm.sum, say: farm.say,
    can: farm.how, m: farm.m, gw: { id: 'farm-sg50', x: -1.8, y: 1.2, z: 3.4, label: 'SG50 · solar farm mast' } };
  // Only the remote LoRaWAN field devices use this room's gateway badge.
  inRoom('farmbelt', 'belt-smtc', { x: .03, y: 6, z: 1.4, mount: 'A', where: 'Field soil probe; status shown on the shed wall' });
  inRoom('farmbelt', 'belt-udl', { x: .03, y: 3.8, z: 1.4, mount: 'A', where: 'Paddy level probe; status shown on the shed wall' });
  inRoom('farmbelt', 'farm-valve', { x: 11.4, y: 8.5, z: .6, b: { x0: 11.2, y0: 8.3, x1: 11.6, y1: 8.7, z0: .4, h: .2 }, where: 'Field valve box; demonstration controller by the shed exit' });
  // The gateway appears as the room's clickable outdoor badge.

  const reset = () => Object.assign(MILESIGHT_DEMO, { leak: false, leakAck: false, coldDoor: false, coldTemp: null, coldAlert: false });
  function statusPin(id, text, color) {
    const d = DEV[id], p = P(d.x, d.y, d.z + 1.2);
    if (!p.b) pill(p[0], p[1], text, color, '#fff', 12);
  }
  const leakCam = [DEV['dc-leak'].x, DEV['dc-leak'].y, 2.2];
  const coldCam = [DEV['clinic-cold'].x, DEV['clinic-cold'].y, 2.2];
  SCENARIOS.leak = {
    icon: '💧', color: '#00838f', title: 'Water-leak response', sub: 'Simulated cooling-unit leak → EM300-SLD → staff alert → repair', reset,
    draw() { statusPin('dc-leak', MILESIGHT_DEMO.leak ? 'EM300-SLD · WATER DETECTED' : 'EM300-SLD · dry', MILESIGHT_DEMO.leak ? '#d84315' : '#00897b'); },
    steps: [
      { t: 'Cooling unit begins to leak', cam: leakCam, dur: 7, run() { MILESIGHT_DEMO.leak = true; selDev = 'dc-leak'; }, text: 'In this simulated event, water reaches the EM300-SLD spot probe beside a data center cooling unit. The sensor reports water detected.' },
      { t: 'Leak event reaches the dashboard', cam: [DEV.edge.x, DEV.edge.y, 2], dur: 7, run() { selDev = 'edge'; }, text: 'The LoRaWAN message travels through the UG65 gateway and network server to IRIV Edge. A demo rule opens an incident for the affected cooling unit.' },
      { t: 'Technician acknowledges the alert', cam: leakCam, dur: 7, run() { MILESIGHT_DEMO.leakAck = true; selDev = 'dc-leak'; }, text: 'A simulated technician acknowledges the incident and checks the cooling drain. The probe still reports wet; acknowledgement alone does not clear the leak.' },
      { t: 'Repair complete; probe is dry', cam: leakCam, dur: 7, run() { MILESIGHT_DEMO.leak = false; MILESIGHT_DEMO.leakAck = false; }, text: 'The technician repairs the drain and removes the water. A dry reading clears this demo incident. Detection, acknowledgement and clearance form its timeline.' }
    ]
  };
  SCENARIOS.coldchain = {
    icon: '❄️', color: '#1565c0', title: 'Cold-storage response', sub: 'Simulated open cabinet door → TS302 temperature alert → staff response', reset,
    draw() { statusPin('clinic-cold', `TS302 · ${temp().toFixed(1)} °C · door ${MILESIGHT_DEMO.coldDoor ? 'open' : 'closed'}`, MILESIGHT_DEMO.coldAlert ? '#d84315' : '#1565c0'); },
    steps: [
      { t: 'Cabinet door left open', cam: coldCam, dur: 7, run() { MILESIGHT_DEMO.coldDoor = true; MILESIGHT_DEMO.coldTemp = 5.1; selDev = 'clinic-cold'; }, text: 'The TS302 door contact reports an open cabinet while its separate temperature probe reads 5.1 degrees Celsius. This is a simulated clinic installation.' },
      { t: 'Temperature crosses the demo limit', cam: coldCam, dur: 7, run() { MILESIGHT_DEMO.coldTemp = 8.6; MILESIGHT_DEMO.coldAlert = true; }, text: 'The demonstration advances time: the cabinet reaches 8.6 degrees. IRIV Edge flags the reading above this cabinet’s configured demo band of 2 to 8 degrees.' },
      { t: 'Staff receive the cabinet alert', cam: [DEV.edge.x, DEV.edge.y, 2], dur: 7, run() { selDev = 'edge'; }, text: 'The dashboard pairs the high-temperature event with the open-door state. In this demo, staff are notified to inspect the cabinet and its contents.' },
      { t: 'Door closed; temperature recovering', cam: coldCam, dur: 7, run() { MILESIGHT_DEMO.coldDoor = false; MILESIGHT_DEMO.coldTemp = 7.2; MILESIGHT_DEMO.coldAlert = false; selDev = 'clinic-cold'; }, text: 'Staff close the door and check the cabinet. The simulated temperature returns inside its configured band. Any decisions about stored items require the site’s own procedures.' },
      { t: 'Cabinet back at its demo setpoint', cam: coldCam, dur: 6, run() { MILESIGHT_DEMO.coldTemp = 4.6; }, text: 'The cabinet settles at 4.6 degrees. Temperature and door history help staff review the incident. No real sensor readings or messages are involved.' }
    ]
  };
})();

function showMilesightCatalog() {
  if (WALK.on) exitWalk();
  stopTour(); if (SC) stopScenario(true); if (scene === 'inside') leaveNow();
  FX.follow = null; sel = null; selDev = null; nav = null;
  const cards = MILESIGHT_IDS.map(id => {
    const d = DEV[id];
    return `<button class="pcard" data-dev="${id}">${picHTML(d)}<b>${d.model}</b><span>${d.name}</span><small>${d.short} · ${d.qty} demo units</small></button>`;
  }).join('');
  openPanel('#00897b', headHTML('📡', 'Milesight collection', 'Eight new ways to connect the city') +
    '<p class="p-sum">Explore sensors for bins, leaks, pipe pressure, cold storage, desks and classroom sound, plus solar irrigation control and a remote farm gateway.</p>' +
    '<p class="product-note">59 additional demo units. Product capabilities are based on Milesight references; installations, readings and automation are simulated.</p>' +
    '<button class="tourbtn" data-scen="leak">▶ Water-leak response</button><button class="tourbtn alt" data-scen="coldchain">▶ Cold-storage response</button>' +
    `<h3>Choose a product to see it on the map</h3><div class="catalog-products">${cards}</div>` +
    '<a class="product-source" href="https://www.milesight.com/iot/" target="_blank" rel="noopener noreferrer">Browse the official Milesight IoT catalog ↗</a>', []);
  cam.tx = CX; cam.ty = CX; cam.tz = 1;
  narrate('Eight new Milesight products extend the demo with waste collection, leak detection, pressure monitoring, cold storage, desk occupancy, classroom sound, irrigation valves and a solar farm gateway.', false);
}
panel.addEventListener('click', e => { if (e.target.closest('[data-act="milesight"]')) showMilesightCatalog(); });
