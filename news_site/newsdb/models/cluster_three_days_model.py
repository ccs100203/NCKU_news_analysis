from django.db import models
from .news_model import New
from datetime import date as ddate

class Cluster_three_day(models.Model):
    news = models.ForeignKey(New, on_delete=models.CASCADE)
    date    = models.DateField(
        auto_now=False,
        auto_now_add=False
    )
    cluster = models.IntegerField()

    date_today    = models.DateField(
            auto_now=False,
            auto_now_add=False,
            default=ddate.today().isoformat()
        )
    def __str__(self):
        return ""
    class Meta:
        db_table = "cluster_three_day"