/* NAGIMU — game loop, canvas, input, scoring */

import { ZODIACS, applyElementTheme } from './zodiac.js';
import {
  getPlayer,
  getAllTimeHigh,
  getPersonalStats,
  saveScore,
  clearPlayer,
  setSessionHigh,
} from './db.js';
import {
  initAudio,
  isAudioEnabled,
  playConvergence,
  playOrbSpawn,
  playBreathGateStart,
  playSessionEnd,
} from './audio.js';
import { initAudioToggle } from './audio-ui.js';
import { ParticleSystem } from './particles.js';
import { Orb, findNearestOrb, ENTRY_EDGES } from './orb.js';
const ORB_COUNT = 16;
const TOUCH_THRESHOLD = 48;
const CONVERGE_DISTANCE = 22 * 2.5;
const CONVERGE_ANIM_MS = 300;
const REPLACEMENT_DELAY_MS = 600;
const BREATH_GATE_INTERVAL_MS = 90000;
const COMBO_WINDOW_MS = 4000;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const hudGlyph = document.getElementById('hud-glyph');
const hudName = document.getElementById('hud-name');
const hudScore = document.getElementById('hud-score');
const hudHi = document.getElementById('hud-hi');
const hudTime = document.getElementById('hud-time');
const comboIndicator = document.getElementById('combo-indicator');
const endSessionBtn = document.getElementById('end-session-btn');
const resetLink = document.getElementById('reset-link');
const audioToggle = document.getElementById('audio-toggle');
const breathOverlay = document.getElementById('breath-overlay');
const sessionOverlay = document.getElementById('session-overlay');
const sessionGlyph = document.getElementById('session-glyph');
const sessionScore = document.getElementById('session-score');
const sessionHi = document.getElementById('session-hi');
const sessionBadge = document.getElementById('session-badge');
const playAgainBtn = document.getElementById('play-again-btn');
const homeBtn = document.getElementById('home-btn');
const youBtn = document.getElementById('you-btn');
const historyOverlay = document.getElementById('history-overlay');
const historyCloseBtn = document.getElementById('history-close-btn');
const historyGlyph = document.getElementById('history-glyph');
const historyName = document.getElementById('history-name');
const historyStreak = document.getElementById('history-streak');
const historySessions = document.getElementById('history-sessions');
const historyHi = document.getElementById('history-hi');
const historyLast = document.getElementById('history-last');

let playerName = '';
let zodiacSign = '';
let playerElement = '';
let elementColor = '';

let orbs = [];
let particles = new ParticleSystem();
let stars = [];

let currentScore = 0;
let sessionHighScore = 0;
let comboCount = 0;
let comboMultiplier = 1;
let lastConvergenceTime = 0;

let sessionStartTime = 0;
let breathGateAccumulator = 0;
let lastFrameTime = 0;
let breathGateActive = false;
let breathGatePhase = 'idle';
let breathGateStartTime = 0;
let breathPulsePhase = 0;
let velocityScale = 1;
let targetVelocityScale = 1;

let constellationFlash = null;
let activeConvergences = [];
let pendingReplacements = 0;

let selectedOrb = null;
let isPointerDown = false;
let pointerX = 0;
let pointerY = 0;

let gameRunning = false;
let animationId = null;
let previousAllTimeHigh = 0;
let resumeAfterHistory = false;

function resizeCanvas() {
  const shell = canvas.parentElement;
  const hud = document.getElementById('game-hud');
  const bottomBar = document.getElementById('game-bottom');
  const hudH = hud?.offsetHeight ?? 56;
  const bottomH = bottomBar?.offsetHeight ?? 48;
  canvas.width = shell.clientWidth;
  canvas.height = shell.clientHeight - hudH - bottomH;
}

function initStars(count = 120) {
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 0.05 + Math.random() * 0.2,
    radius: 0.2 + Math.random() * 1.2,
    opacity: 0.08 + Math.random() * 0.42,
  }));
}

function drawStars() {
  for (const star of stars) {
    star.x -= star.speed;
    if (star.x < 0) {
      star.x = canvas.width;
      star.y = Math.random() * canvas.height;
    }
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240,238,248,${star.opacity})`;
    ctx.fill();
  }
}

function spawnOrb(entryEdge = null) {
  const orb = new Orb(canvas.width, canvas.height, playerElement, zodiacSign, entryEdge);
  orbs.push(orb);
  if (entryEdge) {
    particles.spawnOrbEntry(orb.x, orb.y, elementColor);
    playOrbSpawn();
  }
}

function maintainOrbCount() {
  while (orbs.filter((o) => o.alive).length < ORB_COUNT) {
    const edge = ENTRY_EDGES[Math.floor(Math.random() * ENTRY_EDGES.length)];
    spawnOrb(edge);
  }
}

function findClusters() {
  const sameElement = orbs.filter((o) => o.alive && !o.converging && o.element === playerElement);
  const n = sameElement.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(i) {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  }

  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (sameElement[i].distanceTo(sameElement[j]) < CONVERGE_DISTANCE) {
        union(i, j);
      }
    }
  }

  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(sameElement[i]);
  }

  return [...groups.values()].filter((g) => g.length >= 3);
}

function scoreForCluster(size) {
  if (size >= 5) return 30;
  if (size === 4) return 20;
  return 10;
}

function triggerConvergence(cluster) {
  const size = cluster.length;
  let cx = 0;
  let cy = 0;
  for (const orb of cluster) {
    cx += orb.x;
    cy += orb.y;
  }
  cx /= size;
  cy /= size;

  const target = { x: cx, y: cy };
  for (const orb of cluster) {
    orb.converging = true;
    orb.convergeTarget = target;
    orb.convergeProgress = 0;
  }

  activeConvergences.push({
    cluster,
    target,
    startTime: performance.now(),
    resolved: false,
    size,
  });
}

function resolveConvergence(conv) {
  const { cluster, target, size } = conv;

  for (const orb of cluster) {
    orb.alive = false;
  }
  orbs = orbs.filter((o) => o.alive);

  particles.spawnBurst(target.x, target.y, size, elementColor);
  playConvergence(playerElement, size);

  const now = Date.now();
  if (now - lastConvergenceTime < COMBO_WINDOW_MS) {
    comboMultiplier = 2;
  } else {
    comboMultiplier = 1;
  }
  lastConvergenceTime = now;
  comboCount += 1;

  const points = scoreForCluster(size) * comboMultiplier;
  currentScore += points;
  sessionHighScore = Math.max(sessionHighScore, currentScore);
  setSessionHigh(sessionHighScore);
  updateHUD();

  if (size >= 5) {
    constellationFlash = {
      startTime: performance.now(),
      duration: 3000,
      sign: zodiacSign,
    };
  }

  pendingReplacements += size;
  setTimeout(() => {
    for (let i = 0; i < size; i++) {
      const edge = ENTRY_EDGES[Math.floor(Math.random() * ENTRY_EDGES.length)];
      spawnOrb(edge);
    }
    pendingReplacements -= size;
  }, REPLACEMENT_DELAY_MS);
}

function updateConvergences(now) {
  for (const conv of activeConvergences) {
    if (conv.resolved) continue;
    if (now - conv.startTime >= CONVERGE_ANIM_MS) {
      conv.resolved = true;
      resolveConvergence(conv);
    }
  }
  activeConvergences = activeConvergences.filter((c) => !c.resolved);
}

function drawConstellation() {
  if (!constellationFlash) return;

  const elapsed = performance.now() - constellationFlash.startTime;
  if (elapsed > constellationFlash.duration) {
    constellationFlash = null;
    return;
  }

  const zodiac = ZODIACS[constellationFlash.sign];
  const dots = zodiac.constellation;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const spreadW = canvas.width * 0.55;
  const spreadH = canvas.height * 0.35;

  let alpha = 1;
  if (elapsed > 2000) {
    alpha = 1 - (elapsed - 2000) / 1000;
  }

  const points = dots.map(([nx, ny]) => ({
    x: cx + (nx - 0.5) * spreadW,
    y: cy + (ny - 0.5) * spreadH,
  }));

  ctx.save();
  ctx.globalAlpha = alpha;

  const hex = elementColor;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  ctx.strokeStyle = `rgba(${r},${g},${b},0.18)`;
  ctx.lineWidth = 0.5;

  for (let i = 0; i < points.length - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();
  }

  for (const pt of points) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},0.5)`;
    ctx.fill();
  }

  ctx.font = "700 12px 'Vend', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(240,238,248,0.28)';
  ctx.fillText(zodiac.name.toUpperCase(), cx, cy - spreadH / 2 - 12);

  ctx.restore();
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function updateHUD() {
  hudScore.textContent = currentScore;

  const liveHi = Math.max(previousAllTimeHigh, sessionHighScore, currentScore);
  hudHi.textContent = `HI ${liveHi}`;
  hudHi.classList.toggle('hud-hi--beat', currentScore > previousAllTimeHigh && currentScore > 0);

  comboIndicator.textContent = comboMultiplier > 1 ? `×${comboMultiplier} combo` : comboCount > 0 ? `${comboCount} merges` : '';
  hudTime.textContent = formatTime(performance.now() - sessionStartTime);
}

function updateBreathGate(now, delta) {
  if (!breathGateActive) {
    breathGateAccumulator += delta;
    if (breathGateAccumulator >= BREATH_GATE_INTERVAL_MS) {
      startBreathGate();
    }
    return;
  }

  const elapsed = now - breathGateStartTime;

  if (breathGatePhase === 'slowdown' && elapsed >= 2000) {
    breathGatePhase = 'active';
    breathOverlay.classList.add('visible');
    playBreathGateStart();
  }

  if (breathGatePhase === 'active' && elapsed >= 8000) {
    endBreathGate();
  }

  if (breathGatePhase === 'slowdown') {
    targetVelocityScale = 0.1;
  } else if (breathGatePhase === 'restore') {
    const restoreElapsed = now - breathGateRestoreStart;
    const t = Math.min(1, restoreElapsed / 1500);
    targetVelocityScale = 0.1 + 0.9 * t;
    if (t >= 1) {
      breathGateActive = false;
      breathGatePhase = 'idle';
      breathGateAccumulator = 0;
      targetVelocityScale = 1;
    }
  }

  velocityScale += (targetVelocityScale - velocityScale) * 0.05;
}

let breathGateRestoreStart = 0;

function startBreathGate() {
  breathGateActive = true;
  breathGatePhase = 'slowdown';
  breathGateStartTime = performance.now();
  targetVelocityScale = 0.1;
}

function endBreathGate() {
  breathOverlay.classList.remove('visible');
  breathGatePhase = 'restore';
  breathGateRestoreStart = performance.now();
}

function skipBreathGate() {
  if (!breathGateActive || breathGatePhase !== 'active') return;
  endBreathGate();
}

function gameLoop(timestamp) {
  if (!gameRunning) return;

  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();

  if (isPointerDown && selectedOrb?.alive) {
    selectedOrb.dragToward(pointerX, pointerY);
  }

  for (const orb of orbs) {
    if (orb.alive) {
      orb.update(canvas.width, canvas.height, orbs, velocityScale);
    }
  }

  if (!breathGateActive || breathGatePhase === 'idle') {
    const clusters = findClusters();
    const activeIds = new Set(activeConvergences.flatMap((c) => c.cluster.map((o) => o)));
    for (const cluster of clusters) {
      if (cluster.some((o) => activeIds.has(o) || o.converging)) continue;
      triggerConvergence(cluster);
    }
  }

  updateConvergences(timestamp);

  for (const orb of orbs) {
    orb.draw(ctx);
  }

  particles.update();
  particles.draw(ctx);
  drawConstellation();

  const delta = lastFrameTime ? timestamp - lastFrameTime : 16;
  lastFrameTime = timestamp;
  updateBreathGate(timestamp, delta);
  updateHUD();

  animationId = requestAnimationFrame(gameLoop);
}

function getCanvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

function onPointerDown(e) {
  if (isAudioEnabled()) {
    void initAudio();
  }
  const point = e.touches ? e.touches[0] : e;
  const coords = getCanvasCoords(point.clientX, point.clientY);
  pointerX = coords.x;
  pointerY = coords.y;
  isPointerDown = true;
  selectedOrb = findNearestOrb(orbs, pointerX, pointerY, TOUCH_THRESHOLD);
  if (selectedOrb) selectedOrb.applyImpulse(pointerX, pointerY);
}

function onPointerMove(e) {
  if (!isPointerDown) return;
  const point = e.touches ? e.touches[0] : e;
  const coords = getCanvasCoords(point.clientX, point.clientY);
  pointerX = coords.x;
  pointerY = coords.y;
}

function onPointerUp() {
  isPointerDown = false;
  selectedOrb = null;
}

function resetSessionState() {
  currentScore = 0;
  sessionHighScore = 0;
  comboCount = 0;
  comboMultiplier = 1;
  lastConvergenceTime = 0;
  breathGateAccumulator = 0;
  lastFrameTime = performance.now();
  breathGateActive = false;
  breathGatePhase = 'idle';
  velocityScale = 1;
  targetVelocityScale = 1;
  constellationFlash = null;
  activeConvergences = [];
  pendingReplacements = 0;
  orbs = [];
  particles = new ParticleSystem();
  sessionStartTime = performance.now();
  breathOverlay.classList.remove('visible');
  sessionOverlay.classList.remove('visible');
  historyOverlay.classList.remove('visible');
  resumeAfterHistory = false;

  for (let i = 0; i < ORB_COUNT; i++) {
    spawnOrb();
  }

  updateHUD();
}

async function populateHistory() {
  const stats = await getPersonalStats();
  historyGlyph.textContent = ZODIACS[zodiacSign].glyph;
  historyName.textContent = playerName;
  historyStreak.textContent = stats.streak;
  historySessions.textContent = stats.sessionCount;
  historyHi.textContent = stats.allTimeHigh;
  historyLast.textContent = stats.lastSession;
}

async function openHistory() {
  await populateHistory();
  resumeAfterHistory = gameRunning;
  if (gameRunning) {
    gameRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
  }
  historyOverlay.classList.add('visible');
}

function closeHistory() {
  historyOverlay.classList.remove('visible');
  if (resumeAfterHistory) {
    resumeAfterHistory = false;
    gameRunning = true;
    animationId = requestAnimationFrame(gameLoop);
  }
}

async function endSession() {
  gameRunning = false;
  if (animationId) cancelAnimationFrame(animationId);
  historyOverlay.classList.remove('visible');
  resumeAfterHistory = false;

  const newAllTime = await saveScore(sessionHighScore);
  const isNewBest = sessionHighScore > previousAllTimeHigh;
  previousAllTimeHigh = newAllTime;

  sessionGlyph.textContent = ZODIACS[zodiacSign].glyph;
  sessionScore.textContent = sessionHighScore;
  sessionHi.textContent = newAllTime;
  sessionBadge.hidden = !isNewBest;
  sessionOverlay.classList.add('visible');

  if (isAudioEnabled()) await initAudio();
  playSessionEnd(sessionHighScore);
}

async function init() {
  const player = await getPlayer();
  if (!player) {
    window.location.replace('/');
    return;
  }

  playerName = player.name;
  zodiacSign = player.zodiac;
  const zodiac = ZODIACS[zodiacSign];
  playerElement = zodiac.element;
  elementColor = zodiac.color;

  applyElementTheme(zodiacSign);
  await initAudioToggle(audioToggle);
  previousAllTimeHigh = await getAllTimeHigh();

  hudGlyph.textContent = zodiac.glyph;
  hudName.textContent = playerName;
  sessionGlyph.textContent = zodiac.glyph;
  hudHi.textContent = `HI ${previousAllTimeHigh}`;
  sessionHi.textContent = previousAllTimeHigh;

  resizeCanvas();
  initStars();
  resetSessionState();

  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('mouseleave', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  canvas.addEventListener('touchmove', onPointerMove, { passive: true });
  canvas.addEventListener('touchend', onPointerUp);

  endSessionBtn.addEventListener('click', endSession);
  youBtn.addEventListener('click', openHistory);
  historyCloseBtn.addEventListener('click', closeHistory);
  breathOverlay.addEventListener('click', skipBreathGate);

  playAgainBtn.addEventListener('click', () => {
    resetSessionState();
    gameRunning = true;
    animationId = requestAnimationFrame(gameLoop);
  });

  homeBtn.addEventListener('click', () => {
    window.location.href = '/?edit=1';
  });

  resetLink.addEventListener('click', async (e) => {
    e.preventDefault();
    await clearPlayer();
    window.location.href = '/';
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    initStars();
  });

  gameRunning = true;
  animationId = requestAnimationFrame(gameLoop);
}

init();