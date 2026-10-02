import time


# ---------------------------------------------------------------------------
# Open-Meteo free tier usage meter
# ---------------------------------------------------------------------------
# Open-Meteo's free API (api.open-meteo.com) is rate-limited PER IP.
# Source: Sources/App/Helper/Vapor/RateLimiter.swift (open-meteo/open-meteo)
#         + https://open-meteo.com/en/pricing ("How is one API call defined?")
#
#   * 600   calls / minute
#   * 5,000 calls / hour
#   * 10,000 calls / day          <-- the limit that matters for a dashboard
#
# A single HTTP request does not always count as "1 call". Open-Meteo uses a
# fractional weight:
#
#       calls = max(1.0, (variables / 10) * (time_span_days / 14))
#
# The official examples from the pricing page confirm this:
#       14 days + 15 variables -> (15/10) * (14/14) = 1.5 call
#       28 days + 15 variables -> (15/10) * (28/14) = 3.0 calls
#       14 days + 10 variables -> (10/10) * (14/14) = 1.0 call  (the baseline)
#
# This class mirrors Open-Meteo's own rolling counters (they keep separate
# minute/hour/day totals per IP and clear them when the epoch boundary
# passes) so we always know how much of the budget this dashboard has used.
#
# NOTE: this is a LOCAL estimate. Open-Meteo enforces the real per-IP limit
# server-side; our process-level counter resets on restart, but the provider's
# does not. It is accurate enough to plan refresh rates and avoid 429s.
# ---------------------------------------------------------------------------
LIMIT_MINUTELY = 600
LIMIT_HOURLY = 5000
LIMIT_DAILY = 10000


class OpenMeteoBudget:
    def __init__(self, variables: int, days: float):
        self.variables = variables
        self.days = days
        # Fractional cost of ONE forecast request (see formula above).
        self.cost_per_call = max(1.0, (variables / 10.0) * (days / 14.0))

        self._min = 0.0
        self._hour = 0.0
        self._day = 0.0
        self._fetches = 0

        now = int(time.time())
        self._last_min = now // 60
        self._last_hour = now // 3600
        self._last_day = now // 86400

    # -- rolling counters ---------------------------------------------------
    def record(self):
        """Record that one forecast request was sent to Open-Meteo."""
        now = int(time.time())
        m, h, d = now // 60, now // 3600, now // 86400
        if m != self._last_min:
            self._min = 0.0
            self._last_min = m
        if h != self._last_hour:
            self._hour = 0.0
            self._last_hour = h
        if d != self._last_day:
            self._day = 0.0
            self._fetches = 0
            self._last_day = d

        self._min += self.cost_per_call
        self._hour += self.cost_per_call
        self._day += self.cost_per_call
        self._fetches += 1

    # -- seconds until a window resets (mirrors the epoch-boundary reset) ---
    @staticmethod
    def _seconds_to(window: str) -> int:
        now = int(time.time())
        if window == "minutely":
            return 60 - (now % 60)
        if window == "hourly":
            return 3600 - (now % 3600)
        return 86400 - (now % 86400)

    # -- snapshot for the frontend -----------------------------------------
    def get_status(self, auto_interval: int) -> dict:
        now = int(time.time())
        daily_remaining = max(0.0, LIMIT_DAILY - self._day)
        # At an auto-refresh every `auto_interval` seconds (while a client is
        # connected), how many more auto-fetches fit in today's budget, and how
        # long is that as uptime?
        fetches_left = daily_remaining / self.cost_per_call
        uptime_hours = (fetches_left * auto_interval) / 3600.0

        # How many manual refreshes could still fire today at the same cost?
        manual_left = int(daily_remaining // self.cost_per_call)

        return {
            "cost_per_call": round(self.cost_per_call, 3),
            "variables": self.variables,
            "days": self.days,
            "limit_daily": LIMIT_DAILY,
            "limit_hourly": LIMIT_HOURLY,
            "limit_minutely": LIMIT_MINUTELY,
            "used_today": round(self._day, 1),
            "used_this_hour": round(self._hour, 1),
            "remaining_today": round(daily_remaining, 1),
            "day_pct": round(self._day / LIMIT_DAILY * 100, 2),
            "fetches_today": self._fetches,
            "manual_refreshes_left_today": manual_left,
            "auto_interval_sec": auto_interval,
            "uptime_hours_at_auto": round(uptime_hours, 1),
            "seconds_to_daily_reset": self._seconds_to("daily"),
            "seconds_to_hourly_reset": self._seconds_to("hourly"),
            "seconds_to_minutely_reset": self._seconds_to("minutely"),
        }
