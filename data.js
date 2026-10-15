/* ============================================
   SkyGuard — البيانات
   ============================================ */

/* ============ الترجمات (عربي/إنجليزي) ============ */
const TR = {
  ar: {
    sub: "نظام مراقبة وتحكم الطيران الذكي",
    btn: "دخول",
    map: "الخريطة",
    pass: "الركاب",
    alerts: "الإنذارات",
    log: "السجل",
    online: "النظام يعمل",
    from: "من",
    to: "إلى",
    speed: "السرعة",
    alt: "الارتفاع",
    eta: "الوصول المتوقع",
    emg: "طوارئ",
    passT: "مراقبة الركاب",
    alertsT: "الإنذارات",
    logT: "سجل الأحداث",
    flightInfo: "بيانات الرحلة",
    total: "الإجمالي",
    safe: "آمن",
    warn: "اشتباه",
    danger: "خطر",
    noAlerts: "لا توجد إنذارات حالياً ✅",
    emergencyOn: "🚨 تم تفعيل وضع الطوارئ — جاري التحويل لأقرب مطار",
    nearest: "أقرب مطار",
    diverting: "جاري التحويل إلى",
    detected: "تم اكتشاف سلوك مشبوه",
    onBoard: "على الطائرة",
    pulse: "النبض",
    stress: "التوتر",
    movement: "الحركة",
    low: "منخفض",
    medium: "متوسط",
    high: "عالي",
    normal: "طبيعي",
    suspicious: "مشبوه",
    critical: "خطر"
  },
  en: {
    sub: "Smart Flight Monitoring & Control System",
    btn: "Login",
    map: "Map",
    pass: "Passengers",
    alerts: "Alerts",
    log: "Flight Log",
    online: "System Online",
    from: "From",
    to: "To",
    speed: "Speed",
    alt: "Altitude",
    eta: "ETA",
    emg: "EMERGENCY",
    passT: "Passenger Monitoring",
    alertsT: "Alerts",
    logT: "Event Log",
    flightInfo: "Flight Info",
    total: "Total",
    safe: "Safe",
    warn: "Warning",
    danger: "Danger",
    noAlerts: "No alerts currently ✅",
    emergencyOn: "🚨 Emergency activated — Diverting to nearest airport",
    nearest: "Nearest Airport",
    diverting: "Diverting to",
    detected: "Suspicious behavior detected",
    onBoard: "On Board",
    pulse: "Pulse",
    stress: "Stress",
    movement: "Movement",
    low: "Low",
    medium: "Medium",
    high: "High",
    normal: "Normal",
    suspicious: "Suspicious",
    critical: "Critical"
  }
};

/* ============ المطارات العالمية ============ */
const AIRPORTS = {
  CAI: { name: "Cairo", nameAr: "القاهرة", lat: 30.1114, lng: 31.4139 },
  LHR: { name: "London Heathrow", nameAr: "لندن هيثرو", lat: 51.4700, lng: -0.4543 },
  ATH: { name: "Athens", nameAr: "أثينا", lat: 37.9364, lng: 23.9445 },
  IST: { name: "Istanbul", nameAr: "إسطنبول", lat: 41.2753, lng: 28.7519 },
  CDG: { name: "Paris CDG", nameAr: "باريس", lat: 49.0097, lng: 2.5479 },
  FCO: { name: "Rome", nameAr: "روما", lat: 41.8003, lng: 12.2389 },
  MAD: { name: "Madrid", nameAr: "مدريد", lat: 40.4719, lng: -3.5626 },
  VIE: { name: "Vienna", nameAr: "فيينا", lat: 48.1103, lng: 16.5697 },
  AMS: { name: "Amsterdam", nameAr: "أمستردام", lat: 52.3105, lng: 4.7683 },
  FRA: { name: "Frankfurt", nameAr: "فرانكفورت", lat: 50.0379, lng: 8.5622 },
  ZRH: { name: "Zurich", nameAr: "زيورخ", lat: 47.4647, lng: 8.5492 },
  BCN: { name: "Barcelona", nameAr: "برشلونة", lat: 41.2974, lng: 2.0833 },
  LIS: { name: "Lisbon", nameAr: "لشبونة", lat: 38.7756, lng: -9.1354 },
  DXB: { name: "Dubai", nameAr: "دبي", lat: 25.2532, lng: 55.3657 },
  JED: { name: "Jeddah", nameAr: "جدة", lat: 21.6796, lng: 39.1565 },
  RUH: { name: "Riyadh", nameAr: "الرياض", lat: 24.9576, lng: 46.6988 },
  KWI: { name: "Kuwait", nameAr: "الكويت", lat: 29.2266, lng: 47.9689 },
  DOH: { name: "Doha", nameAr: "الدوحة", lat: 25.2731, lng: 51.6081 },
  BEY: { name: "Beirut", nameAr: "بيروت", lat: 33.8209, lng: 35.4884 },
  AMM: { name: "Amman", nameAr: "عمّان", lat: 31.7226, lng: 35.9932 },
  TUN: { name: "Tunis", nameAr: "تونس", lat: 36.8510, lng: 10.2272 },
  ALG: { name: "Algiers", nameAr: "الجزائر", lat: 36.6910, lng: 3.2154 },
  CMN: { name: "Casablanca", nameAr: "الدار البيضاء", lat: 33.3675, lng: -7.5899 },
  TIP: { name: "Tripoli", nameAr: "طرابلس", lat: 32.6635, lng: 13.1590 },
  JFK: { name: "New York JFK", nameAr: "نيويورك", lat: 40.6413, lng: -73.7781 },
  LAX: { name: "Los Angeles", nameAr: "لوس أنجلوس", lat: 33.9416, lng: -118.4085 },
  ORD: { name: "Chicago", nameAr: "شيكاغو", lat: 41.9742, lng: -87.9073 },
  YYZ: { name: "Toronto", nameAr: "تورونتو", lat: 43.6777, lng: -79.6248 },
  GRU: { name: "São Paulo", nameAr: "ساو باولو", lat: -23.4356, lng: -46.4731 },
  EZE: { name: "Buenos Aires", nameAr: "بوينس آيرس", lat: -34.8222, lng: -58.5358 },
  NRT: { name: "Tokyo Narita", nameAr: "طوكيو", lat: 35.7720, lng: 140.3929 },
  ICN: { name: "Seoul", nameAr: "سيول", lat: 37.4602, lng: 126.4407 },
  PEK: { name: "Beijing", nameAr: "بكين", lat: 40.0799, lng: 116.6031 },
  HKG: { name: "Hong Kong", nameAr: "هونج كونج", lat: 22.3080, lng: 113.9185 },
  SIN: { name: "Singapore", nameAr: "سنغافورة", lat: 1.3644, lng: 103.9915 },
  BKK: { name: "Bangkok", nameAr: "بانكوك", lat: 13.6900, lng: 100.7501 },
  DEL: { name: "Delhi", nameAr: "دلهي", lat: 28.5562, lng: 77.1000 },
  BOM: { name: "Mumbai", nameAr: "مومباي", lat: 19.0896, lng: 72.8656 },
  SYD: { name: "Sydney", nameAr: "سيدني", lat: -33.9399, lng: 151.1753 },
  JNB: { name: "Johannesburg", nameAr: "جوهانسبرج", lat: -26.1392, lng: 28.2460 },
  NBO: { name: "Nairobi", nameAr: "نيروبي", lat: -1.3192, lng: 36.9278 },
  ADD: { name: "Addis Ababa", nameAr: "أديس أبابا", lat: 8.9779, lng: 38.7993 },
  CMB: { name: "Colombo", nameAr: "كولومبو", lat: 7.1808, lng: 79.8841 },
  KHI: { name: "Karachi", nameAr: "كراتشي", lat: 24.9065, lng: 67.1608 },
  MCT: { name: "Muscat", nameAr: "مسقط", lat: 23.5933, lng: 58.2844 },
  BAH: { name: "Bahrain", nameAr: "البحرين", lat: 26.2708, lng: 50.6336 }
};

/* ============ الرحلة الافتراضية ============ */
const FLIGHT = {
  number: "AA-1024",
  from: "CAI",
  to: "LHR",
  speed: 850,
  altitude: 11000
};

/* ============ أسماء الركاب ============ */
const NAMES_AR = [
  "أحمد محمد", "فاطمة علي", "محمد حسن", "سارة إبراهيم", "عمر خالد",
  "ليلى يوسف", "يوسف أحمد", "نور عبدالله", "كريم سامي", "هبة محمود",
  "علي رضا", "مريم فؤاد", "حسن طارق", "دينا مصطفى", "خالد سمير",
  "ريم عمرو", "مصطفى كامل", "أمينة ناصر", "أيمن صلاح", "ياسمين رضا",
  "طارق حسام", "سلمى ماهر", "زياد عادل", "هدى شريف", "رامي وليد",
  "لمياء جمال", "باسم رأفت", "إيمان كمال", "سامح نبيل", "روان أيمن",
  "جون سميث", "إيميلي براون", "مايكل جونسون", "سارة ويلسون", "ديفيد لي",
  "آنا مارتينيز", "جيمس تايلور", "لورا أندرسون", "روبرت كلارك", "صوفيا رودريغيز",
  "ويليام هاريس", "إيما تومسون", "دانيال وايت", "أوليفيا لويس", "كريستوفر ووكر",
  "ميا هال", "بنجامين يونغ", "شارلوت كينغ", "ألكسندر رايت", "إيزابيل سكوت"
];

/* ============ توليد الركاب ============ */
const PASSENGERS = NAMES_AR.map((name, i) => {
  const seatRow = Math.floor(i / 6) + 1;
  const seatLetter = ['A','B','C','D','E','F'][i % 6];

  // مستويات عشوائية
  const pulse = 60 + Math.floor(Math.random() * 40);          // 60-100
  const stress = Math.floor(Math.random() * 100);             // 0-100
  const movement = Math.floor(Math.random() * 100);           // 0-100

  // تحديد الحالة
  let status = 'safe';
  if (stress > 75 || movement > 80) status = 'danger';
  else if (stress > 50 || movement > 55) status = 'warn';

  return {
    id: i + 1,
    name: name,
    seat: seatRow + seatLetter,
    pulse: pulse,
    stress: stress,
    movement: movement,
    status: status
  };
});
