import os
from pathlib import Path
from .database import database_config, durable_storage

BASE_DIR = Path(__file__).resolve().parent.parent
ON_RENDER = os.environ.get('RENDER', '').lower() == 'true'
DEBUG = os.environ.get('DJANGO_DEBUG', '0' if ON_RENDER else '1') == '1'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'local-demo-only-do-not-use-in-production')
if not DEBUG and SECRET_KEY == 'local-demo-only-do-not-use-in-production':
    raise RuntimeError('Production uchun DJANGO_SECRET_KEY kiriting.')
DEFAULT_HOSTS = 'origin-hotel1-1.onrender.com,strix-user.vercel.app' if ON_RENDER else 'localhost,127.0.0.1,testserver,origin-hotel1-1.onrender.com,strix-user.vercel.app'
ALLOWED_HOSTS = [value.strip() for value in os.environ.get('DJANGO_ALLOWED_HOSTS', DEFAULT_HOSTS).split(',') if value.strip()]
INSTALLED_APPS = ['django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes', 'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles', 'hotel']
MIDDLEWARE = ['django.middleware.security.SecurityMiddleware', 'whitenoise.middleware.WhiteNoiseMiddleware', 'django.contrib.sessions.middleware.SessionMiddleware', 'django.middleware.common.CommonMiddleware', 'django.middleware.csrf.CsrfViewMiddleware', 'django.contrib.auth.middleware.AuthenticationMiddleware', 'hotel.device_sessions.ManagerSessionMiddleware', 'django.contrib.messages.middleware.MessageMiddleware', 'django.middleware.clickjacking.XFrameOptionsMiddleware']
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'APP_DIRS': True, 'OPTIONS': {'context_processors': ['django.template.context_processors.request', 'django.contrib.auth.context_processors.auth', 'django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'config.wsgi.application'
DATABASES = {'default': database_config(os.environ.get('DATABASE_URL', ''), os.environ.get('DJANGO_DB_PATH', BASE_DIR / 'db.sqlite3'))}
HOTEL_DURABLE_STORAGE = durable_storage(DATABASES['default'], ON_RENDER)
AUTH_PASSWORD_VALIDATORS = [{'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'}, {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'}, {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'}, {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'}]
TIME_ZONE = 'Asia/Tashkent'
USE_TZ = True
LANGUAGE_CODE = 'uz'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
LOGIN_URL = '/management/login/'
LOGIN_REDIRECT_URL = '/management/'
LOGOUT_REDIRECT_URL = '/management/login/'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 7200
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "origin-hotel")
DATA_UPLOAD_MAX_MEMORY_SIZE = 5000000
CSRF_TRUSTED_ORIGINS = [value.strip() for value in os.environ.get('DJANGO_CSRF_TRUSTED_ORIGINS', 'https://strix-user.vercel.app,https://origin-hotel1-1.onrender.com').split(',') if value.strip()]
if os.environ.get('DJANGO_TRUST_PROXY', '1' if ON_RENDER else '0') == '1':
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

STORAGES = {"default": {"BACKEND": "django.core.files.storage.FileSystemStorage"}, "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"}}
FRONTEND_URL = os.environ.get("HOTEL_FRONTEND_URL", "https://strix-user.vercel.app" if ON_RENDER else "").rstrip("/")
