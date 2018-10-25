import os

from setuptools import find_packages, setup

here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'README.md')) as f:
    README = f.read()
with open(os.path.join(here, 'CHANGES.txt')) as f:
    CHANGES = f.read()

requires = [
    'pyramid==1.9',
    'pyramid-chameleon',
    'pyramid-debugtoolbar',
    'waitress',
    'SPARQLWrapper',
    'requests==2.18.4',
    'Pygments==2.2.0',
    'nose==1.3.7',
    'webtest',
    'coverage',
    'biopython',
    'bcbio-gff',
    'validate_email',
    'bioblend',
    'humanize',
    'pybedtools==0.7.10',
    'configparser',
    'argparse',
    'glob2',
    'psutil',
    'rdflib-jsonld'
]

setup(name='Askomics',
      version='18.10',
      description = 
          'AskOmics is a visual SPARQL query interface supporting both intuitive ' +
          'data integration and querying while shielding the user from most of the ' +
          'technical difficulties underlying RDF and SPARQL',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
          "Programming Language :: Python",
          "Framework :: Pyramid",
          "Topic :: Internet :: WWW/HTTP",
          "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
      ],
      maintainer='Xavier Garnier',
      maintainer_email='xavier.garnier@irisa.fr',
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
