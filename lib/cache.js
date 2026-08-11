/**
 * The report cache.
 *
 * Two things it has to get right. The first is the obvious one: a report that
 * took eight seconds and forty outbound connections to build is worth keeping
 * for a few minutes. The second is less obvious and matters more — when two
 * people ask for the same target at the same moment, they must share one run
 * rather than each starting their own. Without that, a link doing the rounds
 * turns into a burst of identical scans aimed at somebody else's server.
 */

export function createCache({
  ttlMs = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000),
  max = Number(process.env.CACHE_MAX || 500),
} = {}) {
  const entries = new Map();
  const inflight = new Map();

  function get(key) {
    const hit = entries.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expires) {
      entries.delete(key);
      return null;
    }
    // Re-insert so the iteration order stays least-recently-used first.
    entries.delete(key);
    entries.set(key, hit);
    return hit.value;
  }

  function set(key, value) {
    if (entries.size >= max) {
      const oldest = entries.keys().next().value;
      if (oldest !== undefined) entries.delete(oldest);
    }
    entries.set(key, { value, expires: Date.now() + ttlMs });
  }

  /**
   * Runs `work()` unless the answer is already there or already on its way.
   *
   * A run in flight is shared even when the second caller passed `refresh`,
   * except that `refresh` skips the stored copy — refreshing is about not
   * trusting an old answer, not about insisting on a second scan of your own.
   */
  async function run(key, work, { refresh = false } = {}) {
    if (!refresh) {
      const hit = get(key);
      if (hit) return { ...hit, meta: { ...hit.meta, cached: true } };
    }
    const running = inflight.get(key);
    if (running) return running;

    const started = work()
      .then(result => {
        set(key, result);
        return result;
      })
      .finally(() => inflight.delete(key));

    inflight.set(key, started);
    return started;
  }

  function stats() {
    return { entries: entries.size, max, ttlMs, inflight: inflight.size };
  }

  function clear() {
    entries.clear();
  }

  return { get, set, run, stats, clear };
}
