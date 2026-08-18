import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { PortfolioContext } from './portfolioStore';
import * as local from '../data/content';

/**
 * One source of truth for portfolio content.
 *
 * Content loads from the API when VITE_API_URL is set; otherwise (or if the
 * request fails) it falls back to the bundled data, so the page always renders.
 */

const LOCAL_CONTENT = {
  stats: local.stats,
  skills: local.skills,
  languages: local.languages,
  experience: local.experience,
  projects: local.projects,
  achievements: local.achievements,
  certifications: local.certifications,
  contacts: local.contacts,
};

const SAVED_KEY = 'lk:saved-projects';

function readSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function PortfolioProvider({ children }) {
  const [content, setContent] = useState(LOCAL_CONTENT);
  // 'local' until a request resolves; 'loading' | 'live' | 'error' after that.
  const [status, setStatus] = useState(api.isConfigured() ? 'loading' : 'local');
  const [error, setError] = useState(null);

  const [saved, setSaved] = useState(readSaved);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');

  useEffect(() => {
    if (!api.isConfigured()) return;
    const controller = new AbortController();

    api
      .getPortfolio({ signal: controller.signal })
      .then((data) => {
        // Merge so a partial API response still leaves the rest intact.
        setContent((prev) => ({ ...prev, ...data }));
        setStatus('live');
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setStatus('error');
        setError(err.message);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch { /* storage full or blocked — saving is a nicety, not a requirement */ }
  }, [saved]);

  const toggleSaved = useCallback((num) => {
    setSaved((list) => (list.includes(num) ? list.filter((n) => n !== num) : [...list, num]));
  }, []);

  const isSaved = useCallback((num) => saved.includes(num), [saved]);

  /** Every tag across all projects, for the filter row. */
  const tags = useMemo(
    () => ['All', ...new Set(content.projects.flatMap((p) => p.tags))],
    [content.projects]
  );

  const visibleProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return content.projects.filter((p) => {
      const matchesTag = activeTag === 'All' || p.tags.includes(activeTag);
      if (!matchesTag) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [content.projects, query, activeTag]);

  const value = useMemo(
    () => ({
      ...content,
      status,
      error,
      isLive: status === 'live',
      query,
      setQuery,
      activeTag,
      setActiveTag,
      tags,
      visibleProjects,
      saved,
      toggleSaved,
      isSaved,
    }),
    [content, status, error, query, activeTag, tags, visibleProjects, saved, toggleSaved, isSaved]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
