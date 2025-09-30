from __future__ import annotations

from typing import Dict, List

from dash import Dash, Input, Output, State, ctx, no_update
import pandas as pd
from io import StringIO

from presentation import ids
from presentation.layout import CHART_CONTAINER_STYLE, PANEL_STYLE, TRANSFORM_TYPE_OPTIONS, build_layout, default_periodicity_label
from presentation import charts
from presentation.series_state import (
    ChartSeriesData,
    build_combined_series,
    build_series_options,
    normalize_selection,
)
from presentation import ui_feedback
from presentation.config import (
    APP_TITLE,
    DEFAULT_FIELD_GROUP,
    DEFAULT_PERIODICITY_CODE,
    MIN_DATE,
    PERIODICITY_OPTIONS_HUMAN_TO_CODE,
    today,
)
from service import controllers, validators
from service.types import FetchResult, RawFetchInputs

FETCH_MODE_REPLACE = "Replace Chart"
FETCH_MODE_ADD = "Add to Chart"


def _build_series_id(result: FetchResult, params: Dict[str, object]) -> str:
    field_group = params.get("field_group", "")
    parts = [result.get("ticker", "series"), field_group]
    start = params.get("start_yyyymmdd") or params.get("start_text")
    end = params.get("end_yyyymmdd") or params.get("end_text")
    periodicity = params.get("periodicity")
    transformation = params.get("transformation")
    for value in (start, end, periodicity):
        if value:
            parts.append(str(value))
    if isinstance(transformation, dict) and transformation.get("enabled"):
        parts.append(f"xfm:{transformation.get('type','')}-{transformation.get('months','')}-{transformation.get('align','')}")
    return "::".join(str(part) for part in parts if part)


def _serialize_result(series_id: str, result: FetchResult) -> ChartSeriesData:
    return ChartSeriesData.from_fetch_result(series_id, result)


def _build_raw_inputs(
    *,
    ticker: str,
    start_text: str,
    end_text: str,
    periodicity_value: str,
    field_group: str,
    transform_enabled: bool,
    transform_months: int,
    transform_type: str,
    transform_align: str,
) -> RawFetchInputs:
    raw_inputs: RawFetchInputs = {
        "ticker": (ticker or "").strip(),
        "start_text": (start_text or "").strip(),
        "end_text": (end_text or "").strip(),
        "periodicity": (periodicity_value or default_periodicity_label()),
        "field_group": (field_group or DEFAULT_FIELD_GROUP).strip(),
        "transformation": {"enabled": False},
    }
    if transform_enabled:
        raw_inputs["transformation"] = {
            "enabled": True,
            "months": int(transform_months or 6),
            "type": (transform_type or "percentage").lower(),
            "align": (transform_align or "asof").lower(),
        }
    return raw_inputs


def create_dash_app() -> Dash:
    app = Dash(__name__)
    app.title = APP_TITLE
    app.layout = build_layout()

    @app.callback(
        Output(ids.FETCH_PANEL_CONTAINER, "style"),
        Output(ids.FETCH_PANEL_TOGGLE_BUTTON, "children"),
        Input(ids.FETCH_PANEL_TOGGLE_BUTTON, "n_clicks"),
    )
    def toggle_fetch_panel(n_clicks: int):
        is_open = bool(n_clicks and n_clicks % 2 == 1)
        panel_style = dict(PANEL_STYLE)
        if not is_open:
            panel_style["display"] = "none"
            return panel_style, "Open Fetch Data"
        return panel_style, "Close Fetch Data"

    @app.callback(
        Output(ids.FORMAT_PANEL_CONTAINER, "style"),
        Output(ids.FORMAT_PANEL_TOGGLE_BUTTON, "children"),
        Input(ids.FORMAT_PANEL_TOGGLE_BUTTON, "n_clicks"),
    )
    def toggle_format_panel(n_clicks: int):
        is_open = bool(n_clicks and n_clicks % 2 == 1)
        panel_style = dict(PANEL_STYLE)
        if not is_open:
            panel_style["display"] = "none"
            return panel_style, "Open Chart Formatting"
        return panel_style, "Close Chart Formatting"

    @app.callback(
        Output(ids.CHART_SERIES_STORE, "data"),
        Output(ids.COMBINED_DATA_STORE, "data"),
        Output(ids.MESSAGE_CONTAINER, "children"),
        Output(ids.SERIES_REMOVE_DROPDOWN, "value"),
        Output(ids.SERIES_REMOVE_DROPDOWN, "options"),
        Output(ids.SERIES_RIGHT_AXIS_DROPDOWN, "value"),
        Output(ids.SERIES_RIGHT_AXIS_DROPDOWN, "options"),
        Output(ids.SERIES_SUMMARY, "children"),
        Input(ids.FETCH_BUTTON, "n_clicks"),
        Input(ids.REMOVE_SERIES_BUTTON, "n_clicks"),
        Input(ids.CLEAR_ALL_BUTTON, "n_clicks"),
        State(ids.FETCH_MODE_RADIO, "value"),
        State(ids.TICKER_INPUT, "value"),
        State(ids.START_DATE_INPUT, "value"),
        State(ids.END_DATE_INPUT, "value"),
        State(ids.PERIODICITY_DROPDOWN, "value"),
        State(ids.FIELD_GROUP_INPUT, "value"),
        State(ids.TRANSFORM_TOGGLE, "value"),
        State(ids.TRANSFORM_MONTHS, "value"),
        State(ids.TRANSFORM_TYPE, "value"),
        State(ids.TRANSFORM_ALIGN, "value"),
        State(ids.CHART_SERIES_STORE, "data"),
        State(ids.SERIES_REMOVE_DROPDOWN, "value"),
        State(ids.SERIES_RIGHT_AXIS_DROPDOWN, "value"),
        prevent_initial_call=True,
    )
    def manage_series(
        fetch_clicks: int,
        remove_clicks: int,
        clear_clicks: int,
        fetch_mode: str,
        ticker: str,
        start_text: str,
        end_text: str,
        periodicity_value: str,
        field_group: str,
        transform_toggle: List[str],
        transform_months: int,
        transform_type_value: str,
        transform_align: str,
        series_store: Dict[str, Dict[str, object]] | None,
        remove_selection: List[str] | None,
        right_axis_selection: List[str] | None,
    ):
        triggered_id = ctx.triggered_id
        series_store = dict(series_store or {})
        remove_selection = list(remove_selection or [])
        right_axis_selection = list(right_axis_selection or [])
        message_children = None

        if triggered_id == ids.FETCH_BUTTON:
            transform_enabled = "enabled" in (transform_toggle or [])
            raw_inputs = _build_raw_inputs(
                ticker=ticker,
                start_text=start_text,
                end_text=end_text,
                periodicity_value=periodicity_value,
                field_group=field_group,
                transform_enabled=transform_enabled,
                transform_months=transform_months or 6,
                transform_type=transform_type_value or "percentage",
                transform_align=transform_align or "asof",
            )
            params, errors = validators.validate_fetch_inputs(
                raw=raw_inputs,
                min_date=MIN_DATE,
                max_date=today(),
                human_to_code=PERIODICITY_OPTIONS_HUMAN_TO_CODE,
                default_code=DEFAULT_PERIODICITY_CODE,
            )
            if errors:
                message_children = ui_feedback.render_errors(errors)
            elif not params:
                message_children = ui_feedback.render_error_text("Validation failed. Please review your inputs.")
            else:
                try:
                    result: FetchResult = controllers.fetch_single_series(params)
                except Exception as exc:  # noqa: BLE001
                    message_children = ui_feedback.render_error_text(f"Error fetching data: {exc}")
                else:
                    series_id = _build_series_id(result, params)
                    series_data = _serialize_result(series_id, result)
                    payload = series_data.to_store()
                    if fetch_mode == FETCH_MODE_REPLACE:
                        series_store = {series_id: payload}
                        right_axis_selection = []
                        message_children = ui_feedback.render_success(f"Chart replaced with {series_data.ticker}.")
                    else:
                        series_store[series_id] = payload
                        message_children = ui_feedback.render_success(f"Added {series_data.ticker} to chart.")
                    if series_data.dataframe.empty:
                        message_children = ui_feedback.render_info("No data returned for the specified parameters.")
        elif triggered_id == ids.REMOVE_SERIES_BUTTON:
            if remove_selection:
                removed = False
                for series_id in list(remove_selection):
                    if series_id in series_store:
                        series_store.pop(series_id)
                        removed = True
                if removed:
                    message_children = ui_feedback.render_info("Removed selected series.")
                else:
                    message_children = ui_feedback.render_info("No matching series to remove.")
                remove_selection = []
                right_axis_selection = [sid for sid in right_axis_selection if sid in series_store]
            else:
                message_children = ui_feedback.render_info("Select one or more series to remove.")
        elif triggered_id == ids.CLEAR_ALL_BUTTON:
            if series_store:
                series_store = {}
                message_children = ui_feedback.render_info("Cleared all series.")
            else:
                message_children = ui_feedback.render_info("No series to clear.")
            remove_selection = []
            right_axis_selection = []
        else:
            return (
                no_update,
                no_update,
                no_update,
                no_update,
                build_series_options(series_store),
                no_update,
                build_series_options(series_store),
                ui_feedback.render_series_summary(series_store),
            )

        combined = build_combined_series(series_store)
        combined_payload = combined.to_store() if series_store else None
        series_options = build_series_options(series_store)
        remove_value_output = normalize_selection(series_store, remove_selection)
        right_axis_output = normalize_selection(series_store, right_axis_selection)
        summary_children = ui_feedback.render_series_summary(series_store)

        if message_children is None:
            message_children = no_update

        return (
            series_store,
            combined_payload,
            message_children,
            remove_value_output,
            series_options,
            right_axis_output,
            series_options,
            summary_children,
        )

    @app.callback(
        Output(ids.TRANSFORM_MONTHS, "disabled"),
        Output(ids.TRANSFORM_TYPE, "options"),
        Output(ids.TRANSFORM_ALIGN, "disabled"),
        Input(ids.TRANSFORM_TOGGLE, "value"),
    )
    def toggle_transform_controls(toggle_value: List[str]):
        enabled = "enabled" in (toggle_value or [])
        months_disabled = not enabled
        align_disabled = not enabled
        options = [dict(option, disabled=not enabled) for option in TRANSFORM_TYPE_OPTIONS]
        return months_disabled, options, align_disabled

    @app.callback(
        Output(ids.TIME_SERIES_CHART, "figure"),
        Output(ids.CHART_STATUS, "children"),
        Output(ids.CHART_CONTAINER, "style"),
        Input(ids.COMBINED_DATA_STORE, "data"),
        Input(ids.CHART_TITLE_INPUT, "value"),
        Input(ids.X_LABEL_INPUT, "value"),
        Input(ids.Y_LABEL_INPUT, "value"),
        Input(ids.SERIES_RIGHT_AXIS_DROPDOWN, "value"),
    )
    def render_chart(
        combined_data: Dict[str, object] | None,
        chart_title: str | None,
        x_label: str | None,
        y_label: str | None,
        right_axis_series: List[str] | None,
    ):
        hidden_style = dict(CHART_CONTAINER_STYLE)
        hidden_style["display"] = "none"
        visible_style = dict(CHART_CONTAINER_STYLE)
        visible_style["display"] = "block"
        resolved_title = (chart_title or "").strip()
        resolved_x = (x_label or "Date").strip() or "Date"
        resolved_y = (y_label or "").strip()
        right_axis_series = right_axis_series or []

        if not combined_data:
            fig = charts.build_price_chart(
                df=pd.DataFrame(),
                y_fields=[],
                ticker="",
                chart_title=resolved_title or None,
                x_label=resolved_x,
                y_label=resolved_y or None,
                secondary_y=[],
                show_legend=False,
            )
            return fig, "Use the Fetch Data panel to load data.", hidden_style

        df_json = combined_data.get("df")
        y_fields = combined_data.get("y_fields") or []
        ticker_label = combined_data.get("ticker_label", "")
        series_field_map = combined_data.get("series_field_map", {})

        try:
            df = pd.read_json(StringIO(df_json), orient="split") if df_json else pd.DataFrame()
        except ValueError:
            df = pd.DataFrame()

        if df.empty or not y_fields:
            fig = charts.build_price_chart(
                df=pd.DataFrame(),
                y_fields=[],
                ticker=ticker_label,
                chart_title=resolved_title or None,
                x_label=resolved_x,
                y_label=resolved_y or None,
                secondary_y=[],
                show_legend=False,
            )
            return fig, "No data available for the current selection.", hidden_style

        secondary_fields: List[str] = []
        for series_id in right_axis_series:
            fields = series_field_map.get(series_id)
            if isinstance(fields, list):
                secondary_fields.extend(fields)

        figure = charts.build_price_chart(
            df=df,
            y_fields=y_fields,
            ticker=ticker_label,
            chart_title=resolved_title or None,
            x_label=resolved_x,
            y_label=resolved_y or None,
            secondary_y=secondary_fields,
            show_legend=False,
        )
        status_message = f"Active series: {ticker_label}" if ticker_label else "Active series ready."
        return figure, status_message, visible_style

    return app


app = create_dash_app()

if __name__ == "__main__":
    app.run(debug=True)



