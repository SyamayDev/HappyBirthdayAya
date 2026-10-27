# CLAUDE.md — Happy Birthday Aya

> **Project mandate:** Transform this repository into a polished, emotionally memorable, mobile-first birthday experience for Aya. Rebuild the application with **React + Vite + JavaScript**, replace the existing pink visual identity with a sophisticated **pastel sky-blue / powder-blue / periwinkle** design, preserve the meaningful personal content and original assets, fix existing defects, verify the result, and leave the repository with a genuinely useful README.
>
> **Do the work, not just the plan.** Audit first, then implement, test, fix, and document. Do not stop after presenting a proposal or a checklist.

---

## 1. Your role and definition of success

Act as a senior frontend engineer, creative director, interaction designer, accessibility specialist, performance engineer, QA engineer, and technical writer working together.

The goal is not to add random effects or make every section move. The goal is a coherent, personal, beautiful, dependable experience that feels crafted specifically for Aya: delightful on a phone, elegant on a large screen, easy to use, emotionally warm, and technically maintainable.

A successful delivery must satisfy all of the following:

1. The app runs on **React + Vite + JavaScript**. Do not choose TypeScript unless the repository owner explicitly requests it later.
2. The visual identity is clearly blue—not pink—with a soft, feminine, dreamy, polished character.
3. Existing messages, photos, music, animations, and the photo-puzzle experience are audited and intentionally preserved, reworked, or replaced. Do not silently discard personal content.
4. Existing bugs and fragile behavior are investigated and fixed, not covered up with cosmetic changes.
5. Every visible control has a meaningful, tested behavior. No dead buttons, fake toggles, broken links, or decorative controls that look interactive but do nothing.
6. Motion, audio, loading, errors, keyboard use, reduced-motion preferences, and small screens are all treated as first-class product concerns.
7. The production build completes successfully. Relevant checks are executed and their results are honestly reported.
8. `README.md` documents the **actual final implementation**, not an aspirational feature list. Update it after implementation and verification.
9. The final report explains major changes, key files, tests run, build result, and any remaining limitation.

Do not promise perfection or invent performance, accessibility, test, or browser-compatibility results. Aim for exceptionally high quality and prove it through checks.

## 2. Repository context and initial audit requirements

The publicly visible repository currently appears to contain a root `index.html`, `backsound.mp3`, and these folders:

- `Galaxy-love-main/`
- `cake-blow-main/`
- `card-animation/`
- `envelope-modal/`
- `heart-animation-main/`
- `heart-trail-animation-main/`
- `puzzle-together-photos/`

The current root page appears to contain a large amount of inline HTML, CSS, and JavaScript. The visible implementation includes a pink/red gradient, a photo carousel with paths such as `Galaxy-love-main/images/img1.jpg`, a book-opening interaction, a letter/message for Aya, a link into the photo puzzle, a heart-animation loop, a local audio element or music logic, and an embedded YouTube player for background music. The carousel's visible list uses images numbered 1–5 and 7–11; verify the actual files rather than assuming `img6` exists or is missing.

The current code also appears to request **microphone access** before starting music, use `getUserMedia({ audio: true })`, persist background-music playback time in `localStorage`, and automatically resume local audio when the tab becomes visible. These are high-priority audit points. A music player should not need microphone access. Browsers also restrict autoplay, and audio playback can reject its promise.

These notes are starting hypotheses based on the public root page, **not a substitute for inspecting the checked-out files**. The local repository is the source of truth. Start by inspecting all files and assets, including nested HTML/CSS/JS, images, font references, media files, and existing scripts. Record what is actually there before deciding what to migrate.

### Required audit steps

1. Inspect `git status`, current branch, root directory, and all nested files. Do not overwrite uncommitted user work.
2. Inspect every existing HTML page and its connected CSS/JavaScript. Identify external dependencies, duplicated logic, inline event handlers, fixed paths, and interactions.
3. Inspect asset dimensions and filenames. Produce a reliable inventory of all photos, music, animations, illustrations, and referenced files. Find broken/missing links before migrating.
4. Run the current app where possible, examine the actual browser experience, and collect console/network errors before changing it.
5. Search all source files for event handlers, `getUserMedia`, `requestAnimationFrame`, `setInterval`, `setTimeout`, `localStorage`, `audio.play`, YouTube API use, and direct navigation to nested HTML pages.
6. Identify which existing features are complete, fragile, broken, duplicated, or not worth preserving. Retain the personal story even if its implementation changes.
7. Establish a short, prioritized issue list, then immediately start implementation. Do not ask the user to approve routine technical choices.
8. Never delete legacy asset folders until every needed file is migrated or intentionally referenced from the new app and verified.

## 3. Creative direction: “A little universe in the sky”

### Overall feeling

The website should feel like opening a delicate birthday gift inside a dreamy sky: pale blue skies, soft clouds, tiny stars, ribbon/bow details, translucent layers, elegant paper textures, gentle sparkles, a sentimental photo journal, and purposeful reveal moments. It should feel feminine and cute without becoming childish, cluttered, or generic.

Think **editorial scrapbook meets premium digital keepsake**. Use generous whitespace, an intentional typographic hierarchy, a few memorable visual motifs, tactile interactions, and high-quality transitions. Avoid a pile of unrelated animations or a generic landing-page template.

### Color system

Create central design tokens using CSS custom properties. Suggested starting palette (adjust after viewing the assets and checking contrast):

```css
:root {
  --color-sky-50: #f6fbff;
  --color-sky-100: #eaf5ff;
  --color-sky-200: #d5eaff;
  --color-sky-300: #b8dcff;
  --color-sky-400: #8fc5ff;
  --color-sky-500: #68adf5;
  --color-blue-600: #3b82d9;
  --color-blue-700: #285f9f;
  --color-ink: #213b59;
  --color-muted: #647b96;
  --color-white: #ffffff;
  --color-lilac: #dcdcff;
  --color-cloud: rgba(255, 255, 255, 0.72);
  --color-line: rgba(65, 123, 180, 0.16);
}
```

Rules:

- Blue is the primary identity. Remove the legacy hot-pink/red gradient and pink-dominant components.
- Lilac, pearl white, and a very small hint of butter yellow may be supporting accents; they must not compete with blue.
- Avoid low-contrast pale text on pale backgrounds. Body text and interactive labels must remain comfortably readable.
- Use gradients intentionally and sparingly. Build depth with layered blues, soft shadows, borders, and light—not by adding blur everywhere.
- Centralize color, radius, spacing, shadow, and motion tokens instead of scattering unexplained values across CSS.
- Do not use emoji as a substitute for every icon. Use a consistent icon system (for example, `lucide-react`) or bespoke CSS/SVG decorations.

### Typography

Choose at most two complementary font families: one expressive display face for the birthday headline or sentimental headings, and one highly readable sans-serif for body copy and controls. Prefer a reliable, legible setup; provide good system-font fallbacks and avoid a flash of invisible text. If using a remote font service, keep the page functional when it fails to load and document the dependency.

### Visual craft requirements

- Create a clear visual hierarchy and a memorable opening screen.
- Use a responsive layout grid, consistent spacing, intentional alignment, and carefully tuned line lengths.
- Make photos feel curated: consistent framing, subtle borders, soft depth, considered cropping, and a proper full-size viewer where appropriate.
- Use decorative clouds, ribbons, sparkles, tiny stars, or floating paper only when they reinforce the concept and do not obscure content.
- Use a restrained glass effect. Ensure content remains readable when transparency is used.
- Include hover, focus-visible, active, loading, disabled, empty, and error states where relevant.
- Do not use placeholder images from random URLs or replace Aya's real photos with generic stock imagery.
- Do not create fake reviews, fake statistics, fake guest messages, or invented relationship history.

## 4. Experience and narrative structure

Treat the site as a small, guided experience, not a disconnected stack of widgets. Use the existing content and actual assets to establish the final order, then refine it. A suggested sequence is below; adapt it if the existing story makes a better sequence obvious.

### A. Opening / invitation

- Full-screen or near-full-screen sky-blue opening composition.
- A clear, warm greeting and a prominent action such as **“Buka kejutan”** or **“Mulai perjalanan”**.
- Gentle atmospheric motion, a ribbon/seal, cloudscape, or star motif.
- The primary action should reveal the experience reliably on touch, keyboard, and mouse.
- Avoid forcing an unnecessary password, permission prompt, or long intro animation. If a gate is retained, it must be purposeful, accessible, and easy to exit.

### B. Main birthday hero

- A visually distinct birthday greeting for Aya.
- Display headline typography, tasteful decorative details, and one clear next action.
- Keep the core message visible even if animation libraries fail or motion is reduced.
- No critical text should be rendered only inside canvas/WebGL.

### C. Memory/photo experience

- Migrate the existing photo collection intentionally.
- Use meaningful alt text wherever the subject/context is known; otherwise use a neutral, truthful description rather than `alt="photo"` everywhere.
- Make previous/next actions available to keyboard and touch users.
- Provide accessible labels, visible focus styles, sensible touch targets, and an appropriate current-photo indicator.
- If implementing swipe gestures, keep arrow/button controls too and avoid interfering with page scrolling.
- Prevent layout shift by setting image dimensions or aspect ratios. Use responsive image sizing and lazy-load images that are below the fold.
- Provide a modal/lightbox only if it improves the experience; when open, manage focus, Escape-to-close, backdrop dismissal, and scroll locking carefully.
- Broken photos must not collapse the layout. Provide a graceful fallback and log/report the issue during development.

### D. Interactive letter / envelope

- Preserve the heartfelt Indonesian copy and the sender's sign-off unless there is an obvious typo that can be corrected without changing the meaning.
- Create a beautifully animated envelope, letter, or paper reveal that feels tactile but does not block the page or trap focus.
- The open/close action must work consistently and communicate state to assistive technology.
- When the letter is open, use a readable line length, generous line height, and responsive spacing.

### E. Birthday cake / candle moment

- Audit the existing cake assets before making a new animation.
- If the cake sequence exists, preserve its intent and make it smoother and more reliable; if it is broken, rebuild it with a robust CSS/SVG/React implementation.
- If candles can be blown out or interacted with, also provide a clear click/tap/keyboard alternative. Do not depend on microphone access or voice recognition.
- A celebratory confetti burst can happen after a meaningful user action, not continuously.
- Provide an easy replay/reset action if the sequence is finite.

### F. Photo puzzle / gift

- Audit all files in `puzzle-together-photos/` and learn the existing rules and completion behavior before migrating.
- Move the puzzle flow into React components when it is part of the same experience. Do not leave a fragile relative link to a separate static page merely because it is easier.
- Preserve source images and any custom puzzle artwork.
- Ensure the puzzle works with touch as well as mouse and does not require precision dragging alone. If a drag interaction is used, add accessible and touch-friendly alternatives where feasible.
- Make success, retry, reset, and completion states obvious. Avoid losing state unexpectedly during a normal interaction.
- If a full puzzle would take disproportionate time or is too broken to preserve, first build a small but complete reliable puzzle, then report what has been retained.

### G. Closing moment

- Finish with a deliberate, warm closing message and a clear option to revisit the memories or replay selected moments.
- Avoid abruptly dropping the user back to the top or leaving the final screen without a next action.
- Ensure the experience still feels complete if audio is unavailable or a nonessential animation fails.

### Navigation and progress

- The user should always understand where they are and what they can do next.
- If the sequence has multiple chapters, use subtle progress markers, a chapter index, or clear section transitions.
- Do not force an overly long intro. Include skip/reduced-motion behavior for long animations.
- Support ordinary scrolling and respect the browser's Back button where applicable.

## 5. React architecture and implementation constraints

Use **React + Vite + JavaScript** as the foundation. Make a clean, modern, reasonably small architecture; do not build an enterprise system for a personal birthday microsite.

### Suggested architecture

Adapt this to the actual project, and update the final README to match the real tree:

```text
HappyBirthdayAya/
├── public/
│   ├── assets/
│   │   ├── photos/
│   │   ├── audio/
│   │   └── illustrations/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── AudioPlayer.jsx
│   │   ├── BirthdayCake.jsx
│   │   ├── ConfettiCelebration.jsx
│   │   ├── EnvelopeLetter.jsx
│   │   ├── MemoryGallery.jsx
│   │   ├── PhotoPuzzle.jsx
│   │   ├── SectionProgress.jsx
│   │   └── SkyDecorations.jsx
│   ├── data/
│   │   └── birthdayContent.js
│   ├── hooks/
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── globals.css
│   │   └── motion.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── CLAUDE.md
```

This is a reference, not a requirement to create empty files or over-split components. Each component must have a clear reason to exist.

### Engineering rules

- Inspect the current state and preserve uncommitted changes. Do not blindly run a scaffold command that overwrites `index.html`, assets, or user files.
- If there is no usable React project, initialize Vite in a safe way and migrate into it deliberately.
- Keep `App.jsx` readable. Split UI into components based on meaningful responsibilities, not every single `<div>`.
- Keep copy, image lists, labels, and configuration in a central data module where that improves maintainability.
- Use semantic HTML and normal React event handlers. Remove inline HTML handlers such as `onclick="..."` as part of the migration.
- Avoid direct DOM mutation for UI that React should own (`document.createElement`, manual class toggles, writing inline styles, etc.). Use state, refs, and effects deliberately.
- Every effect must have appropriate cleanup for event listeners, animation frames, observers, audio listeners, timers, and external instances.
- Avoid global event handlers and global mutable variables. Use component state, refs, and context only when the state genuinely needs to be shared.
- Do not introduce a backend, database, login system, or environment secrets for a static birthday page unless an existing feature truly requires it.
- Do not add a dependency solely because it is fashionable. Prefer CSS, SVG, and the platform for small effects.
- Use a single, consistent animation approach. A React animation library can be used for coordinated entrances and layout changes; native CSS is appropriate for small decorative loops. Verify current APIs in documentation if using unfamiliar packages.
- Keep packages and package scripts consistent. Do not leave unused libraries, duplicate animation engines, or dead examples in production.
- Use `import` paths and file-name casing that work on Linux deployment, not only on a case-insensitive local filesystem.
- Avoid `dangerouslySetInnerHTML` for ordinary text.
- Do not claim an API, icon, package script, or route exists until it has been checked in the local project.

### Asset migration

- Preserve original files in the repository until all usage is verified.
- Prefer moving/copying assets into a clearly named public asset directory only when that improves maintainability and does not break import semantics.
- Create an explicit mapping from old asset paths to new paths.
- Check every path used by the new app. Verify image requests and audio requests in the browser/network panel or via automated checks.
- Keep original filenames when helpful, but improve names if needed and update every reference.
- If files include licensed/copyrighted artwork, fonts, or music, do not invent a license. Document known provenance only when it is known.
- Avoid embedding large base64 images directly in JS or CSS.

## 6. Audio: fix the existing permission and autoplay problems

This section is mandatory because the existing public source appears to request microphone access as part of starting background music.

### Required behavior

- **Never request microphone access just to play music.** Remove the `navigator.mediaDevices.getUserMedia({ audio: true })` flow unless there is a genuinely necessary, separately explained microphone feature approved by the owner. The birthday experience does not need microphone access merely to start a song.
- Provide a visible music button such as “Putar musik” / “Jeda musik” and make the user's action the audio-start gesture.
- Prefer the existing local `backsound.mp3` if it is the intended music and loads correctly. Inspect the existing audio and decide whether the embedded YouTube player is still needed. Avoid playing local audio and an embedded player simultaneously.
- If the intended track exists only in YouTube, do not assume it will always load. Handle player-ready, player-error, blocked playback, and unavailable network states. Avoid introducing a new external dependency if the local track is sufficient.
- Do not autoplay sound before an intentional user gesture. Browsers may block it.
- Use `audio.play()` with `await`/`.catch()` or equivalent robust handling. A rejected play promise should not produce an unhandled console error or a false “playing” state.
- The play/pause UI must reflect the real media state, including `play`, `pause`, `ended`, and error events.
- Do not automatically resume a song after the user intentionally paused it. `visibilitychange` should not override the user's choice. If visibility-based pause/resume is retained, model the user's intended playback state and handle promises/errors correctly.
- Validate values restored from `localStorage`. If a saved time is invalid, negative, infinite, or beyond the media duration, fall back safely. Do not let a stale value break playback.
- Persist only what improves the experience and works reliably. Do not save time on every tick unless there is a concrete reason. If saved, throttle writes and guard storage access.
- When unmounting, clean up listeners and stop timers. Avoid duplicate event listeners after re-renders.
- Respect reduced-motion preferences and provide a low-motion experience that still supports the central birthday story.
- If playback is unavailable, the site must remain complete and usable without music.

## 7. Animation and performance standards

The site can feel magical without sacrificing smoothness or usability.

- Prefer `transform` and `opacity` for recurring visual motion. Avoid continuously updating `left`, `top`, `width`, or `height` for dozens of floating objects because these can cause layout work every frame.
- Audit the existing animation loop that creates a large number of hearts. Reduce the amount if it distracts or burdens weaker devices; use CSS transforms or a light, throttled animation system instead of unnecessary per-frame layout changes.
- Use `requestAnimationFrame` only when it is genuinely needed, and cancel it when the component is removed or the page becomes inactive.
- Avoid stacking multiple libraries that each animate the same element.
- Limit continuous particles; trigger bursts at meaningful moments. Decorative effects should not obscure text, eat clicks, or cover focus indicators.
- Give decorative layers `pointer-events: none` and an appropriate stacking context when they should not be interactive.
- Respect `prefers-reduced-motion: reduce`. Disable or simplify floating particles, parallax, auto-scrolling, large zooms, and long entrance sequences.
- Respect `prefers-reduced-motion` even if an animation library is used; verify the actual behavior.
- Avoid animating full-screen blur, giant shadows, and expensive filters on every frame.
- Keep interaction responsive on ordinary phones. Do not require WebGL, a large 3D engine, or a high-powered GPU for the basic experience. Use real 3D only if existing assets and the design justify it, and provide a graceful fallback.
- Avoid layout shifts: reserve image/section dimensions and avoid showing content only after long animations.
- Use lazy loading for below-the-fold imagery, but do not lazy-load the main above-the-fold hero image if that delays the primary visual.
- Bundle size matters. Inspect the build output and remove unnecessary packages or oversized imports where feasible.

## 8. Responsive design, accessibility, and input methods

The target experience must work on compact phones, modern phones, tablets, laptops, and large desktop displays.

### Responsive QA sizes

Manually or automatically inspect at least these viewport widths where tooling permits:

- 320 px
- 360–390 px
- 768 px
- 1024 px
- 1440 px or wider

Verify there is no unwanted horizontal scrolling, text clipping, hidden controls, awkward image cropping, or modal overflow. Do not merely shrink desktop CSS; compose the layout intentionally for mobile.

### Accessibility requirements

- Use semantic headings in a logical order, landmarks, `<button>` for actions, and links for navigation.
- Every icon-only button requires an accessible name. Use `aria-label` where the visible label is insufficient.
- All major actions must be reachable and operable by keyboard. Preserve visible `:focus-visible` indicators.
- Do not communicate state through color alone. Include text, an icon, or an accessible status label as appropriate.
- Respect contrast. Normal text should target WCAG AA contrast (4.5:1); large text and essential UI components should meet the relevant contrast guidance.
- Support `prefers-reduced-motion` and do not autoplay sound.
- Avoid flashing effects, rapid strobing, and high-frequency visual changes.
- Make interactive targets comfortably tappable (aim for around 44 × 44 CSS px where possible).
- Ensure modal dialogs have an accessible name, appropriate focus handling, Escape behavior, and no permanent focus trap after they close.
- Give images useful alt text. Decorative images should use empty alt text or be hidden from assistive technologies.
- Use an accessible status area for important asynchronous feedback when appropriate; do not announce every decorative animation.
- Form controls, if any, need labels and clear validation. Do not add a data collection form unless the experience actually needs it.
- Keep the experience understandable if animations, custom fonts, and audio are disabled.

## 9. Functional quality: no broken or fake interactions

Create and maintain a functional acceptance checklist covering all visible interactions. At a minimum test:

- The opening action starts the experience exactly once and cannot leave the page stuck behind an invisible overlay.
- The envelope can open and close predictably, including on a phone.
- The carousel can move forward and backward, wraps or stops consistently, and displays the correct image.
- The book/letter opens and does not accidentally toggle due to event bubbling.
- Any photo viewer can close with Escape, and focus/scroll behavior is restored.
- The photo puzzle starts, accepts valid actions, handles invalid actions, shows completion, and can reset.
- Any candle/cake interaction can be completed with touch and keyboard—not only microphone or hover.
- Music can start, pause, resume, and recover from a failed load without breaking the app.
- Navigation and section links point to real destinations.
- A browser refresh does not produce a blank screen or broken asset paths.
- No action depends on an undocumented browser permission.
- Buttons disable or ignore repeat activation when necessary (for example, preventing duplicate celebration sequences).
- A missing image, blocked audio, external font failure, or offline network does not collapse the whole experience.

Prevent event bubbling from triggering two contradictory actions. Use refs and effect cleanup only where needed. Do not use fixed sleeps as a substitute for state synchronization. If a sequence depends on animation completion, account for reduced motion and missing animation support.

## 10. Error handling and defensive coding

- Guard DOM/API access that can genuinely be unavailable; do not bury structural bugs behind hundreds of optional chains.
- Handle media load/play errors and missing assets with a friendly fallback.
- Treat external services as optional unless central to a feature.
- Avoid blocking `alert()` popups for normal interaction errors. Use inline feedback or a small accessible status message.
- Validate storage reads and writes because storage may be unavailable in private browsing or constrained contexts.
- Do not silently swallow errors. Log actionable details in development and present appropriate user-facing feedback in production.
- Clean up event listeners, animation frames, observers, timers, and media instances.
- Ensure React rendering has no serious warnings about missing keys, invalid DOM properties, or state updates after unmount.
- If an error boundary is valuable, add a concise fallback screen with an option to reload or return to the beginning.

## 11. SEO, sharing, and deployment

This is a personal website, so prioritize good browser behavior and shareability without overengineering it.

- Set a meaningful document title, Indonesian language metadata, UTF-8, viewport meta, description, theme color, and a custom favicon if feasible.
- Add Open Graph and social preview metadata only when the image and URLs are real and available. Do not invent a deployed URL or preview path.
- Keep content usable if JavaScript fails as far as practical, and make sure the built app's entry point is valid.
- Ensure asset paths work on the intended Vercel deployment. Verify routing and Vite's `base` behavior before claiming that GitHub Pages also works.
- Do not add secrets to the repository. This project should not need `.env` by default.
- Do not add analytics, tracking pixels, or external form submissions without explicit need and owner approval.
- If any remote fonts or embeds are retained, identify them honestly and provide graceful fallback behavior.
- Document deployment setup in the README only after checking the real Vite config and actual deployment assumptions.

## 12. Testing and verification workflow

Use the package manager already established in the repository when possible. Check for a lockfile before choosing a package manager. Never maintain multiple competing lockfiles accidentally.

### Minimum validation

1. Run dependency installation using the matching lockfile and package manager, when needed.
2. Run the development server and examine the site.
3. Run available linting and tests. If none exist, add a proportionate setup for core interactions rather than leaving the project untested.
4. Run the production build.
5. Fix errors and warnings that indicate broken functionality or maintainability issues.
6. Verify asset references and direct routes/refresh behavior.
7. Check console errors and failed network requests.
8. Check the key responsive widths and reduced-motion behavior.
9. Update README commands to exactly match `package.json` scripts.

### Recommended proportionate tooling

- Vite for development and production builds.
- Vitest plus React Testing Library for stateful UI behavior and core user journeys if appropriate for the available setup.
- Playwright for browser-level smoke tests when a browser/runtime is available and setup remains proportionate.
- ESLint or the repo's existing linter when configured appropriately.

Do not add these tools blindly if they make the project brittle. Verify that the tests can actually run and that the scripts work. Do not report a test as passing unless it was executed and passed.

### Suggested test cases

- Main page renders and primary CTA works.
- Music toggle handles the blocked-playback path without throwing.
- Carousel changes the active photo and maintains a valid active index.
- Letter/envelope open and close state is correct.
- Puzzle completion/reset behavior works.
- Reduced-motion mode suppresses nonessential motion.
- Build succeeds and local asset URLs resolve.

## 13. README.md requirements: polished and trustworthy documentation

Replace the current README with documentation that is visually clear, personal, and useful to another developer. The README should read like a deliberate open-source project page, not a wall of marketing claims.

Include, as applicable:

1. A warm, concise title and one-line description.
2. A screenshot or preview image created from the actual final implementation. Do not link to a screenshot that does not exist. If no screenshot can be generated, leave a clearly marked TODO comment for the maintainer instead of a broken image link.
3. Brief feature overview limited to features that really work.
4. Technology stack with only confirmed packages/tools.
5. Requirements (Node version should match Vite/package engine requirements, not a guess).
6. Installation and run instructions.
7. Exact verified command reference for dev, lint, test, build, and preview scripts that exist.
8. Accurate directory structure, updated to the actual final tree.
9. A simple guide to customizing Aya's content, photo order, audio, and theme tokens.
10. Notes on autoplay restrictions and how to start/pause music without requesting microphone permission.
11. Deployment instructions for the real target, including build command and output directory when verified.
12. Accessibility, reduced-motion, and performance notes based on actual behavior.
13. Troubleshooting for missing images, audio that won't start, and build/deploy issues.
14. Asset attribution and copyright/usage notes where known. Do not invent a license or attribute assets without evidence.
15. A respectful privacy note: content shipped as public static assets may be viewable/downloadable by anyone who has access to the deployment. Do not describe the page as private or secure merely because it is a personal surprise.
16. A small credits/thank-you section that does not invent contributors.

Use beautiful but restrained Markdown: a few relevant emoji are fine, headings should be scannable, code blocks should be copy-pasteable, and badges should only be included if their targets and status are real. No fake build badges, fake test results, fake Lighthouse scores, or invented live demo links.

## 14. Suggested implementation phases

Follow these phases in sequence, but continue without waiting for the user between phases unless an unavoidable blocker appears.

### Phase 1 — Discovery

- Inspect all files and current behavior.
- Make a list of content/assets/features to preserve.
- Identify confirmed bugs and risks.
- Check current scripts, dependency setup, deployment target, and git status.

### Phase 2 — Foundation

- Set up React + Vite + JavaScript safely.
- Establish design tokens, resets, typography, reusable layout primitives, and reduced-motion handling.
- Ensure the app boots before building all sections.

### Phase 3 — Core experience

- Build the hero/opening and guided narrative.
- Migrate the photo gallery, letter/envelope, cake interaction, audio control, and photo puzzle.
- Preserve or improve meaningful content and visual assets.

### Phase 4 — Polish

- Tune responsive layouts, micro-interactions, focus styles, transitions, loading states, empty states, and reduced-motion behavior.
- Remove any leftover pink-dominant styling and duplicated/legacy handlers.
- Confirm that effects and event listeners clean up correctly.

### Phase 5 — QA and repair

- Run tests, lint (when configured), build, and browser smoke checks.
- Inspect console/network errors and broken paths.
- Test small-screen layout, touch interactions, keyboard use, audio error paths, and reduced motion.
- Fix discovered issues and re-run the relevant checks.

### Phase 6 — Documentation

- Write the README from the implemented application, not from this specification alone.
- Verify every command, file path, feature statement, and deployment instruction in the README.
- Remove TODOs that have been resolved. Leave only real, clearly explained limitations.

## 15. Scope control: add “wow” with intention

Do not interpret “best birthday website” as permission to add every possible dependency or every gimmick. Prefer a few exceptional moments over many average effects.

Prioritize in this order:

1. Emotional clarity and personal content.
2. Visual design and art direction.
3. Reliable main interactions.
4. Mobile responsiveness and accessibility.
5. Smooth, tasteful animations.
6. Performance and resilience.
7. Maintainable code and honest documentation.

Potential enhancements are welcome when they fit the story: chapter transitions, subtle parallax, floating cloud layers, an animated gift seal, a photo-book feel, an interactive cake, one carefully timed confetti moment, or a clear journey progress indicator. Do not add a feature if its implementation compromises the core journey or introduces significant fragility.

Avoid adding user accounts, databases, real-time chat, notifications, AI endpoints, or data collection. They are unrelated to the core gift unless the existing code contains a genuine reason to keep one.

## 16. Git and change safety

- Do not reset, force-push, rewrite history, or discard uncommitted work.
- Do not commit or push unless explicitly asked.
- Do not delete the original pages/assets until the React replacement has been verified and the migration map is complete.
- Avoid broad destructive scripts and mass renames without checking references.
- Keep changes focused on this website. Do not edit unrelated repositories or global system configuration.
- If an operation could overwrite content, make a safe copy or use a non-destructive approach first.

## 17. Final response format

When finished, respond in Indonesian with:

1. **Yang berubah:** the major visual, interaction, and architecture improvements.
2. **Bug yang diperbaiki:** only bugs that were actually found and fixed.
3. **Validasi:** exact commands run and their real outcomes (build/test/lint/manual checks).
4. **File penting:** where the main React app, data/config, assets, and styles live.
5. **README:** confirm it has been checked against the real implementation.
6. **Known limitations:** short and explicit list, or say none were found during the checks performed—but do not imply exhaustive testing if it did not occur.

If a check could not be run because the runtime/tooling was unavailable, say so and give the exact command the maintainer should run. Never claim the website is deployed unless deployment was actually performed and verified.

---

## Final directive

Start by inspecting the actual repository state and full asset tree. Then rebuild and improve the site end-to-end using **React + Vite + JavaScript**, establish the pastel-blue design system, retain Aya's real memories and message, remove the unnecessary microphone permission flow, make every interaction reliable and accessible, run the available checks, repair failures, and write a precise README. **Do not stop after analysis, do not return only recommendations, and do not leave the project in a half-migrated state.**

---

## 18. Current implementation — read this before changing anything

> This section was written after the React rebuild was completed and verified (October 2026). Sections 1–17 above remain the product specification; this section describes the code that actually exists. Keep it accurate when you change the project.

### Commands (exactly as in `package.json`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` / `npm run preview` | Production build to `dist/` / serve it |
| `npm run lint` | ESLint flat config (`legacy/`, `dist/`, `docs/` ignored) |
| `npm test` / `npm run test:watch` | Vitest + Testing Library (jsdom) |
| `npm run test:e2e` | Playwright against `build` + `preview` (mobile 390 px + desktop 1440 px); uses installed Chrome if found, else `npx playwright install chromium` |
| `npm run shots` | Screenshots + quick browser QA (console errors, failed requests, broken images, horizontal overflow); needs `npm run dev` running. `--harness=<chapter>` / `--click="Name A;Name B"` / `--reduced` / `--widths=…` |
| `npm run check` | lint → test → build |

Last verified: lint clean · 72 unit tests (11 files) · 10 Playwright tests · build OK. Node `^20.19.0 || >=22.12.0`, npm (only `package-lock.json`).

### Architecture

- `src/data/content.js` is the **single source of truth** for all copy, photos, audio and config. Strings marked `// verbatim` come from the legacy site and must not be paraphrased. Known owner decision pending: `letter.greeting` reads "Hai Sayaang Ayil," (sender's own name), kept verbatim on purpose.
- `src/App.jsx` composes chapters in order: `OpeningGate` (overlay) → `Hero#pembuka` → `MemoryCarousel#kenangan` → `LetterBook#surat` → `PhotoPuzzle#hadiah` → `BirthdayCake#kue` → `GalaxyFinale#bintang`, plus `SkyBackdrop`, `Dock`, `SparkleTrail`. Chapters take no props. Each chapter is wrapped in an `ErrorBoundary`; puzzle/cake/finale are keyed by `resetCount` so "Putar ulang dari awal" remounts them.
- Context (`src/context/`, all bundled in `AppProviders`): `Journey` (started flag + persisted milestones `puzzleSolved/candlesOut/finaleUnlocked` + `STORAGE_KEYS`), `Music` (renders the single `<audio>`; status `idle|loading|playing|paused|blocked|unavailable`), `MotionPreference` (system setting + "Animasi hemat" override → `<MotionConfig>` and `<html data-motion>`), `Announcer` (one polite live region).
- `src/lib/`: `navigation.goToChapter(id)` (pushes `#hash`, scrolls, focuses `[data-chapter-heading]`), `storage` (guarded + validated `localStorage`, prefix `aya:`), `celebrate` (canvas-confetti, no-op under reduced motion), `random.createRng` (seeded RNG for pure decorative layouts), `motion` tokens.
- Styling: CSS Modules + tokens in `src/styles/tokens.css`; shared classes (`.btn`, `.btn--primary|ghost|sm|lg|icon|night`, `.eyebrow`, `.text-gradient`, `.visually-hidden`, `.container`) in `globals.css`. **Keyframes must be defined inside each module** (CSS Modules localize animation names). Never use pink/magenta.
- The finale's three.js scene (`GalaxyScene.js`) is dynamically imported only after unlock and when near the viewport; it creates its own `<canvas>` (StrictMode-safe) and disposes everything. Static CSS fallback: `StaticSky.jsx` (no WebGL, context loss, or reduced motion).
- Dev-only harness: `/?harness=kenangan` (also `gate&started=0`, `bintang&progress=finaleUnlocked`, `hero,kenangan,dock`, `&motion=reduced`). Removed from production builds.

### Conventions and pitfalls learned during the rebuild

- ESLint runs the React Compiler rules (`react-hooks` v7): no `Math.random()`/`Date.now()` in render (use `createRng`), no reading `ref.current` during render, no synchronous `setState` in effect bodies (do side effects in event handlers), never mutate props/hook args.
- `motion` components keep the **first** callback ref they receive; don't build slot→element maps with changing ref callbacks (the puzzle uses `board.children[slot]`). Use `useIsPresent()` for exit-only styles; don't put `pointerEvents` in exit variants. Use `useAnimate` for repeatable feedback (keying a wrapper remounts its inputs and loses focus).
- Chapters use `overflow-x: clip` so decorative glows can't widen the page (focus/scroll would otherwise shift the page sideways).
- jsdom stand-ins live in `src/test/setup.js` (matchMedia, IntersectionObserver with `instances`, ResizeObserver, `<dialog>`, media play/pause, canvas → null, canvas-confetti mocked). Escape on `<dialog>` is not emulated: dispatch a `cancel` event. Render with `renderWithProviders(ui, { started, progress, motion })`.
- Music must be started synchronously inside a click handler (`OpeningGate` calls `play()` before `start()`). Microphone access exists **only** in the optional cake blow mode (`useBlowDetector`), requested on its own button, always released.
- `backsound.mp3` in `legacy/` is AAC-in-MP4 (DASH) with a wrong extension; the app ships a lossless `.m4a` remux plus a real `.mp3` fallback.
- Deployment: `vite.config.js` uses `base: './'`. `vercel.json` forces the Vite preset (the Vercel project predates the build step). GitHub Pages needs Settings → Pages → Source: GitHub Actions (`.github/workflows/deploy-pages.yml`). OG tags point to `https://happy-birthday-aya-lovat.vercel.app/`.
- `legacy/` holds the original static site (moved with `git mv`, history intact). It is not built or linted; it can be deleted once the owner no longer needs it.
