# Generated by Django 3.0.2 on 2020-03-11 15:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('newsdb', '0008_auto_20200305_1029'),
    ]

    operations = [
        migrations.AlterField(
            model_name='new',
            name='content',
            field=models.CharField(default='', max_length=6000),
        ),
    ]
