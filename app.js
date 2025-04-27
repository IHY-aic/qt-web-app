<!-- app.js -->
let currentVerseText = '';
const TRANSLATION = 'kjv';

// Fetch today's verse
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
      currentVerseText = (data.text || todayPlan.verse).trim();
      document.getElementById('verse').innerText = currentVerseText;
    })
    .catch(() => {
      currentVerseText = todayPlan.verse;
      document.getElementById('verse').innerText = currentVerseText;
    });
}

// Normalize for comparison
function normalize(str) {
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// Check typing accuracy
function saveTypedVerse() {
  const typed = document.getElementById('typedVerse').value;
  const msgEl = document.getElementById('typingMessage');
  if (normalize(typed) === normalize(currentVerseText)) {
    msgEl.innerHTML =
      '<span class="text-success">✅ Correct! Well done.</span>';
  } else {
    msgEl.innerHTML =
      '<span class="text-danger">❌ Not quite. Exact verse:</span><br/><em>' +
      currentVerseText +
      '</em>';
  }
  markDayCompleted(new Date().toISOString().split('T')[0]);
}

// Save reflection
function saveReflection() {
  const ref = document.getElementById('reflection').value;
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`reflection_${today}`, ref);
  document.getElementById('savedMessage').innerText = 'Reflection saved!';
  setTimeout(() => (document.getElementById('savedMessage').innerText = ''), 3000);
  markDayCompleted(today);
}

// Mark progress
function markDayCompleted(date) {
  const prog = JSON.parse(localStorage.getItem('qt_progress') || '{}');
  prog[date] = { completed: true };
  localStorage.setItem('qt_progress', JSON.stringify(prog));
}

// Screen switch
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => (s.style.display = 'none'));
  document.getElementById(id).style.display = 'block';
}
function showHome() { showScreen('home'); fetchVerse(); }
function showPlanManager() { showScreen('planManager'); loadPlan(); }
function showCalendar() { showScreen('calendarView'); renderCalendar(); }

// Generate plan by verse range
function generatePlan() {
  const startDate = new Date(document.getElementById('planStartDate').value);
  const book = document.getElementById('planBook').value.trim();
  const startV = document.getElementById('planStartVerse').value.trim();
  const endV = document.getElementById('planEndVerse').value.trim();
  const days = parseInt(document.getElementById('planDuration').value, 10);
  if (!startDate || !book || !startV || !endV || !days) {
    return alert('Please fill all plan fields.');
  }
  // parse "chapter:verse"
  const [sc, sv] = startV.split(':').map(Number);
  const [ec, ev] = endV.split(':').map(Number);
  if (sc !== ec) {
    return alert('Multi-chapter ranges not supported yet.');
  }
  const total = ev - sv + 1;
  const perDay = Math.ceil(total / days);
  const plan = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
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

// Load plan list
function loadPlan() {
  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  const ul = document.getElementById('planList'); ul.innerHTML = '';
  plan.forEach(p => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerText = `${p.date}: ${p.verse}`;
    ul.appendChild(li);
  });
}

// Initialize Home
fetchVerse();

// —— Read-Aloud Recording ——
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const audioPlayback = document.getElementById('audioPlayback');
let mediaRecorder, recordedChunks = [];

recordBtn.addEventListener('click', async () => {
  if (!mediaRecorder) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];
      mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        audioPlayback.src = url;
        audioPlayback.style.display = 'block';
      };
    } catch (err) {
      return alert('Microphone access is needed.');
    }
  }
  mediaRecorder.start();
  recordBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    stopBtn.disabled = true;
    recordBtn.disabled = false;
  }
});
