// Global for current verse text
let currentVerseText = '';

// ———— CONFIG ———— //
const TRANSLATION = 'kjv';

// ———— FETCH & DISPLAY TODAY’S VERSE ———— //
function fetchVerse() {
  const today = new Date().toISOString().split('T')[0];
  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  const todayPlan = plan.find(p => p.date === today);

  if (!todayPlan) {
    document.getElementById('verse').innerText =
      'No verse set for today. Go to Plan Manager.';
    return;
  }

  const passage = encodeURIComponent(todayPlan.verse);
  fetch(`https://bible-api.com/${passage}?translation=${TRANSLATION}`)
    .then(res => res.json())
    .then(data => {
      currentVerseText = data.text?.trim() || todayPlan.verse;
      document.getElementById('verse').innerText = currentVerseText;
    })
    .catch(err => {
      console.error(err);
      currentVerseText = todayPlan.verse;
      document.getElementById('verse').innerText = currentVerseText;
    });
}

// ———— TYPING CHECK ———— //
function normalize(str) {
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}

function saveTypedVerse() {
  const typed = document.getElementById('typedVerse').value;
  const msgEl = document.getElementById('typingMessage');
  if (normalize(typed) === normalize(currentVerseText)) {
    msgEl.innerHTML = '<span class="text-success">✅ Correct!</span>';
  } else {
    msgEl.innerHTML =
      '<span class="text-danger">❌ Try again. Exact text:</span><br/>' +
      `<em>${currentVerseText}</em>`;
  }
  // always mark completed
  markDayCompleted(new Date().toISOString().split('T')[0]);
}

// ———— REFLECTION SAVE ———— //
function saveReflection() {
  const reflection = document.getElementById('reflection').value;
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`reflection_${today}`, reflection);
  showSavedMessage('Reflection saved!');
  markDayCompleted(today);
}

// ———— SHARED UTILITIES ———— //
function markDayCompleted(date) {
  const prog = JSON.parse(localStorage.getItem('qt_progress') || '{}');
  prog[date] = { completed: true };
  localStorage.setItem('qt_progress', JSON.stringify(prog));
}

function showSavedMessage(msg) {
  const el = document.getElementById('savedMessage');
  el.innerText = msg;
  setTimeout(() => (el.innerText = ''), 3000);
}

// ———— SCREEN NAVIGATION ———— //
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => (s.style.display = 'none'));
  document.getElementById(id).style.display = 'block';
}
function showHome() { showScreen('home'); fetchVerse(); }
function showPlanManager() { showScreen('planManager'); loadPlan(); }
function showCalendar() { showScreen('calendarView'); renderCalendar(); }

// ———— PLAN GENERATION ———— //
function generatePlan() {
  const startDate = new Date(
    document.getElementById('planStartDate').value
  );
  const book = document.getElementById('planBook').value.trim();
  const startChap = parseInt(
    document.getElementById('planStartChapter').value,
    10
  );
  const duration = parseInt(
    document.getElementById('planDuration').value,
    10
  );
  if (!startDate || !book || !startChap || !duration) {
    return alert('Fill all plan fields.');
  }
  const plan = [];
  for (let i = 0; i < duration; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    plan.push({ date: iso, verse: `${book} ${startChap + i}` });
  }
  localStorage.setItem('qt_plan', JSON.stringify(plan));
  loadPlan();
}

// ———— LOAD + DISPLAY PLAN ———— //
function loadPlan() {
  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  const ul = document.getElementById('planList');
  ul.innerHTML = '';
  plan.forEach(item => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerText = `${item.date}: ${item.verse}`;
    ul.appendChild(li);
  });
}

// ———— READ-ALOUD RECORDING ———— //
let mediaRecorder, recordedChunks = [];

function initRecorder() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        recordedChunks = [];
        const url = URL.createObjectURL(blob);
        const audio = document.getElementById('audioPlayback');
        audio.src = url;
        audio.style.display = 'block';
      };
    })
    .catch(console.error);
}

document.addEventListener('DOMContentLoaded', () => {
  initRecorder();
  const recBtn = document.getElementById('recordBtn');
  const stopBtn = document.getElementById('stopBtn');

  recBtn.onclick = () => {
    mediaRecorder.start();
    recBtn.disabled = true;
    stopBtn.disabled = false;
  };
  stopBtn.onclick = () => {
    mediaRecorder.stop();
    stopBtn.disabled = true;
    recBtn.disabled = false;
  };
});


// initialize
fetchVerse();
