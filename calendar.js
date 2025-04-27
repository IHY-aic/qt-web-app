function renderCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
  const plan = JSON.parse(localStorage.getItem('qt_plan') || '[]');
  const progress = JSON.parse(localStorage.getItem('qt_progress') || '{}');

  plan.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  plan.forEach(day => {
    const div = document.createElement('div');
    div.className = 'day';
    div.innerText = day.date.split('-').slice(1).join('/'); // MM/DD

    if (progress[day.date] && progress[day.date].completed) {
      div.classList.add('completed');
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (new Date(day.date) < new Date(today)) {
        div.classList.add('missed');
      } else {
        div.classList.add('pending');
      }
    }
    calendar.appendChild(div);
  });
}
