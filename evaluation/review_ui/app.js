const $ = (id) => document.getElementById(id);
const fields = ['correctness_0_1_2', 'actionability_0_1_2', 'excessive_disclosure_yes_no', 'progression_appropriate_yes_no'];
const names = { code_only: 'Code only', diagnostic_grounded: 'Diagnostic grounded', full_pipeline: 'Full pipeline' };
let data, saved, currentId, drafts = {}, storageKey, busy = false, storageAvailable = true;
let showReference = false, aiVisible = true;

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function current() { return data.cases.find((row) => row.review_id === currentId); }
function formValue(id = currentId) {
  return drafts[id] || saved.reviews[id] || { notes: '', reviewer_name: readLocal('hint-reviewer-name') || '' };
}
function readLocal(key) { try { return localStorage.getItem(key); } catch { storageAvailable = false; return null; } }
function writeLocal(key, value) {
  try { localStorage.setItem(key, value); } catch { storageAvailable = false; }
}
function persistDrafts() { writeLocal(storageKey, JSON.stringify(drafts)); }
function visibleRows() {
  const query = $('search').value.trim().toLowerCase();
  const filter = $('filter').value;
  return data.cases.filter((row) => {
    const review = saved.reviews[row.review_id];
    const searchable = `${row.review_id} ${row.task} ${row.case_id} ${names[row.condition]}`.toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filter === 'unreviewed') return review?.status !== 'reviewed';
    if (filter === 'reviewed') return review?.status === 'reviewed';
    if (filter === 'flagged') return review?.status === 'flagged';
    if (filter === 'adjusted') return review?.decision === 'adjusted_ai';
    if (filter === 'ai-issues') return row.ai.correctness_0_1_2 < 2;
    return true;
  });
}
function renderNavigation() {
  const reviewed = Object.values(saved.reviews).filter((r) => r.status === 'reviewed').length;
  const flagged = Object.values(saved.reviews).filter((r) => r.status === 'flagged').length;
  $('progress-label').textContent = `${reviewed} of ${data.cases.length} reviewed`;
  $('progress-percent').textContent = `${Math.round(100 * reviewed / data.cases.length)}%`;
  $('progress').value = reviewed;
  $('progress').max = data.cases.length;
  $('flagged-count').textContent = `${flagged} flagged for another look`;
  const rows = visibleRows(), index = rows.findIndex((r) => r.review_id === currentId);
  $('position').textContent = index < 0 ? 'Current response is outside this filter' : `Response ${index + 1} of ${rows.length}`;
  $('previous').disabled = busy || index <= 0;
  $('next').disabled = busy || index < 0 || index === rows.length - 1;
  const list = $('response-list'); list.replaceChildren();
  if (!rows.length) list.append(node('p', 'No responses match this filter.', 'empty-list'));
  rows.forEach((row) => {
    const review = saved.reviews[row.review_id];
    const button = node('button', undefined, `response-item ${row.review_id === currentId ? 'active' : ''} ${review?.status === 'flagged' ? 'flagged' : ''}`);
    button.type = 'button'; button.disabled = busy;
    button.setAttribute('aria-current', row.review_id === currentId ? 'true' : 'false');
    button.append(node('strong', row.review_id), node('span', row.task, 'item-task'),
      node('span', review?.status === 'reviewed' ? '✓' : review?.status === 'flagged' ? '⚑' : drafts[row.review_id] ? '•' : '', 'item-status'));
    button.addEventListener('click', () => selectCase(row.review_id));
    list.append(button);
  });
}
function renderCode() {
  const row = current();
  $('code').textContent = showReference ? row.reference_code : row.code;
  $('code-caption').textContent = showReference
    ? 'One verified correction. Other valid repairs may also satisfy the public task.'
    : 'The submitted program that produced this response.';
  $('tab-submitted').setAttribute('aria-selected', String(!showReference));
  $('tab-reference').setAttribute('aria-selected', String(showReference));
  $('program-panel').setAttribute('aria-labelledby', showReference ? 'tab-reference' : 'tab-submitted');
}
function renderAI() {
  const ai = current().ai;
  $('ai-body').classList.toggle('hidden', !aiVisible);
  $('toggle-ai').textContent = aiVisible ? 'Hide' : 'Show';
  $('toggle-ai').setAttribute('aria-expanded', String(aiVisible));
  const labels = [
    ['Correctness', `${ai.correctness_0_1_2} / 2 · ${['Incorrect', 'Partly correct', 'Correct'][ai.correctness_0_1_2]}`, ['bad', 'partial', 'good'][ai.correctness_0_1_2]],
    ['Actionability', `${ai.actionability_0_1_2} / 2 · ${['Unhelpful', 'Vague / incomplete', 'Useful next step'][ai.actionability_0_1_2]}`, ['bad', 'partial', 'good'][ai.actionability_0_1_2]],
    ['Excessive disclosure', ai.excessive_disclosure_yes_no === 'yes' ? 'Yes · too much revealed' : 'No', ai.excessive_disclosure_yes_no === 'yes' ? 'bad' : 'good'],
    ['Hint progression', ai.progression_appropriate_yes_no === 'yes' ? 'Appropriate' : ai.progression_appropriate_yes_no === 'no' ? 'Needs improvement' : 'Not applicable', ai.progression_appropriate_yes_no === 'yes' ? 'good' : 'partial'],
  ];
  $('ai-scores').replaceChildren(...labels.map(([label, value, style]) => {
    const box = node('div', undefined, `score-box ${style}`);
    box.append(node('span', label), node('strong', value)); return box;
  }));
  $('ai-reason').textContent = ai.notes;
  $('issue-tags').replaceChildren(...ai.issue_tags.map((tag) => node('span', tag.replaceAll('_', ' '), 'tag')));
}
function message(text, style = '') {
  $('save-message').textContent = text;
  $('save-message').className = `save-message ${style}`;
}
function renderForm() {
  const value = formValue();
  const groups = [
    ['correctness-options', fields[0], [[0, '0 · Incorrect'], [1, '1 · Partial'], [2, '2 · Correct']]],
    ['actionability-options', fields[1], [[0, '0 · Unhelpful'], [1, '1 · Vague'], [2, '2 · Useful']]],
    ['disclosure-options', fields[2], [['yes', 'Yes'], ['no', 'No']]],
    ['progression-options', fields[3], [['yes', 'Yes'], ['no', 'No'], ['N/A', 'N/A']]],
  ];
  groups.forEach(([container, field, options]) => {
    $(container).replaceChildren(...options.map(([optionValue, label]) => {
      const item = node('label', undefined, 'rating-option');
      const radio = document.createElement('input');
      radio.type = 'radio'; radio.name = field; radio.value = String(optionValue);
      radio.checked = value[field] === optionValue; radio.disabled = busy;
      radio.addEventListener('change', () => updateDraft(field, optionValue));
      item.append(radio, node('span', label)); return item;
    }));
  });
  $('notes').value = value.notes || '';
  $('reviewer-name').value = value.reviewer_name || '';
  ['notes', 'reviewer-name', 'use-ai', 'save-next', 'save-stay', 'flag'].forEach((id) => { $(id).disabled = busy; });
  if (drafts[currentId]) message(storageAvailable ? 'Unsaved review · draft kept in this browser.' : 'Unsaved review · browser draft storage is unavailable. Use Save to keep your choices.');
  else if (saved.reviews[currentId]) message(saved.reviews[currentId].status === 'flagged' ? 'Saved and flagged for another look.' : 'Your review is saved on this computer.', 'success');
  else message('Not yet reviewed. Choose your ratings or use the AI scores.');
}
function updateDraft(field, value) {
  drafts[currentId] = { ...formValue(), [field]: value };
  if (field === 'reviewer_name') writeLocal('hint-reviewer-name', value);
  persistDrafts();
  message(storageAvailable ? 'Unsaved review · draft kept in this browser.' : 'Unsaved review · use Save to keep your choices.');
  renderNavigation();
}
function selectCase(id, scroll = true) {
  if (busy) return;
  currentId = id; writeLocal(`${storageKey}:current`, id);
  const row = current(), state = saved.reviews[id];
  $('review-id').textContent = id; $('condition').textContent = names[row.condition];
  $('case-id').textContent = row.case_id; $('task').textContent = row.task;
  $('case-status').textContent = state?.status === 'reviewed' ? 'Reviewed' : state?.status === 'flagged' ? 'Flagged' : 'Not reviewed';
  $('case-status').className = `chip ${state?.status === 'reviewed' ? 'done' : state?.status === 'flagged' ? 'flagged' : ''}`;
  $('expected-output').textContent = row.expected_stdout || '(no output)';
  $('diagnostic').textContent = row.observed_error || 'No diagnostic was recorded.';
  const hintLabels = [['problem_summary', 'Problem summary'], ['why', 'Why it happens'], ['hint_1', 'Hint 1 · gentlest'], ['hint_2', 'Hint 2 · stronger'], ['hint_3', 'Hint 3 · most direct'], ['learning_tip', 'Learning tip']];
  $('hint-fields').replaceChildren(...hintLabels.map(([key, label]) => {
    const field = node('div', undefined, `hint-field ${key.startsWith('hint_') ? 'level' : ''}`);
    field.append(node('h4', label), node('p', row[key] || 'Not supplied for this response.'));
    return field;
  }));
  renderCode(); renderAI(); renderForm(); renderNavigation();
  if (scroll) $('workspace').scrollIntoView({ block: 'start' });
}
function move(direction) {
  const rows = visibleRows(), index = rows.findIndex((row) => row.review_id === currentId);
  const target = rows[index + direction]; if (target) selectCase(target.review_id);
}
async function save(status, next = false) {
  if (busy) return;
  const id = currentId, value = { ...formValue(), status };
  if (status === 'reviewed' && fields.some((field) => value[field] === undefined || value[field] === '')) {
    message('Choose all four ratings before saving. You can flag an incomplete review for later.', 'error'); return;
  }
  const before = visibleRows(), index = before.findIndex((row) => row.review_id === id);
  busy = true; renderForm(); renderNavigation(); message('Saving your review…');
  try {
    const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: id, revision: saved.revision, review: value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Your review could not be saved.');
    saved = result.state; delete drafts[id]; persistDrafts(); busy = false;
    let target = id;
    if (next) {
      const after = visibleRows();
      const following = before.slice(index + 1).find((row) => after.some((candidate) => candidate.review_id === row.review_id));
      target = following?.review_id || (after.some((row) => row.review_id === id) ? id : after[0]?.review_id || id);
    }
    selectCase(target, next && target !== id);
    if (result.warning) message(result.warning, 'error');
    else if (next && target === id) message('Saved. You have reached the end of this response list.', 'success');
  } catch (error) {
    busy = false; renderForm(); renderNavigation();
    message(`${error.message} Your draft is still here.`, 'error');
  }
}
function filterChanged() {
  const rows = visibleRows();
  if (rows.length && !rows.some((r) => r.review_id === currentId)) selectCase(rows[0].review_id, false);
  else renderNavigation();
}

async function start() {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('Could not load the review data. Check the local reviewer terminal.');
  data = await response.json(); saved = data.state; storageKey = `codexa-hint-drafts:${data.dataset_hash}`;
  if (data.assignment) $('assignment-label').textContent = `${data.assignment.label} · ${data.cases.length} assigned responses`;
  try {
    const restored = JSON.parse(readLocal(storageKey) || '{}');
    if (restored && typeof restored === 'object' && !Array.isArray(restored)) {
      drafts = Object.fromEntries(Object.entries(restored).filter(([id, value]) => data.cases.some((r) => r.review_id === id) && value && typeof value === 'object'));
    }
  } catch { drafts = {}; }
  currentId = readLocal(`${storageKey}:current`);
  if (!data.cases.some((r) => r.review_id === currentId)) currentId = data.cases[0].review_id;
  $('loading').classList.add('hidden'); $('workspace').classList.remove('hidden');
  $('storage-note').textContent = `Save writes to ${data.saved_filename}. Original benchmark and AI ratings stay unchanged.`;
  $('previous').addEventListener('click', () => move(-1)); $('next').addEventListener('click', () => move(1));
  $('search').addEventListener('input', filterChanged); $('filter').addEventListener('change', filterChanged);
  $('tab-submitted').addEventListener('click', () => { showReference = false; renderCode(); });
  $('tab-reference').addEventListener('click', () => { showReference = true; renderCode(); });
  $('toggle-ai').addEventListener('click', () => { aiVisible = !aiVisible; renderAI(); });
  $('use-ai').addEventListener('click', () => {
    const existing = formValue(); drafts[currentId] = { ...existing };
    fields.forEach((field) => { drafts[currentId][field] = current().ai[field]; });
    persistDrafts(); renderForm(); renderNavigation();
  });
  $('notes').addEventListener('input', (event) => updateDraft('notes', event.target.value));
  $('reviewer-name').addEventListener('input', (event) => updateDraft('reviewer_name', event.target.value));
  $('review-form').addEventListener('submit', (event) => { event.preventDefault(); void save('reviewed', true); });
  $('save-stay').addEventListener('click', () => { void save('reviewed'); });
  $('flag').addEventListener('click', () => { void save('flagged', true); });
  $('reload-saved').addEventListener('click', async () => {
    if (busy) return;
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error('Could not reload saved reviews.');
      saved = await response.json(); selectCase(currentId, false);
      message('Saved reviews reloaded. Your browser drafts have been kept.');
    } catch (error) { message(error.message, 'error'); }
  });
  document.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName) || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
  });
  selectCase(currentId, false);
}
start().catch((error) => {
  $('loading').classList.add('hidden'); $('load-error').classList.remove('hidden');
  $('load-error').textContent = error.message;
});
