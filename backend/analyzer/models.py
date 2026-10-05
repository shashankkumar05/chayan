from django.conf import settings
from django.db import models

class Analysis(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="analyses")
    resume_name = models.CharField(max_length=255, blank=True, default="")
    resume_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    jd_text = models.TextField()
    match_score = models.FloatField()
    ats_score = models.FloatField()
    ats_breakdown = models.JSONField(default=dict)
    suggestions = models.JSONField(default=list)
    matched_keywords = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "analyses"

class MissingKeyword(models.Model):
    analysis = models.ForeignKey(Analysis, on_delete=models.CASCADE, related_name="missing_keywords")
    keyword = models.CharField(max_length=100)
    importance = models.FloatField()
    class Meta:
        ordering = ["-importance"]


class LoginEvent(models.Model):
    """One row per signup or login, so the owner can review activity in /admin/."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="events")
    event = models.CharField(max_length=10)  # "signup" or "login"
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-created_at"]
