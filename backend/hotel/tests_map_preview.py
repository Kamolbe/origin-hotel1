from unittest.mock import patch, MagicMock
from django.test import SimpleTestCase
from django.core.exceptions import ValidationError
from .map_preview import map_embed_url

class MapPreviewTests(SimpleTestCase):
    def test_coordinates_search_place_and_embed(self):
        self.assertIn('q=41.3%2C69.2',map_embed_url('https://www.google.com/maps/place/Hotel/@41.1,69.1,17z/data=!3d41.3!4d69.2'))
        self.assertIn('q=Origin+Hotel',map_embed_url('https://maps.google.com/?q=Origin+Hotel'))
        self.assertIn('q=Origin+Hotel',map_embed_url('https://www.google.com/maps/place/Origin+Hotel'))
        self.assertIn('cid=12345',map_embed_url('https://maps.google.com/?cid=12345'))
        self.assertEqual(map_embed_url('https://www.google.com/maps/embed?pb=test'),'https://www.google.com/maps/embed?pb=test')
    @patch('hotel.map_preview.requests.get')
    def test_short_google_link_resolved(self,get):
        response=MagicMock(status_code=302,headers={'Location':'https://www.google.com/maps?q=41.3,69.2'})
        get.return_value.__enter__.return_value=response
        self.assertIn('q=41.3%2C69.2',map_embed_url('https://maps.app.goo.gl/example'))
        self.assertFalse(get.call_args.kwargs['allow_redirects'])
    @patch('hotel.map_preview.requests.get')
    def test_short_link_cannot_redirect_to_other_hosts(self,get):
        get.return_value.__enter__.return_value=MagicMock(status_code=302,headers={'Location':'http://127.0.0.1/private'})
        with self.assertRaises(ValidationError): map_embed_url('https://maps.app.goo.gl/example')
        self.assertEqual(get.call_count,1)
    @patch('hotel.map_preview.requests.get')
    def test_non_google_links_use_address_without_network_fetch(self,get):
        self.assertIn('q=Tashkent',map_embed_url('https://example.test/maps','Tashkent'))
        get.assert_not_called()
