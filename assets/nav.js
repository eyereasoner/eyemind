// The top navigation's menus are <details> elements: opening one closes the
// others and shifts it to stay on screen when the bar wraps on a phone, and
// a click elsewhere or Escape closes them all.
const menus = document.querySelectorAll('.nav-menu');
const close = (except) => { for (const menu of menus) if (menu !== except) menu.open = false; };
const fit = (menu) => {
  const list = menu.querySelector('div');
  list.style.transform = '';
  const box = list.getBoundingClientRect();
  const margin = 12;
  const shift = Math.max(margin - box.left, Math.min(0, innerWidth - margin - box.right));
  if (shift) list.style.transform = `translateX(${shift}px)`;
};
for (const menu of menus) menu.addEventListener('toggle', () => { if (menu.open) { close(menu); fit(menu); } });
document.addEventListener('click', (event) => { if (!event.target.closest('.nav-menu')) close(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
