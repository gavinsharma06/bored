// The logbook of every Done, Skip, and Unbench. Entries stay minimal, just
// { taskId, result, date }, because they end up in a public repo.
const logbook = (() => {
  const LIMIT = 2000;
  const RESULTS = ["done", "skipped", "unbenched"];
  const FILE = "history.json";
  const GITHUB_API = "https://api.github.com";

  let syncing = null;
  let syncAgain = false;

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
    storage.save("historyUnsynced", true);
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

  // Sync settings

  // On GitHub Pages the address is owner.github.io/repo/, so the repo can be guessed.
  function guessRepo() {
    const [owner] = location.hostname.split(".github.io");
    const [repo] = location.pathname.split("/").filter(Boolean);
    return location.hostname.endsWith(".github.io") && repo ? `${owner}/${repo}` : "";
  }

  function settings() {
    return {
      token: storage.load("githubToken", ""),
      repo: storage.load("githubRepo", "") || guessRepo()
    };
  }

  function saveSettings({ token, repo }) {
    storage.save("githubToken", token);
    storage.save("githubRepo", repo);
  }

  function forgetToken() {
    storage.remove("githubToken");
  }

  function syncState() {
    const { token, repo } = settings();

    if (!token || !repo) {
      return "off";
    }

    return storage.load("historyUnsynced", false) ? "queued" : "synced";
  }

  // GitHub Contents API

  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
  }

  function fromBase64(encoded) {
    const binary = atob(encoded.replace(/\s/g, ""));
    return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  }

  // One entry per line keeps the file readable and the commit diffs small.
  function serialize(list) {
    return `[\n${list.map((entry) => `  ${JSON.stringify(entry)}`).join(",\n")}\n]\n`;
  }

  async function github(path, { token, method = "GET", body } = {}) {
    const response = await fetch(`${GITHUB_API}${path}`, {
      method,
      cache: "no-store",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
        ...(body ? { "content-type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok && response.status !== 404) {
      const error = new Error(`GitHub answered ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.status === 404 ? null : response.json();
  }

  async function readRemote({ token, repo }) {
    const file = await github(`/repos/${repo}/contents/${FILE}`, { token });
    return file ? { list: JSON.parse(fromBase64(file.content)), sha: file.sha } : { list: [], sha: null };
  }

  async function writeRemote({ token, repo }, list, sha, added) {
    await github(`/repos/${repo}/contents/${FILE}`, {
      token,
      method: "PUT",
      body: {
        message: `Log ${added} spin result${added === 1 ? "" : "s"}\n\nSynced from the Bored wheel. Entries hold only a task id, a result, and a date.`,
        content: toBase64(serialize(list)),
        ...(sha ? { sha } : {})
      }
    });
  }

  async function pushOnce(config) {
    const remote = await readRemote(config);
    const remoteKeys = new Set(remote.list.filter(isEntry).map(entryKey));
    const added = entries().filter((entry) => !remoteKeys.has(entryKey(entry))).length;
    replace(merge(remote.list, entries()));

    if (added > 0) {
      await writeRemote(config, entries(), remote.sha, added);
    }
  }

  // A 409 means another device pushed between our read and write, so read again once.
  async function push(config) {
    try {
      await pushOnce(config);
    } catch (error) {
      if (error.status !== 409) {
        throw error;
      }

      await pushOnce(config);
    }
  }

  async function runSync() {
    const config = settings();

    if (!config.token || !config.repo) {
      return;
    }

    try {
      await push(config);
      storage.save("historyUnsynced", false);
    } catch (error) {
      console.warn("History sync failed, it will retry on the next load", error);
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

  // Reads the copy GitHub Pages serves, so devices without a token still see
  // what the others logged. Opened from disk the fetch fails, which is fine.
  async function pullPublished() {
    try {
      const response = await fetch(FILE, { cache: "no-store" });

      if (response.ok) {
        replace(merge(entries(), await response.json()));
      }
    } catch {
      return;
    }
  }

  return {
    entries,
    merge,
    replace,
    record,
    migrate,
    skipStreaks,
    settings,
    saveSettings,
    forgetToken,
    syncState,
    sync,
    pullPublished
  };
})();
