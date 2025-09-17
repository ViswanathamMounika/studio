
"use client";

const isClient = typeof window !== 'undefined';

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (!isClient) return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T) => {
  if (!isClient) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};

type CountData = { [key: string]: number };

// Track Search Queries
export const trackSearch = (query: string) => {
  if (!query) return;
  const searches = getFromStorage<CountData>('analytics_searches', {});
  searches[query.toLowerCase()] = (searches[query.toLowerCase()] || 0) + 1;
  saveToStorage('analytics_searches', searches);
};

// Track Definition Views
export const trackView = (definitionId: string, definitionName: string) => {
  const views = getFromStorage<CountData>('analytics_views', {});
  const key = `${definitionName} (ID: ${definitionId})`;
  views[key] = (views[key] || 0) + 1;
  saveToStorage('analytics_views', views);
};

// Get Top Items
export const getTopItems = (type: 'searches' | 'views', count: number): { name: string, count: number }[] => {
  const data = getFromStorage<CountData>(`analytics_${type}`, {});
  return Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([name, count]) => ({ name, count }));
};

