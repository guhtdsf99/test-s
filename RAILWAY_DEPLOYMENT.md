# Railway Deployment Guide for AI Report System

This guide covers deploying the AI report generation system to Railway.

## Pre-deployment Checklist

### 1. Environment Variables

Add these environment variables in Railway dashboard:

```env
# Existing variables
DEBUG=False
SECRET_KEY=your-production-secret-key
DATABASE_URL=your-database-url
ALLOWED_HOSTS=your-domain.railway.app

# New AI Report variables
GEMINI_API_KEY=your-actual-gemini-api-key
```

### 2. Dependencies

Ensure `requirements.txt` includes all AI report dependencies:

```txt
# AI Report Generation Dependencies
google-genai==0.8.0
matplotlib==3.8.2
pandas==2.1.4
reportlab==4.0.7
markdown==3.5.1
```

### 3. Static Files

Update your Django settings for static file handling:

```python
# In settings.py
import os

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files (uploaded content)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Whitenoise for static file serving
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this
    # ... other middleware
]
```

## Deployment Steps

### 1. Database Migration

Railway will automatically run migrations, but ensure your migration file is included:

```bash
# Verify migration exists
ls backend/email_service/migrations/0002_add_ai_phishing_report.py
```

### 2. Media Directory Setup

Add to your Django settings:

```python
# Ensure media directory exists
import os
from pathlib import Path

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
Path(MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
Path(os.path.join(MEDIA_ROOT, 'ai_reports')).mkdir(parents=True, exist_ok=True)
```

### 3. Railway Configuration

Create or update `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application",
    "healthcheckPath": "/api/auth/profile/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 4. Procfile (if needed)

Create `Procfile` in backend directory:

```
web: python manage.py migrate && gunicorn config.wsgi:application
```

## Post-deployment Verification

### 1. Check API Endpoints

Test these endpoints after deployment:

```bash
# Replace YOUR_DOMAIN with your Railway domain
curl -X GET "https://YOUR_DOMAIN.railway.app/api/email/ai-reports/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test Report Generation

1. Login to your deployed application
2. Navigate to Campaigns page
3. Click "Download a full AI report now"
4. Verify report generation works

### 3. Check Logs

Monitor Railway logs for any errors:

```bash
# In Railway dashboard, check deployment logs for:
# - Migration success
# - Static file collection
# - AI report module imports
# - Media directory creation
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```
   ModuleNotFoundError: No module named 'google.genai'
   ```
   - Ensure all dependencies are in requirements.txt
   - Check Railway build logs

2. **Media Directory Issues**
   ```
   FileNotFoundError: [Errno 2] No such file or directory: 'media/ai_reports'
   ```
   - Add media directory creation to settings.py
   - Ensure MEDIA_ROOT is configured

3. **API Key Issues**
   ```
   Error: GEMINI_API_KEY not found
   ```
   - Set GEMINI_API_KEY in Railway environment variables
   - Verify the key is valid

4. **Database Migration Issues**
   ```
   django.db.utils.ProgrammingError: relation "email_service_aiphishingreport" does not exist
   ```
   - Ensure migration file is committed to git
   - Check Railway deployment logs for migration errors

### Performance Optimization

1. **Async Processing**
   - AI report generation runs in background threads
   - No additional configuration needed for Railway

2. **File Storage**
   - Reports are stored in media directory
   - Consider using Railway's persistent storage for production

3. **Memory Usage**
   - AI analysis and PDF generation are memory-intensive
   - Monitor Railway resource usage
   - Consider upgrading plan if needed

## Security Considerations

### 1. Environment Variables

Never commit sensitive data:

```bash
# Add to .gitignore
.env
*.env
```

### 2. API Access

Ensure all AI report endpoints require authentication:

```python
# All views use @permission_classes([IsAuthenticated])
```

### 3. File Access

Reports are company-scoped - users can only access their company's reports.

## Monitoring

### 1. Error Tracking

Add logging for AI report generation:

```python
# In Django settings
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'email_service.ai_report_generator': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}
```

### 2. Health Checks

The AI report system doesn't require additional health checks - it uses existing Django endpoints.

## Scaling Considerations

### 1. Background Processing

For high-volume usage, consider:
- Using Celery for background tasks
- Implementing a job queue system
- Adding progress tracking

### 2. File Storage

For production scale:
- Use cloud storage (AWS S3, Google Cloud Storage)
- Implement file cleanup policies
- Add CDN for report downloads

## Support

If you encounter issues:

1. Check Railway deployment logs
2. Verify all environment variables are set
3. Test API endpoints manually
4. Review Django error logs
5. Ensure all dependencies are installed

The AI report system is designed to be robust and handle errors gracefully, but proper configuration is essential for smooth operation.