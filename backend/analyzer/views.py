import hashlib
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework_simplejwt.views import TokenObtainPairView
from .notify import notify_owner, send_reset_email, send_welcome
from .throttles import AnalyzeDayThrottle, LoginNameThrottle, ScopedThrottle
from django.db import transaction
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from . import scoring
from .models import Analysis, LoginEvent, MissingKeyword
from .serializers import (AnalysisSerializer, ForgotSerializer, LoginSerializer, RegisterSerializer,
                          ResetSerializer, find_user)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedThrottle]
    throttle_scope = "register"
    def perform_create(self, serializer):
        user = serializer.save()
        LoginEvent.objects.create(user=user, event="signup")
        notify_owner("signup", user)
        send_welcome(user)

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    throttle_classes = [ScopedThrottle, LoginNameThrottle]
    throttle_scope = "login"
    def post(self, request, *args, **kwargs):
        user = find_user(request.data.get("username"))
        # The app logs a new user in right after signup: same visit, so don't count it twice.
        fresh = bool(user and user.last_login is None and (timezone.now() - user.date_joined).total_seconds() < 120)
        resp = super().post(request, *args, **kwargs)
        if resp.status_code == 200 and user and not fresh:
            LoginEvent.objects.create(user=user, event="login")
            if settings.NOTIFY_LOGIN:
                notify_owner("login", user)
        return resp

class AnalyzeView(APIView):
    parser_classes = [MultiPartParser]
    throttle_classes = [ScopedThrottle, AnalyzeDayThrottle]
    throttle_scope = "analyze"
    def post(self, request):
        pdf, jd = request.FILES.get("resume"), request.data.get("jd_text", "").strip()
        if not pdf or not jd:
            return Response({"error": "resume (PDF) and jd_text are required"}, status=400)
        if not pdf.name.lower().endswith(".pdf") or pdf.size > 5 * 1024 * 1024:
            return Response({"error": "Upload a PDF under 5 MB"}, status=400)
        raw = pdf.read(); pdf.seek(0)
        digest = hashlib.sha256(raw).hexdigest()
        norm = " ".join(jd.split())
        for old in Analysis.objects.filter(user=request.user, resume_hash=digest).prefetch_related("missing_keywords"):
            if " ".join(old.jd_text.split()) == norm:
                return Response({**AnalysisSerializer(old).data, "duplicate": True}, status=200)
        try:
            text = scoring.extract_text(pdf)
        except Exception:
            return Response({"error": "Could not read this PDF"}, status=400)
        if len(text) < 50:
            return Response({"error": "No text found. Scanned PDFs are not supported."}, status=400)
        match, coverage, missing, matched = scoring.match_and_keywords(text, jd)
        ats, breakdown, info = scoring.ats_score(text, coverage)
        with transaction.atomic():
            a = Analysis.objects.create(user=request.user, resume_name=pdf.name, resume_hash=digest, matched_keywords=list(matched), jd_text=jd, match_score=float(match), ats_score=float(ats),
                    ats_breakdown=breakdown, suggestions=scoring.suggestions(breakdown, info, missing))
            MissingKeyword.objects.bulk_create(
                [MissingKeyword(analysis=a, keyword=k, importance=float(i)) for k, i in missing])
        return Response(AnalysisSerializer(a).data, status=status.HTTP_201_CREATED)

class AnalysisList(generics.ListAPIView):
    serializer_class = AnalysisSerializer
    def get_queryset(self):
        return Analysis.objects.filter(user=self.request.user).prefetch_related("missing_keywords")

class AnalysisDetail(generics.RetrieveDestroyAPIView):
    serializer_class = AnalysisSerializer
    def get_queryset(self):
        return Analysis.objects.filter(user=self.request.user)


class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedThrottle]
    throttle_scope = "forgot"

    def post(self, request):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=s.validated_data["email"], is_active=True).order_by("date_joined").first()
        if user:
            send_reset_email(user)
        # Same answer either way, so nobody can probe which emails have accounts.
        return Response({"detail": "If an account exists for that email, a reset link is on its way."})


class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedThrottle]
    throttle_scope = "reset"

    def post(self, request):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(d["uid"])))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None
        if not user or not default_token_generator.check_token(user, d["token"]):
            return Response({"error": "This reset link is invalid or has expired."}, status=400)
        try:
            validate_password(d["password"], user)
        except ValidationError as e:
            return Response({"error": " ".join(e.messages)}, status=400)
        user.set_password(d["password"])
        user.save()
        return Response({"detail": "Password updated. You can log in now."})


class MeView(APIView):
    def get(self, request):
        u = request.user
        return Response({"name": u.first_name or u.username, "username": u.username, "email": u.email, "joined": u.date_joined})
