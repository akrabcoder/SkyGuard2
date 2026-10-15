/* ============================================
   SkyGuard — البيانات الكاملة
   ============================================ */

/* ============ الترجمات ============ */
const TR = {
  ar: {
    sub: "نظام مراقبة وتحكم الطيران الذكي",
    btn: "دخول", map: "الخريطة", pass: "الركاب",
    alerts: "الإنذارات", log: "السجل", online: "النظام يعمل",
    from: "من", to: "إلى", speed: "السرعة", alt: "الارتفاع",
    eta: "الوصول المتوقع", emg: "طوارئ", alertsT: "الإنذارات",
    logT: "سجل الأحداث", flightInfo: "بيانات الرحلة",
    safe: "آمن", warn: "اشتباه", danger: "خطر",
    noAlerts: "لا توجد إنذارات حالياً ✅",
    emergencyOn: "تم تفعيل وضع الطوارئ — جاري التحويل لأقرب مطار",
    nearest: "أقرب مطار", detected: "تم اكتشاف سلوك مشبوه",
    pulse: "النبض", stress: "التوتر", movement: "الحركة",
    bpm: "نبضة/د", cabinView: "مقصورة الطائرة",
    selectPassenger: "اختر راكب لعرض بياناته",
    passport: "رقم الجواز", ticket: "رقم التذكرة",
    destination: "الوجهة", nationality: "الجنسية",
    age: "العمر", class: "الدرجة", economy: "اقتصادية",
    business: "أعمال", first: "أولى",
    vitals: "المؤشرات الحيوية", info: "معلومات الراكب",
    focusMap: "عرض على الخريطة",
    aiAnalysis: "تحليل الذكاء الاصطناعي",
    normalBehavior: "سلوك طبيعي",
    suspiciousBehavior: "سلوك مشبوه",
    criticalBehavior: "تهديد محتمل"
  },
  en: {
    sub: "Smart Flight Monitoring & Control System",
    btn: "Login", map: "Map", pass: "Passengers",
    alerts: "Alerts", log: "Flight Log", online: "System Online",
    from: "From", to: "To", speed: "Speed", alt: "Altitude",
    eta: "ETA", emg: "EMERGENCY", alertsT: "Alerts",
    logT: "Event Log", flightInfo: "Flight Info",
    safe: "Safe", warn: "Warning", danger: "Danger",
    noAlerts: "No alerts currently ✅",
    emergencyOn: "Emergency activated — Diverting to nearest airport",
    nearest: "Nearest Airport", detected: "Suspicious behavior detected",
    pulse: "Pulse", stress: "Stress", movement: "Movement",
    bpm: "bpm", cabinView: "Cabin View",
    selectPassenger: "Select a passenger to view details",
    passport: "Passport", ticket: "Ticket No.",
    destination: "Destination", nationality: "Nationality",
    age: "Age", class: "Class", economy: "Economy",
    business: "Business", first: "First",
    vitals: "Vitals", info: "Passenger Info",
    focusMap: "Focus on map",
    aiAnalysis: "AI Analysis",
    normalBehavior: "Normal behavior",
    suspiciousBehavior: "Suspicious behavior",
    criticalBehavior: "Potential threat"
  }
};

/* ============ المطارات ============ */
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
  JFK: { name: "New York JFK", nameAr: "نيويورك", lat: 40.6413, lng: -73.7781 },
  LAX: { name: "Los Angeles", nameAr: "لوس أنجلوس", lat: 33.9416, lng: -118.4085 },
  ORD: { name: "Chicago", nameAr: "شيكاغو", lat: 41.9742, lng: -87.9073 },
  YYZ: { name: "Toronto", nameAr: "تورونتو", lat: 43.6777, lng: -79.6248 },
  GRU: { name: "São Paulo", nameAr: "ساو باولو", lat: -23.4356, lng: -46.4731 },
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
  KHI: { name: "Karachi", nameAr: "كراتشي", lat: 24.9065, lng: 67.1608 },
  MCT: { name: "Muscat", nameAr: "مسقط", lat: 23.5933, lng: 58.2844 },
  BAH: { name: "Bahrain", nameAr: "البحرين", lat: 26.2708, lng: 50.6336 }
};

/* ============ الرحلة ============ */
const FLIGHT = {
  number: "AA-1024",
  from: "CAI",
  to: "LHR",
  speed: 850,
  altitude: 11000
};

/* ============ الأسماء ============ */
const NAMES = [
  "Ahmed Mohamed", "Fatma Ali", "Mohamed Hassan", "Sara Ibrahim", "Omar Khaled",
  "Layla Youssef", "Youssef Ahmed", "Nour Abdullah", "Karim Sami", "Heba Mahmoud",
  "Ali Reda", "Mariam Fouad", "Hassan Tarek", "Dina Mostafa", "Khaled Samir",
  "Reem Amr", "Mostafa Kamel", "Amina Nasser", "Ayman Salah", "Yasmin Reda",
  "Tarek Hossam", "Salma Maher", "Ziad Adel", "Hoda Sherif", "Ramy Waleed",
  "Lamia Gamal", "Bassem Raafat", "Iman Kamal", "Sameh Nabil", "Rawan Ayman",
  "John Smith", "Emily Brown", "Michael Johnson", "Sarah Wilson", "David Lee",
  "Anna Martinez", "James Taylor", "Laura Anderson", "Robert Clark", "Sofia Rodriguez",
  "William Harris", "Emma Thompson", "Daniel White", "Olivia Lewis", "Christopher Walker",
  "Mia Hall", "Benjamin Young", "Charlotte King", "Alexander Wright", "Isabel Scott",
  "Omar Farouk", "Nadia Hassan", "Yousef Ali", "Rana Magdy"
];

const NATIONALITIES = [
  "مصري / Egyptian", "سعودي / Saudi", "إماراتي / Emirati", "أمريكي / American",
  "بريطاني / British", "فرنسي / French", "ألماني / German", "إيطالي / Italian",
  "تركي / Turkish", "هندي / Indian", "صيني / Chinese", "ياباني / Japanese"
];

const DESTINATIONS = [
  "London (LHR)", "Paris (CDG)", "New York (JFK)",
  "Dubai (DXB)", "Tokyo (NRT)", "Rome (FCO)"
];

/* ============ توليد الركاب ============ */
const PASSENGERS = NAMES.map((name, i) => {
  const row = Math.floor(i / 6) + 1;
  const letter = ['A','B','C','D','E','F'][i % 6];

  const pulse = 60 + Math.floor(Math.random() * 40);
  const stress = Math.floor(Math.random() * 100);
  const movement = Math.floor(Math.random() * 100);
  const age = 18 + Math.floor(Math.random() * 55);
  const passport = "P" + (1000000 + Math.floor(Math.random() * 9000000));
  const ticket = "TKT-" + (10000 + Math.floor(Math.random() * 90000));
  const nationality = NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)];
  const destination = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
  const seatClass = age > 45 && Math.random() > 0.6 ? 'business' : 'economy';

  let status = 'safe';
  if (stress > 75 || movement > 80 || pulse > 120) status = 'danger';
  else if (stress > 50 || movement > 55) status = 'warn';

  return {
    id: i + 1,
    name: name,
    seat: row + letter,
    row: row,
    letter: letter,
    pulse: pulse,
    stress: stress,
    movement: movement,
    age: age,
    passport: passport,
    ticket: ticket,
    nationality: nationality,
    destination: destination,
    seatClass: seatClass,
    status: status
  };
});
