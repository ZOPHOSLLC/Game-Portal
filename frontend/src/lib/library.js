import { useSyncExternalStore } from 'react';
import { api } from './api.js';

// Favorites live on the server (guest cookie or account). Recently played stays in
// this browser. Both are kept in small stores so every component updates together.

const RECENT_KEY = 'gp_recent';
const RECENT_LIMIT = 20;

const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const emit = () => listeners.forEach((listener) => listener());

let favoriteIds = [];

function readRecent() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}
let recentIds = readRecent();

// Called whenever the game list is loaded, so favorites match the server.
export function syncFavorites(games) {
  favoriteIds = games.filter((g) => g.isFavorite).map((g) => String(g.id));
  emit();
}

// Optimistic: the heart changes at once, and goes back if the server refuses.
export async function toggleFavorite(id) {
  const key = String(id);
  const before = favoriteIds;
  const on = !before.includes(key);
  favoriteIds = on ? [...before, key] : before.filter((x) => x !== key);
  emit();
  try {
    await api.setFavorite(key, on);
  } catch {
    favoriteIds = before;
    emit();
  }
}

export function addRecent(id) {
  const key = String(id);
  recentIds = [key, ...recentIds.filter((x) => x !== key)].slice(0, RECENT_LIMIT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds));
  emit();
}

export function useLibrary() {
  const favorites = useSyncExternalStore(subscribe, () => favoriteIds);
  const recent = useSyncExternalStore(subscribe, () => recentIds);
  return { favorites, recent };
}
