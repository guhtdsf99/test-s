import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key')

DEBUG = os.getenv('DEBUG', 'True') == 'True'


ALLOWED_HOSTS = ['*']  # Allow all hosts for initial deployment

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True  # For development only
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    'accounts',
    'email_service',
    'courses',
    'lms',
    'django_apscheduler',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'accounts.company_middleware.CompanyMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Use SQLite locally, PostgreSQL in production
DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///' + str(BASE_DIR / 'db.sqlite3'),
        conn_max_age=600
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files (uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# File upload permissions
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
}

CORS_ALLOW_ALL_ORIGINS = True

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# Email host, port, and credentials are now configured from the database
EMAIL_USE_TLS = True


# CORS Settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True  # Allow all origins for testing
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ORIGIN_WHITELIST = [
    'http://localhost:3000',  # Default React dev server
    'http://127.0.0.1:3000',  # Alternative localhost
    'http://localhost:8000',  # Django dev server
    'http://127.0.0.1:8000',  # Django dev server alternative
    'https://phish-aware-academy-frontend-production.up.railway.app',  # Railway frontend
    'https://phishaware-backend-production.up.railway.app',  # Railway backend
]

# Use environment variable if available
import os
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8080')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')
CSRF_TRUSTED_ORIGINS = [
    FRONTEND_URL, 
    BACKEND_URL,
    'https://phish-aware-academy-frontend-production.up.railway.app',
    'https://phishaware-backend-production.up.railway.app',
]

# CSRF settings for cross-origin requests
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False  # Set to False to allow JavaScript access
CSRF_COOKIE_SAMESITE = 'None'  # Allow cross-site requests
CSRF_USE_SESSIONS = False  # Don't use sessions for CSRF
CSRF_COOKIE_DOMAIN = '.up.railway.app'  # Allow sharing across Railway subdomains
CORS_ORIGIN_WHITELIST.append(FRONTEND_URL)
if  DEBUG:
     CSRF_COOKIE_DOMAIN = None        # ← allow localhost
# Email tracking settings
EMAIL_TRACKING_ENABLED = True
EMAIL_TRACKING_URL = BACKEND_URL

# Session and CSRF settings for cross-origin requests
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG  # True in production
# CSRF settings for cross-origin requests
CSRF_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript to read the CSRF token
CSRF_COOKIE_SECURE = not DEBUG  # Use secure cookies in production
CSRF_USE_SESSIONS = False
CSRF_TRUSTED_ORIGINS = [
    'https://phishaware-backend-production.up.railway.app',
    'https://*.up.railway.app',
]
