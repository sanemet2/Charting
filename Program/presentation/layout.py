from __future__ import annotations

from dash import dcc, html

from Program.presentation import ids
from Program.presentation.config import (
    APP_TITLE,
    DEFAULT_FIELD_GROUP,
    DEFAULT_PERIODICITY_CODE,
    DEFAULT_TICKER,
    PERIODICITY_OPTIONS_HUMAN_TO_CODE,
)

PERIODICITY_LABELS = list(PERIODICITY_OPTIONS_HUMAN_TO_CODE.keys())
MONTH_OPTIONS = [1, 3, 6, 12, 24, 36]
TRANSFORM_TYPE_OPTIONS = [
    {"label": "Absolute", "value": "absolute"},
    {"label": "Percentage", "value": "percentage"},
]

PANEL_STYLE = {"border": "1px solid #d0d7de", "borderRadius": "6px", "padding": "16px", "marginBottom": "24px"}
SECTION_TITLE_STYLE = {"marginBottom": "12px"}
INLINE_FIELDS_STYLE = {"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(220px, 1fr))", "gap": "12px"}
CHART_CONTAINER_STYLE = {"marginTop": "24px"}
FULL_WIDTH_CONTROL_STYLE = {"width": "100%"}


def default_periodicity_label() -> str:
    for label, code in PERIODICITY_OPTIONS_HUMAN_TO_CODE.items():
        if code == DEFAULT_PERIODICITY_CODE:
            return label
    return PERIODICITY_LABELS[0] if PERIODICITY_LABELS else "Monthly"


def build_layout() -> html.Div:
    periodicity_options = [{"label": label, "value": label} for label in PERIODICITY_LABELS]
    months_options = [{"label": str(value), "value": value} for value in MONTH_OPTIONS]
    align_options = [
        {"label": "As-of (prior)", "value": "asof"},
        {"label": "Forward (next)", "value": "forward"},
    ]

    return html.Div(
        [
            dcc.Store(id=ids.CHART_SERIES_STORE, data={}),
            dcc.Store(id=ids.COMBINED_DATA_STORE),
            html.H1(APP_TITLE),
            html.Button(
                "Open Fetch Data",
                id=ids.FETCH_PANEL_TOGGLE_BUTTON,
                n_clicks=0,
                style={"marginBottom": "16px"},
            ),
            html.Div(
                [
                    html.H2("Fetch Data", style=SECTION_TITLE_STYLE),
                    dcc.RadioItems(
                        id=ids.FETCH_MODE_RADIO,
                        options=[
                            {"label": "Replace Chart", "value": "Replace Chart"},
                            {"label": "Add to Chart", "value": "Add to Chart"},
                        ],
                        value="Replace Chart",
                        inline=True,
                        style={"marginBottom": "12px"},
                    ),
                    html.Div(
                        [
                            dcc.Input(
                                id=ids.TICKER_INPUT,
                                type="text",
                                value=DEFAULT_TICKER,
                                placeholder="Ticker",
                            ),
                            dcc.Input(
                                id=ids.START_DATE_INPUT,
                                type="text",
                                value="",
                                placeholder="Start date (YYYY-MM-DD or YYYYMMDD)",
                            ),
                            dcc.Input(
                                id=ids.END_DATE_INPUT,
                                type="text",
                                value="",
                                placeholder="End date (YYYY-MM-DD or YYYYMMDD)",
                            ),
                            dcc.Dropdown(
                                id=ids.PERIODICITY_DROPDOWN,
                                options=periodicity_options,
                                value=default_periodicity_label(),
                                clearable=False,
                            ),
                            dcc.Input(
                                id=ids.FIELD_GROUP_INPUT,
                                type="text",
                                value=DEFAULT_FIELD_GROUP,
                                placeholder="Field group",
                            ),
                        ],
                        style=INLINE_FIELDS_STYLE,
                    ),
                    dcc.Checklist(
                        id=ids.TRANSFORM_TOGGLE,
                        options=[{"label": "Apply transformations", "value": "enabled"}],
                        value=[],
                        style={"marginTop": "16px", "marginBottom": "12px"},
                    ),
                    html.Div(
                        [
                            dcc.Dropdown(
                                id=ids.TRANSFORM_MONTHS,
                                options=months_options,
                                value=6,
                                clearable=False,
                                disabled=True,
                            ),
                            dcc.RadioItems(
                                id=ids.TRANSFORM_TYPE,
                                options=[dict(option, disabled=True) for option in TRANSFORM_TYPE_OPTIONS],
                                value="percentage",
                                inline=True,
                            ),
                            dcc.Dropdown(
                                id=ids.TRANSFORM_ALIGN,
                                options=align_options,
                                value="asof",
                                clearable=False,
                                disabled=True,
                            ),
                        ],
                        style={**INLINE_FIELDS_STYLE, "marginTop": "12px", "marginBottom": "12px"},
                    ),
                    html.Button("Fetch", id=ids.FETCH_BUTTON, n_clicks=0, style={"marginTop": "16px"}),
                    html.Div(id=ids.MESSAGE_CONTAINER),
                ],
                id=ids.FETCH_PANEL_CONTAINER,
                style={**PANEL_STYLE, "display": "none"},
            ),
            html.Div(
                [
                    html.Button(
                        "Open Chart Formatting",
                        id=ids.FORMAT_PANEL_TOGGLE_BUTTON,
                        n_clicks=0,
                        style={"marginBottom": "16px"},
                    ),
                    html.Div(
                        [
                            html.H2("Chart Formatting", style=SECTION_TITLE_STYLE),
                            html.Div(
                                [
                                    dcc.Input(
                                        id=ids.CHART_TITLE_INPUT,
                                        type="text",
                                        value="",
                                        placeholder="Chart title",
                                        style=FULL_WIDTH_CONTROL_STYLE,
                                    ),
                                    dcc.Input(
                                        id=ids.X_LABEL_INPUT,
                                        type="text",
                                        value="Date",
                                        placeholder="X axis label",
                                        style=FULL_WIDTH_CONTROL_STYLE,
                                    ),
                                    dcc.Input(
                                        id=ids.Y_LABEL_INPUT,
                                        type="text",
                                        value="",
                                        placeholder="Y axis label",
                                        style=FULL_WIDTH_CONTROL_STYLE,
                                    ),
                                ],
                                style=INLINE_FIELDS_STYLE,
                            ),
                            html.Div(
                                [
                                    dcc.Dropdown(
                                        id=ids.SERIES_RIGHT_AXIS_DROPDOWN,
                                        options=[],
                                        value=[],
                                        multi=True,
                                        placeholder="Select series for right axis",
                                        style=FULL_WIDTH_CONTROL_STYLE,
                                    ),
                                    dcc.Dropdown(
                                        id=ids.SERIES_REMOVE_DROPDOWN,
                                        options=[],
                                        value=[],
                                        multi=True,
                                        placeholder="Select series to remove",
                                        style=FULL_WIDTH_CONTROL_STYLE,
                                    ),
                                ],
                                style={**INLINE_FIELDS_STYLE, "marginTop": "12px"},
                            ),
                            html.Div(
                                [
                                    html.Button("Remove Selected", id=ids.REMOVE_SERIES_BUTTON, n_clicks=0),
                                    html.Button(
                                        "Clear All",
                                        id=ids.CLEAR_ALL_BUTTON,
                                        n_clicks=0,
                                        style={"marginLeft": "12px"},
                                    ),
                                ],
                                style={"marginTop": "12px"},
                            ),
                            html.Div(id=ids.SERIES_SUMMARY, style={"marginTop": "12px"}),
                        ],
                        id=ids.FORMAT_PANEL_CONTAINER,
                        style={**PANEL_STYLE, "display": "none"},
                    ),
                    dcc.Graph(id=ids.TIME_SERIES_CHART),
                ],
                id=ids.CHART_CONTAINER,
                style={**CHART_CONTAINER_STYLE, "display": "none"},
            ),
            html.Div(id=ids.CHART_STATUS, style={"color": "#3a3a3a", "marginTop": "8px"}),
        ],
        style={"maxWidth": "960px", "margin": "0 auto", "padding": "24px"},
    )


