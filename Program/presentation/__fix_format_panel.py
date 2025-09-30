from pathlib import Path

path = Path("layout.py")
text = path.read_text()

replacements = {
    "placeholder=\"Chart title\",\r\n                                    style=FULL_WIDTH_CONTROL_STYLE,\r\n                                    )": "placeholder=\"Chart title\",\r\n                                    style=FULL_WIDTH_CONTROL_STYLE,\r\n                                )",
    "placeholder=\"X axis label\",\r\n                                    style=FULL_WIDTH_CONTROL_STYLE,\r\n                                    )": "placeholder=\"X axis label\",\r\n                                    style=FULL_WIDTH_CONTROL_STYLE,\r\n                                )",
    "placeholder=\"Y axis label\",\r\n                                    style=FULL_WIDTH_CONTROL_STYLE,\r\n                                    )": "placeholder=\"Y axis label\",\r\n                                    style=FULL_WIDTH_CONTROL_STYLE,\r\n                                )",
    "placeholder=\"Select series for right axis\",\r\n                                    style=FULL_WIDTH_CONTROL_STYLE,\r\n                                    )": "placeholder=\"Select series for right axis\",\r\n                                    style=FULL_WIDTH_CONTROL_STYLE,\r\n                                )",
    "placeholder=\"Select series to remove\",\r\n                                    style=FULL_WIDTH_CONTROL_STYLE,\r\n                                    )": "placeholder=\"Select series to remove\",\r\n                                    style=FULL_WIDTH_CONTROL_STYLE,\r\n                                )",
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f"missing snippet: {old[:40]}...")
    text = text.replace(old, new, 1)

block_old = "                            html.Div(\r\n                                [\r\n                                    html.Button(\"Remove Selected\", id=ids.REMOVE_SERIES_BUTTON, n_clicks=0),\r\n                                    html.Button(\r\n                                        \"Clear All\",\r\n                                        id=ids.CLEAR_ALL_BUTTON,\r\n                                        n_clicks=0,\r\n                                        style={\"marginLeft\": \"12px\"},\r\n                                    ),\r\n                                ]\r\n                            ),"
block_new = "                            html.Div(\r\n                                [\r\n                                    html.Button(\"Remove Selected\", id=ids.REMOVE_SERIES_BUTTON, n_clicks=0),\r\n                                    html.Button(\r\n                                        \"Clear All\",\r\n                                        id=ids.CLEAR_ALL_BUTTON,\r\n                                        n_clicks=0,\r\n                                        style={\"marginLeft\": \"12px\"},\r\n                                    ),\r\n                                ],\r\n                                style={\"marginTop\": \"12px\"},\r\n                            ),"

if block_old not in text:
    raise SystemExit("button block not found for spacing")

text = text.replace(block_old, block_new, 1)

path.write_text(text)


