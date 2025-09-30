from __future__ import annotations
"""
custom_index.py
---------------
Build one custom composite index from already-fetched time series at their
native frequency (no resampling). Library-only: no prints, no I/O.

Key features
============
- Arithmetic-only **formula** over user-provided **aliases** (column names).
- Safe expression parsing (AST whitelist): +, -, *, /, **, parentheses, unary +/-.
- **No rebasing** (operates on raw levels).
- **NaN policy (smart_add_sub)**:
  * For addition/subtraction, treat missing operands as 0 (so long histories are possible
    even when some components start later).
  * For multiplication/division/power, if any operand is missing → NaN.
  * Division-by-zero → NaN (±inf is converted to NaN).
- Optional cross-series date alignment:
  * cross_align="exact" (default): combine only exact timestamps; smart NaN rules apply.
  * cross_align="asof": for each target date, use each component's last value **at or before**
    that date within a tolerance (no look-ahead).
- **Fail-fast mixed-frequency guard**: if referenced components do not share one native
  frequency (e.g., DAILY + WEEKLY), raise MixedFrequencyError **before** any computation.
- Optional validation against an expected periodicity; mismatch → MixedFrequencyError.
- Returns a single-column DataFrame (float64) named by `index_name` and attaches rich metadata
  in `.attrs['custom_index_meta']` for CLI debug/printing.

Design principles
=================
- Beginner-friendly, clean comments, minimal abstractions.
- Functions return structured data and raise informative errors; no printing.
"""

from typing import Dict, Literal, Tuple, Set, Union
import ast
import math
import numpy as np
import pandas as pd

# ----------------------------
# Exception types (library-only)
# ----------------------------
class CustomIndexError(ValueError):
    """Base class for errors raised by custom_index."""

class MixedFrequencyError(CustomIndexError):
    """Raised when component series have different native frequencies or do not match an expected one."""

# ----------------------------
# Public API
# ----------------------------
Periodicity = Literal["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]
Align = Literal["exact", "asof"]

def compute_custom_index(
    data: pd.DataFrame,
    formula: str,
    aliases: Dict[str, str],
    index_name: str,
    *,
    expected_periodicity: Periodicity | None = None,
    nan_policy: Literal["smart_add_sub"] = "smart_add_sub",
    cross_align: Align = "exact",
    cross_align_tolerance: Union[str, pd.Timedelta, None] = "auto",
) -> pd.DataFrame:
    """
    Compute one composite index from already-fetched component series.
    
    Parameters
    ----------
    data : pd.DataFrame
        Datetime-indexed, ascending DataFrame. Columns are component **aliases** used in the formula.
    formula : str
        Arithmetic-only expression referencing the aliases in `data.columns`.
        Allowed operators: +, -, *, /, **, parentheses, and unary +/-.
        The formula must reference at least one alias (no constant-only formulas).
    aliases : dict[str, str]
        Mapping alias -> "TICKER:FIELD" (for metadata/reporting only). The function expects
        `data` columns to already be these aliases.
    index_name : str
        Name of the resulting composite column.
    expected_periodicity : {"DAILY","WEEKLY","MONTHLY","QUARTERLY","YEARLY"} or None, optional
        If provided, validates that all referenced component series match this native frequency.
        Mismatch raises MixedFrequencyError.
    nan_policy : Literal["smart_add_sub"], default "smart_add_sub"
        Missing-value policy (fixed by spec):
        - For +/- , treat missing operands as 0.
        - For *, /, **, if any operand is missing → NaN. Division-by-zero → NaN.
    cross_align : {"exact", "asof"}, default "exact"
        Cross-series alignment policy over the union calendar.
        - "exact": reindex to the union of timestamps; no date snapping.
        - "asof": for each target date, snap each component to its last value at/<= date
          within a tolerance (no look-ahead).
    cross_align_tolerance : str | pd.Timedelta | None, default "auto"
        Effective only when cross_align="asof".
        - "auto": one expected period window inferred from `expected_periodicity`.
        - timedelta-like string (e.g., "7D") or pd.Timedelta to override.
        - None: unbounded backward snap (not recommended).
        
    Returns
    -------
    pd.DataFrame
        Single-column DataFrame named `index_name` (float64).
        Metadata in `.attrs['custom_index_meta']`.
        
    Raises
    ------
    ValueError
        If the formula is unsafe/invalid or references missing aliases.
        If the formula does not reference any aliases (constant-only).
    MixedFrequencyError
        If components have mixed native frequencies, or if provided expected_periodicity
        is not matched by any component.
    """
    if not isinstance(data.index, pd.DatetimeIndex):
        raise ValueError("`data` must have a DatetimeIndex.")
    if not data.index.is_monotonic_increasing:
        data = data.sort_index()
    
    # Parse & validate formula, and collect referenced aliases
    expr_ast, referenced = _parse_formula_safe(formula)
    if not referenced:
        raise ValueError("Formula must reference at least one alias; constant-only expressions are not allowed.")
    missing_aliases = [name for name in referenced if name not in data.columns]
    if missing_aliases:
        raise ValueError(
            "Formula references aliases not found in data columns: " + ", ".join(sorted(missing_aliases))
        )
    
    # (FAIL-FAST) Ensure referenced components share one native frequency
    _enforce_uniform_frequency(data, list(referenced))
    
    # If the caller also supplied an expected periodicity, validate against it.
    if expected_periodicity is not None:
        _validate_all_series_frequency(data, list(referenced), expected_periodicity)
    
    # Determine union target index (across referenced series only)
    target_idx = _union_index([pd.DatetimeIndex(data[name].dropna().index) for name in referenced])
    
    # Optionally perform as-of snapping for each component onto the target index
    tol = _resolve_tolerance(cross_align_tolerance, expected_periodicity)
    aligned: Dict[str, pd.Series] = {}
    warnings: list[str] = []
    for name in referenced:
        s = pd.to_numeric(data[name], errors="coerce")
        if cross_align == "exact":
            s_al = s.reindex(target_idx)
        else:  # asof
            s_al = _asof_align_series(s, target_idx, tolerance=tol)
        aligned[name] = s_al.astype("float64")
    
    # Evaluate the expression with smart NaN rules
    result_series = _evaluate_expr(expr_ast, aligned, nan_policy=nan_policy)
    
    # Replace ±inf (e.g., divide-by-zero) with NaN and record a warning if it happened
    if np.isinf(result_series.to_numpy()).any():
        warnings.append("Division by zero encountered; converted ±inf to NaN.")
        result_series = result_series.replace([np.inf, -np.inf], np.nan)
    
    # Build output DataFrame
    out = pd.DataFrame({index_name: result_series.astype("float64")})
    
    # Attach metadata for CLI/debug
    meta = {
        "formula": formula,
        "aliases": aliases.copy(),
        "resolved_columns": {name: name for name in referenced},
        "referenced_aliases": sorted(referenced),
        "expected_periodicity": expected_periodicity,
        "frequency_check": _summarize_frequency(data, list(referenced), expected_periodicity),
        "nan_policy": nan_policy,
        "cross_align": cross_align,
        "cross_align_tolerance": str(tol) if isinstance(tol, pd.Timedelta) else tol,
        "warnings": warnings,
        "index_span": {
            "first": (out.index[0].isoformat() if len(out.index) else None),
            "last": (out.index[-1].isoformat() if len(out.index) else None),
        },
        "row_counts": {name: int(aligned[name].notna().sum()) for name in referenced},
    }
    out.attrs["custom_index_meta"] = meta
    return out


# ----------------------------
# Helpers: parsing & evaluation
# ----------------------------
_ALLOWED_BINOPS = (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow)
_ALLOWED_UNARYOPS = (ast.UAdd, ast.USub)
_ALLOWED_NODES = (
    ast.Expression,
    ast.BinOp,
    ast.UnaryOp,
    ast.Name,
    ast.Constant,
    ast.Load,
    ast.Subscript,  # not used; included to show intentional exclusion if ever encountered
)

def _parse_formula_safe(formula: str) -> Tuple[ast.AST, Set[str]]:
    """Parse formula to AST, validate allowed nodes, and collect referenced names.
    Returns
    -------
    (expr_ast, names)
    """
    try:
        tree = ast.parse(formula, mode="eval")
    except SyntaxError as e:
        raise ValueError(f"Invalid formula syntax: {e}")
    
    names: Set[str] = set()
    
    class _Visitor(ast.NodeVisitor):
        def visit(self, node):
            # Disallow any node type not in our whitelist
            if not isinstance(node, (ast.Expression, ast.BinOp, ast.UnaryOp, ast.Name, ast.Constant)):
                raise ValueError(f"Forbidden expression element: {type(node).__name__}")
            return super().visit(node)
        
        def visit_BinOp(self, node: ast.BinOp):
            if not isinstance(node.op, _ALLOWED_BINOPS):
                raise ValueError(f"Operator not allowed: {type(node.op).__name__}")
            self.visit(node.left)
            self.visit(node.right)
        
        def visit_UnaryOp(self, node: ast.UnaryOp):
            if not isinstance(node.op, _ALLOWED_UNARYOPS):
                raise ValueError(f"Unary operator not allowed: {type(node.op).__name__}")
            self.visit(node.operand)
        
        def visit_Name(self, node: ast.Name):
            names.add(node.id)
        
        def visit_Constant(self, node: ast.Constant):
            if not isinstance(node.value, (int, float)):
                raise ValueError("Only numeric constants are allowed in the formula.")
    
    _Visitor().visit(tree)
    return tree.body, names


def _evaluate_expr(node: ast.AST, env: Dict[str, pd.Series], *, nan_policy: str) -> pd.Series:
    """Recursively evaluate the AST node with Series-aware arithmetic.
    Smart NaN rules (for this project):
    - Add/Sub: use fill_value=0 so missing terms don't kill the sum/difference.
    - Mul/Div/Pow: no fill (if any operand is missing, result is NaN).
    """
    if isinstance(node, ast.BinOp):
        left = _evaluate_expr(node.left, env, nan_policy=nan_policy)
        right = _evaluate_expr(node.right, env, nan_policy=nan_policy)
        if isinstance(node.op, ast.Add):
            return _series_add(left, right)
        if isinstance(node.op, ast.Sub):
            return _series_sub(left, right)
        if isinstance(node.op, ast.Mult):
            return _series_mul(left, right)
        if isinstance(node.op, ast.Div):
            return _series_div(left, right)
        if isinstance(node.op, ast.Pow):
            return _series_pow(left, right)
        raise ValueError("Unsupported binary operator.")
    
    if isinstance(node, ast.UnaryOp):
        val = _evaluate_expr(node.operand, env, nan_policy=nan_policy)
        if isinstance(node.op, ast.UAdd):
            return val
        if isinstance(node.op, ast.USub):
            return -val
        raise ValueError("Unsupported unary operator.")
    
    if isinstance(node, ast.Name):
        # Return the aligned Series for this alias
        s = env.get(node.id)
        if s is None:
            raise ValueError(f"Alias '{node.id}' not found during evaluation.")
        return s
    
    if isinstance(node, ast.Constant):
        c = float(node.value)
        # Broadcast scalar into a Series aligned to any Series in env
        # If env is empty (shouldn't happen, because we validated names), create empty series
        idx = next(iter(env.values())).index if env else pd.DatetimeIndex([], name="date")
        return pd.Series(c, index=idx, dtype="float64")
    
    raise ValueError(f"Unsupported expression element: {type(node).__name__}")


# ----------------------------
# Helpers: operations with NaN policy
# ----------------------------
def _to_series(x: Union[pd.Series, float], index: pd.DatetimeIndex) -> pd.Series:
    if isinstance(x, pd.Series):
        return x
    return pd.Series(float(x), index=index, dtype="float64")

def _series_add(a: Union[pd.Series, float], b: Union[pd.Series, float]) -> pd.Series:
    if isinstance(a, pd.Series) and isinstance(b, pd.Series):
        return a.add(b, fill_value=0.0)
    # One or both are scalars
    if isinstance(a, pd.Series) and not isinstance(b, pd.Series):
        return a.add(float(b))
    if not isinstance(a, pd.Series) and isinstance(b, pd.Series):
        return b.add(float(a))
    # both scalars → scalar series on empty index (not expected due to validation)
    return pd.Series(float(a) + float(b), index=pd.DatetimeIndex([]), dtype="float64")

def _series_sub(a: Union[pd.Series, float], b: Union[pd.Series, float]) -> pd.Series:
    if isinstance(a, pd.Series) and isinstance(b, pd.Series):
        return a.sub(b, fill_value=0.0)
    if isinstance(a, pd.Series) and not isinstance(b, pd.Series):
        return a.sub(float(b))
    if not isinstance(a, pd.Series) and isinstance(b, pd.Series):
        # scalar - series
        return (-b).add(float(a), fill_value=0.0)
    return pd.Series(float(a) - float(b), index=pd.DatetimeIndex([]), dtype="float64")

def _series_mul(a: Union[pd.Series, float], b: Union[pd.Series, float]) -> pd.Series:
    if isinstance(a, pd.Series) and isinstance(b, pd.Series):
        return a * b
    if isinstance(a, pd.Series):
        return a * float(b)
    if isinstance(b, pd.Series):
        return b * float(a)
    return pd.Series(float(a) * float(b), index=pd.DatetimeIndex([]), dtype="float64")

def _series_div(a: Union[pd.Series, float], b: Union[pd.Series, float]) -> pd.Series:
    if isinstance(a, pd.Series) and isinstance(b, pd.Series):
        res = a / b
    elif isinstance(a, pd.Series):
        res = a / float(b)
    elif isinstance(b, pd.Series):
        # scalar / series
        res = _to_series(float(a), b.index) / b
    else:
        res = pd.Series(float(a) / float(b), index=pd.DatetimeIndex([]), dtype="float64")
    return res.replace([np.inf, -np.inf], np.nan)

def _series_pow(a: Union[pd.Series, float], b: Union[pd.Series, float]) -> pd.Series:
    if isinstance(a, pd.Series) and isinstance(b, pd.Series):
        return a.pow(b)
    if isinstance(a, pd.Series):
        return a.pow(float(b))
    if isinstance(b, pd.Series):
        # scalar ** series
        return _to_series(float(a), b.index).pow(b)
    return pd.Series(float(a) ** float(b), index=pd.DatetimeIndex([]), dtype="float64")


# ----------------------------
# Helpers: alignment & frequency
# ----------------------------
def _union_index(indices: list[pd.DatetimeIndex]) -> pd.DatetimeIndex:
    if not indices:
        return pd.DatetimeIndex([], name="date")
    out = indices[0]
    for idx in indices[1:]:
        out = out.union(idx)
    return pd.DatetimeIndex(sorted(out))

def _asof_align_series(
    s: pd.Series, target: pd.DatetimeIndex, *, tolerance: pd.Timedelta | None
) -> pd.Series:
    """Align `s` to `target` using last observation carried backward within tolerance.
    Implementation uses `merge_asof` to enforce the tolerance
    """
    s = s.dropna()
    if s.empty:
        return pd.Series(index=target, dtype="float64")
    left = pd.DataFrame({"_t": target})
    right = pd.DataFrame({"_r": s.index, "_v": s.values})
    # Ensure sorted ascending
    left = left.sort_values("_t")
    right = right.sort_values("_r")
    merged = pd.merge_asof(
        left, right, left_on="_t", right_on="_r", direction="backward", tolerance=tolerance
    )
    aligned = pd.Series(merged["_v"].to_numpy(), index=pd.DatetimeIndex(merged["_t"]))
    return aligned

def _resolve_tolerance(tol: Union[str, pd.Timedelta, None], expected: Periodicity | None) -> pd.Timedelta | None:
    if tol is None:
        return None
    if isinstance(tol, pd.Timedelta):
        return tol
    if isinstance(tol, str) and tol != "auto":
        return pd.to_timedelta(tol)
    # "auto" case
    mapping = {
        "DAILY": pd.Timedelta(days=3),
        "WEEKLY": pd.Timedelta(days=10),
        "MONTHLY": pd.Timedelta(days=35),
        "QUARTERLY": pd.Timedelta(days=100),
        "YEARLY": pd.Timedelta(days=400),
    }
    return mapping.get(expected, pd.Timedelta(days=35))

def _validate_all_series_frequency(
    data: pd.DataFrame, names: list[str], expected: Periodicity
) -> None:
    for name in names:
        s = data[name].dropna()
        if len(s) < 2:
            # Not enough points to infer; allow but continue
            continue
        if not _matches_periodicity(s.index, expected):
            raise MixedFrequencyError(
                f"Series '{name}' does not match expected periodicity '{expected}' "
                f"(median step ≈ {_median_days(s.index)} days)."
            )

def _matches_periodicity(idx: pd.DatetimeIndex, expected: Periodicity) -> bool:
    days = _median_days(idx)
    if math.isnan(days):
        return True  # cannot determine; don't block
    # Tolerant bands to accommodate holidays/calendar idiosyncrasies
    bands = {
        "DAILY": (0.5, 3.5),      # ~1 day median
        "WEEKLY": (4.0, 10.0),    # ~7 days
        "MONTHLY": (25.0, 35.5),  # ~30 days
        "QUARTERLY": (80.0, 100.0), # ~90 days
        "YEARLY": (320.0, 400.0), # ~365 days
    }
    lo, hi = bands[expected]
    return lo <= days <= hi

def _infer_periodicity_label(idx: pd.DatetimeIndex) -> Periodicity | None:
    """Map median step (days) to a coarse frequency label."""
    days = _median_days(idx)
    if math.isnan(days):
        return None
    bands = {
        "DAILY": (0.5, 3.5),
        "WEEKLY": (4.0, 10.0),
        "MONTHLY": (25.0, 35.5),
        "QUARTERLY": (80.0, 100.0),
        "YEARLY": (320.0, 400.0),
    }
    for label, (lo, hi) in bands.items():
        if lo <= days <= hi:
            return label  # type: ignore[return-value]
    return None

def _enforce_uniform_frequency(data: pd.DataFrame, names: list[str]) -> None:
    """Raise MixedFrequencyError if referenced components have different native frequencies."""
    labels: Dict[str, Periodicity | None] = {}
    medians: Dict[str, float] = {}
    for name in names:
        sidx = data[name].dropna().index
        labels[name] = _infer_periodicity_label(sidx)
        medians[name] = _median_days(sidx)
    unique = {lab for lab in labels.values() if lab is not None}
    if len(unique) > 1:
        detail = ", ".join(f"{k}≈{medians[k]:.1f}d→{labels[k]}" for k in names)
        raise MixedFrequencyError(
            "Mixed native frequencies detected among components; "
            f"use components with the same frequency. Details: {detail}"
        )

def _median_days(idx: pd.DatetimeIndex) -> float:
    if len(idx) < 2:
        return float("nan")
    diffs = pd.Series(idx[1:]) - pd.Series(idx[:-1])
    # Convert to days as float
    vals = diffs.dt.total_seconds() / (24 * 3600)
    return float(np.nanmedian(vals.to_numpy()))

def _summarize_frequency(
    data: pd.DataFrame, names: list[str], expected: Periodicity | None
) -> dict:
    summary = {
        "expected": expected,
        "components": {},
    }
    for name in names:
        s = data[name].dropna()
        mdays = _median_days(s.index)
        summary["components"][name] = {
            "non_na_points": int(len(s)),
            "median_step_days": mdays,
        }
    return summary

