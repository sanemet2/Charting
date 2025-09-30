# Documentation & Launch Prep Plan

## Intent
- Capture final documentation, testing, and release tasks for the chart library feature.
- Ensure contributors understand new workflows, IDs, and verification steps.
- Prepare for integration into main branch with minimal friction.

## Target Artifacts
- `AGENTS.md`
- `README` or project-level documentation (if applicable)
- `Where We Are At.txt` (milestone updates)
- Test suite (`tests/`)
- Release/launch checklist (ad hoc)

## Key Work Items
1. Documentation Updates
   - Document new stores, callbacks, and usage instructions in `AGENTS.md`.
   - Add overview of chart library feature, including save/load workflow and known limitations.
   - Link to planning docs (`docs/chart_library/`) for future maintenance.

2. Test Coverage Verification
   - Ensure service layer, adapters, and callbacks have unit tests per earlier sections.
   - Add integration/manual test checklist to repo (e.g., `docs/chart_library/verification_checklist.md`).
   - Verify all tests pass locally (`pytest`).

3. Linting & Formatting
   - Run `black` and `ruff` on modified modules.
   - Update CI configuration if new paths need inclusion.

4. Release Notes
   - Summarize changes for PR/commit messages (highlight new feature, UI additions, tests).
   - Update `Where We Are At.txt` with concise milestone bullet(s).

5. Manual Verification
   - Follow checklist: load UI, save chart, load, delete, move, handle errors, confirm toasts.
   - Capture screenshots or JSON snapshots if needed for documentation.

## Dependencies & Prep
- All implementation steps (Sections 4–8) completed and tested.
- Planning docs reviewed/updated with final decisions.
- Ensure environment ready for end-to-end verification (data mocks available).

## Outstanding Questions
- Do we need to produce a screencast or step-by-step tutorial for end users?
- Should manual verification results be stored in repo (e.g., `docs/chart_library/verification_logs/`)?

## Next Steps After Approval
- Answer outstanding questions and document final decisions here.
- Create/update documentation files and verification checklist.
- Run lint/tests, record results, and update roadmap/status.
- Prepare PR summary and milestone entry.

## Development Checklist (AI <-> Human)
- AI presents final documentation/testing tasks for sign-off.
- Human specifies which artifacts (checklist, screenshots, milestone notes) are required before release.
- AI runs lint/tests, shares results, and awaits explicit approval before closing the feature.
