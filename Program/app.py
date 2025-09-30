from __future__ import annotations

import logging
from pathlib import Path

from Program.presentation.app_dash import app


def _configure_logging() -> None:
    logs_dir = Path(__file__).resolve().parent.parent / "Diagnostics" / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    logfile = logs_dir / "chart_library.log"

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        handlers=[
            logging.FileHandler(logfile, encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )


_configure_logging()

server = app.server

if __name__ == "__main__":
    app.run(debug=True)
