const TAU = Math.PI * 2;
const QUARTER_TURN = Math.PI / 2;
const BULB_COUNT = 28;
const JACKPOT_WEIGHT = 0.45;
const LABEL_FONT = 'Bungee, Impact, "Arial Black", sans-serif';
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

const HOST_LINES = {
  idle: [
    "Bored? Not on my watch. Not on my network.",
    "Step right up. The wheel has no idea what you did yesterday.",
    "Somewhere a studio audience is chanting your name.",
    "Ten minutes. One task. Zero decisions. That's the show."
  ]
};

const state = {
  mood: "meh",
  slices: [],
  arcs: []
};

const els = {
  wheel: document.getElementById("wheel"),
  bulbs: document.getElementById("bulbs"),
  hostLine: document.getElementById("hostLine")
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

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function setHostLine(moment) {
  els.hostLine.textContent = pickRandom(HOST_LINES[moment]);
}

// Slices

function eligibleTasks(categoryId) {
  return TASKS.filter((task) => task.category === categoryId && task.moods.includes(state.mood));
}

function buildSlices() {
  const taskSlices = CATEGORIES
    .map((category) => ({ category, tasks: eligibleTasks(category.id) }))
    .filter(({ tasks }) => tasks.length > 0)
    .map(({ category, tasks }) => ({ kind: "task", category, task: pickRandom(tasks), weight: 1 }));

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

function refreshWheel() {
  state.slices = buildSlices();
  state.arcs = layoutArcs(state.slices);
  drawWheel();
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

function drawSliceFace(ctx, arc, radius) {
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

function init() {
  renderBulbs();
  setHostLine("idle");
  refreshWheel();

  // Canvas text does not repaint when web fonts arrive, so draw again once they do.
  document.fonts.ready.then(drawWheel);
  window.addEventListener("resize", drawWheel);
}

init();
