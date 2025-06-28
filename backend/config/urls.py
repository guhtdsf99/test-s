from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/email/', include('email_service.urls')),
    path('api/courses/', include('courses.urls')),  # Add courses API endpoints
    path('', include('lms.urls')),  # Include lms URLs
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # In production, these should be served by the web server (Nginx, Apache, etc.)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)