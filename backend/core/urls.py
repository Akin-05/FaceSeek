from django.urls import path
from . import views

urlpatterns = [
    path('album/create/', views.create_album, name='create_album'),
    path('album/access/', views.access_album, name='access_album'),
    path('photos/upload/', views.upload_photos, name='upload_photos'),
    path('photos/<str:album_name>/', views.get_album_photos, name='get_album_photos'),
    path('search/', views.search_face, name='search_face'),
    path('health/', views.health_check, name='health_check'),
]