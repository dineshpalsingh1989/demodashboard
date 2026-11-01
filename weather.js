/* Weather: auto-cycles clear → rain → storm (or set it with the toolbar button).
   Rain streaks and a darker sky are drawn over the map. In a storm the airport runway closes and
   the flight clock (FLT, see airport.js) stops, so every flight shows "Delayed · weather" until it clears.
   Loaded before airport.js. */

const WX = { manual: null, k: 0, flash: 0 };
const WX_TEXT = { auto: '🌤️', rain: '🌧️', storm: '⛈️', clear: '☀️' };
WX.cur = () => WX.manual || (time % 160 < 90 ? 'clear' : time % 160 < 130 ? 'rain' : 'storm');
WX.rain = () => ({ clear: 0, rain: 6, storm: 28 })[WX.cur()];
WX.wind = () => ({ clear: 12, rain: 24, storm: 55 })[WX.cur()];
WX.target = () => ({ clear: 0, rain: .45, storm: 1 })[WX.cur()];

{ // toolbar button: auto → rain → storm → clear
  const b = document.getElementById('bWx'), order = [null, 'rain', 'storm', 'clear'];
  const label = () => { b.textContent = WX_TEXT[WX.manual || 'auto']; b.title = 'Weather: ' + (WX.manual || 'auto') + ' (click to change)'; };
  b.onclick = () => { WX.manual = order[(order.indexOf(WX.manual) + 1) % order.length]; label(); };
  label();
}

const _wxUpdate = updateHighway;
updateHighway = function (dt) { _wxUpdate(dt); WX.k += (WX.target() - WX.k) * Math.min(1, dt * 1.2); WX.flash = WX.cur() === 'storm' ? Math.max(0, 1 - (time % 7.3) / .25) : 0; };

const _wxOverlay = drawHWOverlay;
drawHWOverlay = function () {
  _wxOverlay();
  if (scene !== 'city' || WX.k < .02) return;
  ctx.save();
  ctx.fillStyle = `rgba(20,32,52,${.3 * WX.k})`; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = `rgba(190,215,240,${.25 + .35 * WX.k})`; ctx.lineWidth = 1.2; ctx.beginPath();
  const n = Math.round(60 + 220 * WX.k), fall = 520 + 500 * WX.k;
  for (let i = 0; i < n; i++) { const x = (hsh(i * 3.1) * (W + 200) + time * (60 + 120 * WX.k)) % (W + 200) - 100, y = (hsh(i * 7.7) * H + time * fall * (.7 + hsh(i) * .6)) % H; ctx.moveTo(x, y); ctx.lineTo(x - 5 - 5 * WX.k, y + 14); }
  ctx.stroke();
  if (WX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${.4 * WX.flash})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  pill(W / 2, 100, WX.cur() === 'storm' ? '⛈️ Storm · runway closed, flights delayed' : '🌧️ Rain', WX.cur() === 'storm' ? '#b71c1c' : '#37474f', '#fff', 12);
};
