from datetime import timedelta
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import Analysis, MissingKeyword

class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, max_length=100)
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ["name", "username", "email", "password"]
        extra_kwargs = {"email": {"required": True}}
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value
    def create(self, data):
        name = data.pop("name")
        return User.objects.create_user(first_name=name, **data)

class KeywordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MissingKeyword
        fields = ["keyword", "importance"]

class AnalysisSerializer(serializers.ModelSerializer):
    missing_keywords = KeywordSerializer(many=True, read_only=True)
    class Meta:
        model = Analysis
        fields = ["id", "resume_name", "jd_text", "match_score", "ats_score", "ats_breakdown",
                  "suggestions", "missing_keywords", "matched_keywords", "created_at"]


def find_user(ident):
    """Find a user by username or by email (case-insensitive)."""
    ident = (ident or "").strip()
    if "@" in ident:
        return User.objects.filter(email__iexact=ident).order_by("date_joined").first()
    return User.objects.filter(username=ident).first()


class LoginSerializer(TokenObtainPairSerializer):
    """Log in with username OR email. remember=True keeps the session for 30 days."""
    def validate(self, attrs):
        user = find_user(attrs.get(self.username_field))
        if user:
            attrs[self.username_field] = user.get_username()
        data = super().validate(attrs)
        if self.initial_data.get("remember") is True:
            access = self.get_token(self.user).access_token
            access.set_exp(lifetime=timedelta(days=30))
            data["access"] = str(access)
        return data


class ForgotSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(min_length=8, write_only=True)
