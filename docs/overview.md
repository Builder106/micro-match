# MicroMatch — Platform Overview

MicroMatch is a micro‑volunteering platform that pairs NGOs with bite‑sized tasks and helps volunteers complete them quickly with just‑in‑time learning.

## Key capabilities

- Browse and claim short, well‑scoped tasks
- Task detail and submission flow
- Auto‑translation on demand ("Auto‑translated" chip)
- Basic gamification: badges and level progress
- NGO verification (ProPublica 501(c)(3) lookup) backing a "Verified" chip on tasks
- Safety: Azure AI Content Safety checks on submissions
- Public tasks API for read‑only integrations

## Roles

- Volunteer: discovers and completes tasks; earns badges
- NGO: posts tasks and reviews submissions
- Anonymous: can browse public tasks

## Core pages

- `/` or `/tasks`: Task feed
- `/task/[id]`: Task details (+ translation via `?lang=`)
- `/task/[id]/claim`: Submit proof and notes
- `/org`: Post a task (NGO only)
- `/dashboard`: Badges and level progress

## How translation works

- Add `?lang=es` (for example) to task URLs to translate title and description server‑side.
- A chip “Auto‑translated” appears when translation is applied.

## Safety & moderation

- Text sent in task creation and claim notes is checked by Azure AI Content Safety.
- Unsafe content is blocked with a clear message.

## Public API

- `GET /api/tasks` → list public tasks (id, title, shortDescription, tags, estimatedMinutes, language)
