# MicroMatch — Platform Overview

MicroMatch is a micro‑volunteering platform that pairs NGOs with bite‑sized tasks and helps volunteers complete them quickly with just‑in‑time learning.

## Key capabilities

- Browse and claim short, well‑scoped tasks
- Task detail and submission flow
- Worldwide localization with Paraglide UI catalogs and server-side LibreTranslate task translation
- Basic gamification: badges and level progress
- NGO verification (ProPublica 501(c)(3) lookup) backing a "Verified" chip on tasks
- Safety: Azure AI Content Safety checks on submissions
- Public tasks API for read‑only integrations

## Roles

- Volunteer: discovers and completes tasks; earns badges
- NGO: posts tasks and reviews submissions
- Anonymous: can browse public tasks

## Core pages

- `/en/`or`/en/tasks`: English task feed
- `/fr/task/[id]`: French task details with French task-field translation
- `/en/task/[id]/claim`: Submit proof and notes
- `/en/org`: Post a task (NGO only)
- `/en/dashboard`: Badges and level progress

## How localization works

- Paraglide supplies static UI messages from committed catalogs for `en`, `es`, `fr`, `de`, `pt`, `zh`, and `ar`.
- The locale prefix controls the page language: `/es/tasks` selects Spanish and `/ar/dashboard` selects Arabic with right-to-left document direction.
- LibreTranslate translates user-created task display fields server-side. Feeds and dashboards translate after the original data renders; task detail pages keep the original content available while translation loads.
- Legacy `/task/[id]?lang=<code>` links redirect to the canonical `/<locale>/task/[id]` form.
- A chip “Auto‑translated” appears when task content is translated.

## Safety & moderation

- Text sent in task creation and claim notes is checked by Azure AI Content Safety.
- Unsafe content is blocked with a clear message.

## Public API

- `GET /api/tasks` → list public tasks (id, title, shortDescription, tags, estimatedMinutes, language)
