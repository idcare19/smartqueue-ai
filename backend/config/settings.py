from pathlib import Path
import os
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-only-secret-key')
DEBUG = os.getenv('DEBUG', '1') == '1'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1')
USE_REDIS_CHANNELS = os.getenv('USE_REDIS_CHANNELS', '0') == '1'
NOTIFICATIONS_SMS_ENABLED = os.getenv('NOTIFICATIONS_SMS_ENABLED', '1') == '1'
NOTIFICATIONS_WHATSAPP_ENABLED = os.getenv('NOTIFICATIONS_WHATSAPP_ENABLED', '1') == '1'
NOTIFICATIONS_EMAIL_ENABLED = os.getenv('NOTIFICATIONS_EMAIL_ENABLED', '1') == '1'
NOTIFICATIONS_IN_APP_ENABLED = os.getenv('NOTIFICATIONS_IN_APP_ENABLED', '1') == '1'
NOTIFICATIONS_PUSH_ENABLED = os.getenv('NOTIFICATIONS_PUSH_ENABLED', '0') == '1'
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_SMS_FROM = os.getenv('TWILIO_SMS_FROM', '')
WHATSAPP_ACCESS_TOKEN = os.getenv('WHATSAPP_ACCESS_TOKEN', '')
WHATSAPP_PHONE_NUMBER_ID = os.getenv('WHATSAPP_PHONE_NUMBER_ID', '')
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
RESEND_FROM_EMAIL = os.getenv('RESEND_FROM_EMAIL', '')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'channels',
    'django_celery_beat',
    'apps.core',
    'apps.accounts',
    'apps.organizations',
    'apps.queues',
    'apps.notifications',
    'apps.analytics',
    'apps.billing',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django_ratelimit.middleware.RatelimitMiddleware',
]

ROOT_URLCONF = 'config.urls'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.getenv('POSTGRES_DB', str(BASE_DIR / 'db.sqlite3')),
        'USER': os.getenv('POSTGRES_USER', ''),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', ''),
        'HOST': os.getenv('POSTGRES_HOST', ''),
        'PORT': os.getenv('POSTGRES_PORT', ''),
    }
}

if DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
    DATABASES['default']['NAME'] = os.getenv('POSTGRES_DB', 'smartqueue')
    DATABASES['default']['USER'] = os.getenv('POSTGRES_USER', 'smartqueue')
    DATABASES['default']['PASSWORD'] = os.getenv('POSTGRES_PASSWORD', 'smartqueue')
    DATABASES['default']['HOST'] = os.getenv('POSTGRES_HOST', 'localhost')
    DATABASES['default']['PORT'] = os.getenv('POSTGRES_PORT', '5432')

AUTH_PASSWORD_VALIDATORS = []
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'accounts.User'
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [FRONTEND_URL]
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_MINUTES', '30'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_DAYS', '7'))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer' if USE_REDIS_CHANNELS else 'channels.layers.InMemoryChannelLayer',
        'CONFIG': {
            'hosts': [REDIS_URL],
        } if USE_REDIS_CHANNELS else {},
    }
}

# Celery Configuration
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
# Run Celery tasks eagerly in test/dev mode unless explicitly disabled
CELERY_TASK_ALWAYS_EAGER = os.getenv('CELERY_TASK_ALWAYS_EAGER', str(DEBUG)).lower() == 'true'
CELERY_TASK_EAGER_PROPAGATES = True  # Propagate exceptions in eager mode

# Cache Configuration - use local memory cache in debug/test, Redis otherwise
if DEBUG and not os.getenv('USE_REDIS_CACHE', 'False').lower() == 'true':
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }
else:
    # Django Redis Cache (production/staging)
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }

# Rate Limiting Settings
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'
RATELIMIT_VIEW = 'apps.core.views.ratelimit_view'
RATELIMIT_EXCEPTION_CLASS = 'rest_framework.exceptions.Throttled'

# Default rate limits (can be overridden per-view)
RATELIMIT_DEFAULT_LIMITS = {
    'login': '10/min',
    'register': '5/min',
    'join_queue': '20/min',
    'notification_trigger': '50/min',
    'public_queue_status': '100/min',
}