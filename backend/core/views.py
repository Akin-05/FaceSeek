from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Album, Photo
from .serializers import PhotoSerializer, AlbumSerializer, SearchResultSerializer
from .utils import get_face_embedding, find_matches
from django.utils import timezone
from datetime import timedelta
from django.core.management import call_command
import os


# ── Cleanup Helper ────────────────────────────────────────
def cleanup_expired_albums():
    """Delete albums older than 24 hours"""
    call_command('delete_expired_albums')


# ── Health Check ──────────────────────────────────────────
@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint.
    GET /api/health/
    """
    return Response(
        {'status': 'ok'},
        status=status.HTTP_200_OK
    )


# ── Album Create ──────────────────────────────────────────
@api_view(['POST'])
def create_album(request):
    """
    Create a new album with name and password.
    POST /api/album/create/
    Body: { "album_name": "familypics", "password": "1234" }
    """
    album_name = request.data.get('album_name')
    password = request.data.get('password')

    # validate inputs
    if not album_name or not password:
        return Response(
            {'error': 'Album name and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # check if album already exists
    if Album.objects.filter(name=album_name).exists():
        return Response(
            {'error': 'Album name already taken. Choose a different name.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # validate password length
    if len(password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # create album
    album = Album(name=album_name)
    album.set_password(password)
    album.save()

    # calculate expiry time
    expiry_time = album.created_at + timedelta(hours=24)

    return Response(
        {
            'message': 'Album created successfully!',
            'album_name': album.name,
            'expires_at': expiry_time,
        },
        status=status.HTTP_201_CREATED
    )


# ── Album Access ──────────────────────────────────────────
@api_view(['POST'])
def access_album(request):
    """
    Access an album with name and password.
    POST /api/album/access/
    Body: { "album_name": "familypics", "password": "1234" }
    """
    album_name = request.data.get('album_name')
    password = request.data.get('password')

    # validate inputs
    if not album_name or not password:
        return Response(
            {'error': 'Album name and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # find album
    try:
        album = Album.objects.get(name=album_name)
    except Album.DoesNotExist:
        return Response(
            {'error': 'Album not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # check password
    if not album.check_password(password):
        return Response(
            {'error': 'Incorrect password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # calculate expiry
    expiry_time = album.created_at + timedelta(hours=24)
    time_remaining = expiry_time - timezone.now()
    hours_remaining = max(0, int(time_remaining.total_seconds() / 3600))
    minutes_remaining = max(0, int((time_remaining.total_seconds() % 3600) / 60))

    return Response(
        {
            'message': 'Access granted!',
            'album_name': album.name,
            'expires_in': f'{hours_remaining}h {minutes_remaining}m',
        },
        status=status.HTTP_200_OK
    )


# ── Upload Photos ─────────────────────────────────────────
@api_view(['POST'])
def upload_photos(request):
    """
    Upload multiple photos to an album.
    POST /api/photos/upload/
    Body: FormData { album_name, images[] }
    """
    album_name = request.data.get('album_name')
    images = request.FILES.getlist('images')

    # validate inputs
    if not album_name:
        return Response(
            {'error': 'Album name is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not images:
        return Response(
            {'error': 'No images provided.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # find album
    try:
        album = Album.objects.get(name=album_name)
    except Album.DoesNotExist:
        return Response(
            {'error': 'Album not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    uploaded = []
    failed = []

    for image in images:
        # save photo to DB
        photo = Photo(album=album, image=image)
        photo.save()

        # extract face embedding
        embedding = get_face_embedding(photo.image.path)

        if embedding:
            photo.set_embedding(embedding)
            photo.save()
            uploaded.append(photo.image.name)
        else:
            # no face detected — still save photo but note it
            failed.append(image.name)

    return Response(
        {
            'message': f'{len(uploaded)} photo(s) uploaded successfully!',
            'uploaded': len(uploaded),
            'no_face_detected': failed
        },
        status=status.HTTP_201_CREATED
    )


# ── Get Album Photos ──────────────────────────────────────
@api_view(['GET'])
def get_album_photos(request, album_name):
    """
    Get all photos in an album.
    GET /api/photos/<album_name>/
    """
    # run cleanup on every album view
    cleanup_expired_albums()

    try:
        album = Album.objects.get(name=album_name)
    except Album.DoesNotExist:
        return Response(
            {'error': 'Album not found or expired.'},
            status=status.HTTP_404_NOT_FOUND
        )

    photos = album.photos.all()
    serializer = PhotoSerializer(
        photos,
        many=True,
        context={'request': request}
    )

    # calculate expiry time
    expiry_time = album.created_at + timedelta(hours=24)
    time_remaining = expiry_time - timezone.now()
    hours_remaining = max(0, int(time_remaining.total_seconds() / 3600))
    minutes_remaining = max(0, int((time_remaining.total_seconds() % 3600) / 60))

    return Response(
        {
            'album_name': album.name,
            'photo_count': photos.count(),
            'photos': serializer.data,
            'expires_in': f'{hours_remaining}h {minutes_remaining}m',
            'created_at': album.created_at,
        },
        status=status.HTTP_200_OK
    )


# ── Search Face ───────────────────────────────────────────
@api_view(['POST'])
def search_face(request):
    """
    Search for matching faces in an album.
    POST /api/search/
    Body: FormData { album_name, query_image }
    """
    album_name = request.data.get('album_name')
    query_image = request.FILES.get('query_image')

    # validate inputs
    if not album_name or not query_image:
        return Response(
            {'error': 'Album name and query image are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # find album
    try:
        album = Album.objects.get(name=album_name)
    except Album.DoesNotExist:
        return Response(
            {'error': 'Album not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # temporarily save query image
    temp_photo = Photo(album=album, image=query_image)
    temp_photo.save()
    temp_path = temp_photo.image.path

    # extract embedding from query image
    query_embedding = get_face_embedding(temp_path)

    # delete temp photo
    temp_photo.image.delete()
    temp_photo.delete()

    if query_embedding is None:
        return Response(
            {'error': 'No face detected in the uploaded image. Please upload a clear photo.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # get all photos in album that have embeddings
    photos = album.photos.exclude(embedding='')

    # find matches
    matches = find_matches(query_embedding, photos)

    if not matches:
        return Response(
            {
                'message': 'No matching faces found.',
                'matches': []
            },
            status=status.HTTP_200_OK
        )

    # build results
    results = []
    for match in matches:
        photo = match['photo']
        serializer = PhotoSerializer(photo, context={'request': request})
        results.append({
            'id': photo.id,
            'image_url': serializer.data['image_url'],
            'similarity': match['similarity'],
            'uploaded_at': serializer.data['uploaded_at']
        })

    return Response(
        {
            'message': f'{len(results)} match(es) found!',
            'matches': results
        },
        status=status.HTTP_200_OK
    )