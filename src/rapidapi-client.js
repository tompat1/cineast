/**
 * RapidAPI Client Module for CINEAST
 * Handles secure API integrations for IMDb236, JustWatch API 2, and Streaming Availability APIs.
 */

const envBase = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_CINEAST_API_BASE : '';
const windowBase = typeof window !== 'undefined' ? window.CINEAST_API_BASE : '';
const API_BASE = String(envBase || windowBase || '').replace(/\/$/, '');

function buildUrl(path) {
  return `${API_BASE}${path}`;
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const init = {
    credentials: 'include',
    ...options,
    headers
  };

  const response = await fetch(buildUrl(path), init);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text().catch(() => '');

  if (!response.ok) {
    const message = payload && typeof payload === 'object'
      ? payload.reason || payload.error || payload.message || 'RapidAPI request failed'
      : (payload || 'RapidAPI request failed');
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

/**
 * Fetch actor filmography & titles from IMDb 236 API
 * @param {string} actorId (e.g. 'nm0000190')
 */
export async function fetchImdbActorTitles(actorId = 'nm0000190') {
  const cleanId = String(actorId).trim();
  return apiFetch(`/api/rapidapi/imdb/cast/${encodeURIComponent(cleanId)}/titles`);
}

/**
 * Fetch streaming platform titles & pricing from JustWatch API 2
 * @param {string} ids (e.g. 'tm42409,ts287292')
 * @param {string} country (default 'US')
 */
export async function fetchJustWatchTitles(ids = 'tm42409,ts287292', country = 'US') {
  const params = new URLSearchParams({
    language: 'en-US',
    ids: ids,
    country: country
  });
  return apiFetch(`/api/rapidapi/justwatch/titles?${params.toString()}`);
}

/**
 * Fetch streaming availability details from Streaming Availability API
 * @param {string} type ('movie' or 'series')
 * @param {string} id (e.g. 'tt9603212')
 */
export async function fetchStreamingAvailability(type = 'movie', id = 'tt9603212') {
  const cleanType = String(type).toLowerCase() === 'series' ? 'series' : 'movie';
  const cleanId = String(id).trim();
  return apiFetch(`/api/rapidapi/streaming/shows/${cleanType}/${encodeURIComponent(cleanId)}`);
}
