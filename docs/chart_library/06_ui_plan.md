# Library UI Scaffold Plan

## Intent
- Introduce a dedicated Chart Library panel within the Dash layout.
- Provide navigation controls (folder tree/list), save form, and management buttons.
- Keep initial UI minimal yet extensible for future features (search, tagging).

## Target Modules
- `Program/presentation/layout.py`
- `Program/presentation/app_dash.py`
- `Program/presentation/ids.py`
- `Program/presentation/ui_feedback.py`
- Supporting CSS (if any custom styling is required).

## Key Work Items
1. Define new component IDs in `Program/presentation/ids.py`:
   - `LIBRARY_PANEL_CONTAINER`
   - `LIBRARY_PANEL_TOGGLE_BUTTON`
   - `LIBRARY_FOLDER_TREE`
   - `LIBRARY_CHART_LIST`
   - `LIBRARY_SAVE_NAME_INPUT`
   - `LIBRARY_SAVE_BUTTON`
   - `LIBRARY_DELETE_BUTTON`
   - `LIBRARY_MOVE_BUTTON`
   - `LIBRARY_FEEDBACK_CONTAINER`
2. Update layout (`Program/presentation/layout.py`):
   - Add a toggle button similar to Fetch/Format panels.
   - Create the panel container with sections for:
     - Folder navigation rendered as a tree view (MVP target).
     - Chart list with select/delete controls.
     - Save form: name input, destination folder dropdown, "Save Current Chart" button.
     - Future placeholder area (e.g., disabled search input).
   - Ensure responsive layout (reuse existing styles or define minimal new ones).
3. Provide default text/states:
   - Empty library message.
   - Disabled buttons when no chart is selected.
4. Hook up stores:
   - Bind library data (`CHART_LIBRARY_STORE`) to tree/list components.
   - Use `ACTIVE_LIBRARY_PATH` to highlight current folder selection.
5. Add UI feedback region:
   - Reserve space (`LIBRARY_FEEDBACK_CONTAINER`) for success/error messages.

## Testing Plan
- Manual walkthrough checklist:
   - Panel toggles open/close like existing panels.
   - Elements render with placeholder data (before callbacks wired).
   - Ensure no existing components regress (layout loads without callback errors).
- Automated tests (future): snapshot/layout tests if we adopt Dash component testing.

## Dependencies & Prep
- Requires store IDs and adapter plan from Section 5.
- Coordinate with callback plan (Section 7) to ensure component IDs align with callback signatures.
- Confirm styling approach (reuse inline styles vs. adding global stylesheet entries).

## Decisions Since Planning
- Folder navigation will use a tree view component in MVP (dropdown fallback documented for older browsers if needed).
- Save form remains minimal: only name input + destination selector + save button; no extra metadata fields yet (placeholders can be added later).
- No additional accessibility requirements beyond standard Dash components at this stage.

## Outstanding Questions
- None currently.

## Next Steps After Approval
- Update `Program/presentation/ids.py` with reserved IDs.
- Extend `Program/presentation/layout.py` to include the new panel structure and placeholder tree view.
- Ensure the panel uses data from stores once callbacks are implemented.
- Document any TODOs for future enhancements (search bar, tags) inside the panel layout.

## Development Checklist (AI <-> Human)
- AI shares a high-level wireframe of tree navigation, chart list, and save form.
- Human signs off on component IDs, layout sections, and placeholder elements prior to implementation.
- AI requests styling guidance (inline vs. CSS) before modifying layout.py.



