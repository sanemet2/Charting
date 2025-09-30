# frontend/controllers.py
# -----------------------------------------------------------------------------
# PURPOSE:
# Orchestrate backend calls using validated inputs.
# - fetch_single_series(params): Open a Bloomberg session, resolve fields,
#   fetch historical data, convert to DataFrame, and return a FetchResult.
# - compute_custom_index(...): Stub for future work.
#
# DESIGN:
# - Pure Python (no Streamlit). Safe to reuse from Dash or CLI.
# - Keeps backend/transport details out of the UI layer.
# - LIVE UPDATE TEST: This comment was added to test the dynamic visualizer! [ROUND 3]
# -----------------------------------------------------------------------------

from __future__ import annotations
from typing import Sequence
import pandas as pd

from service.types import FetchParams, FetchResult

# Backend imports - using configuration system for mock/real Bloomberg switching
from data.config import BloombergSessionFactory, BloombergDataFetcherFactory
from data.bloomberg_fields import resolve_fields
from data.data_transformers import to_dataframe, add_monthly_change_native, add_monthly_change_percentage


def fetch_single_series(params: FetchParams) -> FetchResult:
    """
    Fetch a single-ticker time series for one or more fields.

    Parameters
    ----------
    params : FetchParams
        Normalized inputs:
        - ticker (str)
        - start_yyyymmdd (str, "YYYYMMDD")
        - end_yyyymmdd (str, "YYYYMMDD")
        - periodicity (Literal["DAILY","WEEKLY","MONTHLY","QUARTERLY","YEARLY"])
        - field_group (str)

    Returns
    -------
    FetchResult
        {
            "df": pd.DataFrame,
            "y_fields": list[str],   # keep list for future multi-series support
            "ticker": str
        }
    """
    # Open/close Bloomberg session safely (automatically uses mock or real based on config)
    with BloombergSessionFactory() as session:
        fetcher = BloombergDataFetcherFactory(session=session, periodicity=params["periodicity"])

        # Resolve the field group (e.g., "px_last" -> ["PX_LAST"])
        fields: Sequence[str] = resolve_fields(params["field_group"])

        if not fields:
            raise ValueError(f"No fields resolved for field_group='{params['field_group']}':")

        # IMPORTANT: backend expects start_date/end_date keywords (strings "YYYYMMDD"),
        # matching your previously working code.
        rows = fetcher.fetch_historical(
            ticker=params["ticker"],
            fields=fields,
            start_date=params["start_yyyymmdd"],
            end_date=params["end_yyyymmdd"],
        )

    # Convert to a DataFrame using your backend helper.
    # Your working app passed (rows, fields), so we align with that signature.
    df = to_dataframe(rows, fields)

    # Apply transformations if requested
    transformation = params.get("transformation", {"enabled": False})
    if transformation.get("enabled", False):
        months = transformation.get("months", 6)
        change_type = transformation.get("type", "percentage")
        align = transformation.get("align", "asof")
        
        if change_type == "percentage":
            df = add_monthly_change_percentage(df, fields, months, align)
            # Return ONLY the transformed fields, not the original ones
            all_fields = [f"{f}_Mo{months}_pct" for f in fields]
        else:  # absolute
            df = add_monthly_change_native(df, fields, months, align)
            # Return ONLY the transformed fields, not the original ones
            all_fields = [f"{f}_Mo{months}_abs" for f in fields]
    else:
        # No transformation - return original fields
        all_fields = list(fields)

    # Return as a structured result
    return {
        "df": df,
        "y_fields": all_fields,   # includes transformed fields if enabled
        "ticker": params["ticker"],
    }


# -- Multi-Series Support: DataFrame Merging Helper --------------------------

def merge_series_dataframes(series_dict: dict) -> tuple[pd.DataFrame, list[str]]:
    """
    Combine multiple series DataFrames into one chart-ready DataFrame.
    
    Parameters
    ----------
    series_dict : dict
        Dictionary of series data with structure:
        {
            "series_id": {
                "df": pd.DataFrame,
                "ticker": str, 
                "y_fields": list[str]
            }
        }
        
    Returns
    -------
    tuple[pd.DataFrame, list[str]]
        Combined DataFrame and list of all field names for charting
    """
    if not series_dict:
        return pd.DataFrame(), []
    
    all_dfs = []
    all_fields = []
    
    for series_id, series_data in series_dict.items():
        df = series_data["df"].copy()
        ticker = series_data["ticker"]
        original_fields = series_data["y_fields"]
        
        # Rename columns to avoid conflicts: PX_LAST → AAPL_PX_LAST  
        renamed_cols = {}
        for col in original_fields:
            if col in df.columns:
                new_name = f"{ticker}_{col}"
                renamed_cols[col] = new_name
                all_fields.append(new_name)
        
        if renamed_cols:
            df = df.rename(columns=renamed_cols)
            all_dfs.append(df[list(renamed_cols.values())])  # Only include renamed columns
    
    if not all_dfs:
        return pd.DataFrame(), []
    
    # Inner join on date index to only use overlapping date ranges
    # This prevents mixing different historical periods and eliminates NaN-heavy DataFrames
    combined = pd.concat(all_dfs, axis=1, join='inner', sort=True)
    return combined, all_fields


# -- Future: Custom Index controller (stub only) ------------------------------

def compute_custom_index(
    *,
    data_sources: dict[str, str],   # e.g., {"TENY": "USGG10YR Index::PX_LAST"}
    formula: str,
    index_name: str,
    expected_periodicity: str | None = None,
    cross_align: str = "exact",
    cross_align_tolerance: str | None = "auto",
) -> pd.DataFrame:
    """
    Stub for computing a custom index from multiple series.
    Will be implemented later.
    """
    raise NotImplementedError("compute_custom_index(...) is not implemented yet.")
