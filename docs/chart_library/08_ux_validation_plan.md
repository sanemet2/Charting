# UX Validation & Error Handling Plan

## Intent
- Ensure the chart library feature provides clear feedback, handles errors gracefully, and avoids user confusion.
- Validate that save/load flows, name conflicts, and folder operations surface actionable messages.
- Confirm the UI remains responsive even when operations fail or the library is empty.

## Target Modules
- `presentation/ui_feedback.py`
- `presentation/app_dash.py`
- `presentation/layout.py`
- `presentation/library_state.py`
- `service/chart_library.py`

## Key Work Items
1. Feedback Messaging
   - Extend `ui_feedback` helpers for library-specific success/error messages (e.g., "Saved chart X to folder Y").
   - Standardize message structure (icon + text, color cues).
   - Use both inline panel messaging and a global toast notification for prominence.

2. Error Handling
   - Map service-layer exceptions (`NameConflictError`, `FolderNotEmptyError`, `InvalidPayloadError`) to user-friendly strings.
   - Catch JSON/storage errors on load/save and display “Library unavailable” with retry instructions.
   - Validate inputs before service calls (e.g., blank save name, no destination folder).
   - Allow users to retry by re-clicking the original action after corrective changes (no dedicated retry button).

3. Empty States
   - Display informative placeholders when the library or folder has no charts.
   - Disable action buttons when required selections/inputs are missing.

4. Loading States
   - Optional spinner or subtle indicator; MVP will surface “Saving…”/“Loading…” messages via the feedback panel/toast.

5. Resilience Checks
   - Ensure incremental store updates don’t leave orphaned selections (if chart removed, clear selection).
   - Handle stale state gracefully (e.g., if another session modified the library file, allow reload and warn user).

## Testing & Validation
- Manual verification checklist:
   - Save chart with duplicate name -> error message + toast, input highlighted.
   - Delete chart -> success toast, chart removed from list, selection cleared.
   - Load chart with malformed data (simulate) -> show failure message, UI remains usable.
   - Empty library -> prompt to save first chart; buttons disabled appropriately.
- Automated tests:
   - Unit tests for feedback helper formatting.
   - Service-layer tests already cover error raises; add integration tests to assert errors translated correctly.

## Dependencies & Prep
- Callback implementations (Section 7) must emit structured feedback payloads.
- UI panel (Section 6) must expose `LIBRARY_FEEDBACK_CONTAINER` and support message styling.
- Global toast component (existing or new) needed; confirm where it lives in layout.
- Ensure logging captures errors for debugging (INFO/ERROR per Section 4 decisions).

## Decisions Since Planning
- No dedicated retry button; users re-trigger the original action after fixing issues.
- Introduce global toast notifications alongside inline panel messaging for better visibility.

## Outstanding Questions
- None currently.

## Next Steps After Approval
- Implement toast + inline feedback helpers in `ui_feedback.py`.
- Update layout to include toast container if not already present.
- Wire callbacks to send structured feedback payloads to both inline and toast outputs.
- Expand manual checklist and note any automated tests to add.

## Development Checklist (AI <-> Human)
- AI proposes inline + toast messaging patterns with sample copy for review.
- Human confirms retry expectations, disabled-state rules, and loading indicators before implementation.
- AI aligns on manual acceptance criteria prior to updating ui_feedback or layout elements.
