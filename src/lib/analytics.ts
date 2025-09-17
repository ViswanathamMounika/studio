
"use client";

type SearchTerm = {
    term: string;
    count: number;
};

type ViewedDefinition = {
    id: string;
    name: string;
    count: number;
};

const SEARCH_TERMS_KEY = 'analytics_searchedTerms';
const VIEWED_DEFINITIONS_KEY = 'analytics_viewedDefinitions';

const getFromStorage = <T>(key: string): T[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
};

const saveToStorage = <T>(key: string, data: T[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
    }
};

export const trackSearch = (term: string) => {
    if (!term) return;
    const lowerCaseTerm = term.toLowerCase();
    const terms = getFromStorage<SearchTerm>(SEARCH_TERMS_KEY);
    const existingTerm = terms.find(t => t.term === lowerCaseTerm);

    if (existingTerm) {
        existingTerm.count++;
    } else {
        terms.push({ term: lowerCaseTerm, count: 1 });
    }
    saveToStorage(SEARCH_TERMS_KEY, terms);
};

export const trackView = (id: string, name: string) => {
    const views = getFromStorage<ViewedDefinition>(VIEWED_DEFINITIONS_KEY);
    const existingView = views.find(v => v.id === id);

    if (existingView) {
        existingView.count++;
    } else {
        views.push({ id, name, count: 1 });
    }
    saveToStorage(VIEWED_DEFINITIONS_KEY, views);
};

export const getTopSearchedTerms = (limit: number = 10): SearchTerm[] => {
    const terms = getFromStorage<SearchTerm>(SEARCH_TERMS_KEY);
    return terms.sort((a, b) => b.count - a.count).slice(0, limit);
};

export const getMostViewedDefinitions = (limit: number = 10): ViewedDefinition[] => {
    const views = getFromStorage<ViewedDefinition>(VIEWED_DEFINITIONS_KEY);
    return views.sort((a, b) => b.count - a.count).slice(0, limit);
};
