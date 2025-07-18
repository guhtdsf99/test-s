# Generated manually for AI Phishing Report

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('email_service', '0014_merge_20250719_0019'),
    ]

    operations = [
        migrations.CreateModel(
            name='AIPhishingReport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('report_name', models.CharField(help_text='Name of the report', max_length=255)),
                ('campaigns_count', models.IntegerField(help_text='Number of campaigns included in this report')),
                ('start_date', models.DateField(help_text='Start date of the earliest campaign')),
                ('end_date', models.DateField(help_text='End date of the latest campaign')),
                ('status', models.CharField(choices=[('generating', 'Generating'), ('completed', 'Completed'), ('failed', 'Failed')], default='generating', max_length=20)),
                ('pdf_file_path', models.CharField(blank=True, help_text='Path to the generated PDF file', max_length=500, null=True)),
                ('analysis_data', models.JSONField(blank=True, help_text='AI analysis results and KPIs', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ai_reports', to='accounts.company')),
            ],
            options={
                'verbose_name': 'AI Phishing Report',
                'verbose_name_plural': 'AI Phishing Reports',
                'ordering': ['-created_at'],
            },
        ),
    ]