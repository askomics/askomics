from pyramid.config import Configurator
from pyramid.session import SignedCookieSessionFactory

# from pyramid.authentication import AuthTktAuthenticationPolicy
# from pyramid.authorization import ACLAuthorizationPolicy


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    my_session_factory = SignedCookieSessionFactory('itsaseekreet',timeout=None)

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
    config.add_route('empty_user_database', '/empty_user_database')
    config.add_route('list_user_graph', '/list_user_graph')
    config.add_route('delete_graph', '/delete_graph')
    config.add_route('getUserAbstraction', '/userAbstraction')
    config.add_route('sparqlquery', '/sparqlquery')
    config.add_route('getSparqlQueryInTextFormat', '/getSparqlQueryInTextFormat')

    # Upload/integration routes
    config.add_route('source_files_overview', '/source_files_overview')
    config.add_route('guess_csv_header_type', '/guess_csv_header_type')
    config.add_route('load_data_into_graph', '/load_data_into_graph')
    config.add_route('load_gff_into_graph', '/load_gff_into_graph')
    config.add_route('load_ttl_into_graph', '/load_ttl_into_graph')
    config.add_route('preview_ttl', '/preview_ttl')
    config.add_route('ttl', '/ttl/{name:.*}')
    config.add_route('csv', '/csv/{name:.*}')
    config.add_route('del_csv', '/del_csv/{name:.*}')

    config.add_route('get_uploaded_files', 'get_uploaded_files')

    # Shortcuts and modules routes
    config.add_route('importShortcut', '/importShortcut')
    config.add_route('deleteShortcut', '/deleteShortcut')
    config.add_route('modules', '/modules')
    config.add_route('manage_module', '/manage_module')

    # Data upload routes
    # Inspired from https://github.com/blueimp/jQuery-File-Upload/ and https://github.com/grooverdan/pyramid-jQuery-File-Upload-demo/
    config.add_route('uploadform', '/up/')
    config.add_route('upload_delete', '/up/file{sep:/*}{name:.*}&_method=DELETE')
    config.add_route('upload', '/up/file{sep:/*}{name:.*}')

    # Galaxy route
    config.add_route('connect_galaxy', '/connect_galaxy')
    config.add_route('get_data_from_galaxy', '/get_data_from_galaxy')
    config.add_route('upload_galaxy_files', '/upload_galaxy_files')
    config.add_route('send_to_galaxy', '/send_to_galaxy')

    # Authentication routes
    config.add_route('signup', '/signup')
    config.add_route('login', '/login')
    config.add_route('login_api', '/login_api')
    config.add_route('logout', '/logout')
    config.add_route('checkuser', '/checkuser')

    # Administration
    config.add_route('get_users_infos', '/get_users_infos')
    config.add_route('lockUser', '/lockUser')
    config.add_route('setAdmin', '/setAdmin')
    config.add_route('delete_user', '/delete_user')

    config.add_route('get_my_infos', 'get_my_infos')
    config.add_route('update_mail', 'update_mail')
    config.add_route('update_passwd', 'update_passwd')
    config.add_route('api_key', '/api_key')
    config.add_route('del_apikey', '/del_apikey')

    # TODO no absolute path to static files
    # TODO check what is cors (iframe redirect?)
    # TODO check security (delete truc/../../../)
    # TODO change noscript url

    config.scan()
    return config.make_wsgi_app()
