# frontend/config.py
# -----------------------------------------------------------------------------
# PLAIN-ENGLISH SUMMARY
# -----------------------------------------------------------------------------
# This file is the "settings shelf" for the front end.
# - It keeps simple defaults (like the default ticker and field group).
# - It defines the allowed periodicity options (Daily/Weekly/...).
# - It defines date boundaries (min date and "today").
# - It has small feature flags (e.g., FORCE_EXPANDER) that tweak the UI look.
#
# Why this matters:
# - Putting these values in one place avoids hard-coding them across the app.
# - Streamlit and (later) Dash can both import these values, so there's no
#   framework lock-in here.
# - If you want to change defaults or turn a UI feature on/off, you do it here.
# -----------------------------------------------------------------------------

from __future__ import annotations

from datetime import date

# ---- App identity (front-end only) ------------------------------------------

APP_TITLE: str = "Bloomberg Data Viewer"


# ---- Defaults used by the Fetch panel ---------------------------------------

# Default instrument shown in the ticker input.
DEFAULT_TICKER: str = "AAPL US Equity"

# Default field group name (resolved later to actual Bloomberg fields, e.g. ["PX_LAST"]).
# Keep this in sync with whatever groups your backend exposes.
DEFAULT_FIELD_GROUP: str = "px_last"

# The "front-end default" periodicity code (what we preselect in the UI).
# NOTE: Your backend exports DEFAULT_PERIODICITY = "MONTHLY".
# We intentionally do not import the backend here (to keep this front-end module
# independent), so keep this string in sync manually if you change the backend's default.
DEFAULT_PERIODICITY_CODE: str = "MONTHLY"

# Map human-readable labels to the API codes your backend expects.
# These labels are shown in the UI; the codes are sent to the fetcher.
PERIODICITY_OPTIONS_HUMAN_TO_CODE: dict[str, str] = {
    "Daily": "DAILY",
    "Weekly": "WEEKLY",
    "Monthly": "MONTHLY",
    "Quarterly": "QUARTERLY",
    "Yearly": "YEARLY",
}


# ---- Date boundaries --------------------------------------------------------

# Absolute lower bound for dates accepted by the UI.
MIN_DATE: date = date(1900, 1, 1)

def today() -> date:
    """
    Returns today's date.
    Kept as a function to make testing/mocking easier if needed later.
    """
    return date.today()


# ---- UI feature flags -------------------------------------------------------

# When True, the Fetch/Formatting panels should use an Expander (older Streamlit style),
# even if the runtime supports popovers. This is handy for demos/tests or to keep a
# consistent look across environments.
FORCE_EXPANDER: bool = False
