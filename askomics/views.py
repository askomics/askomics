from pyramid.view import view_config

@view_config(route_name='home', renderer='static/src/templates/index.pt')
def my_view(request):

    return {
        'project': 'AskOmics',
        'signup': request.registry.settings['askomics.enable_account_creation']  if 'askomics.enable_account_creation' in request.registry.settings else 'true',
        'login_message': request.registry.settings['askomics.ldap.message'] if 'askomics.ldap.message' in request.registry.settings else ''
    }
