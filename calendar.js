<!-- calendar.js -->
function renderCalendar() {
  const cal = document.getElementById('calendar');
  const details = document.getElementById('dayDetails');
  cal.innerHTML = '';
  details.innerHTML = '';
  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  const prog = JSON.parse(localStorage.getItem('qt_progress') || '{}');
  plan.forEach(day => {
    const d = document.createElement('div');
    d.className = 'day text-center';
    d.innerText = day.date.split('-').slice(1).join('/');
    if (prog[day.date] && prog[day.date].completed) d.classList.add('completed');
    else d.classList.add(new Date(day.date) < new Date().toISOString().split('T')[0] ? 'missed' : 'pending');
    d.onclick = () => {
      details.innerHTML = `<div class="card"><div class="card-body">
        <h5>${day.date}</h5>
        <p><strong>Verse:</strong> ${day.verse}</p>
        <p><strong>Typed:</strong> ${localStorage.getItem(`typed_${day.date}`) || '—'}</p>
        <p><strong>Reflection:</strong> ${localStorage.getItem(`reflection_${day.date}`) || '—'}</p>
      </div></div>`;
    };
    cal.appendChild(d);
  });
}
