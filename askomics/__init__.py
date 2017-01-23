from pyramid.config import Configurator
from pyramid.session import SignedCookieSessionFactory

# from pyramid.authentication import AuthTktAuthenticationPolicy
# from pyramid.authorization import ACLAuthorizationPolicy


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    my_session_factory = SignedCookieSessionFactory('itsaseekreet')

    config = Configurator(settings=settings)
    config.set_session_factory(my_session_factory)

    config.include('pyramid_chameleon')
    config.add_static_view('static', 'static', cache_max_age=3600)

    # Security policies
    # authn_policy = AuthTktAuthenticationPolicy(settings['askomics.secret'])
    # authz_policy = ACLAuthorizationPolicy()
    # config.set_authentication_policy(authn_policy)
    # config.set_authorization_policy(authz_policy)

    # Askomics routes
    config.add_route('home', '/')
    config.add_route('start_point', '/startpoints')
    config.add_route('statistics', '/statistics')
    config.add_route('empty_database', '/empty_database')
    config.add_route('list_named_graphs', '/list_named_graphs')
    config.add_route('delete_graph', '/delete_graph')
    config.add_route('getUserAbstraction', '/userAbstraction')
    config.add_route('sparqlquery', '/sparqlquery')
    config.add_route('getSparqlQueryInTextFormat', '/getSparqlQueryInTextFormat')
    config.add_route('source_files_overview', '/source_files_overview')
    config.add_route('load_data_into_graph', '/load_data_into_graph')
    config.add_route('load_gff_into_graph', '/load_gff_into_graph')
    config.add_route('load_ttl_into_graph', '/load_ttl_into_graph')
    config.add_route('preview_ttl', '/preview_ttl')
    config.add_route('check_existing_data', '/check_existing_data')
    config.add_route('positionable_attr', '/positionable_attr')
    config.add_route('ttl', '/ttl/{name:.*}')

    # Data upload routes
    # Inspired from https://github.com/blueimp/jQuery-File-Upload/ and https://github.com/grooverdan/pyramid-jQuery-File-Upload-demo/
    config.add_route('uploadform', '/up/')
    config.add_route('upload_delete', '/up/file{sep:/*}{name:.*}&_method=DELETE')
    config.add_route('upload', '/up/file{sep:/*}{name:.*}')

    # Authentication routes
    config.add_route('signup', '/signup')
    config.add_route('login', '/login')
    config.add_route('logout', '/logout')
    config.add_route('checkuser', '/checkuser')

    # Administration
    config.add_route('get_users_infos', '/get_users_infos')


    # TODO no absolute path to static files
    # TODO check what is cors (iframe redirect?)
    # TODO check security (delete truc/../../../)
    # TODO change noscript url

    config.scan()
    return config.make_wsgi_app()
