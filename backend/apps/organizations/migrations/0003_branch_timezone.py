from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0002_department_branch_is_active_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="branch",
            name="timezone",
            field=models.CharField(default="UTC", max_length=64),
        ),
    ]
