from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.db.models import Count
from .models import Analysis, LoginEvent

admin.site.unregister(User)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("first_name", "username", "email", "date_joined", "last_login", "analyses")
    ordering = ("-date_joined",)
    search_fields = ("username", "email", "first_name")

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_n=Count("analyses"))

    @admin.display(description="Analyses")
    def analyses(self, obj):
        return obj._n


@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = ("user", "resume_name", "match_score", "ats_score", "created_at")
    ordering = ("-created_at",)


@admin.register(LoginEvent)
class LoginEventAdmin(admin.ModelAdmin):
    list_display = ("who", "email", "event", "created_at")
    list_filter = ("event",)
    list_select_related = ("user",)
    ordering = ("-created_at",)

    @admin.display(description="Name")
    def who(self, obj):
        return obj.user.first_name or obj.user.username

    @admin.display(description="Email")
    def email(self, obj):
        return obj.user.email
