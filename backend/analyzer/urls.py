from django.urls import path
from . import views
urlpatterns = [
    path("auth/register", views.RegisterView.as_view()),
    path("auth/login", views.LoginView.as_view()),
    path("auth/me", views.MeView.as_view()),
    path("auth/forgot-password", views.ForgotPasswordView.as_view()),
    path("auth/reset-password", views.ResetPasswordView.as_view()),
    path("analyze", views.AnalyzeView.as_view()),
    path("analyses", views.AnalysisList.as_view()),
    path("analyses/<int:pk>", views.AnalysisDetail.as_view()),
]
