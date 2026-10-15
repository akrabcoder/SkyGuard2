/* ============================================
   SkyGuard — منطق التطبيق الكامل
   ============================================ */

let map, planeMarker, routeLine, emergencyRoute;
let planeLat, planeLng, progress = 0;
let emergencyMode = false;
let airportMarkers = [];
let animFrameId = null;

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
  const ll = document.getElementById('langLbl');
  if (ll) ll.textContent = lang === 'ar' ? 'EN' : 'ع';
  localStorage.setItem('sg_lang', lang);

  populateAirportSelects();
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
      renderAlerts();
      renderLog();
      addLog('Pilot ' + id + ' logged in');
      startMonitoring();
    }, 120);
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
    const el = document.getElementById('clock');
    if (el) el.textContent =
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

  if (tab === 'map' && map) setTimeout(() => map.resize(), 150);
  if (tab === 'pass') setTimeout(renderSeats, 100);
  if (tab === 'alerts') renderAlerts();
  if (tab === 'log') renderLog();
}

/* ============ قوائم المطارات ============ */
function populateAirportSelects() {
  const fromSel = document.getElementById('fromSelect');
  const toSel = document.getElementById('toSelect');
  if (!fromSel || !toSel) return;

  // ترتيب حسب الاسم
  const sorted = [...AIRPORT_LIST].sort((a, b) => a.name.localeCompare(b.name));

  const options = sorted.map(a => {
    const label = lang === 'ar'
      ? `${a.nameAr} (${a.code}) — ${a.country}`
      : `${a.name} (${a.code}) — ${a.country}`;
    return `<option value="${a.code}">${label}</option>`;
  }).join('');

  fromSel.innerHTML = options;
  toSel.innerHTML = options;

  fromSel.value = FLIGHT.from;
  toSel.value = FLIGHT.to;
}

/* ============ تغيير مطار الإقلاع ============ */
function changeFrom(code) {
  if (code === FLIGHT.to) {
    alert(lang === 'ar' ? 'مطار الإقلاع لازم يختلف عن الهبوط!' : 'Departure must differ from arrival!');
    document.getElementById('fromSelect').value = FLIGHT.from;
    return;
  }
  FLIGHT.from = code;
  syncAirportsData();
  progress = 0;
  emergencyMode = false;
  addLog('🛫 Departure → ' + code);
  rebuildFlight();
}

/* ============ تغيير مطار الهبوط ============ */
function changeTo(code) {
  if (code === FLIGHT.from) {
    alert(lang === 'ar' ? 'مطار الهبوط لازم يختلف عن الإقلاع!' : 'Arrival must differ from departure!');
    document.getElementById('toSelect').value = FLIGHT.to;
    return;
  }
  FLIGHT.to = code;
  syncAirportsData();
  progress = 0;
  emergencyMode = false;
  addLog('🛬 Destination → ' + code);
  rebuildFlight();
}

/* ============ مزامنة AIRPORTS مع AIRPORT_LIST ============ */
function syncAirportsData() {
  AIRPORT_LIST.forEach(a => {
    AIRPORTS[a.code] = {
      name: a.name,
      nameAr: a.nameAr,
      lat: a.lat,
      lng: a.lng,
      country: a.country
    };
  });
}

/* ============ إعادة بناء الرحلة ============ */
function rebuildFlight() {
  const start = AIRPORTS[FLIGHT.from];
  const dest = AIRPORTS[FLIGHT.to];
  if (!start || !dest) return;

  // تحديث النصوص
  const fromEl = document.getElementById('fromTxt');
  if (fromEl) fromEl.textContent = start.name + ' (' + FLIGHT.from + ')';
  const toEl = document.getElementById('toTxt');
  if (toEl) toEl.textContent = dest.name + ' (' + FLIGHT.to + ')';
  const routeEl = document.getElementById('routeTxt');
  if (routeEl) routeEl.textContent = FLIGHT.from + ' → ' + FLIGHT.to;

  // إعادة تعيين موقع الطيارة
  planeLat = start.lat;
  planeLng = start.lng;
  if (planeMarker) planeMarker.setLngLat([planeLng, planeLat]);

  // حذف كل الـ markers القديمة للمطارات
  airportMarkers.forEach(m => m.remove());
  airportMarkers = [];

  // إعادة رسم كل المطارات
  drawAirports();

  // تحديث خط المسار
  if (map.getSource('route')) {
    map.getSource('route').setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[start.lng, start.lat], [dest.lng, dest.lat]]
      }
    });
  }

  // إزالة خط الطوارئ
  if (map.getLayer('emg-line')) map.removeLayer('emg-line');
  if (map.getSource('emg-route')) map.removeSource('emg-route');

  if (map.getLayer('route-line')) {
    map.setPaintProperty('route-line', 'line-color', '#00d4ff');
    map.setPaintProperty('route-line', 'line-width', 2);
    map.setPaintProperty('route-line', 'line-dasharray', [3, 3]);
  }

  document.body.style.background = '';

  // حرّك الخريطة عشان تشوف المسار
  const bounds = [
    [Math.min(start.lng, dest.lng) - 5, Math.min(start.lat, dest.lat) - 5],
    [Math.max(start.lng, dest.lng) + 5, Math.max(start.lat, dest.lat) + 5]
  ];
  map.fitBounds(bounds, { padding: 60, duration: 1000 });
}

/* ============================================
   الخريطة — MapLibre GL
   ============================================ */
function initMap() {
  syncAirportsData();

  map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        'satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: 'Esri World Imagery'
        }
      },
      layers: [
        { id: 'satellite-layer', type: 'raster', source: 'satellite', minzoom: 0, maxzoom: 19 }
      ]
    },
    center: [15, 42],
    zoom: 3.5,
    minZoom: 1,
    maxZoom: 18,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    attributionControl: false,
    antialias: false,
    fadeDuration: 0,
    preserveDrawingBuffer: false,
    refreshExpiredTiles: false,
    maxTileCacheSize: 200,
    trackResize: true,
    renderWorldCopies: true
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right');

  map.on('load', () => {
    drawAirports();
    drawRoute();
    drawPlane();
    startPlaneAnimation();
  });
}

/* ============ رسم المطارات ============ */
function drawAirports() {
  // نعرض المطارات اللي في القائمة بس
  AIRPORT_LIST.forEach(a => {
    let color = '#00d4ff';
    let size = 6;
    if (a.code === FLIGHT.from) { color = '#00ff9d'; size = 10; }
    if (a.code === FLIGHT.to) { color = '#00d4ff'; size = 10; }

    const el = document.createElement('div');
    el.style.cssText = `
      width: ${size}px; height: ${size}px;
      background: ${color};
      border-radius: 50%;
      box-shadow: 0 0 12px ${color}, 0 0 4px #fff;
      border: 2px solid rgba(255,255,255,0.9);
      cursor: pointer;
    `;

    const label = lang === 'ar' ? a.nameAr : a.name;

    const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
      .setHTML(`<div style="font-family:Cairo,sans-serif;padding:4px 8px;direction:${lang==='ar'?'rtl':'ltr'}">
        <b style="color:${color}">${label} (${a.code})</b>
        ${a.code === FLIGHT.from ? '<br>🛫 ' + t('from') : ''}
        ${a.code === FLIGHT.to ? '<br>🛬 ' + t('to') : ''}
      </div>`);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([a.lng, a.lat])
      .setPopup(popup)
      .addTo(map);

    airportMarkers.push(marker);
  });
}

/* ============ رسم المسار ============ */
function drawRoute() {
  const start = AIRPORTS[FLIGHT.from];
  const dest = AIRPORTS[FLIGHT.to];

  if (map.getSource('route')) {
    map.getSource('route').setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[start.lng, start.lat], [dest.lng, dest.lat]] }
    });
    return;
  }

  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[start.lng, start.lat], [dest.lng, dest.lat]] }
    }
  });

  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#00d4ff',
      'line-width': 2,
      'line-dasharray': [3, 3],
      'line-opacity': 0.8
    }
  });
}

/* ============ أيقونة الطيارة ============ */
function drawPlane() {
  const start = AIRPORTS[FLIGHT.from];
  planeLat = start.lat;
  planeLng = start.lng;

  const el = document.createElement('div');
  el.innerHTML = '✈️';
  el.style.cssText = `
    font-size: 32px;
    filter: drop-shadow(0 0 12px #00d4ff);
    cursor: pointer;
  `;

  planeMarker = new maplibregl.Marker({ element: el })
    .setLngLat([planeLng, planeLat])
    .addTo(map);
}

/* ============ حركة الطيارة ============ */
function startPlaneAnimation() {
  function animate() {
    if (!emergencyMode && progress < 1) {
      const start = AIRPORTS[FLIGHT.from];
      const dest = AIRPORTS[FLIGHT.to];

      progress += 0.0008;
      if (progress > 1) progress = 1;

      planeLat = start.lat + (dest.lat - start.lat) * progress;
      planeLng = start.lng + (dest.lng - start.lng) * progress;
      planeMarker.setLngLat([planeLng, planeLat]);

      const remainH = Math.max(0, Math.round((1 - progress) * 5));
      const etaEl = document.getElementById('etaTxt');
      if (etaEl) etaEl.textContent = remainH + 'h';
    }
    animFrameId = requestAnimationFrame(animate);
  }
  animate();
}

/* ============ الطوارئ ============ */
function emergency() {
  if (emergencyMode) return;
  emergencyMode = true;
  playAlarm();

  const btn = document.querySelector('.emg-btn');
  if (btn) {
    btn.classList.add('activated');
    btn.innerHTML = '🚨 ' + t('emg') + ' ✓';
  }

  // نبحث في كل المطارات عن الأقرب
  let nearest = null, minDist = Infinity;
  AIRPORT_LIST.forEach(a => {
    if (a.code === FLIGHT.from) return;
    const d = Math.hypot(a.lat - planeLat, a.lng - planeLng) * 111;
    if (d < minDist) { minDist = d; nearest = { ...a, dist: Math.round(d) }; }
  });

  if (!nearest) return;

  addLog('🚨 EMERGENCY ACTIVATED');
  addLog('📍 Nearest: ' + nearest.name + ' (' + nearest.code + ')');
  addLog('🛬 Autopilot engaged');
  addAlert('danger', '🚨 ' + t('emergencyOn'), null);
  addAlert('warn', '📍 ' + t('nearest') + ': ' +
    (lang === 'ar' ? nearest.nameAr : nearest.name) +
    ' (' + nearest.code + ') — ' + nearest.dist + ' km', null);

  if (map.getLayer('route-line')) {
    map.setPaintProperty('route-line', 'line-color', '#ff2d55');
    map.setPaintProperty('route-line', 'line-width', 3);
    map.setPaintProperty('route-line', 'line-dasharray', [2, 2]);
  }

  if (!map.getSource('emg-route')) {
    map.addSource('emg-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[planeLng, planeLat], [nearest.lng, nearest.lat]] }
      }
    });
    map.addLayer({
      id: 'emg-line',
      type: 'line',
      source: 'emg-route',
      paint: { 'line-color': '#ff2d55', 'line-width': 4, 'line-opacity': 0.9 }
    });
  }

  const mEl = document.createElement('div');
  mEl.style.cssText = `
    width: 20px; height: 20px;
    background: #ff2d55;
    border-radius: 50%;
    box-shadow: 0 0 20px #ff2d55, 0 0 8px #fff;
    border: 3px solid #fff;
  `;

  new maplibregl.Marker({ element: mEl })
    .setLngLat([nearest.lng, nearest.lat])
    .setPopup(new maplibregl.Popup({ offset: 15 })
      .setHTML(`<b style="color:#ff2d55">🆘 ${t('nearest')}: ${nearest.name}</b>`))
    .addTo(map);

  const fromLat = planeLat, fromLng = planeLng;
  let p = 0;
  const timer = setInterval(() => {
    p += 0.005;
    if (p >= 1) { clearInterval(timer); addLog('🛬 Landed at ' + nearest.name); return; }
    planeMarker.setLngLat([
      fromLng + (nearest.lng - fromLng) * p,
      fromLat + (nearest.lat - fromLat) * p
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

/* ============ الكراسي ============ */
function renderSeats() {
  const layer = document.getElementById('seatsLayer');
  if (!layer) return;

  const wrap = document.querySelector('.plane-svg-wrap');
  if (!wrap) return;
  const wrapW = wrap.offsetWidth;
  const wrapH = wrap.offsetHeight;

  const svgX0 = 120, svgX1 = 280, svgY0 = 150, svgY1 = 900;
  const scaleX = wrapW / 400;
  const scaleY = wrapH / 1200;

  const rows = 9, cols = 6;
  layer.innerHTML = '';

  PASSENGERS.forEach(p => {
    const r = p.row - 1;
    const c = p.letter.charCodeAt(0) - 65;

    const rowRatio = r / (rows - 1 || 1);
    const colRatio = c / (cols - 1 || 1);
    const aisleGap = 0.06;
    let colPos = colRatio;
    if (c >= 3) colPos += aisleGap;

    const svgX = svgX0 + colPos * (svgX1 - svgX0 - aisleGap * (svgX1 - svgX0));
    const svgY = svgY0 + rowRatio * (svgY1 - svgY0);

    const el = document.createElement('div');
    el.className = 'seat ' + p.status;
    if (selectedPassenger && selectedPassenger.id === p.id) el.classList.add('selected');
    el.style.left = (svgX * scaleX) + 'px';
    el.style.top = (svgY * scaleY) + 'px';
    el.textContent = p.seat;
    el.title = p.name + ' — ' + p.seat;
    el.onclick = (e) => { e.stopPropagation(); selectPassenger(p.id); };
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
  if (!box) return;

  const statusText = t(p.status);
  const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const stressCls = p.stress > 75 ? 'danger' : (p.stress > 50 ? 'warn' : '');
  const moveCls = p.movement > 75 ? 'danger' : (p.movement > 50 ? 'warn' : '');
  const pulseCls = p.pulse > 110 ? 'danger' : (p.pulse > 90 ? 'warn' : '');

  const aiMsg = p.status === 'danger' ? t('criticalBehavior')
              : p.status === 'warn' ? t('suspiciousBehavior')
              : t('normalBehavior');

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
        <div class="pd-data-row"><span class="lbl">${t('destination')}</span><span class="val">${p.destination}</span></div>
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
        <div style="color:${p.status === 'danger' ? 'var(--dgr)' : p.status === 'warn' ? 'var(--wrn)' : 'var(--acc2)'};font-weight:700;font-size:13px">
          ${aiMsg}
        </div>
      </div>
    </div>
  `;
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
    const passBtn = document.querySelector('[onclick*="go(\'pass\'"]');
    if (passBtn) go('pass', passBtn);
    setTimeout(() => selectPassenger(a.passengerId), 200);
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

/* ============ المراقبة ============ */
function startMonitoring() {
  updateBadges();

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

    const passTab = document.getElementById('t-pass');
    if (passTab && passTab.classList.contains('on')) renderSeats();
    if (selectedPassenger && selectedPassenger.id === p.id) showPassengerDetail(p.id);
    updateBadges();
  }, 6000);
}

/* ============ التشغيل ============ */
window.addEventListener('DOMContentLoaded', () => {
  applyLang();
  addLog('SkyGuard initialized');

  window.addEventListener('resize', () => {
    if (map) setTimeout(() => map.resize(), 100);
    if (document.getElementById('t-pass').classList.contains('on')) renderSeats();
  });

  const pp = document.getElementById('ppass');
  if (pp) pp.addEventListener('keypress', e => {
    if (e.key === 'Enter') login();
  });
});
