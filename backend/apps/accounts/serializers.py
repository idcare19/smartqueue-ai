from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class AuthUserSerializer(serializers.ModelSerializer):
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
        password = validated_data.pop("password")
        email = User.objects.normalize_email(validated_data.pop("email")).lower()
        full_name = validated_data.pop("full_name", "").strip()
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

        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            **validated_data,
        )
        user.set_password(password)
        user.save()
        return user


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
        data["user"] = AuthUserSerializer(self.user).data
        return data
