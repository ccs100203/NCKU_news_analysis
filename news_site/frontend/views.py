from django.shortcuts import render

# Create your views here.
def index(request):
    return render(request, 'index.html')

def keywordPage(request):
    return render(request, 'keyword.html')

def publisherPage(request):
    return render(request, 'publisher.html')

def foreignPage(request):
    return render(request, 'foreign.html')

def mediaPage(request):
    return render(request, 'media.html')

def keywordAnalysisPage(request, keyword):
    return render(request, 'keyword_analysis.html')

def keywordChoosePage(request):
    return render(request, 'keyword_choose.html')

def newsSummaryPage(request):
    return render(request, 'news_summary.html')
