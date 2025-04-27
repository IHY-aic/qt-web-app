function renderCalendar() {
  const cal     = document.getElementById('calendar');
  const details = document.getElementById('dayDetails');
  cal.innerHTML = '';
  details.innerHTML = '';

  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  const prog = JSON.parse(localStorage.getItem('qt_progress') || '{}');

  plan.forEach(day => {
    const cell = document.createElement('div');
    cell.className = 'day text-center';
    cell.innerText = day.date.split('-').slice(1).join('/');
    if (prog[day.date]?.completed) cell.classList.add('completed');
    else if (new Date(day.date) < new Date().setHours(0,0,0,0))
      cell.classList.add('missed');
    else cell.classList.add('pending');

    cell.onclick = () => {
      const typed = localStorage.getItem(`typed_${day.date}`) || '—';
      const refl  = localStorage.getItem(`reflection_${day.date}`) || '—';
      details.innerHTML = `
        <div class="card"><div class="card-body">
          <h6>${day.date}</h6>
          <p><strong>Verse:</strong> ${day.verse}</p>
          <p><strong>Typed:</strong> ${typed}</p>
          <p><strong>Reflection:</strong> ${refl}</p>
        </div></div>`;
    };

    cal.appendChild(cell);
  });
}
