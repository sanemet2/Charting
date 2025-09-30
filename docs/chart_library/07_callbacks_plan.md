# Callback Implementation Plan

## Intent
- Wire Dash callbacks that connect the chart library UI, stores, and service layer.
- Support CRUD workflow: load library, save chart, load chart, move/delete, and folder management.
- Ensure callbacks emit appropriate feedback messages and keep stores in sync incrementally.

## Target Modules
- `Program/presentation/app_dash.py`
- `Program/presentation/library_state.py` (adapters/helpers)
- `Program/presentation/ui_feedback.py`
- `Program/service/chart_library.py`

## Key Callback Groups
1. **Library Load Callback**
   - Trigger: app start (server-side callback) or initial layout load.
   - Inputs: none or a dummy `Interval`.
   - Outputs: `CHART_LIBRARY_STORE`, `ACTIVE_LIBRARY_PATH`, optional status message.
   - Behavior: call service `load_library()`, serialize via adapter, stash logging on success/failure.

2. **Folder Navigation Callback**
   - Trigger: folder tree selection change.
   - Inputs: `LIBRARY_FOLDER_TREE` selection, current library store.
   - Outputs: `ACTIVE_LIBRARY_PATH`, `LIBRARY_CHART_LIST` options.
   - Behavior: update breadcrumbs/current folder metadata and repopulate chart list.

3. **Save Chart Callback**
   - Trigger: `LIBRARY_SAVE_BUTTON` click.
   - Inputs: `LIBRARY_SAVE_NAME_INPUT`, destination folder, stores (`CHART_SERIES_STORE`, `COMBINED_DATA_STORE`, `ACTIVE_LIBRARY_PATH`, current library).
   - Outputs: updated `CHART_LIBRARY_STORE`, feedback message, reset input fields.
   - Behavior: build snapshot from stores, call `save_chart`, apply incremental patch to library store, log success/failure.

4. **Load Chart Callback**
   - Trigger: selecting a chart from `LIBRARY_CHART_LIST`.
   - Inputs: selected chart ID, library store.
   - Outputs: `CHART_SERIES_STORE`, `COMBINED_DATA_STORE`, formatting inputs, feedback message.
   - Behavior: deserialize snapshot, push data back into stores, update chart formatting inputs.

5. **Delete / Move Callbacks**
   - Trigger: delete/move buttons.
   - Inputs: selected chart(s)/folder(s), active path, library store.
   - Outputs: updated `CHART_LIBRARY_STORE`, feedback, maybe clear selection.
   - Behavior: call service method, apply incremental updates (remove chart, adjust folder lists).

6. **Folder Management Callback**
   - Trigger: create/rename folder actions (if in MVP).
   - Inputs: folder name inputs, active path, library store.
   - Outputs: library store updates, feedback.

## Supporting Utilities
- `library_state.apply_library_patch(library_store, patch)` to apply incremental diffs.
- `library_state.extract_chart_snapshot(library_store, chart_id)` helper for load callback.
- Shared feedback helpers to craft success/error messages referencing chart/folder names.

## Testing Plan
- Unit tests (where feasible) for adapter utilities and service-layer interactions with mocks.
- Integration tests for callbacks: potential to use Dash testing framework or manual scripts covering:
   - Save new chart -> library store updated, chart list reflects change.
   - Load chart -> series stores and formatting inputs updated.
   - Delete/move operations adjust tree and send confirmation messages.
- Manual verification checklist: perform end-to-end flows in dev server, inspect store payloads.

## Dependencies & Prep
- Service layer and dash state adapters must be implemented (Sections 4 & 5).
- UI scaffold (Section 6) must expose required component IDs and placeholders.
- Logging configuration should capture callback errors for debugging.

## Outstanding Questions
- For load chart, do we clear current chart before hydration (to avoid partial state) or patch in place?
- Should delete/move support multi-select out of the gate, or single item only for MVP?
- Do we debounce folder tree selections to avoid double callbacks on rapid clicks?

## Next Steps After Approval
- Answer outstanding questions and document decisions in this plan.
- Implement adapter utilities required by callbacks.
- Add callback registrations in `Program/presentation/app_dash.py` using the planned flow.
- Extend Diagnostics/tests/manual checklist to cover new interactions.

## Development Checklist (AI <-> Human)
- AI walks through each callback group with expected inputs/outputs for confirmation.
- Human validates debounce timing, single-select scope, and feedback destinations before wiring callbacks.
- AI confirms unit/manual test strategy and receives approval before editing app_dash.py.



