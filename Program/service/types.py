# frontend/types.py
# -----------------------------------------------------------------------------
# PLAIN-ENGLISH SUMMARY
# -----------------------------------------------------------------------------
# This file defines simple "shapes" (types) for the dictionaries our front end
# passes around. Think of them as labels on boxes so everyone knows what's
# inside:
#
# - RawFetchInputs: What the UI panel collects (free-form text inputs).
# - FetchParams:    The cleaned/normalized inputs the controller needs.
# - ChartOptions:   Optional chart labels the user can set.
# - ErrorItem:      One validation error (which field, what went wrong).
# - FetchResult:    What comes back from the controller (data + context).
#
# Why this matters:
# - Functions can declare exactly what they take and return, making the code
#   easier to read and change.
# - These types are plain Python (no Streamlit), so Dash can reuse them later.
# -----------------------------------------------------------------------------

from __future__ import annotations

from typing import TypedDict, Literal, NotRequired, Sequence, Optional
import pandas as pd


# ---- Common literals --------------------------------------------------------

# Canonical periodicity codes expected by the backend/controller.
PeriodicityCode = Literal["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]


# ---- Inputs collected directly from the UI panel (pre-validation) -----------

class TransformationOptions(TypedDict, total=False):
    """
    Data transformation settings from the UI.
    """
    enabled: bool
    months: int         # Lookback period (1, 3, 6, 12, etc.)
    type: str          # "absolute" or "percentage"
    align: str         # "asof", "exact", or "forward"

class RawFetchInputs(TypedDict, total=False):
    """
    What the UI collects before validation/normalization.
    - Dates are free-form text (can be blank).
    - 'periodicity' may be a human label ("Monthly") or a code ("MONTHLY").
    """
    ticker: str
    start_text: str     # e.g., "2020-01-01", "20200101", or ""
    end_text: str       # e.g., "2024-12-31", "20241231", or ""
    periodicity: str    # human label or code; validators will normalize
    field_group: str    # e.g., "px_last"
    transformation: TransformationOptions  # transformation settings


# ---- Normalized parameters (post-validation) --------------------------------

class FetchParams(TypedDict):
    """
    Clean, ready-for-backend parameters after validation:
    - Dates are YYYYMMDD (strings).
    - Periodicity is one of the fixed backend codes (DAILY/WEEKLY/...).
    """
    ticker: str
    start_yyyymmdd: str
    end_yyyymmdd: str
    periodicity: PeriodicityCode
    field_group: str
    transformation: TransformationOptions


# ---- Chart options (optional, user-facing labels) ---------------------------

class ChartOptions(TypedDict, total=False):
    """
    Optional labels for the rendered chart.
    - If omitted/empty, the chart function can auto-pick sensible defaults.
    """
    chart_title: Optional[str]
    x_label: str
    y_label: Optional[str]


# ---- Validation error item --------------------------------------------------

class ErrorItem(TypedDict):
    """
    One validation error to display in the UI.
    - 'field': which input field the error relates to (e.g., "start_date").
    - 'code':  a short machine-friendly tag (e.g., "invalid_format").
    - 'message': user-friendly explanation for display.
    """
    field: str
    code: str
    message: str


# ---- Controller result ------------------------------------------------------

class FetchResult(TypedDict):
    """
    Result returned by the controller after a successful fetch:
    - 'df':       Pandas DataFrame indexed by date, with one or more value columns.
    - 'y_fields': The columns to plot (a list). For now this will usually be a
                  single item like ["PX_LAST"], but we keep it list-based so we
                  can show multiple series later without changing interfaces.
    - 'ticker':   The ticker actually fetched (echoed back for chart titles, etc.).
    """
    df: "pd.DataFrame"
    y_fields: Sequence[str]
    ticker: str


# ---- Optional export control ------------------------------------------------

__all__ = [
    "PeriodicityCode",
    "TransformationOptions",
    "RawFetchInputs",
    "FetchParams",
    "ChartOptions",
    "ErrorItem",
    "FetchResult",
]


