# 📋 To Be Implemented

This document tracks features and enhancements that have been identified but not yet implemented in the Chart Library project.

---

## 🎯 Chart Features

### Axis Inversion
**Status:** 🔍 **Design Phase**  
**Priority:** Medium  
**Location:** Chart Settings (recommended)  

**Description:**
Add ability to invert chart axes (flip the visual orientation without changing data values).

**Implementation Notes:**
- Should be added to Chart Settings rather than Data Manipulation
- Affects visual presentation, not data transformation
- Apply at axis level (left axis, right axis independently)
- Implement via Plotly's `autorange: 'reversed'` property

**Design Decision Needed:**
- Confirm placement in Settings vs. Data Manipulation modal
- Determine if it should be per-axis or chart-wide

---

## 🚀 Future Enhancements

*Add additional features here as they are identified...*

---

## 📝 Notes

- Items in this file should be moved to active implementation plans when work begins
- Each item should include priority, estimated complexity, and architectural considerations
- Link to relevant discussions or design documents where applicable

---

## 🏛️ Architectural Reviews

### Review: 2024-07-26 - Data Manipulation Modal (Phase 1.2)
**Context:** Second opinion / "Red Team" review of the implementation plan for the Data Manipulation Modal.

**Summary:** The plan is architecturally sound, but three potential long-term risks were identified.

**Identified Risks & Mitigations:**

1.  **Risk: Component Bloat in `LineChart.tsx` (Low Risk)**
    - **Observation:** `LineChart.tsx` acts as a central coordinator. Adding complex modals increases its responsibility and prop drilling.
    - **Mitigation:** Proceed as planned, but monitor `LineChart.tsx` for growing complexity. Consider refactoring to a more direct-to-state context or a controller hook if manipulation features expand significantly in the future.

2.  **Risk: UI Repetition (Medium Risk)**
    - **Observation:** `DataManipulationModal` will duplicate UI structure and styles from `ChartSettingsModal`, violating the DRY principle.
    - **Mitigation (Optional Proactive Step):** Consider creating a `frontend/src/ui/components/shared/` directory for generic, reusable components like `ModalSection`, `StyledDropdown`, and `ModalFooter`. This would improve long-term maintenance. No immediate action required, but recommended for future refactoring.

3.  **Risk: Use of Placeholder `any` Type (High Risk)**
    - **Observation:** Initial plan suggested `onApply: (operationData: any) => void;`, which disables type safety.
    - **Mitigation (Action Taken):** It was decided to **define the data shape interface upfront**. Before building the modal UI, a `DataManipulationTypes.ts` file will be created to define a clear, type-safe contract for the form's output. This mitigates the risk of runtime bugs. 