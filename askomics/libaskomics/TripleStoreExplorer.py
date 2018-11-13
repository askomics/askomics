
#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import logging

from askomics.libaskomics.ParamManager import ParamManager

from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.SparqlQueryGraph import SparqlQueryGraph
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.rdfdb.MultipleQueryLauncher import MultipleQueryLauncher
from askomics.libaskomics.rdfdb.FederationQueryLauncher import FederationQueryLauncher

from askomics.libaskomics.EndpointManager import EndpointManager

class TripleStoreExplorer(ParamManager):
    """
    Use the different Sparql template queries in order to:
        - get special settings:
            * relation between two classes (nodes) specified by another class (hidden node).
            * virtual relation adding special Where clauses specified in the database domain.
        - get the suggestion list for classes listed as Categories and displayed
          as node attributes by AskOmics.
        - get the startpoints to begin a query building.
        - get the neighbor nodes and the attributes of a node.
    """

    def __init__(self, settings, session, dico={}):
        ParamManager.__init__(self, settings, session)

        self.log = logging.getLogger(__name__)

    def get_start_points(self):
        """
        Get the possible starting points for your graph.

        :return: List of starting points
        :rtype: Node list
        """
        self.log.debug(" =========== TripleStoreExplorer:get_start_points ===========")
        nodes = []

        sqg = SparqlQueryGraph(self.settings, self.session)
        ql = MultipleQueryLauncher(self.settings, self.session)
        em = EndpointManager(self.settings, self.session)

        lEndp = em.list_active_endpoints()
        results = ql.process_query(sqg.get_public_start_point().query,lEndp,indexByEndpoint=True)
        r2 = ql.process_query(sqg.get_user_start_point().query,lEndp,indexByEndpoint=True)

        for key, value in r2.items():
            if key in results:
                for elt in value:
                    results[key].append(elt)
            else:
                results[key] = r2[key]

        for endpoint in results:
            for result in results[endpoint]:
                g  = result["g"]
                uri = result["nodeUri"]
                label = result["nodeLabel"]

                if ('accesLevel' in result) and ('private' in result['accesLevel']):
                    public = False
                    private = True
                else:
                    public = True
                    private = False

                nodes.append({'endpoint' : endpoint,'g': g, 'uri': uri, 'label': label, 'public': public, 'private': private})
        return nodes

    def getUserAbstraction(self):
        """
        Get the user abstraction (relation and entity as subject and object)

        :return:
        :rtype:
        """
        data = {}
        self.log.debug(" =========== TripleStoreExplorer:getUserAbstraction ===========")

        sqg = SparqlQueryGraph(self.settings, self.session)
        ql = MultipleQueryLauncher(self.settings, self.session)
        em = EndpointManager(self.settings, self.session)
        lEndp = em.list_active_endpoints()

        data['relations'] = ql.process_query(sqg.get_public_abstraction_relation('owl:ObjectProperty').query,lEndp)
        data['relations'] += ql.process_query(sqg.get_user_abstraction_relation('owl:ObjectProperty').query,lEndp)
        data['subclassof'] = ql.process_query(sqg.get_isa_relation_entities().query,lEndp)
        data['entities'] = ql.process_query(sqg.get_public_abstraction_entity().query,lEndp)
        data['entities'] += ql.process_query(sqg.get_user_abstraction_entity().query,lEndp)
        data['attributes'] = ql.process_query(sqg.get_public_abstraction_attribute_entity().query,lEndp)
        data['attributes'] += ql.process_query(sqg.get_user_abstraction_attribute_entity().query,lEndp)
        data['categories'] = ql.process_query(sqg.get_public_abstraction_category_entity().query,lEndp)
        data['categories'] += ql.process_query(sqg.get_user_abstraction_category_entity().query,lEndp)
        data['positionable'] = ql.process_query(sqg.get_abstraction_positionable_entity().query,lEndp)
        data['endpoints'] = sqg.getGraphUser()
        data['endpoints_ext'] = sqg.getExternalServiceEndpoint()

        self.log.debug("============== ENDPOINTS AND GRAPH =====================================")
        self.log.debug(data['endpoints'])
        return data

    def build_recursive_block(self, tabul, constraints):
        """
        build SPARQL Block following this grammar :
        B ==> [ A , KEYWORKD ] . KEYWORKD is a string prefix for BLOCK (ex: OPTIONAL, SERVICE)
        A ==> [ ((B|F),)+ ] . a list of Block or constraints leafs
        F ==> [ CONSTRAINT1, CONSTRAINT2,.... ] an array contains only constraints
        """
        if len(constraints) == 2 and isinstance(
                constraints[0], list) and isinstance(constraints[1], str):
            return tabul + constraints[1] + "{\n" + self.build_recursive_block(
                tabul + '\t', constraints[0]) + tabul + "}\n"
        else:
            req = ""
            for elt in constraints:
                if isinstance(elt, str):
                    req += tabul + elt + ".\n"
                elif len(elt) == 2 and isinstance(elt[0], list) and isinstance(
                        elt[1], str):
                    if elt[1] != "":
                        req += tabul + elt[1] + " {\n" + self.build_recursive_block(
                            tabul + '\t', elt[0]) + tabul + "}\n"
                    else:
                        req += self.build_recursive_block(tabul, elt[0])

                else:
                    raise ValueError("build_recursive_block:: constraint malformed :"
                                     + str(elt))
            return req
        return ""

    def build_sparql_query_from_json(self,list_endpoints, typeEndpoints, fromgraphs, variates, constraintes_relations,limit, send_request_to_tps=True):
        """
        Build a sparql query from JSON constraints
        """
        if len(typeEndpoints) != len(list_endpoints):
            self.log.warn("list_endpoints:"+str(list_endpoints))
            self.log.warn("typeEndpoints:"+str(typeEndpoints))
            raise ValueError("Devel error. Different size for List Endpoints and List type Endpoints. ")

        select = ' '.join(variates)

        sqb = SparqlQueryBuilder(self.settings, self.session)
        query = self.build_recursive_block('', constraintes_relations)


        # if limit != None and limit > 0:
        #     query += ' LIMIT ' + str(limit)
        self.log.debug("============ build_sparql_query_from_json ========")
        self.log.debug("type_endpoints:"+str(typeEndpoints))
        self.log.debug("endpoints:"+str(list_endpoints))
        self.log.debug("graphs"+str(fromgraphs))

        extreq = False
        typeQuery = ''

        if send_request_to_tps:
            if len(list_endpoints) == 0:
                #raise ValueError("None endpoint are defined fo the current SPARLQ query !")
                query_launcher = QueryLauncher(self.settings, self.session)
            elif len(list_endpoints)==1:
                self.log.debug("============ QueryLauncher ========")

                endpoint = ''
                type_endpoint='askomics'
                if len(list_endpoints) == 1 :
                    endpoint = list_endpoints[0]

                if typeEndpoints[0] != 'askomics':
                    extreq = True

                query_launcher = QueryLauncher(self.settings, self.session,name = endpoint, endpoint = endpoint)
            else:

                self.log.debug("============ FederationQueryLauncher ========")

                typeQuery = '(Federation)'
                lE = []
                iCount = 0

                for i in range(0, len(list_endpoints)):
                    iCount+=1
                    end = {}
                    end['name'] = "endpoint"+str(iCount)
                    end['endpoint'] =  list_endpoints[i]
                    end['askomics'] =  (typeEndpoints[i] == 'askomics')
                    end['auth'] = 'Basic'
                    end['username'] = None
                    end['password'] = None
                    lE.append(end)


                query_launcher = FederationQueryLauncher(self.settings, self.session,lE)
            req = sqb.custom_query(fromgraphs, select, query,externalrequest=extreq).query
            results = query_launcher.process_query(req)
        else:
            results = []

        return results, sqb.custom_query(fromgraphs, select, query).query,typeQuery

    def get_prefix_uri(self):
        sqg = SparqlQueryGraph(self.settings, self.session)
        ql = MultipleQueryLauncher(self.settings, self.session)
        em = EndpointManager(self.settings, self.session)
        rs = ql.process_query(sqg.get_prefix_uri().query,em.list_active_endpoints())
        results = {}
        r_buf = {}

        for r in rs:
            label = r['nodeLabel']
            prefix = r['prefUri']

            if label not in results:
                results[label] = []
                r_buf[label] = {}
                results[label].append(self.get_param("askomics.prefix"))
                r_buf[label][self.get_param("askomics.prefix")]=0

            if prefix not in r_buf[label]:
                results[label].append(prefix);
                r_buf [label][prefix]=0;

        return results
