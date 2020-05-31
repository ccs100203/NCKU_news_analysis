from django.shortcuts import render
from django.http import HttpResponse
from crawling.apis import ltn_crawling, nowNews_crawling, pts_crawling, udn_crawling, cts_crawling, ftvnews_crawling
from newsdb.models import Subject, Brand, Brand_sub, New, Aspect
from multiprocessing import Pool
from newsdb.serializers import NewSerializer
from datetime import datetime, date
from news_site import settings
import pickle
import json, re
import pandas as pd
from analysis.apis import AspectModule, Split, SentimentAnalysis, standpoint_analysis
from newsdb.models import New, Tagger
from django.db.models import Q
def get_news_today():
    apis = [
        SETNCrawler,
        CNACrawler,
        EBCCrawler,
        NewtalkCrawler,
        TVBSCrawler,
        UpmediaCrawler,
        StormCrawler,
        ChinatimesCrawler,
    ]

    for api in apis:
        try:
            crawler = api()
            news_today = crawler.get_news_today()
            #news_today = crawler.get_news_by_date(date_list=["2020-05-24", "2020-05-25", "2020-05-26", "2020-05-27", "2020-05-28", "2020-05-29"])
            result = crawler.insert_news(news_today)

            print('successful')
        except Exception as e:
            print(e)
            print('error in crawler')
            pass

    return HttpResponse(True)


def analysis_aspect(df):
    util_path = settings.BASE_DIR + '/analysis/apis/utils/aspect_data/chineseGLUE/inews/'


    print(df.head())
    # save the current file into csv
    df.drop('author',axis=1,inplace=True)
    df.drop('date',axis=1,inplace=True)
    df.drop('update_time', axis=1, inplace=True)
    df.drop('brand_id', axis=1,inplace=True)
    df.drop('sub_id', axis=1, inplace=True)
    df.drop('url', axis=1, inplace=True)
    df = df[['title', 'content', 'id']]

    def cleanP(row):
        content = row['content']
        tmp = re.sub(r'[\n]', ' ', content)
        row['content'] = tmp
        title = row['title']
        tmp = re.sub(r'[\n]', ' ', title)
        row['title'] = tmp
        return row
    # df = df.apply(cleanP, axis=1)
    # df.to_csv(util_path + 'eval_tc.csv')

    aspectModule = AspectModule(df, 'eval', 8)
    result = aspectModule.eval('bert-base-chinese-e-3.ckpt')

    all_news = New.objects.all()
    cur_asp = Aspect.objects.all()
    for dp, di in result:
        if len(cur_asp.filter(new_id=di)) == 0:
            tmp = Aspect(**{'aspect': dp, 'new':all_news.get(id=di)})
            tmp.save()

    print(result)


def todayNews_crawling():
    ls = [
        ('cts', cts_crawling()),
        ('ltn',ltn_crawling()),
        ('nowNews', nowNews_crawling()),
        ('udn', udn_crawling()),
        ('ftvnews', ftvnews_crawling()),
        ('pts', pts_crawling()),
    ]
    errors = []
    df = pd.DataFrame(columns=['id', 'title', 'content', 'author', 'brand_id', 'sub_id', 'date', 'update_time', 'url'])
    for name, i in ls:
        print("="*150)
        new_data = []
        # data = i.getNews(date=['2020-05-30', '2020-05-28', '2020-05-07', '2020-05-06','2020-05-05', '2020-05-04','2020-05-03', '2020-05-02', '2020-05-01', '2020-04-28', '2020-04-29', '2020-04-30'])
        data = i.getNews(date=[date.today().isoformat()])
        for j in data:
            n = NewSerializer(data=j)
            try:
                if not n.is_valid():
                    raise ValueError
                new_data.append(j)
            except ValueError:
                errors.append({'error': n.errors, 'data': n.data})
                pass
        print(len(new_data))
        result = i.insertNews(new_data)
        if result != None:
            result = pd.DataFrame([ dr.__dict__ for dr in result],
                              columns=['id', 'title', 'content', 'author', 'brand_id', 'sub_id', 'date', 'update_time', 'url'])
            df.append(result)
        print(f"{name} finished")
    with open(f'{settings.BASE_DIR}/../error/{date.today().isoformat()}_error.json',"w+") as file:
        file.write(json.dumps(errors))
    return df


def crawling():
    todayNews_crawling()
    get_news_today()

def autoTagger():
    news_query = New.objects.filter(Q(date=date.today().isoformat()))
    sentiment_analysis = Split()
    data = sentiment_analysis.seperate_news(news_query)

def autoSentiment():
    news_query = Tagger.objects.filter(Q(date=date.today().isoformat()))
    sentiment_analysis = SentimentAnalysis()
    sentiment_analysis.get_score(news_query)

def autoStandpoint():
    news_query = New.objects.filter(Q(date=date.today().isoformat()))
    prediction = standpoint_analysis(news_query)

def autoAspect():
    news = New.objects.filter(*[Q(date=date.today().isoformat())])
    df = pd.DataFrame(list(news.values()),
                      columns=[
                      'id',
                      'title',
                      'content',
                      'author',
                      'brand_id',
                      'sub_id',
                      'date',
                      'update_time',
                      'url']
    )
    analysis_aspect(df)


def run():
    # Crawling the news
    # todayNews_crawling(None)
    # tagger
    # crawling()

    # autoTagger()

    # autoSentiment()

    # autoAspect()

    autoStandpoint()



