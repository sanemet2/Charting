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