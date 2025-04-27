<!-- app.js -->
const TRANSLATION = 'kjv';
let currentVerseText = '';

function normalize(str) {
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}

function markDayCompleted(date) {
  const prog = JSON.parse(localStorage.getItem('qt_progress') || '{}');
  prog[date] = { completed: true };
  localStorage.setItem('qt_progress', JSON.stringify(prog));
}

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

function saveReflection() {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`reflection_${today}`, document.getElementById('reflection').value);
  const sm = document.getElementById('savedMessage');
  sm.innerText = 'Reflection saved!';
  setTimeout(() => (sm.innerText = ''), 2000);
  markDayCompleted(today);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => (s.style.display = 'none'));
  document.getElementById(id).style.display = 'block';
}
function showHome()        { showScreen('home'); fetchVerse(); }
function showPlanManager() { showScreen('planManager'); loadPlan(); }
function showCalendar()    { showScreen('calendarView'); renderCalendar(); }

function generatePlan() {
  const sdVal = document.getElementById('planStartDate').value;
  const book   = document.getElementById('planBook').value.trim();
  const chap   = parseInt(document.getElementById('planChapter').value,10);
  const sv     = parseInt(document.getElementById('planStartVerse').value,10);
  const ev     = parseInt(document.getElementById('planEndVerse').value,10);
  const perDay = parseInt(document.getElementById('versesPerDay').value,10);
  const intervalType = document.getElementById('intervalType').value;

  if (!sdVal||!book||!chap||!sv||!ev||!perDay) {
    return alert('Please fill all plan fields.');
  }
  if (ev < sv) {
    return alert('End verse must be >= start verse');
  }

  const totalVerses = ev - sv + 1;
  const chunks = [];
  for (let start = sv; start <= ev; start += perDay) {
    const end = Math.min(start + perDay - 1, ev);
    chunks.push({ verse: `${book} ${chap}:${start}-${end}` });
  }

  const startDate = new Date(sdVal);
  const step = intervalType === 'week' ? 7 : 1;
  const plan = [];
  chunks.forEach((chunk, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * step);
    plan.push({ date: d.toISOString().split('T')[0], verse: chunk.verse });
  });

  localStorage.setItem('qt_plan', JSON.stringify(plan));
  loadPlan();
}

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

fetchVerse();

// —— Read-Aloud Recording ——
const recordBtn = document.getElementById('recordBtn');
const stopBtn   = document.getElementById('stopBtn');
const audioEl   = document.getElementById('audioPlayback');
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
        recordedChunks = [];
        const url = URL.createObjectURL(blob);
        audioEl.src = url;
        audioEl.style.display = 'block';
      };
    } catch (err) {
      return alert('Microphone access is required.');
    }
  }
  mediaRecorder.start();
  recordBtn.disabled = true;
  stopBtn.disabled   = false;
});

stopBtn.addEventListener('click', () => {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
    stopBtn.disabled = true;
    recordBtn.disabled = false;
  }
});
