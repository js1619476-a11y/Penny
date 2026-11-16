# Penny — Your Money, Made Simple

Penny is a personal finance web application built with React, Vite, Tailwind CSS v4, Firebase Authentication, and Cloud Firestore. Each Google login receives an isolated personal profile with transactions, budgets, savings goals, and plain-English insights.

## Host on GitHub Pages

This repository includes an automatic GitHub Pages deployment workflow (`.github/workflows/deploy.yml`):

1. Push this repository to GitHub on the `main` branch (repository name: `Penny`).
2. Open your GitHub repository **Settings -> Pages**.
3. Under **Build and deployment -> Source**, select **GitHub Actions**.
4. Your site will build and go live at `https://<your-github-username>.github.io/<repo-name>/`.
5. Add `<your-github-username>.github.io` under **Firebase Console -> Authentication -> Settings -> Authorized domains** so Google Sign-In works on your GitHub Pages URL.

## Deploy on Cloudflare Pages

- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: `20` or `22`
- SPA fallback routing is preconfigured via `public/_redirects`.

## Run & Deploy on Replit

- Preconfigured via `.replit` (`nodejs-22`, port `3000`, static build output `dist`).
- **Install dependencies**: `npm install`
- **Start dev server**: `npm run dev`
- **Build for production**: `npm run build`
- **Serve production preview**: `npm start`

## Available Scripts

- `npm run dev` — Start Vite development server (`0.0.0.0:3000`)
- `npm run build` — Build production bundle (`dist/`)
- `npm start` / `npm run preview` — Preview production build (`0.0.0.0:3000`)
- `npm run lint` — TypeScript check (`tsc --noEmit`)
- `npm test` — Run unit tests (`tsx --test src/utils/*.test.ts`)
