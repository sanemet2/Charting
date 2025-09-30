# transformation.py
"""
Native-frequency Pandas transformations for N-month lookbacks.

This module:
- Converts Bloomberg list-of-dicts rows into a typed, datetime-indexed DataFrame.
- Computes N-month changes at the *native* cadence (no resampling).
  * Percent change: FIELD_Mo{N}
  * Absolute delta: FIELD_Mo{N}_abs

Design principles:
- Library functions return structured data; they never print/log.
- Keep implementations simple and beginner-friendly with clear comments.
- The source of truth for cadence/frequency is the Bloomberg request used to fetch the data.
"""

from __future__ import annotations

from typing import List
import numpy as np
import pandas as pd


def to_dataframe(rows: List[dict], fields: List[str], date_col: str = "date") -> pd.DataFrame:
    """
    Convert Bloomberg 'rows' (list of dicts) into a datetime-indexed DataFrame.
    
    Parameters
    ----------
    rows : list[dict]
        Output from BloombergDataFetcher.fetch_historical(...).
        Expected keys include a date column (default 'date') and numeric field names.
    fields : list[str]
        Field names expected to be numeric (e.g., ["PX_LAST", "VOLUME"]).
    date_col : str, default "date"
        Name of the timestamp column in each row.
        
    Returns
    -------
    pd.DataFrame
        - DatetimeIndex named 'date', sorted ascending.
        - Contains all requested 'fields' as float columns (coerced to numeric).
        - Non-field columns are preserved as-is.
        - If duplicate timestamps exist, the last observation per timestamp is kept.
        - If rows is empty, returns an empty DataFrame with requested fields.
        
    Raises
    ------
    ValueError
        If the date column is missing.
    """
    # Handle empty input early
    if not rows:
        empty_idx = pd.DatetimeIndex([], name="date")
        # Build an empty frame that still exposes requested numeric fields as float
        df_empty = pd.DataFrame(index=empty_idx)
        for f in fields:
            df_empty[f] = pd.Series(dtype="float64")
        return df_empty
    
    df = pd.DataFrame(rows)
    
    if date_col not in df.columns:
        raise ValueError(f"date column '{date_col}' not found in rows")
    
    # Coerce date column to datetime (tz-naive)
    date_series = pd.to_datetime(df[date_col], errors="coerce")
    # If timezone-aware slipped in, strip tz to keep naive alignment
    if hasattr(date_series.dt, "tz_localize"):
        try:
            date_series = date_series.dt.tz_localize(None)
        except TypeError:
            # Already tz-naive; nothing to do
            pass
    
    # Remove rows with invalid dates
    df = df.loc[~date_series.isna()].copy()
    df.index = pd.DatetimeIndex(date_series[~date_series.isna()], name="date")
    
    # Drop the original date column if present as a column
    if date_col in df.columns:
        df.drop(columns=[date_col], inplace=True, errors="ignore")
    
    # Sort ascending to ensure time order
    df.sort_index(inplace=True)
    
    # Safety: if duplicate timestamps exist (rare for clean historical data),
    # keep the last occurrence to get a unique, deterministic index.
    if df.index.has_duplicates:
        df = df[~df.index.duplicated(keep="last")]
    
    # Ensure all requested numeric fields exist and are coerced to float
    for f in fields:
        if f not in df.columns:
            df[f] = np.nan
        df[f] = pd.to_numeric(df[f], errors="coerce")
    
    return df


def _resolve_previous_values(
    index: pd.DatetimeIndex,
    values: pd.Series,
    months: int,
    align: str,
) -> pd.Series:
    """
    Internal helper: for each timestamp t in `index`, find the value at (t - months)
    according to the alignment policy.

    Parameters
    ----------
    index : pd.DatetimeIndex
        The current timestamps (sorted ascending, unique).
    values : pd.Series
        Numeric series aligned with `index` (same index), sorted ascending.
    months : int
        Number of calendar months to look back.
    align : {"asof", "exact", "forward"}
        - "exact"   : require an exact timestamp match; else NaN
        - "asof"    : use the nearest prior observation when no exact match exists
        - "forward" : use the nearest next observation when no exact match exists

    Returns
    -------
    pd.Series
        Previous values aligned to `index` (same index).
    """
    if months < 1 or not isinstance(months, int):
        raise ValueError("months must be a positive integer")
    if align not in {"asof", "exact", "forward"}:
        raise ValueError("align must be one of {'asof', 'exact', 'forward'}")

    target_idx = index - pd.DateOffset(months=months)

    # Ensure monotonic ascending (should already be true)
    if not index.is_monotonic_increasing:
        values = values.sort_index()
        index = values.index
        target_idx = index - pd.DateOffset(months=months)

    exact_prev = values.reindex(target_idx)

    if align == "exact":
        return pd.Series(exact_prev.values, index=index, name=values.name)

    needs_fallback = exact_prev.isna()
    if needs_fallback.any():
        left = pd.DataFrame({"_t": target_idx[needs_fallback]})
        right = pd.DataFrame({"_r": index, "_val": values.values})
        direction = "backward" if align == "asof" else "forward"
        merged = pd.merge_asof(
            left,
            right,
            left_on="_t",
            right_on="_r",
            direction=direction,
        )
        exact_prev.loc[needs_fallback] = merged["_val"].values

    return pd.Series(exact_prev.values, index=index, name=values.name)


def add_monthly_change_native(
    df: pd.DataFrame,
    fields: List[str],
    months: int,
    align: str = "asof",
) -> pd.DataFrame:
    """
    Add N-month percent change columns at the *native* input cadence.
    
    For each timestamp t, compares FIELD(t) to FIELD(t - N months) using the chosen alignment:
    - align="asof"    (default): nearest PRIOR observation to (t - N months)
    - align="exact"             : only if an exact timestamp exists; else NaN
    - align="forward"           : nearest NEXT observation after (t - N months)
    
    Column naming: FIELD_Mo{N}, e.g., PX_LAST_Mo6
    
    Parameters
    ----------
    df : pd.DataFrame
        Datetime-indexed, ascending DataFrame containing the requested fields.
    fields : list[str]
        Numeric field names to transform.
    months : int
        N-month lookback (positive integer).
    align : {"asof", "exact", "forward"}, default "asof"
        Alignment policy for the previous value at (t - N months).
        
    Returns
    -------
    pd.DataFrame
        A new DataFrame with additional absolute-delta columns (FIELD_Mo{N}_abs).
        
    Notes
    -----
    - Original columns are preserved.
    - No printing/logging in this function.
    """
    if not isinstance(df.index, pd.DatetimeIndex):
        raise ValueError("DataFrame index must be a DatetimeIndex")
    if not df.index.is_monotonic_increasing:
        df = df.sort_index()
    
    out = df.copy()
    
    for f in fields:
        if f not in out.columns:
            out[f] = np.nan
        s = pd.to_numeric(out[f], errors="coerce")
        
        prev = _resolve_previous_values(out.index, s, months=months, align=align)
        
        # Absolute delta: curr - prev
        delta = s.subtract(prev)
        
        out[f"{f}_Mo{months}_abs"] = delta
    
    return out


def add_monthly_change_percentage(
    df: pd.DataFrame,
    fields: List[str],
    months: int,
    align: str = "asof",
) -> pd.DataFrame:
    """
    Add N-month percentage change columns at the native input cadence.
    
    For each timestamp t, calculates: ((current - previous) / previous) * 100
    Column naming: FIELD_Mo{N}_pct, e.g., PX_LAST_Mo6_pct
    
    Parameters
    ----------
    df : pd.DataFrame
        Datetime-indexed, ascending DataFrame containing the requested fields.
    fields : list[str]
        Numeric field names to transform.
    months : int
        N-month lookback (positive integer).
    align : {"asof", "exact", "forward"}, default "asof"
        Alignment policy for the previous value at (t - N months).
        
    Returns
    -------
    pd.DataFrame
        A new DataFrame with additional percentage change columns (FIELD_Mo{N}_pct).
    """
    if not isinstance(df.index, pd.DatetimeIndex):
        raise ValueError("DataFrame index must be a DatetimeIndex")
    if not df.index.is_monotonic_increasing:
        df = df.sort_index()
    
    out = df.copy()
    
    for f in fields:
        if f not in out.columns:
            out[f] = np.nan
        s = pd.to_numeric(out[f], errors="coerce")
        
        prev = _resolve_previous_values(out.index, s, months=months, align=align)
        
        # Percentage change: ((current - previous) / previous) * 100
        # Handle division by zero
        pct_change = ((s - prev) / prev) * 100
        pct_change = pct_change.replace([np.inf, -np.inf], np.nan)
        
        out[f"{f}_Mo{months}_pct"] = pct_change
    
    return out

