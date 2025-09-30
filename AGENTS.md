# Repository Guidelines

## Project Structure & Module Organization
- `app.py` exposes the Dash entrypoint (`app.server` for WSGI) at repo root.
- `data/` wraps Bloomberg sessions, mocks, and native-frequency Pandas transformers only.
- `service/` owns validation/controllers; treat it as the pure orchestration layer for UIs.
- `presentation/` contains Dash layout, callbacks, and chart utilities; keep component IDs in `presentation/ids.py`.
- Stage tests under `tests/` mirroring module names and stash large payloads in `tests/fixtures/`.

## Build, Test, and Development Commands
- `python app.py` launches the Dash dev server with hot reload.
- `python "data/config.py"` reports whether the mock or real Bloomberg stack is active.
- `python "data/mock_data_fetcher.py"` smoke-tests deterministic sample series generation.
- `pytest` (once implemented) executes the suite; append `-k <pattern>` to focus on specific modules.

## Coding Style & Naming Conventions
- Target Python 3.10+, four-space indents, snake_case for functions/vars, PascalCase for classes, and UPPER_CASE constants.
- Format with `black` (88 columns) and lint with `ruff`; keep intentional deviations documented inline.
- Type-annotate public functions and isolate direct Bloomberg calls inside `data/` for testability.

## Testing Guidelines
- Use `pytest` with files named `tests/test_<module>.py` and functions `test_<behavior>`.
- Prefer the mock fetcher (`data.mock_data_fetcher.MockBloombergDataFetcher`) or saved fixtures over live Bloomberg calls.
- Cover validators, DataFrame transformers, and series merging logic before UI smoke tests; keep random seeds deterministic.

## Commit & Pull Request Guidelines
- Write imperative commit subjects <=72 characters (e.g., `Add Dash layout toggles`) with optional wrapped context.
- Reference issues via `Fixes #ID` or `Refs #ID`, and list manual verification steps (lint, pytest, Dash run) in PR descriptions.
- Include summary bullets, testing notes, and screenshots or JSON snippets for user-facing changes before requesting review.

## Environment & Configuration
- Default to the mock stack; toggle via `USE_MOCK_BLOOMBERG` (true/false) and ensure `blpapi` is installed before enabling real sessions.
- Keep secrets and credentials out of source control; rely on environment variables or ignored local config files.