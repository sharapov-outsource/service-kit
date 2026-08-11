/**
 * The pieces every report is built from.
 *
 * One rule runs through all of this, and it was learned the expensive way. myssl
 * once handed alfabank.ru an E because the bank's rate limiter quietly refused
 * forty probes in a row and the scanner scored the silence. A probe that did not
 * arrive is not a probe that failed. So:
 *
 *   · a stage that could not run records `status: 'unknown'`, never a verdict;
 *   · anything the report could not establish is listed in `incomplete`;
 *   · and when `incomplete` is non-empty the grade is `?`, not a letter.
 *
 * Saying "we could not check this" costs a paragraph. Saying "this is broken"
 * when it is not costs somebody's afternoon.
 */

/** A finding. Codes only — the words come from the dictionary. */
export function flag(id, severity, status = 'warning', extra = {}) {
  return { id, severity, status, ...extra };
}

export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

/** Sorts findings the way a reader wants them: worst first, then by code. */
export function sortFlags(flags) {
  return [...flags].sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
    a.id.localeCompare(b.id));
}

const LETTERS = [[90, 'A'], [80, 'B'], [65, 'C'], [50, 'D'], [30, 'E'], [0, 'F']];

export function letterFor(score) {
  for (const [threshold, letter] of LETTERS) if (score >= threshold) return letter;
  return 'F';
}

/**
 * Ranks used when a cap pulls a grade down. `?` sits at the bottom because an
 * unknown is worse than any letter: it means we have nothing to stand on.
 */
const GRADE_RANK = { 'A+': 0, A: 1, 'A-': 2, B: 3, C: 4, D: 5, E: 6, F: 7, '?': 8 };

/** The worse of two grades. */
export function worstGrade(a, b) {
  if (!b) return a;
  if (!a) return b;
  return (GRADE_RANK[b] ?? 9) > (GRADE_RANK[a] ?? 9) ? b : a;
}

/**
 * A weighted score over named components.
 * @param {Array<{key: string, score: number, weight: number}>} components
 */
export function weighted(components) {
  const usable = components.filter(c => typeof c.score === 'number');
  const total = usable.reduce((sum, c) => sum + c.weight, 0);
  if (!total) return 0;
  return Math.round(usable.reduce((sum, c) => sum + c.score * c.weight, 0) / total);
}

/** Everything the report could not establish, as codes. */
export function incomplete(list) {
  const codes = [...new Set(list.filter(Boolean))];
  return codes.length ? codes : undefined;
}

/** A hard ceiling on how long a whole scan may take. */
export async function withDeadline(promise, ms, code = 'scan-timeout') {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(Object.assign(new Error(code), { code, status: 504 })),
      ms
    );
  });
  try {
    return await Promise.race([promise, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Runs a stage and never lets it take the whole scan down with it.
 *
 * The returned shape always says which of the two happened, because a caller
 * that cannot tell "nothing found" from "could not look" will eventually
 * report the first when it means the second.
 */
export async function timed(name, work, { timeoutMs = 15000 } = {}) {
  const started = Date.now();
  try {
    const value = await withDeadline(Promise.resolve().then(work), timeoutMs, 'stage-timeout');
    return { name, ok: true, value, elapsedMs: Date.now() - started };
  } catch (err) {
    return {
      name, ok: false, value: null, error: err.code || err.message,
      elapsedMs: Date.now() - started,
    };
  }
}

/** Milliseconds to a human-facing "in 12 days" style number of days. */
export function daysUntil(date) {
  if (!date) return null;
  const at = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(at.getTime())) return null;
  return Math.round((at.getTime() - Date.now()) / 86400000);
}
