function fetchVerse() {
  const today = new Date().toISOString().split('T')[0];
  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  const todayPlan = plan.find(p => p.date === today);

  if (todayPlan) {
    const passage = encodeURIComponent(todayPlan.verse);
    fetch(`https://bible-api.com/${passage}?translation=kjv`)
      .then(response => response.json())
      .then(data => {
        if (data.text) {
          document.getElementById('verse').innerText = data.text;
        } else {
          document.getElementById('verse').innerText = todayPlan.verse;
        }
      })
      .catch(error => {
        console.error('Error fetching Bible verse:', error);
        document.getElementById('verse').innerText = todayPlan.verse;
      });
  } else {
    document.getElementById('verse').innerText = 'No verse set for today. Set up your plan!';
  }
}

function saveTypedVerse() {
  const typed = document.getElementById('typedVerse').value;
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`typed_${today}`, typed);
  markDayCompleted(today);
  showSavedMessage('Typed verse saved!');
}

function saveReflection() {
  const reflection = document.getElementById('reflection').value;
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`reflection_${today}`, reflection);
  markDayCompleted(today);
  showSavedMessage('Reflection saved!');
}

function markDayCompleted(date) {
  const progress = JSON.parse(localStorage.getItem('qt_progress') || '{}');
  progress[date] = { completed: true };
  localStorage.setItem('qt_progress', JSON.stringify(progress));
}

function showSavedMessage(message) {
  const savedMessage = document.getElementById('savedMessage');
  savedMessage.innerText = message;
  setTimeout(() => savedMessage.innerText = '', 3000);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(div => div.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function showHome() {
  showScreen('home');
  fetchVerse();
}

function showPlanManager() {
  showScreen('planManager');
  loadPlan();
}

function showCalendar() {
  showScreen('calendarView');
  renderCalendar();
}

function addPlan() {
  const date = document.getElementById('planDate').value;
  const verse = document.getElementById('planVerse').value;
  if (!date || !verse) {
    alert('Please fill both fields.');
    return;
  }
  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  plan.push({ date, verse });
  localStorage.setItem('qt_plan', JSON.stringify(plan));
  document.getElementById('planDate').value = '';
  document.getElementById('planVerse').value = '';
  loadPlan();
}

function loadPlan() {
  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  const planList = document.getElementById('planList');
  planList.innerHTML = '';
  plan.sort((a, b) => new Date(a.date) - new Date(b.date));
  plan.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.date}: ${item.verse}`;
    planList.appendChild(li);
  });
}

fetchVerse();
