# mock_connection.py
# Mock Bloomberg session for development/testing without Bloomberg Terminal

from __future__ import annotations
from typing import Any, Dict


class MockBloombergSession:
    """
    Mock implementation of BloombergSession that mimics the real API interface.
    
    - Provides the same context manager interface (__enter__/__exit__)
    - Same properties and methods as BloombergSession
    - No external dependencies - works without Bloomberg Terminal
    - Easy to swap with real implementation later
    """

    def __init__(self, host: str = "localhost", port: int = 8194):
        self.host = host
        self.port = port
        self._session: Dict[str, Any] | None = None
        self._services: Dict[str, Any] = {}

    def __enter__(self) -> "MockBloombergSession":
        # Simulate successful session start
        self._session = {"connected": True, "mock": True}
        return self

    def __exit__(self, exc_type, exc, tb):
        # Simulate session cleanup
        if self._session:
            self._session = None
            self._services.clear()

    @property
    def session(self) -> Dict[str, Any]:
        """Mock session object - returns dict instead of blpapi.Session"""
        if self._session is None:
            raise RuntimeError("Session is not started.")
        return self._session

    @property
    def is_connected(self) -> bool:
        return self._session is not None

    def open_service(self, service_uri: str) -> Dict[str, Any]:
        """
        Mock service opening - always succeeds for common Bloomberg services.
        Returns a mock service object.
        """
        if self._session is None:
            raise RuntimeError("Session is not started.")
        
        # Simulate successful service opening for known Bloomberg services
        known_services = ["//blp/refdata", "//blp/mktdata"]
        if service_uri not in known_services:
            raise RuntimeError(f"Mock: Unknown service: {service_uri}")
        
        mock_service = {"uri": service_uri, "mock": True}
        self._services[service_uri] = mock_service
        return mock_service


if __name__ == "__main__":
    # Test the mock session
    try:
        with MockBloombergSession() as bb:
            print(f"✅ Mock session started: connected={bb.is_connected}")
            
            # Test service opening
            try:
                service = bb.open_service("//blp/refdata")
                print(f"✅ Opened mock service: {service}")
            except Exception as svc_err:
                print(f"❌ Mock service error: {svc_err}")
                
    except Exception as err:
        print(f"❌ Mock session error: {err}")