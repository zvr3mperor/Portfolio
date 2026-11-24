"use strict";

const motion = matchMedia("(prefers-reduced-motion: reduce)");
const button = document.querySelector("#playback");
const status = document.querySelector("#status");
const note = document.querySelector("#scroll-note");
const rain = document.querySelector("#rain");
const context = rain.getContext("2d");
const storageKey = "portfolio-progress-v1:" + location.pathname;
const clamp = (value) => Math.max(0, Math.min(value, 1));
const mix = (from, to, amount) => from + (to - from) * amount;

function loadProgress() {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

const saved = loadProgress();
const cards = [...document.querySelectorAll("article.project")].map((card) => ({
  card,
  image: card.querySelector(".project-image"),
  copy: card.querySelector(".project-copy"),
  text: [...card.querySelectorAll("[data-type]")].map((node) => ({
    node, letters: [...node.textContent], visual: null
  })),
  artCursor: null,
  textCursor: null,
  progress: clamp(Number(saved[card.id]) || 0)
}));

document.querySelector(".terminal-body strong").textContent = String(cards.length).padStart(2, "0");

function addCursor(card, label, color) {
  const cursor = document.createElement("div");
  const name = document.createElement("span");
  cursor.className = "cursor";
  cursor.style.setProperty("--cursor-color", color);
  cursor.setAttribute("aria-hidden", "true");
  name.textContent = label;
  cursor.append(name);
  card.append(cursor);
  return cursor;
}

function prepareCard(entry) {
  if (entry.artCursor || entry.progress === 1) return;
  entry.card.classList.add("is-building");
  for (const item of entry.text) {
    item.visual = document.createElement("span");
    item.visual.className = "type-visual";
    item.visual.setAttribute("aria-hidden", "true");
    item.node.append(item.visual);
  }
  entry.artCursor = addCursor(entry.card, "Layout", "#ff526b");
  entry.textCursor = addCursor(entry.card, "Copy", "#c6a8ff");
}

function placeCursor(cursor, x, y, visible) {
  cursor.hidden = !visible;
  cursor.style.transform = `translate(${x}px, ${y}px)`;
}

function renderCard(entry) {
  const {card, image, copy, text, progress} = entry;
  if (progress === 1 && !entry.artCursor) return;
  prepareCard(entry);
  if (progress === 1) {
    card.classList.remove("is-building");
    text.forEach(({visual}) => visual.remove());
    entry.artCursor.remove();
    entry.textCursor.remove();
    entry.artCursor = null;
    entry.textCursor = null;
    return;
  }

  const placement = clamp((progress - .06) / .33);
  const box = clamp((progress - .14) / .24);
  card.style.setProperty("--image-opacity", placement);
  card.style.setProperty("--image-x", `${mix(-30, 0, placement)}px`);
  card.style.setProperty("--image-y", `${mix(-20, 0, placement)}px`);
  card.style.setProperty("--copy-opacity", box);
  card.style.setProperty("--box-outline", box > 0 ? "#723347" : "transparent");

  const totalLetters = text.reduce((sum, item) => sum + item.letters.length, 0);
  let left = Math.floor(totalLetters * clamp((progress - .35) / .59));
  for (const {visual, letters} of text) {
    const written = Math.max(0, Math.min(letters.length, left));
    const value = letters.slice(0, written).join("");
    if (visual.textContent !== value) visual.textContent = value;
    visual.dataset.caret = progress >= .35 && left >= 0 && left < letters.length;
    left -= letters.length;
  }

  const imageTravel = clamp(progress / .39);
  const textTravel = clamp((progress - .08) / .3);
  const artX = image.offsetLeft + image.offsetWidth * .42;
  const artY = image.offsetTop + image.offsetHeight * .4;
  const copyX = copy.offsetLeft + Math.min(42, copy.offsetWidth * .2);
  const copyY = copy.offsetTop + Math.min(47, copy.offsetHeight * .4);
  placeCursor(entry.artCursor, mix(10, artX, imageTravel), mix(12, artY, imageTravel), progress > 0 && progress < .57);
  placeCursor(entry.textCursor, mix(card.clientWidth - 78, copyX, textTravel), mix(10, copyY, textTravel), progress > .08 && progress < .97);
}

let paused = motion.matches;
let lastScroll = window.scrollY;
let automaticScroll = null;
let autoPosition = lastScroll;
let lastFrame = 0;
let resumeAt = performance.now() + 1800;
let saveTimer;
let touchY = null;

function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - innerHeight);
}

function updateControls() {
  const finished = window.scrollY >= maxScroll() - 1;
  button.hidden = motion.matches;
  note.hidden = motion.matches;
  button.textContent = finished ? "Replay" : paused ? "Resume" : "Pause";
  status.textContent = finished ? "Complete" : paused ? "Paused" : "Auto-scroll active";
}

function setPaused(value) {
  if (motion.matches) return;
  if (paused !== value) {
    paused = value;
    autoPosition = window.scrollY;
    resumeAt = performance.now() + 400;
  }
  updateControls();
}

function saveProgress() {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(cards.map(({card, progress}) => [card.id, progress]))));
  } catch {
    // The in-memory progress still works when browser storage is unavailable.
  }
}

function updatePage(advance) {
  let changed = false;
  for (const entry of cards) {
    if (motion.matches) {
      entry.progress = 1;
    } else if (advance) {
      const bounds = entry.card.getBoundingClientRect();
      const distance = Math.min(innerHeight * .74, bounds.height * 1.04);
      const next = clamp((innerHeight * .91 - bounds.top) / distance);
      if (next > entry.progress) {
        entry.progress = next;
        changed = true;
      }
    }
    renderCard(entry);
  }
  if (changed && !saveTimer) {
    saveTimer = setTimeout(() => {
      saveTimer = null;
      saveProgress();
    }, 250);
  }
  const ratio = maxScroll() ? clamp(window.scrollY / maxScroll()) : 0;
  document.documentElement.style.setProperty("--progress", ratio);
  updateControls();
}

addEventListener("scroll", () => {
  const current = window.scrollY;
  const byPlayback = automaticScroll !== null && Math.abs(current - automaticScroll) <= 1;
  automaticScroll = null;
  const direction = Math.sign(current - lastScroll);
  lastScroll = current;
  if (!byPlayback && direction) {
    autoPosition = current;
    setPaused(direction < 0);
  }
  updatePage(direction > 0);
}, {passive: true});

function handleIntent(direction) {
  if (direction) setPaused(direction < 0);
}

addEventListener("wheel", (event) => {
  if (!event.ctrlKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) handleIntent(event.deltaY);
}, {passive: true});

addEventListener("touchstart", (event) => {
  touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
}, {passive: true});
addEventListener("touchmove", (event) => {
  if (touchY === null || event.touches.length !== 1) return;
  const nextY = event.touches[0].clientY;
  if (Math.abs(nextY - touchY) < 4) return;
  handleIntent(touchY - nextY);
  touchY = nextY;
}, {passive: true});

addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.target.closest?.("button, a, input, textarea, select, [contenteditable]")) return;
  if (["ArrowUp", "PageUp", "Home"].includes(event.key)) handleIntent(-1);
  if (["ArrowDown", "PageDown", "End"].includes(event.key)) handleIntent(1);
  if (event.code === "Space") handleIntent(event.shiftKey ? -1 : 1);
});

button.addEventListener("click", () => {
  if (window.scrollY < maxScroll() - 1) {
    setPaused(!paused);
    return;
  }

  for (const entry of cards) entry.progress = 0;
  saveProgress();
  automaticScroll = 0;
  window.scrollTo(0, 0);
  autoPosition = 0;
  setPaused(false);
  resumeAt = performance.now() + 1800;
  updatePage(false);
});
addEventListener("pagehide", saveProgress);

const symbols = "01<>/{}[]+×∆:;#*_=|$";
const glyphWidth = 21;
let columns = [];
let lastRain = 0;

function sizeRain() {
  if (!context) return;
  const scale = Math.min(devicePixelRatio, 2);
  rain.width = Math.round(innerWidth * scale);
  rain.height = Math.round(innerHeight * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  columns = Array.from({length: Math.ceil(innerWidth / glyphWidth)}, () => ({
    head: Math.random() * (innerHeight + 400) - 250,
    speed: 25 + Math.random() * 76,
    length: 5 + Math.floor(Math.random() * 11),
    seed: Math.floor(Math.random() * symbols.length)
  }));
}

function drawRain(time) {
  if (!context || time - lastRain < 42) return;
  const elapsed = Math.min((time - lastRain) / 1000, .07);
  lastRain = time;
  context.clearRect(0, 0, innerWidth, innerHeight);
  context.font = "13px monospace";
  for (const [index, column] of columns.entries()) {
    if (!motion.matches) column.head += column.speed * elapsed;
    if (column.head > innerHeight + column.length * 21) column.head = -Math.random() * 350;
    const row = Math.floor(column.head / 21);
    for (let offset = 0; offset < column.length; offset++) {
      const y = (row - offset) * 21;
      if (y < 0 || y > innerHeight) continue;
      const alpha = .54 * (1 - offset / column.length) * Math.pow(1 - y / innerHeight, 2.6);
      const symbol = symbols[((row - offset + column.seed + index * 5) % symbols.length + symbols.length) % symbols.length];
      context.fillStyle = `rgba(153, 24, 44, ${alpha})`;
      context.fillText(symbol, index * glyphWidth + 3, y);
    }
  }
}

function frame(now) {
  drawRain(now);
  const elapsed = Math.min((now - lastFrame) / 1000, .05);
  lastFrame = now;
  if (!motion.matches && !paused && now >= resumeAt && window.scrollY < maxScroll() - 1) {
    autoPosition = Math.min(maxScroll(), Math.max(window.scrollY, autoPosition) + 128 * elapsed);
    const next = Math.round(autoPosition);
    if (next > window.scrollY) {
      automaticScroll = next;
      window.scrollTo(0, next);
    }
  }
  requestAnimationFrame(frame);
}

addEventListener("resize", () => {
  sizeRain();
  updatePage(false);
});
motion.addEventListener("change", () => {
  paused = motion.matches;
  updatePage(!paused);
});
sizeRain();
updatePage(true);
requestAnimationFrame(frame);
