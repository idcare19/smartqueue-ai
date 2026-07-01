from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("queues", "0001_initial"),
        ("organizations", "0002_department_branch_is_active_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="queuetoken",
            name="queue_type",
            field=models.CharField(default="walk_in", max_length=32),
        ),
        migrations.AddField(
            model_name="queuetoken",
            name="priority",
            field=models.CharField(default="normal", max_length=16),
        ),
        migrations.AddField(
            model_name="queuetoken",
            name="is_paused",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="queuetoken",
            name="is_open",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="queuetoken",
            name="transferred_from_counter",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="transferred_queue_tokens", to="organizations.counter"),
        ),
    ]
