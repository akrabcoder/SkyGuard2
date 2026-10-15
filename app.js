/* ============================================
   SkyGuard — منطق التطبيق الكامل
   ============================================ */

let map, planeMarker, routeLine, emergencyRoute;
let planeLat, planeLng, progress = 0;
let emergencyMode = false;
let nearestAirportMarker = null;

let lang = localStorage.getItem('sg_lang') || 'ar';
let soundOn = true;
let eventLog = [];
let activeAlerts = [];
let selectedPassenger = null;

/* ============ الترجمة ============ */
function t(key) { return TR[lang][key] || key; }

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.getElementById('langLbl').textContent = lang === 'ar' ? 'EN' : 'ع';
  localStorage.setItem('sg_lang', lang);

  renderPassengers();
  renderAlerts();
  renderLog();
  if (selectedPassenger) showPassengerDetail(selectedPassenger.id);
}

function toggleLang() {
  lang = lang === 'ar' ? 'en' : 'ar';
  applyLang();
  playBeep(700, 100);
  addLog('Language: ' + lang.toUpperCase());
}

/* ============ تسجيل الدخول ============ */
function login() {
  const id = document.getElementById('pid').value.trim();
  const pw = document.getElementById('ppass').value.trim();

  if (id === 'PLT-001' && pw === 'skyguard') {
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').classList.add('on');
    setTimeout(() => {
      initMap();
      renderPassengers();
      renderAlerts();
      renderLog();
      addLog('Pilot ' + id + ' logged in');
      startMonitoring();
    }, 100);
    startClock();
    playBeep(900, 200);
  } else {
    alert(lang === 'ar' ? 'بيانات خاطئة!' : 'Invalid credentials!');
  }
}

/* ============ الساعة ============ */
function startClock() {
  setInterval(() => {
    const d = new Date();
    document.getElementById('clock').textContent =
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');
  }, 1000);
}

/* ============ الصوت ============ */
let audioCtx = null;

function toggleSound() {
  soundOn = !soundOn;
  document.getElementById('sndIcon').textContent = soundOn ? '🔊' : '🔇';
  addLog('Sound: ' + (soundOn ? 'ON' : 'OFF'));
}

function playBeep(freq = 800, dur = 150) {
  if (!soundOn) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.start(); osc.stop(audioCtx.currentTime + dur / 1000);
  } catch (e) {}
}

function playAlarm() {
  if (!soundOn) return;
  playBeep(1200, 150);
  setTimeout(() => playBeep(900, 150), 200);
  setTimeout(() => playBeep(1200, 150), 400);
}

/* ============ التنقل ============ */
function go(tab, btn) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab').forEach(c => c.classList.remove('on'));
  document.getElementById('t-' + tab).classList.add('on');

  if (tab === 'map' && map) setTimeout(() => map.invalidateSize(), 100);
  if (tab === 'pass') renderSeats();
  if (tab === 'alerts') renderAlerts();
  if (tab === 'log') renderLog();
}

/* ============ الخريطة ============ */
function initMap() {
  const start = AIRPORTS[FLIGHT.from];
  const dest = AIRPORTS[FLIGHT.to];

  map = L.map('map', {
    center: [42, 15],
    zoom: 4,
    zoomControl: true,
    attributionControl: false,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
    boxZoom: true,
    keyboard: true
  });

  // صور القمر الصناعي — Esri World Imagery
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19 }
  ).addTo(map);

  // طبقة أسماء المدن فوق
  L.tileLayer(
    'https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png',
    { maxZoom: 19, opacity: 0.7 }
  ).addTo(map);

  // كل المطارات
  Object.keys(AIRPORTS).forEach(code => {
    const a = AIRPORTS[code];
    let color = '#00d4ff', radius = 4;
    if (code === FLIGHT.from) { color = '#00ff9d'; radius = 8; }
    if (code === FLIGHT.to) { color = '#00d4ff'; radius = 8; }

    const marker = L.circleMarker([a.lat, a.lng], {
      radius, color, fillColor: color, fillOpacity: 0.9, weight: 2
    }).addTo(map);

    const label = lang === 'ar' ? a.nameAr : a.name;
    marker.bindPopup(
      `<b>${label} (${code})</b>` +
      (code === FLIGHT.from ? '<br>🛫 ' + t('from') : '') +
      (code === FLIGHT.to ? '<br>🛬 ' + t('to') : '')
    );
  });

  // خط الرحلة
  routeLine = L.polyline(
    [[start.lat, start.lng], [dest.lat, dest.lng]],
    { color: '#00d4ff', weight: 2, dashArray: '8,8', opacity: 0.8 }
  ).addTo(map);

  // أيقونة الطيارة
  const planeIcon = L.divIcon({
    className: '',
    html: '<div class="plane-marker">✈️</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  planeLat = start.lat;
  planeLng = start.lng;
  planeMarker = L.marker([planeLat, planeLng], { icon: planeIcon }).addTo(map);

  movePlane();
}

function movePlane() {
  const start = AIRPORTS[FLIGHT.from];
  const dest = AIRPORTS[FLIGHT.to];

  setInterval(() => {
    if (emergencyMode || progress >= 1) return;
    progress += 0.0015;
    if (progress > 1) progress = 1;

    planeLat = start.lat + (dest.lat - start.lat) * progress;
    planeLng = start.lng + (dest.lng - start.lng) * progress;
    planeMarker.setLatLng([planeLat, planeLng]);

    const remainH = Math.max(0, Math.round((1 - progress) * 5));
    const etaEl = document.getElementById('etaTxt');
    if (etaEl) etaEl.textContent = remainH + 'h';
  }, 100);
}

/* ============ الطوارئ ============ */
function emergency() {
  if (emergencyMode) return;
  emergencyMode = true;
  playAlarm();

  const btn = document.querySelector('.emg-btn');
  btn.classList.add('activated');
  btn.innerHTML = '🚨 ' + t('emg') + ' ✓';

  let nearest = null, minDist = Infinity;
  Object.keys(AIRPORTS).forEach(code => {
    if (code === FLIGHT.from) return;
    const a = AIRPORTS[code];
    const d = Math.hypot(a.lat - planeLat, a.lng - planeLng) * 111;
    if (d < minDist) { minDist = d; nearest = { code, ...a, dist: Math.round(d) }; }
  });

  addLog('🚨 EMERGENCY ACTIVATED');
  addLog('📍 Nearest: ' + nearest.name + ' (' + nearest.code + ')');
  addLog('🛬 Autopilot engaged');
  addAlert('danger', '🚨 ' + t('emergencyOn'), null);
  addAlert('warn', '📍 ' + t('nearest') + ': ' + (lang === 'ar' ? nearest.nameAr : nearest.name) + ' (' + nearest.code + ') — ' + nearest.dist + ' km', null);

  if (routeLine) routeLine.setStyle({ color: '#ff2d55', weight: 3, dashArray: '4,6' });

  emergencyRoute = L.polyline(
    [[planeLat, planeLng], [nearest.lat, nearest.lng]],
    { color: '#ff2d55', weight: 4, opacity: 0.9 }
  ).addTo(map);

  nearestAirportMarker = L.circleMarker([nearest.lat, nearest.lng], {
    radius: 14, color: '#ff2d55', fillColor: '#ff2d55',
    fillOpacity: 0.7, weight: 3
  }).addTo(map).bindPopup('🆘 ' + t('nearest') + ': ' + nearest.name).openPopup();

  const fromLat = planeLat, fromLng = planeLng;
  let p = 0;
  const timer = setInterval(() => {
    p += 0.006;
    if (p >= 1) { clearInterval(timer); addLog('🛬 Landed at ' + nearest.name); return; }
    planeMarker.setLatLng([
      fromLat + (nearest.lat - fromLat) * p,
      fromLng + (nearest.lng - fromLng) * p
    ]);
  }, 100);

  const toEl = document.getElementById('toTxt');
  if (toEl) toEl.textContent = nearest.name + ' (' + nearest.code + ')';
  const routeEl = document.getElementById('routeTxt');
  if (routeEl) routeEl.textContent = FLIGHT.from + ' → ' + nearest.code;
  const etaEl = document.getElementById('etaTxt');
  if (etaEl) etaEl.textContent = '~' + Math.round(nearest.dist / 8) + ' min';

  document.body.style.transition = 'background 0.8s';
  document.body.style.background = '#1a0810';

  renderAlerts();
}

/* ============ الكراسي على شكل الطيارة ============ */
function renderSeats() {
  const layer = document.getElementById('seatsLayer');
  if (!layer) return;

  // نحدد أبعاد الطيارة داخل الـ SVG wrapper
  const wrap = document.querySelector('.plane-svg-wrap');
  const wrapW = wrap.offsetWidth;
  const wrapH = wrap.offsetHeight;

  // حدود جسم الطيارة داخل الـ SVG (viewBox 400 x 1200)
  // body: x من 120 لـ 280 (عرض 160)، y من 140 لـ 900 (منطقة الكراسي)
  const svgX0 = 120, svgX1 = 280;
  const svgY0 = 150, svgY1 = 900;

  const scaleX = wrapW / 400;
  const scaleY = wrapH / 1200;

  // عدد الصفوف = 9
  const rows = 9;
  const cols = 6;

  layer.innerHTML = '';

  PASSENGERS.forEach(p => {
    const r = p.row - 1;
    const c = p.letter.charCodeAt(0) - 65;

    // نسب داخل منطقة الكراسي
    const rowRatio = r / (rows - 1 || 1);
    const colRatio = c / (cols - 1 || 1);

    // الممر في المنتصف — نعمل فراغ بين العمود C و D
    const aisleGap = 0.06;
    let colPos = colRatio;
    if (c >= 3) colPos += aisleGap;

    const svgX = svgX0 + colPos * (svgX1 - svgX0 - aisleGap * (svgX1 - svgX0));
    const svgY = svgY0 + rowRatio * (svgY1 - svgY0);

    const left = svgX * scaleX;
    const top = svgY * scaleY;

    const el = document.createElement('div');
    el.className = 'seat ' + p.status;
    if (selectedPassenger && selectedPassenger.id === p.id) el.classList.add('selected');
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.textContent = p.seat;
    el.title = p.name + ' — ' + p.seat;
    el.onclick = (e) => {
      e.stopPropagation();
      selectPassenger(p.id);
    };
    layer.appendChild(el);
  });
}

/* ============ اختيار راكب ============ */
function selectPassenger(id) {
  const p = PASSENGERS.find(x => x.id === id);
  if (!p) return;
  selectedPassenger = p;
  showPassengerDetail(id);
  renderSeats();
  playBeep(800, 80);
}

function showPassengerDetail(id) {
  const p = PASSENGERS.find(x => x.id === id);
  if (!p) return;
  const box = document.getElementById('passDetail');

  const statusText = t(p.status);
  const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const stressCls = p.stress > 75 ? 'danger' : (p.stress > 50 ? 'warn' : '');
  const moveCls = p.movement > 75 ? 'danger' : (p.movement > 50 ? 'warn' : '');
  const pulseCls = p.pulse > 110 ? 'danger' : (p.pulse > 90 ? 'warn' : '');

  const aiMsg = p.status === 'danger' ? t('criticalBehavior')
              : p.status === 'warn' ? t('suspiciousBehavior')
              : t('normalBehavior');

  const dest = lang === 'ar' ? p.destination : p.destination;

  box.innerHTML = `
    <div class="pd-card">
      <div class="pd-avatar ${p.status}">${initials}</div>
      <div class="pd-name">${p.name}</div>
      <div class="pd-seat">SEAT ${p.seat}</div>
      <div class="pd-status-badge ${p.status}">${statusText}</div>

      <div class="pd-section">
        <div class="pd-section-title">${t('info')}</div>
        <div class="pd-data-row"><span class="lbl">${t('age')}</span><span class="val">${p.age}</span></div>
        <div class="pd-data-row"><span class="lbl">${t('nationality')}</span><span class="val">${p.nationality}</span></div>
        <div class="pd-data-row"><span class="lbl">${t('passport')}</span><span class="val">${p.passport}</span></div>
        <div class="pd-data-row"><span class="lbl">${t('ticket')}</span><span class="val">${p.ticket}</span></div>
        <div class="pd-data-row"><span class="lbl">${t('destination')}</span><span class="val">${dest}</span></div>
        <div class="pd-data-row"><span class="lbl">${t('class')}</span><span class="val">${t(p.seatClass)}</span></div>
      </div>

      <div class="pd-section">
        <div class="pd-section-title">${t('vitals')}</div>
        <div class="pd-data-row" style="flex-direction:column;align-items:stretch">
          <div style="display:flex;justify-content:space-between">
            <span class="lbl">💓 ${t('pulse')}</span>
            <span class="val">${p.pulse} ${t('bpm')}</span>
          </div>
          <div class="pd-bar"><div class="pd-bar-fill ${pulseCls}" style="width:${Math.min(100, p.pulse / 1.4)}%"></div></div>
        </div>
        <div class="pd-data-row" style="flex-direction:column;align-items:stretch">
          <div style="display:flex;justify-content:space-between">
            <span class="lbl">😰 ${t('stress')}</span>
            <span class="val">${p.stress}%</span>
          </div>
          <div class="pd-bar"><div class="pd-bar-fill ${stressCls}" style="width:${p.stress}%"></div></div>
        </div>
        <div class="pd-data-row" style="flex-direction:column;align-items:stretch">
          <div style="display:flex;justify-content:space-between">
            <span class="lbl">🚶 ${t('movement')}</span>
            <span class="val">${p.movement}%</span>
          </div>
          <div class="pd-bar"><div class="pd-bar-fill ${moveCls}" style="width:${p.movement}%"></div></div>
        </div>
      </div>

      <div class="pd-section">
        <div class="pd-section-title">🧠 ${t('aiAnalysis')}</div>
        <div style="color:${p.status === 'danger' ? 'var(--dgr)' : p.status === 'warn' ? 'var(--wrn)' : 'var(--acc2)'};font-weight:700;font-size:14px">
          ${aiMsg}
        </div>
      </div>
    </div>
  `;
}

/* ============ عرض الركاب (الشبكة القديمة) ============ */
function renderPassengers() {
  renderSeats();
}

/* ============ الإنذارات ============ */
function addAlert(level, message, passengerId) {
  activeAlerts.unshift({
    level, message, passengerId,
    time: new Date().toLocaleTimeString()
  });
  if (activeAlerts.length > 30) activeAlerts.pop();
  renderAlerts();
  updateBadges();
}

function renderAlerts() {
  const list = document.getElementById('alertsList');
  if (!list) return;

  if (activeAlerts.length === 0) {
    list.innerHTML = `<div class="alert-empty">${t('noAlerts')}</div>`;
    return;
  }

  list.innerHTML = activeAlerts.map((a, i) => `
    <div class="alert-item ${a.level}" onclick="handleAlertClick(${i})">
      <div class="alert-icon">${a.level === 'danger' ? '🚨' : '⚠️'}</div>
      <div class="alert-body">
        <div class="alert-title">${a.message}</div>
        <div class="alert-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

function handleAlertClick(index) {
  const a = activeAlerts[index];
  if (a.passengerId) {
    go('pass', document.querySelector('[onclick*="pass"]'));
    setTimeout(() => selectPassenger(a.passengerId), 150);
  }
}

function updateBadges() {
  const pb = document.getElementById('passBadge');
  if (pb) pb.textContent = PASSENGERS.length;
  const ab = document.getElementById('alertBadge');
  if (ab) ab.textContent = activeAlerts.length;
}

/* ============ السجل ============ */
function addLog(msg) {
  eventLog.unshift({ time: new Date().toLocaleTimeString(), msg });
  if (eventLog.length > 100) eventLog.pop();
  renderLog();
}

function renderLog() {
  const list = document.getElementById('logList');
  if (!list) return;
  list.innerHTML = eventLog.map(e => `
    <div class="log-item">
      <span class="log-time">${e.time}</span>
      <span class="log-msg">${e.msg}</span>
    </div>
  `).join('');
}

/* ============ مراقبة الركاب (AI) ============ */
function startMonitoring() {
  setInterval(() => {
    const idx = Math.floor(Math.random() * PASSENGERS.length);
    const p = PASSENGERS[idx];

    p.pulse = Math.max(55, Math.min(140, p.pulse + Math.floor(Math.random() * 20 - 10)));
    p.stress = Math.max(0, Math.min(100, p.stress + Math.floor(Math.random() * 25 - 12)));
    p.movement = Math.max(0, Math.min(100, p.movement + Math.floor(Math.random() * 30 - 15)));

    const oldStatus = p.status;
    if (p.stress > 75 || p.movement > 80 || p.pulse > 120) p.status = 'danger';
    else if (p.stress > 50 || p.movement > 55) p.status = 'warn';
    else p.status = 'safe';

    if (p.status === 'danger' && oldStatus !== 'danger') {
      addAlert('danger', '🚨 ' + t('detected') + ': ' + p.name + ' (' + p.seat + ')', p.id);
      addLog('⚠️ Threat: ' + p.name + ' — ' + p.seat);
      playAlarm();
    }

    renderSeats();
    if (selectedPassenger && selectedPassenger.id === p.id) showPassengerDetail(p.id);
    updateBadges();
  }, 6000);
}

/* ============ Modal ============ */
function closeModal() {
  document.getElementById('passModal').classList.remove('on');
}

/* ============ التشغيل ============ */
window.addEventListener('DOMContentLoaded', () => {
  applyLang();
  addLog('SkyGuard initialized');
  window.addEventListener('resize', () => { if (document.getElementById('t-pass').classList.contains('on')) renderSeats(); });
  document.getElementById('ppass').addEventListener('keypress', e => {
    if (e.key === 'Enter') login();
  });
});
