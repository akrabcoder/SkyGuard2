/* ============================================
   SkyGuard — منطق التطبيق
   ============================================ */

let map, planeMarker, routeLine, emergencyRoute;
let planeLat, planeLng, progress = 0;
let emergencyMode = false;
let nearestAirportMarker = null;

let lang = localStorage.getItem('sg_lang') || 'ar';
let soundOn = true;
let eventLog = [];
let activeAlerts = [];

/* ============ الترجمة ============ */
function t(key) {
  return TR[lang][key] || key;
}

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });

  document.getElementById('langLbl').textContent = lang === 'ar' ? 'EN' : 'ع';
  localStorage.setItem('sg_lang', lang);

  // إعادة رسم الركاب والإنذارات لو مفتوحين
  renderPassengers();
  renderAlerts();
  renderLog();
}

function toggleLang() {
  lang = lang === 'ar' ? 'en' : 'ar';
  applyLang();
  playBeep(700, 100);
  addLog('Language changed to ' + lang.toUpperCase());
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
      updateStats();
      addLog('Pilot ' + id + ' logged in');
      startPassengerMonitoring();
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
  addLog('Sound ' + (soundOn ? 'ON' : 'OFF'));
}

function playBeep(freq = 800, dur = 150) {
  if (!soundOn) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  } catch (e) {}
}

function playAlarm() {
  if (!soundOn) return;
  playBeep(1200, 150);
  setTimeout(() => playBeep(900, 150), 200);
  setTimeout(() => playBeep(1200, 150), 400);
}

/* ============ التبويبات ============ */
function go(tab, btn) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.tab').forEach(c => c.classList.remove('on'));
  document.getElementById('t-' + tab).classList.add('on');

  if (tab === 'map' && map) {
    setTimeout(() => map.invalidateSize(), 100);
  }
  if (tab === 'pass') renderPassengers();
  if (tab === 'alerts') renderAlerts();
  if (tab === 'log') renderLog();
}

/* ============ الخريطة ============ */
function initMap() {
  const start = AIRPORTS[FLIGHT.from];
  const dest = AIRPORTS[FLIGHT.to];

  // الخريطة القمر الصناعي (Esri World Imagery — نفس جودة جوجل إيرث)
  map = L.map('map', {
    center: [42, 15],
    zoom: 4,
    zoomControl: true,
    attributionControl: false
  });

  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19 }
  ).addTo(map);

  // طبقة أسماء المدن فوق الصورة (عشان تبان أسماء)
  L.tileLayer(
    'https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png',
    { maxZoom: 19, opacity: 0.7 }
  ).addTo(map);

  // رسم كل المطارات
  Object.keys(AIRPORTS).forEach(code => {
    const a = AIRPORTS[code];

    let color = '#00d4ff';
    let radius = 4;

    if (code === FLIGHT.from) { color = '#00ff9d'; radius = 8; }
    if (code === FLIGHT.to) { color = '#00d4ff'; radius = 8; }

    const marker = L.circleMarker([a.lat, a.lng], {
      radius: radius,
      color: color,
      fillColor: color,
      fillOpacity: 0.9,
      weight: 2
    }).addTo(map);

    const label = lang === 'ar' ? a.nameAr : a.name;
    marker.bindPopup(
      `<b>${label} (${code})</b><br>` +
      (code === FLIGHT.from ? '🛫 ' + t('from') : '') +
      (code === FLIGHT.to ? '🛬 ' + t('to') : '')
    );
  });

  // خط الرحلة الأساسي
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

  // ابدأ حركة الطيارة
  movePlane();
}

/* ============ حركة الطيارة ============ */
function movePlane() {
  const start = AIRPORTS[FLIGHT.from];
  const dest = AIRPORTS[FLIGHT.to];

  setInterval(() => {
    if (emergencyMode) return;
    if (progress >= 1) return;

    progress += 0.0015;
    if (progress > 1) progress = 1;

    planeLat = start.lat + (dest.lat - start.lat) * progress;
    planeLng = start.lng + (dest.lng - start.lng) * progress;
    planeMarker.setLatLng([planeLat, planeLng]);

    // ETA تقريبي
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

  // إيجاد أقرب مطار (غير اللي إحنا رايحينه)
  let nearest = null;
  let minDist = Infinity;

  Object.keys(AIRPORTS).forEach(code => {
    if (code === FLIGHT.from) return;
    const a = AIRPORTS[code];
    const d = Math.hypot(a.lat - planeLat, a.lng - planeLng) * 111;
    if (d < minDist) {
      minDist = d;
      nearest = { code, ...a, dist: Math.round(d) };
    }
  });

  addLog('🚨 EMERGENCY ACTIVATED');
  addLog('📍 Nearest safe airport: ' + nearest.name + ' (' + nearest.code + ')');
  addLog('🛬 Autopilot engaged — diverting now');
  addAlert('danger', '🚨 ' + t('emergencyOn'));
  addAlert('warn', '📍 ' + t('nearest') + ': ' + (lang === 'ar' ? nearest.nameAr : nearest.name) + ' (' + nearest.code + ') — ' + nearest.dist + ' km');

  // خط أحمر للطوارئ
  if (routeLine) routeLine.setStyle({ color: '#ff2d55', weight: 3, dashArray: '4,6' });

  emergencyRoute = L.polyline(
    [[planeLat, planeLng], [nearest.lat, nearest.lng]],
    { color: '#ff2d55', weight: 4, opacity: 0.9 }
  ).addTo(map);

  // علامة المطار الأقرب
  nearestAirportMarker = L.circleMarker([nearest.lat, nearest.lng], {
    radius: 14,
    color: '#ff2d55',
    fillColor: '#ff2d55',
    fillOpacity: 0.7,
    weight: 3
  }).addTo(map)
    .bindPopup('🆘 ' + t('nearest') + ': ' + nearest.name + ' (' + nearest.code + ')')
    .openPopup();

  // حرّك الطيارة ناحية المطار الأقرب
  const fromLat = planeLat;
  const fromLng = planeLng;
  let p = 0;

  const timer = setInterval(() => {
    p += 0.006;
    if (p >= 1) {
      clearInterval(timer);
      addLog('🛬 Successfully landed at ' + nearest.name);
      return;
    }
    const lat = fromLat + (nearest.lat - fromLat) * p;
    const lng = fromLng + (nearest.lng - fromLng) * p;
    planeMarker.setLatLng([lat, lng]);
  }, 100);

  // تحديث اللوحة
  const toEl = document.getElementById('toTxt');
  if (toEl) toEl.textContent = nearest.name + ' (' + nearest.code + ')';

  const routeEl = document.getElementById('routeTxt');
  if (routeEl) routeEl.textContent = FLIGHT.from + ' → ' + nearest.code;

  const etaEl = document.getElementById('etaTxt');
  if (etaEl) etaEl.textContent = '~' + Math.round(nearest.dist / 8) + ' min';

  // خلفية حمراء تحذيرية
  document.body.style.transition = 'background 0.8s';
  document.body.style.background = '#1a0810';

  renderAlerts();
  updateStats();
}

/* ============ الركاب ============ */
function renderPassengers() {
  const grid = document.getElementById('passGrid');
  if (!grid) return;

  grid.innerHTML = PASSENGERS.map(p => {
    const statusText = t(p.status);
    const pulseIcon = p.pulse > 90 ? '💓' : '💗';
    const stressIcon = p.stress > 75 ? '😰' : (p.stress > 50 ? '😟' : '😊');
    const moveIcon = p.movement > 75 ? '⚠️' : (p.movement > 50 ? '🚶' : '🪑');

    return `
      <div class="pass-card ${p.status}">
        <div class="pass-head">
          <div class="pass-name">${p.name}</div>
          <div class="pass-seat">${p.seat}</div>
        </div>
        <div class="pass-info">
          <div>${pulseIcon} ${t('pulse')}: <b>${p.pulse}</b> bpm</div>
          <div>${stressIcon} ${t('stress')}: <b>${p.stress}%</b></div>
          <div>${moveIcon} ${t('movement')}: <b>${p.movement}%</b></div>
        </div>
        <div class="pass-status ${p.status}">${statusText}</div>
      </div>
    `;
  }).join('');
}

function updateStats() {
  const total = PASSENGERS.length;
  const safe = PASSENGERS.filter(p => p.status === 'safe').length;
  const warn = PASSENGERS.filter(p => p.status === 'warn').length;
  const danger = PASSENGERS.filter(p => p.status === 'danger').length;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('totalPass', total);
  set('safePass', safe);
  set('warnPass', warn);
  set('dangerPass', danger);
  set('passBadge', total);

  const alertBadge = document.getElementById('alertBadge');
  if (alertBadge) alertBadge.textContent = activeAlerts.length;
}

/* ============ مراقبة الركاب (AI بسيط) ============ */
function startPassengerMonitoring() {
  setInterval(() => {
    // كل 8 ثواني غيّر حساسات راكب عشوائي
    const idx = Math.floor(Math.random() * PASSENGERS.length);
    const p = PASSENGERS[idx];

    // تغييرات طفيفة
    p.pulse = Math.max(55, Math.min(140, p.pulse + Math.floor(Math.random() * 20 - 10)));
    p.stress = Math.max(0, Math.min(100, p.stress + Math.floor(Math.random() * 25 - 12)));
    p.movement = Math.max(0, Math.min(100, p.movement + Math.floor(Math.random() * 30 - 15)));

    // إعادة تقييم الحالة
    const oldStatus = p.status;
    if (p.stress > 75 || p.movement > 80 || p.pulse > 120) p.status = 'danger';
    else if (p.stress > 50 || p.movement > 55) p.status = 'warn';
    else p.status = 'safe';

    // لو الراكب بقى خطر → إنذار
    if (p.status === 'danger' && oldStatus !== 'danger') {
      addAlert('danger', '🚨 ' + t('detected') + ': ' + p.name + ' (' + p.seat + ')');
      addLog('⚠️ Threat detected: ' + p.name + ' — Seat ' + p.seat);
      playAlarm();
    }

    // تحديث الواجهة
    renderPassengers();
    updateStats();
  }, 8000);
}

/* ============ الإنذارات ============ */
function addAlert(level, message) {
  activeAlerts.unshift({
    level: level,
    message: message,
    time: new Date().toLocaleTimeString()
  });
  if (activeAlerts.length > 30) activeAlerts.pop();
  renderAlerts();
  updateStats();
}

function renderAlerts() {
  const list = document.getElementById('alertsList');
  if (!list) return;

  if (activeAlerts.length === 0) {
    list.innerHTML = `<div class="alert-empty">${t('noAlerts')}</div>`;
    return;
  }

  list.innerHTML = activeAlerts.map(a => `
    <div class="alert-item ${a.level}">
      <div class="alert-icon">${a.level === 'danger' ? '🚨' : '⚠️'}</div>
      <div class="alert-body">
        <div class="alert-title">${a.message}</div>
        <div class="alert-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

/* ============ السجل ============ */
function addLog(msg) {
  eventLog.unshift({
    time: new Date().toLocaleTimeString(),
    msg: msg
  });
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

/* ============ التشغيل ============ */
window.addEventListener('DOMContentLoaded', () => {
  applyLang();
  addLog('SkyGuard system initialized');

  document.getElementById('ppass').addEventListener('keypress', e => {
    if (e.key === 'Enter') login();
  });
});
