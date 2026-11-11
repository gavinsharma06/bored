// The logbook of every Done, Skip, and Unbench. Entries stay minimal, just
// { taskId, result, date }, because they end up in a public repo.
const logbook = (() => {
  const LIMIT = 2000;
  const RESULTS = ["done", "skipped", "unbenched"];

  function entries() {
    return storage.load("history", []);
  }

  function entryKey(entry) {
    return `${entry.date}|${entry.taskId}|${entry.result}`;
  }

  function isEntry(entry) {
    return (
      typeof entry?.taskId === "string" &&
      RESULTS.includes(entry.result) &&
      !Number.isNaN(Date.parse(entry.date))
    );
  }

  // Combines two logs without duplicates, oldest first, so merging is safe to repeat.
  function merge(first, second) {
    const byKey = new Map();
    [...first, ...second].filter(isEntry).forEach((entry) => byKey.set(entryKey(entry), entry));

    return [...byKey.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-LIMIT);
  }

  function replace(merged) {
    storage.save("history", merged);
  }

  function record(taskId, result) {
    replace(merge(entries(), [{ taskId, result, date: new Date().toISOString() }]));
  }

  // Earlier versions stored the whole result card plus a separate lastDone map.
  function migrate() {
    const stored = storage.load("history", []);

    if (!stored.some((entry) => "status" in entry)) {
      return;
    }

    const migrated = stored
      .filter((entry) => entry.status === "done" || entry.status === "skipped")
      .map((entry) => ({
        taskId: entry.taskId ?? entry.kind,
        result: entry.status,
        date: entry.loggedAt
      }));

    replace(merge([], migrated));
    storage.remove("lastDone");
  }

  // Counts skips in a row per task. A Done or an Unbench starts the count over.
  function skipStreaks() {
    const streaks = new Map();

    entries().forEach(({ taskId, result }) => {
      streaks.set(taskId, result === "skipped" ? (streaks.get(taskId) ?? 0) + 1 : 0);
    });

    return streaks;
  }

  return { entries, merge, replace, record, migrate, skipStreaks };
})();
