# bloomberg_fields.py
# -------------------------------------------------------------------
# Single source of truth for Bloomberg field presets.

from typing import Iterable, List, Union

# Default periodicity for historical requests
DEFAULT_PERIODICITY = "MONTHLY"  # Options: DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY

# Field groups (presets)
FIELD_GROUPS = {
    "px_last": ["PX_LAST"],

    # NEW: static descriptors fetched via ReferenceDataRequest (once per security)
    # Add more later (e.g., "ID_BB_UNIQUE", "CRNCY") as you need.
    "static_descriptors": ["LONG_COMP_NAME"],
    
    # Test groups for error handling
    "test_error": ["ERROR_FIELD"],
    "test_invalid": ["INVALID_FIELD"],
}

def list_groups() -> List[str]:
    """Return available field group names."""
    return sorted(FIELD_GROUPS.keys())

def resolve_fields(
    selection: Union[str, Iterable[str], None],
    fallback_group: str = "px_last"
) -> List[str]:
    """
    Resolve the user's selection into a clean list of fields.
    Accepts:
      - A group name defined in FIELD_GROUPS (e.g., "px_last")
      - A comma-separated string of Bloomberg fields (e.g., "PX_LAST,VOLUME")
      - An iterable/list of field strings
      - None -> returns fields from fallback_group

    Returns a de-duplicated list of uppercase field mnemonics.
    """
    if selection is None:
        fields = FIELD_GROUPS.get(fallback_group, [])
    elif isinstance(selection, str):
        if selection in FIELD_GROUPS:
            fields = FIELD_GROUPS[selection]
        else:
            # Treat as comma-separated fields
            fields = [f.strip() for f in selection.split(",") if f.strip()]
    else:
        fields = list(selection)

    # Normalize: upper-case and de-dupe, preserve order
    seen = set()
    out = []
    for f in fields:
        u = f.upper()
        if u and u not in seen:
            out.append(u)
            seen.add(u)

    return out


