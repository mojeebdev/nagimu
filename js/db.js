/* NAGIMU — IndexedDB helpers via idb-keyval */

import { get, set, del } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

const KEYS = {
  playerName: 'nagimu_player_name',
  zodiac: 'nagimu_zodiac',
  allTimeHigh: 'nagimu_all_time_high',
  sessionHigh: 'nagimu_session_high',
  sessionCount: 'nagimu_session_count',
  lastPlayedDate: 'nagimu_last_played_date',
  streak: 'nagimu_streak',
  audioEnabled: 'nagimu_audio_enabled',
};

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}

async function updateStreakOnSessionEnd() {
  const today = dateKey();
  const lastPlayed = await get(KEYS.lastPlayedDate);
  let streak = (await get(KEYS.streak)) ?? 0;

  if (lastPlayed !== today) {
    streak = lastPlayed === yesterdayKey() ? streak + 1 : 1;
    await set(KEYS.streak, streak);
    await set(KEYS.lastPlayedDate, today);
  }

  return streak;
}

export async function getPlayer() {
  const name = await get(KEYS.playerName);
  const zodiac = await get(KEYS.zodiac);
  if (!name || !zodiac) return null;
  return { name, zodiac };
}

export async function setPlayer(name, zodiac) {
  await set(KEYS.playerName, name.slice(0, 18));
  await set(KEYS.zodiac, zodiac);
}

export async function clearPlayer() {
  await del(KEYS.playerName);
  await del(KEYS.zodiac);
}

export async function getAllTimeHigh() {
  return (await get(KEYS.allTimeHigh)) ?? 0;
}

export async function getSessionHigh() {
  return (await get(KEYS.sessionHigh)) ?? 0;
}

export async function getSessionCount() {
  return (await get(KEYS.sessionCount)) ?? 0;
}

export async function getStreak() {
  return (await get(KEYS.streak)) ?? 0;
}

export async function getPersonalStats() {
  return {
    streak: await getStreak(),
    sessionCount: await getSessionCount(),
    allTimeHigh: await getAllTimeHigh(),
    lastSession: await getSessionHigh(),
  };
}

export async function setSessionHigh(score) {
  await set(KEYS.sessionHigh, score);
}

export async function getAudioEnabled() {
  const value = await get(KEYS.audioEnabled);
  return value !== false;
}

export async function saveAudioEnabled(enabled) {
  await set(KEYS.audioEnabled, Boolean(enabled));
}

export async function saveScore(score) {
  await set(KEYS.sessionHigh, score);

  const allTimeHigh = await getAllTimeHigh();
  if (score > allTimeHigh) {
    await set(KEYS.allTimeHigh, score);
  }

  const sessionCount = (await get(KEYS.sessionCount)) ?? 0;
  await set(KEYS.sessionCount, sessionCount + 1);
  await updateStreakOnSessionEnd();

  return score > allTimeHigh ? score : allTimeHigh;
}