from pyramid.config import Configurator
from pyramid.session import SignedCookieSessionFactory

def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    my_session_factory = SignedCookieSessionFactory('itsaseekreet')

    config = Configurator(settings=settings)
    config.set_session_factory(my_session_factory)

    config.include('pyramid_chameleon')
    config.add_static_view('static', 'static', cache_max_age=3600)

    # Askomics routes
    config.add_route('home', '/')
    config.add_route('start_point', '/startpoints')
    config.add_route('statistics', '/statistics')
    config.add_route('empty_database', '/empty_database')
    config.add_route('getUserAbstraction', '/userAbstraction')
    config.add_route('query', '/results') #===========> Obsolete
    config.add_route('sparqlquery', '/sparqlquery')
    config.add_route('source_files_overview', '/source_files_overview')
    config.add_route('load_data_into_graph', '/load_data_into_graph')
    config.add_route('preview_ttl', '/preview_ttl')
    config.add_route('check_existing_data', '/check_existing_data')

    config.add_route('ttl', '/ttl/{name:.*}')

    # Data upload routes
    # Inspired from https://github.com/blueimp/jQuery-File-Upload/ and https://github.com/grooverdan/pyramid-jQuery-File-Upload-demo/
    config.add_route('uploadform', '/up/')
    config.add_route('upload_delete', '/up/file{sep:/*}{name:.*}&_method=DELETE')
    config.add_route('upload', '/up/file{sep:/*}{name:.*}')


    # TODO no absolute path to static files
    # TODO check what is cors (iframe redirect?)
    # TODO check security (delete truc/../../../)
    # TODO change noscript url

    config.scan()
    return config.make_wsgi_app()
