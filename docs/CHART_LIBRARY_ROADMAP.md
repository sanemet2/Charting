# Chart Library Roadmap

**Approach**
- Document-first: each phase gets a planning note in `Docs/chart_library/` before implementation.
- Status legend: _Planning complete_ indicates the doc is written; _Implementation pending_ means code work has not started yet.

## 1. Map Current State _(Planning complete - see `Docs/chart_library/01_map_current_state.md`)_
- Trace how fetch inputs flow through `Program/service/controllers.py`, `Program/presentation/series_state.py`, and `Program/presentation/app_dash.py` into the chart container.
- Catalogue existing `dcc.Store` usage, determining which parts of chart state are already serializable.
- List open questions that require clarification before structural changes (e.g., user scope, multi-session expectations).

## 2. Define Requirements and Data Model _(Planning complete - see `Docs/chart_library/02_requirements.md`)_
- Specify what a saved chart must capture: series identifiers, fetch parameters, formatting inputs, right-axis selections, and metadata (labels, created timestamp).
- Decide on the library hierarchy (library -> sub-library -> chart) including naming rules and depth limits.
- Draft a schema reference that future contributors can extend without breaking backwards compatibility.

## 3. Design Persistence Strategy _(Planning complete - see `Docs/chart_library/03_persistence_design.md`)_
- Choose an initial storage mechanism (in-memory + JSON file or simple service module) with an abstraction ready to swap to a database later.
- Establish versioning and validation rules to guard against malformed payloads.
- Document how persistence responds to failures (e.g., write errors, missing files).

## 4. Build Service Layer and Tests _(Planning complete - see `Docs/chart_library/04_service_layer_plan.md`; implementation pending)_
- Implement `Program/service/chart_library.py` with dataclasses or typed dictionaries representing libraries, folders, and charts.
- Provide create/read/update/delete operations plus helpers to serialize/deserialize chart snapshots.
- Add pytest coverage for the service layer covering round-trips, hierarchy operations, deduplication rules, and error handling.

## 5. Extend Dash Stores and Adapters _(Planning complete - see `Docs/chart_library/05_dash_state_plan.md`; implementation pending)_
- Introduce dedicated `dcc.Store` IDs (e.g., `CHART_LIBRARY_STORE`, `ACTIVE_LIBRARY_PATH`) and register them in `Program/presentation/ids.py`.
- Build adapter utilities that translate the current chart state (series store + formatting inputs) into the persistence schema and back.
- Ensure adapters handle legacy states gracefully by providing defaults for newly introduced fields.

## 6. Scaffold Library UI _(Planning complete - see `Docs/chart_library/06_ui_plan.md`; implementation pending)_
- Add a "Chart Library" panel in `Program/presentation/layout.py`, mirroring existing toggleable panels for consistency.
- Include controls to navigate libraries/sub-libraries via tree view, input a chart name, and trigger save/load/delete actions.
- Provide placeholders for future enhancements (search, tagging) without exposing unfinished behavior.

## 7. Implement Callbacks Incrementally _(Planning TBD)_
- Callback A: render the library hierarchy from the service layer and keep it in sync after CRUD operations.
- Callback B: save the current chart snapshot by gathering inputs from stores and form fields, persisting via the service layer, and reporting status.
- Callback C: load a saved chart, hydrate `CHART_SERIES_STORE`, formatting inputs, and trigger chart re-rendering.
- Callback D: maintain sub-library creation/renaming/deletion with validation and user feedback.

## 8. Validate UX and Error Handling _(Planning TBD)_
- Reuse `Program/presentation/ui_feedback.py` patterns to surface success and failure messages.
- Add safeguards for duplicate names, empty snapshots, and missing data.
- Confirm that saving/loading respects transforms, secondary axes, and other advanced settings.

## 9. Documentation and Launch Prep _(Planning TBD)_
- Update `AGENTS.md` (and any contributor docs) with library usage steps, new IDs, and troubleshooting notes.
- Record manual verification steps (save/load/delete, nested folders) and add them to the regression checklist.
- Run `black`/`ruff`, perform a final Dash smoke test, and capture future backlog ideas (shared libraries, preview thumbnails, export/import).



