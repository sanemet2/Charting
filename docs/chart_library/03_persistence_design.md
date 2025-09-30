# Persistence Strategy

## Overview
- Provide a persistence abstraction that initially targets JSON-on-disk but can evolve to other backends without breaking existing code.
- Separate low-level storage (read/write) from higher-level chart library operations so UI callbacks stay backend-agnostic.

## Proposed Module Layout
- `Program/service/chart_library.py`
  - Public API (to be consumed by Dash callbacks):
    - `load_library() -> ChartLibrary`
    - `save_chart(folder_path, snapshot)`
    - `update_chart(chart_id, updates)`
    - `delete_chart(chart_id)`
    - `create_folder(parent_path, folder_name)`
    - `rename_folder(folder_id, new_name)`
    - `move_chart(chart_id, new_folder_path)`
    - All methods return domain objects or raise typed exceptions.
  - Internally leverages a storage engine interface to handle actual persistence.
- `Program/service/chart_library_storage.py`
  - Defines an interface (Protocol/ABC) with methods `read() -> dict`, `write(payload: dict) -> None`.
  - JSON implementation backed by a single file (e.g., `Program/data/chart_library.json`).
  - In-memory mock for tests.

## Data Structures
- `ChartLibrary`
  - `folders: Dict[str, Folder]`
  - `charts: Dict[str, ChartSnapshot]`
  - `root_folder_id: str`
  - Methods: navigation, lookups by path, serialization.
- `Folder`
  - `folder_id: str`
  - `name: str`
  - `parent_id: Optional[str]`
  - `children: List[str]` (folder IDs)
  - `charts: List[str]` (chart IDs ordered as displayed)
- `ChartSnapshot`
  - Fields defined in requirements doc (chart_id, display_name, series_store, etc.).

## JSON Schema Draft
```
{
  "schema_version": 1,
  "folders": {
    "root": {
      "folder_id": "root",
      "name": "Root",
      "parent_id": null,
      "children": ["folder-1"],
      "charts": ["chart-123"]
    },
    "folder-1": {
      "folder_id": "folder-1",
      "name": "FX",
      "parent_id": "root",
      "children": [],
      "charts": ["chart-456"]
    }
  },
  "charts": {
    "chart-123": {
      "chart_id": "chart-123",
      "display_name": "US 10Y",
      "series_store": { ... },
      "series_order": [ ... ],
      "formatting": {
        "chart_title": "US Rates",
        "x_label": "Date",
        "y_label": "Yield",
        "right_axis": [ ... ]
      },
      "interaction_state": { ... },
      "created_at": "2025-09-28T22:00:00Z",
      "updated_at": "2025-09-28T22:10:00Z",
      "schema_version": 1
    }
  }
}
```
- File-level `schema_version` allows migrations for the overall library layout.
- Each chart holds its own `schema_version` so we can migrate snapshots independently.

## Storage Considerations
- JSON file path default: `Program/data/chart_library.json` (configurable via env var if needed).
- Writes should be atomic: write to temp file, then replace.
- On load failure (missing file, malformed JSON), fallback to an empty library while surfacing an error message through the UI.
- Implement basic file locking (or rely on single-writer assumption) to avoid concurrent write corruption.

## Error Handling
- Define custom exceptions (`ChartLibraryError`, `DuplicateNameError`, `FolderNotEmptyError`, etc.).
- Surface human-friendly messages in the UI, but keep error types specific for logging/debugging.
- Validation occurs before write; if invalid data detected, raise without touching disk.

## Testing Strategy
- Unit tests for `Program/service/chart_library.py` using the in-memory storage implementation.
- JSON storage tests verifying read/write, atomic replace, and schema migration hooks.
- Include fixtures representing legacy schemas to ensure migrations remain reliable.

## Next Steps
- Finalize JSON storage location and config approach (hardcoded path vs. env-configurable).
- Implement storage interface and in-memory mock.
- Build ChartLibrary domain objects with serialization/deserialization capabilities.
- Write unit tests covering CRUD operations and validation rules.


## Development Checklist (AI <-> Human)
- AI summarizes storage interfaces, schema versioning, and atomic-write plans for sign-off.
- Human validates file location, logging expectations, and platform caveats (OneDrive, etc.).
- AI does not proceed until environment-specific guidance is received or explicitly waived.



