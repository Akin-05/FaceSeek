from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Album
import os


class Command(BaseCommand):
    help = 'Deletes albums older than 24 hours'

    def handle(self, *args, **kwargs):
        # find albums older than 24 hours
        expiry_time = timezone.now() - timedelta(hours=24)
        expired_albums = Album.objects.filter(created_at__lt=expiry_time)

        count = expired_albums.count()

        if count == 0:
            self.stdout.write('No expired albums found.')
            return

        # delete each album's photos from disk first
        for album in expired_albums:
            for photo in album.photos.all():
                # delete actual image file from media/
                if photo.image:
                    if os.path.isfile(photo.image.path):
                        os.remove(photo.image.path)
                        self.stdout.write(f'Deleted file: {photo.image.path}')

            self.stdout.write(f'Deleting album: {album.name}')
            album.delete()  # cascade deletes photos from DB too

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {count} expired album(s).'
            )
        )