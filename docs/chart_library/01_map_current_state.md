# Map Current State

## Current Architecture Overview
- Entry point `Program/presentation/app_dash.py:create_dash_app` wires Dash callbacks and exposes `app` for `Program/app.py`.
- Layout structure comes from `Program/presentation/layout.py`, which defines the Fetch panel, Format panel, and `dcc.Store` components (`CHART_SERIES_STORE`, `COMBINED_DATA_STORE`).
- Chart rendering utilities live in `Program/presentation/charts.py`, while data orchestration flows through `Program/service/controllers.py` and `Program/service/validators.py`.

## Fetch Flow
1. User populates inputs defined in `Program/presentation/layout.py` (ticker, dates, periodicity, field group, transformation toggle).
2. `@app.callback` in `Program/presentation/app_dash.py:126` reacts to `FETCH_BUTTON`, `REMOVE_SERIES_BUTTON`, and `CLEAR_ALL_BUTTON` clicks while reading current form inputs and store state.
3. When `FETCH_BUTTON` fires:
   - Raw inputs are assembled via `_build_raw_inputs`.
   - `Program.service.validators.validate_fetch_inputs` normalizes ticker, dates, periodicity, and transformation payloads. Errors are surfaced through `Program.presentation.ui_feedback` helpers (status banner populated in `MESSAGE_CONTAINER`).
   - On success, `_build_series_id` derives a stable key from ticker + params, and `Program.service.controllers.fetch_single_series` executes the data fetch (mock or real) then returns a DataFrame + `y_fields`.
   - `_serialize_result` converts the fetch result to `Program.presentation.series_state.ChartSeriesData`, storing JSON-serialized DataFrames under `CHART_SERIES_STORE`.
4. Depending on fetch mode (`FETCH_MODE_REPLACE` vs `FETCH_MODE_ADD`), the callback either replaces the store contents or merges the new series into the existing dictionary.
5. `Program.presentation.series_state.build_combined_series` is called to produce a merged frame + metadata which is saved in `COMBINED_DATA_STORE` for downstream callbacks.

## Store Contracts
- `CHART_SERIES_STORE`: dict keyed by `series_id` with payloads shaped like `ChartSeriesData.to_store()` (ticker label, list of `y_fields`, DataFrame as JSON orient="split").
- `COMBINED_DATA_STORE`: output of `CombinedSeriesData.to_store()` including the merged DataFrame (JSON), aggregated `y_fields`, concatenated ticker label, and `series_field_map` for right-axis assignments.
- Store hydration/deserialization relies on `ChartSeriesData.from_store` and `CombinedSeriesData.empty`, both in `Program/presentation/series_state.py`.

## Chart Rendering
- `render_chart` callback in `Program/presentation/app_dash.py:276` watches `COMBINED_DATA_STORE`, formatting inputs, and right-axis selection.
- The callback deserializes the combined DataFrame, filters missing columns defensively, and calls `Program.presentation.charts.build_price_chart` to produce the Plotly figure.
- Visibility of `CHART_CONTAINER` is controlled based on whether data is available; empty state messages surface via `CHART_STATUS`.

## Message & Error Handling
- Validation or fetch errors return structured messages rendered via `ui_feedback.render_error` (observed inside the main callback path).
- Success states append human-readable bullet summaries rendered by `ui_feedback.render_series_summary` (shows series count, date ranges, etc.).

## Observations
- All chart state currently lives in memory within Dash stores; there is no persistence beyond session.
- `series_state` assumes DataFrames are pandas-serializable; any new storage layer must preserve JSON structure or provide converters.
- Right-axis mapping relies on `series_field_map` using renamed columns (`ticker_field`), so saved charts must capture both the selected series IDs and the merged column names.

## Decisions
- Saved charts will expose a user-editable name; internally we will retain the machine-generated `series_id` as a stable reference until a friendly name is provided.
- The chart library will be shared across all users and sessions (no per-user isolation in MVP).
- Transformation metadata must be versioned so older saved charts continue to load even if new transform options are introduced.
- Persistence will cover chart state only (series payloads and formatting inputs), excluding UI-only toggles like panel open/closed state.

## Next Steps
- Validate the decision notes with stakeholders as needed.
- Begin drafting the explicit schema for saved charts (Roadmap Section 2) based on the structures documented here.


## Development Checklist (AI <-> Human)
- AI reconfirms the current data flow and store contracts so both parties share context.
- Human flags any unpublished components or manual steps before requirements work begins.
- AI pauses and asks if more discovery is needed prior to moving to the next phase.



