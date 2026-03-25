from django.contrib import admin
from .models import Album, Photo


class PhotoInline(admin.TabularInline):
    """Shows photos inside the album detail page"""
    model = Photo
    extra = 0                    # don't show empty extra forms
    readonly_fields = ('uploaded_at', 'embedding')


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    # columns shown in the album list
    list_display = ('id', 'name', 'created_at', 'photo_count')

    # make these columns clickable links
    list_display_links = ('id', 'name')

    # search bar — search albums by name
    search_fields = ('name',)

    # filter sidebar
    list_filter = ('created_at',)

    # show photos inside album detail page
    inlines = [PhotoInline]

    def photo_count(self, obj):
        """Shows how many photos are in each album"""
        return obj.photos.count()
    photo_count.short_description = 'Total Photos'


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    # columns shown in the photo list
    list_display = ('id', 'album', 'uploaded_at', 'has_embedding')

    # filter sidebar
    list_filter = ('album', 'uploaded_at')

    # search by album name
    search_fields = ('album__name',)

    # make embedding read only (too long to edit manually)
    readonly_fields = ('embedding', 'uploaded_at')

    def has_embedding(self, obj):
        """Shows yes/no if face embedding exists"""
        return bool(obj.embedding)
    has_embedding.boolean = True   # shows ✅ or ❌ icon
    has_embedding.short_description = 'Face Detected'