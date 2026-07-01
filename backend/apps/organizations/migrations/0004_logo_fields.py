from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0003_branch_timezone"),
    ]

    operations = [
        migrations.AddField(
            model_name="organization",
            name="logo",
            field=models.FileField(blank=True, null=True, upload_to="organizations/logos/", validators=[django.core.validators.FileExtensionValidator(["png", "jpg", "jpeg", "webp"])])
        ),
        migrations.AddField(
            model_name="branch",
            name="logo",
            field=models.FileField(blank=True, null=True, upload_to="branches/logos/", validators=[django.core.validators.FileExtensionValidator(["png", "jpg", "jpeg", "webp"])])
        ),
    ]
