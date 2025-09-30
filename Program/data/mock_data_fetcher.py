# mock_data_fetcher.py
# Mock Bloomberg data fetcher with realistic sample financial data

from __future__ import annotations
from datetime import datetime, timedelta
from typing import List, Dict, Any
import hashlib
import random
import math

from Program.data.mock_connection import MockBloombergSession
from Program.data.bloomberg_fields import DEFAULT_PERIODICITY


class MockBloombergDataFetcher:
    """
    Mock implementation of BloombergDataFetcher that generates realistic financial data.
    
    - Same interface as the real BloombergDataFetcher
    - Generates realistic price data with trends and volatility
    - Supports the same periodicity options (DAILY, WEEKLY, MONTHLY, etc.)
    - Easy to swap with real implementation later
    """

    def __init__(self, session: MockBloombergSession, periodicity: str = DEFAULT_PERIODICITY):
        self.session_ctx = session
        self.periodicity = periodicity

    def fetch_static_descriptors(self, ticker: str, fields: List[str]) -> Dict[str, str]:
        """
        Mock static data fetch - returns realistic company names and descriptions.
        """
        # Sample static data for common tickers
        mock_static_data = {
            "AAPL US Equity": {
                "LONG_COMP_NAME": "Apple Inc",
                "ID_BB_UNIQUE": "EQ0010169500001000",
                "CRNCY": "USD"
            },
            "MSFT US Equity": {
                "LONG_COMP_NAME": "Microsoft Corporation", 
                "ID_BB_UNIQUE": "EQ0010174300001000",
                "CRNCY": "USD"
            },
            "GOOGL US Equity": {
                "LONG_COMP_NAME": "Alphabet Inc Class A",
                "ID_BB_UNIQUE": "EQ0010207200001000", 
                "CRNCY": "USD"
            },
            "SPY US Equity": {
                "LONG_COMP_NAME": "SPDR S&P 500 ETF Trust",
                "ID_BB_UNIQUE": "EQ0000000000001000",
                "CRNCY": "USD"
            },
            "USGG10YR Index": {
                "LONG_COMP_NAME": "US Generic Govt 10 Year Yield",
                "ID_BB_UNIQUE": "IX0000000000001000",
                "CRNCY": "USD"
            }
        }
        
        # Default fallback for unknown tickers
        default_data = {
            "LONG_COMP_NAME": f"Mock Company for {ticker}",
            "ID_BB_UNIQUE": "EQ9999999999999999",
            "CRNCY": "USD"
        }
        
        ticker_data = mock_static_data.get(ticker, default_data)
        
        # Return only requested fields
        result = {}
        for field in fields:
            result[field] = ticker_data.get(field, f"Mock {field} for {ticker}")
        
        return result

    def fetch_historical(self, ticker: str, fields: List[str], 
                        start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Mock historical data fetch - generates realistic time series data.
        
        Parameters:
        - ticker: Bloomberg ticker (e.g., "AAPL US Equity")
        - fields: List of Bloomberg fields (e.g., ["PX_LAST"])
        - start_date: Start date in "YYYYMMDD" format
        - end_date: End date in "YYYYMMDD" format
        
        Returns:
        - List of dictionaries with 'date' and field values
        
        Note: For testing error handling:
        - Fields starting with "ERROR_" will raise exceptions
        - Tickers "FAKE US Equity", "NOTREAL US Equity", etc. return empty data (like real Bloomberg)
        """
        # Simulate Bloomberg field validation errors for testing
        for field in fields:
            if field.upper().startswith("ERROR_"):
                raise ValueError(f"Invalid Bloomberg field: {field}")
            if field.upper().startswith("INVALID_"):
                raise RuntimeError(f"Bloomberg API error: Field '{field}' not found")
        
        # Simulate invalid ticker behavior (returns empty data like real Bloomberg)
        invalid_tickers = [
            "FAKE US Equity", "NOTREAL US Equity", "INVALID US Equity", 
            "TEST123 US Equity", "BADTICKER US Equity"
        ]
        if ticker in invalid_tickers:
            return []  # Empty list, just like real Bloomberg would return
        # Parse dates
        start_dt = datetime.strptime(start_date, "%Y%m%d")
        end_dt = datetime.strptime(end_date, "%Y%m%d")
        
        # Generate date range based on periodicity
        dates = self._generate_date_range(start_dt, end_dt, self.periodicity)
        
        # Use deterministic randomness so identical requests return the same series
        seed_input = f"{ticker}|{start_date}|{end_date}|{self.periodicity}|{','.join(sorted(fields))}".encode('utf-8')
        seed = int(hashlib.sha256(seed_input).hexdigest(), 16) % (2 ** 32)
        rng = random.Random(seed)

        # Generate realistic data based on ticker type
        if "Index" in ticker or "SPY" in ticker:
            base_price = 4500.0  # Index-like starting value
            volatility = 0.015   # Lower volatility for indices
            trend = 0.0001       # Slight upward trend
        elif "YR" in ticker or "Yield" in ticker.upper():
            base_price = 3.5     # Bond yield starting value
            volatility = 0.05    # Higher volatility for yields
            trend = 0.0002       # Slight upward trend
        else:
            base_price = 150.0   # Stock-like starting value  
            volatility = 0.02    # Normal stock volatility
            trend = 0.0003       # Moderate upward trend
        
        # Generate price series with realistic patterns
        rows = []
        current_price = base_price
        
        for i, date in enumerate(dates):
            # Add trend and random walk
            daily_return = rng.normalvariate(trend, volatility)
            current_price *= (1 + daily_return)
            
            # Add some mean reversion to keep prices reasonable
            if current_price > base_price * 2:
                current_price *= 0.95
            elif current_price < base_price * 0.5:
                current_price *= 1.05
            
            # Create row with requested fields
            row = {"date": date}
            for field in fields:
                if field == "PX_LAST":
                    row[field] = round(current_price, 2)
                elif field == "PX_OPEN":
                    row[field] = round(current_price * rng.uniform(0.995, 1.005), 2)
                elif field == "PX_HIGH":
                    row[field] = round(current_price * rng.uniform(1.001, 1.02), 2)
                elif field == "PX_LOW":
                    row[field] = round(current_price * rng.uniform(0.98, 0.999), 2)
                elif field == "PX_VOLUME":
                    row[field] = rng.randint(1000000, 50000000)
                else:
                    # Default mock value for unknown fields
                    row[field] = round(current_price * rng.uniform(0.95, 1.05), 2)
            
            rows.append(row)
        
        return rows

    def _generate_date_range(self, start_dt: datetime, end_dt: datetime, 
                           periodicity: str) -> List[datetime]:
        """Generate date range based on periodicity."""
        dates = []
        current = start_dt
        
        if periodicity == "DAILY":
            delta = timedelta(days=1)
        elif periodicity == "WEEKLY":
            delta = timedelta(weeks=1)
        elif periodicity == "MONTHLY":
            delta = timedelta(days=30)  # Approximate
        elif periodicity == "QUARTERLY":
            delta = timedelta(days=90)  # Approximate
        elif periodicity == "YEARLY":
            delta = timedelta(days=365)  # Approximate
        else:
            delta = timedelta(days=30)  # Default to monthly
        
        while current <= end_dt:
            dates.append(current)
            current += delta
            
        return dates


if __name__ == "__main__":
    # Test the mock data fetcher
    with MockBloombergSession() as session:
        fetcher = MockBloombergDataFetcher(session, "MONTHLY")
        
        # Test static data
        static_data = fetcher.fetch_static_descriptors("AAPL US Equity", ["LONG_COMP_NAME"])
        print(f"Static data: {static_data}")
        
        # Test historical data
        historical_data = fetcher.fetch_historical(
            ticker="AAPL US Equity",
            fields=["PX_LAST"],
            start_date="20240101",
            end_date="20241201"
        )
        print(f"Generated {len(historical_data)} data points")
        print(f"First few rows: {historical_data[:3]}")
        print(f"Last few rows: {historical_data[-3:]}")

