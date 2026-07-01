from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class AuthUserSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    assigned_counter_name = serializers.CharField(source="assigned_counter.name", read_only=True)
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "organization_name",
            "phone_number",
            "organization",
            "branch",
            "branch_name",
            "department",
            "department_name",
            "assigned_counter",
            "assigned_counter_name",
            "is_suspended",
            "is_on_leave",
            "is_online",
            "availability_notes",
        )


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "organization",
            "branch",
            "department",
            "assigned_counter",
            "phone_number",
            "is_active",
            "is_suspended",
            "is_on_leave",
            "is_online",
            "is_archived",
            "availability_notes",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "full_name",
            "organization_name",
            "phone_number",
            "role",
            "organization",
            "branch",
        )

    def validate_email(self, value: str) -> str:
        normalized_email = User.objects.normalize_email(value).lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized_email

    def create(self, validated_data):
        from apps.organizations.models import Organization
        
        password = validated_data.pop("password")
        email = User.objects.normalize_email(validated_data.pop("email")).lower()
        full_name = validated_data.pop("full_name", "").strip()
        organization_name = validated_data.pop("organization_name", "").strip()
        first_name = ""
        last_name = ""
        if full_name:
            parts = full_name.split()
            first_name = parts[0]
            last_name = " ".join(parts[1:])

        username_root = email.split("@")[0]
        username = username_root
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f"{username_root}{suffix}"

        # Create organization if organization_name is provided
        organization = None
        if organization_name:
            organization, _ = Organization.objects.get_or_create(name=organization_name)
        
        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            organization_name=organization_name,
            organization=organization,
            **validated_data,
        )
        user.set_password(password)
        user.is_active = False
        user.save()
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        return User.objects.normalize_email(value).lower()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class VerifyEmailSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()


class PasswordResetLinkSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()


def build_uid_token(user):
    return {
        "uid": urlsafe_base64_encode(force_bytes(user.pk)),
        "token": default_token_generator.make_token(user),
    }


def get_user_from_uid(uid: str):
    user_id = force_str(urlsafe_base64_decode(uid))
    return User.objects.get(pk=user_id)


class SmartQueueTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token

    def validate(self, attrs):
        credentials = {
            "email": attrs.get("email", "").lower(),
            "password": attrs.get("password"),
        }
        data = super().validate(credentials)
        if not self.user.is_active:
            raise serializers.ValidationError({"detail": "Please verify your email before signing in."})
        data["user"] = AuthUserSerializer(self.user).data
        return data
