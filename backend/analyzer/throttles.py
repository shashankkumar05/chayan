from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle, SimpleRateThrottle


def client_ip(request):
    """Client address. Railway's edge sets X-Real-IP to the connecting client; locally we use the socket address."""
    meta = request.META
    return (meta.get("HTTP_X_REAL_IP") or meta.get("REMOTE_ADDR") or "unknown").strip()


class AnonThrottle(AnonRateThrottle):
    def get_ident(self, request):
        return client_ip(request)


class ScopedThrottle(ScopedRateThrottle):
    """Rate comes from the view's throttle_scope. Logged-in users are counted per user, others per IP."""
    def get_ident(self, request):
        return client_ip(request)


class LoginNameThrottle(SimpleRateThrottle):
    """Limit attempts per username, so one account cannot be guessed from many addresses."""
    scope = "login_name"

    def get_cache_key(self, request, view):
        data = request.data
        name = str(data.get("username", "") if hasattr(data, "get") else "").strip().lower()
        return self.cache_format % {"scope": self.scope, "ident": name[:150]} if name else None


class AnalyzeDayThrottle(SimpleRateThrottle):
    """Daily cap on analyses per logged-in user (each analysis uses real CPU and memory)."""
    scope = "analyze_day"

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return self.cache_format % {"scope": self.scope, "ident": request.user.pk}
        return None
