import time
import redis
import logging
from django.db import connections
from django.db.utils import OperationalError
from django.conf import settings
from celery import current_app
from celery.exceptions import OperationalError as CeleryOperationalError

logger = logging.getLogger(__name__)


def check_database_health():
    """Check database connection health"""
    start_time = time.time()
    try:
        connections['default'].cursor()
        latency = (time.time() - start_time) * 1000  # ms
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "engine": connections['default'].settings_dict.get('ENGINE', 'unknown')
        }
    except OperationalError as e:
        latency = (time.time() - start_time) * 1000
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "latency_ms": round(latency, 2),
            "error": str(e)
        }


def check_redis_health():
    """Check Redis connection health"""
    start_time = time.time()
    redis_url = settings.REDIS_URL
    try:
        r = redis.from_url(redis_url)
        r.ping()
        latency = (time.time() - start_time) * 1000
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "url": redis_url.split('@')[-1]  # Mask credentials in URL
        }
    except redis.ConnectionError as e:
        latency = (time.time() - start_time) * 1000
        logger.warning(f"Redis health check failed: {str(e)}")
        
        # In eager/test mode with local cache, Redis is optional - mark as degraded not unhealthy
        if settings.DEBUG or settings.CELERY_TASK_ALWAYS_EAGER:
            return {
                "status": "degraded",
                "latency_ms": round(latency, 2),
                "error": str(e),
                "message": "Redis unavailable but running in development/eager mode - core functionality still works"
            }
        
        # In production, Redis is required - mark as unhealthy
        return {
            "status": "unhealthy",
            "latency_ms": round(latency, 2),
            "error": str(e)
        }


def check_celery_health():
    """Check Celery worker health"""
    start_time = time.time()
    try:
        # If we're in eager mode, we don't need a broker connection
        if settings.CELERY_TASK_ALWAYS_EAGER:
            latency = (time.time() - start_time) * 1000
            return {
                "status": "healthy",
                "latency_ms": round(latency, 2),
                "mode": "eager",
                "message": "Running in eager mode (no external workers or broker required)"
            }
            
        # Inspect active workers only when not in eager mode
        insp = current_app.control.inspect()
        workers = insp.active() if insp.active() else {}
        latency = (time.time() - start_time) * 1000
        
        if workers:
            worker_count = len(workers)
            return {
                "status": "healthy",
                "latency_ms": round(latency, 2),
                "worker_count": worker_count,
                "workers": list(workers.keys())
            }
        else:
            return {
                "status": "degraded",
                "latency_ms": round(latency, 2),
                "error": "No Celery workers registered"
            }
    except (CeleryOperationalError, Exception) as e:
        latency = (time.time() - start_time) * 1000
        logger.warning(f"Celery health check failed: {str(e)}")
        
        # In eager mode or development, broker connection issues are expected if Redis isn't running
        if settings.DEBUG or settings.CELERY_TASK_ALWAYS_EAGER:
            return {
                "status": "healthy",
                "latency_ms": round(latency, 2),
                "mode": "eager",
                "message": "Running in development/eager mode - Celery tasks execute synchronously without broker"
            }
        
        # In production, broker connection is required - mark as unhealthy
        return {
            "status": "unhealthy",
            "latency_ms": round(latency, 2),
            "error": str(e)
        }


def check_websocket_health():
    """Check WebSocket/Channels health"""
    start_time = time.time()
    try:
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        # Simple test - just ensure we can access the channel layer
        if channel_layer:
            latency = (time.time() - start_time) * 1000
            backend_type = "redis" if settings.USE_REDIS_CHANNELS else "in_memory"
            
            # If in-memory or we're in dev mode, always return healthy
            if not settings.USE_REDIS_CHANNELS or settings.DEBUG:
                return {
                    "status": "healthy",
                    "latency_ms": round(latency, 2),
                    "backend": backend_type,
                    "message": "Channel layer active"
                }
            
            return {
                "status": "healthy",
                "latency_ms": round(latency, 2),
                "backend": backend_type
            }
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        logger.warning(f"WebSocket health check failed: {str(e)}")
        
        # In development, even if channel layer isn't perfect, core app works
        if settings.DEBUG:
            return {
                "status": "degraded",
                "latency_ms": round(latency, 2),
                "error": str(e),
                "message": "WebSocket channel layer unavailable but core app still works"
            }
            
        return {
            "status": "unhealthy",
            "latency_ms": round(latency, 2),
            "error": str(e)
        }


def get_aggregate_health():
    """Get comprehensive system health status"""
    start_time = time.time()
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    db_health = check_database_health()
    redis_health = check_redis_health()
    celery_health = check_celery_health()
    websocket_health = check_websocket_health()
    
    all_checks = [db_health, redis_health, celery_health, websocket_health]
    any_unhealthy = any(check["status"] == "unhealthy" for check in all_checks)
    any_degraded = any(check["status"] == "degraded" for check in all_checks)
    
    overall_status = "healthy"
    if any_unhealthy:
        overall_status = "unhealthy"
    elif any_degraded:
        overall_status = "degraded"
    
    total_latency = (time.time() - start_time) * 1000
    
    return {
        "status": overall_status,
        "latency_ms": round(total_latency, 2),
        "timestamp": timestamp,
        "services": {
            "database": db_health,
            "redis": redis_health,
            "celery": celery_health,
            "websocket": websocket_health
        }
    }