// Define core data types for Chart Library application

// Define DataPoint interface for individual data entries
export interface DataPoint {
  // Define date property as string for data point timestamp
  date: string;
  // Define value property as number for data point measurement
  value: number;
}

// Define DataSeries interface for collection of related data points
export interface DataSeries {
  // Define id property as string for unique series identification
  id: string;
  // Define name property as string for series display label
  name: string;
  // Define optional description property for series details
  description?: string;
  // Define frequency property with specific time interval options
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  // Define dataPoints property as array of DataPoint objects
  dataPoints: DataPoint[];
  // Define lastUpdated property as string for modification timestamp
  lastUpdated: string;
  // Define optional source property for data origin information
  source?: string;
  // Define optional unit property for measurement unit
  unit?: string;
  // Define optional currency property for monetary data
  currency?: string;
}

// Define ExcelTab interface for spreadsheet tab representation
export interface ExcelTab {
  // Define id property as string for unique tab identification
  id: string;
  // Define name property as string for tab display label
  name: string;
  // Define series property as array of DataSeries objects
  series: DataSeries[];
}

// Define ExcelFile interface for complete spreadsheet representation
export interface ExcelFile {
  // Define id property as string for unique file identification
  id: string;
  // Define name property as string for file display label
  name: string;
  // Define tabs property as array of ExcelTab objects
  tabs: ExcelTab[];
  // Define lastModified property as string for file modification timestamp
  lastModified: string;
  // Define size property as string for file size information
  size: string;
}

// Define DataStructure interface for complete data hierarchy
export interface DataStructure {
  // Define files property as array of ExcelFile objects
  files: ExcelFile[];
}

// Define SeriesMetadata interface for hover display information
export interface SeriesMetadata {
  // Define seriesId property as string for series identification
  seriesId: string;
  // Define name property as string for series display label
  name: string;
  // Define optional description property for series details
  description?: string;
  // Define frequency property as string for data collection interval
  frequency: string;
  // Define dateRange property as object with start and end dates
  dateRange: {
    // Define start property as string for earliest data date
    start: string;
    // Define end property as string for latest data date
    end: string;
  };
  // Define dataCount property as number for total data points
  dataCount: number;
  // Define optional lastValue property for most recent measurement
  lastValue?: number;
  // Define lastUpdated property as string for modification timestamp
  lastUpdated: string;
  // Define optional source property for data origin information
  source?: string;
  // Define optional unit property for measurement unit
  unit?: string;
  // Define optional currency property for monetary data
  currency?: string;
} 