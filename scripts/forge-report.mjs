// Prints the facts a forge run needs as JSON: which tasks are benched, how each
// category is doing, and whether ideas.json is valid. It runs the engine's own
// ideas.js and history.js in a sandbox so the rules never drift from the wheel.
//
// Usage: node scripts/forge-report.mjs [data folder]
// The data folder holds tasks.json, history.json, and ideas.json. Without a
// tasks.json there, the engine's example data stands in.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const engineRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = resolve(process.argv[2] ?? ".");

function readJson(file) {
  try {
    return JSON.parse(readFileSync(join(dataRoot, file), "utf8"));
  } catch {
    return null;
  }
}

// history.js reads its log through storage, so the stub hands it history.json.
function loadEngine(history) {
  const storage = { load: (key, fallback) => (key.endsWith("istory") ? history : fallback), save() {}, remove() {} };
  const context = vm.createContext({ storage, console });

  for (const file of ["tasks.example.js", "ideas.js", "history.js"]) {
    vm.runInContext(readFileSync(join(engineRoot, file), "utf8"), context, { filename: file });
  }

  // Top level consts in classic scripts are not properties of the context, so read them out.
  return vm.runInContext("({ EXAMPLE_DATA, ideas, logbook })", context);
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
function rejectedIdeas(ideas, data, ideasFile) {
  const taken = new Set(data.tasks.map((task) => task.id));
  const rejected = [];
  const check = (task, where) => {
    if (!ideas.isTask(task, data.categories) || taken.has(task.id)) {
      rejected.push({ ...where, id: task?.id ?? null });
    }

    taken.add(task?.id);
  };

  ideasFile.added.forEach((task) => check(task, { in: "added" }));
  Object.entries(ideasFile.rewrites).forEach(([taskId, task]) => check(task, { in: "rewrites", of: taskId }));
  return rejected;
}

const history = readJson("history.json") ?? [];
const rawIdeas = readJson("ideas.json");
const { EXAMPLE_DATA, ideas, logbook } = loadEngine(history);
const data = existsSync(join(dataRoot, "tasks.json")) ? readJson("tasks.json") : EXAMPLE_DATA;

if (!data?.categories || !data?.tasks) {
  console.error("tasks.json is missing categories or tasks.");
  process.exit(1);
}

const ideasFile = ideas.normalize(rawIdeas);
const tasks = ideas.apply(data.tasks, ideasFile, data.categories);
const streaks = logbook.skipStreaks();

const report = {
  dataFolder: dataRoot,
  ideasJsonParses: rawIdeas !== null,
  rejectedIdeas: rejectedIdeas(ideas, data, ideasFile),
  benched: tasks
    .filter((task) => (streaks.get(task.id) ?? 0) >= logbook.BENCH_STREAK)
    .map((task) => ({ ...task, skipStreak: streaks.get(task.id) })),
  categories: categorySummary(
    data.categories,
    [...data.tasks, ...ideasFile.added, ...Object.values(ideasFile.rewrites)],
    history
  ),
  activeTasks: tasks.map(({ id, category, label }) => ({ id, category, label })),
  takenIds: [
    ...data.tasks.map((task) => task.id),
    ...ideasFile.added.map((task) => task?.id),
    ...Object.keys(ideasFile.rewrites),
    ...Object.values(ideasFile.rewrites).map((task) => task?.id)
  ].filter(Boolean)
};

console.log(JSON.stringify(report, null, 2));
