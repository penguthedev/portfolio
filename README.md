# Lin Khant — Portfolio

React + Vite front end with an optional Express backend that serves site
content and powers the assistant through the Claude API.

The site runs perfectly well **with no backend at all**. Without one it reads
content from `src/data/content.js` and the assistant answers from a built-in
rule set. The API is an upgrade, not a requirement.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
```

That's it for the front end.

### With the API

```bash
npm run server:install          # installs server/ dependencies
cp server/.env.example server/.env
# add your ANTHROPIC_API_KEY to server/.env
npm run server                  # http://localhost:8787
```

Run `npm run dev` in a second terminal. Vite proxies `/api/*` to the server, so
you do not need to set `VITE_API_URL` in development.

For production, copy `.env.example` to `.env.local` and point `VITE_API_URL` at
your deployed API, then add that site's domain to `ALLOWED_ORIGINS` in
`server/.env`.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run lint` | oxlint |
| `npm run server` | Run the API with file watching |
| `npm run server:install` | Install `server/` dependencies |

---

## Structure

```
src/
  services/
    api.js              fetch wrapper: timeouts, aborts, retries, typed errors
    localAssistant.js   offline reply engine (fallback)
  context/
    portfolioStore.js   context object + usePortfolio() hook
    PortfolioContext.jsx  provider: loads content, saved projects, search state
  hooks/
    scrollStore.js      one shared scroll listener for the whole app
    useEffects.js       reveal, tilt, visibility gating, media queries
  components/
    Chrome.jsx          preloader, cursor, progress bar, nav, divider
    Hero.jsx            title animation + ambient particle canvas
    Sections.jsx        about, experience, projects, achievements, certs, contact
    ChatBot.jsx         assistant panel (lazy-loaded)
    ScrollToTop.jsx     back-to-top control with the LK monogram
    BrandMark.jsx       the LK monogram itself
    ErrorBoundary.jsx   keeps one broken section from blanking the page
  data/content.js       offline content fallback
server/
  index.js              Express app
  portfolio.js          content served by GET /api/portfolio
```

---

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Whether the server is up and the assistant configured |
| `GET /api/portfolio` | Site content, cached 5 minutes |
| `POST /api/chat` | `{ messages: [{role, content}] }` → `{ reply }` |

`/api/chat` is rate limited to 15 requests per minute per IP, trims the
conversation to the last 10 turns, and caps each message at 2000 characters.

**The Claude API key stays on the server.** Calling Anthropic from browser
JavaScript would expose the key to anyone who opens devtools, so the request is
proxied through this process instead.

The default model is `claude-haiku-4-5-20251001` — fast and inexpensive, which
suits short portfolio questions. Set `CLAUDE_MODEL=claude-sonnet-5` in
`server/.env` for longer, more nuanced answers at higher cost.

---

## Failure behaviour

Every network path degrades instead of breaking:

- API unreachable or misconfigured → content falls back to `src/data/content.js`
- Chat request fails → the assistant answers from the local rule set and says so
- A section throws → the error boundary shows a retry, the rest of the page lives
- JavaScript disabled → a note with Lin's email address

---

## Performance notes

The heaviest costs were things running when nothing was on screen:

- **One shared scroll listener.** The nav, progress bar and back-to-top button
  used to attach three separate listeners, each calling `setState` on every
  scroll event. They now subscribe to `scrollStore.js` through
  `useSyncExternalStore` and only re-render when their own derived value
  actually changes — a boolean like "past 500px" flips twice per page, not
  sixty times per second.
- **The particle canvas stops when it is not visible.** It used to animate
  forever, including scrolled far past the hero and in background tabs. Device
  pixel ratio is capped at 1.5, and the twinkle recomputes every fourth frame
  rather than per dot per frame.
- **The custom cursor's animation loop halts once it settles** and restarts on
  the next pointer move, taking idle CPU to zero.
- **Project cards are no longer permanently composited.** `will-change` and
  `preserve-3d` on six cards held GPU memory continuously; tilt now writes CSS
  custom properties and promotes a card only while the pointer is over it.
- **The page mounts underneath the preloader** rather than after it, so layout,
  font decoding and paint happen during the wait instead of in one jolt.
- **The progress bar animates `scaleX`, not `width`** — compositor work rather
  than a full relayout every frame.
- `content-visibility` skips rendering for off-screen sections, the assistant
  ships as its own lazy chunk, React sits in a separate long-cached chunk, and
  the font request dropped from nine weights to five.

---

## Accessibility

Keyboard focus is visible throughout and moves with in-page navigation. The
assistant closes on Escape and returns focus to the button that opened it. The
transcript is a live region, filter results announce their count, and
`prefers-reduced-motion` disables the float, ripple, launch and typing
animations along with smooth scrolling.
