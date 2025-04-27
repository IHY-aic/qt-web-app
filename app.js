// — CONFIG —
const TRANSLATION = 'kjv';

// — STATE —
let currentVerseText = '';

// — UTILITIES —
function normalize(str) {
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}
function markDayCompleted(date) {
  const prog = JSON.parse(localStorage.getItem('qt_progress') || '{}');
  prog[date] = { completed: true };
  localStorage.setItem('qt_progress', JSON.stringify(prog));
}

// — FETCH TODAY’S VERSE —
function fetchVerse() {
  const today = new Date().toISOString().split('T')[0];
  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  const todayPlan = plan.find(p => p.date === today);
  if (!todayPlan) {
    document.getElementById('verse').innerText =
      'No verse set for today. Please set up a plan.';
    return;
  }
  const passage = encodeURIComponent(todayPlan.verse);
  fetch(`https://bible-api.com/${passage}?translation=${TRANSLATION}`)
    .then(r => r.json())
    .then(data => {
      currentVerseText = (data.text || todayPlan.verse).trim();
      document.getElementById('verse').innerText = currentVerseText;
    })
    .catch(() => {
      currentVerseText = todayPlan.verse;
      document.getElementById('verse').innerText = currentVerseText;
    });
}

// — TYPING CHECK —
function saveTypedVerse() {
  const typed = document.getElementById('typedVerse').value;
  const msg = document.getElementById('typingMessage');
  if (normalize(typed) === normalize(currentVerseText)) {
    msg.innerHTML = '<span class="text-success">✅ Correct! Well done.</span>';
  } else {
    msg.innerHTML =
      '<span class="text-danger">❌ Not quite. Exact verse is below:</span><br>' +
      `<em>${currentVerseText}</em>`;
  }
  markDayCompleted(new Date().toISOString().split('T')[0]);
}

// — REFLECTION —
function saveReflection() {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`reflection_${today}`, document.getElementById('reflection').value);
  const sm = document.getElementById('savedMessage');
  sm.innerText = 'Reflection saved!';
  setTimeout(() => (sm.innerText = ''), 2000);
  markDayCompleted(today);
}

// — NAVIGATION —
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => (s.style.display = 'none'));
  document.getElementById(id).style.display = 'block';
}
function showHome()         { showScreen('home'); fetchVerse(); }
function showPlanManager()  { showScreen('planManager'); loadPlan(); }
function showCalendar()     { showScreen('calendarView'); renderCalendar(); }

// — PLAN GENERATION (VERSE-RANGE CHUNKING) —
function generatePlan() {
  const sdVal = document.getElementById('planStartDate').value;
  const book   = document.getElementById('planBook').value.trim();
  const svVal  = document.getElementById('planStartVerse').value.trim();
  const evVal  = document.getElementById('planEndVerse').value.trim();
  const days   = parseInt(document.getElementById('planDuration').value, 10);

  if (!sdVal || !book || !svVal || !evVal || !days) {
    return alert('Please fill all plan fields.');
  }

  const [sc, sv] = svVal.split(':').map(Number);
  const [ec, ev] = evVal.split(':').map(Number);
  if (sc !== ec) {
    return alert('Only single-chapter ranges are supported for now.');
  }

  // how many verses total?
  const total = ev - sv + 1;
  const perDay = Math.ceil(total / days);
  const start = new Date(sdVal);
  const plan = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const vs = sv + i * perDay;
    if (vs > ev) break;
    const ve = Math.min(vs + perDay - 1, ev);
    plan.push({ date: iso, verse: `${book} ${sc}:${vs}-${ve}` });
  }

  localStorage.setItem('qt_plan', JSON.stringify(plan));
  loadPlan();
}

function loadPlan() {
  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  const ul = document.getElementById('planList');
  ul.innerHTML = '';
  plan.forEach(p => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerText = `${p.date}: ${p.verse}`;
    ul.appendChild(li);
  });
}

// — INITIALIZE HOME —
fetchVerse();
