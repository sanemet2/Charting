# data_fetcher.py
from __future__ import annotations
from datetime import datetime
import blpapi

from Program.data.connection import BloombergSession
from Program.data.bloomberg_fields import DEFAULT_PERIODICITY


class BloombergDataFetcher:
    """
    Library class that ONLY returns structured data (no printing).
      - fetch_static_descriptors(): dict[str, str]
      - fetch_historical(): list[dict] with 'date' and field values
    """

    def __init__(self, session: BloombergSession, periodicity: str = DEFAULT_PERIODICITY):
        self.session_ctx = session
        self.periodicity = periodicity   # DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY

    # ---------------- Internal helpers ---------------- #
    def _send_request(self, request) -> list[blpapi.Message]:
        """Send a request and return all response messages as a list."""
        msgs: list[blpapi.Message] = []
        self.session_ctx.session.sendRequest(request)
        while True:
            event = self.session_ctx.session.nextEvent()
            etype = event.eventType()
            if etype in (blpapi.Event.RESPONSE, blpapi.Event.PARTIAL_RESPONSE):
                for msg in event:
                    msgs.append(msg)
                if etype == blpapi.Event.RESPONSE:
                    break
            else:
                # drain non-response events
                for _ in event:
                    pass
        return msgs

    # ---------------- Public API ---------------- #
    def fetch_static_descriptors(self, ticker: str, static_fields: list[str]) -> dict[str, str]:
        """Return {FIELD: value_as_str} for the given ticker."""
        if not static_fields:
            return {}
        ref_svc = self.session_ctx.open_service("//blp/refdata")
        req = ref_svc.createRequest("ReferenceDataRequest")
        req.getElement("securities").appendValue(ticker)
        f_el = req.getElement("fields")
        for f in static_fields:
            f_el.appendValue(f)

        msgs = self._send_request(req)
        out: dict[str, str] = {}
        for msg in msgs:
            if not msg.hasElement("securityData"):
                continue
            sdata_arr = msg.getElement("securityData")
            for i in range(sdata_arr.numValues()):
                sdata = sdata_arr.getValueAsElement(i)
                if sdata.hasElement("fieldData"):
                    fd = sdata.getElement("fieldData")
                    for f in static_fields:
                        if fd.hasElement(f):
                            out[f] = fd.getElementAsString(f)
        return out

    def fetch_historical(
        self,
        ticker: str,
        fields: list[str],
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[dict]:
        """
        Return rows like:
        [{"date": datetime, "PX_LAST": 123.45, ...}, ...]
        """
        if not fields:
            return []

        start = start_date or "19000101"
        end = end_date or datetime.today().strftime("%Y%m%d")

        hist_svc = self.session_ctx.open_service("//blp/historicaldata")
        req = hist_svc.createRequest("HistoricalDataRequest")
        req.getElement("securities").appendValue(ticker)
        f_el = req.getElement("fields")
        for f in fields:
            f_el.appendValue(f)
        req.set("startDate", start)
        req.set("endDate", end)
        req.set("periodicitySelection", self.periodicity)

        msgs = self._send_request(req)
        rows: list[dict] = []
        for msg in msgs:
            if not msg.hasElement("securityData"):
                continue
            sdata = msg.getElement("securityData")
            if not sdata.hasElement("fieldData"):
                continue

            data_array = sdata.getElement("fieldData")
            for i in range(data_array.numValues()):
                ed = data_array.getValueAsElement(i)
                row = {}
                if ed.hasElement("date"):
                    row["date"] = ed.getElementAsDatetime("date")
                for f in fields:
                    if ed.hasElement(f):
                        try:
                            row[f] = ed.getElement(f).getValue()
                        except Exception:
                            row[f] = str(ed.getElement(f))
                rows.append(row)
        return rows


