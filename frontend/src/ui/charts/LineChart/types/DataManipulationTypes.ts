// Data Manipulation Types for LineChart
// Defines the structure of form data collected by DataManipulationModal

// Import Series type for proper typing
import { Series } from './index';

export interface YearOverYearParams {
  seriesId: string;
  frequency: 'year' | 'quarter' | 'month';
  calculationType: 'percentage' | 'basisPoints';
}

export interface MathematicalParams {
  primarySeriesId: string;
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  secondarySeriesId: string;
}

export interface LeadLagParams {
  seriesId: string;
  direction: 'lead' | 'lag';
  periods: number;
  unit: 'weeks' | 'months' | 'years';
}

export interface FormulaParams {
  expression: string;
  variables: string[]; // Series names used in the formula
}

// Union type for all operation parameters
export type OperationParams = YearOverYearParams | MathematicalParams | LeadLagParams | FormulaParams;

// Main form data interface - represents what the modal collects
export interface ManipulationFormData {
  operationType: 'yoy' | 'math' | 'leadlag' | 'formula';
  parameters: OperationParams;
}

// Series interface for the modal (simplified from main Series type)
export interface ModalSeries {
  id: string;
  name: string;
  dataKey: string;
  color?: string;
}

// Props interface for the DataManipulationModal component
export interface DataManipulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (formData: ManipulationFormData) => void;
  processedSeries: ModalSeries[];
  seriesNames: { [key: string]: string };
}

// Form section state interfaces for internal modal state management
export interface YoYFormState {
  seriesId: string;
  frequency: YearOverYearParams['frequency'];
  calculationType: YearOverYearParams['calculationType'];
}

export interface MathFormState {
  primarySeriesId: string;
  operation: MathematicalParams['operation'];
  secondarySeriesId: string;
}

export interface LeadLagFormState {
  seriesId: string;
  direction: LeadLagParams['direction'];
  periods: number;
  unit: LeadLagParams['unit'];
}

export interface FormulaFormState {
  expression: string;
  isValid: boolean;
  errorMessage?: string;
  detectedVariables: string[];
} 