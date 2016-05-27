import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'README.md')) as f:
    README = f.read()
with open(os.path.join(here, 'CHANGES.txt')) as f:
    CHANGES = f.read()

requires = [
    'pyramid',
    'pyramid_chameleon',
    'pyramid_debugtoolbar',
    'waitress',
    'SPARQLWrapper',
    ]

setup(name='Askomics',
      version='1.3',
      description='Askomics',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      maintainer='Olivier Filangi',
      maintainer_email='olivier.filangi@rennes.inra.fr',
      url='http://bipaa.genouest.org/',
      keywords='web pyramid pylons',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires,
      tests_require=['webtest'],
      test_suite="askomics",
      entry_points="""\
      [paste.app_factory]
      main = askomics:main
      """,
      )
