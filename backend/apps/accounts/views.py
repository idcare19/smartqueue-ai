from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_decode
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User
from .serializers import (
    AuthUserSerializer,
    ForgotPasswordSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    SmartQueueTokenObtainPairSerializer,
    VerifyEmailSerializer,
    build_uid_token,
    get_user_from_uid,
)


def send_account_email(*, subject: str, message: str, recipient: str) -> None:
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient], fail_silently=False)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token_payload = build_uid_token(user)
        verify_url = f"{settings.FRONTEND_URL}/verify-email?uid={token_payload['uid']}&token={token_payload['token']}"
        send_account_email(
            subject="Verify your SmartQueue AI account",
            message=f"Welcome to SmartQueue AI.\n\nVerify your email here: {verify_url}",
            recipient=user.email,
        )
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": AuthUserSerializer(user).data,
                "email_verification_required": True,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SmartQueueTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(AuthUserSerializer(request.user).data)


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_user_from_uid(serializer.validated_data["uid"])
        if not default_token_generator.check_token(user, serializer.validated_data["token"]):
            return Response({"detail": "Invalid or expired verification link."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active"])
        return Response({"detail": "Email verified successfully."})


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email).first()
        if user:
            token_payload = build_uid_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={token_payload['uid']}&token={token_payload['token']}"
            send_account_email(
                subject="Reset your SmartQueue AI password",
                message=f"Use this secure link to reset your password:\n\n{reset_url}",
                recipient=user.email,
            )
        return Response({"detail": "If the email exists, a reset link has been sent."})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_user_from_uid(serializer.validated_data["uid"])
        if not default_token_generator.check_token(user, serializer.validated_data["token"]):
            return Response({"detail": "Invalid or expired reset link."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated successfully."})
