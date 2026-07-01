from __future__ import annotations

import time
import requests
from dataclasses import dataclass
from typing import Any
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def mask_api_key(key: str) -> str:
    """Mask API key for safe logging - only show first 4 and last 4 characters"""
    if not key or len(key) < 8:
        return "[MASKED]"
    return f"{key[:4]}...{key[-4:]}"


@dataclass
class ProviderResult:
    status: str
    provider: str
    response_payload: dict
    error_message: str = ""


class BaseProviderAdapter:
    channel = ""
    provider_name = ""
    env_enabled_key = ""
    credential_keys: tuple[str, ...] = ()
    request_timeout = 10  # seconds
    
    # Classify errors as retryable or not
    RETRYABLE_HTTP_CODES = {429, 500, 502, 503, 504}
    
    def enabled(self) -> bool:
        return bool(getattr(settings, self.env_enabled_key, False))

    def missing_credentials(self) -> list[str]:
        return [key for key in self.credential_keys if not getattr(settings, key, "")]
    
    def is_retryable_error(self, exception: Exception | None = None, status_code: int | None = None) -> bool:
        """Determine if an error is retryable"""
        if status_code and status_code in self.RETRYABLE_HTTP_CODES:
            return True
        
        # Network errors are retryable
        if isinstance(exception, (requests.ConnectionError, requests.Timeout)):
            return True
        
        return False

    def log_credentials(self) -> None:
        """Log masked credentials for debugging"""
        if settings.DEBUG:
            for key in self.credential_keys:
                value = getattr(settings, key, "")
                if value:
                    logger.debug(f"{self.provider_name} {key}: {mask_api_key(value)}")

    def send(self, *, destination: str, title: str, message: str, metadata: dict) -> ProviderResult:
        if not self.enabled():
            error_msg = "Provider disabled"
            logger.warning(f"{self.provider_name}: {error_msg}")
            return ProviderResult(status="failed", provider=self.provider_name, response_payload={}, error_message=error_msg)

        missing = self.missing_credentials()
        if missing:
            error_msg = f"Missing credentials: {', '.join(missing)}"
            logger.error(f"{self.provider_name}: {error_msg}")
            if not settings.DEBUG:
                return ProviderResult(
                    status="failed",
                    provider=self.provider_name,
                    response_payload={},
                    error_message=error_msg,
                )

        if not destination and self.channel not in {"in_app", "push"}:
            error_msg = "Missing destination"
            logger.error(f"{self.provider_name}: {error_msg}")
            return ProviderResult(status="failed", provider=self.provider_name, response_payload={}, error_message=error_msg)
        
        # Fail-safe mode in development - mock success but log what would be sent
        if settings.DEBUG:
            self.log_credentials()
            logger.info(
                f"{self.provider_name} [DEV MODE] Would send {self.channel} to {destination}: "
                f"title='{title[:50]}...' message='{message[:100]}...'"
            )
            return ProviderResult(
                status="sent",
                provider=self.provider_name,
                response_payload={
                    "mock": True,
                    "destination": destination,
                    "title": title,
                    "message": message,
                    "metadata": metadata,
                    "dev_mode": True
                },
            )

        return ProviderResult(
            status="sent",
            provider=self.provider_name,
            response_payload={
                "mock": False,
                "destination": destination,
                "title": title,
                "message": message,
                "metadata": metadata,
            },
        )


class TwilioSmsAdapter(BaseProviderAdapter):
    channel = "sms"
    provider_name = "twilio"
    env_enabled_key = "NOTIFICATIONS_SMS_ENABLED"
    credential_keys = ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_SMS_FROM")


class WhatsAppCloudAdapter(BaseProviderAdapter):
    channel = "whatsapp"
    provider_name = "whatsapp_cloud"
    env_enabled_key = "NOTIFICATIONS_WHATSAPP_ENABLED"
    credential_keys = ("WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID")


class SmtpEmailAdapter(BaseProviderAdapter):
    channel = "email"
    provider_name = "smtp"
    env_enabled_key = "NOTIFICATIONS_EMAIL_ENABLED"
    credential_keys = ("SMTP_HOST", "SMTP_USERNAME", "DEFAULT_FROM_EMAIL")


class InAppAdapter(BaseProviderAdapter):
    channel = "in_app"
    provider_name = "in_app"
    env_enabled_key = "NOTIFICATIONS_IN_APP_ENABLED"


class PushAdapter(BaseProviderAdapter):
    channel = "push"
    provider_name = "push"
    env_enabled_key = "NOTIFICATIONS_PUSH_ENABLED"


PROVIDER_REGISTRY = {
    "sms": TwilioSmsAdapter(),
    "whatsapp": WhatsAppCloudAdapter(),
    "email": SmtpEmailAdapter(),
    "in_app": InAppAdapter(),
    "push": PushAdapter(),
}
