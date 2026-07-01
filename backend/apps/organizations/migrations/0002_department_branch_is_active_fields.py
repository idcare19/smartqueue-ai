from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="branch",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="counter",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
        migrations.CreateModel(
            name="Department",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField()),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("branch", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="departments", to="organizations.branch")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="departments", to="organizations.organization")),
            ],
            options={
                "ordering": ("name",),
                "unique_together": {("branch", "slug")},
            },
        ),
    ]
