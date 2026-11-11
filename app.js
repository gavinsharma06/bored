const TAU = Math.PI * 2;
const QUARTER_TURN = Math.PI / 2;
const BULB_COUNT = 28;
const JACKPOT_WEIGHT = 0.45;
const SPIN_TURNS = 6;
const SPIN_MS = 5200;
const REVEAL_DELAY_MS = 900;
const RESHUFFLE_MS = 300;
const NEAR_MISS_CHANCE = 0.4;
const TEASE_PAUSE_MS = 700;
const CREEP_MS = 1500;
const NEAR_MISS_PAUSE_MS = 900;
const EIGHT_BALL_LOCK_MS = 10 * 60 * 1000;
const EIGHT_BALL_RESPIN_MS = 1400;
const HISTORY_LIMIT = 500;
const HISTORY_SHOWN = 30;
const REELS_DAILY_MINUTES = 60;
const NEGLECT_STEP = 0.25;
const NEGLECT_MAX_DAYS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;
const PENALTY_COLOR = "#6b6461";
const STORAGE_PREFIX = "bored.";
const LABEL_FONT = 'Bungee, Impact, "Arial Black", sans-serif';
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
  eightBallNo: [
    "The 8 Ball says no. The wheel is locked for 10 minutes. Go stare out a window."
  ]
};

const KICKERS = {
  jackpot: "Jackpot!!!",
  penalty: "The wheel is disappointed"
};

const state = {
  mood: "meh",
  slices: [],
  arcs: [],
  rotation: 0,
  pointerArc: null,
  spinning: false,
  pending: load("pending", null),
  mystery: load("mystery", false),
  hidden: new Set(load("hidden", []))
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
  resultMinutes: document.getElementById("resultMinutes"),
  resultActions: document.getElementById("resultActions"),
  moodButtons: document.querySelectorAll("[data-mood]"),
  mysteryToggle: document.getElementById("mysteryToggle"),
  settingsButton: document.getElementById("settingsButton"),
  drawer: document.getElementById("drawer"),
  drawerBackdrop: document.getElementById("drawerBackdrop"),
  drawerClose: document.getElementById("drawerClose"),
  taskToggles: document.getElementById("taskToggles"),
  history: document.getElementById("history"),
  jar: document.getElementById("jar"),
  jarFill: document.getElementById("jarFill"),
  jarCaption: document.getElementById("jarCaption")
};

const palette = readPalette();

function readPalette() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name) => styles.getPropertyValue(name).trim();

  return {
    brass: read("--brass"),
    cream: read("--cream"),
    tomato: read("--tomato"),
    ink: read("--ink")
  };
}

// Helpers

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
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
  const jar = load("reels", null);
  const usedToday = jar && jar.day === todayKey() ? jar.minutesUsed : 0;
  return Math.max(REELS_DAILY_MINUTES - usedToday, 0);
}

function drainReels(minutes) {
  const used = REELS_DAILY_MINUTES - reelsLeft() + minutes;
  save("reels", { day: todayKey(), minutesUsed: used });
  renderJar();
}

function renderJar() {
  const left = reelsLeft();
  els.jarFill.style.height = `${(left / REELS_DAILY_MINUTES) * 100}%`;
  els.jar.classList.toggle("is-empty", left === 0);
  els.jarCaption.textContent = left === 0
    ? "Jar's empty. Reels are now a penalty."
    : `${left} of ${REELS_DAILY_MINUTES} min of reels left today`;
}

// Neglect

function categoryWeight(category) {
  if (category.ignoresNeglect) {
    return 1;
  }

  const lastDone = load("lastDone", {})[category.id];
  const idleDays = lastDone ? Math.min(daysSince(lastDone), NEGLECT_MAX_DAYS) : NEGLECT_MAX_DAYS;
  return 1 + idleDays * NEGLECT_STEP;
}

function markCategoryDone(categoryId) {
  const lastDone = load("lastDone", {});
  lastDone[categoryId] = new Date().toISOString();
  save("lastDone", lastDone);
}

// Slices

function eligibleTasks(categoryId) {
  return TASKS.filter((task) => (
    task.category === categoryId &&
    task.moods.includes(state.mood) &&
    !state.hidden.has(task.id)
  ));
}

function sliceFor(category, tasks) {
  const weight = categoryWeight(category);

  if (category.id === "reels" && reelsLeft() === 0) {
    return { kind: "penalty", category, task: PENALTY_TASK, weight };
  }

  return { kind: "task", category, task: pickRandom(tasks), weight };
}

function buildSlices() {
  const taskSlices = CATEGORIES
    .map((category) => ({ category, tasks: eligibleTasks(category.id) }))
    .filter(({ tasks }) => tasks.length > 0)
    .map(({ category, tasks }) => sliceFor(category, tasks));

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

  return brightness > 150 ? palette.ink : palette.cream;
}

function sliceFill(ctx, slice, radius) {
  if (slice.kind === "penalty") {
    return PENALTY_COLOR;
  }

  if (slice.kind !== "jackpot") {
    return slice.category.color;
  }

  const shine = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
  shine.addColorStop(0, palette.brass);
  shine.addColorStop(0.75, "#fff3b0");
  shine.addColorStop(1, palette.brass);
  return shine;
}

function sliceFace(slice) {
  if (slice.kind === "jackpot") {
    return { icon: "⭐", label: "Jackpot", color: palette.tomato };
  }

  if (slice.kind === "penalty") {
    return { icon: "😤", label: "Penalty", color: palette.cream };
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
  const rim = radius * 0.92;
  const iconSize = Math.min(radius * 0.12, rim * sweep * 0.55);
  const labelSize = Math.min(radius * 0.065, radius * sweep * 0.3);
  const labelEnd = rim - iconSize * 1.3;

  ctx.save();
  ctx.rotate((arc.start + arc.end) / 2 - QUARTER_TURN);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  ctx.font = `${iconSize}px ${EMOJI_FONT}`;
  ctx.fillText(icon, rim, 0);

  ctx.font = `${labelSize}px ${LABEL_FONT}`;
  ctx.fillStyle = color;
  ctx.fillText(fitText(ctx, label.toUpperCase(), labelEnd - radius * 0.22), labelEnd, 0);
  ctx.restore();
}

function drawSlice(ctx, arc, radius) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, arc.start - QUARTER_TURN, arc.end - QUARTER_TURN);
  ctx.closePath();
  ctx.fillStyle = sliceFill(ctx, arc.slice, radius);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = palette.ink;
  ctx.stroke();

  drawSliceFace(ctx, arc, radius);
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

function flickPointer() {
  els.pointer.animate(
    [{ transform: "rotate(-22deg)" }, { transform: "rotate(0deg)" }],
    { duration: 140, easing: "ease-out" }
  );
}

function setRotation(rotation) {
  state.rotation = rotation;
  els.wheel.style.transform = `rotate(${rotation}rad)`;

  const arc = arcUnderPointer();

  if (arc !== state.pointerArc) {
    state.pointerArc = arc;
    sounds.tick();
    flickPointer();
  }
}

function pickWeightedSlice() {
  const totalWeight = state.slices.reduce((sum, slice) => sum + slice.weight, 0);
  let roll = Math.random() * totalWeight;

  return state.slices.find((slice) => {
    roll -= slice.weight;
    return roll <= 0;
  }) ?? state.slices[state.slices.length - 1];
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

  await turnWheel(rotationToLand(jackpotArc, 0.6, SPIN_TURNS), SPIN_MS, easeOutCubic);
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
  const nearMiss = winner.kind !== "jackpot" && Math.random() < NEAR_MISS_CHANCE;
  const arcs = layoutArcs(arrangeSlices(winner, nearMiss));
  const winnerArc = arcs.find((arc) => arc.slice === winner);

  // The board reshuffles once the wheel is a blur, so the swap is never visible.
  setTimeout(() => showArcs(arcs), RESHUFFLE_MS);

  if (nearMiss) {
    await teaseJackpot(arcs, winnerArc);
  } else {
    await turnWheel(rotationToLand(winnerArc, randomBetween(0.2, 0.8), SPIN_TURNS), SPIN_MS, easeOutCubic);
  }

  sounds.stopDrumroll();
  els.wheelWrap.classList.remove("is-spinning");
  state.rotation = modulo(state.rotation, TAU);
  state.spinning = false;

  announce(outcomeFor(winner));
}

function lockRemaining() {
  return Math.max(load("lockedUntil", 0) - Date.now(), 0);
}

function updateControls() {
  const locked = lockRemaining();

  els.spinButton.textContent = locked > 0 ? `Locked ${formatClock(locked)}` : "Spin";
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
  save("pending", state.pending);

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
  const skip = { label: "Skipped", status: "skipped", style: "action-secondary" };

  if (outcome.taskId === "magic8Ball") {
    return [
      { label: "It said yes", status: "done", style: "action-primary", effect: "spinAgain" },
      { label: "It said no", status: "done", style: "action-primary", effect: "lockWheel" },
      skip
    ];
  }

  return [{ label: "Done", status: "done", style: "action-primary" }, skip];
}

function showResult(outcome) {
  els.resultKicker.textContent = resultKicker(outcome);
  els.resultIcon.textContent = outcome.icon;
  els.resultCategory.textContent = outcome.kind === "jackpot" ? "Guilt free treat unlocked" : outcome.categoryName;
  els.resultTitle.textContent = outcome.text;
  els.resultMinutes.textContent = outcome.minutes ? `${outcome.minutes} min` : "No timer";
  els.result.dataset.kind = outcome.kind;
  renderActions(actionsFor(outcome));

  els.result.hidden = false;
  updateControls();
  els.resultActions.querySelector("button").focus();
}

function renderActions(actions) {
  const buttons = actions.map(({ label, status, style, effect }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `action-button ${style}`;
    button.textContent = label;
    button.addEventListener("click", () => settle(status, effect));
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
    save("lockedUntil", Date.now() + EIGHT_BALL_LOCK_MS);
    setHostLine("eightBallNo");
  }
}

function settle(status, effect) {
  const history = load("history", []);
  history.push({ ...state.pending, status, loggedAt: new Date().toISOString() });
  save("history", history.slice(-HISTORY_LIMIT));

  if (status === "done" && state.pending.kind === "task") {
    markCategoryDone(state.pending.categoryId);
  }

  state.pending = null;
  save("pending", null);
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
  save("mystery", enabled);
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

  save("hidden", [...state.hidden]);

  // Never swap slices out from under a spinning wheel; the next round picks this up.
  if (!state.spinning) {
    refreshWheel();
  }
}

// Drawer

function renderTaskToggles() {
  const groups = CATEGORIES.map((category) => {
    const group = document.createElement("fieldset");
    const legend = document.createElement("legend");
    group.className = "toggle-group";
    legend.textContent = `${category.icon} ${category.name}`;
    group.append(legend);

    TASKS.filter((task) => task.category === category.id).forEach((task) => {
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
  const entries = load("history", []).slice(-HISTORY_SHOWN).reverse();

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

  icon.textContent = entry.icon;
  time.dateTime = entry.loggedAt;
  time.textContent = new Date(entry.loggedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  details.append(entry.label, time);
  status.className = `history-status ${entry.status}`;
  status.textContent = entry.status;
  item.append(icon, details, status);
  return item;
}

function openDrawer() {
  renderTaskToggles();
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
  renderBulbs();
  renderJar();
  renderMoods();
  els.mysteryToggle.checked = state.mystery;
  setHostLine("idle");
  refreshWheel();
  updateControls();
  bindControls();
  setInterval(updateControls, 1000);

  // Canvas text does not repaint when web fonts arrive, so draw again once they do.
  document.fonts.ready.then(drawWheel);
  window.addEventListener("resize", drawWheel);

  if (state.pending) {
    showResult(state.pending);
  }
}

init();
