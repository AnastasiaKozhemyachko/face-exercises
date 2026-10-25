# Face Ritual

A personal Russian-language facial exercise PWA built with Vue 3, Vite, and TypeScript. No backend, accounts or paid services.

## Development

Requires Node.js 22+ and npm.

```bash
npm install
npm run dev
npm run test
npm run import:validate
npm run build
```

The exercise library is intentionally empty until reviewed content is added. The home screen displays an empty state in the meantime.

## Content package

Prepare a ZIP with the following structure, then extract its contents into `public/exercises/`:

```text
manifest.json
forehead-relaxation/
  card.png
```

The manifest contains `{ "version": 1, "exercises": [...] }`. Each exercise entry uses the schema in `src/domain.ts`. For example, `imagePath` must be `exercises/forehead-relaxation/card.png`. Cards should be portrait 9:16 and have their instructions reviewed before `approved: true`. Metadata may be authored in separate `exercise.json` files during preparation, but the deployment consumes the consolidated manifest. Keep sources and safety notes in approved entries.

Run `npm run import:validate` after extraction. Only approved entries are displayed. This is a build-time import, not a browser upload. All content in a public repository is publicly accessible.

## Deployment

GitHub Pages URL: https://anastasiakozhemyachko.github.io/face-exercises/

The workflow `.github/workflows/deploy.yml` runs on pushes to `main`. In GitHub repository **Settings → Pages**, set the build/deployment source to **GitHub Actions**. The Vite base is `/face-exercises/` and assets use this base path. The app has no path-based deep routes.

On iPhone, open the published site in Safari, choose Share → Add to Home Screen. SpeechSynthesis depends on installed browser voices and user activation; iOS may interrupt speech on backgrounding. Timers pause when the app is hidden. Offline availability depends on cached assets and service-worker installation.

## Safety

Exercise illustrations and technique should be independently reviewed. The app makes no medical or anti-aging efficacy claims. Stop any exercise that causes pain or discomfort.
