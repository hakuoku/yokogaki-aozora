FROM python:3.11 AS builder
COPY requirements.txt /
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

FROM ruby:3.1.3
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /usr/local/lib /usr/local/lib
RUN gem update --system \
    && gem install aozora2html
WORKDIR /app
COPY ./ ./
# CMD ["python", "app.py"]
CMD ["waitress-serve", "--port=8080", "app:app"]