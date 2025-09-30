from __future__ import annotations

import json
import logging
import os
import tempfile
import time
from pathlib import Path
from typing import Dict, Protocol, runtime_checkable


LOGGER = logging.getLogger(__name__)


class ChartLibraryStorageError(RuntimeError):
    """Raised when reading from or writing to the storage backend fails."""


@runtime_checkable
class ChartLibraryStorage(Protocol):
    """Protocol for reading and writing chart library payloads."""

    def read(self) -> Dict[str, object]:
        """Return the persisted chart library payload as a dictionary."""

    def write(self, payload: Dict[str, object]) -> None:
        """Persist the given payload atomically."""


class JsonFileChartLibraryStorage:
    """File-based storage that persists the library as JSON with atomic writes."""

    def __init__(
        self,
        path: str | Path,
        *,
        encoding: str = "utf-8",
        max_write_attempts: int = 3,
        retry_sleep_seconds: float = 0.25,
    ) -> None:
        self._path = Path(path)
        self._encoding = encoding
        self._max_write_attempts = max_write_attempts
        self._retry_sleep_seconds = retry_sleep_seconds

    def read(self) -> Dict[str, object]:  # pragma: no cover - exercised via service tests
        try:
            if not self._path.exists():
                return {}
            with self._path.open("r", encoding=self._encoding) as handle:
                return json.load(handle)
        except json.JSONDecodeError as exc:  # pragma: no cover - tested via failure scenarios
            raise ChartLibraryStorageError(f"Malformed JSON in {self._path}") from exc
        except OSError as exc:
            raise ChartLibraryStorageError(f"Unable to read chart library from {self._path}") from exc

    def write(self, payload: Dict[str, object]) -> None:
        directory = self._path.parent
        directory.mkdir(parents=True, exist_ok=True)
        data = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
        attempts_remaining = self._max_write_attempts

        while attempts_remaining > 0:
            attempts_remaining -= 1
            tmp_file: Path | None = None
            try:
                with tempfile.NamedTemporaryFile(
                    "w",
                    delete=False,
                    encoding=self._encoding,
                    dir=directory,
                ) as handle:
                    handle.write(data)
                    handle.flush()
                    os.fsync(handle.fileno())
                    tmp_file = Path(handle.name)

                os.replace(tmp_file, self._path)
                return
            except OSError as exc:
                LOGGER.error("Failed to persist chart library to %s: %s", self._path, exc)
                if tmp_file and tmp_file.exists():
                    try:
                        tmp_file.unlink()
                    except OSError:
                        LOGGER.warning("Failed to remove temporary file %s", tmp_file)
                if attempts_remaining == 0:
                    raise ChartLibraryStorageError(
                        f"Failed to persist chart library to {self._path}"
                    ) from exc
                time.sleep(self._retry_sleep_seconds)


class InMemoryChartLibraryStorage:
    """Simple storage implementation for tests."""

    def __init__(self, initial: Dict[str, object] | None = None) -> None:
        self._payload: Dict[str, object] = initial or {}

    def read(self) -> Dict[str, object]:
        return json.loads(json.dumps(self._payload))

    def write(self, payload: Dict[str, object]) -> None:
        self._payload = json.loads(json.dumps(payload))


