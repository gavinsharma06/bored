// Decides where the wheel's tasks come from. With a token saved, tasks.json and
// ideas.json load from the private data repo as plain JSON. Without one, the
// wheel runs on the example data that ships with the engine.
const dataSource = (() => {
  const ID_PATTERN = /^[\w-]+$/;
  const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

  function isText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function isCategory(category) {
    return (
      isText(category?.id) &&
      ID_PATTERN.test(category.id) &&
      isText(category.name) &&
      isText(category.icon) &&
      COLOR_PATTERN.test(category.color) &&
      (category.ignoresNeglect === undefined || typeof category.ignoresNeglect === "boolean")
    );
  }

  function isPenalty(task) {
    return isText(task?.id) && isText(task.label) && isText(task.text) && Number.isFinite(task.minutes);
  }

  // Copies only the fields the wheel uses, so nothing unexpected rides along.
  function cleanCategory({ id, name, icon, color, ignoresNeglect }) {
    return { id, name, icon, color, ignoresNeglect: ignoresNeglect === true };
  }

  function cleanTask({ id, category, label, text, minutes, moods }) {
    return { id, category, label, text, minutes, moods: [...moods] };
  }

  // Returns a clean copy of tasks data, or null when it isn't usable.
  function validate(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const categories = (Array.isArray(raw.categories) ? raw.categories : []).filter(isCategory).map(cleanCategory);
    const tasks = (Array.isArray(raw.tasks) ? raw.tasks : [])
      .filter((task) => ideas.isTask(task, categories))
      .map(cleanTask);
    const treats = (Array.isArray(raw.treats) ? raw.treats : []).filter(isText);

    if (categories.length === 0 || tasks.length === 0 || treats.length === 0 || !isPenalty(raw.penaltyTask)) {
      return null;
    }

    const { id, label, text, minutes } = raw.penaltyTask;
    return { categories, tasks, penaltyTask: { id, category: "reels", label, text, minutes }, treats };
  }

  function demo(status) {
    return { mode: "demo", status, data: validate(EXAMPLE_DATA), ideas: null };
  }

  async function loadPrivate() {
    const [tasksFile, ideasFile] = await Promise.all([
      githubApi.readJson("tasks.json"),
      githubApi.readJson("ideas.json")
    ]);
    const data = validate(tasksFile.value);

    if (!data) {
      throw new Error("tasks.json is missing or not in the expected shape");
    }

    storage.save("dataCache", { repo: githubApi.settings().repo, tasks: tasksFile.value, ideas: ideasFile.value });
    return { mode: "private", status: "live", data, ideas: ideasFile.value };
  }

  // The last good copy keeps the wheel useful on a phone with no signal.
  function loadCached() {
    const cache = storage.load("dataCache", null);
    const data = cache?.repo === githubApi.settings().repo ? validate(cache.tasks) : null;
    return data ? { mode: "private", status: "cached", data, ideas: cache.ideas } : null;
  }

  async function load() {
    if (!githubApi.isConfigured()) {
      return demo("demo");
    }

    try {
      return await loadPrivate();
    } catch (error) {
      console.warn("Couldn't load the data repo:", error.message);
      return loadCached() ?? demo("unreachable");
    }
  }

  function forgetCache() {
    storage.remove("dataCache");
  }

  return { load, forgetCache };
})();
