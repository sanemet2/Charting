# frontend/charts.py
# -----------------------------------------------------------------------------
# PURPOSE:
# Build Plotly charts from a normalized DataFrame result.
# - Framework-agnostic: safe to reuse in Streamlit, Dash, or CLI.
# REFRESH TEST: Final test change to see dynamic architecture updates! [SET 3]
# - Multi-series ready: accepts a list of y_fields (we'll pass one for now).
#
# PUBLIC:
#   build_price_chart(
#       df, y_fields, ticker,
#       *, chart_title=None, x_label="Date", y_label=None,
#       colors=None, secondary_y=None, show_legend=True
#   ) -> go.Figure
#
# HELPERS:
#   _default_chart_title(ticker, y_fields) -> str
#   _resolve_y_label(y_label, y_fields) -> str
# -----------------------------------------------------------------------------

from __future__ import annotations

from typing import Sequence, Iterable, Optional, List, Set
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots


# ---- Helpers ----------------------------------------------------------------

def _default_chart_title(ticker: str, y_fields: Sequence[str]) -> str:
    """Default chart title like: 'AAPL US Equity — PX_LAST' or multiple fields."""
    fields_part = ",".join(y_fields) if y_fields else ""
    sep = " — " if fields_part else ""
    return f"{ticker}{sep}{fields_part}"


def _resolve_y_label(y_label: Optional[str], y_fields: Sequence[str]) -> str:
    """Prefer user-provided y_label; otherwise use joined field names."""
    y_label = (y_label or "").strip()
    if y_label:
        return y_label
    return ",".join(y_fields) if y_fields else "Value"


# ---- Main API ---------------------------------------------------------------

def build_price_chart(
    df: pd.DataFrame,
    y_fields: Sequence[str],
    ticker: str,
    *,
    chart_title: Optional[str] = None,
    x_label: str = "Date",
    y_label: Optional[str] = None,
    colors: Optional[Sequence[str]] = None,
    secondary_y: Optional[Iterable[str]] = None,
    show_legend: bool = True,
) -> go.Figure:
    """
    Build a line chart for one or more series.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame indexed by date (preferred). Columns include y_fields.
        If a 'date' column exists and index isn't datetime, we'll use that.
    y_fields : Sequence[str]
        Columns to plot (order respected).
    ticker : str
        Used for default title.
    chart_title : Optional[str]
        If None/blank, a sensible default is generated.
    x_label : str
        X axis label (default "Date").
    y_label : Optional[str]
        Y axis label; if None/blank, uses field names.
    colors : Optional[Sequence[str]]
        Optional colors (hex or CSS names). If fewer than fields, repeats.
    secondary_y : Optional[Iterable[str]]
        Iterable of field names to render on a secondary y-axis.
    show_legend : bool
        Whether to show the legend.

    Returns
    -------
    go.Figure
    """
    if df is None or df.empty:
        # Build an empty figure with a clear message (defensive)
        fig = go.Figure()
        fig.update_layout(
            title="No data",
            template="plotly_white",
            showlegend=False,
        )
        return fig

    # Choose X-axis: prefer datetime index; else a 'date' column; else index
    x = None
    try:
        # Try to use datetime-like index
        if isinstance(df.index, pd.DatetimeIndex):
            df = df.sort_index()
            x = df.index
        elif "date" in df.columns:
            # Use 'date' column if provided; ensure datetime
            df = df.sort_values("date")
            x = pd.to_datetime(df["date"])
        else:
            # Fallback: sort by index and use it
            df = df.sort_index()
            x = df.index
    except Exception:
        # Any sorting trouble -> fallback to raw order
        x = df.index if "date" not in df.columns else df["date"]

    # Normalize colors (optional)
    colors_list: List[Optional[str]] = list(colors) if colors else []
    if colors_list and len(colors_list) < len(y_fields):
        # Repeat colors if not enough provided
        times = (len(y_fields) // len(colors_list)) + 1
        colors_list = (colors_list * times)[:len(y_fields)]
    elif not colors_list:
        # Let Plotly auto-assign if none provided
        colors_list = [None] * len(y_fields)

    # Secondary axis handling
    secondary_set: Set[str] = set(secondary_y or [])
    use_secondary = any(field in secondary_set for field in y_fields)

    if use_secondary:
        fig = make_subplots(specs=[[{"secondary_y": True}]])
    else:
        fig = go.Figure()

    # Add one trace per field
    for i, field in enumerate(y_fields):
        if field not in df.columns:
            # Skip missing columns gracefully
            continue

        y = df[field]
        line_color = colors_list[i] if i < len(colors_list) else None
        on_secondary = field in secondary_set

        trace = go.Scatter(
            x=x,
            y=y,
            mode="lines",
            name=field,
            line=dict(color=line_color) if line_color else None,
        )

        if use_secondary:
            fig.add_trace(trace, secondary_y=on_secondary)
        else:
            fig.add_trace(trace)

    # Layout
    resolved_title = (chart_title or "").strip() or _default_chart_title(ticker, y_fields)
    resolved_y_label = _resolve_y_label(y_label, y_fields)

    fig.update_layout(
        title=resolved_title,
        template="plotly_white",
        showlegend=show_legend,
        margin=dict(l=50, r=30, t=60, b=40),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0),
    )

    # Axis labels
    fig.update_xaxes(title_text=(x_label or "Date"))
    if use_secondary:
        # If using secondary axis, label primary and leave secondary unlabeled unless the
        # user explicitly wants something different later (future option)
        fig.update_yaxes(title_text=resolved_y_label, secondary_y=False)
        fig.update_yaxes(title_text="", secondary_y=True)
    else:
        fig.update_yaxes(title_text=resolved_y_label)

    return fig
