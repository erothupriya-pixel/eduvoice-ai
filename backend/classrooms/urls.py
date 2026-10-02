from django.urls import path
from .views import (
    ClassroomListCreateView,
    ClassroomDetailView,
    JoinClassroomView,
    ClassroomStudentsView
)

urlpatterns = [
    path('', ClassroomListCreateView.as_view(), name='classroom_list_create'),
    path('<uuid:pk>/', ClassroomDetailView.as_view(), name='classroom_detail'),
    path('join/', JoinClassroomView.as_view(), name='classroom_join'),
    path('<uuid:classroom_id>/students/', ClassroomStudentsView.as_view(), name='classroom_students'),
]
