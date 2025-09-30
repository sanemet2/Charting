# connection.py
# Minimal Bloomberg Desktop API session (no data requests)

from __future__ import annotations
import blpapi

HOST = "localhost"
PORT = 8194


class BloombergSession:
    """
    Minimal context-managed Bloomberg Desktop API session.

    - Starts a blpapi.Session on enter.
    - Stops it on exit.
    - Does NOT open any services automatically.
    - Use .open_service("//blp/refdata") etc. explicitly in other modules.
    """

    def __init__(self, host: str = HOST, port: int = PORT):
        self.host = host
        self.port = port
        self._session: blpapi.Session | None = None

    def __enter__(self) -> "BloombergSession":
        opts = blpapi.SessionOptions()
        opts.setServerAddress(self.host, self.port, 0)
        # opts.setAutoRestartOnDisconnection(True)  # optional

        session = blpapi.Session(opts)
        if not session.start():
            raise RuntimeError(
                "Failed to start Bloomberg Desktop API session. Is the Terminal running?"
            )

        self._session = session
        return self

    def __exit__(self, exc_type, exc, tb):
        if self._session:
            try:
                self._session.stop()
            finally:
                self._session = None

    @property
    def session(self) -> blpapi.Session:
        if self._session is None:
            raise RuntimeError("Session is not started.")
        return self._session

    @property
    def is_connected(self) -> bool:
        return self._session is not None

    def open_service(self, service_uri: str):
        """
        Open a Bloomberg service explicitly (e.g., "//blp/refdata", "//blp/mktdata").
        Returns the blpapi.Service handle if successful.
        """
        if self._session is None:
            raise RuntimeError("Session is not started.")
        if not self._session.openService(service_uri):
            raise RuntimeError(f"Failed to open service: {service_uri}")
        return self._session.getService(service_uri)


if __name__ == "__main__":
    # Simple smoke test: start a session and (optionally) open //blp/refdata.
    try:
        with BloombergSession() as bb:
            print(
                f"✅ Session started: connected={bb.is_connected} (host={HOST}, port={PORT})"
            )
            # Optional: confirm we can open the reference data service.
            try:
                bb.open_service("//blp/refdata")
                print("✅ Opened service: //blp/refdata")
            except Exception as svc_err:
                # This can fail if Terminal is up but you lack permissions, etc.
                print(f"ℹ️ Session OK, but couldn't open //blp/refdata: {svc_err}")
    except Exception as err:
        print(f"❌ Could not start Bloomberg session: {err}")


