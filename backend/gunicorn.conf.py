import os
bind = os.environ.get('GUNICORN_BIND', '127.0.0.1:8000')
workers = int(os.environ.get('GUNICORN_WORKERS', '2'))
timeout = 60
accesslog = '-'
errorlog = '-'
