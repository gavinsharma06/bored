// Merges ideas.json into the task list. Added tasks join the wheel. Rewrites swap
// a benched task for a smaller first step with a new id, so its skip streak
// starts from zero.
const ideas = (() => {
  const MOODS = ["fried", "meh", "lockedIn"];
  const EMPTY = { added: [], rewrites: {} };

  function isText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  // Data from a repo can be wrong, so anything malformed is skipped rather than
  // allowed to break the wheel.
  function isTask(task, categories) {
    return (
      isText(task?.id) &&
      isText(task.label) &&
      isText(task.text) &&
      categories.some((category) => category.id === task.category) &&
      Number.isFinite(task.minutes) &&
      task.minutes > 0 &&
      Array.isArray(task.moods) &&
      task.moods.length > 0 &&
      task.moods.every((mood) => MOODS.includes(mood))
    );
  }

  function normalize(file) {
    if (!file || typeof file !== "object") {
      return EMPTY;
    }

    return {
      added: Array.isArray(file.added) ? file.added : [],
      rewrites: file.rewrites && typeof file.rewrites === "object" ? file.rewrites : {}
    };
  }

  function apply(baseTasks, ideasFile, categories) {
    const { added, rewrites } = normalize(ideasFile);
    const tasks = [...baseTasks];
    const ids = new Set(tasks.map((task) => task.id));

    added.filter((task) => isTask(task, categories)).forEach((task) => {
      if (!ids.has(task.id)) {
        tasks.push(task);
        ids.add(task.id);
      }
    });

    // Rewrites run in file order, so a rewrite of a rewrite lands on the newer task.
    Object.entries(rewrites).forEach(([taskId, replacement]) => {
      const index = tasks.findIndex((task) => task.id === taskId);

      if (index !== -1 && isTask(replacement, categories) && !ids.has(replacement.id)) {
        tasks[index] = replacement;
        ids.add(replacement.id);
      }
    });

    return tasks;
  }

  return { MOODS, isTask, normalize, apply };
})();
