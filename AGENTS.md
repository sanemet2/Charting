# Repository Guidelines

## Project Structure & Module Organization
- `Program/app.py` exposes the Dash entrypoint (`app.server` for WSGI) and delegates to `Program/presentation/app_dash.py`.
- `Program/data/` wraps Bloomberg sessions, mocks, and native-frequency Pandas transformers only.
- `Program/service/` owns validation/controllers; treat it as the pure orchestration layer for UIs.
- `Program/presentation/` contains Dash layout, callbacks, and chart utilities; keep component IDs in `Program/presentation/ids.py`.
- Stage tests under `Diagnostics/tests/` mirroring module names and stash large payloads in `Diagnostics/tests/fixtures/`.

## Build, Test, and Development Commands
- `python Program/app.py` launches the Dash dev server with hot reload (logs written to `Diagnostics/logs/`).
- `python "Program/data/config.py"` reports whether the mock or real Bloomberg stack is active.
- `python "Program/data/mock_data_fetcher.py"` smoke-tests deterministic sample series generation.
- `python -m pytest Diagnostics/tests` executes the suite; append `-k <pattern>` to focus on specific modules.

## Coding Style & Naming Conventions
- Target Python 3.10+, four-space indents, snake_case for functions/vars, PascalCase for classes, and UPPER_CASE constants.
- Format with `black` (88 columns) and lint with `ruff`; keep intentional deviations documented inline.
- Type-annotate public functions and isolate direct Bloomberg calls inside `Program/data/` for testability.

## Testing Guidelines
- Use `pytest` with files named `Diagnostics/tests/test_<module>.py` (or nested packages) and functions `test_<behavior>`.
- Prefer the mock fetcher (`Program.data.mock_data_fetcher.MockBloombergDataFetcher`) or saved fixtures over live Bloomberg calls.
- Cover validators, DataFrame transformers, and series merging logic before UI smoke tests; keep random seeds deterministic.

## Commit & Pull Request Guidelines
- Write imperative commit subjects <=72 characters (e.g., `Add Dash layout toggles`) with optional wrapped context.
- Reference issues via `Fixes #ID` or `Refs #ID`, and list manual verification steps (lint, pytest, Dash run) in PR descriptions.
- Include summary bullets, testing notes, and screenshots or JSON snippets for user-facing changes before requesting review.

## Environment & Configuration
- Default to the mock stack; toggle via `USE_MOCK_BLOOMBERG` (true/false) and ensure `blpapi` is installed before enabling real sessions.
- Keep secrets and credentials out of source control; rely on environment variables or ignored local config files.
