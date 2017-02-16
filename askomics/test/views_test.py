# import unittest

# from pyramid import testing
# from pyramid.paster import get_appsettings
# from askomics import main


# class ViewTests(unittest.TestCase):
#     def setUp(self):
#         from askomics.ask_view import AskView

#         self.config = testing.setUp()
#         self.settings = get_appsettings('configs/development.ini', name='main')
#         self.app = main(self.settings)

#         from webtest import TestApp
#         self.testapp = TestApp(self.app)

#     def tearDown(self):
#         testing.tearDown()

#     def test_home(self):

#         res = self.testapp.get('/', status=200)
#         self.assertIn(b'<nav id=\'navbar\' class="navbar navbar-default navbar-fixed-top">', res.body)
