// — CONFIG —
const TRANSLATION = 'kjv';
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
  fetch(
    `https://bible-api.com/${encodeURIComponent(todayPlan.verse)}?translation=${TRANSLATION}`
  )
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
      '<span class="text-danger">❌ Not quite. Exact verse is below:</span><br><em>' +
      currentVerseText +
      '</em>';
  }
  markDayCompleted(new Date().toISOString().split('T')[0]);
}

// — REFLECTION —
function saveReflection() {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(
    `reflection_${today}`,
    document.getElementById('reflection').value
  );
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
function showHome()        { showScreen('home'); fetchVerse(); }
function showPlanManager() { showScreen('planManager'); loadPlan(); }
function showCalendar()    { showScreen('calendarView'); renderCalendar(); }

// — PLAN GENERATION —
function generatePlan() {
  const sdVal = document.getElementById('planStartDate').value;
  const edVal = document.getElementById('planEndDate').value;
  const book  = document.getElementById('planBook').value.trim();
  const chap  = parseInt(document.getElementById('planChapter').value, 10);
  const perDay= parseInt(document.getElementById('versesPerDay').value, 10);
  const interval = 'day'; // you can switch to 'week' if needed

  if (!sdVal || !edVal || !book || !chap || !perDay) {
    return alert('Please fill all plan fields.');
  }
  const startD = new Date(sdVal);
  const endD   = new Date(edVal);
  if (endD < startD) return alert('End Date must be after Start Date');

  // build date slots
  const dates = [];
  for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  // chunk verses sequentially in chosen chapter
  // assume chapter has >= dates.length * perDay verses
  const chunks = [];
  let verseNum = 1;
  dates.forEach(() => {
    const vs = verseNum;
    const ve = verseNum + perDay - 1;
    chunks.push(`${book} ${chap}:${vs}-${ve}`);
    verseNum += perDay;
  });

  // map dates→chunks
  const plan = dates.map((d,i) => ({
    date: d.toISOString().split('T')[0],
    verse: chunks[i]
  }));
  localStorage.setItem('qt_plan', JSON.stringify(plan));
  loadPlan();
}

function loadPlan() {
  const plan = JSON.parse(localStorage.getItem('qt_plan')||'[]');
  const ul = document.getElementById('planList');
  ul.innerHTML = '';
  plan.forEach(p => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerText = `${p.date}: ${p.verse}`;
    ul.appendChild(li);
  });
}

fetchVerse();

// — RECORDING —
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
        audioEl.src = URL.createObjectURL(blob);
        audioEl.style.display = 'block';
      };
    } catch {
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
