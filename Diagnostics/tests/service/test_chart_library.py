from __future__ import annotations

from pathlib import Path
from typing import Dict

import pytest

from Program.service import chart_library as lib
from Program.service.chart_library_storage import InMemoryChartLibraryStorage, JsonFileChartLibraryStorage


@pytest.fixture()
def in_memory_storage() -> InMemoryChartLibraryStorage:
    return InMemoryChartLibraryStorage()


def _sample_snapshot(chart_id: str = "chart-1", display_name: str = "My Chart") -> Dict[str, object]:
    return {
        "chart_id": chart_id,
        "display_name": display_name,
        "series_store": {"sample": {}},
        "series_order": [],
        "formatting": {},
    }


def test_load_empty_library_returns_root_folder(in_memory_storage: InMemoryChartLibraryStorage) -> None:
    library = lib.load_library(in_memory_storage)
    assert library.root_folder_id == lib.ROOT_FOLDER_ID
    assert library.folders[lib.ROOT_FOLDER_ID].name == "Root"
    assert library.charts == {}


def test_save_chart_persists_snapshot_and_order(in_memory_storage: InMemoryChartLibraryStorage) -> None:
    library = lib.save_chart(
        in_memory_storage,
        folder_path=[lib.ROOT_FOLDER_ID],
        snapshot_payload=_sample_snapshot(),
    )
    stored = in_memory_storage.read()
    assert stored["charts"]["chart-1"]["display_name"] == "My Chart"
    assert stored["folders"][lib.ROOT_FOLDER_ID]["charts"] == ["chart-1"]
    assert "created_at" in stored["charts"]["chart-1"]
    assert library.charts["chart-1"].display_name == "My Chart"


def test_duplicate_display_name_raises_error(in_memory_storage: InMemoryChartLibraryStorage) -> None:
    lib.save_chart(
        in_memory_storage,
        folder_path=[lib.ROOT_FOLDER_ID],
        snapshot_payload=_sample_snapshot(chart_id="chart-1", display_name="Alpha"),
    )
    with pytest.raises(lib.NameConflictError):
        lib.save_chart(
            in_memory_storage,
            folder_path=[lib.ROOT_FOLDER_ID],
            snapshot_payload=_sample_snapshot(chart_id="chart-2", display_name="Alpha"),
        )


def test_move_chart_updates_folder_relationship(in_memory_storage: InMemoryChartLibraryStorage) -> None:
    library = lib.save_chart(
        in_memory_storage,
        folder_path=[lib.ROOT_FOLDER_ID],
        snapshot_payload=_sample_snapshot(),
    )
    library = lib.create_folder(
        in_memory_storage,
        parent_path=[lib.ROOT_FOLDER_ID],
        name="Targets",
    )
    new_folder_id = next(child for child in library.folders[lib.ROOT_FOLDER_ID].children)
    library = lib.move_chart(
        in_memory_storage,
        chart_id="chart-1",
        destination_path=[lib.ROOT_FOLDER_ID, new_folder_id],
    )
    assert library.folders[new_folder_id].charts == ["chart-1"]
    assert library.folders[lib.ROOT_FOLDER_ID].charts == []


def test_delete_chart_removes_reference_only(in_memory_storage: InMemoryChartLibraryStorage) -> None:
    lib.save_chart(
        in_memory_storage,
        folder_path=[lib.ROOT_FOLDER_ID],
        snapshot_payload=_sample_snapshot(),
    )
    library = lib.delete_chart(in_memory_storage, chart_id="chart-1")
    assert "chart-1" not in library.charts
    assert all("chart-1" not in folder.charts for folder in library.folders.values())


def test_folder_creation_and_rename(in_memory_storage: InMemoryChartLibraryStorage) -> None:
    library = lib.create_folder(
        in_memory_storage,
        parent_path=[lib.ROOT_FOLDER_ID],
        name="Analytics",
    )
    folder_id = library.folders[lib.ROOT_FOLDER_ID].children[0]
    library = lib.rename_folder(
        in_memory_storage,
        folder_id=folder_id,
        new_name="Analytics Updated",
    )
    assert library.folders[folder_id].name == "Analytics Updated"


def test_invalid_snapshot_payload_rejected(in_memory_storage: InMemoryChartLibraryStorage) -> None:
    with pytest.raises(lib.InvalidPayloadError):
        lib.save_chart(
            in_memory_storage,
            folder_path=[lib.ROOT_FOLDER_ID],
            snapshot_payload={"display_name": "Missing ID"},
        )


def test_json_storage_round_trip(tmp_path: Path) -> None:
    storage = JsonFileChartLibraryStorage(tmp_path / "library.json")
    lib.save_chart(
        storage,
        folder_path=[lib.ROOT_FOLDER_ID],
        snapshot_payload=_sample_snapshot(),
    )
    reloaded = lib.load_library(storage)
    assert "chart-1" in reloaded.charts

