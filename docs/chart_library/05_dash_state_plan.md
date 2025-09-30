# Dash State & Store Plan

## Intent
- Extend Dash state management to support the chart library.
- Introduce new `dcc.Store` components for library data and active selection.
- Provide adapters translating between Dash store payloads and `ChartLibrary` domain objects.

## Target Modules
- `presentation/layout.py`
- `presentation/app_dash.py`
- `presentation/ids.py`
- New adapters/utilities module (e.g., `presentation/library_state.py`).

## Key Work Items
1. Register new component IDs in `presentation/ids.py`:
   - `CHART_LIBRARY_STORE`
   - `ACTIVE_LIBRARY_PATH`
   - (Optional) `LIBRARY_SELECTION_STORE` for multi-selection actions.
2. Update layout to include hidden stores:
   - Add `dcc.Store(id=ids.CHART_LIBRARY_STORE)` near existing stores.
   - Add `dcc.Store(id=ids.ACTIVE_LIBRARY_PATH, data={"breadcrumbs": ["root"], "current": null})` to track navigation.
3. Build adapter utilities (new module):
   - `to_library_store(library: ChartLibrary) -> Dict[str, object]`
   - `from_library_store(payload: Dict[str, object]) -> ChartLibrary`
   - `build_chart_snapshot_from_dash(series_store, formatting_inputs) -> ChartSnapshot`
   - `apply_chart_snapshot_to_dash(chart_snapshot) -> DashUpdatePayload`
4. Integrate service layer:
   - Create a thin wrapper (e.g., `get_library_service()`) that returns a singleton service with injected storage and logger.
   - Ensure Dash callbacks use the service via adapters instead of direct JSON manipulation.
5. Store synchronization strategy:
   - Implement incremental updates: mutate the existing library payload in the store when charts/folders change, avoiding full reloads for large libraries.
   - Provide helper functions to patch folder/chart nodes deterministically.

## Testing Plan
- Add new helper tests (`tests/presentation/test_library_state.py`) covering serialization adapters and incremental update helpers.
- Extend existing Dash callback tests (if any) to ensure stores hydrate correctly when the service returns data.
- Manual verification checklist:
   - Launch Dash, trigger library interactions, inspect browser dev tools for store payload shape and incremental updates.

## Dependencies & Prep
- Service layer must expose serialization hooks (`ChartLibrary.to_store` / `from_store`).
- Document initial store payload shape in AGENTS or README so future contributors understand the contract.
- Coordinate with UI plan (Roadmap Section 6) to confirm which stores must exist before wiring callbacks.

## Decisions Since Planning
- Library data preloads on app start: initial callback loads the library into the stores so the Library panel opens instantly.
- `ACTIVE_LIBRARY_PATH` stores breadcrumbs and caches the current folder metadata (`{"breadcrumbs": [...], "current": {...}}`) to avoid repeated lookups.
- Incremental store updates are required; helper functions will update only affected branches to keep payload size manageable for large libraries.

## Outstanding Questions
- None at this stage.

## Next Steps After Approval
- Finalize store ID names and payload contracts.
- Implement adapter utilities and incremental update helpers with unit tests.
- Modify layout and app initialization to provide the new stores.
- Update documentation with store definitions and data contract examples.

## Development Checklist (AI <-> Human)
- AI presents planned store payload shapes and adapter helpers for alignment.
- Human confirms preload timing, breadcrumb metadata structure, and incremental update expectations.
- AI verifies target UI components consuming each store before editing layout or callbacks.
