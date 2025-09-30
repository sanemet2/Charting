# frontend/validators.py
# ---------------------------------------------------------------------
# PURPOSE:
# Pure validation + normalization of user inputs from the front-end.
# ARCHITECTURE TEST: Another change to test the dynamic visualizer! [BATCH 3]
# - Dates: "", "YYYY-MM-DD", or "YYYYMMDD"; coerced to "YYYYMMDD"
# - Periodicity: human label ("Monthly") or code ("MONTHLY"); coerced to code
# - Ticker: required
# - Start ≤ End
# - Collects ALL errors and returns them together (no fail-fast).
# ---------------------------------------------------------------------

from __future__ import annotations
from datetime import date, datetime
from typing import Tuple, Optional, List, Dict
from service.types import (
    PeriodicityCode,
    RawFetchInputs,
    FetchParams,
    ErrorItem,
)

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------
def _parse_strict_date(text: str) -> date:
    """
    Parse a date string that is either YYYY-MM-DD or YYYYMMDD.
    Raises ValueError if parsing fails.
    """
    if "-" in text:
        return datetime.strptime(text, "%Y-%m-%d").date()
    return datetime.strptime(text, "%Y%m%d").date()

# ---------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------
def parse_date_text(
    text: str,
    *,
    min_date: date,
    max_date: date,
    default_if_blank: date,
) -> Tuple[Optional[str], List[ErrorItem]]:
    """
    Parse a user-entered date string.
    Returns (YYYYMMDD | None, [ErrorItem]).

    Behavior:
    - If blank -> use default_if_blank (then bounds-checked).
    - If invalid format -> return (None, [invalid_format]).
    - If out of [min_date, max_date] -> return normalized string + [out_of_bounds].
    """
    text = (text or "").strip()
    errors: List[ErrorItem] = []

    # Default when blank
    if not text:
        dt = default_if_blank
    else:
        try:
            dt = _parse_strict_date(text)
        except ValueError:
            return None, [{
                "field": "date",
                "code": "invalid_format",
                "message": "Use YYYY-MM-DD or YYYYMMDD.",
            }]

    # Bounds check (still return normalized date so caller can show both errors)
    if dt < min_date or dt > max_date:
        errors.append({
            "field": "date",
            "code": "out_of_bounds",
            "message": f"Date must be between {min_date} and {max_date}.",
        })

    return dt.strftime("%Y%m%d"), errors


def normalize_periodicity_code(
    value: str,
    *,
    human_to_code: Dict[str, str],
    default_code: PeriodicityCode,
) -> Tuple[Optional[PeriodicityCode], List[ErrorItem]]:
    """
    Normalize periodicity to canonical backend code.
    Accepts:
    - "" -> default_code
    - Human label (case-insensitive), e.g. "Monthly"
    - Code (any case), e.g. "monthly" -> "MONTHLY"
    Unknown values produce an error and return None.
    """
    value = (value or "").strip()
    errors: List[ErrorItem] = []

    # Blank -> default
    if not value:
        return default_code, []

    # Already looks like a code?
    upper = value.upper()
    valid_codes = {code.upper() for code in human_to_code.values()}
    if upper in valid_codes:
        return upper, []

    # Try match by human label (case-insensitive)
    for label, code in human_to_code.items():
        if value.lower() == label.lower():
            return code, []

    errors.append({
        "field": "periodicity",
        "code": "unknown_value",
        "message": f"Unknown periodicity: '{value}'",
    })
    return None, errors


def validate_ticker_nonempty(ticker: str) -> List[ErrorItem]:
    """Ticker must be a non-empty string."""
    if (ticker or "").strip():
        return []
    return [{
        "field": "ticker",
        "code": "required",
        "message": "Ticker is required.",
    }]


def validate_date_order(
    start_yyyymmdd: str,
    end_yyyymmdd: str,
) -> List[ErrorItem]:
    """
    Ensure start ≤ end. Since both are YYYYMMDD strings,
    lexicographic comparison works.
    """
    if start_yyyymmdd <= end_yyyymmdd:
        return []
    return [{
        "field": "date_range",
        "code": "start_after_end",
        "message": "Start date must be before or equal to end date.",
    }]


def validate_fetch_inputs(
    raw: RawFetchInputs,
    *,
    min_date: date,
    max_date: date,
    human_to_code: Dict[str, str],
    default_code: PeriodicityCode,
) -> Tuple[Optional[FetchParams], List[ErrorItem]]:
    """
    Validate and normalize the full set of fetch inputs.
    Returns (FetchParams | None, [ErrorItem]).
    """
    errors: List[ErrorItem] = []

    # Ticker
    ticker_errors = validate_ticker_nonempty(raw.get("ticker", ""))
    errors.extend(ticker_errors)

    # Dates
    start_str, start_errors = parse_date_text(
        raw.get("start_text", ""),
        min_date=min_date,
        max_date=max_date,
        default_if_blank=min_date,
    )
    # Re-tag field for clarity in UI
    for e in start_errors:
        e["field"] = "start_date"
    errors.extend(start_errors)

    end_str, end_errors = parse_date_text(
        raw.get("end_text", ""),
        min_date=min_date,
        max_date=max_date,
        default_if_blank=max_date,
    )
    for e in end_errors:
        e["field"] = "end_date"
    errors.extend(end_errors)

    # Date order (only if both parsed)
    if start_str and end_str:
        errors.extend(validate_date_order(start_str, end_str))

    # Periodicity
    periodicity, per_errors = normalize_periodicity_code(
        raw.get("periodicity", ""),
        human_to_code=human_to_code,
        default_code=default_code,
    )
    errors.extend(per_errors)

    # Field group
    field_group = (raw.get("field_group", "") or "").strip()
    if not field_group:
        errors.append({
            "field": "field_group",
            "code": "required",
            "message": "Field group is required.",
        })

    # Transformation options (always valid since they have defaults)
    transformation = raw.get("transformation", {"enabled": False})
    
    # If any errors, stop here
    if errors:
        return None, errors

    # Success: build normalized params
    params: FetchParams = {
        "ticker": raw["ticker"].strip(),
        "start_yyyymmdd": start_str,   # type: ignore[arg-type]
        "end_yyyymmdd": end_str,       # type: ignore[arg-type]
        "periodicity": periodicity,    # type: ignore[arg-type]
        "field_group": field_group,
        "transformation": transformation,  # type: ignore[arg-type]
    }
    return params, []
