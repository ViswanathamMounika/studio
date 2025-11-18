
"use client";

import { DateRange } from "react-day-picker";

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

type CountData = { [key: string]: { count: number, date: string } };
type ViewCountData = { [key: string]: { count: number, module: string, date: string, id: string, name: string } };

const isInDateRange = (dateStr: string, range?: DateRange) => {
    if (!range?.from) return true;
    const date = new Date(dateStr);
    const from = new Date(range.from);
    from.setHours(0, 0, 0, 0);
    const to = range.to ? new Date(range.to) : new Date();
    to.setHours(23, 59, 59, 999);
    return date >= from && date <= to;
};

export const trackSearch = (query: string) => {
  if (!query) return;
  const searches = getFromStorage<CountData>('analytics_searches', {});
  const key = query.toLowerCase();
  if (!searches[key]) {
      searches[key] = { count: 0, date: new Date().toISOString() };
  }
  searches[key].count += 1;
  searches[key].date = new Date().toISOString();
  saveToStorage('analytics_searches', searches);
};

export const trackView = (definitionId: string, definitionName: string, module: string) => {
  const views = getFromStorage<ViewCountData>('analytics_views', {});
  const key = definitionId;
  if (!views[key]) {
      views[key] = { count: 0, module: module, date: new Date().toISOString(), id: definitionId, name: definitionName };
  }
  views[key].count += 1;
  views[key].date = new Date().toISOString();
  saveToStorage('analytics_views', views);
};

export const getTopSearches = (count: number, dateRange?: DateRange): { name: string, count: number }[] => {
  const data = getFromStorage<CountData>('analytics_searches', {});
  return Object.entries(data)
    .filter(([, value]) => isInDateRange(value.date, dateRange))
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, count)
    .map(([name, value]) => ({ name, count: value.count }));
};

export const getTopViews = (count: number, dateRange?: DateRange): { name: string, count: number, id: string }[] => {
    const data = getFromStorage<ViewCountData>('analytics_views', {});
    
    return Object.entries(data)
        .filter(([, value]) => isInDateRange(value.date, dateRange))
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, count)
        .map(([, value]) => ({ name: value.name, count: value.count, id: value.id }));
}

export const getRecentViews = (count: number): { name: string, id: string, date: string, module: string }[] => {
    const data = getFromStorage<ViewCountData>('analytics_views', {});

    return Object.values(data)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, count)
        .map(value => ({ name: value.name, id: value.id, date: value.date, module: value.module }));
}
