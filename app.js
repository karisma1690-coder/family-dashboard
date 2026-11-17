/* ============================================================
   우리 가족 기록장 — app
   순수 HTML/CSS/JS. 모든 기록은 이 기기의 localStorage에만 저장됩니다.
   ============================================================ */
'use strict';

/* ----------------------------- 상수 ----------------------------- */
const STORAGE_KEY = 'family-dashboard.v1';
const WEATHER_CACHE_KEY = 'family-dashboard.weather.v1';
const FUN_KEY = 'family-dashboard.fun.v1';
const ULSAN = { lat: 35.5384, lon: 129.3114, label: '울산' };

/* 아빠 현재 상태 · 댄스 */
const DAD_STATUSES = [
  { id: 'work',    emoji: '💼', label: '일하는 중', cls: 'st-work' },
  { id: 'home',    emoji: '🏠', label: '집 도착',   cls: 'st-home' },
  { id: 'workout', emoji: '🏋️', label: '운동 중',   cls: 'st-workout' },
  { id: 'dance',   emoji: '🕺', label: '춤추는 중', cls: 'st-dance' },
];
const DANCE_LINES = [
  '아빠 신났다! 🕺',
  '윤슬·노을 하이파이브! 🙌',
  '둠칫 둠칫~ 🎶',
  '우리 가족 최고! 💛',
  '아빠가 제일 신나! 🥳',
];
const DANCE_EMOJI = ['🎵', '🎶', '✨', '💫', '⭐'];
const DANCE_MS = 4500;

/* 주크박스 — 추천 노래(유튜브 영상 ID 직접 확인) */
const JUKE_PRESETS = [
  { emoji: '🦈', label: '아기상어',       id: '761ae_KDg_Q' },
  { emoji: '🐻', label: '곰 세 마리',     id: 'BzGY5oaoDzs' },
  { emoji: '⭐', label: '작은 별',       id: 'tIRul7vW_b0' },
  { emoji: '🐧', label: '뽀로로 동요',    id: 'DK0c-Ka4AyM' },
  { emoji: '🍌', label: '바나나 차차',    id: 'heFqQ9B7zIU' },
  { emoji: '🎉', label: '신나는 율동동요', id: '3aG3JZGQy0o' },
];
const JUKE_RECENT_MAX = 6;

/* 여행 보드 — 권역 (지도 위 위치는 지도 너비·높이의 %예요) */
const TRAVEL_REGIONS = [
  { id: 'seoul',     name: '서울·경기', short: '서울',      emoji: '🏙️', x: 25, y: 24 },
  { id: 'gangwon',   name: '강원',      short: '강원',      emoji: '⛰️', x: 59, y: 26 },
  { id: 'chung',     name: '충청',      short: '충청',      emoji: '🌰', x: 36, y: 41 },
  { id: 'gyeongbuk', name: '경주·대구', short: '경주·대구', emoji: '🏯', x: 60, y: 50 },
  { id: 'ulsan',     name: '울산',      short: '울산',      emoji: '⚓', x: 71, y: 60 },
  { id: 'busan',     name: '부산',      short: '부산',      emoji: '🌊', x: 66, y: 68 },
  { id: 'jeolla',    name: '여수·전라', short: '전라',      emoji: '🍃', x: 31, y: 62 },
  { id: 'jeju',      name: '제주',      short: '제주',      emoji: '🍊', x: 29, y: 85 },
  { id: 'world',     name: '해외·기타', short: '해외',      emoji: '✈️', x: 88, y: 81 },
];
const TV_REGION_MAP = Object.fromEntries(TRAVEL_REGIONS.map(r => [r.id, r]));

/** 여행 보드 처음 모습 — 가볍고 일반적인 예시만 둬요 (공개 페이지라 민감정보 없음) */
function defaultTravel() {
  return [
    { id: uid(), name: '경주',   region: 'gyeongbuk', status: 'been', when: '2025-08',      memo: '불국사랑 황리단길 산책' },
    { id: uid(), name: '제주도', region: 'jeju',      status: 'wish', when: '다음 봄방학',  memo: '바다 보고 싶어요' },
  ];
}

function normalizeTravel(list) {
  if (!Array.isArray(list)) return defaultTravel();
  return list
    .filter(t => t && t.name)
    .map(t => ({
      id: t.id || uid(),
      name: String(t.name).slice(0, 20),
      region: TV_REGION_MAP[t.region] ? t.region : 'world',
      status: t.status === 'been' ? 'been' : 'wish',
      when: String(t.when || '').slice(0, 20),
      memo: String(t.memo || '').slice(0, 40),
    }));
}

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
    travel: defaultTravel(),
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
    travel: normalizeTravel(raw.travel),
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

/* ----------------------------- 놀이: 아빠 댄스 · 효과음 ----------------------------- */
let fun = loadFun();

function loadFun() {
  const base = { dadStatus: 'work', muted: false, recent: [] };
  try {
    const raw = localStorage.getItem(FUN_KEY);
    if (!raw) return base;
    const o = JSON.parse(raw) || {};
    return {
      dadStatus: DAD_STATUSES.some(s => s.id === o.dadStatus) ? o.dadStatus : 'work',
      muted: !!o.muted,
      recent: Array.isArray(o.recent) ? o.recent.filter(r => r && r.q).slice(0, JUKE_RECENT_MAX) : [],
    };
  } catch (err) {
    return base;
  }
}
function saveFun() {
  try { localStorage.setItem(FUN_KEY, JSON.stringify(fun)); } catch (err) { /* 저장 실패는 괜찮아요 */ }
}
function dadStatus() {
  return DAD_STATUSES.find(s => s.id === fun.dadStatus) || DAD_STATUSES[0];
}

/* Web Audio — 짧고 경쾌한 8비트 멜로디 */
let danceAudioCtx = null;
function ensureDanceAudio() {
  if (fun.muted) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!danceAudioCtx) {
    try { danceAudioCtx = new AC(); } catch (err) { return null; }
  }
  if (danceAudioCtx.state === 'suspended') danceAudioCtx.resume().catch(() => {});
  return danceAudioCtx;
}

const DANCE_MELODY = [
  [72, .16], [76, .16], [79, .16], [84, .32],
  [83, .16], [79, .16], [84, .34],
  [86, .16], [84, .16], [79, .16], [76, .32],
  [79, .16], [76, .16], [72, .42],
];

function playDanceTune() {
  if (fun.muted) return;
  const ctx = ensureDanceAudio();
  if (!ctx) return;
  const midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);
  const t0 = ctx.currentTime + 0.03;
  const master = ctx.createGain();
  master.gain.value = 0.13;
  master.connect(ctx.destination);

  let t = t0;
  DANCE_MELODY.forEach(([m, d]) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(midiToFreq(m), t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d * 0.9);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + d + 0.02);
    t += d * 0.95;
  });

  // 마지막 화음 (딩동!)
  [72, 76, 79, 84].forEach((m, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = i === 3 ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(midiToFreq(m + 12), t + 0.02);
    g.gain.setValueAtTime(0.0001, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.7, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(g); g.connect(master);
    osc.start(t + 0.02); osc.stop(t + 0.6);
  });
}

const danceState = { stopTimer: null, noteTimer: null, bubbleIdx: 0 };

function danceLayerFor(row) {
  let layer = row.querySelector('.dance-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'dance-layer';
    layer.setAttribute('aria-hidden', 'true');
    row.appendChild(layer);
  }
  return layer;
}

function spawnDanceNotes(row, layer, n) {
  if (prefersReducedMotion()) return;
  const av = row.querySelector('.avatar') || row;
  const ar = av.getBoundingClientRect();
  const rr = row.getBoundingClientRect();
  const baseX = ar.left - rr.left + ar.width / 2;
  const baseY = ar.top - rr.top + 4;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    el.className = 'dance-note';
    el.textContent = DANCE_EMOJI[Math.floor(Math.random() * DANCE_EMOJI.length)];
    el.style.left = (baseX + (Math.random() - 0.5) * 36).toFixed(0) + 'px';
    el.style.top = baseY.toFixed(0) + 'px';
    el.style.setProperty('--nx', ((Math.random() - 0.5) * 64).toFixed(0) + 'px');
    el.style.setProperty('--nr', ((Math.random() - 0.5) * 70).toFixed(0) + 'deg');
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

function showDanceBubble(layer) {
  Array.from(layer.querySelectorAll('.dance-bubble')).forEach(n => n.remove());
  const el = document.createElement('div');
  el.className = 'dance-bubble';
  el.textContent = fun.dadStatus === 'dance'
    ? '춤추는 중! 🕺'
    : DANCE_LINES[danceState.bubbleIdx++ % DANCE_LINES.length];
  layer.appendChild(el);
}

/** 아빠 댄스 — 다시 누르면 처음부터 이어서 춤 (4.5초) */
function dadDance() {
  const row = document.querySelector('.family-row[data-member="dad"]');
  if (!row) return;
  const avatar = row.querySelector('.avatar');
  const layer = danceLayerFor(row);

  row.classList.remove('is-dancing');
  if (avatar) avatar.classList.remove('is-dancing');
  void row.offsetWidth; // 애니메이션 재시작
  row.classList.add('is-dancing');
  if (avatar) avatar.classList.add('is-dancing');

  showDanceBubble(layer);
  spawnDanceNotes(row, layer, 4);

  clearInterval(danceState.noteTimer);
  danceState.noteTimer = setInterval(() => spawnDanceNotes(row, layer, 2), 520);
  clearTimeout(danceState.stopTimer);
  danceState.stopTimer = setTimeout(() => {
    clearInterval(danceState.noteTimer);
    row.classList.remove('is-dancing');
    if (avatar) avatar.classList.remove('is-dancing');
    const b = layer.querySelector('.dance-bubble');
    if (b) b.remove();
  }, DANCE_MS);

  playDanceTune();
  const r = row.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + 24, 16);
}

/** 엄마·윤슬·노을 — 작은 반응 */
function memberCheer(mid) {
  const row = document.querySelector(`.family-row[data-member="${mid}"]`);
  if (!row) return;
  const avatar = row.querySelector('.avatar');
  const layer = danceLayerFor(row);
  if (avatar) {
    avatar.classList.remove('is-cheer');
    void avatar.offsetWidth;
    avatar.classList.add('is-cheer');
    setTimeout(() => avatar.classList.remove('is-cheer'), 800);
  }
  spawnDanceNotes(row, layer, 5);
  const r = row.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + 22, 10);
}

function setDadStatus(id) {
  if (!DAD_STATUSES.some(s => s.id === id)) return;
  fun.dadStatus = id;
  saveFun();
  renderFamily();
  renderDadStatus();
  dadDance();
  const st = dadStatus();
  toast(`아빠 지금 ${st.emoji} ${st.label}`);
}

function updateSoundToggle() {
  const btn = $('#btnSound');
  if (!btn) return;
  btn.textContent = fun.muted ? '🔇' : '🔊';
  btn.classList.toggle('is-muted', fun.muted);
  btn.setAttribute('aria-pressed', String(fun.muted));
  btn.setAttribute('title', fun.muted ? '춤 효과음 꺼짐 (누르면 켜기)' : '춤 효과음 켜짐 (누르면 끄기)');
}

function toggleSound() {
  fun.muted = !fun.muted;
  saveFun();
  updateSoundToggle();
  if (fun.muted) {
    toast('춤 효과음을 껐어요 🔇');
  } else {
    playDanceTune();
    toast('춤 효과음을 켰어요 🔊');
  }
}

/* ----------------------------- 렌더: 아빠 상태 칩 ----------------------------- */
function renderDadStatus() {
  const chips = $('#dadStatusChips');
  if (!chips) return;
  const cur = dadStatus();
  chips.innerHTML = DAD_STATUSES.map(s => `
    <button class="dad-chip ${s.id === cur.id ? 'is-active' : ''}" type="button" data-dad-status="${s.id}"
      aria-pressed="${s.id === cur.id}"><span aria-hidden="true">${s.emoji}</span> ${esc(s.label)}</button>`).join('');
  const label = $('#dadStatusLabel');
  if (label) label.textContent = `🕺 아빠 지금 · ${cur.label}`;
  updateSoundToggle();
}

/* ----------------------------- 주크박스 ----------------------------- */
let jukeNow = null; // { q, label, videoId }

function ytIdFrom(text) {
  const m = String(text || '').match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function isYouTubeUrl(text) {
  const t = String(text || '').trim();
  return /^https?:\/\//i.test(t) || /^youtu\.be\//i.test(t);
}
function matchPreset(q) {
  const flat = s => String(s || '').replace(/\s+/g, '').toLowerCase();
  const target = flat(q);
  return JUKE_PRESETS.find(p => flat(p.label) === target || flat(p.label).includes(target) || target.includes(flat(p.label))) || null;
}
function jukeLabel(q) {
  if (ytIdFrom(q) && isYouTubeUrl(q)) return '붙여넣은 유튜브 영상';
  return q;
}

function addJukeRecent(item) {
  fun.recent = [item].concat(fun.recent.filter(r => r.q !== item.q)).slice(0, JUKE_RECENT_MAX);
  saveFun();
}

function scrollToPlayer() {
  const player = $('#jukePlayer');
  if (!player) return;
  try { player.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' }); } catch (_) { /* 무시 */ }
}

/** 대시보드 안 임베드 플레이어로 재생 (유튜브 영상 ID가 있을 때) */
function playJukeVideo(videoId, label, opts = {}) {
  const q = opts.q || label;
  jukeNow = { q, label, videoId };
  const wrap = $('#jukeFrameWrap');
  if (wrap) {
    wrap.hidden = false;
    wrap.innerHTML = '';
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1&autoplay=1`;
    frame.title = `${label} 유튜브 플레이어`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.setAttribute('allowfullscreen', '');
    wrap.appendChild(frame);
  }
  const panel = $('#jukeSearchPanel');
  if (panel) panel.hidden = true;
  const player = $('#jukePlayer');
  if (player) player.hidden = false;
  const now = $('#jukeNow');
  if (now) now.textContent = `▶ 지금 트는 중 · ${label}`;
  const inp = $('#jukeInput');
  if (inp) inp.value = q;

  addJukeRecent({ q, label, videoId });
  renderJukePresets();
  renderJukeRecent();
  syncMusicLinks();
  if (opts.scroll !== false) scrollToPlayer();
}

/** 검색어가 영상 링크/추천 목록에 없을 때 — 유튜브로 바로 넘기는 패널 */
function showJukeSearch(q) {
  jukeNow = { q, label: q, videoId: null };
  const wrap = $('#jukeFrameWrap');
  if (wrap) { wrap.innerHTML = ''; wrap.hidden = true; }
  const panel = $('#jukeSearchPanel');
  if (panel) panel.hidden = false;
  const text = $('#jukePanelText');
  if (text) text.textContent = `🔎 ‘${q}’ — 대시보드에서 바로 재생되지 않는 곡은 아래 버튼으로 한 번에 틀 수 있어요.`;
  const link = $('#linkJukePanelYT');
  if (link) link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  const player = $('#jukePlayer');
  if (player) player.hidden = false;
  const now = $('#jukeNow');
  if (now) now.textContent = `🔎 ‘${q}’ — 유튜브에서 찾아 틀어요`;

  addJukeRecent({ q, label: q, videoId: null });
  renderJukePresets();
  renderJukeRecent();
  syncMusicLinks();
  scrollToPlayer();
}

/** 검색&듣기: ① 유튜브 링크 → 인앱 재생, ② 추천곡이면 인앱 재생, ③ 그 밖은 유튜브로 연결 */
function jumpJuke(raw) {
  const q = String(raw == null ? '' : raw).trim().replace(/\s+/g, ' ');
  if (!q) {
    toast('듣고 싶은 노래 제목을 적어 주세요');
    const inp = $('#jukeInput');
    if (inp) inp.focus();
    return;
  }
  const vid = ytIdFrom(q);
  if (vid) { playJukeVideo(vid, jukeLabel(q), { q }); return; }
  const preset = matchPreset(q);
  if (preset) { playJukeVideo(preset.id, preset.label, { q: preset.label }); return; }
  showJukeSearch(q);
}

function stopJuke() {
  const wrap = $('#jukeFrameWrap');
  if (wrap) { wrap.innerHTML = ''; wrap.hidden = false; }
  const panel = $('#jukeSearchPanel');
  if (panel) panel.hidden = true;
  const player = $('#jukePlayer');
  if (player) player.hidden = true;
  jukeNow = null;
  renderJukePresets();
  renderJukeRecent();
  syncMusicLinks();
  toast('음악을 멈췄어요 ⏹');
}

function musicUrlFor(q, videoId) {
  if (videoId) return `https://music.youtube.com/watch?v=${videoId}`;
  return `https://music.youtube.com/search?q=${encodeURIComponent(q)}`;
}

/** 유튜브 뮤직 버튼(링크)의 주소를 지금 노래에 맞춰 바꿔 둡니다. */
function syncMusicLinks() {
  const typed = (($('#jukeInput') && $('#jukeInput').value) || '').trim();
  const q = typed || (jukeNow && jukeNow.q) || '';
  // 입력한 곡이 지금 트는 곡과 같을 때만 영상 ID로 바로 열어요
  const videoId = (jukeNow && jukeNow.videoId && jukeNow.q === q) ? jukeNow.videoId : null;
  const href = q ? musicUrlFor(q, videoId) : 'https://music.youtube.com/';
  ['#btnJukeMusic', '#btnJukePanelMusic'].forEach(sel => {
    const el = $(sel);
    if (el) el.href = href;
  });
  return q;
}

/** 링크 클릭: 노래가 없으면 안내만 하고 이동은 막아요. */
function onMusicLinkClick(e) {
  if (!syncMusicLinks()) {
    e.preventDefault();
    toast('먼저 노래 제목을 적어 주세요');
    const inp = $('#jukeInput');
    if (inp) inp.focus();
  }
}

function renderJukePresets() {
  const box = $('#jukePresets');
  if (!box) return;
  const cur = jukeNow && jukeNow.videoId;
  box.innerHTML = JUKE_PRESETS.map(p => `
    <button class="juke-chip preset ${cur === p.id ? 'is-playing' : ''}" type="button"
      data-preset="${esc(p.label)}" data-video="${esc(p.id)}"><span aria-hidden="true">${p.emoji}</span> ${esc(p.label)}</button>`).join('');
}

function renderJukeRecent() {
  const box = $('#jukeRecent');
  if (!box) return;
  if (!fun.recent.length) {
    box.innerHTML = '<span class="juke-recent-empty">아직 들은 노래가 없어요</span>';
    return;
  }
  box.innerHTML = fun.recent.map(r => `
    <button class="juke-chip recent ${jukeNow && jukeNow.q === r.q ? 'is-playing' : ''}" type="button"
      data-recent="${esc(r.q)}" data-video="${esc(r.videoId || '')}" title="${esc(r.label)}">${r.videoId ? '🎵' : '🔎'} ${esc(r.label)}</button>`).join('');
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
    renderBoardWeather(null);
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

  // 캘린더 보드 배너 날씨도 함께 갱신
  renderBoardWeather(data);
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
    + '&hourly=temperature_2m,weather_code&forecast_days=2'
    + '&timezone=Asia%2FSeoul';
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
    if (v.hourly && Array.isArray(v.hourly.time)) {
      data.hourly = { time: v.hourly.time, temp: v.hourly.temperature_2m, code: v.hourly.weather_code };
    }
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
    const isDad = m.id === 'dad';
    const st = dadStatus();
    const tap = isDad
      ? ` data-tap="dad" tabindex="0" role="button" aria-label="아빠 지금 ${esc(st.label)} — 누르면 춤을 춰요"`
      : ` data-tap="cheer"`;
    return `
      <li class="family-row" data-member="${m.id}"${tap}>
        ${avatarHTML(m)}
        <div class="family-name">
          <div class="nm">${esc(m.name)} <span class="role">${esc(m.role)}</span></div>
          <div class="sub">${esc(m.sub)}</div>
          ${isDad ? `<span class="dad-badge ${st.cls}" id="dadBadge"><span aria-hidden="true">${st.emoji}</span> ${esc(st.label)}</span>` : ''}
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
  renderDadStatus();
  renderWeekly();
  renderStamp();
  renderMission();
  renderStudy();
  renderTodo();
  renderChat();
  renderTravelCard();
  renderTravel();
  renderBoardTicker();
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
  if (!confirm('모든 기록을 지울까요? 처음부터 시작합니다. 되돌릴 수 없어요.')) return;
  state = emptyState();
  fun = { dadStatus: 'work', muted: false, recent: [] };
  saveFun();
  stopJuke();
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

  // 아빠 댄스 · 가족 반응
  $('#familyList').addEventListener('click', e => {
    const row = e.target.closest('.family-row');
    if (!row) return;
    if (row.dataset.member === 'dad') dadDance();
    else if (row.dataset.member) memberCheer(row.dataset.member);
  });
  $('#familyList').addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const row = e.target.closest('.family-row');
    if (!row || row.dataset.member !== 'dad') return;
    e.preventDefault();
    dadDance();
  });

  // 아빠 상태 칩 · 효과음 토글
  $('#dadStatusChips').addEventListener('click', e => {
    const chip = e.target.closest('[data-dad-status]');
    if (chip) setDadStatus(chip.dataset.dadStatus);
  });
  $('#btnSound').addEventListener('click', toggleSound);

  // 주크박스
  $('#btnJukeSearch').addEventListener('click', () => jumpJuke($('#jukeInput').value));
  $('#jukeInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); jumpJuke($('#jukeInput').value); }
  });
  $('#jukePresets').addEventListener('click', e => {
    const chip = e.target.closest('[data-preset]');
    if (!chip || !chip.dataset.video) return;
    playJukeVideo(chip.dataset.video, chip.dataset.preset, { q: chip.dataset.preset });
  });
  $('#jukeRecent').addEventListener('click', e => {
    const chip = e.target.closest('[data-recent]');
    if (!chip) return;
    if (chip.dataset.video) playJukeVideo(chip.dataset.video, chip.dataset.recent, { q: chip.dataset.recent });
    else jumpJuke(chip.dataset.recent);
  });
  $('#btnJukeMusic').addEventListener('click', onMusicLinkClick);
  $('#btnJukePanelMusic').addEventListener('click', onMusicLinkClick);
  $('#jukeInput').addEventListener('input', syncMusicLinks);
  $('#btnJukeStop').addEventListener('click', stopJuke);

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
  renderJukePresets();
  renderJukeRecent();
  renderTimer();
  bindEvents();
  initBoard();
  initTravel();
  fetchWeather();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    // 새 버전 서비스워커가 자리를 잡으면 한 번만 새로 고쳐 최신 화면으로 맞춰요.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      location.reload();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.__familyInit) { window.__familyInit = true; init(); }
});
if (document.readyState !== 'loading') {
  if (!window.__familyInit) { window.__familyInit = true; init(); }
}

/* ============================================================
   태블릿 캘린더 보드 — 도트 월드 모드
   오리지널 픽셀 크리터 + 도트 감성. 모든 기록은 이 기기의 localStorage에만 저장됩니다.
   ============================================================ */
const BOARD_KEY = 'family-dashboard.board.v1';
const MODE_KEY = 'family-dashboard.mode.v1';

const BOARD_MEMBERS = [
  { id: 'dad',    name: '성영', color: '#3E7CA6', soft: '#E8F3FB' },
  { id: 'mom',    name: '수나', color: '#C2705C', soft: '#FFF0EA' },
  { id: 'yuns',   name: '윤슬', color: '#C9708E', soft: '#FFEAF1' },
  { id: 'noeul',  name: '노을', color: '#C08B2B', soft: '#FFF3D9' },
  { id: 'family', name: '가족', color: '#4C8C63', soft: '#E7F5E9' },
];
const BOARD_MEMBER_MAP = Object.fromEntries(BOARD_MEMBERS.map(m => [m.id, m]));

function seedBoardEvents() {
  const t = new Date();
  const d = n => dateKey(addDays(t, n));
  return [
    { id: uid(), title: '도서관 책 읽기', member: 'family', start: d(0),  end: null,  kind: 'plan', time: '15:00' },
    { id: uid(), title: '공원 산책',      member: 'noeul',  start: d(1),  end: null,  kind: 'plan', time: '10:30' },
    { id: uid(), title: '마트 장보기',    member: 'mom',    start: d(2),  end: null,  kind: 'plan', time: '' },
    { id: uid(), title: '친구랑 놀기',    member: 'yuns',   start: d(3),  end: null,  kind: 'plan', time: '' },
    { id: uid(), title: '가족 영화 나들이', member: 'family', start: d(5), end: d(6),  kind: 'plan', time: '18:00' },
    { id: uid(), title: '우리집 기념일',  member: 'family', start: d(12), end: null,  kind: 'bday', time: '' },
  ];
}

function emptyBoard() {
  return {
    v: 1,
    events: seedBoardEvents(),
    shopping: [
      { id: uid(), text: '우유', done: false },
      { id: uid(), text: '사과', done: false },
      { id: uid(), text: '달걀', done: false },
    ],
    tasks: [
      { id: uid(), text: '방 청소하기', done: false },
      { id: uid(), text: '책 꽂이 정리', done: false },
    ],
    birthdays: { yuns: '', noeul: '' },
    ages: { yuns: '', noeul: '' },
  };
}

let board = loadBoard();

function loadBoard() {
  try {
    const raw = localStorage.getItem(BOARD_KEY);
    if (!raw) return emptyBoard();
    const o = JSON.parse(raw) || {};
    const base = emptyBoard();
    const listOk = a => Array.isArray(a);
    return {
      v: 1,
      events: listOk(o.events)
        ? o.events.filter(e => e && e.title && e.start && BOARD_MEMBER_MAP[e.member])
          .map(e => ({ id: e.id || uid(), title: String(e.title).slice(0, 30), member: e.member, start: e.start, end: e.end || null, kind: e.kind === 'bday' ? 'bday' : 'plan', time: e.time || '' }))
        : [],
      shopping: listOk(o.shopping) ? o.shopping.filter(i => i && i.text).map(i => ({ id: i.id || uid(), text: String(i.text).slice(0, 30), done: !!i.done })) : base.shopping,
      tasks: listOk(o.tasks) ? o.tasks.filter(i => i && i.text).map(i => ({ id: i.id || uid(), text: String(i.text).slice(0, 30), done: !!i.done })) : base.tasks,
      birthdays: Object.assign({ yuns: '', noeul: '' }, o.birthdays || {}),
      ages: Object.assign({ yuns: '', noeul: '' }, o.ages || {}),
    };
  } catch (err) {
    return emptyBoard();
  }
}

let boardSaveTimer = null;
function saveBoard() {
  clearTimeout(boardSaveTimer);
  boardSaveTimer = setTimeout(() => {
    try { localStorage.setItem(BOARD_KEY, JSON.stringify(board)); } catch (err) { /* 공간 부족은 조용히 넘어가요 */ }
  }, 60);
}

/* ---------------- 도트 스프라이트 ---------------- */
function pixSVG(rows, palette, unit = 5) {
  const h = rows.length, w = rows[0].length;
  let rects = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === '.' || !palette[c]) continue;
      rects += `<rect x="${x * unit}" y="${y * unit}" width="${unit}" height="${unit}" fill="${palette[c]}"/>`;
    }
  });
  return `<svg viewBox="0 0 ${w * unit} ${h * unit}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" style="width:100%;height:auto;display:block;image-rendering:pixelated">${rects}</svg>`;
}

const PICKLE_PALETTE = { a: '#6E8A1E', b: '#DCE84A', c: '#F2F78E', d: '#FFB3C0', e: '#3A3226' };
const PICKLE_PIX = [
  '....aaaa....',
  '...abbbba...',
  '..abccbbba..',
  '.abbbbbbbba.',
  '.abbbbbbbba.',
  '.abebbbbeba.',
  '.abbbbbbbba.',
  '.abbbbbbbba.',
  '.abdbbbdbba.',
  '.abbbmbbbba.',
  '..abbbbbba..',
  '..abbbbbba..',
  '...aabbaa...',
];

const RABBIT_PALETTE = { a: '#A65E78', b: '#FFB7C9', c: '#FFD9E3', d: '#FF97B0', e: '#3A3226', m: '#A6455E' };
const RABBIT_PIX = [
  '.aa......aa.',
  'acba....abca',
  'acba....abca',
  'abba....abba',
  '.aabbbbbbaa.',
  'abbbbbbbbbba',
  'abebbbbbebba',
  'abbbbbbbbbba',
  'abdbbbbbdbba',
  'abbbbmmbbbba',
  '.abbbbbbbba.',
  '..aaaaaaaa..',
];

const CHICK_PALETTE = { a: '#B0722E', b: '#FFC98A', c: '#FFE3B8', d: '#FF9E6E', e: '#3A3226', m: '#E07B3A' };
const CHICK_PIX = [
  '.....aa.....',
  '....acba....',
  '...abbbba...',
  '..abbbbbba..',
  '..acbbbbba..',
  '.abebbbbeba.',
  '.abbbbbbbba.',
  '.abbbmmbbba.',
  '.abdbbbdbba.',
  '.abbbbbbbba.',
  '..abbbbbba..',
  '..aa.aa.aa..',
];

/* ---------------- 도트 시계 (5x7 매트릭스) ---------------- */
const PIX_DIGITS = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ':': ['00', '01', '00', '00', '01', '00', '00'],
};

function pixClockSVG(text, unit = 9) {
  const H = 7;
  let rects = '';
  let x = 0;
  Array.from(text).forEach(ch => {
    const glyph = PIX_DIGITS[ch];
    if (!glyph) { x += 2; return; }
    glyph.forEach((row, y) => {
      for (let cx = 0; cx < row.length; cx++) {
        if (row[cx] === '1') {
          rects += `<rect x="${x + cx}" y="${y}" width="1" height="1" fill="#FFFFFF"/>`;
        }
      }
    });
    x += glyph[0].length + 1;
  });
  return `<svg viewBox="-0.5 -0.5 ${x + 1} ${H + 1}" xmlns="http://www.w3.org/2000/svg" style="height:1em;display:block" aria-hidden="true"><g fill="#FFFFFF" shape-rendering="crispEdges">${rects}</g></svg>`;
}

/* ---------------- 보드 상태/렌더 ---------------- */
const bdUI = { week: 0, lastTicker: '', lastMusic: '' };

function boardActive() {
  return document.body.classList.contains('is-board');
}

function setMode(mode, persist = true) {
  const isBoard = mode === 'board';
  const isTravel = mode === 'travel';
  document.body.classList.toggle('is-board', isBoard);
  document.body.classList.toggle('is-travel', isTravel);
  const bv = $('#boardView');
  const tv = $('#travelView');
  const app = $('.app');
  if (bv) bv.hidden = !isBoard;
  if (tv) tv.hidden = !isTravel;
  if (app) app.hidden = isBoard || isTravel;
  if (persist) { try { localStorage.setItem(MODE_KEY, isBoard ? 'board' : isTravel ? 'travel' : 'record'); } catch (_) {} }
  window.scrollTo(0, 0);
  if (isBoard) renderBoardAll();
  if (isTravel) renderTravel();
}

function restoreMode() {
  let saved = 'record';
  try { saved = localStorage.getItem(MODE_KEY) || 'record'; } catch (_) {}
  if (saved === 'board') setMode('board', false);
  else if (saved === 'travel') setMode('travel', false);
}

function fmtHM(hm) {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(hm || ''));
  if (!m) return '';
  let h = Number(m[1]);
  const ap = h < 12 ? '오전' : '오후';
  h = h % 12 || 12;
  return `${ap} ${h}:${m[2]}`;
}

function diffDays(a, b) {
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}

function eventsOn(key) {
  const mmdd = key.slice(5);
  return board.events
    .filter(ev => {
      if (ev.kind === 'bday') return ev.start.slice(5) === mmdd;
      const end = ev.end || ev.start;
      return ev.start <= key && key <= end;
    })
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99') || a.title.localeCompare(b.title, 'ko'));
}

/* --- 배너: 시계 --- */
function renderBoardClock() {
  const now = new Date();
  $('#bdDate').textContent = dateLabel(now);
  $('#bdAmpm').textContent = now.getHours() < 12 ? '오전' : '오후';
  const h = now.getHours() % 12 || 12;
  const digits = $('#bdDigits');
  if (digits) {
    digits.style.fontSize = '56px';
    digits.innerHTML = pixClockSVG(`${h}:${pad2(now.getMinutes())}`);
    digits.setAttribute('aria-label', `현재 시각 ${dateLabel(now)} ${fmtHM(`${pad2(now.getHours())}:${pad2(now.getMinutes())}`)}`);
  }
}

/* --- 배너: 날씨 --- */
function boardSlots(data) {
  if (!data || !data.hourly || !Array.isArray(data.hourly.time)) return null;
  const want = [8, 12, 15, 20];
  const out = [];
  const nowH = new Date().getHours();
  const days = [dateKey(), dateKey(addDays(new Date(), 1))];
  for (const day of days) {
    for (const h of want) {
      if (day === days[0] && h <= nowH) continue; // 지난 시간대는 건너뛰고 뒤에서 채워요
      const idx = data.hourly.time.indexOf(`${day}T${pad2(h)}:00`);
      if (idx >= 0 && data.hourly.temp && data.hourly.temp[idx] != null) {
        const info = data.hourly.code != null && WMO[data.hourly.code[idx]] ? WMO[data.hourly.code[idx]] : ['🌤️', ''];
        out.push({ label: `${h}시`, temp: Math.round(data.hourly.temp[idx]), emoji: info[0] });
      }
      if (out.length >= 4) break;
    }
    if (out.length >= 4) break;
  }
  return out.length ? out : null;
}

function renderBoardWeather(data) {
  const temp = $('#bdWTemp'), desc = $('#bdWDesc'), emoji = $('#bdWEmoji');
  const air = $('#bdWAir'), tip = $('#bdWTip'), slots = $('#bdWSlots');
  if (!temp || !slots) return;
  if (!data) {
    temp.textContent = '--°';
    desc.textContent = '날씨를 불러오지 못했어요';
    emoji.textContent = '🌫️';
    air.textContent = '미세먼지 —';
    air.className = 'badge unknown';
    tip.textContent = '📶 연결되면 다시 불러올게요';
  } else {
    const info = data.code != null && WMO[data.code] ? WMO[data.code] : ['🌤️', '날씨 정보 없음'];
    emoji.textContent = info[0];
    temp.textContent = (data.temp != null ? Math.round(data.temp) : '--') + '°';
    desc.textContent = info[1] + (data.cached ? ' · 저장된 값' : '');
    const g10 = gradePM(data.pm10, 'pm10');
    air.textContent = `미세먼지 ${g10.label}`;
    air.className = 'badge ' + (g10.cls || '');
  }
  const s = boardSlots(data);
  slots.innerHTML = (s || [
    { label: '8시', temp: null, emoji: '🕰️' },
    { label: '12시', temp: null, emoji: '🕰️' },
    { label: '15시', temp: null, emoji: '🕰️' },
    { label: '20시', temp: null, emoji: '🕰️' },
  ]).map(it => `
    <span class="bd-w-slot">
      <b>${esc(it.label)}</b>
      <span aria-hidden="true">${it.emoji}</span>
      <strong>${it.temp != null ? it.temp + '°' : '-°'}</strong>
    </span>`).join('');
}

/* --- 왼쪽: 3주 캘린더 --- */
function boardWeekStart() {
  return addDays(startOfWeek(new Date()), bdUI.week * 7);
}

function renderBoardCalendar() {
  const start = boardWeekStart();
  const end = addDays(start, 20);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  $('#bdCalTitleText').textContent = sameMonth
    ? `${start.getFullYear()}년 ${start.getMonth() + 1}월`
    : `${start.getFullYear()}년 ${start.getMonth() + 1}월 - ${end.getFullYear() !== start.getFullYear() ? end.getFullYear() + '년 ' : ''}${end.getMonth() + 1}월`;

  $('#bdLegend').innerHTML = BOARD_MEMBERS.map(m =>
    `<span class="bd-lg-item"><i style="background:${m.color}"></i>${m.name}</span>`).join('');

  const todayK = dateKey();
  let html = '';
  for (let i = 0; i < 21; i++) {
    const d = addDays(start, i);
    const key = dateKey(d);
    const other = d.getMonth() !== start.getMonth();
    const evs = eventsOn(key);
    const shown = evs.slice(0, 3);
    const more = evs.length - shown.length;
    const cls = ['bd-cell', key === todayK ? 'is-today' : '', other ? 'other-month' : '', d.getDay() === 0 ? 'sun' : ''].join(' ');
    html += `
      <button class="${cls}" type="button" data-date="${key}" aria-label="${d.getMonth() + 1}월 ${d.getDate()}일 일정 ${evs.length}개 — 눌러서 추가·수정">
        <span class="bd-daynum">${d.getDate()}</span>
        ${shown.map(ev => {
          const mm = BOARD_MEMBER_MAP[ev.member] || BOARD_MEMBER_MAP.family;
          return `<span class="bd-ev ${ev.kind === 'bday' ? 'is-bday' : ''}" style="--c:${mm.color};--s:${mm.soft}">${ev.kind === 'bday' ? '🎂 ' : ''}${esc(ev.title)}</span>`;
        }).join('')}
        ${more > 0 ? `<span class="bd-ev-more">+${more}개 더</span>` : ''}
      </button>`;
  }
  $('#bdCalGrid').innerHTML = html;
}

/* --- 오늘 카드 --- */
function renderBoardToday() {
  const now = new Date();
  const todayK = dateKey();
  $('#bdTodayDate').textContent = `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEK_LABEL[now.getDay()]}요일`;

  const todays = eventsOn(todayK);
  $('#bdTodayList').innerHTML = todays.length
    ? todays.map(ev => {
        const mm = BOARD_MEMBER_MAP[ev.member] || BOARD_MEMBER_MAP.family;
        return `<div class="bd-today-row" data-event-id="${ev.id}" style="--c:${mm.color}">
          <span class="bd-today-time">${ev.time ? esc(fmtHM(ev.time)) : '하루 종일'}</span>
          <span class="bd-today-title">${ev.kind === 'bday' ? '🎂 ' : ''}${esc(ev.title)}</span>
        </div>`;
      }).join('')
    : `<p class="bd-empty">오늘 일정은 없어요 — 달력의 날짜를 눌러 추가해요</p>`;

  // 다음: 오늘 이후 가장 가까운 일정
  let next = null;
  for (let i = 1; i <= 60 && !next; i++) {
    const k = dateKey(addDays(now, i));
    const evs = eventsOn(k);
    if (evs.length) next = { ev: evs[0], key: k };
  }
  $('#bdNextRow').innerHTML = next
    ? `<span class="bd-next-label">다음</span><span class="bd-next-text">${next.key.slice(5).replace('-', '/')}(${WEEK_LABEL[parseKey(next.key).getDay()]}) ${esc(next.ev.title)}</span>`
    : `<span class="bd-next-label">다음</span><span class="bd-next-text bd-muted">예정된 일정이 없어요</span>`;

  // 내일: 내일 일정 1개 미리보기
  const tmrK = dateKey(addDays(now, 1));
  const tmr = eventsOn(tmrK);
  $('#bdTomorrowRow').innerHTML = tmr.length
    ? `<span class="bd-next-label">내일</span><span class="bd-next-text">${tmr[0].time ? esc(fmtHM(tmr[0].time)) + ' ' : ''}${esc(tmr[0].title)}</span>`
    : `<span class="bd-next-label">내일</span><span class="bd-next-text bd-muted">내일 일정도 비어 있어요</span>`;
}

/* --- 장보기 & 할 일 --- */
function renderBoardList(listEl, countEl, items, emptyText) {
  listEl.innerHTML = items.length
    ? items.map(it => `
      <div class="bd-check ${it.done ? 'is-done' : ''}" data-id="${it.id}">
        <button class="bd-check-box ${it.done ? 'on' : ''}" type="button" data-act="bd-check" aria-pressed="${it.done}" aria-label="${esc(it.text)} ${it.done ? '완료 취소' : '완료'}">${it.done ? '✓' : ''}</button>
        <span class="bd-check-text">${esc(it.text)}</span>
        <button class="mini-btn danger" type="button" data-act="bd-del" aria-label="${esc(it.text)} 삭제">✕</button>
      </div>`).join('')
    : `<p class="bd-empty">${emptyText}</p>`;
  const done = items.filter(i => i.done).length;
  countEl.textContent = items.length ? `${done}/${items.length}` : '';
}

function renderBoardLists() {
  renderBoardList($('#bdShopList'), $('#bdShopCount'), board.shopping, '필요한 것을 추가해요');
  renderBoardList($('#bdTaskList'), $('#bdTaskCount'), board.tasks, '오늘 할 일을 추가해요');
}

function addBoardItem(kind) {
  const input = kind === 'shop' ? $('#bdShopInput') : $('#bdTaskInput');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  const list = kind === 'shop' ? board.shopping : board.tasks;
  list.push({ id: uid(), text, done: false });
  input.value = '';
  saveBoard();
  renderBoardLists();
}

function toggleBoardItem(kind, id) {
  const list = kind === 'shop' ? board.shopping : board.tasks;
  const it = list.find(i => i.id === id);
  if (!it) return;
  it.done = !it.done;
  saveBoard();
  renderBoardLists();
}

function deleteBoardItem(kind, id) {
  if (kind === 'shop') board.shopping = board.shopping.filter(i => i.id !== id);
  else board.tasks = board.tasks.filter(i => i.id !== id);
  saveBoard();
  renderBoardLists();
}

/* --- 아이 레벨 · D-day 카드 --- */
function lifetimeDone(mid) {
  let n = 0;
  for (const k in state.days) {
    const d = state.days[k];
    if (!d) continue;
    n += ((d.study && d.study[mid]) || []).filter(i => i.done).length;
    n += ((d.todo && d.todo[mid]) || []).filter(i => i.done).length;
  }
  return n;
}

function kidBdayInfo(mid) {
  const b = board.birthdays[mid];
  if (!b || !/^\d{2}-\d{2}$/.test(b)) return null;
  const y = new Date().getFullYear();
  let target = `${y}-${b}`;
  if (target < dateKey()) target = `${y + 1}-${b}`;
  return { mmdd: b, dday: diffDays(dateKey(), target) };
}

function renderBoardKids() {
  const buddies = { yuns: [RABBIT_PIX, RABBIT_PALETTE], noeul: [CHICK_PIX, CHICK_PALETTE] };
  CHILDREN.forEach(kid => {
    const card = $(`.bd-kid[data-kid="${kid.id}"]`);
    if (!card) return;
    const total = lifetimeDone(kid.id);
    const lv = 1 + Math.floor(total / 10);
    const pct = (total % 10) * 10;
    const bday = kidBdayInfo(kid.id);
    const age = board.ages[kid.id];
    const [pix, pal] = buddies[kid.id] || buddies.yuns;
    card.innerHTML = `
      <span class="bd-kid-buddy" aria-hidden="true">${pixSVG(pix, pal)}</span>
      <div class="bd-kid-body">
        <div class="bd-kid-head">
          <strong>${kid.name} <span class="bd-kid-lv">Lv.${lv}</span></strong>
          <span class="bd-kid-stars">★ ${total}개</span>
        </div>
        <div class="bd-kid-bar" role="img" aria-label="다음 레벨까지 ${10 - (total % 10)}개">
          <div class="bd-kid-fill" style="width:${pct}%"></div>
        </div>
        ${bday
          ? `<span class="bd-kid-dday">🎂 ${bday.mmdd}${age ? ' · ' + esc(age) + '살' : ''} · 생일까지 D-${bday.dday}</span>`
          : `<span class="bd-kid-dday unset">🎂 생일을 알려주세요 — 카드를 눌러 입력</span>`}
      </div>
      <span class="bd-kid-gear" aria-hidden="true">⚙️</span>`;
  });
}

/* --- 다가오는 날 --- */
function renderBoardUpcoming() {
  const todayK = dateKey();
  const out = [];
  board.events.forEach(ev => {
    if (ev.kind !== 'bday') return; // '다가오는 날'은 생일·기념일 전용 — 일반 일정은 오늘/다음/내일 카드에 나와요
    const mmdd = ev.start.slice(5);
    const y = new Date().getFullYear();
    let target = `${y}-${mmdd}`;
    if (target < todayK) target = `${y + 1}-${mmdd}`;
    out.push({ d: diffDays(todayK, target), date: target, title: ev.title, member: ev.member, bday: true });
  });
  CHILDREN.forEach(kid => {
    const b = board.birthdays[kid.id];
    if (b && /^\d{2}-\d{2}$/.test(b)) {
      const y = new Date().getFullYear();
      let target = `${y}-${b}`;
      if (target < todayK) target = `${y + 1}-${b}`;
      out.push({ d: diffDays(todayK, target), date: target, title: `${kid.name} 생일`, member: kid.id, bday: true });
    }
  });
  out.sort((a, b) => a.d - b.d || a.date.localeCompare(b.date));
  $('#bdUpList').innerHTML = out.length
    ? out.slice(0, 6).map(it => {
        const mm = BOARD_MEMBER_MAP[it.member] || BOARD_MEMBER_MAP.family;
        return `<div class="bd-up-row" style="--c:${mm.color};--s:${mm.soft}">
          <span class="bd-up-dday ${it.d === 0 ? 'today' : ''}">${it.d === 0 ? 'D-day' : 'D-' + it.d}</span>
          <span class="bd-up-title">${it.bday ? '🎂 ' : ''}${esc(it.title)}</span>
          <span class="bd-up-date">${it.date.slice(5).replace('-', '/')}</span>
        </div>`;
      }).join('')
    : `<p class="bd-empty">등록된 생일·기념일이 없어요 — 달력에서 🎂 일정을 추가해요</p>`;
}

/* --- 하단 바: 요약 티커 + 미니 음악 --- */
function renderBoardTicker() {
  const el = $('#bdTicker');
  if (!el) return;
  const kidsTxt = CHILDREN.map(m => `${m.name} ${weeklyStats(m.id).pct}%`).join(' · ');
  const day = getDay(dateKey());
  const ms = day.mission ? MISSIONS[day.mission.idx] : null;
  const lastChat = state.chat.length ? state.chat[state.chat.length - 1] : null;
  const sender = lastChat ? (MEMBER_MAP[lastChat.member] || MEMBER_MAP.yuns).name : '';
  const text = [
    `🎯 주간 달성(90% 목표): ${kidsTxt}`,
    ms ? `🎲 미션: ${ms.text}` : '🎲 미션: 아직 안 뽑았어요',
    lastChat ? `💌 한마디: “${sender} · ${String(lastChat.text).slice(0, 22)}”` : '💌 아직 한마디가 없어요',
    `✈️ 여행: 다녀온 ${state.travel.filter(t => t.status === 'been').length}곳 · 가고 싶은 ${state.travel.filter(t => t.status === 'wish').length}곳`,
  ];
  const joined = text.join('|');
  if (joined !== bdUI.lastTicker) {
    bdUI.lastTicker = joined;
    el.innerHTML = text.map(t => `<span>${esc(t)}</span>`).join('');
  }
}

function renderBoardMusic() {
  const el = $('#bdMusicTitle');
  if (!el) return;
  const t = jukeNow ? `▶ ${jukeNow.label}` : '재생 준비';
  if (t !== bdUI.lastMusic) {
    bdUI.lastMusic = t;
    el.textContent = t;
  }
}

function renderBoardAll() {
  if (!boardActive()) return;
  renderBoardClock();
  renderBoardCalendar();
  renderBoardToday();
  renderBoardLists();
  renderBoardKids();
  renderBoardUpcoming();
  renderBoardTicker();
  renderBoardMusic();
}

/* --- 일정 모달 --- */
const bdEventEditor = { id: null };

function openEventModal(id = null, presetDate = null) {
  bdEventEditor.id = id;
  const ev = id ? board.events.find(e => e.id === id) : null;
  $('#bdEventTitle').textContent = id ? '✏️ 일정 수정' : '🗓️ 일정 추가';
  $('#bdEventText').value = ev ? ev.title : '';
  $('#bdEventMember').value = ev ? ev.member : 'family';
  $('#bdEventStart').value = ev ? ev.start : (presetDate || dateKey());
  $('#bdEventEnd').value = ev && ev.end ? ev.end : '';
  $('#bdEventTime').value = ev ? (ev.time || '') : '';
  $('#bdEventKind').value = ev ? ev.kind : 'plan';
  $('#bdEventDelete').hidden = !id;
  openModal('modalEvent');
  setTimeout(() => $('#bdEventText').focus({ preventScroll: true }), 80);
}

function saveEventModal() {
  const title = $('#bdEventText').value.trim();
  let start = $('#bdEventStart').value;
  const end = $('#bdEventEnd').value || null;
  if (!title) { toast('내용을 적어 주세요'); $('#bdEventText').focus(); return; }
  if (!start) { toast('시작 날짜를 골라 주세요'); return; }
  if (end && end < start) { const t = start; start = end; $('#bdEventStart').value = start; $('#bdEventEnd').value = t; }
  const data = {
    title: title.slice(0, 30),
    member: $('#bdEventMember').value,
    start,
    end: end || null,
    kind: $('#bdEventKind').value === 'bday' ? 'bday' : 'plan',
    time: $('#bdEventTime').value || '',
  };
  if (bdEventEditor.id) {
    const ev = board.events.find(e => e.id === bdEventEditor.id);
    if (ev) Object.assign(ev, data);
  } else {
    board.events.push(Object.assign({ id: uid() }, data));
  }
  saveBoard();
  closeModal('modalEvent');
  renderBoardCalendar();
  renderBoardToday();
  renderBoardUpcoming();
  toast('일정을 저장했어요 🗓️');
}

function deleteEventModal() {
  if (!bdEventEditor.id) return;
  if (!confirm('이 일정을 지울까요?')) return;
  board.events = board.events.filter(e => e.id !== bdEventEditor.id);
  saveBoard();
  closeModal('modalEvent');
  renderBoardCalendar();
  renderBoardToday();
  renderBoardUpcoming();
  toast('일정을 지웠어요');
}

function exportBoardEvents() {
  const blob = new Blob([JSON.stringify({ app: 'family-dashboard', kind: 'calendar', events: board.events, travel: state.travel }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `가족캘린더-${dateKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('일정 백업을 내려받았어요');
}

function importBoardEvents(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const evs = Array.isArray(parsed) ? parsed : parsed && parsed.events;
      if (!Array.isArray(evs)) throw new Error('형식이 달라요');
      if (!confirm(`일정 ${evs.length}개를 불러올까요? 지금 일정을 대체해요.`)) return;
      board.events = evs
        .filter(e => e && e.title && e.start)
        .map(e => ({ id: e.id || uid(), title: String(e.title).slice(0, 30), member: BOARD_MEMBER_MAP[e.member] ? e.member : 'family', start: e.start, end: e.end || null, kind: e.kind === 'bday' ? 'bday' : 'plan', time: e.time || '' }));
      // 백업 파일에 여행 보드가 들어 있으면 함께 불러와요
      if (Array.isArray(parsed.travel)) state.travel = normalizeTravel(parsed.travel);
      save();
      saveBoard();
      renderBoardCalendar();
      renderBoardToday();
      renderBoardUpcoming();
      renderAll();
      toast('일정을 불러왔어요');
    } catch (err) {
      toast('이 파일은 불러올 수 없어요');
    }
  };
  reader.readAsText(file);
}

/* --- 생일 모달 --- */
const bdBdayEditor = { kid: 'yuns' };

function openBirthdayModal(kidId) {
  const kid = CHILDREN.find(c => c.id === kidId);
  if (!kid) return;
  bdBdayEditor.kid = kidId;
  $('#bdBdayWho').textContent = `${kid.name}${iGa(kid.name)} 생일과 나이를 알려주세요 — 카드와 '다가오는 날'에 D-day로 표시돼요`;
  $('#bdBdayDate').value = board.birthdays[kidId] || '';
  $('#bdBdayAge').value = board.ages[kidId] || '';
  openModal('modalBirthday');
  setTimeout(() => $('#bdBdayDate').focus({ preventScroll: true }), 80);
}

function saveBirthdayModal() {
  const v = $('#bdBdayDate').value.trim();
  if (v && !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v)) {
    toast('월-일 형식으로 적어 주세요 (예: 03-15)');
    $('#bdBdayDate').focus();
    return;
  }
  board.birthdays[bdBdayEditor.kid] = v || '';
  const age = Number($('#bdBdayAge').value);
  board.ages[bdBdayEditor.kid] = age > 0 ? String(Math.min(19, Math.floor(age))) : '';
  saveBoard();
  closeModal('modalBirthday');
  renderBoardKids();
  renderBoardUpcoming();
  toast('생일을 저장했어요 🎂');
}

/* --- 이벤트 연결 --- */
function focusRecordSection(sel, kid) {
  setMode('record');
  if (kid) {
    ui.stampChild = kid;
    ui.calChild = kid;
    renderStamp();
  }
  setTimeout(() => {
    const target = document.querySelector(sel);
    if (!target) return;
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    target.classList.add('bd-flash');
    setTimeout(() => target.classList.remove('bd-flash'), 1600);
  }, 80);
}

function bindBoardEvents() {
  $('#btnBoardToggle').addEventListener('click', () => setMode('board'));
  $('#btnBoardBack').addEventListener('click', () => setMode('record'));

  $$('.bd-tab[data-btab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.btab;
      if (t === 'home') setMode('record');
      else if (t === 'yuns') focusRecordSection('.study-block[data-member="yuns"]', 'yuns');
      else if (t === 'noeul') focusRecordSection('.study-block[data-member="noeul"]', 'noeul');
      else if (t === 'stamp') focusRecordSection('.card-stamp', null);
      else if (t === 'music') focusRecordSection('.card-juke', null);
      else if (t === 'travel') setMode('travel');
    });
  });

  $('#bdMusicOpen').addEventListener('click', () => focusRecordSection('.card-juke', null));

  $('#bdCalPrev').addEventListener('click', () => { bdUI.week -= 1; renderBoardCalendar(); });
  $('#bdCalNext').addEventListener('click', () => { bdUI.week += 1; renderBoardCalendar(); });
  $('#bdCalExport').addEventListener('click', exportBoardEvents);
  $('#bdCalImport').addEventListener('click', () => $('#bdCalImportFile').click());
  $('#bdCalImportFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (f) importBoardEvents(f);
    e.target.value = '';
  });

  $('#bdCalGrid').addEventListener('click', e => {
    const cell = e.target.closest('.bd-cell');
    if (cell) openEventModal(null, cell.dataset.date);
    const bar = e.target.closest('.bd-ev');
    if (bar) {
      const cell2 = bar.closest('.bd-cell');
      const evs = eventsOn(cell2 ? cell2.dataset.date : '');
      if (evs.length === 1) openEventModal(evs[0].id);
      else if (evs.length > 1) {
        // 여러 개면 가장 첫 번째(시간순) 일정부터 열어요 — 날짜 클릭으로도 수정 가능
        const title = bar.textContent.replace('🎂 ', '').trim();
        const hit = evs.find(v => v.title === title) || evs[0];
        openEventModal(hit.id);
      }
    }
  });

  $('#bdEventSave').addEventListener('click', saveEventModal);
  $('#bdEventDelete').addEventListener('click', deleteEventModal);
  $('#bdEventText').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); saveEventModal(); }
  });

  $('#bdShopAdd').addEventListener('click', () => addBoardItem('shop'));
  $('#bdTaskAdd').addEventListener('click', () => addBoardItem('task'));
  $('#bdShopInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addBoardItem('shop'); } });
  $('#bdTaskInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addBoardItem('task'); } });
  $('#bdShopList').addEventListener('click', e => boardListClick('shop', e));
  $('#bdTaskList').addEventListener('click', e => boardListClick('task', e));

  $$('.bd-kid').forEach(card => {
    card.addEventListener('click', () => openBirthdayModal(card.dataset.kid));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBirthdayModal(card.dataset.kid); }
    });
  });
  $('#bdBdaySave').addEventListener('click', saveBirthdayModal);
}

function boardListClick(kind, e) {
  const row = e.target.closest('.bd-check');
  if (!row) return;
  const act = e.target.closest('[data-act]');
  if (!act) return;
  if (act.dataset.act === 'bd-check') toggleBoardItem(kind, row.dataset.id);
  else if (act.dataset.act === 'bd-del') deleteBoardItem(kind, row.dataset.id);
}

/* --- 시작 --- */
function initBoard() {
  $('#bdPickle').innerHTML = pixSVG(PICKLE_PIX, PICKLE_PALETTE);
  bindBoardEvents();
  restoreMode();
  renderBoardWeather(readWeatherCache());
  renderBoardTicker();
  renderBoardMusic();
  if (boardActive()) renderBoardAll();

  // 시계 1초 틱 — 보드가 열려 있을 때는 하단 티커·음악 표시도 함께 새로 고침
  setInterval(() => {
    if (!boardActive()) return;
    renderBoardClock();
    renderBoardTicker();
    renderBoardMusic();
  }, 1000);
}

/* ============================================================
   우리 가족 여행 보드 — 여행 간 곳 · 여행 갈 곳
   다녀온 곳은 🚩 깃발, 가고 싶은 곳은 ⭐ 별로 지도에 표시해요.
   모든 기록은 이 기기의 localStorage에만 저장됩니다.
   ============================================================ */
const tvUI = { region: null };
const tvEditor = { id: null, status: 'wish' };

function travelActive() {
  return document.body.classList.contains('is-travel');
}

function travelOfRegion(rid) {
  return state.travel.filter(t => t.region === rid);
}

/** 권역 순서대로 정렬 (지도·목록이 같은 순서로 보이게) */
function travelSorted() {
  const order = TRAVEL_REGIONS.map(r => r.id);
  return state.travel.slice().sort((a, b) => {
    const ra = order.indexOf(a.region), rb = order.indexOf(b.region);
    if (ra !== rb) return ra - rb;
    return String(a.name).localeCompare(String(b.name), 'ko');
  });
}

function travelCounts() {
  return {
    been: state.travel.filter(t => t.status === 'been').length,
    wish: state.travel.filter(t => t.status === 'wish').length,
  };
}

/* --- 기록장 안의 여행 카드 --- */
function renderTravelCard() {
  const c = travelCounts();
  const beenEl = $('#tvCardBeen'), wishEl = $('#tvCardWish');
  if (beenEl) beenEl.textContent = c.been;
  if (wishEl) wishEl.textContent = c.wish;
  const box = $('#tvCardPreview');
  if (!box) return;
  const recentBeen = state.travel.filter(t => t.status === 'been').slice(-2).reverse();
  const wish = state.travel.filter(t => t.status === 'wish').slice(0, 2);
  const rows = [...recentBeen, ...wish];
  box.innerHTML = rows.length
    ? rows.map(t => {
        const r = TV_REGION_MAP[t.region] || TV_REGION_MAP.world;
        return `<div class="tv-card-row">
          <span aria-hidden="true">${t.status === 'been' ? '🚩' : '⭐'}</span>
          <strong>${esc(t.name)}</strong>
          <em>${esc(r.name)}${t.when ? ' · ' + esc(t.when) : ''}</em>
        </div>`;
      }).join('')
    : `<p class="tv-card-empty">아직 여행 기록이 없어요 — 첫 여행지를 추가해 보세요!</p>`;
}

/* --- 지도 핀 --- */
function renderTravelMap() {
  const pins = $('#tvPins');
  if (!pins) return;
  pins.innerHTML = TRAVEL_REGIONS.map(r => {
    const items = travelOfRegion(r.id);
    const been = items.filter(i => i.status === 'been').length;
    const wish = items.filter(i => i.status === 'wish').length;
    const stateCls = been ? 'is-been' : (wish ? 'is-wish' : 'is-none');
    const emoji = been ? '🚩' : (wish ? '⭐' : '');
    const active = tvUI.region === r.id;
    const aria = `${r.name} · 다녀온 곳 ${been}곳 · 가고 싶은 곳 ${wish}곳 — 눌러서 이 지역만 모아 보기`;
    return `<button class="tv-pin ${stateCls}${active ? ' is-active' : ''}" type="button" data-region="${r.id}"
        style="left:${r.x}%;top:${r.y}%" aria-label="${esc(aria)}" aria-pressed="${active}">
      <span class="tv-pin-mark">
        <span class="tv-pin-dot" aria-hidden="true">${emoji}</span>
        ${items.length ? `<span class="tv-pin-count" aria-hidden="true">${items.length}</span>` : ''}
      </span>
      <span class="tv-pin-label">${esc(r.short)}</span>
    </button>`;
  }).join('');
}

/* --- 권역 칩 · 필터 안내 --- */
function renderTravelChips() {
  const el = $('#tvRegionChips');
  if (!el) return;
  el.innerHTML = `<button class="tv-chip ${tvUI.region ? '' : 'is-active'}" type="button" data-region="all">전체 ${state.travel.length}</button>` +
    TRAVEL_REGIONS.map(r => {
      const n = travelOfRegion(r.id).length;
      return `<button class="tv-chip ${tvUI.region === r.id ? 'is-active' : ''}" type="button" data-region="${r.id}">${r.emoji} ${esc(r.name)}${n ? ' ' + n : ''}</button>`;
    }).join('');

  const bar = $('#tvFilterBar');
  if (!bar) return;
  const r = TV_REGION_MAP[tvUI.region];
  if (r) {
    bar.hidden = false;
    bar.innerHTML = `<span>🔎 <strong>${esc(r.name)}</strong> 지역만 보는 중</span>
      <button class="tv-chip" type="button" data-tv-act="filter-add">＋ 이 지역에 추가</button>
      <button class="tv-chip" type="button" data-tv-act="filter-clear">전체 보기</button>`;
  } else {
    bar.hidden = true;
    bar.innerHTML = '';
  }
}

/* --- 목록 --- */
function renderTravelList(el, items, emptyText, status) {
  if (!el) return;
  if (!items.length) {
    el.innerHTML = `<p class="tv-empty">${emptyText}</p>`;
    return;
  }
  el.innerHTML = items.map(t => {
    const r = TV_REGION_MAP[t.region] || TV_REGION_MAP.world;
    return `<div class="tv-item is-${status}" data-id="${t.id}" data-region="${t.region}">
      <div class="tv-item-main">
        <div class="tv-item-top">
          <strong>${esc(t.name)}</strong>
          <span class="tv-item-region">${r.emoji} ${esc(r.name)}</span>
        </div>
        ${t.when ? `<span class="tv-item-when">${status === 'been' ? '' : '목표 · '}${esc(t.when)}</span>` : ''}
        ${t.memo ? `<p class="tv-item-memo">${esc(t.memo)}</p>` : ''}
      </div>
      <div class="tv-item-actions">
        ${status === 'wish' ? `<button class="tv-mini-btn been" type="button" data-act="tv-been" aria-label="${esc(t.name)} 다녀온 곳으로 옮기기">다녀왔어요 🚩</button>` : ''}
        <button class="tv-mini-btn" type="button" data-act="tv-edit" aria-label="${esc(t.name)} 수정">✏️</button>
        <button class="tv-mini-btn danger" type="button" data-act="tv-del" aria-label="${esc(t.name)} 삭제">✕</button>
      </div>
    </div>`;
  }).join('');
}

function renderTravel() {
  const c = travelCounts();
  const setText = (sel, v) => { const el = $(sel); if (el) el.textContent = v; };
  setText('#tvBeenCount', c.been);
  setText('#tvWishCount', c.wish);
  setText('#tvBeenListCount', c.been);
  setText('#tvWishListCount', c.wish);

  renderTravelMap();
  renderTravelChips();

  const filter = tvUI.region;
  const list = travelSorted().filter(t => !filter || t.region === filter);
  const where = filter && TV_REGION_MAP[filter] ? `${TV_REGION_MAP[filter].name}에 ` : '';
  renderTravelList(
    $('#tvBeenList'),
    list.filter(t => t.status === 'been'),
    `${where}아직 다녀온 곳이 없어요 — ‘다녀왔어요’로 깃발을 꽂아 보세요 🚩`,
    'been'
  );
  renderTravelList(
    $('#tvWishList'),
    list.filter(t => t.status === 'wish'),
    `${where}아직 가고 싶은 곳이 없어요 — 여행지 추가로 별을 꽂아 보세요 ⭐`,
    'wish'
  );

  const note = $('#tvMapNote');
  if (note) note.textContent = filter && TV_REGION_MAP[filter]
    ? `${TV_REGION_MAP[filter].name} 지역 기록을 모아 봐요`
    : '지역 핀을 누르면 그 지역 기록만 모아 봐요';
}

function renderTravelAll() {
  renderTravelCard();
  renderTravel();
}

/* --- 지역 필터 --- */
function setTravelRegion(rid) {
  tvUI.region = (rid && rid !== 'all' && TV_REGION_MAP[rid]) ? rid : null;
  renderTravel();
}

/* --- 여행지 모달 --- */
function syncTravelStatusUI() {
  $$('#modalTravel [data-tv-status]').forEach(b => {
    const on = b.dataset.tvStatus === tvEditor.status;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  const label = $('#tvWhenLabel');
  const input = $('#tvWhen');
  if (label) label.textContent = tvEditor.status === 'been' ? '다녀온 시기' : '가고 싶은 시기';
  if (input) input.placeholder = tvEditor.status === 'been' ? '예) 2026-08, 여름휴가' : '예) 내년 봄방학, 여름휴가';
}

function openTravelModal(item = null, presetRegion = null) {
  tvEditor.id = item ? item.id : null;
  tvEditor.status = item ? item.status : 'wish';
  const title = $('#tvModalTitle');
  if (title) title.textContent = item ? '✏️ 여행지 수정' : '＋ 여행지 추가';
  $('#tvName').value = item ? item.name : '';
  const fallback = (tvUI.region && TV_REGION_MAP[tvUI.region]) ? tvUI.region : 'gyeongbuk';
  $('#tvRegion').value = item ? item.region : (presetRegion && TV_REGION_MAP[presetRegion] ? presetRegion : fallback);
  $('#tvWhen').value = item ? item.when : '';
  $('#tvMemo').value = item ? item.memo : '';
  $('#tvDelete').hidden = !item;
  syncTravelStatusUI();
  openModal('modalTravel');
  setTimeout(() => { const n = $('#tvName'); if (n) n.focus({ preventScroll: true }); }, 80);
}

function saveTravelModal() {
  const nameInput = $('#tvName');
  const name = nameInput.value.trim();
  if (!name) { toast('여행지 이름을 적어 주세요'); nameInput.focus(); return; }
  const region = TV_REGION_MAP[$('#tvRegion').value] ? $('#tvRegion').value : 'world';
  const data = {
    name: name.slice(0, 20),
    region,
    status: tvEditor.status === 'been' ? 'been' : 'wish',
    when: $('#tvWhen').value.trim().slice(0, 20),
    memo: $('#tvMemo').value.trim().slice(0, 40),
  };
  const editing = !!tvEditor.id;
  if (editing) {
    const it = state.travel.find(t => t.id === tvEditor.id);
    if (it) Object.assign(it, data);
  } else {
    state.travel.push(Object.assign({ id: uid() }, data));
  }
  save();
  closeModal('modalTravel');
  renderTravelAll();
  renderBoardTicker();
  toast(editing ? '여행지를 고쳤어요 ✈️' : (data.status === 'been' ? '깃발을 꽂았어요 🚩' : '별을 꽂았어요 ⭐'));
}

function deleteTravelItem(id) {
  const it = state.travel.find(t => t.id === id);
  if (!it) return;
  if (!confirm(`‘${it.name}’ 여행 기록을 지울까요?`)) return;
  state.travel = state.travel.filter(t => t.id !== id);
  save();
  renderTravelAll();
  renderBoardTicker();
  toast('여행 기록을 지웠어요');
}

function deleteTravelModal() {
  if (!tvEditor.id) return;
  const it = state.travel.find(t => t.id === tvEditor.id);
  if (!it) return;
  if (!confirm(`‘${it.name}’ 여행 기록을 지울까요?`)) return;
  state.travel = state.travel.filter(t => t.id !== tvEditor.id);
  save();
  closeModal('modalTravel');
  renderTravelAll();
  renderBoardTicker();
  toast('여행 기록을 지웠어요');
}

/** ⭐ 가고 싶은 곳 → 🚩 다녀온 곳으로 한 번에 */
function markTravelBeen(id, btn) {
  const it = state.travel.find(t => t.id === id);
  if (!it) return;
  it.status = 'been';
  save();
  if (btn) {
    const r = btn.getBoundingClientRect();
    confetti(r.left + r.width / 2 - 8, r.top - 6, 18);
  }
  renderTravelAll();
  renderBoardTicker();
  toast(`${it.name} 다녀왔어요! 깃발을 꽂았어요 🚩`);
}

/* --- 이벤트 연결 --- */
function travelListClick(e) {
  const row = e.target.closest('.tv-item');
  if (!row) return;
  const act = e.target.closest('[data-act]');
  if (!act) return;
  const id = row.dataset.id;
  if (act.dataset.act === 'tv-been') markTravelBeen(id, act);
  else if (act.dataset.act === 'tv-del') deleteTravelItem(id);
  else if (act.dataset.act === 'tv-edit') {
    const it = state.travel.find(t => t.id === id);
    if (it) openTravelModal(it);
  }
}

function bindTravelEvents() {
  const sel = $('#tvRegion');
  if (sel) {
    sel.innerHTML = TRAVEL_REGIONS.map(r => `<option value="${r.id}">${r.emoji} ${esc(r.name)}</option>`).join('');
  }

  const fromCard = $('#btnTravelFromCard');
  if (fromCard) fromCard.addEventListener('click', () => setMode('travel'));
  const back = $('#btnTravelBack');
  if (back) back.addEventListener('click', () => setMode('record'));
  const toBoard = $('#btnTravelToBoard');
  if (toBoard) toBoard.addEventListener('click', () => setMode('board'));
  const addBtn = $('#btnTravelAdd');
  if (addBtn) addBtn.addEventListener('click', () => openTravelModal(null));

  const pins = $('#tvPins');
  if (pins) pins.addEventListener('click', e => {
    const pin = e.target.closest('.tv-pin');
    if (!pin) return;
    setTravelRegion(tvUI.region === pin.dataset.region ? null : pin.dataset.region);
  });

  const chips = $('#tvRegionChips');
  if (chips) chips.addEventListener('click', e => {
    const chip = e.target.closest('[data-region]');
    if (!chip) return;
    setTravelRegion(chip.dataset.region);
  });

  const bar = $('#tvFilterBar');
  if (bar) bar.addEventListener('click', e => {
    const btn = e.target.closest('[data-tv-act]');
    if (!btn) return;
    if (btn.dataset.tvAct === 'filter-clear') setTravelRegion(null);
    else if (btn.dataset.tvAct === 'filter-add') openTravelModal(null, tvUI.region);
  });

  ['#tvBeenList', '#tvWishList'].forEach(s => {
    const el = $(s);
    if (el) el.addEventListener('click', travelListClick);
  });

  $$('#modalTravel [data-tv-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      tvEditor.status = btn.dataset.tvStatus === 'been' ? 'been' : 'wish';
      syncTravelStatusUI();
    });
  });
  const saveBtn = $('#tvSave');
  if (saveBtn) saveBtn.addEventListener('click', saveTravelModal);
  const delBtn = $('#tvDelete');
  if (delBtn) delBtn.addEventListener('click', deleteTravelModal);
  const nameInput = $('#tvName');
  if (nameInput) nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); saveTravelModal(); }
  });
  const memoInput = $('#tvMemo');
  if (memoInput) memoInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); saveTravelModal(); }
  });
}

function initTravel() {
  bindTravelEvents();
  renderTravelAll();
}
