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
  bFlow.setAttribute('aria-pressed', String(showFlow));
  bNight.setAttribute('aria-pressed', String(!!nightTarget));
  bNight.innerHTML = uiIcon(nightTarget ? 'sun' : 'moon');
  bRot.setAttribute('aria-pressed', String(autoRot));
  bVoice.setAttribute('aria-pressed', String(voiceOn));
  bVoice.innerHTML = uiIcon(voiceOn ? 'volume' : 'volumeOff');
  document.querySelector('meta[name="theme-color"]').content = nightTarget ? '#111c2e' : '#f4f7fb';
  // Voice always starts muted; camera, marker, and theme preferences are remembered.
  try { localStorage.setItem('neoville.preferences.v1', JSON.stringify({night:!!nightTarget, rotate:autoRot, devices:showDev, traffic:showFlow})); }
  catch { /* Private browsing and file previews may disable storage. */ }
}
function renderTourButton() {
  bTour.classList.toggle('stop', !!tourList);
  bTour.setAttribute('aria-pressed', String(!!tourList));
  bTour.innerHTML = uiIcon(tourList ? 'stop' : 'play') + `<span>${tourList ? 'Stop tour' : 'Guided tour'}</span>`;
}
const MAP_ZOOM = { min: .35, max: 5 };
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
  if (WALK.on) exitWalk();
  closePanel();
  if (scene === 'inside') leaveNow();
  cam.tx = CX; cam.ty = CX; cam.tz = 1; cam.th = Math.PI / 4;
  rotPauseUntil = performance.now() + 4000;
  updateCameraControls();
  document.getElementById('announcement').textContent = 'City view reset';
}

// newest places first in the directory, so they are easy to find
const FEATURED = ['warehouse'];
function initDirectory() {
  const dialog = document.getElementById('searchDialog');
  const input = document.getElementById('citySearch');
  const results = document.getElementById('searchResults');
  const count = document.getElementById('searchCount');
  let filter = 'all', matches = [], opener = null;
  const entries = [
    ...[...FEATURED.filter(id => ORDER.includes(id)), ...ORDER.filter(id => id !== 'intro' && !FEATURED.includes(id))].map(id => ({id, type:'district', title:TOPICS[id].title, detail:(FEATURED.includes(id) ? 'New · ' : '') + TOPICS[id].kicker, icon:TOPICS[id].icon, keywords:TOPICS[id].sum + ' ' + (TOPICS[id].keywords || ''), open:() => show(id)})),
    ...DEVICES.map(d => ({id:d.id, type:'device', iriv:/^IRIV/.test(d.model), title:d.model + ' · ' + d.name, detail:d.loc || d.short || d.brand, icon:d.icon, keywords:[d.brand, d.conn, d.cat, d.zone, d.what].join(' '), open:() => showDevice(d.id)})),
    ...Object.entries(SCENARIOS).map(([id, s]) => ({id, type:'scenario', title:s.title, detail:s.sub, icon:s.icon, keywords:s.sub, open:() => runScenario(id)}))
  ];
  const normalize = value => value.toLowerCase().replace(/[–—-]/g, ' ').replace(/\s+/g, ' ');
  // typos are forgiven: "werehouse" finds the warehouse, "logitical" finds logistics (one wrong letter per 4, at most 2)
  const textOf = item => item._t || (item._t = normalize([item.title, item.detail, item.keywords, item.id].join(' ')));
  const wordsOf = item => item._w || (item._w = [...new Set(textOf(item).split(/[^a-z0-9]+/).filter(w => w.length > 2))]);
  function near(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return false;
    let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let best = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1);   // two letters swapped counts as one mistake
        best = Math.min(best, cur[j]);
      }
      if (best > max) return false; prev2 = prev; prev = cur;
    }
    return prev[b.length] <= max;
  }
  function termMatch(term, item) {
    if (textOf(item).includes(term)) return true;
    if (term.length < 4) return false;
    const max = Math.min(2, Math.floor(term.length / 4));
    return wordsOf(item).some(w => near(term, w, max) || (w.length > term.length && near(term, w.slice(0, term.length), max)));
  }
  function render() {
    const query = normalize(input.value.trim());
    const terms = query.split(' ').filter(Boolean);
    matches = entries.filter(item => (filter === 'all' || (filter === 'iriv' ? item.iriv : item.type === filter)) && terms.every(term => termMatch(term, item)));
    if (query) {   // closest title first: the whole query in the title, then every word close to a title word; shorter titles win ties
      const score = item => { const t = normalize(item.title), words = t.split(/[^a-z0-9]+/); return (t.includes(query) ? 2 : 0) + (terms.every(term => words.some(w => w.startsWith(term) || (term.length > 3 && near(term, w, Math.min(2, Math.floor(term.length / 4)))))) ? 1 : 0); };
      const sc = new Map(matches.map(m => [m, score(m)]));
      matches.sort((a, b) => sc.get(b) - sc.get(a) || (sc.get(a) ? a.title.length - b.title.length : 0));
    }
    count.textContent = query ? `${matches.length} result${matches.length === 1 ? '' : 's'} for “${input.value.trim()}”` : `${matches.length} places, devices, and experiences to explore`;
    results.innerHTML = matches.length ? matches.map((item, i) => `<button class="search-result" data-result="${i}"><span class="result-icon" aria-hidden="true">${escapeUI(item.icon)}</span><span class="result-copy"><b>${escapeUI(item.title)}</b><small>${item.type[0].toUpperCase() + item.type.slice(1)} · ${escapeUI(item.detail)}</small></span>${uiIcon('arrow')}</button>`).join('') : '<div class="empty-search"><b>No matches yet</b><p>Try a place like “farm”, a device like “CT101”,<br>or a scenario like “flood”.</p></div>';
    results.scrollTop = 0;
  }
  function setFilter(value) {
    filter = value;
    dialog.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
  }
  function openDirectory(preset) {
    if (dialog.open) return;
    if (typeof preset === 'string') setFilter(preset);
    clearWalkInput();
    opener = document.activeElement;
    render(); dialog.showModal(); input.focus(); input.select();
  }
  document.getElementById('bSearch').onclick = () => openDirectory();
  document.getElementById('bExplore').onclick = () => openDirectory();
  document.getElementById('bIriv').onclick = () => openDirectory('iriv');
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
    setFilter(button.dataset.filter);
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

// the IRIV tour films, from the toolbar
function showFilms() {
  const film = (href, poster, title, line) => '<a class="ins-film" href="' + href + '" target="_blank" rel="noopener noreferrer">' + (poster ? '<img src="' + poster + '" alt="" loading="lazy">' : '') + '<span><b>' + title + '</b><small>' + line + ' ↗</small></span></a>';
  openPanel('#0277bd', headHTML('🎬', 'IRIV', 'IRIV films and tours') +
    '<p class="p-sum">Short narrated films with captions and a transcript. Each product page also lets you explore every port and the compatible Cytron parts.</p>' +
    '<h3>Watch</h3>' +
    film('short-video-of-iriv-edgeai/', 'short-video-of-iriv-edgeai/images/tour-poster.jpg', 'IRIV EdgeAI CM5 · 2 min 9 s', 'Cameras first, a live AI demo, every port, compatible parts') +
    film('short-video-of-iriv-pi/', 'short-video-of-iriv-pi/images/tour-poster.jpg', 'IRIV PiControl · 1 min 45 s', 'Pin map, 49 compatible parts, a system builder') +
    film('short-video-of-iriv-smarthub/', 'short-video-of-iriv-smarthub/images/tour-poster.jpg', 'IRIV SmartHub CM5 · 2 min 14 s', 'A scroll-through look around, three live demos, every port, 19 parts') +
    film('short-video-of-iriv-ioc/', 'short-video-of-iriv-ioc/images/tour-poster.jpg', 'IRIV IO Controller MQTT · 2 min 17 s', 'Flip an input and watch the MQTT message, all 32 terminals, browser setup') +
    film('short-video-of-iriv-ioc-vibration/', 'short-video-of-iriv-ioc-vibration/images/tour-poster.jpg', '883M vibration monitor · 2 min 17 s', 'Wilcoxon sensor, IRIV IOC wiring, MQTT analytics and a local alarm') +
    film('short-video-of-iriv-hub/', 'short-video-of-iriv-hub/images/tour-poster.jpg', 'IRIV Edge dashboard · 1 min 10 s', 'The map, wiring, live rules, MQTT, offline mode, control centre') +
    film('iriv-controllers/', 'iriv-controllers/images/poster-edgeai.jpg', 'Compare all IRIV controllers', 'Which one do I need, and how they work together') +
    film('warehouse-3d/', 'warehouse-3d/poster.jpg', 'Warehouse Command 3D', 'Forklifts, trucks and EdgeAI safety cameras in a 3D game view') +
    '<h3>Download</h3><a class="ins-prod" href="short-video-of-iriv-edgeai/IRIV-EdgeAI-CM5-tour.mp4" download>⬇ EdgeAI CM5 tour (MP4)</a><a class="ins-prod" style="margin-top:8px" href="short-video-of-iriv-pi/IRIV-PiControl-tour.mp4" download>⬇ PiControl tour (MP4)</a><a class="ins-prod" style="margin-top:8px" href="short-video-of-iriv-smarthub/IRIV-SmartHub-CM5-tour.mp4" download>⬇ SmartHub CM5 tour (MP4)</a><a class="ins-prod" style="margin-top:8px" href="short-video-of-iriv-ioc/IRIV-IO-Controller-MQTT-tour.mp4" download>⬇ IO Controller MQTT tour (MP4)</a><a class="ins-prod" style="margin-top:8px" href="short-video-of-iriv-ioc-vibration/IRIV-IOC-883M-vibration-tour.mp4" download>⬇ 883M vibration monitor (MP4)</a><a class="ins-prod" style="margin-top:8px" href="short-video-of-iriv-hub/IRIV-Edge-dashboard-tour.mp4" download>⬇ IRIV Edge dashboard (MP4)</a>' +
    '<h3>See them in the city</h3><button class="tourbtn" id="filmsUnits">Find every IRIV unit on the map →</button>', []);
}
function initUI() {
  document.getElementById('bFilms').onclick = () => showFilms();
  document.getElementById('panel').addEventListener('click', e => { if (e.target.closest('#filmsUnits')) document.getElementById('bIriv').click(); });
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = uiIcon(el.dataset.icon); });
  document.getElementById('districtCount').textContent = blocks.length;
  document.getElementById('deviceCount').textContent = fint(TOTAL_DEVICES);
  const preferences = readPreferences();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  autoRot = !motion.matches && preferences.rotate !== false;
  nightTarget = preferences.night === true ? 1 : 0;
  night = nightTarget;
  document.body.classList.toggle('night', !!nightTarget);
  showFlow = preferences.traffic === true;
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
  updateCameraControls();
}
