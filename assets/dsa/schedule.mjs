import { patterns, problems, schedule, weeks, dayView } from './curriculum.mjs';
import { loadProgress, saveProgress, setCompleted } from './progress.mjs';

const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function renderDay(number, completed = false) {
  const view = dayView(number);
  const reminders = new Set();
  for (const item of view.problems) {
    if (item.taxonomy?.reminder) reminders.add(item.taxonomy.reminder);
  }
  const shortestPathDay = !view.blind && view.problems.some(item =>
    ['Weighted Shortest Path', 'All-pairs Shortest Path'].includes(item.taxonomy?.pattern));
  return `
    <div class="dsa-drill-heading">
      <div>
        <p class="dsa-position">Week ${view.week} · Day ${view.day} of 70</p>
        <h3 id="dsaDayTitle" tabindex="-1">${escape(view.title)}</h3>
      </div>
      <label class="dsa-complete" for="dsaComplete">
        <input type="checkbox" id="dsaComplete" ${completed ? 'checked' : ''}>
        Day complete
      </label>
    </div>
    ${view.blind ? '<p class="dsa-focus">Identify the pattern yourself. Questions are intentionally ungrouped; hints stay hidden this week.</p>' : ''}
    ${view.focus ? `<p class="dsa-focus">${escape(view.focus)}</p>` : ''}
    <ol class="dsa-problems">
      ${view.problems.map(item => `
        <li>
          <div class="dsa-problem-heading">
            <h4>${escape(item.name)}</h4>
            <span class="dsa-pass ${item.revision ? 'dsa-revision' : ''}">${item.revision ? 'Revision' : item.activity ? 'Reasoning exercise' : 'First pass'}</span>
          </div>
          ${item.taxonomy ? `
            <p class="dsa-taxonomy">${escape(item.taxonomy.category)} <span aria-hidden="true">→</span> ${escape(item.taxonomy.pattern)}${item.taxonomy.subPattern ? ` <span aria-hidden="true">→</span> ${escape(item.taxonomy.subPattern)}` : ''}</p>
            <p class="dsa-hint"><strong>Recognize it:</strong> ${escape(item.taxonomy.recognitionHint)}</p>
          ` : ''}
        </li>
      `).join('')}
    </ol>
    ${reminders.size ? `<aside class="dsa-reminder" aria-label="Pattern reminders">${[...reminders].map(text => `<p>${escape(text)}</p>`).join('')}</aside>` : ''}
    ${shortestPathDay ? '<aside class="dsa-reminder"><p>Unweighted → BFS · Non-negative weighted → Dijkstra · Negative edges → Bellman-Ford · All pairs → Floyd-Warshall (manageable V)</p></aside>' : ''}
    ${view.dpReminder ? `
      <aside class="dsa-reminder" aria-label="DP reasoning workflow">
        <h4>Before coding, define your state</h4>
        <p>“<code>dp(...)</code> means __________.”</p>
        <p>Choices → required past information → state meaning → recurrence → base cases → memoization → complexity → tabulation → optimization</p>
      </aside>
    ` : ''}
  `;
}

export function renderReference() {
  return `
    <p class="dsa-reference-intro">Use the specific family to name the idea. Advanced patterns are reference-only for now.</p>
    <div class="dsa-table-scroll" role="region" aria-label="Pattern recognition reference" tabindex="0">
      <table>
        <caption class="dsa-sr-only">DSA categories, pattern families and recognition signals</caption>
        <thead><tr><th scope="col">Category</th><th scope="col">Pattern / sub-pattern</th><th scope="col">Recognition signal</th></tr></thead>
        <tbody>${Object.entries(patterns).map(([id, entry]) => `
          <tr>
            <td>${escape(entry.category === 'Dynamic Programming' ? 'DP' : entry.category)}</td>
            <th scope="row">${escape(entry.pattern)}${entry.subPattern ? `<span>${escape(entry.subPattern)}</span>` : ''}${entry.future ? '<span class="dsa-future">Advanced / future</span>' : ''}</th>
            <td>${escape(entry.recognitionHint)}${entry.future ? '' : `<details class="dsa-examples"><summary>Example problems</summary><ul>${Object.values(problems).filter(item => item.patternId === id && !item.activity).map(item => `<li>${escape(item.name)}</li>`).join('')}</ul></details>`}</td>
          </tr>
        `).join('')}</tbody>
      </table>
    </div>
  `;
}

function mount() {
  const byId = id => document.getElementById(id);
  const panel = byId('dsaPanel');
  if (!panel) return;
  // Access to the localStorage property itself can throw in private/restricted contexts.
  let storage;
  try { storage = window.localStorage; } catch { /* In-memory use remains available. */ }
  const loaded = loadProgress(storage);
  let progress = loaded.progress;
  let readWarning = loaded.warning;
  let guideStats = byId('navStats').textContent;
  const tabs = [byId('guideTab'), byId('dsaTab')];

  function persist() {
    const saved = saveProgress(storage, progress);
    if (saved) readWarning = '';
    byId('dsaSaveStatus').textContent = saved
      ? 'Completion is saved in this browser.'
      : 'Progress could not be saved. Changes will last only in this tab; allow browser storage and try again.';
  }

  function render() {
    const focusId = panel.contains(document.activeElement) ? document.activeElement.id : '';
    const week = Math.ceil(progress.currentDay / 7);
    const completed = new Set(progress.completedDays);
    const count = completed.size;
    byId('dsaProgress').value = count;
    byId('dsaProgressLabel').textContent = `${count} of 70 days complete · ${Math.round(count / 70 * 100)}%`;
    byId('dsaResume').disabled = count === 70;
    byId('dsaResume').textContent = count === 70 ? 'All 70 days complete' : 'Go to next incomplete day';
    byId('dsaWeeks').innerHTML = weeks.map((title, index) => {
      const number = index + 1;
      const done = schedule.filter(day => day.week === number && completed.has(day.day)).length;
      return `<button type="button" id="dsaWeek${number}" data-day="${index * 7 + 1}" ${number === week ? 'aria-current="true"' : ''} aria-label="Week ${number}: ${escape(title)}, ${done} of 7 days complete">Week ${number}<span>${done}/7</span></button>`;
    }).join('');
    byId('dsaWeekTitle').textContent = `Week ${week} — ${weeks[week - 1]}`;
    byId('dsaDays').innerHTML = schedule.filter(day => day.week === week).map(day => `
      <button type="button" id="dsaDay${day.day}" data-day="${day.day}" ${day.day === progress.currentDay ? 'aria-current="true"' : ''} aria-label="Day ${day.day}${completed.has(day.day) ? ', complete' : ''}">
        Day ${day.day}${completed.has(day.day) ? ' <span aria-hidden="true">✓</span>' : ''}
      </button>
    `).join('');
    byId('dsaDrill').innerHTML = renderDay(progress.currentDay, completed.has(progress.currentDay));
    byId('dsaPrevious').disabled = progress.currentDay === 1;
    byId('dsaNext').disabled = progress.currentDay === 70;
    byId('dsaReference').hidden = week === 10;
    byId('dsaBlindReference').hidden = week !== 10;
    if (week === 10) {
      byId('dsaReference').open = false;
      byId('dsaReferenceContent').replaceChildren();
    }
    if (focusId) {
      const target = byId(focusId);
      (target && !target.disabled ? target : byId('dsaDayTitle')).focus({ preventScroll: true });
    }
  }

  function openDay(day) {
    if (!Number.isInteger(day) || day < 1 || day > 70) return;
    window.location.hash = `dsa/day-${day}`;
  }

  function syncLocation() {
    const match = window.location.hash.match(/^#dsa(?:\/day-(\d+))?$/);
    const isDSA = Boolean(match);
    const wasDSA = !panel.hidden;
    if (isDSA && !wasDSA) guideStats = byId('navStats').textContent;
    panel.hidden = !isDSA;
    byId('mainContent').hidden = isDSA;
    byId('guideTools').hidden = isDSA;
    byId('guideToc').hidden = isDSA;
    byId('guideSummary').hidden = isDSA;
    byId('guideMeta').hidden = isDSA;
    // Guide-only anchor navigation must retain the live search/filter count.
    if (isDSA || wasDSA) byId('navStats').textContent = isDSA ? '70-day schedule' : guideStats;
    tabs.forEach((tab, index) => {
      const selected = isDSA === (index === 1);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    if (isDSA) {
      const day = Number(match[1]);
      if (Number.isInteger(day) && day >= 1 && day <= 70 && day !== progress.currentDay) {
        progress.currentDay = day;
        persist();
      }
      render();
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      window.location.hash = index === 1 ? `dsa/day-${progress.currentDay}` : 'guide';
    });
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[1] : tabs[1 - index];
      target.focus();
      target.click();
    });
  });
  panel.addEventListener('click', event => {
    const button = event.target.closest('button[data-day]');
    if (button) openDay(Number(button.dataset.day));
  });
  panel.addEventListener('change', event => {
    if (event.target.id !== 'dsaComplete') return;
    progress = setCompleted(progress, progress.currentDay, event.target.checked);
    persist();
    render();
  });
  byId('dsaPrevious').addEventListener('click', () => openDay(progress.currentDay - 1));
  byId('dsaNext').addEventListener('click', () => openDay(progress.currentDay + 1));
  byId('dsaResume').addEventListener('click', () => {
    const next = schedule.find(day => !progress.completedDays.includes(day.day));
    if (next) openDay(next.day);
  });
  byId('dsaReference').addEventListener('toggle', () => {
    if (byId('dsaReference').open && !byId('dsaReference').hidden) {
      byId('dsaReferenceContent').innerHTML = renderReference();
    }
  });
  byId('dsaSaveStatus').textContent = readWarning || 'Completion is saved in this browser.';
  byId('studyTabs').hidden = false;
  window.addEventListener('hashchange', syncLocation);
  syncLocation();
}

if (typeof document !== 'undefined') mount();
