// Import data type interfaces from models for type definitions
import { DataStructure, ExcelFile, ExcelTab, DataSeries, DataPoint } from '../models/DataTypes';

// Define helper function to generate date arrays for data series
const generateDates = (
  // Define startDate parameter as Date for beginning of date range
  startDate: Date, 
  // Define endDate parameter as Date for end of date range
  endDate: Date, 
  // Define frequency parameter with specific time interval options
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
): string[] => {
  // Initialize dates array to store generated date strings
  const dates: string[] = [];
  // Create current date variable starting from startDate
  const current = new Date(startDate);
  
  // Loop while current date is less than or equal to endDate
  while (current <= endDate) {
    // Add current date to dates array as ISO string without time
    dates.push(current.toISOString().split('T')[0]);
    
    // Switch on frequency to determine date increment
    switch (frequency) {
      // Increment current date by 1 day for daily frequency
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      // Increment current date by 7 days for weekly frequency
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      // Increment current date by 1 month for monthly frequency
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      // Increment current date by 3 months for quarterly frequency
      case 'quarterly':
        current.setMonth(current.getMonth() + 3);
        break;
      // Increment current date by 1 year for yearly frequency
      case 'yearly':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }
  
  // Return completed dates array
  return dates;
};

// Define function to generate realistic financial data with trend and volatility
const generateFinancialData = (
  // Define dates parameter as string array for data point timestamps
  dates: string[], 
  // Define baseValue parameter as number for starting value
  baseValue: number, 
  // Define volatility parameter with default 0.02 for price fluctuation
  volatility: number = 0.02,
  // Define trend parameter with default 0.0001 for growth direction
  trend: number = 0.0001
): DataPoint[] => {
  // Initialize currentValue variable with baseValue
  let currentValue = baseValue;
  
  // Map dates array to create DataPoint objects with calculated values
  return dates.map((date, index) => {
    // Apply trend multiplication to currentValue for growth
    currentValue *= (1 + trend);
    
    // Calculate random volatility change between -volatility and +volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    // Apply random volatility to currentValue for realistic fluctuation
    currentValue *= (1 + randomChange);
    
    // Ensure currentValue stays positive using Math.max
    currentValue = Math.max(currentValue * 0.1, currentValue);
    
    // Return DataPoint object with date and rounded value
    return {
      date,
      value: Math.round(currentValue * 100) / 100
    };
  });
};

// Define function to create complete mock data structure for testing
export const createMockDataStructure = (): DataStructure => {
  // Initialize startDate as Date object for data range beginning
  const startDate = new Date('2020-01-01');
  // Initialize endDate as Date object for data range end
  const endDate = new Date('2024-12-31');
  
  // Initialize files array containing mock ExcelFile objects
  const files: ExcelFile[] = [
    {
      id: 'bloomberg-equity-1',
      name: 'Bloomberg_Equity_Data.xlsx',
      lastModified: '2024-06-20',
      size: '2.3 MB',
      tabs: [
        {
          id: 'us-indices',
          name: 'US Indices',
          series: [
            {
              id: 'spx-index',
              name: 'SPX Index',
              description: 'S&P 500 Index',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                4200,
                0.012,
                0.0002
              ),
              lastUpdated: '2024-06-20',
              source: 'Bloomberg',
              unit: 'Index Points'
            },
            {
              id: 'ndx-index',
              name: 'NDX Index',
              description: 'NASDAQ 100 Index',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                14500,
                0.015,
                0.0003
              ),
              lastUpdated: '2024-06-20',
              source: 'Bloomberg',
              unit: 'Index Points'
            },
            {
              id: 'dji-index',
              name: 'DJI Index',
              description: 'Dow Jones Industrial Average',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                35000,
                0.010,
                0.0001
              ),
              lastUpdated: '2024-06-20',
              source: 'Bloomberg',
              unit: 'Index Points'
            }
          ]
        },
        {
          id: 'individual-stocks',
          name: 'Individual Stocks',
          series: [
            {
              id: 'aapl-us',
              name: 'AAPL US Equity',
              description: 'Apple Inc',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                150,
                0.018,
                0.0002
              ),
              lastUpdated: '2024-06-20',
              source: 'Bloomberg',
              unit: 'USD',
              currency: 'USD'
            },
            {
              id: 'msft-us',
              name: 'MSFT US Equity',
              description: 'Microsoft Corporation',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                300,
                0.016,
                0.0003
              ),
              lastUpdated: '2024-06-20',
              source: 'Bloomberg',
              unit: 'USD',
              currency: 'USD'
            },
            {
              id: 'googl-us',
              name: 'GOOGL US Equity',
              description: 'Alphabet Inc Class A',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                2500,
                0.017,
                0.0002
              ),
              lastUpdated: '2024-06-20',
              source: 'Bloomberg',
              unit: 'USD',
              currency: 'USD'
            }
          ]
        }
      ]
    },
    {
      id: 'bloomberg-rates-1',
      name: 'Bloomberg_Interest_Rates.xlsx',
      lastModified: '2024-06-19',
      size: '1.8 MB',
      tabs: [
        {
          id: 'us-treasury',
          name: 'US Treasury',
          series: [
            {
              id: 'us-2y-yield',
              name: 'USGG2YR Index',
              description: 'US Generic Govt 2 Year Yield',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                2.5,
                0.008,
                0.0001
              ),
              lastUpdated: '2024-06-19',
              source: 'Bloomberg',
              unit: '%'
            },
            {
              id: 'us-10y-yield',
              name: 'USGG10YR Index',
              description: 'US Generic Govt 10 Year Yield',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                3.2,
                0.006,
                0.0001
              ),
              lastUpdated: '2024-06-19',
              source: 'Bloomberg',
              unit: '%'
            },
            {
              id: 'us-30y-yield',
              name: 'USGG30YR Index',
              description: 'US Generic Govt 30 Year Yield',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                4.0,
                0.005,
                0.0001
              ),
              lastUpdated: '2024-06-19',
              source: 'Bloomberg',
              unit: '%'
            }
          ]
        },
        {
          id: 'fed-data',
          name: 'Federal Reserve',
          series: [
            {
              id: 'fed-funds-rate',
              name: 'FDTR Index',
              description: 'Federal Funds Target Rate',
              frequency: 'monthly',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'monthly'),
                1.5,
                0.002,
                0.001
              ),
              lastUpdated: '2024-06-15',
              source: 'Federal Reserve',
              unit: '%'
            }
          ]
        }
      ]
    },
    {
      id: 'bloomberg-fx-1',
      name: 'Bloomberg_FX_Data.xlsx',
      lastModified: '2024-06-20',
      size: '3.1 MB',
      tabs: [
        {
          id: 'major-currencies',
          name: 'Major Currencies',
          series: [
            {
              id: 'eur-usd',
              name: 'EURUSD Curncy',
              description: 'Euro-US Dollar Exchange Rate',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                1.10,
                0.005,
                -0.00005
              ),
              lastUpdated: '2024-06-20',
              source: 'Bloomberg',
              unit: 'USD per EUR'
            },
            {
              id: 'gbp-usd',
              name: 'GBPUSD Curncy',
              description: 'British Pound-US Dollar Exchange Rate',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                1.25,
                0.006,
                -0.00007
              ),
              lastUpdated: '2024-06-20',
              source: 'Bloomberg',
              unit: 'USD per GBP'
            },
            {
              id: 'usd-jpy',
              name: 'USDJPY Curncy',
              description: 'US Dollar-Japanese Yen Exchange Rate',
              frequency: 'daily',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'daily'),
                110,
                0.004,
                0.00008
              ),
              lastUpdated: '2024-06-20',
              source: 'Bloomberg',
              unit: 'JPY per USD'
            }
          ]
        }
      ]
    },
    {
      id: 'economic-indicators',
      name: 'Economic_Indicators.xlsx',
      lastModified: '2024-06-18',
      size: '950 KB',
      tabs: [
        {
          id: 'employment',
          name: 'Employment Data',
          series: [
            {
              id: 'unemployment-rate',
              name: 'USURTOT Index',
              description: 'US Unemployment Rate',
              frequency: 'monthly',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'monthly'),
                4.2,
                0.01,
                -0.0002
              ),
              lastUpdated: '2024-06-05',
              source: 'Bureau of Labor Statistics',
              unit: '%'
            },
            {
              id: 'nonfarm-payrolls',
              name: 'NFP TCH Index',
              description: 'US Nonfarm Payrolls Total MoM Net Change SA',
              frequency: 'monthly',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'monthly'),
                200000,
                0.15,
                0.001
              ),
              lastUpdated: '2024-06-05',
              source: 'Bureau of Labor Statistics',
              unit: 'Thousands'
            }
          ]
        },
        {
          id: 'inflation',
          name: 'Inflation Data',
          series: [
            {
              id: 'cpi-yoy',
              name: 'CPI YOY Index',
              description: 'US Consumer Price Index Year-over-Year',
              frequency: 'monthly',
              dataPoints: generateFinancialData(
                generateDates(startDate, endDate, 'monthly'),
                3.2,
                0.008,
                -0.0003
              ),
              lastUpdated: '2024-06-12',
              source: 'Bureau of Labor Statistics',
              unit: '%'
            }
          ]
        }
      ]
    }
  ];
  
  // Return DataStructure object containing files array
  return { files };
};

// Export mockDataService object providing data access methods
export const mockDataService = {
  // Define getData method returning complete mock data structure
  getData: () => createMockDataStructure(),
  // Define searchSeries method for finding series by query string
  searchSeries: (query: string): any[] => {
    // Get complete data structure using createMockDataStructure function
    const data = createMockDataStructure();
    // Initialize results array to store matching series
    const results: any[] = [];
    
    // Convert query to lowercase for case-insensitive search
    const searchTerm = query.toLowerCase();
    
    // Iterate through files array to find matching series
    data.files.forEach(file => {
      // Iterate through tabs array within each file
      file.tabs.forEach(tab => {
        // Iterate through series array within each tab
        tab.series.forEach(series => {
          // Check if series name or description contains search term
          if (
            series.name.toLowerCase().includes(searchTerm) ||
            series.description?.toLowerCase().includes(searchTerm)
          ) {
            // Add matching series with context to results array
            results.push({
              series,
              tab: tab.name,
              file: file.name
            });
          }
        });
      });
    });
    
    // Return results array containing matching series
    return results;
  }
}; 