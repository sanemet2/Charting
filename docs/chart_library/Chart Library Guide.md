# Chart Library Guide

## Overview
- Purpose: capture ongoing design + implementation notes for the Chart Library feature without modifying the main `AGENTS.md`.
- Scope: Dash UI additions, service layer, persistence, state management, callbacks, UX polish, and launch prep.
- Status: planning documents completed for phases 1–9 (see `docs/chart_library/0*_*.md`). Implementation has not started yet.

## Key Artifacts
- Planning notes: `docs/chart_library/01_map_current_state.md` ? `docs/chart_library/09_launch_plan.md`.
- Roadmap tracker: `docs/CHART_LIBRARY_ROADMAP.md` lists each phase with planning/completion status.
- Future verification checklist (to add during implementation): `docs/chart_library/verification_checklist.md` (placeholder).

## Responsibilities by Phase
1. **Service Layer** (`service/chart_library.py`, storage module, tests)
   - Implement per `04_service_layer_plan.md`.
   - Add logging, atomic writes, and unit tests before exposing APIs to Dash.
2. **Dash Stores & Adapters** (`presentation/library_state.py`, layout IDs, stores)
   - Follow `05_dash_state_plan.md`; ensure incremental store updates and preloaded data.
3. **UI Scaffold** (`presentation/layout.py`, `ids.py`)
   - Build tree-based panel described in `06_ui_plan.md` with placeholders for future search/tagging.
4. **Callbacks** (`presentation/app_dash.py`)
   - Implement groups A–F from `07_callbacks_plan.md` using debounce helpers and feedback hooks.
5. **UX & Error Handling** (`ui_feedback.py`, toast integration)
   - Apply `08_ux_validation_plan.md`, combining inline messages with toasts.
6. **Documentation & Launch**
   - Execute checklist in `09_launch_plan.md` once code stabilizes (docs, lint/tests, milestone entry).

## Usage (Post-Implementation)
- Saving: user selects destination folder, enters chart name, presses "Save Current Chart"; snapshot stored via service layer.
- Loading: selecting chart in tree hydrates series + formatting stores without clearing states.
- Deleting/Moving: single-select actions update library store incrementally; status messages appear inline and in global toast.

## Testing Expectations
- Unit tests cover service layer, storage, adapter serialization, and callback utilities.
- Manual verification checklist (to be added) must include save/load/delete/move flows, error scenarios, and UI feedback validation.
- Run `pytest`, `black`, and `ruff` before shipping updates.

## Maintenance Notes
- Keep this guide in sync when new functionality or decisions are introduced.
- Update roadmap status and relevant planning docs after major milestones.
- Add TODOs or follow-up items inline (e.g., future search/tag support, multi-select actions).

## Development Checklist (AI <-> Human)
- AI keeps this guide in sync when entering or exiting each roadmap phase, summarizing new decisions.
- Human reviews guide updates to ensure messaging and process notes remain accurate.
- AI notes any blocked items requiring further human clarification before the next phase begins.
