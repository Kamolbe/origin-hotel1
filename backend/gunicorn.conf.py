import os
bind = os.environ.get('GUNICORN_BIND', f'0.0.0.0:{os.environ["PORT"]}' if os.environ.get('PORT') else '127.0.0.1:8000')
workers = int(os.environ.get('GUNICORN_WORKERS', '2'))
timeout = 60
accesslog = '-'
errorlog = '-'
# Render needs the HTTP workers; the optional local control socket is unnecessary.
control_socket_disable = True
