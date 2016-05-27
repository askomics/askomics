from askomics.test import AskoTestCase
from askomics import main


class ViewTests(AskoTestCase):
    def setUp(self):
        from askomics.ask_view import AskView

        super().setUp()
        self.app = main(self.settings)

        from webtest import TestApp
        self.testapp = TestApp(self.app)

    def test_home(self):

        res = self.testapp.get('/', status=200)
        self.assertIn(b'<a class="navbar-brand site-header" href="/">Askomics</a>', res.body)
