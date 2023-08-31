import logging
from flask import Flask, render_template,url_for, redirect
from flask_wtf import FlaskForm
from flask_wtf.csrf import CSRFProtect
from wtforms import URLField
from wtforms.validators import DataRequired, Regexp
from bs4 import BeautifulSoup
import requests
from requests.exceptions import RequestException, ConnectionError, HTTPError, Timeout
import re
import subprocess
import os
from waitress import serve

formatter = '%(asctime)s:%(levelname)s:%(name)s:%(message)s'
logging.basicConfig(filename='app.log', format=formatter, level=logging.INFO)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ['APP_SECRET']
csrf = CSRFProtect(app)

# https://www.aozora.gr.jp/cards/000119/card624.html
# https://www.aozora.gr.jp/cards/000119/files/624_14544.html
# https://www.aozora.gr.jp/cards/000119/files/624_ruby_5668.zip

class AozoraForm(FlaskForm):
    url = URLField('図書カードのURL', validators=[DataRequired(), Regexp('https?://www\.aozora\.gr\.jp/cards/(\d{6})/(?:card|files/)(\d+).*\.(?:html|zip)')])

@app.route('/', methods=['GET', 'POST'])
def index():
    form = AozoraForm()
    if form.validate_on_submit():
        posted_url = form.url.data
        pattern = re.compile(r'https?://www\.aozora\.gr\.jp/cards/(\d{6})/(?:card|files/)(\d+).*\.(?:html|zip)')
        result = pattern.search(posted_url)
        author_ID = result.group(1)
        book_ID = result.group(2)
        return redirect(url_for('book_page', author_ID=author_ID, book_ID=book_ID))
    return render_template('index.html', form=form, isIndex=True)


@app.route('/<author_ID>/<book_ID>')
def book_page(author_ID, book_ID):
    card_url = 'https://www.aozora.gr.jp/cards/' + author_ID + '/card' + book_ID + '.html'
    try:
        card_response = requests.get(card_url, timeout=(3.5, 10.0))
    except ConnectionError as ce:
        return render_template('error.html', message=f'インターネット接続がありません\n{ce}')
    except HTTPError as he:
        return render_template('error.html', message=f'HTTPエラーです\n{he}')
    except Timeout as te:
        return render_template('error.html', message=f'www.aozora.gr.jpへの接続がタイムアウトしました\n{te}')
    except RequestException as reqerror:
        return render_template('error.html', message=f'リクエストエラーです\n{reqerror}')
    pattern = re.compile(r'/files/.+?\.zip')
    result = pattern.search(card_response.text)
    zip_url = 'https://www.aozora.gr.jp/cards/' + author_ID +result.group(0)
    html_path = 'shift_jis.html'
    subprocess.run(['aozora2html', '--use-jisx0213', '--use-unicode', zip_url, html_path])
    if os.path.isfile(html_path):
        with open(html_path, encoding='shift_jis') as f:
            raw_str = f.read()
        if raw_str:
            soup = BeautifulSoup(raw_str, 'lxml')
            page_title = soup.title.contents[0]
            body = soup.body
            body.find(id='card').decompose()
            for img in body.find_all('img'):
                img.attrs['src'] = 'https://www.aozora.gr.jp/cards/' + author_ID + '/files/' + img.attrs['src']
                del img.attrs['width']
                del img.attrs['height']
        os.remove(html_path)
        return render_template('book_page.html', page_title=page_title, author_ID=author_ID, book_ID=book_ID, book_content=str(body))
    return render_template('error.html', message='zipファイルが存在しません')

if __name__ == "__main__":
    serve(app, host='0.0.0.0', port=8080)