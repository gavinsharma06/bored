// The logbook of every Done, Skip, and Unbench. Entries stay minimal, just
// { taskId, result, date }. Demo mode keeps its own log so example tasks never
// mix with real history, and only the real log syncs to the data repo.
const logbook = (() => {
  const LIMIT = 2000;
  const BENCH_STREAK = 10;
  const RESULTS = ["done", "skipped", "unbenched"];
  const FILE = "history.json";
  const KEYS = { demo: "demoHistory", private: "history" };

  let mode = "demo";
  let syncing = null;
  let syncAgain = false;

  function useMode(nextMode) {
    mode = nextMode;
  }

  function entries() {
    return storage.load(KEYS[mode], []);
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
    storage.save(KEYS[mode], merged);
  }

  function record(taskId, result) {
    replace(merge(entries(), [{ taskId, result, date: new Date().toISOString() }]));

    if (mode === "private") {
      storage.save("historyUnsynced", true);
    }
  }

  // Earlier versions stored the whole result card plus a separate lastDone map.
  function migrate() {
    const stored = storage.load(KEYS.private, []);

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

    storage.save(KEYS.private, merge([], migrated));
    storage.save("historyUnsynced", true);
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

  function syncState() {
    if (mode !== "private") {
      return "off";
    }

    return storage.load("historyUnsynced", false) ? "queued" : "synced";
  }

  // One entry per line keeps the file readable and the commit diffs small.
  function serialize(list) {
    return `[\n${list.map((entry) => `  ${JSON.stringify(entry)}`).join(",\n")}\n]\n`;
  }

  async function pushOnce() {
    const remote = await githubApi.readJson(FILE);
    const remoteList = Array.isArray(remote.value) ? remote.value : [];
    const remoteKeys = new Set(remoteList.filter(isEntry).map(entryKey));
    const added = entries().filter((entry) => !remoteKeys.has(entryKey(entry))).length;
    replace(merge(remoteList, entries()));

    if (added > 0) {
      const message = `Log ${added} spin result${added === 1 ? "" : "s"}\n\nSynced from the Bored wheel. Entries hold only a task id, a result, and a date.`;
      await githubApi.writeText(FILE, serialize(entries()), remote.sha, message);
    }
  }

  // A 409 means another device pushed between our read and write, so read again once.
  async function push() {
    try {
      await pushOnce();
    } catch (error) {
      if (error.status !== 409) {
        throw error;
      }

      await pushOnce();
    }
  }

  async function runSync() {
    if (mode !== "private" || !githubApi.isConfigured()) {
      return;
    }

    try {
      await push();
      storage.save("historyUnsynced", false);
    } catch (error) {
      console.warn("History sync failed, it will retry on the next load:", error.message);
    }
  }

  // Calls made while a sync is running are folded into one more run afterwards.
  async function sync() {
    if (syncing) {
      syncAgain = true;
      return syncing;
    }

    syncing = (async () => {
      do {
        syncAgain = false;
        await runSync();
      } while (syncAgain);
    })();

    await syncing;
    syncing = null;
  }

  return { BENCH_STREAK, useMode, entries, merge, replace, record, migrate, skipStreaks, syncState, sync };
})();
