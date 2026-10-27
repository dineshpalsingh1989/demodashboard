/* Small, dependency-free UI layer for the NeoVille simulation. */
const UI_ICONS = {
  city: '<path d="M3 21V9h6v12M9 21V3h7v18M16 21V12h5v9M1 21h22M5.5 12v1m0 3v1M12 7h1m-1 4h1m-1 4h1m6 1v1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
  scenarios: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 10h18M8 5l3 5m3-5 3 5m-7 3 5 3-5 3v-6Z"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  signal: '<path d="M3 8a15 15 0 0 1 18 0M6 12a10 10 0 0 1 12 0m-9 4a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r="1"/>',
  moon: '<path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  volume: '<path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  volumeOff: '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6"/>',
  rotate: '<path d="M20 7a9 9 0 1 0 1 9M20 2v5h-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  focus: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.5"/>',
  mouse: '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  car: '<path d="m5 8 2-5h10l2 5M3 9h18v9H3V9Zm2 9v3m14-3v3M6 13h2m8 0h2"/>',
  leaf: '<path d="M20 3C10 1 2 7 5 15s16 6 15-12ZM4 21l10-11"/>',
  wind: '<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 17h5a2 2 0 1 1-2 2"/>',
  shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
  water: '<path d="M12 2C10 6 5 10 5 15a7 7 0 0 0 14 0c0-5-5-9-7-13Z"/><path d="M8 15a4 4 0 0 0 4 4"/>'
};
function uiIcon(name) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${UI_ICONS[name] || UI_ICONS.city}</svg>`;
}
function escapeUI(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}

let keyboardNavigation = false, panelOpener = null;
function rememberPanelFocus() {
  if (!panel.classList.contains('open')) panelOpener = document.activeElement;
}
function preparePanelActions() {
  panel.querySelectorAll('[data-dev], [data-circ], .pic').forEach(el => {
    if (el.matches('button') || el.closest('button')) return;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    if (el.matches('.pic')) el.setAttribute('aria-label', 'Enlarge photo of ' + el.dataset.model);
  });
}
function preparePanel() {
  if (W <= 820) document.getElementById('worldMap').open = false;
  preparePanelActions();
  const title = panel.querySelector('h2')?.textContent || 'City details';
  document.getElementById('announcement').textContent = title + ' opened';
  document.querySelectorAll('.ctrls button').forEach(button => button.classList.remove('active'));
  const active = title === 'Smart City IoT Deployment' ? 'bProj' : document.getElementById('etab') ? 'bEnergy' : document.getElementById('scSteps') || /Street view & scenarios/.test(title) ? 'bScen' : null;
  if (active) document.getElementById(active).classList.add('active');
  if (keyboardNavigation) panel.querySelector('h2')?.focus({preventScroll:true});
}
function restorePanelFocus() {
  document.querySelectorAll('.ctrls button').forEach(button => button.classList.remove('active'));
  if (panel.contains(document.activeElement)) {
    const opener = panelOpener?.isConnected && panelOpener !== document.body ? panelOpener : document.getElementById('bSearch');
    opener.focus({preventScroll:true});
  }
  panelOpener = null;
}

function readPreferences() {
  try { return JSON.parse(localStorage.getItem('neoville.preferences.v1')) || {}; }
  catch { return {}; }
}
function syncPreferences() {
  bDev.setAttribute('aria-pressed', String(showDev));
  bNight.setAttribute('aria-pressed', String(!!nightTarget));
  bNight.innerHTML = uiIcon(nightTarget ? 'sun' : 'moon');
  bRot.setAttribute('aria-pressed', String(autoRot));
  bVoice.setAttribute('aria-pressed', String(voiceOn));
  bVoice.innerHTML = uiIcon(voiceOn ? 'volume' : 'volumeOff');
  document.querySelector('meta[name="theme-color"]').content = nightTarget ? '#111c2e' : '#f4f7fb';
  // Voice always starts muted; camera, marker, and theme preferences are remembered.
  try { localStorage.setItem('neoville.preferences.v1', JSON.stringify({night:!!nightTarget, rotate:autoRot, devices:showDev})); }
  catch { /* Private browsing and file previews may disable storage. */ }
}
function renderTourButton() {
  bTour.classList.toggle('stop', !!tourList);
  bTour.setAttribute('aria-pressed', String(!!tourList));
  bTour.innerHTML = uiIcon(tourList ? 'stop' : 'play') + `<span>${tourList ? 'Stop tour' : 'Guided tour'}</span>`;
}
const MAP_ZOOM = { min: .35, max: 5 };
const MAP_VIEW = { fitted: false, offsetX: 0, offsetY: 0, lastUpdate: 0 };
const clampZoom = value => Math.max(MAP_ZOOM.min, Math.min(MAP_ZOOM.max, value));
const mapBaseScale = () => Math.min(W * (W > 820 ? .84 : .95) / (WORLD * 1.43), H * (W > 820 ? .66 : .8) / (WORLD * .707 + 8));
function updateCameraControls() {
  document.getElementById('zoomLevel').textContent = Math.round(cam.tz * 100) + '%';
  document.getElementById('bZoomIn').disabled = cam.tz >= MAP_ZOOM.max;
  document.getElementById('bZoomOut').disabled = cam.tz <= MAP_ZOOM.min;
}
function zoomMap(factor) {
  zoomAt(W / 2 + cam.offX, H / 2 + cam.offY, factor);
}
function resetCityView() {
  cancelMapFit();
  if (WALK.on) exitWalk();
  closePanel();
  if (scene === 'inside') leaveNow();
  cam.tx = CX; cam.ty = CX; cam.tz = 1; cam.th = Math.PI / 4;
  rotPauseUntil = performance.now() + 4000;
  updateCameraControls();
  document.getElementById('announcement').textContent = 'City view reset';
}

function cancelMapFit() {
  if (MAP_VIEW.fitted) rotHold = false;
  MAP_VIEW.fitted = false;
  document.body.classList.remove('map-overview');
}
function mapViewport() {
  const top = document.querySelector('.top').getBoundingClientRect().bottom + 18;
  let bottom = W > 820 ? document.querySelector('.telemetry').getBoundingClientRect().top - 18 : H - 124;
  let right = W > 820 ? W - 88 : W - 16;
  if (panel.classList.contains('open')) {
    const r = panel.getBoundingClientRect();
    if (W > 820) right = r.left - 76; else bottom = Math.min(bottom, r.top - 12);
  }
  return { left: W > 820 ? 24 : 16, right, top, bottom: Math.max(top + 80, bottom) };
}
function fitEntireMap() {
  if (WALK.on) exitWalk();
  closePanel(); if (scene === 'inside') leaveNow();
  document.getElementById('worldMap').open = false;
  MAP_VIEW.fitted = true; rotHold = true;
  document.body.classList.add('map-overview');
  cam.th = Math.PI / 4;
  cam.tx = (LAND_X0 + LAND_X) / 2; cam.ty = LAND_Y / 2;
  const c = Math.cos(cam.th), s = Math.sin(cam.th), points = [];
  // Include slab edges and tall buildings, not just the centers of districts.
  for (const x of [LAND_X0 - 1.5, LAND_X + 1.5]) for (const y of [-1.5, LAND_Y + 1.5]) for (const z of [-.7, 11]) {
    points.push([(x - cam.tx) * c - (y - cam.ty) * s, ((x - cam.tx) * s + (y - cam.ty) * c) * TILT - z * ZK]);
  }
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const r = mapViewport(), base = mapBaseScale();
  // An automatic fit may go below manual zoom's minimum on short screens.
  cam.tz = Math.min(MAP_ZOOM.max, Math.min((r.right - r.left) / (x1 - x0), (r.bottom - r.top) / (y1 - y0)) * .92 / base);
  MAP_VIEW.offsetX = (r.left + r.right) / 2 - W / 2 - (x0 + x1) / 2 * base * cam.tz;
  MAP_VIEW.offsetY = (r.top + r.bottom) / 2 - H / 2 - (y0 + y1) / 2 * base * cam.tz;
  updateCameraControls();
  document.getElementById('announcement').textContent = 'Entire map: city, highway, small town, farms and remote power and water plants';
}
function jumpToMapPoint(x, y, label = 'Map location', zoom = 1.3) {
  resetCityView();
  cam.tx = Math.max(LAND_X0, Math.min(LAND_X, x));
  cam.ty = Math.max(0, Math.min(LAND_Y, y)); cam.tz = clampZoom(zoom);
  rotHold = true;
  if (W <= 820) document.getElementById('worldMap').open = false;
  updateCameraControls();
  document.getElementById('announcement').textContent = label + ' view';
}
function initWorldMap() {
  const map = document.getElementById('worldMap'), svg = document.getElementById('minimapSvg');
  const rect = (b, fill, extra = '') => `<rect x="${b.x0}" y="${b.y0}" width="${b.x1 - b.x0}" height="${b.y1 - b.y0}" fill="${fill}" ${extra}/>`;
  svg.setAttribute('viewBox', `${LAND_X0 - 3} -3 ${LAND_X - LAND_X0 + 6} ${LAND_Y + 6}`);
  svg.innerHTML = '<title>Whole map. Use the region buttons below or click a location to jump there.</title>' +
    rect({ x0: 0, y0: 0, x1: WORLD, y1: WORLD }, '#a5b5c4') + rect(SAT, '#a5b5c4') + rect(HWY, '#a5b5c4') + rect(FARMROAD, '#a5b5c4') +
    BELTS.map(b => rect(b, '#b4cc8e')).join('') + rect(RIVER, '#70b8dc') + rect(UTILITY_LAND, '#c3d8ac') +
    blocks.map(b => rect(b, TOPICS[b.zone]?.color || '#94a3b8', 'opacity=".72" stroke="var(--panel)" stroke-width=".35"')).join('') +
    utilityMinimapMarkup() +
    '<polygon id="minimapViewport" fill="var(--accent)" fill-opacity=".1" stroke="var(--accent)" stroke-width=".8" stroke-dasharray="2 1" pointer-events="none"/>' +
    '<circle id="minimapPosition" r="1.8" fill="var(--accent)" stroke="var(--panel)" stroke-width=".8" pointer-events="none"/>';
  svg.addEventListener('click', e => {
    const matrix = svg.getScreenCTM(); if (!matrix) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    jumpToMapPoint(p.x, p.y);
  });
  const regions = {
    city: [CX, CX, 'City', 1], highway: [(HWY.x0 + HWY.x1) / 2, (HWY.y0 + HWY.y1) / 2, 'Highway', 1.9],
    town: [(SAT.x0 + SAT.x1) / 2, (SAT.y0 + SAT.y1) / 2, 'Small town', 1.5], farms: [ZINFO.farmbelt.x, 30.5, 'Farms', 1.5]
  };
  map.querySelectorAll('[data-region]').forEach(button => { button.onclick = () => jumpToMapPoint(...regions[button.dataset.region]); });
  document.getElementById('bFitMap').onclick = fitEntireMap;
  map.open = W > 820 && H >= 820;
  const sync = () => { document.body.classList.toggle('minimap-open', map.open); MAP_VIEW.lastUpdate = 0; updateWorldMap(performance.now()); };
  map.addEventListener('toggle', sync); sync();
  addEventListener('resize', () => {
    if (W <= 820) map.open = false;
    if (MAP_VIEW.fitted) fitEntireMap();
    MAP_VIEW.lastUpdate = 0;
  });
}
function updateWorldMap(now) {
  const map = document.getElementById('worldMap');
  if (!map?.open || WALK.on || now - MAP_VIEW.lastUpdate < 100) return;
  MAP_VIEW.lastUpdate = now;
  const p = scene === 'inside' ? ZINFO[curZone] : cam;
  const dot = document.getElementById('minimapPosition'), viewport = document.getElementById('minimapViewport');
  if (!dot || !p) return;
  dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
  const area = p.y > WORLD ? 'Remote utilities' : p.x > WORLD ? 'Power corridor' : p.x >= 0 ? 'City' : p.x < SAT.x0 ? 'Farms' : p.x < HWY.x0 ? 'Small town' : 'Highway';
  document.getElementById('mapLocation').textContent = scene === 'inside' ? area + ' · indoors' : area;
  viewport.style.display = scene === 'inside' ? 'none' : '';
  if (scene === 'inside' || !sc) return;
  const r = mapViewport(), c = Math.cos(cam.th), s = Math.sin(cam.th);
  const points = [[r.left, r.top], [r.right, r.top], [r.right, r.bottom], [r.left, r.bottom]].map(([x, y]) => {
    const a = (x - W / 2 - cam.offX) / sc, b = (y - H / 2 - cam.offY) / (sc * TILT);
    return `${cam.x + a * c + b * s},${cam.y - a * s + b * c}`;
  });
  viewport.setAttribute('points', points.join(' '));
}

function initDirectory() {
  const dialog = document.getElementById('searchDialog');
  const input = document.getElementById('citySearch');
  const results = document.getElementById('searchResults');
  const count = document.getElementById('searchCount');
  let filter = 'all', matches = [], opener = null;
  const entries = [
    ...ORDER.filter(id => id !== 'intro').map(id => ({id, type:'district', title:TOPICS[id].title, detail:TOPICS[id].kicker, icon:TOPICS[id].icon, keywords:TOPICS[id].sum, open:() => show(id)})),
    ...DEVICES.map(d => ({id:d.id, type:'device', title:d.model + ' · ' + d.name, detail:d.loc || d.short || d.brand, icon:d.icon, keywords:[d.brand, d.conn, d.cat, d.zone, d.what].join(' '), open:() => showDevice(d.id)})),
    ...Object.entries(SCENARIOS).map(([id, s]) => ({id, type:'scenario', title:s.title, detail:s.sub, icon:s.icon, keywords:s.sub, open:() => runScenario(id)}))
  ];
  const normalize = value => value.toLowerCase().replace(/[–—-]/g, ' ').replace(/\s+/g, ' ');
  function render() {
    const query = normalize(input.value.trim());
    const terms = query.split(' ').filter(Boolean);
    matches = entries.filter(item => (filter === 'all' || item.type === filter) && terms.every(term => normalize([item.title, item.detail, item.keywords, item.id].join(' ')).includes(term)));
    if (query) matches.sort((a, b) => Number(normalize(b.title).includes(query)) - Number(normalize(a.title).includes(query)));
    count.textContent = query ? `${matches.length} result${matches.length === 1 ? '' : 's'} for “${input.value.trim()}”` : `${matches.length} places, devices, and experiences to explore`;
    results.innerHTML = matches.length ? matches.map((item, i) => `<button class="search-result" data-result="${i}"><span class="result-icon" aria-hidden="true">${escapeUI(item.icon)}</span><span class="result-copy"><b>${escapeUI(item.title)}</b><small>${item.type[0].toUpperCase() + item.type.slice(1)} · ${escapeUI(item.detail)}</small></span>${uiIcon('arrow')}</button>`).join('') : '<div class="empty-search"><b>No matches yet</b><p>Try a place like “farm”, a device like “CT101”,<br>or a scenario like “flood”.</p></div>';
    results.scrollTop = 0;
  }
  function openDirectory() {
    if (dialog.open) return;
    clearWalkInput();
    opener = document.activeElement;
    render(); dialog.showModal(); input.focus(); input.select();
  }
  document.getElementById('bSearch').onclick = openDirectory;
  document.getElementById('bExplore').onclick = openDirectory;
  document.getElementById('searchClose').onclick = () => dialog.close();
  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => { if (opener?.isConnected) opener.focus({preventScroll:true}); });
  input.addEventListener('input', render);
  dialog.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => {
    filter = button.dataset.filter;
    dialog.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    render();
  });
  function select(index) {
    const item = matches[index]; if (!item) return;
    dialog.close();
    // Native dialog close restores its trigger before we move into the details.
    requestAnimationFrame(() => { item.open(); });
  }
  results.onclick = e => { const button = e.target.closest('[data-result]'); if (button) select(Number(button.dataset.result)); };
  dialog.addEventListener('keydown', e => {
    const buttons = [...results.querySelectorAll('button')];
    const current = buttons.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? Math.min(current + 1, buttons.length - 1) : current < 0 ? buttons.length - 1 : current - 1;
      if (next < 0) input.focus(); else buttons[next]?.focus();
    } else if (e.key === 'Enter' && e.target === input) { e.preventDefault(); select(0); }
  });
  document.addEventListener('keydown', e => {
    if ((e.key === '/' || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) && !e.target.closest('input, textarea, select, [contenteditable="true"]') && lb.hidden) {
      e.preventDefault(); openDirectory();
    }
  });
}

function initUI() {
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = uiIcon(el.dataset.icon); });
  document.getElementById('districtCount').textContent = blocks.length;
  document.getElementById('deviceCount').textContent = fint(TOTAL_DEVICES);
  const preferences = readPreferences();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  autoRot = !motion.matches && preferences.rotate !== false;
  nightTarget = preferences.night === true ? 1 : 0;
  night = nightTarget;
  document.body.classList.toggle('night', !!nightTarget);
  setDevLayer(typeof preferences.devices === 'boolean' ? preferences.devices : W > 820);
  bVoice.disabled = !('speechSynthesis' in window);
  if (bVoice.disabled) bVoice.title = 'Voice narration is unavailable in this browser';
  motion.addEventListener('change', e => { if (e.matches) { autoRot = false; syncPreferences(); } });
  document.getElementById('bZoomIn').onclick = () => zoomMap(1.2);
  document.getElementById('bZoomOut').onclick = () => zoomMap(1 / 1.2);
  document.getElementById('bReset').onclick = resetCityView;
  cv.addEventListener('wheel', updateCameraControls, {passive:true});
  document.addEventListener('pointerdown', () => { keyboardNavigation = false; }, true);
  document.addEventListener('keydown', e => {
    keyboardNavigation = true;
    if (e.key === 'Escape') {
      if (document.getElementById('searchDialog').open) return;
      if (!lb.hidden) { e.preventDefault(); closeLightbox(); return; }
      if (panel.classList.contains('open')) { e.preventDefault(); closePanel(); }
    }
  }, true);
  cv.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomMap(1.2); }
    if (e.key === '-') { e.preventDefault(); zoomMap(1 / 1.2); }
    if (e.key === '0') { e.preventDefault(); resetCityView(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      cancelMapFit();
      e.preventDefault(); cam.th += e.key === 'ArrowLeft' ? -.12 : .12;
      if (scene === 'inside') cam.th = Math.max(.3, Math.min(1.27, cam.th));
      rotPauseUntil = performance.now() + 4000;
    }
  });
  panel.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) { e.preventDefault(); e.target.click(); }
  });
  // Keep tooltips on screen even near the top and edges of the canvas.
  cv.addEventListener('pointermove', e => {
    if (tip.style.opacity !== '1') return;
    const half = tip.offsetWidth / 2 + 8;
    tip.style.left = Math.max(half, Math.min(W - half, e.clientX)) + 'px';
    tip.style.top = Math.max(tip.offsetHeight * 1.4 + 8, e.clientY) + 'px';
  });
  initDirectory();
  initWorldMap();
  updateCameraControls();
}
