/* ============================================================
   우리 가족 기록장 — app
   순수 HTML/CSS/JS. 모든 기록은 이 기기의 localStorage에만 저장됩니다.
   ============================================================ */
'use strict';

/* ----------------------------- 상수 ----------------------------- */
const STORAGE_KEY = 'family-dashboard.v1';
const WEATHER_CACHE_KEY = 'family-dashboard.weather.v1';
const ULSAN = { lat: 35.5384, lon: 129.3114, label: '울산' };

const MEMBERS = [
  { id: 'yuns',  name: '윤슬', role: '첫째',  sub: '오늘도 반짝반짝',   av: 'rabbit', bg: '#FFEAF1', stamp: '🐰', child: true  },
  { id: 'noeul', name: '노을', role: '둘째',  sub: '포근포근 노을빛',   av: 'chick',  bg: '#FFF5D6', stamp: '🐣', child: true  },
  { id: 'mom',   name: '엄마', role: '엄마',  sub: '수나 · 우리집 요정', av: 'bear',   bg: '#FFEDE2', stamp: '🐻', child: false },
  { id: 'dad',   name: '아빠', role: '아빠',  sub: '성영 · 든든한 기둥', av: 'cat',    bg: '#E3F1FD', stamp: '🐱', child: false },
];
const MEMBER_MAP = Object.fromEntries(MEMBERS.map(m => [m.id, m]));
const CHILDREN = MEMBERS.filter(m => m.child);

const DEFAULT_STUDY = {
  yuns: [
    { text: '받아쓰기 1장 쓰기', amount: 100, fixed: true },
    { text: '수학 문제 2쪽 풀기', amount: 100, fixed: true },
    { text: '책 20분 읽기', amount: 100, fixed: true },
    { text: '영어 단어 10개 보기', amount: 50, fixed: true },
  ],
  noeul: [
    { text: '한글 놀이 1장', amount: 100, fixed: true },
    { text: '책 10분 읽기', amount: 100, fixed: true },
    { text: '숫자 세기 놀이', amount: 50, fixed: true },
  ],
  mom: [
    { text: '요가 10분', amount: 50, fixed: true },
    { text: '독서 20분', amount: 50, fixed: true },
  ],
  dad: [
    { text: '영어 3분 말하기', amount: 50, fixed: true },
    { text: '스트레칭 5분', amount: 50, fixed: true },
  ],
};

const DEFAULT_TODOS = {
  yuns: ['내일 준비물 챙기기', '방 정리하기'],
  noeul: ['장난감 정리하기'],
  mom: ['장보기 목록 쓰기'],
  dad: ['퇴근 후 함께 산책하기'],
};

const MISSIONS = [
  { emoji: '🥕', text: '저녁 준비 같이 돕기' },
  { emoji: '💬', text: '서로 칭찬 한마디 하기' },
  { emoji: '🤸', text: '다 같이 스트레칭 5분' },
  { emoji: '🧺', text: '빨래 개기 다 같이' },
  { emoji: '🚶', text: '저녁 산책 10분' },
  { emoji: '📖', text: '한 사람이 책 읽어 주기' },
  { emoji: '🍊', text: '간식 나눠 먹기' },
  { emoji: '🎵', text: '좋아하는 노래 같이 부르기' },
  { emoji: '🧸', text: '장난감 같이 정리하기' },
  { emoji: '🌙', text: '자기 전 오늘 감사한 일 이야기' },
  { emoji: '🧹', text: '식탁 닦기 다 같이' },
  { emoji: '🍚', text: '밥상 차리기 돕기' },
  { emoji: '💌', text: '가족에게 짧은 쪽지 쓰기' },
  { emoji: '🌱', text: '화분에 물 주기' },
  { emoji: '☁️', text: '하늘 보며 오늘 날씨 이야기' },
  { emoji: '🫧', text: '웃긴 표정 지어 서로 웃기기' },
];

const WMO = {
  0: ['☀️', '맑음'], 1: ['🌤️', '대체로 맑음'], 2: ['⛅', '구름 조금'], 3: ['☁️', '흐림'],
  45: ['🌫️', '안개'], 48: ['🌫️', '서리 안개'],
  51: ['🌦️', '약한 이슬비'], 53: ['🌦️', '이슬비'], 55: ['🌧️', '이슬비'], 56: ['🌧️', '어는 이슬비'], 57: ['🌧️', '어는 이슬비'],
  61: ['🌧️', '약한 비'], 63: ['🌧️', '비'], 65: ['🌧️', '강한 비'], 66: ['🌧️', '어는 비'], 67: ['🌧️', '어는 비'],
  71: ['🌨️', '약한 눈'], 73: ['🌨️', '눈'], 75: ['❄️', '많은 눈'], 77: ['❄️', '싸락눈'],
  80: ['🌦️', '소나기'], 81: ['🌧️', '소나기'], 82: ['⛈️', '강한 소나기'], 85: ['🌨️', '눈 소나기'], 86: ['❄️', '강한 눈 소나기'],
  95: ['⛈️', '뇌우'], 96: ['⛈️', '뇌우 · 우박'], 99: ['⛈️', '강한 뇌우'],
};

const WEEK_LABEL = ['일', '월', '화', '수', '목', '금', '토'];
const STAMP_EMOJI = ['⭐', '🌟', '✨', '💮'];

/* ----------------------------- 유틸 ----------------------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const pad2 = n => String(n).padStart(2, '0');
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeek(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (x.getDay() + 6) % 7; // 월요일 시작
  return addDays(x, -offset);
}
function weekDays(d = new Date()) {
  const s = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}
function money(n) { return Number(n || 0).toLocaleString('ko-KR'); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function hasFinalConsonant(word) {
  const c = String(word || '').charCodeAt(String(word || '').length - 1);
  if (!c || c < 0xAC00 || c > 0xD7A3) return false;
  return (c - 0xAC00) % 28 !== 0;
}
function iGa(name) { return hasFinalConsonant(name) ? '이가' : '가'; }

function timeLabel(ts) {
  const d = new Date(ts);
  let h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  h = h % 12 || 12;
  return `${ampm} ${h}:${pad2(d.getMinutes())}`;
}
function dateLabel(d) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK_LABEL[d.getDay()]}요일`;
}
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ----------------------------- 아바타 SVG ----------------------------- */
function avatarSVG(kind) {
  let inner = '';
  if (kind === 'rabbit') {
    inner = `
      <g>
        <ellipse cx="33" cy="24" rx="8.5" ry="18" fill="#FFF9F1" stroke="#EEDCC8" stroke-width="3" transform="rotate(-9 33 24)"/>
        <ellipse cx="33" cy="26" rx="4" ry="11" fill="#FFD6E1"/>
        <ellipse cx="67" cy="24" rx="8.5" ry="18" fill="#FFF9F1" stroke="#EEDCC8" stroke-width="3" transform="rotate(9 67 24)"/>
        <ellipse cx="67" cy="26" rx="4" ry="11" fill="#FFD6E1"/>
      </g>`;
  } else if (kind === 'chick') {
    inner = `
      <path d="M46 20 q-3 -9 5 -11 q-1 7 4 8 q-2 4 -9 3 z" fill="#FFE08A" stroke="#E9C868" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="50" cy="58" r="32" fill="#FFF9F1" stroke="#EEDCC8" stroke-width="3"/>`;
  } else if (kind === 'bear') {
    inner = `
      <g>
        <circle cx="26" cy="33" r="11" fill="#FFF9F1" stroke="#EEDCC8" stroke-width="3"/>
        <circle cx="26" cy="33" r="5" fill="#FFD3DE"/>
        <circle cx="74" cy="33" r="11" fill="#FFF9F1" stroke="#EEDCC8" stroke-width="3"/>
        <circle cx="74" cy="33" r="5" fill="#FFD3DE"/>
      </g>`;
  } else { /* cat */
    inner = `
      <g>
        <path d="M25 42 L21 15 L45 27 Z" fill="#FFF9F1" stroke="#EEDCC8" stroke-width="3" stroke-linejoin="round"/>
        <path d="M29 34 L27 23 L37 28 Z" fill="#FFD9E3"/>
        <path d="M75 42 L79 15 L55 27 Z" fill="#FFF9F1" stroke="#EEDCC8" stroke-width="3" stroke-linejoin="round"/>
        <path d="M71 34 L73 23 L63 28 Z" fill="#FFD9E3"/>
      </g>`;
  }

  if (kind === 'chick') {
    // 병아리는 부리가 입 역할
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <path d="M46 18 q-3 -9 5 -11 q-1 7 4 8 q-2 4 -9 3 z" fill="#FFE08A" stroke="#E9C868" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="50" cy="58" r="32" fill="#FFF9F1" stroke="#EEDCC8" stroke-width="3"/>
      <path d="M36 57 q5 -7 10 0" stroke="#5A4A3A" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M54 57 q5 -7 10 0" stroke="#5A4A3A" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="31" cy="66" rx="6" ry="4" fill="#FFC2D1" opacity=".8"/>
      <ellipse cx="69" cy="66" rx="6" ry="4" fill="#FFC2D1" opacity=".8"/>
      <path d="M50 64 l7 6 l-7 6 z" fill="#F6B44F" stroke="#E7A03D" stroke-width="1.6" stroke-linejoin="round"/>
    </svg>`;
  }

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
    ${inner}
    <circle cx="50" cy="58" r="32" fill="#FFF9F1" stroke="#EEDCC8" stroke-width="3"/>
    <path d="M36 58 q5 -7 10 0" stroke="#5A4A3A" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M54 58 q5 -7 10 0" stroke="#5A4A3A" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="31" cy="67" rx="6" ry="4" fill="#FFC2D1" opacity=".8"/>
    <ellipse cx="69" cy="67" rx="6" ry="4" fill="#FFC2D1" opacity=".8"/>
    <path d="M46 67 q4 5 8 0" stroke="#5A4A3A" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function avatarHTML(member, extraClass = '') {
  return `<span class="avatar ${extraClass}" style="--av-bg:${member.bg}" aria-hidden="true">${avatarSVG(member.av)}</span>`;
}

/* ----------------------------- 상태 ----------------------------- */
function emptyState() {
  const fixed = {};
  MEMBERS.forEach(m => {
    fixed[m.id] = (DEFAULT_STUDY[m.id] || []).map(it => ({ id: uid(), text: it.text, amount: it.amount }));
  });
  const savings = {};
  MEMBERS.forEach(m => { savings[m.id] = 0; });
  return {
    v: 1,
    savings,
    fixed,
    days: {},
    settings: { allowance: { yuns: 5000, noeul: 5000 } },
    claimed: {},
    chat: [],
    seededTodos: false,
    createdAt: Date.now(),
  };
}

let state = loadState();
let ui = {
  stampChild: 'yuns',
  chatSender: 'yuns',
  calMonth: new Date(),
  calChild: 'yuns',
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (err) {
    console.warn('저장된 기록을 읽지 못했어요.', err);
    return emptyState();
  }
}

function normalizeState(raw) {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  const s = {
    v: 1,
    savings: Object.assign(base.savings, raw.savings || {}),
    fixed: {},
    days: raw.days && typeof raw.days === 'object' ? raw.days : {},
    settings: {
      allowance: Object.assign({ yuns: 5000, noeul: 5000 }, (raw.settings && raw.settings.allowance) || {}),
    },
    claimed: raw.claimed && typeof raw.claimed === 'object' ? raw.claimed : {},
    chat: Array.isArray(raw.chat) ? raw.chat.filter(m => m && m.text) : [],
    seededTodos: !!raw.seededTodos,
    createdAt: raw.createdAt || Date.now(),
  };
  MEMBERS.forEach(m => {
    const list = (raw.fixed && Array.isArray(raw.fixed[m.id])) ? raw.fixed[m.id] : base.fixed[m.id];
    s.fixed[m.id] = list.map(it => ({
      id: it.id || uid(),
      text: String(it.text || ''),
      amount: Number(it.amount) || 0,
    })).filter(it => it.text);
    if (!(m.id in s.savings)) s.savings[m.id] = 0;
  });
  return s;
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('기록을 저장하지 못했어요.', err);
      toast('저장 공간이 부족해 기록을 저장하지 못했어요');
    }
  }, 60);
}

/* ----------------------------- 날짜별 데이터 ----------------------------- */
function getDay(key, create = true) {
  if (!state.days[key]) {
    if (!create) return null;
    const day = { study: {}, todo: {}, mission: null };
    MEMBERS.forEach(m => {
      day.study[m.id] = (state.fixed[m.id] || []).map(f => ({
        id: uid(), fixedId: f.id, text: f.text, amount: f.amount, done: false,
      }));
      day.todo[m.id] = [];
    });
    if (!state.seededTodos) {
      MEMBERS.forEach(m => {
        day.todo[m.id] = (DEFAULT_TODOS[m.id] || []).map(text => ({ id: uid(), text, done: false }));
      });
      state.seededTodos = true;
    }
    state.days[key] = day;
  }
  return state.days[key];
}

/** 오늘 목록에 고정 항목 변경을 반영 */
function syncFixedForDay(key) {
  const day = state.days[key];
  if (!day) return;
  MEMBERS.forEach(m => {
    const list = day.study[m.id] || (day.study[m.id] = []);
    const fixedList = state.fixed[m.id] || [];
    // 새 고정 항목 추가
    fixedList.forEach(f => {
      const found = list.find(it => it.fixedId === f.id);
      if (!found) {
        list.push({ id: uid(), fixedId: f.id, text: f.text, amount: f.amount, done: false });
      } else if (!found.done) {
        found.text = f.text;
        found.amount = f.amount;
      }
    });
    // 지워진 고정 항목 정리 (아직 안 한 것만)
    for (let i = list.length - 1; i >= 0; i--) {
      const it = list[i];
      if (it.fixedId && !fixedList.some(f => f.id === it.fixedId) && !it.done) {
        list.splice(i, 1);
      }
    }
  });
}

/** 그날 그 아이가 이룬 개수 */
function dayDoneCount(key, mid) {
  const day = state.days[key];
  if (!day) return 0;
  const study = (day.study && day.study[mid]) || [];
  const todo = (day.todo && day.todo[mid]) || [];
  return study.filter(i => i.done).length + todo.filter(i => i.done).length;
}

function dayTotalCount(key, mid) {
  const day = state.days[key];
  if (!day) return 0;
  const study = (day.study && day.study[mid]) || [];
  const todo = (day.todo && day.todo[mid]) || [];
  return study.length + todo.length;
}

/** 오늘 기준 주간(월~오늘) 달성률 */
function weeklyStats(mid) {
  const today = new Date();
  const start = startOfWeek(today);
  let done = 0, total = 0, daysCounted = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    if (d > today) break;
    daysCounted++;
    const key = dateKey(d);
    if (state.days[key]) {
      done += dayDoneCount(key, mid);
      total += dayTotalCount(key, mid);
    }
  }
  const target = total > 0 ? Math.ceil(total * 0.9) : 0;
  const pct = total > 0 ? Math.floor((done / total) * 100) : 0;
  const hit = total > 0 && done >= target;
  return { done, total, daysCounted, target, pct, hit, need: Math.max(0, target - done) };
}

function weekStartKey() { return dateKey(startOfWeek(new Date())); }

function isStampDay(key, mid) { return dayDoneCount(key, mid) > 0; }

function streakOf(mid) {
  let d = new Date();
  if (!isStampDay(dateKey(d), mid)) d = addDays(d, -1);
  let n = 0;
  while (isStampDay(dateKey(d), mid)) {
    n++;
    d = addDays(d, -1);
    if (n > 500) break;
  }
  return n;
}

function monthStampCount(mid, ref = new Date()) {
  const y = ref.getFullYear(), mo = ref.getMonth();
  const last = new Date(y, mo + 1, 0).getDate();
  let n = 0;
  for (let day = 1; day <= last; day++) {
    if (isStampDay(dateKey(new Date(y, mo, day)), mid)) n++;
  }
  return n;
}

/* ----------------------------- 효과 ----------------------------- */
function toast(msg) {
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  const items = Array.from(wrap.children);
  if (items.length > 2) items.slice(0, items.length - 2).forEach(n => n.remove());
  setTimeout(() => el.remove(), 2600);
}

function confetti(originX, originY, count = 26) {
  if (prefersReducedMotion()) return;
  const layer = $('#fxLayer');
  const colors = ['#FFD98B', '#FFB3C7', '#A6E0B4', '#9FD3F0', '#D6C2F0', '#FFC98A'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'fx-confetti';
    const x = originX + (Math.random() - 0.5) * 120;
    const y = originY + (Math.random() - 0.5) * 30;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', ((Math.random() - 0.5) * 220).toFixed(0) + 'px');
    p.style.setProperty('--dy', (60 + Math.random() * 220).toFixed(0) + 'px');
    p.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
    p.style.setProperty('--dur', (1.1 + Math.random() * 0.9).toFixed(2) + 's');
    layer.appendChild(p);
    setTimeout(() => p.remove(), 2200);
  }
}

function flyCoin(fromEl, text, toEl) {
  if (!fromEl || !toEl) return;
  flyCoinFromRect(fromEl.getBoundingClientRect(), text, toEl);
}

function flyCoinFromRect(a, text, toEl) {
  if (!a || !toEl) return;
  const b = toEl.getBoundingClientRect();
  const layer = $('#fxLayer');
  const el = document.createElement('div');
  el.className = 'fx-coin';
  el.textContent = text;
  el.style.left = (a.left + a.width / 2 - 14) + 'px';
  el.style.top = (a.top + a.height / 2 - 10) + 'px';
  el.style.setProperty('--dx', ((b.left + b.width / 2) - (a.left + a.width / 2)).toFixed(0) + 'px');
  el.style.setProperty('--dy', ((b.top + b.height / 2) - (a.top + a.height / 2)).toFixed(0) + 'px');
  layer.appendChild(el);
  setTimeout(() => el.remove(), 950);
  toEl.classList.remove('piggy-bump');
  void toEl.offsetWidth;
  toEl.classList.add('piggy-bump');
}

function hifivePop(anchorEl) {
  if (prefersReducedMotion()) return;
  const r = anchorEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'hifive-pop';
  el.textContent = '🙌';
  el.style.left = (r.left + r.width / 2 - 18) + 'px';
  el.style.top = (r.top - 6) + 'px';
  $('#fxLayer').appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

/* ----------------------------- 렌더: 헤더 ----------------------------- */
function renderHeader() {
  const now = new Date();
  $('#todayDate').textContent = dateLabel(now);
}

/* ----------------------------- 렌더: 날씨 ----------------------------- */
function gradePM(value, type) {
  if (value == null || Number.isNaN(value)) return { label: '—', cls: 'unknown' };
  const v = Math.round(value);
  const cuts = type === 'pm25' ? [15, 35, 75] : [30, 80, 150];
  if (v <= cuts[0]) return { label: `좋음 ${v}`, cls: '' };
  if (v <= cuts[1]) return { label: `보통 ${v}`, cls: 'lv2' };
  if (v <= cuts[2]) return { label: `나쁨 ${v}`, cls: 'lv3' };
  return { label: `매우나쁨 ${v}`, cls: 'lv4' };
}

function renderWeather(data) {
  const emoji = $('#weatherEmoji'), temp = $('#weatherTemp'), desc = $('#weatherDesc');
  const range = $('#weatherRange');
  const b10 = $('#badgePm10'), b25 = $('#badgePm25'), tip = $('#weatherTip');

  if (!data) {
    emoji.textContent = '🌫️';
    temp.textContent = '--°';
    desc.textContent = '날씨를 불러오지 못했어요';
    range.textContent = '최저 -° · 최고 -°';
    b10.textContent = '미세먼지 —';
    b25.textContent = '초미세먼지 —';
    b10.className = 'badge unknown';
    b25.className = 'badge unknown';
    tip.textContent = '📶 연결되면 다시 불러올게요';
    return;
  }

  const info = data.code != null && WMO[data.code] ? WMO[data.code] : ['🌤️', '날씨 정보 없음'];
  emoji.textContent = info[0];
  temp.textContent = (data.temp != null ? Math.round(data.temp) : '--') + '°';
  desc.textContent = info[1] + (data.cached ? ' · 저장된 값' : '');
  const lo = data.min != null ? Math.round(data.min) : '-';
  const hi = data.max != null ? Math.round(data.max) : '-';
  range.textContent = `최저 ${lo}° · 최고 ${hi}°`;

  const g10 = gradePM(data.pm10, 'pm10');
  const g25 = gradePM(data.pm25, 'pm25');
  b10.textContent = `미세먼지 ${g10.label}`;
  b25.textContent = `초미세먼지 ${g25.label}`;
  b10.className = 'badge ' + g10.cls;
  b25.className = 'badge ' + g25.cls;

  const worst = Math.max(
    g10.cls === 'lv4' ? 4 : g10.cls === 'lv3' ? 3 : g10.cls === 'lv2' ? 2 : g10.cls === '' ? 1 : 0,
    g25.cls === 'lv4' ? 4 : g25.cls === 'lv3' ? 3 : g25.cls === 'lv2' ? 2 : g25.cls === '' ? 1 : 0
  );
  if (worst >= 3) tip.textContent = '😷 오늘은 마스크 챙겨요';
  else if (data.code >= 51 && data.code <= 67) tip.textContent = '☔ 우산 챙기는 게 좋아요';
  else if (data.code >= 71 && data.code <= 86) tip.textContent = '🧣 따뜻하게 입고 나가요';
  else if (data.temp != null && data.temp <= 3) tip.textContent = '🧥 아침은 많이 추워요';
  else if (data.temp != null && data.temp >= 26) tip.textContent = '🧊 시원한 물 자주 마셔요';
  else tip.textContent = '😊 오늘도 좋은 하루 보내요';
}

async function fetchJson(url, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function readWeatherCache() {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

async function fetchWeather() {
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${ULSAN.lat}&longitude=${ULSAN.lon}`
    + '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min'
    + '&timezone=Asia%2FSeoul&forecast_days=1';
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${ULSAN.lat}&longitude=${ULSAN.lon}`
    + '&current=pm10,pm2_5&timezone=Asia%2FSeoul';

  const cache = readWeatherCache() || {};
  const data = Object.assign({}, cache);
  if (cache.temp != null || cache.pm10 != null || cache.pm25 != null) {
    renderWeather(Object.assign({}, cache, { cached: true }));
  }

  const hasAny = () => data.temp != null || data.pm10 != null || data.pm25 != null;
  const persist = () => { try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data)); } catch (_) {} };

  // 도착하는 대로 바로 보여 주기 (한쪽이 늦어도 다른 쪽은 먼저 뜨도록)
  const weatherTask = fetchJson(forecastUrl).then(v => {
    if (!v || !v.current) return;
    data.code = v.current.weather_code;
    data.temp = v.current.temperature_2m;
    if (v.daily && v.daily.temperature_2m_min) data.min = v.daily.temperature_2m_min[0];
    if (v.daily && v.daily.temperature_2m_max) data.max = v.daily.temperature_2m_max[0];
    data.at = Date.now();
    persist();
    renderWeather(Object.assign({}, data, { cached: false }));
  }).catch(() => {});

  const airTask = fetchJson(airUrl).then(v => {
    if (!v || !v.current) return;
    data.pm10 = v.current.pm10;
    data.pm25 = v.current.pm2_5;
    data.airAt = Date.now();
    persist();
    renderWeather(Object.assign({}, data, { cached: false }));
  }).catch(() => {});

  const settled = await Promise.allSettled([weatherTask, airTask]);
  const anyFresh = settled.some(r => r.status === 'fulfilled');
  if (!anyFresh) {
    renderWeather(hasAny() ? Object.assign({}, data, { cached: true }) : null);
  }
}

/* ----------------------------- 렌더: 가족 현황 ----------------------------- */
function renderFamily() {
  const key = dateKey();
  const list = $('#familyList');
  list.innerHTML = MEMBERS.map(m => {
    const stars = dayDoneCount(key, m.id);
    const balance = state.savings[m.id] || 0;
    return `
      <li class="family-row">
        ${avatarHTML(m)}
        <div class="family-name">
          <div class="nm">${esc(m.name)} <span class="role">${esc(m.role)}</span></div>
          <div class="sub">${esc(m.sub)}</div>
        </div>
        <div class="family-stats">
          <div class="star-box"><span class="star" aria-hidden="true">★</span>${stars}</div>
          <div class="piggy-box" id="piggy-${m.id}">
            <div class="piggy-amount">${money(balance)}원 <span aria-hidden="true">🐷</span></div>
            <div class="piggy-label">돼지저금통</div>
          </div>
        </div>
      </li>`;
  }).join('');
}

/* ----------------------------- 렌더: 주간 달성률 ----------------------------- */
function renderWeekly() {
  const wed = weekDays();
  $('#weekRange').textContent = `${wed[0].getMonth() + 1}.${wed[0].getDate()} ~ ${wed[6].getMonth() + 1}.${wed[6].getDate()}`;
  const wk = weekStartKey();
  const html = CHILDREN.map(m => {
    const s = weeklyStats(m.id);
    const claimed = !!(state.claimed[wk] && state.claimed[wk][m.id]);
    const allow = state.settings.allowance[m.id] || 0;
    let reward;
    if (claimed) {
      reward = `<button class="weekly-reward claimed" type="button" disabled>✅ 이번 주 용돈 받았어요</button>`;
    } else if (s.hit) {
      reward = `<button class="weekly-reward ready" type="button" data-claim="${m.id}">💰 용돈 저금통에 넣기</button>`;
    } else {
      reward = `<button class="weekly-reward" type="button" disabled>90% 되면 열려요</button>`;
    }
    const left = s.total === 0
      ? '이번 주 항목을 채워 보세요'
      : (s.hit ? `주간 용돈 ${money(allow)}원 준비 완료!` : `90%까지 ${s.need}개 더 하면 돼요`);
    return `
      <div class="weekly-row">
        <div class="weekly-top">
          ${avatarHTML(m)}
          <div class="weekly-who">
            <div class="n">${esc(m.name)}</div>
            <div class="c">이번 주 ${s.done} / ${s.total} 완료 · 용돈 ${money(allow)}원</div>
          </div>
          <div class="weekly-pct ${s.hit ? 'hit' : ''}">${s.pct}%</div>
        </div>
        <div class="gauge" role="img" aria-label="주간 달성률 ${s.pct}퍼센트, 목표 90퍼센트">
          <div class="gauge-fill ${s.hit ? 'hit' : ''}" style="width:${clamp(s.pct, 0, 100)}%"></div>
          <span class="gauge-mark" aria-hidden="true"></span>
        </div>
        <div class="weekly-bottom">
          <span class="weekly-left">${esc(left)}</span>
          ${reward}
        </div>
        ${s.hit && !claimed ? `<div class="weekly-badge">🎉 목표 90% 달성! 용돈 받기 가능!</div>` : ''}
      </div>`;
  }).join('');
  $('#weeklyList').innerHTML = html;
}

function claimAllowance(mid) {
  const s = weeklyStats(mid);
  if (!s.hit) { toast('아직 90%가 안 됐어요. 조금만 더!'); return; }
  const wk = weekStartKey();
  if (state.claimed[wk] && state.claimed[wk][mid]) return;
  const btn = document.querySelector(`[data-claim="${mid}"]`);
  const btnRect = btn ? btn.getBoundingClientRect()
    : { left: innerWidth / 2 - 40, top: innerHeight / 2, width: 80, height: 30 };
  const allow = state.settings.allowance[mid] || 0;
  state.claimed[wk] = state.claimed[wk] || {};
  state.claimed[wk][mid] = true;
  state.savings[mid] = (state.savings[mid] || 0) + allow;
  save();
  renderFamily();
  renderWeekly();
  const piggy = document.getElementById(`piggy-${mid}`);
  if (piggy) flyCoinFromRect(btnRect, `+${money(allow)}원 🪙`, piggy);
  confetti(btnRect.left + btnRect.width / 2, btnRect.top, 34);
  toast(`${MEMBER_MAP[mid].name}${iGa(MEMBER_MAP[mid].name)} 주간 용돈 ${money(allow)}원을 받았어요! 저금통에 쏙 🐷`);
}

/* ----------------------------- 렌더: 도장판 ----------------------------- */
function renderStamp() {
  const mid = ui.stampChild;
  const m = MEMBER_MAP[mid];
  $('#stampChildEmoji').textContent = m.stamp;
  $('#stampChildName').textContent = m.name;
  $('#stampGuide').textContent = `${m.name}${iGa(m.name)} 그날 공부나 루틴을 하나라도 마치면 도장이 찍혀요`;

  $('#stampTabs').innerHTML = CHILDREN.map(c => `
    <button class="stamp-tab ${c.id === mid ? 'is-active' : ''}" type="button" data-child="${c.id}"
      role="tab" aria-selected="${c.id === mid}">
      ${avatarHTML(c)} ${esc(c.name)}
    </button>`).join('');

  const today = dateKey();
  const days = weekDays();
  $('#stampWeek').innerHTML = days.map(d => {
    const key = dateKey(d);
    const done = isStampDay(key, mid);
    const cls = ['stamp-circle', done ? 'done' : '', key === today ? 'is-today' : '', d > new Date() ? 'future' : ''].join(' ');
    const inner = done
      ? `<span class="stamp-emoji" title="도장">${m.stamp}</span>`
      : `<span style="opacity:.25">·</span>`;
    return `<div class="stamp-day">
      <span class="lbl">${WEEK_LABEL[d.getDay()]}</span>
      <div class="${cls}" aria-label="${d.getMonth() + 1}월 ${d.getDate()}일 ${done ? '도장 찍음' : '아직'}">${inner}</div>
    </div>`;
  }).join('');

  $('#streakBadge').textContent = `🔥 ${streakOf(mid)}일 연속`;
  $('#stampCount').textContent = `이번 달 도장 ${monthStampCount(mid)}개`;
}

/* ----------------------------- 렌더: 미션 ----------------------------- */
function currentMission() {
  const day = getDay(dateKey());
  if (!day.mission) {
    const i = Math.floor(Math.random() * MISSIONS.length);
    day.mission = { idx: i, count: 0 };
    save();
  }
  return day.mission;
}

function renderMission() {
  const ms = currentMission();
  const m = MISSIONS[ms.idx] || MISSIONS[0];
  $('#missionEmoji').textContent = m.emoji;
  $('#missionText').textContent = m.text;
  $('#missionCount').textContent = `함께 ${ms.count || 0}번`;
}

function rerollMission() {
  const day = getDay(dateKey());
  const cur = day.mission ? day.mission.idx : -1;
  let next = cur;
  while (next === cur) next = Math.floor(Math.random() * MISSIONS.length);
  day.mission = { idx: next, count: day.mission ? day.mission.count : 0 };
  save();
  const emojiEl = $('#missionEmoji');
  emojiEl.classList.remove('mission-flip');
  void emojiEl.offsetWidth;
  emojiEl.classList.add('mission-flip');
  renderMission();
}

function completeMission() {
  const day = getDay(dateKey());
  const ms = currentMission();
  ms.count = (ms.count || 0) + 1;
  day.mission = ms;
  save();
  renderMission();
  const el = $('#missionCount');
  const r = el.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + 10, 30);
  toast(`가족 미션 ${ms.count}번째 완료! 멋져요 🙌`);
}

/* ----------------------------- 렌더: 공부 플랜 ----------------------------- */
function renderStudy() {
  const key = dateKey();
  const day = getDay(key);
  let doneAll = 0, totalAll = 0;

  $('#studyMembers').innerHTML = MEMBERS.map(m => {
    const items = day.study[m.id] || [];
    const done = items.filter(i => i.done).length;
    doneAll += done; totalAll += items.length;
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    const rows = items.length ? items.map(it => `
      <div class="study-item ${it.done ? 'is-done' : ''}" data-member="${m.id}" data-id="${it.id}">
        <button class="check ${it.done ? 'on' : ''}" type="button" data-act="study-toggle"
          aria-pressed="${it.done}" aria-label="${esc(it.text)} ${it.done ? '완료 취소' : '완료'}">${it.done ? '✓' : ''}</button>
        <span class="si-text">${esc(it.text)}</span>
        ${it.amount > 0 ? `<span class="si-amount">${money(it.amount)}원</span>` : ''}
        <span class="si-actions">
          <button class="mini-btn" type="button" data-act="study-edit" aria-label="${esc(it.text)} 수정">✏️</button>
          <button class="mini-btn danger" type="button" data-act="study-del" aria-label="${esc(it.text)} 삭제">✕</button>
        </span>
      </div>`).join('')
      : `<p class="study-empty">아직 항목이 없어요</p>`;

    return `
      <div class="study-block" data-member="${m.id}">
        <div class="study-block-head">
          ${avatarHTML(m)}
          <span class="who">${esc(m.name)}의 공부</span>
          <span class="cnt">${done}/${items.length} 완료</span>
        </div>
        <div class="study-mini-bar" aria-hidden="true"><div class="study-mini-fill" style="width:${pct}%"></div></div>
        <div class="study-items">${rows}</div>
        <button class="study-add" type="button" data-add="study" data-member="${m.id}">+ ${esc(m.name)} 공부 추가</button>
      </div>`;
  }).join('');

  const pctAll = totalAll ? Math.round((doneAll / totalAll) * 100) : 0;
  $('#studyOverall').textContent = `${doneAll} / ${totalAll} 완료`;
  $('#studyOverallBar').style.width = pctAll + '%';
}

function toggleStudy(mid, id, btnEl) {
  const day = getDay(dateKey());
  const item = (day.study[mid] || []).find(i => i.id === id);
  if (!item) return;
  item.done = !item.done;
  if (item.done) {
    const amount = Number(item.amount) || 0;
    if (amount > 0) {
      state.savings[mid] = (state.savings[mid] || 0) + amount;
      save();
      renderFamily();
      const piggy = document.getElementById(`piggy-${mid}`);
      flyCoin(btnEl, `+${money(amount)}원 🪙`, piggy);
      toast(`${MEMBER_MAP[mid].name}${iGa(MEMBER_MAP[mid].name)} 저금통에 ${money(amount)}원 적립!`);
    }
  } else {
    const amount = Number(item.amount) || 0;
    if (amount > 0) {
      state.savings[mid] = Math.max(0, (state.savings[mid] || 0) - amount);
    }
  }
  save();
  renderStudy();
  renderWeekly();
  renderStamp();
  renderFamily();
}

function deleteStudy(mid, id) {
  const day = getDay(dateKey());
  const list = day.study[mid] || [];
  const idx = list.findIndex(i => i.id === id);
  if (idx < 0) return;
  const target = list[idx];
  const msg = target.fixedId
    ? '이 항목은 고정 항목이라 내일 다시 올라와요. 오늘 목록에서만 지울까요?\n(매일 목록에서 빼려면 ⚙️ 고정 항목 관리)'
    : '이 공부 항목을 지울까요?';
  if (!confirm(msg)) return;
  const [removed] = list.splice(idx, 1);
  if (removed.done && removed.amount) {
    state.savings[mid] = Math.max(0, (state.savings[mid] || 0) - removed.amount);
  }
  save();
  renderStudy(); renderWeekly(); renderStamp(); renderFamily();
}

/* ----------------------------- 렌더: 할 일 ----------------------------- */
function renderTodo() {
  const key = dateKey();
  const day = getDay(key);
  $('#todoMembers').innerHTML = MEMBERS.map(m => {
    const items = day.todo[m.id] || [];
    const done = items.filter(i => i.done).length;
    const allDone = items.length > 0 && done === items.length;
    const rows = items.length ? items.map(it => `
      <div class="todo-item ${it.done ? 'is-done' : ''}" data-member="${m.id}" data-id="${it.id}">
        <button class="check ${it.done ? 'on' : ''}" type="button" data-act="todo-toggle"
          aria-pressed="${it.done}" aria-label="${esc(it.text)} ${it.done ? '완료 취소' : '완료'}">${it.done ? '✓' : ''}</button>
        <span class="ti-text">${esc(it.text)}</span>
        <span class="si-actions">
          <button class="mini-btn" type="button" data-act="todo-edit" aria-label="${esc(it.text)} 수정">✏️</button>
          <button class="mini-btn danger" type="button" data-act="todo-del" aria-label="${esc(it.text)} 삭제">✕</button>
        </span>
      </div>`).join('')
      : `<p class="todo-empty">오늘 할 일을 적어 보세요</p>`;

    return `
      <div class="todo-block ${allDone ? 'hifive' : ''}" data-member="${m.id}">
        <div class="todo-block-head">
          ${avatarHTML(m)}
          <span class="who">${esc(m.name)}
            ${allDone ? '<span class="hifive-badge">🙌 하이파이브!</span>' : ''}
          </span>
          <span class="todo-count">${done}/${items.length} 완료</span>
        </div>
        <div class="todo-items">${rows}</div>
        <button class="todo-add" type="button" data-add="todo" data-member="${m.id}">+ ${esc(m.name)} 할 일 추가</button>
      </div>`;
  }).join('');
}

function toggleTodo(mid, id, btnEl) {
  const day = getDay(dateKey());
  const item = (day.todo[mid] || []).find(i => i.id === id);
  if (!item) return;
  item.done = !item.done;
  save();
  const wasAll = (day.todo[mid] || []).length > 0 && (day.todo[mid] || []).every(i => i.done);
  renderTodo();
  renderWeekly(); renderStamp(); renderFamily();
  if (item.done && wasAll) {
    const block = document.querySelector(`.todo-block[data-member="${mid}"]`);
    hifivePop(block || btnEl);
    const r = (block || btnEl).getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + 20, 28);
    toast(`${MEMBER_MAP[mid].name}${iGa(MEMBER_MAP[mid].name)} 할 일 모두 완료! 하이파이브 🙌`);
  }
}

function deleteTodo(mid, id) {
  if (!confirm('이 할 일을 지울까요?')) return;
  const day = getDay(dateKey());
  day.todo[mid] = (day.todo[mid] || []).filter(i => i.id !== id);
  save();
  renderTodo(); renderWeekly(); renderStamp(); renderFamily();
}

/* ----------------------------- 렌더: 채팅 ----------------------------- */
function renderChat() {
  const log = $('#chatLog');
  if (!state.chat.length) {
    log.innerHTML = `<p class="chat-empty">아직 한마디가 없어요. 첫 마디를 남겨 보세요 💌</p>`;
  } else {
    log.innerHTML = state.chat.slice(-40).map(msg => {
      const m = MEMBER_MAP[msg.member] || MEMBERS[0];
      return `<div class="chat-msg">
        ${avatarHTML(m)}
        <div class="bubble-wrap">
          <div class="bubble-meta">${esc(m.name)} · ${timeLabel(msg.ts)}</div>
          <div class="bubble">${esc(msg.text)}</div>
        </div>
      </div>`;
    }).join('');
    log.scrollTop = log.scrollHeight;
  }

  $('#chatSenders').innerHTML = MEMBERS.map(m => `
    <button class="sender-chip ${ui.chatSender === m.id ? 'is-active' : ''}" type="button" data-sender="${m.id}"
      aria-pressed="${ui.chatSender === m.id}">
      ${avatarHTML(m)} ${esc(m.name)}
    </button>`).join('');
}

function sendChat() {
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  state.chat.push({ id: uid(), member: ui.chatSender, text, ts: Date.now() });
  if (state.chat.length > 200) state.chat = state.chat.slice(-200);
  input.value = '';
  save();
  renderChat();
  const log = $('#chatLog');
  log.scrollTop = log.scrollHeight;
}

/* ----------------------------- 렌더 전체 ----------------------------- */
function renderAll() {
  renderHeader();
  renderFamily();
  renderWeekly();
  renderStamp();
  renderMission();
  renderStudy();
  renderTodo();
  renderChat();
}

/* ----------------------------- 고정 항목 관리 ----------------------------- */
function renderFixedModal() {
  const body = $('#fixedBody');
  body.innerHTML = MEMBERS.map(m => {
    const list = state.fixed[m.id] || [];
    const rows = list.length ? list.map(f => `
      <div class="fixed-item" data-member="${m.id}" data-fid="${f.id}">
        <span class="txt">${esc(f.text)}</span>
        ${f.amount > 0 ? `<span class="si-amount">${money(f.amount)}원</span>` : ''}
        <button class="mini-btn" type="button" data-act="fixed-edit" aria-label="수정">✏️</button>
        <button class="mini-btn danger" type="button" data-act="fixed-del" aria-label="삭제">✕</button>
      </div>`).join('') : `<p class="study-empty">고정 항목이 없어요</p>`;
    return `<div class="fixed-member" data-member="${m.id}">
      <div class="fixed-member-head">${avatarHTML(m)} ${esc(m.name)}의 고정 항목</div>
      ${rows}
      <button class="fixed-add" type="button" data-add="fixed" data-member="${m.id}">+ 고정 항목 추가</button>
    </div>`;
  }).join('');
}

/* ----------------------------- 달력 ----------------------------- */
function renderCalendar() {
  const mid = ui.calChild;
  const ref = ui.calMonth;
  $('#calMonth').textContent = `${ref.getFullYear()}년 ${ref.getMonth() + 1}월`;
  $('#calTabs').innerHTML = CHILDREN.map(c => `
    <button class="stamp-tab ${c.id === mid ? 'is-active' : ''}" type="button" data-calchild="${c.id}" role="tab" aria-selected="${c.id === mid}">
      ${avatarHTML(c)} ${esc(c.name)}
    </button>`).join('');

  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const today = dateKey();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push('<div class="cal-cell empty"></div>');
  for (let d = 1; d <= last; d++) {
    const key = dateKey(new Date(ref.getFullYear(), ref.getMonth(), d));
    const done = isStampDay(key, mid);
    const cls = ['cal-cell', done ? 'done' : '', key === today ? 'today' : ''].join(' ');
    cells.push(`<div class="${cls}" aria-label="${ref.getMonth() + 1}월 ${d}일 ${done ? '도장' : ''}">${d}</div>`);
  }
  $('#calGrid').innerHTML = cells.join('');
}

/* ----------------------------- 모달 ----------------------------- */
let lastFocus = null;
function openModal(id) {
  lastFocus = document.activeElement;
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = false;
  document.body.style.overflow = 'hidden';
  const focusable = el.querySelector('input, button');
  if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 60);
}
function closeModal(el) {
  const node = typeof el === 'string' ? document.getElementById(el) : el;
  if (!node) return;
  node.hidden = true;
  if (!$$('.modal:not([hidden])').length) document.body.style.overflow = '';
  if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (_) {} }
}
function closeAllModals() {
  $$('.modal').forEach(m => { m.hidden = true; });
  document.body.style.overflow = '';
}

/* 항목 편집기 */
const itemEditor = { kind: 'study', member: null, id: null };

function fillAmountChips(amount) {
  $$('#amountPresets .chip').forEach(c => {
    c.classList.toggle('is-active', Number(c.dataset.amount) === Number(amount));
  });
}

function openItemModal(kind, memberId, id = null) {
  itemEditor.kind = kind;
  itemEditor.member = memberId;
  itemEditor.id = id;
  const m = MEMBER_MAP[memberId];
  let text = '', amount = 100, fixed = kind === 'fixed';

  if (kind === 'fixed') {
    const f = (state.fixed[memberId] || []).find(x => x.id === id);
    if (f) { text = f.text; amount = f.amount; }
    $('#itemTitle').textContent = id ? `✏️ ${m.name} 고정 항목 수정` : `➕ ${m.name} 고정 항목 추가`;
  } else {
    const day = getDay(dateKey());
    const it = (day.study[memberId] || []).find(x => x.id === id);
    if (it) { text = it.text; amount = it.amount; fixed = !!it.fixedId; }
    $('#itemTitle').textContent = id ? `✏️ ${m.name} 공부 수정` : `➕ ${m.name} 공부 추가`;
  }

  $('#itemText').value = text;
  $('#itemAmount').value = amount;
  $('#itemFixed').checked = fixed;
  $('#itemFixed').parentElement.style.display = kind === 'fixed' ? 'none' : 'flex';
  fillAmountChips(amount);
  openModal('modalItem');
  setTimeout(() => $('#itemText').focus({ preventScroll: true }), 80);
}

function saveItemModal() {
  const text = $('#itemText').value.trim();
  const amount = clamp(Number($('#itemAmount').value) || 0, 0, 100000);
  const fixed = $('#itemFixed').checked;
  if (!text) { toast('내용을 적어 주세요'); $('#itemText').focus(); return; }
  const mid = itemEditor.member;
  const day = getDay(dateKey());

  if (itemEditor.kind === 'fixed') {
    const list = state.fixed[mid] || (state.fixed[mid] = []);
    if (itemEditor.id) {
      const f = list.find(x => x.id === itemEditor.id);
      if (f) { f.text = text; f.amount = amount; }
      // 오늘 목록의 미완료 복사본도 갱신
      (day.study[mid] || []).forEach(it => {
        if (it.fixedId === itemEditor.id && !it.done) { it.text = text; it.amount = amount; }
      });
    } else {
      const f = { id: uid(), text, amount };
      list.push(f);
      (day.study[mid] || (day.study[mid] = [])).push({ id: uid(), fixedId: f.id, text, amount, done: false });
    }
  } else {
    const list = day.study[mid] || (day.study[mid] = []);
    if (itemEditor.id) {
      const it = list.find(x => x.id === itemEditor.id);
      if (it) {
        it.text = text;
        if (!it.done) it.amount = amount;
        if (it.fixedId) {
          const f = (state.fixed[mid] || []).find(x => x.id === it.fixedId);
          if (f) { f.text = text; f.amount = amount; }
          if (!fixed) {
            state.fixed[mid] = (state.fixed[mid] || []).filter(x => x.id !== it.fixedId);
            it.fixedId = null;
          }
        } else if (fixed) {
          const f = { id: uid(), text, amount };
          (state.fixed[mid] || (state.fixed[mid] = [])).push(f);
          it.fixedId = f.id;
        }
      }
    } else {
      const entry = { id: uid(), fixedId: null, text, amount, done: false };
      if (fixed) {
        const f = { id: uid(), text, amount };
        (state.fixed[mid] || (state.fixed[mid] = [])).push(f);
        entry.fixedId = f.id;
      }
      list.push(entry);
    }
  }

  save();
  closeModal('modalItem');
  renderStudy(); renderWeekly(); renderStamp();
  renderFixedModal();
  toast('저장했어요');
}

/* 할 일 편집기 */
const todoEditor = { member: null, id: null };
function openTodoModal(memberId, id = null) {
  todoEditor.member = memberId;
  todoEditor.id = id;
  const day = getDay(dateKey());
  const it = id ? (day.todo[memberId] || []).find(x => x.id === id) : null;
  $('#todoModalTitle').textContent = `${id ? '✏️' : '➕'} ${MEMBER_MAP[memberId].name} 할 일 ${id ? '수정' : '추가'}`;
  $('#todoText').value = it ? it.text : '';
  openModal('modalTodo');
  setTimeout(() => $('#todoText').focus({ preventScroll: true }), 80);
}
function saveTodoModal() {
  const text = $('#todoText').value.trim();
  if (!text) { toast('할 일을 적어 주세요'); $('#todoText').focus(); return; }
  const day = getDay(dateKey());
  const list = day.todo[todoEditor.member] || (day.todo[todoEditor.member] = []);
  if (todoEditor.id) {
    const it = list.find(x => x.id === todoEditor.id);
    if (it) it.text = text;
  } else {
    list.push({ id: uid(), text, done: false });
  }
  save();
  closeModal('modalTodo');
  renderTodo(); renderWeekly(); renderStamp(); renderFamily();
}

/* 설정 */
function openSettings() {
  $('#setAllowYuns').value = state.settings.allowance.yuns;
  $('#setAllowNoeul').value = state.settings.allowance.noeul;
  openModal('modalSettings');
}
function saveSettings() {
  state.settings.allowance.yuns = clamp(Number($('#setAllowYuns').value) || 0, 0, 1000000);
  state.settings.allowance.noeul = clamp(Number($('#setAllowNoeul').value) || 0, 0, 1000000);
  save();
  renderWeekly();
  closeModal('modalSettings');
  toast('설정을 저장했어요');
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `우리가족기록장-${dateKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('백업 파일을 내려받았어요');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed || typeof parsed !== 'object' || !parsed.days) throw new Error('형식이 달라요');
      if (!confirm('지금 기록을 백업 파일로 바꿀까요? 되돌릴 수 없어요.')) return;
      state = normalizeState(parsed);
      save();
      renderAll();
      closeModal('modalSettings');
      toast('백업을 불러왔어요');
    } catch (err) {
      toast('이 파일은 불러올 수 없어요');
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm('모든 기록을 지우고 처음부터 시작할까요? 되돌릴 수 없어요.')) return;
  state = emptyState();
  save();
  renderAll();
  closeModal('modalSettings');
  toast('처음 상태로 되돌렸어요');
}

/* ----------------------------- 타이머 ----------------------------- */
const timer = {
  mode: 'down',
  duration: 600,
  remain: 600,
  elapsed: 0,
  running: false,
  endAt: 0,
  acc: 0,
  iv: null,
  ringing: false,
};

function fmt(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

function renderTimer() {
  const disp = $('#timerDisplay');
  const hint = $('#timerHint');
  const startBtn = $('#btnTimerStart');
  if (timer.mode === 'down') {
    disp.textContent = fmt(timer.remain);
    if (timer.running) hint.textContent = '집중하는 중… 파이팅!';
    else if (timer.remain === 0) hint.textContent = '시간이 다 됐어요';
    else hint.textContent = `${Math.round(timer.duration / 60)}분 · 시작을 눌러요`;
  } else {
    disp.textContent = fmt(timer.elapsed);
    hint.textContent = timer.running ? '재는 중… 파이팅!' : '재는 시간 · 시작을 눌러요';
  }
  startBtn.textContent = timer.running ? '⏸ 일시정지' : '▶ 시작';
  $('#timer').classList.toggle('is-running', timer.running);
  $$('#modeDown, #modeUp').forEach(b => {
    const on = b.id === (timer.mode === 'down' ? 'modeDown' : 'modeUp');
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', String(on));
  });
  $$('#timerPresets .chip').forEach(c => {
    c.classList.toggle('is-active', timer.mode === 'down' && Number(c.dataset.min) * 60 === timer.duration);
  });
}

function tick() {
  if (!timer.running) return;
  if (timer.mode === 'down') {
    const remain = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    timer.remain = remain;
    if (remain <= 0) {
      finishTimer();
      return;
    }
  } else {
    timer.elapsed = timer.acc + Math.floor((Date.now() - timer.endAt) / 1000);
  }
  renderTimer();
}

function startTimer() {
  if (timer.running) { pauseTimer(); return; }
  ensureAudio();
  if (timer.mode === 'down') {
    if (timer.remain <= 0) timer.remain = timer.duration;
    timer.endAt = Date.now() + timer.remain * 1000;
  } else {
    timer.endAt = Date.now();
    timer.acc = timer.elapsed;
  }
  timer.running = true;
  clearInterval(timer.iv);
  timer.iv = setInterval(tick, 250);
  renderTimer();
}

function pauseTimer() {
  if (!timer.running) return;
  tick();
  timer.running = false;
  if (timer.mode === 'up') timer.acc = timer.elapsed;
  clearInterval(timer.iv);
  renderTimer();
}

function resetTimer() {
  timer.running = false;
  clearInterval(timer.iv);
  timer.remain = timer.duration;
  timer.elapsed = 0;
  timer.acc = 0;
  timer.ringing = false;
  renderTimer();
}

function setDuration(min) {
  timer.duration = clamp(Math.round(min), 1, 180) * 60;
  timer.remain = timer.duration;
  timer.mode = 'down';
  timer.running = false;
  clearInterval(timer.iv);
  renderTimer();
}

function finishTimer() {
  timer.running = false;
  timer.remain = 0;
  clearInterval(timer.iv);
  renderTimer();
  timer.ringing = true;
  $('#timer').classList.add('is-alarm');
  playAlarm();
  if (navigator.vibrate) { try { navigator.vibrate([300, 150, 300, 150, 500]); } catch (_) {} }
  openModal('modalAlarm');
  const r = { left: innerWidth / 2 - 20, top: innerHeight / 2 - 60 };
  confetti(r.left, r.top, 24);
}

/* Web Audio 알림음 */
let audioCtx = null;
function ensureAudio() {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (_) {}
}
function beep(freq, start, dur, gainVal = 0.18, type = 'sine') {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, audioCtx.currentTime + start);
  g.gain.linearRampToValueAtTime(gainVal, audioCtx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + start + dur);
  osc.connect(g).connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + start);
  osc.stop(audioCtx.currentTime + start + dur + 0.05);
}
function playAlarm() {
  ensureAudio();
  if (!audioCtx) return;
  const notes = [880, 1046.5, 1318.5];
  // 세 번 울리는 산뜻한 알림음
  [0, 1.2, 2.4].forEach((base, round) => {
    notes.forEach((f, i) => beep(f, base + i * 0.16, 0.35, round === 0 ? 0.2 : 0.16, 'sine'));
    beep(659.25, base + 0.55, 0.5, 0.1, 'triangle');
  });
}

/* ----------------------------- 이벤트 연결 ----------------------------- */
function bindEvents() {
  // 설정/공유
  $('#btnSettings').addEventListener('click', openSettings);
  $('#btnShare').addEventListener('click', async () => {
    const shareData = { title: '우리 가족 기록장', text: '우리집의 포근한 하루를 함께 기록해요 🏡', url: location.href };
    try {
      if (navigator.share && location.protocol.startsWith('http')) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(location.href);
        toast('주소를 복사했어요');
      } else {
        toast('브라우저 주소창의 주소를 복사해 주세요');
      }
    } catch (_) { /* 사용자가 취소한 경우 */ }
  });

  // 모달 공통 닫기
  document.addEventListener('click', e => {
    const closer = e.target.closest('[data-close]');
    if (closer) { const m = closer.closest('.modal'); if (m) closeModal(m); return; }
    if (e.target.classList && e.target.classList.contains('modal')) closeModal(e.target);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const open = $$('.modal:not([hidden])');
      if (open.length) closeModal(open[open.length - 1]);
    }
  });

  // 주간 용돈
  $('#weeklyList').addEventListener('click', e => {
    const btn = e.target.closest('[data-claim]');
    if (btn) claimAllowance(btn.dataset.claim);
  });

  // 도장판 탭
  $('#stampTabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-child]');
    if (!tab) return;
    ui.stampChild = tab.dataset.child;
    renderStamp();
  });
  $('#btnCalendar').addEventListener('click', () => {
    ui.calChild = ui.stampChild;
    ui.calMonth = new Date();
    renderCalendar();
    openModal('modalCalendar');
  });
  $('#calPrev').addEventListener('click', () => {
    ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  $('#calNext').addEventListener('click', () => {
    ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  $('#calTabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-calchild]');
    if (!tab) return;
    ui.calChild = tab.dataset.calchild;
    renderCalendar();
  });

  // 미션
  $('#btnMissionDone').addEventListener('click', completeMission);
  $('#btnMissionReroll').addEventListener('click', rerollMission);

  // 공부 플랜
  $('#studyMembers').addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add="study"]');
    if (addBtn) { openItemModal('study', addBtn.dataset.member, null); return; }
    const actBtn = e.target.closest('[data-act]');
    if (!actBtn) return;
    const row = actBtn.closest('[data-member]');
    if (!row) return;
    const mid = row.dataset.member, id = row.dataset.id;
    const act = actBtn.dataset.act;
    if (act === 'study-toggle') toggleStudy(mid, id, actBtn);
    else if (act === 'study-edit') openItemModal('study', mid, id);
    else if (act === 'study-del') deleteStudy(mid, id);
  });
  $('#btnAddStudy').addEventListener('click', () => openItemModal('study', 'yuns', null));
  $('#btnFixedItems').addEventListener('click', () => { renderFixedModal(); openModal('modalFixed'); });
  $('#btnFixedFromSettings').addEventListener('click', () => { closeModal('modalSettings'); renderFixedModal(); openModal('modalFixed'); });

  $('#fixedBody').addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add="fixed"]');
    if (addBtn) { openItemModal('fixed', addBtn.dataset.member, null); return; }
    const actBtn = e.target.closest('[data-act]');
    if (!actBtn) return;
    const row = actBtn.closest('.fixed-item');
    const mid = row.dataset.member, fid = row.dataset.fid;
    if (actBtn.dataset.act === 'fixed-edit') openItemModal('fixed', mid, fid);
    if (actBtn.dataset.act === 'fixed-del') openFixedDelete(mid, fid);
  });

  // 타이머
  $('#modeDown').addEventListener('click', () => { timer.mode = 'down'; resetTimer(); renderTimer(); });
  $('#modeUp').addEventListener('click', () => { timer.mode = 'up'; resetTimer(); renderTimer(); });
  $('#btnTimerStart').addEventListener('click', startTimer);
  $('#btnTimerReset').addEventListener('click', resetTimer);
  $('#timerPresets').addEventListener('click', e => {
    const chip = e.target.closest('[data-min]');
    if (!chip) return;
    setDuration(Number(chip.dataset.min));
  });
  $('#btnCustomMinutes').addEventListener('click', () => {
    const v = Number($('#customMinutes').value);
    if (!v) { toast('분을 입력해 주세요'); $('#customMinutes').focus(); return; }
    setDuration(v);
  });
  $('#customMinutes').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); $('#btnCustomMinutes').click(); }
  });
  $('#btnAlarmOk').addEventListener('click', () => {
    closeModal('modalAlarm');
    $('#timer').classList.remove('is-alarm');
    timer.ringing = false;
    resetTimer();
  });

  // 할 일
  $('#todoMembers').addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add="todo"]');
    if (addBtn) { openTodoModal(addBtn.dataset.member, null); return; }
    const actBtn = e.target.closest('[data-act]');
    if (!actBtn) return;
    const row = actBtn.closest('[data-member]');
    if (!row) return;
    const mid = row.dataset.member, id = row.dataset.id;
    const act = actBtn.dataset.act;
    if (act === 'todo-toggle') toggleTodo(mid, id, actBtn);
    else if (act === 'todo-edit') openTodoModal(mid, id);
    else if (act === 'todo-del') deleteTodo(mid, id);
  });

  // 채팅
  $('#chatSenders').addEventListener('click', e => {
    const chip = e.target.closest('[data-sender]');
    if (!chip) return;
    ui.chatSender = chip.dataset.sender;
    renderChat();
  });
  $('#btnChatSend').addEventListener('click', sendChat);
  $('#chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); sendChat(); }
  });

  // 설정 모달
  $('#btnSettingsSave').addEventListener('click', saveSettings);
  $('#btnExport').addEventListener('click', exportJSON);
  $('#btnImport').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (f) importJSON(f);
    e.target.value = '';
  });
  $('#btnReset').addEventListener('click', resetAll);

  // 항목 모달
  $('#btnItemSave').addEventListener('click', saveItemModal);
  $('#amountPresets').addEventListener('click', e => {
    const chip = e.target.closest('[data-amount]');
    if (!chip) return;
    $('#itemAmount').value = chip.dataset.amount;
    fillAmountChips(Number(chip.dataset.amount));
  });
  $('#itemAmount').addEventListener('input', () => fillAmountChips(Number($('#itemAmount').value)));
  $('#itemText').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); saveItemModal(); }
  });

  // 할 일 모달
  $('#btnTodoSave').addEventListener('click', saveTodoModal);
  $('#todoText').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); saveTodoModal(); }
  });

  // 자정 지나면 새 날로
  setInterval(() => {
    const key = dateKey();
    if (ui.currentDay !== key) {
      const isFirst = !ui.currentDay;
      ui.currentDay = key;
      if (!isFirst) {
        getDay(key);
        syncFixedForDay(key);
        renderAll();
      }
    }
  }, 30000);
}

function openFixedDelete(mid, fid) {
  if (!confirm('이 고정 항목을 지울까요? (오늘 목록에서도 지워져요)')) return;
  state.fixed[mid] = (state.fixed[mid] || []).filter(f => f.id !== fid);
  const day = getDay(dateKey());
  day.study[mid] = (day.study[mid] || []).filter(it => !(it.fixedId === fid && !it.done));
  save();
  renderFixedModal();
  renderStudy(); renderWeekly(); renderStamp();
}

/* ----------------------------- 시작 ----------------------------- */
function init() {
  getDay(dateKey());
  syncFixedForDay(dateKey());
  ui.currentDay = dateKey();
  renderAll();
  renderTimer();
  bindEvents();
  fetchWeather();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.__familyInit) { window.__familyInit = true; init(); }
});
if (document.readyState !== 'loading') {
  if (!window.__familyInit) { window.__familyInit = true; init(); }
}
