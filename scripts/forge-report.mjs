// Prints the facts the /forge command needs as JSON: which tasks are benched,
// how each category is doing, and whether ideas.json is valid. It runs the app's
// own tasks.js, ideas.js, and history.js in a sandbox so the rules never drift
// between the wheel and the forge.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readJson(file) {
  try {
    return JSON.parse(readFileSync(join(root, file), "utf8"));
  } catch {
    return null;
  }
}

function loadAppScripts(history) {
  const storage = { load: (key, fallback) => (key === "history" ? history : fallback), save() {}, remove() {} };
  const context = vm.createContext({ storage, location: { hostname: "", pathname: "/" }, console });

  for (const file of ["tasks.example.js", "ideas.js", "history.js"]) {
    vm.runInContext(readFileSync(join(root, file), "utf8"), context, { filename: file });
  }

  // Top level consts in classic scripts are not properties of the context, so read them out.
  return vm.runInContext("({ CATEGORIES, TASKS, ideas, logbook })", context);
}

// Counts every task that ever existed, so rewritten tasks still count toward their category.
function categorySummary(categories, everyTask, history) {
  const categoryOf = new Map(everyTask.map((task) => [task?.id, task?.category]));

  return categories.map((category) => {
    const results = history.filter((entry) => categoryOf.get(entry.taskId) === category.id);
    const done = results.filter((entry) => entry.result === "done").length;
    const skipped = results.filter((entry) => entry.result === "skipped").length;
    const finishRate = done + skipped === 0 ? null : Number((done / (done + skipped)).toFixed(2));

    return { id: category.id, name: category.name, done, skipped, finishRate };
  });
}

// Lists entries the wheel would ignore: malformed tasks and ids that are already taken.
function rejectedIdeas(ideas, baseTasks, ideasFile) {
  const taken = new Set(baseTasks.map((task) => task.id));
  const rejected = [];

  ideasFile.added.forEach((task) => {
    if (!ideas.isTask(task) || taken.has(task.id)) {
      rejected.push({ in: "added", id: task?.id ?? null });
    }

    taken.add(task?.id);
  });

  Object.entries(ideasFile.rewrites).forEach(([taskId, task]) => {
    if (!ideas.isTask(task) || taken.has(task.id)) {
      rejected.push({ in: "rewrites", of: taskId, id: task?.id ?? null });
    }

    taken.add(task?.id);
  });

  return rejected;
}

const history = readJson("history.json") ?? [];
const rawIdeas = readJson("ideas.json");
const ideasFile = { added: rawIdeas?.added ?? [], rewrites: rawIdeas?.rewrites ?? {} };
const { CATEGORIES, TASKS, ideas, logbook } = loadAppScripts(history);
const tasks = ideas.apply(TASKS, ideasFile);
const streaks = logbook.skipStreaks();

const report = {
  ideasJsonParses: rawIdeas !== null,
  rejectedIdeas: rejectedIdeas(ideas, TASKS, ideasFile),
  benched: tasks
    .filter((task) => (streaks.get(task.id) ?? 0) >= logbook.BENCH_STREAK)
    .map((task) => ({ ...task, skipStreak: streaks.get(task.id) })),
  categories: categorySummary(
    CATEGORIES,
    [...TASKS, ...ideasFile.added, ...Object.values(ideasFile.rewrites)],
    history
  ),
  activeTasks: tasks.map(({ id, category, label }) => ({ id, category, label })),
  takenIds: [
    ...TASKS.map((task) => task.id),
    ...ideasFile.added.map((task) => task?.id),
    ...Object.keys(ideasFile.rewrites),
    ...Object.values(ideasFile.rewrites).map((task) => task?.id)
  ].filter(Boolean)
};

console.log(JSON.stringify(report, null, 2));
