# Service Layer Implementation Plan

## Intent
- Implement Program/service/chart_library.py as the domain-facing API for chart library operations.
- Provide a storage interface with a JSON-backed implementation plus in-memory mock for tests.
- Ensure the module enforces validation, hierarchy rules, and emits structured errors ready for Dash callbacks.

## Target Modules
- Program/service/chart_library.py (new)
- Program/service/chart_library_storage.py (new)
- 	ests/Program/service/test_chart_library.py (new)
- Potential updates to Program/service/__init__.py or other exports if needed.

## Key Work Items
1. Define domain dataclasses/typed structures:
   - ChartSnapshot
   - Folder
   - ChartLibrary
   - Include serialization/deserialization helpers (	o_dict, rom_dict).
2. Implement the storage protocol:
   - Abstract base/protocol with ead() / write().
   - JSON file implementation with atomic writes.
   - In-memory mock for tests.
3. Build service API functions:
   - load_library(storage) -> ChartLibrary
   - save_chart(storage, folder_path, snapshot_payload)
   - update_chart(storage, chart_id, updates)
   - delete_chart(storage, chart_id) (charts only)
   - create_folder(storage, parent_path, name)
   - ename_folder(storage, folder_id, new_name)
   - move_chart(storage, chart_id, new_folder_path)
   - Each function performs: load -> mutate -> validate -> persist.
4. Validation and errors:
   - Enforce name uniqueness per folder.
   - Prevent chart writes with malformed series_store / formatting payloads.
   - Block folder deletion unless empty (MVP: disallow or return dedicated error).
   - Define custom exceptions (ChartLibraryError, NameConflictError, InvalidPayloadError, FolderNotEmptyError).
5. Integration points:
   - Provide helper to obtain default storage (e.g., JSON file in Program/data/chart_library.json).
   - Expose serialization for Dash callbacks (e.g., ChartLibrary.to_store() returning JSON-friendly dicts).

## Testing Plan
- 	ests/Program/service/test_chart_library.py using in-memory storage mock:
  - 	est_load_empty_library_returns_root_folder
  - 	est_save_chart_persists_snapshot_and_order
  - 	est_duplicate_display_name_raises_error
  - 	est_move_chart_updates_folder_relationship
  - 	est_delete_chart_removes_reference_only
  - 	est_folder_creation_and_rename
  - 	est_invalid_series_store_payload_rejected
  - 	est_json_storage_round_trip
- Additional tests for JSON storage using temporary files to exercise atomic write behavior.

## Dependencies & Prep
- Confirm final path for JSON storage file (default Program/data/chart_library.json).
- Decide how to inject storage into Dash callbacks (dependency injection vs. module-level singleton).
- Ensure Program/data/ directory has write permissions in deployment environments.

## Decisions Since Planning
- Chart IDs will continue to come from the UI (via _build_series_id); the service layer treats them as stable keys and stores the user-edited display_name alongside.
- Atomic writes: write JSON to a temporary file, flush/sync, then call os.replace. Include a lightweight retry (e.g., 2-3 attempts) to handle transient OneDrive/Windows file locks.
- Logging: integrate Python logging to emit INFO entries for create/update/delete operations (chart/folder IDs + names) and ERROR entries on failures for auditing.

## Outstanding Questions
- None at this stage.

## Next Steps After Approval
- Implement storage interface and in-memory mock.
- Develop domain objects and serialization logic.
- Write service functions with validation and error handling.
- Author unit tests and ensure they pass.
- Update documentation (AGENTS, roadmap notes) once implementation is complete.

## Development Checklist (AI <-> Human)
- AI outlines service APIs, exception types, and logging strategy for review.
- Human approves dependency injection approach and dataclass naming conventions.
- AI documents agreed test coverage and waits for go-ahead before coding.



