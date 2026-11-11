/* Remote utility facilities and a shared, simulated city supply model. */
const WATER_OFFSET = 34;
const WATER_ZONES = ['reservoir', 'wtp', 'clearwater', 'wwtp'];
const UTILITY_LAND = { x0: 0, y0: WORLD, x1: LAND_X, y1: LAND_Y };
const POWER_SITE = { x0: 42, y0: 64, x1: 53.5, y1: 75 };
const POWER_RATING_MW = 50, WATER_RATING_M3H = 1000;
const waterQ = (x, y, z) => P(M(x), M(y) + WATER_OFFSET, z);

// Keep buildings, devices, district navigation and scenario cameras together.
function moveWaterObject(o) {
  for (const key of ['cy', 'y0', 'y1', 'y']) if (typeof o[key] === 'number') o[key] += WATER_OFFSET;
  if (o.to) o.to[1] += WATER_OFFSET;
  if (o.kids) o.kids.forEach(moveWaterObject);
}
objs.filter(o => WATER_ZONES.includes(o.zone)).forEach(moveWaterObject);
for (const block of blocks.filter(b => WATER_ZONES.includes(b.zone))) {
  // Reclaim the former sites as planted city green space.
  blocks.push({ ...block, zone: 'green', kind: 'grass' });
  for (let x = block.x0 + 1; x < block.x1; x += 1.5) for (let y = block.y0 + 1; y < block.y1; y += 1.6) tree('green', x, y, .7);
  block.y0 += WATER_OFFSET; block.y1 += WATER_OFFSET;
}
for (const zone of WATER_ZONES) ZINFO[zone].y += WATER_OFFSET;
for (const item of [...DEVICES, ...links]) if (WATER_ZONES.includes(item.zone) && typeof item.y === 'number') item.y += WATER_OFFSET;
for (const step of SCENARIOS.water.steps) if (step.cam) step.cam[1] += WATER_OFFSET;
// The city supply main is drawn separately, with its actual city endpoint.
WIRES.clearwater = WIRES.clearwater.filter(w => !w[1].startsWith('To the city'));

function utilityReadings() {
  const outputMW = POWER_RATING_MW * GRID.load / 100;
  const lossMW = outputMW * .03;
  const waterToCity = wob(760, 30, .2);
  return { outputMW, lossMW, deliveredMW: outputMW - lossMW,
    reserveMW: POWER_RATING_MW - outputMW, waterToCity,
    treatedWater: waterToCity + 30, pressure: wob(3.4, .1, .3) };
}
const powerMetrics = [
  ['Station rating', () => POWER_RATING_MW + ' MW'],
  ['Generated power', () => utilityReadings().outputMW.toFixed(2) + ' MW'],
  ['Delivered to city', () => utilityReadings().deliveredMW.toFixed(2) + ' MW'],
  ['Station loading', () => GRID.load.toFixed(1) + '%'],
  ['Available capacity', () => utilityReadings().reserveMW.toFixed(2) + ' MW'],
  ['Transmission voltage', () => '132 kV'],
  ['Line losses (demo)', () => utilityReadings().lossMW.toFixed(2) + ' MW'],
  ['Grid frequency', () => wob(50, .02, .2).toFixed(2) + ' Hz']
];
const waterSupplyMetrics = [
  ['Treatment capacity', () => fint(WATER_RATING_M3H) + ' m³/h'],
  ['Treated output', () => fint(utilityReadings().treatedWater) + ' m³/h'],
  ['Delivered to city', () => fint(utilityReadings().waterToCity) + ' m³/h'],
  ['Network pressure', () => utilityReadings().pressure.toFixed(1) + ' bar']
];
TOPICS.powerstation = {
  icon: '⚡', color: '#d98a08', kicker: 'Remote power supply', title: 'City Power Station',
  sum: 'A 50 MW power station stands outside the city, beyond a green buffer. Two generator halls feed a 132 kV transmission line to the city substation, where transformers supply the local network. All ratings and readings are simulated.',
  how: ['Two 25 MW generator units provide the station’s 50 MW rating.',
    'The yellow animated line follows the pylons from the station to the city substation.',
    'Generated power minus simulated line losses equals power delivered to the city.',
    'The power-grid scenario changes station loading and available capacity.'],
  ben: ['Generation away from homes', 'Visible city supply', 'Capacity monitoring'],
  m: powerMetrics,
  chain: [['⚙️', 'Generator halls', '2 × 25 MW rated capacity'], ['🗼', 'Transmission line', '132 kV · yellow flow toward city'], ['⚡', 'City substation', 'Voltage stepped down for distribution'], ['🏙️', 'City network', 'Homes, businesses and public services']],
  extra: () => '<button class="tourbtn" data-utility="overview">View city supply overview →</button><button class="tourbtn alt" data-utility="substation">Follow power to the substation →</button>'
};
ORDER.splice(ORDER.indexOf('substation'), 0, 'powerstation');
ZINFO.powerstation = { x: 47.75, y: 69.5, z: 5.8 };
blocks.push({ ...POWER_SITE, zone: 'powerstation', kind: 'yard' });

// Generator halls, cooling equipment, exhaust stacks and switchyard.
for (let i = 0; i < 2; i++) {
  const y = 66 + i * 3.5;
  box('powerstation', 43, y, 48.7, y + 2.6, 2.3, '#dfe5ea', { win: 'bands', roof: '#90a4ae', stripe: '#f9a825', kids: [
    kid(43.7, y + .5, 45.2, y + 2.1, 2.3, .5, '#607d8b'), kid(46.4, y + .5, 47.9, y + 2.1, 2.3, .5, '#607d8b') ] });
  add('silo', 'powerstation', 49.5, y + 1.3, { h: 4.5, r: .28 });
  add('tank', 'powerstation', 51.5, y + 1.3, { h: 1.6, r: .8 });
}
box('powerstation', 43, 73, 46.5, 74.5, 1.4, '#eceff1', { win: 'grid', roof: '#546e7a' });
box('powerstation', 47.5, 64.6, 50.6, 65.5, 1.0, '#78909c', { deco: ['cabinet'] });

const POWER_ROUTE = [[49, 65, 4.3], [55.5, 65, 4.3], [55.5, 56, 4.3], [55.5, 42, 4.3], [55.5, 28, 4.3], [55.5, 14, 4.3], [55.5, 7.5, 4.3], [38.5, 7.5, 4.3], [38.5, 4, 4.3], [36.6, 4, 2.6]];
const WATER_ROUTE = [[18.6, 70.3, .18], [22.5, 70.3, .18], [22.5, 46.5, .18], [18.5, 46.5, .18]];
const SEWER_ROUTE = [[30.5, 46.5, .14], [30.5, 64.7, .14], [32, 64.7, .14], [32, 66.7, .14]];
for (let i = 0; i < POWER_ROUTE.length - 1; i++) {
  const p = POWER_ROUTE[i];
  add('pylon', 'powerstation', p[0], p[1], { to: POWER_ROUTE[i + 1].slice(0, 2), toZ: POWER_ROUTE[i + 1][2] });
}
for (let x = 2; x < 53; x += 2.7) for (const y of [57, 60.5]) {
  if (Math.abs(x - 22.5) > 2 && Math.abs(x - 30.5) > 2 && Math.abs(x - 38.5) > 2) tree(null, x, y, .65 + hsh(x + y) * .35);
}

TOPICS.wtp.sum = 'Outside the city, beyond a planted buffer, this 1,000 m³/h treatment plant cleans reservoir water in clarifiers and sand filters, then disinfects it. Clear-water tanks and high-lift pumps send the treated water along the blue main into the city. Readings are simulated.';
TOPICS.wtp.m = [...waterSupplyMetrics, ...TOPICS.wtp.m.filter(m => m[0] !== 'Output')];
TOPICS.wtp.say = TOPICS.wtp.sum;
TOPICS.wtp.extra = () => '<button class="tourbtn" data-utility="overview">View city supply overview →</button><button class="tourbtn alt" data-utility="clearwater">Follow water to the supply pumps →</button>';
TOPICS.clearwater.m = TOPICS.clearwater.m.map(m => m[0] === 'To the city' ? ['To the city', waterSupplyMetrics[2][1]] : m);
TOPICS.substation.sum = 'The city substation receives electricity from the remote 50 MW power station across the yellow transmission line. Transformers step the voltage down for city distribution. IRIV controllers monitor power meters, transformers and breaker positions.';
TOPICS.substation.m = [...TOPICS.substation.m, ['Station rating', powerMetrics[0][1]], ['Power from station', powerMetrics[2][1]]];

function drawUtilityGround() {
  drawBox({ ...UTILITY_LAND, z0: -.7, h: .7, color: '#c4cdbd', roof: '#93ba73' });
  drawBox({ x0: WORLD, y0: 0, x1: LAND_X, y1: WORLD, z0: -.7, h: .7, color: '#c4cdbd', roof: '#93ba73' });
  // Service road crosses the green buffer; the utilities remain outside the urban grid.
  poly(quad(37.7, WORLD, 39.3, 76, .004), col('#7f8891'));
  poly(quad(.3, 72.2, 53.5, 73, .004), col('#7f8891'));
}
function drawUtilityRoutes() {
  for (const [points, color, speed] of [[POWER_ROUTE, '#efa912', 28], [WATER_ROUTE, '#00a7db', 22], [SEWER_ROUTE, '#8d6e63', 15]]) {
    const projected = points.map(p => P(...p));
    ctx.save(); ctx.lineCap = 'round';
    pline(projected, night > .5 ? '#233245' : '#f8fafc', 5);
    ctx.setLineDash([9, 6]); ctx.lineDashOffset = -time * speed;
    pline(projected, color, 3); ctx.restore();
  }
}
function drawUtilityLabels() {
  const r = utilityReadings();
  for (const [x, y, z, label, color] of [
    [47.75, 69.5, 6.5, `⚡ ${r.outputMW.toFixed(1)} / ${POWER_RATING_MW} MW`, '#9b6508'],
    [11, 68.5, 4.2, `💧 ${fint(r.waterToCity)} m³/h → city`, '#0277bd'],
    [27, 58.7, .2, 'GREEN BUFFER · UTILITIES OUTSIDE CITY', '#47713a']]) {
    const p = P(x, y, z);
    if (!p.b && p[0] > -120 && p[0] < W + 120 && p[1] > 0 && p[1] < H) pill(p[0], p[1], label, color, '#fff', 11);
  }
}
function showUtilities() {
  resetCityView(); sel = null; selDev = null; nav = null; rotHold = true;
  cam.tx = 27; cam.ty = 52.5; cam.tz = .9;
  const metrics = [...powerMetrics.slice(0, 4), ...waterSupplyMetrics];
  openPanel('#0288d1', headHTML('🏙️', 'Simulated city supply', 'Power & water to the city') +
    '<p class="p-sum">Both plants stand outside the city beyond a green buffer. Follow the yellow power line and blue water main to see how they supply the city.</p>' +
    '<h3>Live supply · simulated</h3>' + metricsHTML(metrics) +
    '<h3>Power supply</h3><div class="p-flow utility-flow power"><span>50 MW station</span><i>→</i><span>132 kV line</span><i>→</i><span>City substation</span><i>→</i><span>City</span></div>' +
    '<button class="tourbtn" data-utility="powerstation">Visit remote power station →</button>' +
    '<h3>Water supply</h3><div class="p-flow utility-flow water"><span>Reservoir</span><i>→</i><span>Treatment</span><i>→</i><span>Tanks & pumps</span><i>→</i><span>City</span></div>' +
    '<button class="tourbtn" data-utility="wtp">Visit remote water treatment →</button>' +
    '<p class="p-sum utility-note">Brown flow shows wastewater returning to its separate treatment plant. Ratings, flows and distances are illustrative demo values.</p>', metrics);
}
panel.addEventListener('click', event => {
  const target = event.target.closest('[data-utility]')?.dataset.utility;
  if (target === 'overview') showUtilities();
  else if (target && TOPICS[target]) show(target);
});
