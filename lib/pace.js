/**
 * Spacing between outbound connections.
 *
 * A scan needs several dozen probes, and firing them as fast as the pool allows
 * looks exactly like what a rate limiter is built to stop: targets behind one
 * start dropping probes, and a report assembled from that silence is worse than
 * no report at all.
 *
 * So every probe reserves a slot before it opens a socket. The slots are handed
 * out one interval apart across the whole process, which paces the scanner
 * without changing how any individual probe is written.
 *
 * Lanes exist because the services do not all talk to the same kind of peer.
 * A DNS query to 1.1.1.1 has nothing to do with an SMTP connection to somebody's
 * mail server, and pacing them through one queue would make the fast one wait
 * for the slow one. Each lane keeps its own clock.
 */

const DEFAULT_INTERVAL = Number(process.env.PROBE_INTERVAL_MS ?? 40);

/** Per-lane override, e.g. PROBE_INTERVAL_SMTP_MS=250. */
function intervalFor(lane) {
  const named = process.env[`PROBE_INTERVAL_${lane.toUpperCase()}_MS`];
  const value = named === undefined ? DEFAULT_INTERVAL : Number(named);
  return Number.isFinite(value) ? value : DEFAULT_INTERVAL;
}

/** When the next connection may start, per lane. */
const nextSlot = new Map();

/**
 * Reserves the next slot in a lane and resolves when it is due.
 * @param {string} lane  a name such as 'default', 'dns' or 'smtp'
 */
export function pace(lane = 'default') {
  const interval = intervalFor(lane);
  if (!(interval > 0)) return Promise.resolve();

  const now = Date.now();
  const at = Math.max(now, nextSlot.get(lane) || 0);
  nextSlot.set(lane, at + interval);

  const wait = at - now;
  return wait > 0 ? new Promise(resolve => setTimeout(resolve, wait)) : Promise.resolve();
}

export function paceInterval(lane = 'default') {
  return intervalFor(lane);
}

/** Tests that want the scheduler out of the way. */
export function resetPace() {
  nextSlot.clear();
}
