from pathlib import Path
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.db import OperationalError
from django.test import TestCase, SimpleTestCase
from config.database import database_config, durable_storage

class DeploymentHealthTests(TestCase):
    def test_liveness_does_not_require_initial_admin(self):
        self.assertEqual(self.client.get('/hotel-api/live/').status_code,200)
        self.assertEqual(self.client.get('/hotel-api/health/').status_code,503)
    def test_readiness_requires_admin_trusted_origin_and_durable_storage(self):
        get_user_model().objects.create_superuser(username='deploy@example.test',password='Test-only-pass-2042')
        response=self.client.get('/hotel-api/health/')
        self.assertEqual(response.status_code,200);self.assertTrue(response.json()['ready']);self.assertIn('no-store',response['Cache-Control'])
        with self.settings(HOTEL_DURABLE_STORAGE=False): self.assertEqual(self.client.get('/hotel-api/health/').status_code,503)
        with self.settings(CSRF_TRUSTED_ORIGINS=[]): self.assertEqual(self.client.get('/hotel-api/health/').status_code,503)
    def test_database_failure_is_not_reported_as_ready(self):
        with patch('hotel.react_api.connection.ensure_connection',side_effect=OperationalError('synthetic error')):
            response=self.client.get('/hotel-api/health/')
        self.assertEqual(response.status_code,503);self.assertFalse(response.json()['ready']);self.assertNotIn('synthetic error',response.content.decode())
    def test_api_only_render_root_redirects_to_the_existing_frontend(self):
        with self.settings(FRONTEND_URL='https://strix-user.vercel.app'), patch('hotel.react_api.Path.exists',return_value=False):
            response=self.client.get('/app/rooms?q=test')
        self.assertRedirects(response,'https://strix-user.vercel.app/app/rooms?q=test',fetch_redirect_response=False)

class DatabaseConfigurationTests(SimpleTestCase):
    def test_local_sqlite_retains_immediate_transactions(self):
        config=database_config('',Path('/tmp/hotel-test.sqlite3'))
        self.assertEqual(config['ENGINE'],'django.db.backends.sqlite3');self.assertEqual(config['OPTIONS']['transaction_mode'],'IMMEDIATE')
        self.assertFalse(durable_storage(config,True));self.assertTrue(durable_storage(config,False))
    def test_postgres_parses_url_and_requires_tls_by_default(self):
        config=database_config('postgresql://qa:synthetic-password@db.example.test:5432/hotel','unused')
        self.assertEqual(config['ENGINE'],'django.db.backends.postgresql');self.assertEqual(config['NAME'],'hotel');self.assertEqual(config['OPTIONS']['sslmode'],'require')
        self.assertTrue(durable_storage(config,True));self.assertNotIn('transaction_mode',config['OPTIONS'])
    def test_bad_url_errors_never_echo_connection_secrets(self):
        try: database_config('not-a-database://qa:do-not-print-me@example.test/x','unused')
        except RuntimeError as error: self.assertNotIn('do-not-print-me',str(error))
        else: self.fail('Unsupported database accepted')

class BootstrapAdminTests(TestCase):
    def test_bootstrap_creates_once_and_never_resets_password(self):
        import os
        from django.core.management import call_command
        from io import StringIO
        with patch.dict(os.environ,{'HOTEL_BOOTSTRAP_ADMIN_EMAIL':'owner@example.test','HOTEL_BOOTSTRAP_ADMIN_PASSWORD':'Unique-test-phrase-2042'}): call_command('bootstrap_admin',stdout=StringIO())
        user=get_user_model().objects.get(username='owner@example.test');self.assertTrue(user.is_superuser);self.assertTrue(user.check_password('Unique-test-phrase-2042'))
        with patch.dict(os.environ,{'HOTEL_BOOTSTRAP_ADMIN_PASSWORD':'Another-test-phrase-2042'}): call_command('bootstrap_admin',stdout=StringIO())
        user.refresh_from_db();self.assertTrue(user.check_password('Unique-test-phrase-2042'))
    def test_bootstrap_never_promotes_existing_guest(self):
        import os
        from django.core.management import call_command, CommandError
        from io import StringIO
        user=get_user_model().objects.create_user(username='owner@example.test',email='owner@example.test',password='Guest-test-phrase-2042')
        with patch.dict(os.environ,{'HOTEL_BOOTSTRAP_ADMIN_EMAIL':'owner@example.test','HOTEL_BOOTSTRAP_ADMIN_PASSWORD':'Unique-test-phrase-2042'}):
            with self.assertRaises(CommandError): call_command('bootstrap_admin',stdout=StringIO())
        user.refresh_from_db();self.assertFalse(user.is_superuser)
