# local Django
from newsdb.models import New

# third-party
from bs4 import BeautifulSoup
import requests
import pytz

# standard library
from datetime import datetime, date

class ChinatimesCrawler:

    def __init__(self):
        self.subjects = {
            'society/total': 1,
            'politic/total': 2,
            'world/total': 3,
            'money/total': 4,
            'sport/total': 5,
            'chinese/total': 6,
            'life/total': 7
        }

    def get_news_info (self, url, sub, date):
        soup = self.get_news_soup(url)
        return {
            'brand_id':  8,
            'sub_id':    self.subjects[sub],
            'url':     url,
            'title':   self.get_title(soup),
            'content': self.get_content(soup)[:2000],
            'date':    date,
            'author':  self.get_author(soup),
        }

    def get_news_soup (self, url):
        res = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(res.text, 'lxml')
        return soup

    def get_title (self, soup):
        try:
            title = soup.select('header.article-header h1.article-title')[0].get_text()
            return "".join( title.split() )
        except:
            return None

    def get_author (self, soup):
        try:
            author = soup.select('div.author a')[0].get_text()
            return author
        except:
            return None

    def get_content (self, soup):
        news_DOM = soup.select('div.article-body p')
        content = ''
        for DOM in news_DOM:
            content += DOM.get_text()
        return "".join( content.split() )

    def get_news_today_category(self, sub):
        timezone = pytz.timezone('Asia/Taipei')
        date_today = datetime.now(timezone).date()
        is_date_today = True

        url_category = []
        for page in range(1, 2):
            res  = requests.get('https://www.chinatimes.com/%s?page=%d&chdtv' % (sub, page), timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
            soup = BeautifulSoup(res.text, 'lxml')
            news_DOM_list = soup.select('section.article-list ul.vertical-list li')

            for news_DOM in news_DOM_list:
                news_date = news_DOM.select('div.row div.col div.meta-info time')[0]['datetime']
                news_href  = news_DOM.select('div.row div.col h3.title a')[0]['href']
                if str(datetime.strptime(news_date, '%Y-%m-%d %H:%M').date()) != str(date_today):
                    is_date_today = False
                    break
                else:
                    url_category.append( 'https://www.chinatimes.com%s' % news_href )

            if is_date_today == False:
                break

        return url_category

    def get_news_today( self ):
        timezone = pytz.timezone('Asia/Taipei')
        date_today = datetime.now(timezone).date()

        news_list = []
        for sub in self.subjects:
            url_list = self.get_news_today_category( sub )
            for url in url_list:
                temp_news = self.get_news_info( url, sub, str(date_today) )
                news_list.append( temp_news )

        return news_list

    def insert_news( self, newsList ):
        for news in newsList:
            try:
                tmp = New(
                    title=news['title'],
                    content= news['content'],
                    author= news['author'],
                    brand_id=news['brand_id'],
                    sub_id= news['sub_id'],
                    date=news['date'],
                    url=news['url'],
                )
                tmp.save()
            except Exception as e:
                print( e )
        return True
