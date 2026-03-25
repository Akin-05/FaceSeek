from django.db import models
from django.contrib.auth.hashers import make_password, check_password
import json


class Album(models.Model):
    name = models.CharField(max_length=200, unique=True)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        """Hash and store the password"""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Check if entered password matches stored hash"""
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.name


class Photo(models.Model):
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='photos/')
    embedding = models.TextField(blank=True, default='')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def set_embedding(self, embedding_list):
        """Convert embedding list to JSON string for storage"""
        self.embedding = json.dumps(embedding_list)

    def get_embedding(self):
        """Convert stored JSON string back to list"""
        return json.loads(self.embedding)

    def __str__(self):
        return f"Photo {self.id} in {self.album.name}"