from pathlib import Path
import dj_database_url

def database_config(url, sqlite_path):
    if url:
        try: config = dj_database_url.parse(url, conn_max_age=600, conn_health_checks=True)
        except (ValueError, KeyError): raise RuntimeError('DATABASE_URL noto‘g‘ri. Render Environment sozlamasini tekshiring.') from None
    else: config = {'ENGINE':'django.db.backends.sqlite3','NAME':sqlite_path}
    if config['ENGINE'] == 'django.db.backends.sqlite3':
        config['OPTIONS'] = {**config.get('OPTIONS',{}),'timeout':20,'transaction_mode':'IMMEDIATE'}
    elif config['ENGINE'] == 'django.db.backends.postgresql':
        config.setdefault('OPTIONS',{}).setdefault('sslmode','require')
    else: raise RuntimeError('Bu loyiha SQLite yoki PostgreSQL bazasi bilan ishlaydi.')
    return config

def durable_storage(config, on_render):
    if not on_render: return True  # Local demo storage is a normal persistent filesystem.
    if config['ENGINE'] == 'django.db.backends.postgresql': return True
    return Path(str(config['NAME'])).resolve().is_relative_to(Path('/var/data')) and Path('/var/data').is_dir()
