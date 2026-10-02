from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/classrooms/', include('classrooms.urls')),
    path('api/lectures/', include('content.urls')),
    path('api/tutor/', include('tutor.urls')),
    path('api/collaboration/', include('collaboration.urls')),
    path('api/documents/', include('content.document_urls')),
    path('api/ai/', include('content.ai_urls')),
]

# Serve media files in development mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
