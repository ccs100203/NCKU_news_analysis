from django.urls import path
from . import views
urlpatterns = [
    path('', views.index),
    path('keyword', views.keywordPage),
    path('publisher', views.publisherPage),
    path('foreign', views.foreignPage),
    path('media', views.mediaPage),
    path('keyword_analysis/<str:keyword>', views.keywordAnalysisPage),
    path('keyword_choose', views.keywordChoosePage),
    path('news_summary', views.newsSummaryPage)
]