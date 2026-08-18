import { Suspense, lazy, useCallback, useState } from 'react';
import { Preloader, Cursor, ScrollProgress, Nav, Divider } from './components/Chrome';
import Hero from './components/Hero';
import { About, Experience, Projects, Achievements, Certifications, Contact, Footer } from './components/Sections';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import { PortfolioProvider } from './context/PortfolioContext';

/* The assistant is not needed for first paint, so it ships in its own chunk. */
const ChatBot = lazy(() => import('./components/ChatBot'));

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const onDone = useCallback(() => setLoaded(true), []);

  return (
    <PortfolioProvider>
      <Preloader onDone={onDone} />
      <div className="noise" aria-hidden="true" />
      <Cursor />
      <ScrollProgress />
      <Nav />

      {/*
        The page mounts immediately rather than waiting for the preloader to
        finish. The browser gets to lay out, decode fonts and paint during the
        overlay instead of doing all of it in one jolt the moment it lifts.
      */}
      <main className={loaded ? 'is-ready' : 'is-warming'}>
        <ErrorBoundary>
          <Hero />
        </ErrorBoundary>
        <ErrorBoundary>
          <About />
        </ErrorBoundary>
        <Divider />
        <ErrorBoundary>
          <Experience />
        </ErrorBoundary>
        <Divider />
        <ErrorBoundary>
          <Projects />
        </ErrorBoundary>
        <Divider />
        <ErrorBoundary>
          <Achievements />
        </ErrorBoundary>
        <Divider />
        <ErrorBoundary>
          <Certifications />
        </ErrorBoundary>
        <ErrorBoundary>
          <Contact />
        </ErrorBoundary>
      </main>

      <Footer />

      {/* Floating controls, bottom-left: assistant on top, back-to-top beneath. */}
      {loaded && (
        <div className="fab-rail">
          <ScrollToTop />
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <ChatBot />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
    </PortfolioProvider>
  );
}
