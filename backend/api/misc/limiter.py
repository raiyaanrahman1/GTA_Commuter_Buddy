from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

def global_endpoint_counter(request: Request) -> str:
    return "global_monthly_endpoint_quota"

async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    # Safe attribute navigation to find the window granularity (e.g., "minute", "month")
    granularity_name = None
    if hasattr(exc, "limit") and hasattr(exc.limit, "limit"):
        limit_item = exc.limit.limit # type: ignore
        if hasattr(limit_item, "GRANULARITY"):
            granularity_name = limit_item.GRANULARITY.name

    # Formulate a tailored message based on the breached limit window
    if granularity_name == "minute":
        message = "Too many requests. Please slow down and try again in a minute."
    elif granularity_name == "month":
        message = "You have reached your monthly limit of 1,000 route requests."
    else:
        # Fallback to the default slowapi representation if another limit is hit
        detail = getattr(exc, "detail", "Too many requests")
        message = f"Rate limit exceeded: {detail}"

    return JSONResponse(
        status_code=429,
        content={"error": message, "message": message}
    )

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379/0"
)
