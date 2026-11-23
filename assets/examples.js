// The rendered topic tables remain available without JavaScript.
{
  const catalog = document.querySelector('.example-catalog');
  const form = catalog.querySelector('.example-filters');
  const { query, language } = form.elements;
  const count = form.querySelector('.example-count');
  const topics = Array.from(catalog.querySelectorAll('.example-topics a'), (link) => {
    const heading = document.getElementById(link.hash.slice(1));
    const summary = heading.nextElementSibling;
    const table = summary.nextElementSibling;
    const rows = Array.from(table.tBodies[0].rows, (row) => ({
      row,
      language: row.cells[1].textContent.trim(),
      text: Array.from(row.cells, (cell) => cell.textContent).join(' ').toLowerCase(),
    }));
    return { link, heading, summary, table, rows };
  });

  function filter() {
    const words = query.value.trim().toLowerCase().split(/\s+/);
    let total = 0;
    for (const topic of topics) {
      let matches = 0;
      for (const entry of topic.rows) {
        const visible = (!language.value || entry.language === language.value) &&
          words.every((word) => entry.text.includes(word));
        entry.row.hidden = !visible;
        if (visible) matches++;
      }
      for (const element of [topic.link, topic.heading, topic.summary, topic.table]) element.hidden = !matches;
      total += matches;
    }
    count.textContent = total ? `${total} ${total === 1 ? 'example' : 'examples'}` : 'No matching examples';
  }

  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('reset', () => requestAnimationFrame(filter));
  filter();
  form.hidden = false;
}
