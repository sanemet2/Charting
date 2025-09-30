from __future__ import annotations

from typing import Dict, Iterable, List

from dash import html

SUCCESS_STYLE = {"color": "#0a6640", "marginTop": "8px"}
ERROR_STYLE = {"color": "#a82a2a", "marginTop": "8px"}
INFO_STYLE = {"color": "#3a3a3a", "marginTop": "8px"}


def render_errors(errors: Iterable[dict]) -> html.Div:
    items = []
    for error in errors:
        message = str(error.get("message", "Unknown error")) if isinstance(error, dict) else str(error)
        items.append(html.Li(message))
    return html.Div([html.Strong("Please fix the following:"), html.Ul(items)], style=ERROR_STYLE)


def render_success(message: str) -> html.Div:
    return html.Div(message, style=SUCCESS_STYLE)


def render_info(message: str) -> html.Div:
    return html.Div(message, style=INFO_STYLE)


def render_error_text(message: str) -> html.Div:
    return html.Div(message, style=ERROR_STYLE)


def render_series_summary(series_store: Dict[str, Dict[str, object]]) -> html.Div:
    if not series_store:
        return html.Div("No active series.", style=INFO_STYLE)

    items: List[html.Li] = []
    for series_id, payload in series_store.items():
        ticker = str(payload.get("ticker", series_id))
        fields = payload.get("y_fields", [])
        fields_label = ", ".join(fields) if fields else "No fields"
        items.append(html.Li(f"{ticker} - {fields_label}"))

    return html.Div([html.Strong("Active series:"), html.Ul(items)], style=INFO_STYLE)


