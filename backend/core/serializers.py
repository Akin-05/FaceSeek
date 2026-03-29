from rest_framework import serializers
from .models import Album, Photo


class PhotoSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ['id', 'image_url', 'uploaded_at']

    def get_image_url(self, obj):
        """Return full image URL instead of just file path"""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class AlbumSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, read_only=True)
    photo_count = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = ['id', 'name', 'created_at', 'photo_count', 'photos']

    def get_photo_count(self, obj):
        """Return total number of photos in album"""
        return obj.photos.count()


class AlbumCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['name', 'password']


class SearchResultSerializer(serializers.Serializer):
    """Serializer for face search results"""
    id = serializers.IntegerField()
    image_url = serializers.CharField()
    similarity = serializers.FloatField()
    uploaded_at = serializers.DateTimeField()