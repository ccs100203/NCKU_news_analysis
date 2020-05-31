from newsdb.models import Subject, Brand, Brand_sub, New, Word
from ckiptagger import data_utils, construct_dictionary, WS, POS
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
import numpy as np
import pandas as pd
import os, re
from django.conf import settings
from .hotword_v1 import Hotword
from datetime import date, timedelta, datetime
import pickle
from tqdm import tqdm



class KeywordToday:
    def __init__(self):
        self.get20Group()
        self.util_path = settings.BASE_DIR + '/analysis/apis/utils/ckiptagger'
        self.util = settings.BASE_DIR + '/analysis/apis/utils/word_count'
        self.ws = WS(self.util_path + '/data')
        self.pos = POS(self.util_path + '/data')

    def get20Group(self):
        self.keywords_group = []

        for i in range(1, 2):
            self.keywords_group.append(New.objects.filter(cluster_day__cluster=i, cluster_day__date='2020-05-30'))

    def getWordFreq(self):
        # news = New.objects.filter(cluster_day__date=date.today().isoformat())

        news = New.objects.filter(cluster_day__date='2020-05-30', cluster_day__cluster=1)
        df = self.preprocessing(news)

        print(len(df))

        word_ls = self.ws(df['content'])

        ls = []
        for dword in word_ls:
            ls.append(' '.join(dword))
        # ls = [ self.tagger([content]) for content in tqdm(df['content']) ]

        print(len(ls))
        vec = CountVectorizer()
        matrix = vec.fit_transform(ls)
        name = vec.get_feature_names()
        row, col = matrix.shape

        count = {}
        for dc in range(col):
            sum = 0
            for dr in range(row):
                sum += matrix[dr, dc]
            count[name[dc]] = sum

        with open(f'{self.util_path}/{date.today().isoformat()}.pkl', 'wb') as file:
            pickle.dump(count, file)
        return count

    def getGroupKeywords(self):

        ls = []
        for dq in self.keywords_group:
            ls.append(self.preprocessing(dq))

        groupWised_content = []
        for i, dl in enumerate(ls):
            groupWised_content.append((i, self.tagger(dl['content'])))

        keywords_tuple = self.genTfidf(groupWised_content)

        keywords = [ dk[1][0] for dk in keywords_tuple ]

        df = self.getNewHotword()

        relative_news = self.find_relative_news(keywords, df)

        return keywords, relative_news

    def text_preprocessing(self, raw):
        text = raw['content']
        tmp = re.sub(r'（.+）','', text)
        tmp = re.sub(r'〔.+〕', '', tmp)
        tmp = re.sub(r'[\r\n]', '', tmp)
        tmp = tmp.strip()
        # tmp = tmp.split(' ')
        if len(tmp) != 0:
            raw['content'] = tmp
        else:
            raw['content'] = None
        return raw

    def value_convert(self, raw):
        date = raw['update_time']
        raw['update_time'] = date.strftime('%Y-%m-%d')
        raw['date'] = raw['date'].strftime('%Y-%m-%d')
        return raw

    def preprocessing(self, querySet):
        df = pd.DataFrame(
            list(querySet.values()),
            columns=['id', 'title', 'content', 'author', 'brand_id', 'sub_id', 'date', 'update_time', 'url']
        )

        pre_df = df \
                    .apply(self.text_preprocessing, axis=1) \
                    .apply(self.value_convert, axis=1) \
                    .dropna()

        return pre_df

    def tagger(self, content):
        words_ls = self.ws(content)
        pos_ls = self.pos(words_ls)

        ls = []

        pos_tag = ['Nb', 'Nc']

        for dwords_ls in words_ls:
            for dword in dwords_ls:
                ls.append(dword)

        rst = ' '.join( [str(word) for word in ls ] )

        return rst


    def genTfidf(self, matrix_tuple):
        vectorizer = TfidfVectorizer()
        try:
            tfidf_vec = vectorizer.fit_transform([ dl[1] for dl in matrix_tuple])
        except:
            print(matrix_tuple)

        tfidf_arr = tfidf_vec.toarray()
        sort = np.argsort(tfidf_arr, axis=1)[:, -20:]
        names = vectorizer.get_feature_names()
        keywords = pd.Index(names)[sort].values
        keywords_tuple = list(zip([dc[0] for dc in matrix_tuple], keywords))

        return keywords_tuple


    def getNewHotword(self):
        """ Calculate all keywords in news today
        """

        # todayNews = New.objects.filter(cluster_day__date__gte=date.today().isoformat())
        threeDayNews = New.objects.filter(date__gte='2020-05-29')
        df = pd.DataFrame(
            list(threeDayNews.values()),
            columns=['id', 'title', 'content', 'author', 'brand_id', 'sub_id', 'date', 'update_time', 'url']
        )
        df = df \
            .apply(self.text_preprocessing, axis=1) \
            .apply(self.value_convert, axis=1) \
            .dropna()
        words = self.ws(df['content'])
        # TODO need to be done in workflow
        ll = []
        for i in words:
            if len(i) != 0:
                ll.append(' '.join(word for word in i))
        print(len(ll), len(df))
        assert len(ll) == len(df)
        vectorizer = TfidfVectorizer()
        try:
            tfidf_vec = vectorizer.fit_transform(ll)
        except ValueError:
            print(ll)

        tfidf_arr = tfidf_vec.toarray()
        sort = np.argsort(tfidf_arr, axis=1)[:, -20:]
        names = vectorizer.get_feature_names()
        keywords = pd.Index(names)[sort].values
        print(len(df), len(keywords))
        df['keywords'] = list(keywords[:])

        return df

    def find_relative_news(self, keywords, df):

        ls = {}
        for i in keywords:
            ls[i] = {}

        for row in df.iterrows():
            row = row[1]
            news_keywords = row['keywords']
            id = row.id
            date = row.date
            for main_keyword in keywords:
                if main_keyword in news_keywords:
                    if date in ls[main_keyword].keys():
                        t = pd.Series(news_keywords)
                        ls[main_keyword]['relative_keywords'].extend(t[ t != main_keyword ].tolist())
                        ls[main_keyword][date][id] = {}
                        ls[main_keyword][date][id]['keywords'] = t[ t != main_keyword ].tolist()
                        ls[main_keyword][date][id]['url'] = row.url
                        ls[main_keyword][date][id]['title'] = row.title
                    else:
                        ls[main_keyword][date] = {}
                        ls[main_keyword]['relative_keywords'] = []
        return ls

    def genData(self, keyword, relative_news):
        ls = []
        print(relative_news[keyword].keys())
        for date in relative_news[keyword].keys():
            if date != 'relative_keywords':
                tmp = {
                    'date': date,
                    'keyword': 'test'
                }
                posLinks = []
                negLinks = []
                n = 0
                print(relative_news[keyword][date])
                for news_id in relative_news[keyword][date].keys():
                    url = relative_news[keyword][date][news_id]['url']
                    title = relative_news[keyword][date][news_id]['title']
                    if (n % 2) == 0:
                        posLinks.append({
                            'title': title,
                            'url' : url
                        })
                    else:
                        negLinks.append({
                            'title': title,
                            'url': url
                        })
                    n += 1
                tmp['posLinks'] = posLinks
                tmp['negLinks'] = negLinks
                ls.append(tmp)

        wordCloud = []
        wordCount = self.getWordFreq()
        for dword in relative_news[keyword]['relative_keywords']:
            try:
                wordCloud.append({
                    'text' : dword,
                    'size' : str(wordCount[dword])
                })
            except KeyError:
                pass

        return ls, wordCloud


def zero(num):
    return f"0{num}" if num < 10 else f"{num}"


class KeywordThreeDay:
    def __init__(self):
        self.get20Group()
        self.util_path = settings.BASE_DIR + '/analysis/apis/utils/ckiptagger'
        self.util = settings.BASE_DIR + '/analysis/apis/utils/word_count'
        self.ws = WS(self.util_path + '/data')
        self.pos = POS(self.util_path + '/data')



    def get20Group(self):
        self.keywords_group = []

        base = datetime(2020,5,30)
        date_list = [ base - timedelta(days=x) for x in range(3)]
        date_list = [ f'{dd.year}-{zero(dd.month)}-{zero(dd.day)}' for dd in date_list]
        for i in range(1, 2):
            for ddate in date_list:
                self.keywords_group.append(New.objects.filter(cluster_day__cluster=i, cluster_day__date=ddate))


    def getGroupKeywords(self):

        ls = []
        for dq in self.keywords_group:
            ls.append(self.preprocessing(dq))

        groupWised_content = []
        for i, dl in enumerate(ls):
            groupWised_content.append((i, self.tagger(dl['content'])))

        keywords_tuple = self.genTfidf(groupWised_content)

        keywords = [ dk[1][0] for dk in keywords_tuple ]

        df = self.getNewHotword()

        relative_news = self.find_relative_news(keywords, df)

        return keywords, relative_news

    def text_preprocessing(self, raw):
        text = raw['content']
        tmp = re.sub(r'（.+）','', text)
        tmp = re.sub(r'〔.+〕', '', tmp)
        tmp = re.sub(r'[\r\n]', '', tmp)
        tmp = tmp.strip()
        # tmp = tmp.split(' ')
        if len(tmp) != 0:
            raw['content'] = tmp
        else:
            raw['content'] = None
        return raw

    def value_convert(self, raw):
        date = raw['update_time']
        raw['update_time'] = date.strftime('%Y-%m-%d')
        raw['date'] = raw['date'].strftime('%Y-%m-%d')
        return raw

    def preprocessing(self, querySet):
        df = pd.DataFrame(
            list(querySet.values()),
            columns=['id', 'title', 'content', 'author', 'brand_id', 'sub_id', 'date', 'update_time', 'url']
        )

        pre_df = df \
                    .apply(self.text_preprocessing, axis=1) \
                    .apply(self.value_convert, axis=1) \
                    .dropna()

        return pre_df

    def tagger(self, content):
        words_ls = self.ws(content)
        pos_ls = self.pos(words_ls)

        ls = []

        pos_tag = ['Nb', 'Nc']

        for dwords_ls in words_ls:
            for dword in dwords_ls:
                ls.append(dword)

        rst = ' '.join( [str(word) for word in ls ] )

        return rst


    def genTfidf(self, matrix_tuple):
        vectorizer = TfidfVectorizer()
        try:
            tfidf_vec = vectorizer.fit_transform([ dl[1] for dl in matrix_tuple])
        except:
            print(matrix_tuple)

        tfidf_arr = tfidf_vec.toarray()
        sort = np.argsort(tfidf_arr, axis=1)[:, -20:]
        names = vectorizer.get_feature_names()
        keywords = pd.Index(names)[sort].values
        keywords_tuple = list(zip([dc[0] for dc in matrix_tuple], keywords))

        return keywords_tuple


    def getNewHotword(self):
        """ Calculate all keywords in news today
        """

        # todayNews = New.objects.filter(cluster_day__date__gte=date.today().isoformat())
        threeDayNews = New.objects.filter(date__gte='2020-05-30')
        df = pd.DataFrame(
            list(threeDayNews.values()),
            columns=['id', 'title', 'content', 'author', 'brand_id', 'sub_id', 'date', 'update_time', 'url']
        )
        df = df \
            .apply(self.text_preprocessing, axis=1) \
            .apply(self.value_convert, axis=1) \
            .dropna()
        words = self.ws(df['content'])
        # TODO need to be done in workflow
        ll = []
        for i in words:
            if len(i) != 0:
                ll.append(' '.join(word for word in i))
        print(len(ll), len(df))
        assert len(ll) == len(df)
        vectorizer = TfidfVectorizer()
        try:
            tfidf_vec = vectorizer.fit_transform(ll)
        except ValueError:
            print(ll)

        tfidf_arr = tfidf_vec.toarray()
        sort = np.argsort(tfidf_arr, axis=1)[:, -20:]
        names = vectorizer.get_feature_names()
        keywords = pd.Index(names)[sort].values
        print(len(df), len(keywords))
        df['keywords'] = list(keywords[:])

        return df

    def find_relative_news(self, keywords, df):

        ls = {}
        for i in keywords:
            ls[i] = {}

        for row in df.iterrows():
            row = row[1]
            news_keywords = row['keywords']
            id = row.id
            date = row.date
            for main_keyword in keywords:
                if main_keyword in news_keywords:
                    if date in ls[main_keyword].keys():
                        t = pd.Series(news_keywords)
                        ls[main_keyword]['relative_keywords'].extend(t[ t != main_keyword ].tolist())
                        ls[main_keyword][date][id] = {}
                        ls[main_keyword][date][id]['keywords'] = t[ t != main_keyword ].tolist()
                        ls[main_keyword][date][id]['url'] = row.url
                        ls[main_keyword][date][id]['title'] = row.title
                    else:
                        ls[main_keyword][date] = {}
                        ls[main_keyword]['relative_keywords'] = []
        return ls

    def genData(self, keywords, relative_news):
        ls = []
        keywords_ls = []
        for keyword in keywords:
            tmp = {
                'keyword' : keyword,
                'summary' : 'test',
            }
            keyword_tmp = {
                'keyword' : keyword,
                'relative_news' : []
            }
            newsNum = 0
            links = []
            for date in relative_news[keyword].keys():
                if date != 'relative_keywords':
                    for id in relative_news[keyword][date].keys():
                        links.append({
                            'title' : relative_news[keyword][date][id]['title'],
                            'url' : relative_news[keyword][date][id]['url']
                        })
                        newsNum += 1
                        keyword_tmp['relative_news'].append(str(id))
            tmp['newsNum'] = newsNum
            tmp['links'] = links
            ls.append(tmp)
            keywords_ls.append(keyword_tmp)




        return ls, keywords_ls