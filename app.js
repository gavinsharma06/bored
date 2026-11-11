const TAU = Math.PI * 2;
const QUARTER_TURN = Math.PI / 2;
const BULB_COUNT = 48;
const JACKPOT_WEIGHT = 0.45;
const SPIN_TURNS = 9;
const SPIN_MS = 7200;
const CALM_SPIN_TURNS = 1;
const CALM_SPIN_MS = 900;
const REVEAL_DELAY_MS = 900;
const RESHUFFLE_MS = 300;
const NEAR_MISS_CHANCE = 0.4;
const TEASE_PAUSE_MS = 700;
const CREEP_MS = 1500;
const NEAR_MISS_PAUSE_MS = 900;
const EIGHT_BALL_LOCK_MS = 10 * 60 * 1000;
const EIGHT_BALL_RESPIN_MS = 1400;
const HISTORY_SHOWN = 30;
const REELS_DAILY_MINUTES = 60;
const NEGLECT_STEP = 0.25;
const LEARNING_STEP = 0.15;
const LEARNING_FLOOR = 0.35;
const LEARNING_CEILING = 2;
const TOP_TASKS_SHOWN = 5;
const ALWAYS_SKIPPED_MIN = 2;
const NEGLECT_MAX_DAYS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;
const PENALTY_COLOR = "#3d3c40";
const JACKPOT_GOLD = ["#8a5a12", "#ffe7a3", "#d99a2b", "#fff3cf", "#9c6716"];
const LABEL_FONT = 'Unbounded, "Arial Black", sans-serif';
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

const HOST_LINES = {
  idle: [
    "Bored? Not on my watch. Not on my network.",
    "Step right up. The wheel has no idea what you did yesterday.",
    "Somewhere a studio audience is chanting your name.",
    "Ten minutes. One task. Zero decisions. That's the show."
  ],
  spinning: [
    "Round and round she goes!",
    "Drumroll, please. Not you. The drums.",
    "Nobody touch anything!",
    "Folks, I've got a good feeling about this one."
  ],
  win: [
    "The wheel has spoken. No take-backs on this network.",
    "Ladies and gentlemen, we have a task!",
    "Lock it in! The cameras are rolling."
  ],
  done: [
    "A hero walks among us. Applause!",
    "Done! The audience is on its feet.",
    "That's what we call good television."
  ],
  skipped: [
    "Skipped. The wheel will remember this.",
    "Bold. Cowardly, but bold.",
    "The audience boos softly, out of respect."
  ],
  fried: [
    "Fried contestant on stage! Easy questions only, folks.",
    "Brain at 2%. The wheel will be gentle. Mostly."
  ],
  meh: [
    "Meh. The most popular mood on daytime television.",
    "A meh contestant. Classic. Timeless."
  ],
  lockedIn: [
    "Locked in! Somebody get this person a headset.",
    "No games, no reels. Only greatness on this wheel."
  ],
  mystery: [
    "Mystery mode! Not even I know what's under there.",
    "Icons only. Trust the wheel."
  ],
  reels: [
    "Reels! The audience pretends not to judge.",
    "Ten minutes of scrolling, sponsored by the jar."
  ],
  penalty: [
    "Oh no. Oh no no no. The jar was empty.",
    "You flew too close to the algorithm.",
    "Security, please escort this contestant to LeetCode."
  ],
  tease: [
    "Wait. Wait. Is it... IS IT?!",
    "Folks, I can't look. Somebody tell me what's happening.",
    "Is that... the JACKPOT?!"
  ],
  nearMiss: [
    "SO CLOSE! The audience groans as one.",
    "One tick! ONE TICK! Unbelievable television.",
    "The jackpot slips away. It does that."
  ],
  jackpot: [
    "JACKPOT! Ring the bells! Release the confetti!",
    "I've hosted this show for 40 years and I'm crying.",
    "Stop the presses! A treat has been unlocked!"
  ],
  eightBallYes: [
    "The 8 Ball says spin again! Who am I to argue?"
  ],
  unbenched: [
    "Back in the game! The crowd goes mild.",
    "Off the bench and onto the wheel. Don't make me regret this."
  ],
  eightBallNo: [
    "The 8 Ball says no. The wheel is locked for 10 minutes. Go stare out a window."
  ],
  timerStarted: [
    "The clock is running. The studio audience holds its breath.",
    "Timer's on. I'll just be over here, hosting."
  ],
  timerDone: [
    "Time! Did you do it? Be honest, the cameras saw everything.",
    "That's the buzzer, folks! Done or skip?"
  ]
};

const KICKERS = {
  jackpot: "Jackpot!!!",
  penalty: "The wheel is disappointed"
};

const state = {
  tasks: TASKS,
  mood: "meh",
  slices: [],
  arcs: [],
  rotation: 0,
  pointerArc: null,
  spinning: false,
  pending: storage.load("pending", null),
  timerChimed: false,
  mystery: storage.load("mystery", false),
  hidden: new Set(storage.load("hidden", []))
};

const els = {
  wheel: document.getElementById("wheel"),
  wheelWrap: document.getElementById("wheelWrap"),
  flash: document.getElementById("flash"),
  bulbs: document.getElementById("bulbs"),
  pointer: document.getElementById("pointer"),
  hostLine: document.getElementById("hostLine"),
  spinButton: document.getElementById("spinButton"),
  result: document.getElementById("result"),
  resultKicker: document.getElementById("resultKicker"),
  resultIcon: document.getElementById("resultIcon"),
  resultCategory: document.getElementById("resultCategory"),
  resultTitle: document.getElementById("resultTitle"),
  resultActions: document.getElementById("resultActions"),
  timer: document.getElementById("timer"),
  timerClock: document.getElementById("timerClock"),
  timerBar: document.getElementById("timerBar"),
  moodButtons: document.querySelectorAll("[data-mood]"),
  mysteryToggle: document.getElementById("mysteryToggle"),
  settingsButton: document.getElementById("settingsButton"),
  drawer: document.getElementById("drawer"),
  drawerBackdrop: document.getElementById("drawerBackdrop"),
  drawerClose: document.getElementById("drawerClose"),
  taskToggles: document.getElementById("taskToggles"),
  history: document.getElementById("history"),
  topTasks: document.getElementById("topTasks"),
  skippedTasks: document.getElementById("skippedTasks"),
  benchedTasks: document.getElementById("benchedTasks"),
  syncForm: document.getElementById("syncForm"),
  syncRepo: document.getElementById("syncRepo"),
  syncToken: document.getElementById("syncToken"),
  syncStatus: document.getElementById("syncStatus"),
  syncForget: document.getElementById("syncForget"),
  jar: document.getElementById("jar"),
  jarFill: document.getElementById("jarFill"),
  jarCaption: document.getElementById("jarCaption")
};

const palette = readPalette();
const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function readPalette() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name) => styles.getPropertyValue(name).trim();

  return {
    accent: read("--accent"),
    text: read("--text"),
    ink: read("--ink"),
    chromeLight: read("--chrome-light"),
    chromeDark: read("--chrome-dark")
  };
}

// Helpers

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickWeighted(list, weightOf) {
  const totalWeight = list.reduce((sum, item) => sum + weightOf(item), 0);
  let roll = Math.random() * totalWeight;

  return list.find((item) => {
    roll -= weightOf(item);
    return roll <= 0;
  }) ?? list[list.length - 1];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function shuffle(list) {
  const shuffled = [...list];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3;
}

// Starts at full speed and spends most of its time coasting, like a heavy wheel.
function easeOutQuint(progress) {
  return 1 - (1 - progress) ** 5;
}

function easeInOutSine(progress) {
  return (1 - Math.cos(Math.PI * progress)) / 2;
}

function formatClock(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function daysSince(isoDate) {
  const then = new Date(isoDate).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);

  // Rounding absorbs the 23 and 25 hour days around daylight saving changes.
  return Math.round((today - then) / DAY_MS);
}

function setHostLine(moment) {
  els.hostLine.textContent = pickRandom(HOST_LINES[moment]);
}

// Reels jar

function reelsLeft() {
  const jar = storage.load("reels", null);
  const usedToday = jar && jar.day === todayKey() ? jar.minutesUsed : 0;
  return Math.max(REELS_DAILY_MINUTES - usedToday, 0);
}

function drainReels(minutes) {
  const used = REELS_DAILY_MINUTES - reelsLeft() + minutes;
  storage.save("reels", { day: todayKey(), minutesUsed: used });
  renderJar();
}

function renderJar() {
  const left = reelsLeft();
  els.jarFill.style.width = `${(left / REELS_DAILY_MINUTES) * 100}%`;
  els.jar.classList.toggle("is-empty", left === 0);
  els.jarCaption.textContent = left === 0 ? "Penalty armed" : `${left} min left`;
  els.jar.title = left === 0
    ? "The reels jar is empty. The reels slice is now a 40 minute LeetCode penalty."
    : `${left} of ${REELS_DAILY_MINUTES} minutes of reels left today`;
}

// Tasks

function findTask(taskId) {
  return state.tasks.find((task) => task.id === taskId);
}

function findCategory(categoryId) {
  return CATEGORIES.find((category) => category.id === categoryId);
}

// History only stores ids, so names and icons are looked up when shown.
function describeTask(taskId) {
  const task = findTask(taskId);

  if (task) {
    return { icon: findCategory(task.category).icon, label: task.label };
  }

  if (taskId === "jackpot") {
    return { icon: "⭐", label: "Jackpot" };
  }

  if (taskId === PENALTY_TASK.id) {
    return { icon: "😤", label: "Penalty" };
  }

  return { icon: "·", label: taskId };
}

// Neglect

function lastDoneByCategory() {
  const lastDone = new Map();

  logbook.entries().forEach(({ taskId, result, date }) => {
    const task = findTask(taskId);

    if (task && result === "done") {
      lastDone.set(task.category, date);
    }
  });

  return lastDone;
}

function categoryWeight(category, lastDone) {
  if (category.ignoresNeglect) {
    return 1;
  }

  const doneAt = lastDone.get(category.id);
  const idleDays = doneAt ? Math.min(daysSince(doneAt), NEGLECT_MAX_DAYS) : NEGLECT_MAX_DAYS;
  return 1 + idleDays * NEGLECT_STEP;
}

// Learning

function taskStats() {
  const stats = new Map();

  logbook.entries().forEach(({ taskId, result }) => {
    if (!findTask(taskId) || result === "unbenched") {
      return;
    }

    const stat = stats.get(taskId) ?? { ...describeTask(taskId), done: 0, skipped: 0 };
    stat[result] += 1;
    stats.set(taskId, stat);
  });

  return stats;
}

function benchedTasks() {
  const streaks = logbook.skipStreaks();
  return state.tasks.filter((task) => (streaks.get(task.id) ?? 0) >= logbook.BENCH_STREAK);
}

// Every Done nudges a task up and every Skip nudges it down, within a floor and a
// ceiling so a task you keep skipping still turns up now and then.
function taskWeight(task, stats) {
  const stat = stats.get(task.id);
  const score = stat ? stat.done - stat.skipped : 0;
  return Math.min(Math.max(1 + score * LEARNING_STEP, LEARNING_FLOOR), LEARNING_CEILING);
}

// Slices

function eligibleTasks(categoryId, benched) {
  return state.tasks.filter((task) => (
    task.category === categoryId &&
    task.moods.includes(state.mood) &&
    !state.hidden.has(task.id) &&
    !benched.has(task.id)
  ));
}

function sliceFor(category, tasks, learning) {
  const weight = categoryWeight(category, learning.lastDone);

  if (category.id === "reels" && reelsLeft() === 0) {
    return { kind: "penalty", category, task: PENALTY_TASK, weight };
  }

  const task = pickWeighted(tasks, (candidate) => taskWeight(candidate, learning.stats));
  return { kind: "task", category, task, weight: weight * taskWeight(task, learning.stats) };
}

function buildSlices() {
  const learning = { stats: taskStats(), lastDone: lastDoneByCategory() };
  const benched = new Set(benchedTasks().map((task) => task.id));
  const taskSlices = CATEGORIES
    .map((category) => ({ category, tasks: eligibleTasks(category.id, benched) }))
    .filter(({ tasks }) => tasks.length > 0)
    .map(({ category, tasks }) => sliceFor(category, tasks, learning));

  return [...taskSlices, { kind: "jackpot", weight: JACKPOT_WEIGHT }];
}

// Angles run clockwise from 12 o'clock, so the pointer sits at angle 0.
function layoutArcs(slices) {
  const totalWeight = slices.reduce((sum, slice) => sum + slice.weight, 0);
  let start = 0;

  return slices.map((slice) => {
    const end = start + (slice.weight / totalWeight) * TAU;
    const arc = { slice, start, end };
    start = end;
    return arc;
  });
}

// The pointer passes slices in reverse order, so putting the jackpot directly after
// the winner makes the wheel roll over the jackpot one tick before it lands.
function arrangeSlices(winner, nearMiss) {
  const jackpot = state.slices.find((slice) => slice.kind === "jackpot");
  const arranged = shuffle(state.slices.filter((slice) => slice !== jackpot));
  const jackpotIndex = nearMiss
    ? arranged.indexOf(winner) + 1
    : Math.floor(Math.random() * (arranged.length + 1));

  arranged.splice(jackpotIndex, 0, jackpot);
  return arranged;
}

function showArcs(arcs) {
  state.arcs = arcs;
  state.slices = arcs.map((arc) => arc.slice);
  drawWheel();
}

function refreshWheel() {
  showArcs(layoutArcs(buildSlices()));
}

// Drawing

function textColorFor(hex) {
  const value = parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? palette.ink : palette.text;
}

function jackpotFill(ctx, arc, radius) {
  const middle = (arc.start + arc.end) / 2 - QUARTER_TURN;
  const across = middle + QUARTER_TURN;
  const half = radius * 0.3;
  const gold = ctx.createLinearGradient(
    Math.cos(across) * -half,
    Math.sin(across) * -half,
    Math.cos(across) * half,
    Math.sin(across) * half
  );

  JACKPOT_GOLD.forEach((color, index) => gold.addColorStop(index / (JACKPOT_GOLD.length - 1), color));
  return gold;
}

function sliceFill(ctx, arc, radius) {
  if (arc.slice.kind === "penalty") {
    return PENALTY_COLOR;
  }

  if (arc.slice.kind === "jackpot") {
    return jackpotFill(ctx, arc, radius);
  }

  return arc.slice.category.color;
}

function sliceFace(slice) {
  if (slice.kind === "jackpot") {
    return { icon: "⭐", label: "Jackpot", color: palette.ink };
  }

  if (slice.kind === "penalty") {
    return { icon: "😤", label: "Penalty", color: palette.text };
  }

  return {
    icon: slice.category.icon,
    label: slice.task.label,
    color: textColorFor(slice.category.color)
  };
}

function fitText(ctx, text, maxWidth) {
  let fitted = text;

  while (fitted.length > 1 && ctx.measureText(fitted).width > maxWidth) {
    fitted = fitted.slice(0, -1);
  }

  return fitted === text ? text : `${fitted.trimEnd()}…`;
}

function drawMysteryFace(ctx, arc, radius) {
  const sweep = arc.end - arc.start;
  const iconSize = Math.min(radius * 0.17, radius * sweep * 0.4);

  ctx.save();
  ctx.rotate((arc.start + arc.end) / 2 - QUARTER_TURN);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${iconSize}px ${EMOJI_FONT}`;
  ctx.fillText(sliceFace(arc.slice).icon, radius * 0.66, 0);
  ctx.restore();
}

function drawSliceFace(ctx, arc, radius) {
  if (state.mystery) {
    drawMysteryFace(ctx, arc, radius);
    return;
  }

  const { icon, label, color } = sliceFace(arc.slice);
  const sweep = arc.end - arc.start;
  const rim = radius * 0.9;
  const iconSize = Math.min(radius * 0.1, rim * sweep * 0.5);
  const labelSize = Math.min(radius * 0.044, radius * sweep * 0.26);
  const labelEnd = rim - iconSize * 1.35;

  ctx.save();
  ctx.rotate((arc.start + arc.end) / 2 - QUARTER_TURN);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  ctx.font = `${iconSize}px ${EMOJI_FONT}`;
  ctx.fillText(icon, rim, 0);

  ctx.font = `600 ${labelSize}px ${LABEL_FONT}`;
  ctx.fillStyle = color;
  ctx.fillText(fitText(ctx, label.toUpperCase(), labelEnd - radius * 0.24), labelEnd, 0);
  ctx.restore();
}

function drawSlice(ctx, arc, radius) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, arc.start - QUARTER_TURN, arc.end - QUARTER_TURN);
  ctx.closePath();
  ctx.fillStyle = sliceFill(ctx, arc, radius);
  ctx.fill();
}

// Two strokes per divider, dark then light, read as a bevelled chrome strip.
function drawDividers(ctx, radius) {
  state.arcs.forEach((arc) => {
    const angle = arc.start - QUARTER_TURN;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.stroke();
  });
}

// Darkens the hub and the rim, then lays a soft sheen over the top left.
function drawShading(ctx, radius) {
  const depth = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius);
  depth.addColorStop(0, "rgba(0, 0, 0, 0.45)");
  depth.addColorStop(0.35, "rgba(0, 0, 0, 0)");
  depth.addColorStop(0.85, "rgba(0, 0, 0, 0.08)");
  depth.addColorStop(1, "rgba(0, 0, 0, 0.5)");

  const sheen = ctx.createLinearGradient(-radius, -radius, radius * 0.4, radius * 0.4);
  sheen.addColorStop(0, "rgba(255, 255, 255, 0.14)");
  sheen.addColorStop(0.5, "rgba(255, 255, 255, 0)");

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fillStyle = depth;
  ctx.fill();
  ctx.fillStyle = sheen;
  ctx.fill();
}

function drawPegs(ctx, radius) {
  const pegRadius = Math.max(radius * 0.014, 2.5);

  state.arcs.forEach((arc) => {
    const angle = arc.start - QUARTER_TURN;
    const x = Math.cos(angle) * radius * 0.955;
    const y = Math.sin(angle) * radius * 0.955;
    const shine = ctx.createRadialGradient(x - pegRadius / 3, y - pegRadius / 3, 0, x, y, pegRadius);
    shine.addColorStop(0, palette.chromeLight);
    shine.addColorStop(1, palette.chromeDark);

    ctx.beginPath();
    ctx.arc(x, y, pegRadius, 0, TAU);
    ctx.fillStyle = shine;
    ctx.fill();
  });
}

function drawWheel() {
  const canvas = els.wheel;
  const size = canvas.clientWidth;
  const pixelRatio = window.devicePixelRatio || 1;
  const radius = size / 2;

  canvas.width = Math.round(size * pixelRatio);
  canvas.height = canvas.width;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, radius * pixelRatio, radius * pixelRatio);
  state.arcs.forEach((arc) => drawSlice(ctx, arc, radius));
  drawShading(ctx, radius);
  drawDividers(ctx, radius);
  state.arcs.forEach((arc) => drawSliceFace(ctx, arc, radius));
  drawPegs(ctx, radius);
}

function renderBulbs() {
  els.bulbs.style.setProperty("--count", BULB_COUNT);

  for (let index = 0; index < BULB_COUNT; index++) {
    const bulb = document.createElement("span");
    bulb.className = "bulb";
    bulb.style.setProperty("--index", index);
    els.bulbs.append(bulb);
  }
}

// Spinning

function arcUnderPointer() {
  const pointerAngle = modulo(-state.rotation, TAU);
  return state.arcs.find((arc) => pointerAngle >= arc.start && pointerAngle < arc.end) ?? state.arcs[0];
}

// A peg knocks the pointer aside and it springs back with a small overshoot.
function bouncePointer() {
  if (calmMotion.matches) {
    return;
  }

  els.pointer.animate(
    [
      { transform: "rotate(0deg)" },
      { transform: "rotate(-12deg)", offset: 0.25 },
      { transform: "rotate(3deg)", offset: 0.65 },
      { transform: "rotate(0deg)" }
    ],
    { duration: 180, easing: "ease-out" }
  );
}

function setRotation(rotation) {
  state.rotation = rotation;
  els.wheel.style.transform = `rotate(${rotation}rad)`;

  const arc = arcUnderPointer();

  if (arc !== state.pointerArc) {
    state.pointerArc = arc;
    sounds.tick();
    bouncePointer();
  }
}

function pickWeightedSlice() {
  return pickWeighted(state.slices, (slice) => slice.weight);
}

// Rotating the wheel clockwise moves the pointer backwards through the angles,
// so landing on angle A means the wheel must end at a rotation of -A, plus whole turns.
function rotationToLand(arc, positionInArc, extraTurns) {
  const landingAngle = arc.start + (arc.end - arc.start) * positionInArc;
  const minimum = state.rotation + extraTurns * TAU;
  return minimum + modulo(-landingAngle - minimum, TAU);
}

function turnWheel(target, duration, easing) {
  const from = state.rotation;
  const startedAt = performance.now();

  return new Promise((resolve) => {
    function frame(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      setRotation(from + (target - from) * easing(progress));

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

function showFlash(text) {
  els.flash.textContent = text;
  els.flash.hidden = false;
  els.flash
    .animate(
      [
        { opacity: 0, transform: "translate(-50%, -50%) scale(0.3) rotate(-12deg)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1.1) rotate(-6deg)", offset: 0.2 },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1) rotate(-6deg)", offset: 0.8 },
        { opacity: 0, transform: "translate(-50%, -50%) scale(1.3) rotate(-6deg)" }
      ],
      { duration: 1600, easing: "ease-out" }
    )
    .finished.then(() => {
      els.flash.hidden = true;
    });
}

// Stop dead on the jackpot, let it breathe, then creep one tick past it.
async function teaseJackpot(arcs, winnerArc) {
  const jackpotArc = arcs.find((arc) => arc.slice.kind === "jackpot");

  await turnWheel(rotationToLand(jackpotArc, 0.6, SPIN_TURNS), SPIN_MS, easeOutQuint);
  sounds.stopDrumroll();
  setHostLine("tease");
  await wait(TEASE_PAUSE_MS);

  await turnWheel(rotationToLand(winnerArc, randomBetween(0.86, 0.94), 0), CREEP_MS, easeInOutSine);
  sounds.soClose();
  showFlash("So close!");
  setHostLine("nearMiss");
  await wait(NEAR_MISS_PAUSE_MS);
}

async function spin() {
  if (state.spinning || state.pending || lockRemaining() > 0) {
    return;
  }

  state.spinning = true;
  updateControls();
  setHostLine("spinning");
  els.wheelWrap.classList.add("is-spinning");
  sounds.startDrumroll();

  const winner = pickWeightedSlice();
  const nearMiss = winner.kind !== "jackpot" && !calmMotion.matches && Math.random() < NEAR_MISS_CHANCE;
  const arcs = layoutArcs(arrangeSlices(winner, nearMiss));
  const winnerArc = arcs.find((arc) => arc.slice === winner);

  // The board reshuffles once the wheel is a blur, so the swap is never visible.
  setTimeout(() => showArcs(arcs), RESHUFFLE_MS);

  if (nearMiss) {
    await teaseJackpot(arcs, winnerArc);
  } else if (calmMotion.matches) {
    await turnWheel(rotationToLand(winnerArc, 0.5, CALM_SPIN_TURNS), CALM_SPIN_MS, easeOutCubic);
  } else {
    await turnWheel(rotationToLand(winnerArc, randomBetween(0.2, 0.8), SPIN_TURNS), SPIN_MS, easeOutQuint);
  }

  sounds.stopDrumroll();
  els.wheelWrap.classList.remove("is-spinning");
  state.rotation = modulo(state.rotation, TAU);
  state.spinning = false;

  announce(outcomeFor(winner));
}

function lockRemaining() {
  return Math.max(storage.load("lockedUntil", 0) - Date.now(), 0);
}

function spinButtonLabel(locked) {
  if (locked > 0) {
    return formatClock(locked);
  }

  return state.spinning ? "···" : "Spin";
}

function updateControls() {
  const locked = lockRemaining();

  els.spinButton.textContent = spinButtonLabel(locked);
  els.spinButton.setAttribute("aria-label", locked > 0 ? `Wheel locked for ${formatClock(locked)}` : "Spin the wheel");
  els.spinButton.disabled = state.spinning || Boolean(state.pending) || locked > 0;
  els.mysteryToggle.disabled = state.spinning;
  els.moodButtons.forEach((button) => {
    button.disabled = state.spinning;
  });
}

// Results

function outcomeFor(slice) {
  if (slice.kind === "jackpot") {
    return {
      kind: "jackpot",
      icon: "⭐",
      categoryId: "jackpot",
      categoryName: "Jackpot",
      label: "Jackpot",
      text: pickRandom(TREATS),
      minutes: null
    };
  }

  if (slice.kind === "penalty") {
    return {
      kind: "penalty",
      icon: "😤",
      taskId: slice.task.id,
      categoryId: "penalty",
      categoryName: "Penalty",
      label: slice.task.label,
      text: slice.task.text,
      minutes: slice.task.minutes
    };
  }

  return {
    kind: "task",
    icon: slice.category.icon,
    taskId: slice.task.id,
    categoryId: slice.category.id,
    categoryName: slice.category.name,
    label: slice.task.label,
    text: slice.task.text,
    minutes: slice.task.minutes
  };
}

function announce(outcome) {
  state.pending = { ...outcome, spunAt: new Date().toISOString() };
  storage.save("pending", state.pending);

  sounds.crash();
  celebrate(outcome);

  // Let the landing sink in before the card covers the wheel.
  setTimeout(() => showResult(state.pending), REVEAL_DELAY_MS);
}

function celebrate(outcome) {
  if (outcome.kind === "penalty") {
    sounds.sadTrombone();
    setHostLine("penalty");
    return;
  }

  if (outcome.kind === "jackpot") {
    sounds.horn();
    confetti.jackpot();
    setHostLine("jackpot");
    return;
  }

  sounds.fanfare();

  if (outcome.categoryId === "reels") {
    drainReels(outcome.minutes);
    setHostLine("reels");
    return;
  }

  setHostLine("win");
}

function resultKicker(outcome) {
  if (KICKERS[outcome.kind]) {
    return KICKERS[outcome.kind];
  }

  return state.mystery ? "The mystery is revealed" : "The wheel has spoken";
}

function actionsFor(outcome) {
  const skip = { label: "Skip", style: "action-ghost", run: () => settle("skipped") };

  if (outcome.taskId === "magic8Ball") {
    return [
      { label: "It said yes", style: "action-primary", run: () => settle("done", "spinAgain") },
      { label: "It said no", style: "", run: () => settle("done", "lockWheel") },
      skip
    ];
  }

  const done = { label: "Done", style: "action-primary", run: () => settle("done") };

  if (!outcome.minutes || outcome.timerEndsAt) {
    return [done, skip];
  }

  const timer = { label: `Start ${outcome.minutes} min timer`, style: "action-timer", run: startTimer };
  return [timer, done, skip];
}

function renderResultIcon(outcome) {
  if (outcome.taskId === "magic8Ball") {
    const ball = document.createElement("div");
    ball.className = "eight-ball";
    els.resultIcon.replaceChildren(ball);
    return;
  }

  els.resultIcon.textContent = outcome.icon;
}

// Timer

function startTimer() {
  state.pending.timerEndsAt = Date.now() + state.pending.minutes * 60 * 1000;
  state.timerChimed = false;
  storage.save("pending", state.pending);
  setHostLine("timerStarted");
  renderActions(actionsFor(state.pending));
  renderTimer();
}

function renderTimer() {
  const endsAt = state.pending?.timerEndsAt;
  els.timer.hidden = !endsAt;

  if (!endsAt) {
    return;
  }

  const total = state.pending.minutes * 60 * 1000;
  const left = Math.max(endsAt - Date.now(), 0);
  els.timerClock.textContent = left > 0 ? formatClock(left) : "Time";
  els.timerBar.style.width = `${(left / total) * 100}%`;
  els.timer.classList.toggle("is-finished", left === 0);

  if (left === 0 && !state.timerChimed) {
    state.timerChimed = true;
    sounds.chime();
    setHostLine("timerDone");
  }
}

function everySecond() {
  updateControls();
  renderTimer();
}

function showResult(outcome) {
  els.resultKicker.textContent = resultKicker(outcome);
  renderResultIcon(outcome);
  els.resultCategory.textContent = outcome.kind === "jackpot" ? "Guilt free treat unlocked" : outcome.categoryName;
  els.resultTitle.textContent = outcome.text;
  els.result.dataset.kind = outcome.kind;
  renderActions(actionsFor(outcome));
  state.timerChimed = Boolean(outcome.timerEndsAt) && outcome.timerEndsAt <= Date.now();
  renderTimer();

  els.result.hidden = false;
  updateControls();
  els.resultActions.querySelector("button").focus();
}

function renderActions(actions) {
  const buttons = actions.map(({ label, style, run }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = ["action-button", style].filter(Boolean).join(" ");
    button.textContent = label;
    button.addEventListener("click", run);
    return button;
  });

  els.resultActions.replaceChildren(...buttons);
}

function applyEffect(effect) {
  if (effect === "spinAgain") {
    setHostLine("eightBallYes");
    setTimeout(spin, EIGHT_BALL_RESPIN_MS);
  }

  if (effect === "lockWheel") {
    storage.save("lockedUntil", Date.now() + EIGHT_BALL_LOCK_MS);
    setHostLine("eightBallNo");
  }
}

function settle(status, effect) {
  logbook.record(state.pending.taskId ?? state.pending.kind, status);
  syncHistory();
  state.pending = null;
  storage.save("pending", null);
  els.result.hidden = true;
  setHostLine(status);
  refreshWheel();

  if (status === "done") {
    confetti.burst({ count: 90, y: 0.6 });
  }

  applyEffect(effect);
  updateControls();
}

// Controls

function setMood(mood) {
  state.mood = mood;
  renderMoods();
  setHostLine(mood);
  refreshWheel();
}

function renderMoods() {
  els.moodButtons.forEach((button) => {
    button.setAttribute("aria-checked", String(button.dataset.mood === state.mood));
  });
}

function setMystery(enabled) {
  state.mystery = enabled;
  storage.save("mystery", enabled);
  drawWheel();

  if (enabled) {
    setHostLine("mystery");
  }
}

function setTaskHidden(taskId, hidden) {
  if (hidden) {
    state.hidden.add(taskId);
  } else {
    state.hidden.delete(taskId);
  }

  storage.save("hidden", [...state.hidden]);
  refreshWheelWhenIdle();
}

// Drawer

function renderTaskToggles() {
  const groups = CATEGORIES.map((category) => {
    const group = document.createElement("fieldset");
    const legend = document.createElement("legend");
    group.className = "toggle-group";
    legend.textContent = `${category.icon} ${category.name}`;
    group.append(legend);

    state.tasks.filter((task) => task.category === category.id).forEach((task) => {
      group.append(renderTaskToggle(task));
    });

    return group;
  });

  els.taskToggles.replaceChildren(...groups);
}

function renderTaskToggle(task) {
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  label.className = "task-toggle";
  label.title = task.text;
  checkbox.type = "checkbox";
  checkbox.checked = !state.hidden.has(task.id);
  checkbox.addEventListener("change", () => setTaskHidden(task.id, !checkbox.checked));
  label.append(checkbox, task.label);
  return label;
}

function renderHistory() {
  const entries = logbook.entries().slice(-HISTORY_SHOWN).reverse();

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Nothing yet. The stage is yours.";
    els.history.replaceChildren(empty);
    return;
  }

  els.history.replaceChildren(...entries.map(renderHistoryEntry));
}

function renderHistoryEntry(entry) {
  const item = document.createElement("li");
  const icon = document.createElement("span");
  const details = document.createElement("span");
  const time = document.createElement("time");
  const status = document.createElement("span");

  const { icon: taskIcon, label } = describeTask(entry.taskId);
  icon.textContent = taskIcon;
  time.dateTime = entry.date;
  time.textContent = new Date(entry.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  details.append(label, time);
  status.className = `history-status ${entry.result}`;
  status.textContent = entry.result;
  item.append(icon, details, status);
  return item;
}

function renderRankEntry({ icon, label }, detail) {
  const item = document.createElement("li");
  const name = document.createElement("span");
  const count = document.createElement("span");

  name.textContent = label;
  count.className = "rank-count";
  count.textContent = detail;
  item.append(icon, name, count);
  return item;
}

function renderRankList(list, entries, emptyText) {
  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "rank-empty";
    empty.textContent = emptyText;
    list.replaceChildren(empty);
    return;
  }

  list.replaceChildren(...entries);
}

function renderLearning() {
  const stats = [...taskStats().values()];
  const topTasks = stats
    .filter((stat) => stat.done > 0)
    .sort((first, second) => second.done - first.done || first.skipped - second.skipped)
    .slice(0, TOP_TASKS_SHOWN)
    .map((stat) => renderRankEntry(stat, `${stat.done} done`));
  const skippedTasks = stats
    .filter((stat) => stat.done === 0 && stat.skipped >= ALWAYS_SKIPPED_MIN)
    .sort((first, second) => second.skipped - first.skipped)
    .map((stat) => renderRankEntry(stat, `${stat.skipped} skips`));

  renderRankList(els.topTasks, topTasks, "Finish a few tasks and your favourites show up here.");
  renderRankList(els.skippedTasks, skippedTasks, "Nothing you keep dodging. Suspicious, but nice.");
  renderBenched();
}

function renderBenchedEntry(task) {
  const item = document.createElement("li");
  const icon = document.createElement("span");
  const name = document.createElement("span");
  const unbench = document.createElement("button");

  icon.textContent = findCategory(task.category).icon;
  name.textContent = task.label;
  unbench.type = "button";
  unbench.className = "unbench-button";
  unbench.textContent = "Unbench";
  unbench.addEventListener("click", () => unbenchTask(task.id));
  item.append(icon, name, unbench);
  return item;
}

function renderBenched() {
  const entries = benchedTasks().map(renderBenchedEntry);
  renderRankList(els.benchedTasks, entries, `Skip a task ${logbook.BENCH_STREAK} times in a row and it sits out here.`);
}

function unbenchTask(taskId) {
  logbook.record(taskId, "unbenched");
  syncHistory();
  setHostLine("unbenched");
  renderLearning();
  refreshWheelWhenIdle();
}

// History sync

const SYNC_MESSAGES = {
  off: "No token, so history stays on this device. Everything still works.",
  queued: "Waiting to sync. Retries on the next load.",
  synced: "Synced to history.json."
};

function renderSyncStatus() {
  els.syncStatus.textContent = SYNC_MESSAGES[logbook.syncState()];
}

function renderSyncSettings() {
  const { token, repo } = logbook.settings();
  els.syncRepo.value = repo;
  els.syncToken.value = "";
  els.syncToken.placeholder = token ? "Token saved. Paste a new one to replace it." : "github_pat_…";
  els.syncForget.hidden = !token;
  renderSyncStatus();
}

async function syncHistory() {
  await logbook.sync();
  renderSyncStatus();
}

function saveSyncSettings(event) {
  event.preventDefault();
  const { token } = logbook.settings();

  logbook.saveSettings({
    repo: els.syncRepo.value.trim(),
    token: els.syncToken.value.trim() || token
  });
  renderSyncSettings();
  syncHistory();
}

function forgetSyncToken() {
  logbook.forgetToken();
  renderSyncSettings();
}

// Another device may have logged results, so the wheel and drawer redraw afterwards.
async function catchUpHistory() {
  await logbook.pullPublished();
  await syncHistory();
  refreshWheelWhenIdle();
}

async function loadIdeas() {
  state.tasks = ideas.apply(TASKS, await ideas.fetchIdeas());
  refreshWheelWhenIdle();
}

// Never swap slices out from under a spinning wheel; the next round picks it up.
function refreshWheelWhenIdle() {
  if (!state.spinning) {
    refreshWheel();
  }
}

function openDrawer() {
  renderSyncSettings();
  renderTaskToggles();
  renderLearning();
  renderHistory();
  els.drawer.hidden = false;
  els.drawerBackdrop.hidden = false;
  els.settingsButton.setAttribute("aria-expanded", "true");
  els.drawerClose.focus();
}

function closeDrawer() {
  els.drawer.hidden = true;
  els.drawerBackdrop.hidden = true;
  els.settingsButton.setAttribute("aria-expanded", "false");
  els.settingsButton.focus();
}

function bindControls() {
  els.spinButton.addEventListener("click", spin);
  els.mysteryToggle.addEventListener("change", () => setMystery(els.mysteryToggle.checked));
  els.settingsButton.addEventListener("click", openDrawer);
  els.drawerClose.addEventListener("click", closeDrawer);
  els.drawerBackdrop.addEventListener("click", closeDrawer);
  els.syncForm.addEventListener("submit", saveSyncSettings);
  els.syncForget.addEventListener("click", forgetSyncToken);
  els.moodButtons.forEach((button) => {
    button.addEventListener("click", () => setMood(button.dataset.mood));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.drawer.hidden) {
      closeDrawer();
    }
  });
}

function init() {
  logbook.migrate();
  renderBulbs();
  renderJar();
  renderMoods();
  els.mysteryToggle.checked = state.mystery;
  setHostLine("idle");
  refreshWheel();
  updateControls();
  bindControls();
  setInterval(everySecond, 1000);

  // Canvas text does not repaint when web fonts arrive, so draw again once they do.
  document.fonts.ready.then(drawWheel);
  window.addEventListener("resize", drawWheel);

  if (state.pending) {
    showResult(state.pending);
  }

  loadIdeas();
  catchUpHistory();
}

init();
