// Shared types for LineChart module
export interface DataPoint {
  date: string;
  [key: string]: string | number; // Allow dynamic series names
}

export interface Series {
  name: string;
  dataKey: string;
  color?: string;
}

export interface LineChartProps {
  id: string;
  onClose: (id: string) => void;
  data?: DataPoint[];
  series?: Series[];
  dataSeries?: import('../../../../core/models/DataTypes').DataSeries[];
  isDropTarget?: boolean;
  gridSize?: string;
} 