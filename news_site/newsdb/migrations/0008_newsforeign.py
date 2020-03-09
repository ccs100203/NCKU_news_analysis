# Generated by Django 3.0.3 on 2020-03-03 13:22

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('newsdb', '0007_brandforeign'),
    ]

    operations = [
        migrations.CreateModel(
            name='NewsForeign',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(default='', max_length=200)),
                ('content', models.CharField(default='', max_length=2000)),
                ('author', models.CharField(blank=True, max_length=15, null=True)),
                ('date', models.DateField()),
                ('update_time', models.DateTimeField(default=django.utils.timezone.now)),
                ('url', models.CharField(max_length=1000)),
                ('isHeadline', models.BooleanField(default=False)),
                ('brand', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='newsdb.BrandForeign')),
                ('sub', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='newsdb.Subject')),
            ],
            options={
                'db_table': 'news_foreign',
            },
        ),
    ]