/* Regional power grid: the 132 kV line is extended from the city substation to the airport, the small town,
   the village and the farm pumps. Loaded after airport.js and before device-insights.js. */

const GRIDR = {   // [x, y, z]; the last point of each route is the landing on the substation gantry
  air: [[55.5, 25.5, 4.3], [59.4, 25.5, 4.3], [60.6, 25.3, 2.6]],
  town: [[38.5, 7.5, 4.3], [28, 8.3, 4.3], [15.1, 8.3, 4.3], [15.1, 15.4, 4.3], [15.1, 22.5, 4.3], [6, 22.5, 4.3], [-3, 22.5, 4.3], [-8, 22.5, 4.3], [-15, 22.5, 4.3], [-20.5, 22.5, 2.6]],
  village: [[-20.5, 24.4, 4.3], [-20.5, 36, 4.3], [-20.5, 42.6, 2.6]],
  farm: [[-22.2, 22.5, 4.3], [-30.5, 22.5, 4.3], [-38.5, 22.5, 4.3], [-46.5, 22.5, 4.3], [-54, 22.5, 4.3], [-60.4, 24.6, 2.6]]
};
const GRIDR_CABLES = [   // ground cables inside a site
  [[62, 24.9, .15], [62, 24.0, .15], [104, 24.0, .15], [104, 21.5, .15]],
  [[-21.6, 43.0, .15], [-21.6, 38.6, .15], [-44, 38.6, .15]]
];
const GRIDR_SUBS = [   // x, y, label, load in MW
  [61.2, 25.3, 'Airport', () => 5.5 + FL.busy() * 1.4 + night * 1.5, 'Backup generator'],
  [-20.6, 22.5, 'Small town', () => 1.6 + night * .6, 'Island · solar'],
  [-20.6, 43.0, 'Village', () => Math.max(.05, .35 + night * .25 - (night > .5 ? 0 : .2)), 'Solar + battery'],
  [-60.6, 25.3, 'Farm pumps', () => FARM.pump ? .35 : .06, 'Off']
];
const oilT = () => 60 + 14 * Math.sin(time * .03 + 1);   // swings 46–74 °C, so the fan rule really fires now and then
const powerCut = () => !!(SC && SC.id === 'power');
GRIDR.total = () => GRIDR_SUBS.reduce((a, s) => a + s[3](), 0);

TOPICS.regionalgrid = { icon: '🗼', color: '#efa912', kicker: 'Power', title: 'Regional Power Grid',
  sum: 'The 132 kV line from the city substation now reaches the airport, the small town, the village and the farm pumps. Each has its own substation and a live load. An IRIV PiControl guards the airport transformers and an IRIV IO Controller guards the small-town breakers, and Milesight CT105 sensors measure the current at every substation.',
  how: ['Yellow animated lines show power flowing from the city substation to each place.', 'PiControl at the airport substation reads transformer oil temperature and runs the cooling fans.', 'IO Controller MQTT at the small-town substation reads breakers and earth-fault contacts.', 'CT105 current sensors report every substation load over LoRaWAN.'], ben: ['Every place has power', 'Faults found at once', 'Load visible live'],
  m: [['Airport load', () => GRIDR_SUBS[0][3]().toFixed(1) + ' MW'], ['Small town load', () => GRIDR_SUBS[1][3]().toFixed(1) + ' MW'], ['Village load', () => (GRIDR_SUBS[2][3]() * 1000).toFixed(0) + ' kW'], ['Farm pumps', () => (GRIDR_SUBS[3][3]() * 1000).toFixed(0) + ' kW']],
  chain: [['⚡', 'City substation', '132 kV'], ['🗼', 'Regional line', 'pylons'], ['🏭', 'Site substations', 'airport · town · village · farm'], ['🎛️', 'IRIV units', 'PiControl · IO Controller'], ['☁️', 'IRIV Edge', 'live loads']],
  say: 'This is the regional power grid. A 132 kilovolt line carries power from the city substation to the airport, the small town, the village and the farm pumps. Every substation has current sensors, and I R I V controllers guard the transformers and breakers.' };
ORDER.push('regionalgrid');
ZINFO.regionalgrid = { x: 61, y: 25, z: 3.4 };

// pylons and substations
Object.values(GRIDR).filter(Array.isArray).forEach(route => route.slice(0, -1).forEach((p, i) => add('pylon', 'regionalgrid', p[0], p[1], { to: route[i + 1].slice(0, 2), toZ: route[i + 1][2] })));
GRIDR_SUBS.forEach(([x, y]) => {
  box('regionalgrid', x - .8, y - .8, x + .8, y + .8, .3, '#90a4ae', { roof: '#78909c' });
  box('regionalgrid', x - .6, y - .5, x - .1, y + .5, .8, '#cfd8dc', { z0: .3, deco: ['cabinet'] });
  box('regionalgrid', x + .1, y - .5, x + .6, y + .5, .8, '#cfd8dc', { z0: .3, deco: ['cabinet'] });
});

DEVICES.push(
  fdev({ id: 'air-sub-pic', cat: 'controller', brand: 'IRIV', model: 'IRIV PiControl', name: 'Airport Substation Controller', icon: '🎛️', zone: 'regionalgrid', x: 61.2, y: 25.3, z: 1.5, qty: 1,
    conn: 'Fibre · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Transformer sensors', 'AI / DI / DO', 'PiControl', 'MQTT', 'IRIV Edge'],
    loc: 'Airport substation', short: 'Airport substation', what: 'Reads the two transformer oil temperatures and the breaker, and runs the cooling fans.', why: 'In the substation control cabinet.',
    m: [['T1 oil', () => Math.round(oilT()) + ' °C'], ['Load', () => GRIDR_SUBS[0][3]().toFixed(1) + ' MW'], ['Fans', () => oilT() > 70 ? 'On' : 'Auto'], ['MQTT', () => 'Connected']],
    say: 'This I R I V PiControl guards the airport substation transformers and runs the cooling fans.' }),
  fdev({ id: 'air-sub-ct', model: 'CT105', name: 'Airport Substation Current', icon: '⚡', zone: 'regionalgrid', x: 60.4, y: 24.7, z: 1.2, qty: 2, power: 'Check datasheet (sources differ)',
    loc: 'Airport substation feeders', short: 'Airport substation', what: 'Measures the current of each airport feeder.', why: 'Clamped on the feeder cables.',
    m: [['Current', () => Math.round(GRIDR_SUBS[0][3]() * 4.4) + ' A'], ['Power', () => GRIDR_SUBS[0][3]().toFixed(1) + ' MW'], ['Peak today', () => '8.9 MW'], ['Battery', () => '—']],
    say: 'These current sensors measure how much power the airport uses.' }),
  fdev({ id: 'town-sub-ioc', cat: 'controller', brand: 'IRIV', model: 'IRIV IO Controller MQTT', name: 'Town Substation Breaker Monitor', icon: '🔀', zone: 'regionalgrid', x: -20.6, y: 23.4, z: 1.3, qty: 1,
    conn: '4G router · MQTT to IRIV Edge', power: 'DC 10–30 V (surge-protected)', path: ['Breakers & earth fault', 'DI / DO', 'IO Controller', '4G · MQTT', 'IRIV Edge'],
    loc: 'Small-town substation', short: 'Town substation', what: 'Reads the breaker positions and the earth-fault contact and can trip a feeder.', why: 'In the substation panel.',
    m: [['Feeders closed', () => '2 / 2'], ['Load', () => GRIDR_SUBS[1][3]().toFixed(1) + ' MW'], ['Earth fault', () => 'None'], ['MQTT', () => 'Connected']],
    say: 'This I O Controller watches the small town substation breakers and trips a feeder on an earth fault.' }),
  fdev({ id: 'vil-sub-ct', model: 'CT105', name: 'Village Substation Current', icon: '⚡', zone: 'regionalgrid', x: -20.6, y: 43.0, z: 1.2, qty: 1, power: 'Check datasheet (sources differ)',
    loc: 'Village substation', short: 'Village substation', what: 'Measures the village feeder current.', why: 'Clamped on the village feeder.',
    m: [['Current', () => Math.round(GRIDR_SUBS[2][3]() * 1000 / 11) + ' A'], ['Power', () => (GRIDR_SUBS[2][3]() * 1000).toFixed(0) + ' kW'], ['Solar in', () => (night > .5 ? 0 : 220) + ' kW'], ['Battery', () => '—']],
    say: 'This current sensor measures the village power use.' }),
  fdev({ id: 'farm-sub-ct', model: 'CT105', name: 'Farm Pump Substation Current', icon: '⚡', zone: 'regionalgrid', x: -60.6, y: 25.3, z: 1.2, qty: 1, power: 'Check datasheet (sources differ)',
    loc: 'Farm pump substation', short: 'Farm substation', what: 'Measures the current of the farm irrigation pumps.', why: 'Clamped on the pump feeder.',
    m: [['Current', () => Math.round(GRIDR_SUBS[3][3]() * 1000 / 11) + ' A'], ['Pumps', () => FARM.pump ? 'Running' : 'Stopped'], ['Power', () => (GRIDR_SUBS[3][3]() * 1000).toFixed(0) + ' kW'], ['Battery', () => '—']],
    say: 'This current sensor shows when the farm pumps run.' })
);
DEVICES.forEach(d => { if (!DEV[d.id]) DEV[d.id] = d; });

// ---------- drawing: yellow flow along the new lines, load labels at the substations ----------
const _drawUtilityRoutes = drawUtilityRoutes;
drawUtilityRoutes = function () {
  _drawUtilityRoutes();
  const dead = powerCut(), on = night > .5;
  const lines = [...Object.values(GRIDR).filter(Array.isArray).map(r => [r, 3.4]), ...GRIDR_CABLES.map(r => [r, 2.2])];
  ctx.save(); ctx.lineCap = 'round';
  for (const [pts, w] of lines) {
    const pr = pts.map(p => P(...p));
    if (pr.every(p => p.b || p[0] < -200 || p[0] > W + 200 || p[1] < -200 || p[1] > H + 200)) continue;   // off screen: skip the work
    pline(pr, on ? '#233245' : '#f8fafc', w + 2);
    ctx.setLineDash([9, 6]); ctx.lineDashOffset = dead ? 0 : -time * 28; pline(pr, dead ? '#90a4ae' : '#efa912', w); ctx.setLineDash([]);
  }
  ctx.restore();
};
const _drawUtilityLabels = drawUtilityLabels;
drawUtilityLabels = function () {
  _drawUtilityLabels();
  if (scene !== 'city' || WALK.on) return;
  for (const [x, y, name, load, backup] of GRIDR_SUBS) {
    const p = P(x, y, 1.6); if (p.b || p[0] < -80 || p[0] > W + 80 || p[1] < 0 || p[1] > H) continue;
    const mw = load(), txt = powerCut() ? `⚡ ${name} · ${backup}` : `⚡ ${name} ${mw >= 1 ? mw.toFixed(1) + ' MW' : Math.round(mw * 1000) + ' kW'}`;
    pill(p[0], p[1], txt, powerCut() ? '#546e7a' : '#9b6508', '#fff', 11);
  }
};

// weather stations read the weather
for (const id of ['air-wts', 'hw-wts']) if (DEV[id]) DEV[id].m = DEV[id].m.map(([k, f]) => k === 'Rain' ? [k, () => WX.rain().toFixed(1) + ' mm/h'] : k === 'Wind' ? [k, () => Math.round(WX.wind() + wob(0, 4, .3)) + ' km/h'] : [k, f]);
