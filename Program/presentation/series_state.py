from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

import pandas as pd
from io import StringIO

from Program.service.controllers import merge_series_dataframes


@dataclass
class ChartSeriesData:
    series_id: str
    ticker: str
    y_fields: List[str]
    dataframe: pd.DataFrame

    def to_store(self) -> Dict[str, object]:
        return {
            "ticker": self.ticker,
            "y_fields": list(self.y_fields),
            "df": self.dataframe.to_json(date_format="iso", orient="split"),
        }

    @classmethod
    def from_fetch_result(cls, series_id: str, result: Dict[str, object]) -> "ChartSeriesData":
        df = result.get("df")
        dataframe = df if isinstance(df, pd.DataFrame) else pd.DataFrame(df)
        return cls(
            series_id=series_id,
            ticker=str(result.get("ticker", series_id)),
            y_fields=list(result.get("y_fields", [])),
            dataframe=dataframe,
        )

    @classmethod
    def from_store(cls, series_id: str, payload: Dict[str, object]) -> "ChartSeriesData":
        df_json = payload.get("df")
        if isinstance(df_json, str) and df_json:
            try:
                dataframe = pd.read_json(StringIO(df_json), orient="split")
            except ValueError:
                dataframe = pd.DataFrame()
        else:
            dataframe = pd.DataFrame()
        ticker = str(payload.get("ticker", series_id))
        y_fields = list(payload.get("y_fields", []))
        return cls(series_id=series_id, ticker=ticker, y_fields=y_fields, dataframe=dataframe)


@dataclass
class CombinedSeriesData:
    dataframe: pd.DataFrame
    y_fields: List[str]
    ticker_label: str
    series_field_map: Dict[str, List[str]]

    def to_store(self) -> Dict[str, object]:
        if self.dataframe.empty:
            df_json: str | None = None
        else:
            df_json = self.dataframe.to_json(date_format="iso", orient="split")
        return {
            "df": df_json,
            "y_fields": list(self.y_fields),
            "ticker_label": self.ticker_label,
            "series_field_map": self.series_field_map,
        }

    @classmethod
    def empty(cls) -> "CombinedSeriesData":
        return cls(pd.DataFrame(), [], "", {})


def build_series_options(series_store: Dict[str, Dict[str, object]]) -> List[Dict[str, str]]:
    options: List[Dict[str, str]] = []
    for series_id, payload in series_store.items():
        ticker = str(payload.get("ticker", series_id))
        fields = payload.get("y_fields", [])
        fields_label = ", ".join(fields) if fields else "No fields"
        options.append({"label": f"{ticker} - {fields_label}", "value": series_id})
    return options


def build_combined_series(series_store: Dict[str, Dict[str, object]]) -> CombinedSeriesData:
    if not series_store:
        return CombinedSeriesData.empty()

    payloads: Dict[str, ChartSeriesData] = {
        series_id: ChartSeriesData.from_store(series_id, payload)
        for series_id, payload in series_store.items()
    }

    combined_df, all_fields = merge_series_dataframes(
        {
            series_id: {
                "df": data.dataframe,
                "ticker": data.ticker,
                "y_fields": data.y_fields,
            }
            for series_id, data in payloads.items()
        }
    )

    available_columns = set(combined_df.columns)
    series_field_map: Dict[str, List[str]] = {}
    ticker_names: List[str] = []

    for series_id, data in payloads.items():
        ticker_names.append(data.ticker)
        renamed: List[str] = []
        for field in data.y_fields:
            candidate = f"{data.ticker}_{field}"
            if candidate in available_columns:
                renamed.append(candidate)
        series_field_map[series_id] = renamed

    ticker_label = " + ".join(sorted({name for name in ticker_names if name}))

    return CombinedSeriesData(
        dataframe=combined_df,
        y_fields=all_fields,
        ticker_label=ticker_label,
        series_field_map=series_field_map,
    )


def normalize_selection(series_store: Dict[str, Dict[str, object]], selection: List[str] | None) -> List[str]:
    selection = selection or []
    return [item for item in selection if item in series_store]



