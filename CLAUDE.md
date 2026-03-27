# Territorios

## Project Overview

This is an online territory management app for a Jehovah's Witnesses congregation. The goal is to provide a simple, intuitive, and modern interface that keeps everything in one place — tracking territory cards, assignments, return dates, and history.

## Design Philosophy

- **Simple and intuitive**: prioritize clarity over complexity; minimal cognitive load
- **Modern UI**: clean, polished, production-grade interfaces
- **Everything in one place**: avoid context-switching; modal-based workflows

For all UI/design work, use the **frontend-design** and **ui-ux-pro-max** skills.

## Tech Stack

- **React 19** + **Vite** — frontend framework and build tool
- **Tailwind CSS v4** — utility-first styling
- **Supabase** — authentication (magic link / email) and PostgreSQL database
- **TanStack Table v8** — advanced table component
- **PWA** — installable on mobile and desktop (service worker + manifest)

## Architecture

- **SPA with conditional rendering** — no router library; views are swapped based on auth state and modal open state
- **Auth flow**: `App.jsx` checks Supabase session on mount → renders `LoginPage` or `TerritoryGrid`
- **Modal-based navigation** — all detail views open as modals over the main grid
- **Real-time**: Supabase subscriptions for live updates

## Deployment

After every code change:
1. Commit and push to GitHub (`git push`)
2. Deploy to Vercel production (`vercel --prod`)

This keeps the live site at **https://territorios-jw.vercel.app** always up to date.

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Root component — auth state, territory fetching, top-level layout |
| `src/components/TerritoryGrid.jsx` | Main territory card grid view |
| `src/components/TerritoryTable.jsx` | Table view with TanStack Table |
| `src/components/TerritoryModal.jsx` | Territory detail/edit modal |
| `src/components/TerritoryHistoryModal.jsx` | Assignment history modal |
| `src/components/AddTerritoryForm.jsx` | Form to add new territories |
| `src/components/LoginPage.jsx` | Auth screen |
| `src/lib/supabase.js` | Supabase client initialization |
| `src/lib/imageUtils.js` | Image upload/processing helpers |
