import { createContext, useContext } from 'react';

/**
 * The context object and its hook live apart from the provider component so
 * that PortfolioContext.jsx exports components only — otherwise Vite's fast
 * refresh falls back to a full page reload every time that file is edited.
 */
export const PortfolioContext = createContext(null);

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside <PortfolioProvider>.');
  return ctx;
}
