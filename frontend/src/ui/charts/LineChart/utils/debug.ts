// Debug utility for LineChart development
export const debug = (category: string, data: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 ${category}:`, data);
  }
};

// Specific debug categories for LineChart
export const debugCategories = {
  CHART_DATA: 'CHART_DATA',
  AXIS_ASSIGNMENT: 'AXIS_ASSIGNMENT', 
  LEGEND: 'LEGEND',
  RESPONSIVE: 'RESPONSIVE',
  PLOTLY_CONFIG: 'PLOTLY_CONFIG',
  CONTAINER: 'CONTAINER'
} as const; 