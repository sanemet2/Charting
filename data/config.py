# backend/config.py
# Configuration system for switching between mock and real Bloomberg implementations

import os
from typing import Type, Union

# Import both implementations
try:
    from data.connection import BloombergSession
    from data.data_fetcher import BloombergDataFetcher
    REAL_BLOOMBERG_AVAILABLE = True
except ImportError:
    # Bloomberg API not available - will fall back to mock
    BloombergSession = None
    BloombergDataFetcher = None
    REAL_BLOOMBERG_AVAILABLE = False

from data.mock_connection import MockBloombergSession
from data.mock_data_fetcher import MockBloombergDataFetcher


# Configuration setting - can be controlled via environment variable
USE_MOCK_BLOOMBERG = os.getenv("USE_MOCK_BLOOMBERG", "true").lower() in ("true", "1", "yes")

# If real Bloomberg isn't available, force mock mode
if not REAL_BLOOMBERG_AVAILABLE:
    USE_MOCK_BLOOMBERG = True


def get_bloomberg_session() -> Union[Type[BloombergSession], Type[MockBloombergSession]]:
    """
    Factory function to get the appropriate Bloomberg session class.
    
    Returns:
    - BloombergSession if real Bloomberg is configured and available
    - MockBloombergSession if using mock mode or real Bloomberg unavailable
    """
    if USE_MOCK_BLOOMBERG or not REAL_BLOOMBERG_AVAILABLE:
        return MockBloombergSession
    else:
        return BloombergSession


def get_bloomberg_data_fetcher() -> Union[Type[BloombergDataFetcher], Type[MockBloombergDataFetcher]]:
    """
    Factory function to get the appropriate Bloomberg data fetcher class.
    
    Returns:
    - BloombergDataFetcher if real Bloomberg is configured and available  
    - MockBloombergDataFetcher if using mock mode or real Bloomberg unavailable
    """
    if USE_MOCK_BLOOMBERG or not REAL_BLOOMBERG_AVAILABLE:
        return MockBloombergDataFetcher
    else:
        return BloombergDataFetcher


def get_bloomberg_mode() -> str:
    """
    Get current Bloomberg mode for display/logging purposes.
    
    Returns:
    - "mock" if using mock implementation
    - "real" if using real Bloomberg API
    """
    if USE_MOCK_BLOOMBERG:
        return "mock"
    elif REAL_BLOOMBERG_AVAILABLE:
        return "real"
    else:
        return "mock (real unavailable)"


# Convenience exports - these will automatically use the configured implementation
BloombergSessionFactory = get_bloomberg_session()
BloombergDataFetcherFactory = get_bloomberg_data_fetcher()


if __name__ == "__main__":
    # Test the configuration system
    print(f"Bloomberg mode: {get_bloomberg_mode()}")
    print(f"Real Bloomberg available: {REAL_BLOOMBERG_AVAILABLE}")
    print(f"Using mock Bloomberg: {USE_MOCK_BLOOMBERG}")
    print(f"Session class: {BloombergSessionFactory.__name__}")
    print(f"Data fetcher class: {BloombergDataFetcherFactory.__name__}")
    
    # Test that we can create instances
    try:
        with BloombergSessionFactory() as session:
            fetcher = BloombergDataFetcherFactory(session)
            print(f"✅ Successfully created {type(session).__name__} and {type(fetcher).__name__}")
    except Exception as e:
        print(f"❌ Error testing configuration: {e}")