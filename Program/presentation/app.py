from __future__ import annotations

import sys
from pathlib import Path

if __package__ in (None, ""):
    package_dir = Path(__file__).resolve().parent
    sys.path.insert(0, str(package_dir.parent))

from Program.presentation.app_dash import app

server = app.server

if __name__ == "__main__":
    app.run(debug=True)


