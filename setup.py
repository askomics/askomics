import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'README.md')) as f:
    README = f.read()
with open(os.path.join(here, 'CHANGES.txt')) as f:
    CHANGES = f.read()

requires = [
    'pyramid==1.7',
    'pyramid-chameleon==0.3',
    'pyramid-debugtoolbar==3.0.1',
    'waitress==0.9.0',
    'SPARQLWrapper==1.7.6',
    'requests==2.10.0',
    'Pygments==2.1.3',
    'nose',
    'webtest',
    'coverage',
    'biopython',
    'bcbio-gff',
    'validate_email',
    'bioblend==0.9.0',
    'humanize',
    'pybedtools==0.7.10',
    'configparser'
    ]

setup(name='Askomics',
      version='2.0',
      description='Askomics',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      maintainer='Olivier Filangi',
      maintainer_email='olivier.filangi@inra.fr',
      url='https://github.com/askomics/askomics/',
      keywords='web pyramid pylons',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires,
      setup_requires=['nose>=1.3'],
      tests_require=['webtest', 'coverage'],
      test_suite="askomics",
      entry_points="""\
      [paste.app_factory]
      main = askomics:main
      """,
      )
