from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0002_department_branch_is_active_fields"),
        ("accounts", "0002_user_branch_user_organization"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="department",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="users", to="organizations.department"),
        ),
        migrations.AddField(
            model_name="user",
            name="assigned_counter",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="staff_members", to="organizations.counter"),
        ),
        migrations.AddField(
            model_name="user",
            name="is_suspended",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="is_on_leave",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="is_online",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="availability_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="user",
            name="is_archived",
            field=models.BooleanField(default=False),
        ),
    ]
