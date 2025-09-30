# Requirements and Data Model

## Goals
- Enable users to save chart configurations (series selections + formatting) into a shared library with optional sub-folders.
- Allow saved charts to be recalled later without re-entering fetch parameters manually.
- Preserve backwards compatibility so older snapshots load even as transformation options evolve.

## Saved Chart Snapshot
- `chart_id`: internal identifier (defaults to `_build_series_id` output; overridden when the user edits the chart name).
- `display_name`: user-facing name; defaults to the machine ID until edited by the user.
- `series_store`: JSON payload mirroring `CHART_SERIES_STORE` structure (dict of `{series_id: ChartSeriesData.to_store()}`).
- `series_order`: list of `series_id` preserving the user-selected ordering for legend/stacking.
- `formatting`: object capturing `chart_title`, `x_label`, `y_label`, and right-axis assignments (`series_right_axis_selection`).
- `interaction_state`: optional slot for chart-level user adjustments (e.g., zoom range) so resaving a modified view creates a new snapshot.
- `created_at` / `updated_at`: ISO timestamps for history/audit.
- `schema_version`: incremented when we evolve the snapshot schema; loader chooses the right migration path.
- Optional future metadata (description, tags) should coexist without breaking older entries.

> Note: We will not store the original fetch parameters in MVP; saved charts capture rendered state only. Users can fetch new data and resave if needed.

## Library Hierarchy
- A library is a tree of folders; the root node contains zero or more sub-folders and chart snapshots.
- Folder objects include `folder_id`, `name`, optional parent reference, and ordered child lists.
- Folder names must be unique within the same parent; depth is unrestricted for now.
- Charts reside in folders (including root) and reference their parent folder ID/path for restoration.
- Charts can be permanently deleted; folders/sub-folders should not support hard delete in MVP (only allow rename/reorder, or require folders to be emptied before removal if deletion is later introduced).

## Persistence & Versioning
- Initial storage can be JSON-on-disk via `service/chart_library.py`, with an abstraction layer ready for database swaps later.
- Snapshots are stored as JSON objects with accompanying `schema_version` (start at 1).
- Transformation metadata stays embedded alongside each series within `series_store` so legacy charts load even after we add new transform types.
- Writes should be durable (atomic replace or transactional equivalent) once we move beyond in-memory mocks.

## Validation Rules
- Enforce non-empty `display_name` (fallback to machine ID if user leaves it blank).
- Validate friendly names for uniqueness within a folder (case-insensitive).
- Guard against invalid characters in folder/chart names if we mirror them to filesystem paths (define allowlist early).
- Ensure `series_store` payload can be deserialized via `ChartSeriesData.from_store`; reject malformed JSON before persisting.
- Provide defaults for any missing formatting fields to maintain backward compatibility.

## Confirmed Decisions
- Shared library for all users/sessions (no per-user segregation in MVP).
- Friendly name overrides persist; machine-generated IDs remain internal references.
- Persistence captures chart state (series payloads, formatting, interaction state), not UI-only toggles like panel visibility.
- Hard delete allowed for charts; folders/sub-folders must remain intact (no permanent delete flow in MVP).
- Rendered chart state is authoritative; re-fetching requires user action and saving a new snapshot if desired.

## Open Clarifications
- None at this stage; future requirements (e.g., soft delete, per-user libraries, refresh-from-source) can be revisited once MVP is in place.


## Development Checklist (AI <-> Human)
- AI restates the saved-chart schema, hierarchy model, and metadata fields for confirmation.
- Human resolves outstanding requirements (e.g., persistence scope, naming constraints).
- AI seeks approval before drafting service/storage interfaces based on these requirements.
