from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Sequence
from uuid import uuid4

from Program.service.chart_library_storage import (
    ChartLibraryStorage,
    ChartLibraryStorageError,
    JsonFileChartLibraryStorage,
)

LOGGER = logging.getLogger(__name__)

LIBRARY_SCHEMA_VERSION = 1
CHART_SCHEMA_VERSION = 1
ROOT_FOLDER_ID = "root"


class ChartLibraryError(RuntimeError):
    """Base error for chart library operations."""


class InvalidPayloadError(ChartLibraryError):
    """Raised when persisted data cannot be parsed."""


class NameConflictError(ChartLibraryError):
    """Raised when attempting to reuse a display name within a folder."""


class NotFoundError(ChartLibraryError):
    """Raised when a chart or folder cannot be located."""


class FolderNotEmptyError(ChartLibraryError):
    """Raised when attempting to delete a folder that still contains charts or children."""


@dataclass
class ChartSnapshot:
    chart_id: str
    display_name: str
    series_store: Dict[str, object]
    series_order: List[str]
    formatting: Dict[str, object]
    interaction_state: Optional[Dict[str, object]]
    created_at: str
    updated_at: str
    schema_version: int = CHART_SCHEMA_VERSION

    @classmethod
    def from_dict(cls, payload: Dict[str, object]) -> "ChartSnapshot":
        if "chart_id" not in payload or "display_name" not in payload:
            raise InvalidPayloadError("Chart payload missing required keys")
        chart_id = str(payload["chart_id"])
        display_name = str(payload["display_name"])
        created_at = str(payload.get("created_at") or _now_iso())
        updated_at = str(payload.get("updated_at") or created_at)
        series_store = dict(payload.get("series_store") or {})
        series_order = list(payload.get("series_order") or [])
        formatting = dict(payload.get("formatting") or {})
        interaction_state_raw = payload.get("interaction_state")
        interaction_state = dict(interaction_state_raw) if isinstance(interaction_state_raw, dict) else None
        schema_version = int(payload.get("schema_version") or CHART_SCHEMA_VERSION)
        return cls(
            chart_id=chart_id,
            display_name=display_name,
            series_store=series_store,
            series_order=series_order,
            formatting=formatting,
            interaction_state=interaction_state,
            created_at=created_at,
            updated_at=updated_at,
            schema_version=schema_version,
        )

    def updated_copy(self, updates: Dict[str, object], *, timestamp: Optional[str] = None) -> "ChartSnapshot":
        payload: Dict[str, object] = self.to_dict()
        payload.update(updates)
        payload.setdefault("chart_id", self.chart_id)
        payload.setdefault("display_name", self.display_name)
        payload.setdefault("created_at", self.created_at)
        payload["updated_at"] = timestamp or _now_iso()
        return ChartSnapshot.from_dict(payload)

    def to_dict(self) -> Dict[str, object]:
        payload: Dict[str, object] = {
            "chart_id": self.chart_id,
            "display_name": self.display_name,
            "series_store": self.series_store,
            "series_order": list(self.series_order),
            "formatting": self.formatting,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "schema_version": self.schema_version,
        }
        payload["interaction_state"] = self.interaction_state
        return payload


@dataclass
class Folder:
    folder_id: str
    name: str
    parent_id: Optional[str]
    children: List[str] = field(default_factory=list)
    charts: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, payload: Dict[str, object]) -> "Folder":
        if "folder_id" not in payload or "name" not in payload:
            raise InvalidPayloadError("Folder payload missing required keys")
        folder_id = str(payload["folder_id"])
        name = str(payload["name"])
        parent_id = payload.get("parent_id")
        if parent_id is not None:
            parent_id = str(parent_id)
        children = [str(child) for child in payload.get("children") or []]
        charts = [str(chart) for chart in payload.get("charts") or []]
        return cls(folder_id=folder_id, name=name, parent_id=parent_id, children=children, charts=charts)

    def to_dict(self) -> Dict[str, object]:
        return {
            "folder_id": self.folder_id,
            "name": self.name,
            "parent_id": self.parent_id,
            "children": list(self.children),
            "charts": list(self.charts),
        }


@dataclass
class ChartLibrary:
    folders: Dict[str, Folder]
    charts: Dict[str, ChartSnapshot]
    root_folder_id: str
    schema_version: int = LIBRARY_SCHEMA_VERSION

    @classmethod
    def empty(cls) -> "ChartLibrary":
        root = Folder(folder_id=ROOT_FOLDER_ID, name="Root", parent_id=None)
        return cls(folders={root.folder_id: root}, charts={}, root_folder_id=root.folder_id)

    @classmethod
    def from_dict(cls, payload: Dict[str, object]) -> "ChartLibrary":
        try:
            schema_version = int(payload.get("schema_version") or LIBRARY_SCHEMA_VERSION)
            root_folder_id = str(payload.get("root_folder_id") or ROOT_FOLDER_ID)
            folders_raw = payload.get("folders") or {}
            charts_raw = payload.get("charts") or {}
        except (TypeError, ValueError) as exc:
            raise InvalidPayloadError("Invalid chart library payload") from exc

        folders: Dict[str, Folder] = {}
        for folder_id, folder_payload in folders_raw.items():
            folders[folder_id] = Folder.from_dict(folder_payload)

        charts: Dict[str, ChartSnapshot] = {}
        for chart_id, chart_payload in charts_raw.items():
            charts[chart_id] = ChartSnapshot.from_dict(chart_payload)

        if root_folder_id not in folders:
            raise InvalidPayloadError("Root folder missing from payload")

        return cls(folders=folders, charts=charts, root_folder_id=root_folder_id, schema_version=schema_version)

    def to_dict(self) -> Dict[str, object]:
        return {
            "schema_version": self.schema_version,
            "root_folder_id": self.root_folder_id,
            "folders": {folder_id: folder.to_dict() for folder_id, folder in self.folders.items()},
            "charts": {chart_id: snapshot.to_dict() for chart_id, snapshot in self.charts.items()},
        }

    def get_folder(self, folder_id: str) -> Folder:
        try:
            return self.folders[folder_id]
        except KeyError as exc:
            raise NotFoundError(f"Folder '{folder_id}' not found") from exc


def get_default_storage(path: Optional[str] = None) -> ChartLibraryStorage:
    return JsonFileChartLibraryStorage(path or "data/chart_library.json")


def load_library(
    storage: ChartLibraryStorage,
    *,
    logger: logging.Logger = LOGGER,
) -> ChartLibrary:
    try:
        payload = storage.read()
    except ChartLibraryStorageError as exc:
        logger.error("Failed to read chart library: %s", exc)
        raise
    if not payload:
        return ChartLibrary.empty()
    return ChartLibrary.from_dict(payload)


def save_chart(
    storage: ChartLibraryStorage,
    *,
    folder_path: Sequence[str],
    snapshot_payload: Dict[str, object],
    logger: logging.Logger = LOGGER,
) -> ChartLibrary:
    library = load_library(storage, logger=logger)
    folder = _resolve_folder_by_path(library, folder_path)
    snapshot = ChartSnapshot.from_dict(snapshot_payload)
    snapshot = snapshot.updated_copy({}, timestamp=_now_iso())
    _assert_unique_display_name(library, folder, snapshot.display_name, existing_chart_id=snapshot.chart_id)
    library.charts[snapshot.chart_id] = snapshot
    if snapshot.chart_id not in folder.charts:
        folder.charts.append(snapshot.chart_id)
    _detach_from_other_folders(library, snapshot.chart_id, keep=folder.folder_id)
    _persist_library(storage, library, logger=logger)
    logger.info("Saved chart '%s' (%s) into folder '%s'", snapshot.display_name, snapshot.chart_id, folder.folder_id)
    return library


def update_chart(
    storage: ChartLibraryStorage,
    *,
    chart_id: str,
    updates: Dict[str, object],
    logger: logging.Logger = LOGGER,
) -> ChartLibrary:
    library = load_library(storage, logger=logger)
    snapshot = library.charts.get(chart_id)
    if snapshot is None:
        raise NotFoundError(f"Chart '{chart_id}' not found")
    if "display_name" in updates:
        folder = _find_folder_containing_chart(library, chart_id)
        _assert_unique_display_name(library, folder, str(updates["display_name"]), existing_chart_id=chart_id)
    snapshot = snapshot.updated_copy(updates, timestamp=_now_iso())
    library.charts[chart_id] = snapshot
    _persist_library(storage, library, logger=logger)
    logger.info("Updated chart '%s' (%s)", snapshot.display_name, chart_id)
    return library


def delete_chart(
    storage: ChartLibraryStorage,
    *,
    chart_id: str,
    logger: logging.Logger = LOGGER,
) -> ChartLibrary:
    library = load_library(storage, logger=logger)
    if chart_id not in library.charts:
        raise NotFoundError(f"Chart '{chart_id}' not found")
    del library.charts[chart_id]
    for folder in library.folders.values():
        if chart_id in folder.charts:
            folder.charts.remove(chart_id)
    _persist_library(storage, library, logger=logger)
    logger.info("Deleted chart '%s'", chart_id)
    return library


def move_chart(
    storage: ChartLibraryStorage,
    *,
    chart_id: str,
    destination_path: Sequence[str],
    logger: logging.Logger = LOGGER,
) -> ChartLibrary:
    library = load_library(storage, logger=logger)
    snapshot = library.charts.get(chart_id)
    if snapshot is None:
        raise NotFoundError(f"Chart '{chart_id}' not found")
    destination_folder = _resolve_folder_by_path(library, destination_path)
    _assert_unique_display_name(library, destination_folder, snapshot.display_name, existing_chart_id=chart_id)
    _detach_from_other_folders(library, chart_id, keep=destination_folder.folder_id)
    if chart_id not in destination_folder.charts:
        destination_folder.charts.append(chart_id)
    _persist_library(storage, library, logger=logger)
    logger.info(
        "Moved chart '%s' (%s) to folder '%s'",
        snapshot.display_name,
        chart_id,
        destination_folder.folder_id,
    )
    return library


def create_folder(
    storage: ChartLibraryStorage,
    *,
    parent_path: Sequence[str],
    name: str,
    logger: logging.Logger = LOGGER,
) -> ChartLibrary:
    library = load_library(storage, logger=logger)
    parent_folder = _resolve_folder_by_path(library, parent_path)
    _ensure_unique_folder_name(library, parent_folder, name)
    folder_id = _generate_folder_id(name)
    new_folder = Folder(folder_id=folder_id, name=name, parent_id=parent_folder.folder_id)
    library.folders[new_folder.folder_id] = new_folder
    parent_folder.children.append(new_folder.folder_id)
    _persist_library(storage, library, logger=logger)
    logger.info("Created folder '%s' (%s) under '%s'", name, new_folder.folder_id, parent_folder.folder_id)
    return library


def rename_folder(
    storage: ChartLibraryStorage,
    *,
    folder_id: str,
    new_name: str,
    logger: logging.Logger = LOGGER,
) -> ChartLibrary:
    library = load_library(storage, logger=logger)
    folder = library.folders.get(folder_id)
    if folder is None:
        raise NotFoundError(f"Folder '{folder_id}' not found")
    if folder.parent_id:
        parent = library.folders[folder.parent_id]
        _ensure_unique_folder_name(library, parent, new_name, exclude=folder.folder_id)
    folder.name = new_name
    _persist_library(storage, library, logger=logger)
    logger.info("Renamed folder '%s' to '%s'", folder_id, new_name)
    return library


def delete_folder(
    storage: ChartLibraryStorage,
    *,
    folder_id: str,
    logger: logging.Logger = LOGGER,
) -> ChartLibrary:
    if folder_id == ROOT_FOLDER_ID:
        raise ChartLibraryError("Cannot delete root folder")
    library = load_library(storage, logger=logger)
    folder = library.folders.get(folder_id)
    if folder is None:
        raise NotFoundError(f"Folder '{folder_id}' not found")
    if folder.children or folder.charts:
        raise FolderNotEmptyError(f"Folder '{folder.name}' is not empty")
    if folder.parent_id:
        parent = library.folders[folder.parent_id]
        parent.children = [child for child in parent.children if child != folder_id]
    del library.folders[folder_id]
    _persist_library(storage, library, logger=logger)
    logger.info("Deleted folder '%s'", folder_id)
    return library


def _ensure_unique_folder_name(
    library: ChartLibrary,
    parent: Folder,
    name: str,
    *,
    exclude: Optional[str] = None,
) -> None:
    target = name.strip().lower()
    for child_id in parent.children:
        if child_id == exclude:
            continue
        if library.folders[child_id].name.strip().lower() == target:
            raise NameConflictError(f"Folder name '{name}' already exists under '{parent.name}'")


def _resolve_folder_by_path(library: ChartLibrary, path: Sequence[str]) -> Folder:
    if not path:
        raise NotFoundError("Folder path cannot be empty")
    current = path[0]
    folder = library.get_folder(current)
    for folder_id in path[1:]:
        candidate = library.folders.get(folder_id)
        if candidate is None or candidate.parent_id != folder.folder_id:
            raise NotFoundError(f"Folder path invalid at '{folder_id}'")
        folder = candidate
    return folder


def _detach_from_other_folders(library: ChartLibrary, chart_id: str, *, keep: str) -> None:
    for folder in library.folders.values():
        if folder.folder_id == keep:
            continue
        if chart_id in folder.charts:
            folder.charts.remove(chart_id)


def _find_folder_containing_chart(library: ChartLibrary, chart_id: str) -> Folder:
    for folder in library.folders.values():
        if chart_id in folder.charts:
            return folder
    raise NotFoundError(f"Chart '{chart_id}' not assigned to any folder")


def _assert_unique_display_name(
    library: ChartLibrary,
    folder: Folder,
    display_name: str,
    *,
    existing_chart_id: Optional[str] = None,
) -> None:
    target = display_name.strip().lower()
    for chart_id in folder.charts:
        if chart_id == existing_chart_id:
            continue
        snapshot = library.charts.get(chart_id)
        if snapshot and snapshot.display_name.strip().lower() == target:
            raise NameConflictError(
                f"Display name '{display_name}' already exists in folder '{folder.name}'"
            )


def _persist_library(storage: ChartLibraryStorage, library: ChartLibrary, *, logger: logging.Logger) -> None:
    try:
        storage.write(library.to_dict())
    except ChartLibraryStorageError as exc:
        logger.error("Failed to persist chart library: %s", exc)
        raise


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _generate_folder_id(name: str) -> str:
    slug = name.strip().lower().replace(" ", "-") or "folder"
    return f"{slug}-{uuid4().hex[:8]}"


