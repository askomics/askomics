#! /usr/bin/env python3
# -*- coding: utf-8 -*-
import logging

from askomics.libaskomics.ParamManager import ParamManager

from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.SparqlQueryGraph import SparqlQueryGraph
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher


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
        ql = QueryLauncher(self.settings, self.session)
        results = ql.process_query(sqg.get_start_point().query)

        for result in results:
            uri = result["nodeUri"]
            label = result["nodeLabel"]

            if 'private' in result['accesLevel']:
                public = False
                private = True
            else:
                public = True
                private = False

            nodes.append({'uri': uri, 'label': label, 'public': public, 'private': private})

        return nodes

    def getUserAbstraction(self):
        """
        Get the user abstraction (relation and entity as subject and object)

        :return:
        :rtype:
        """
        data = {}
        list_entities = {}

        self.log.debug(" =========== TripleStoreExplorer:getUserAbstraction ===========")

        nodes_startpoint = self.get_start_points()
        # add start node at first
        for node in nodes_startpoint:
            list_entities[node['uri']] = 0

        # sqb = SparqlQueryBuilder(self.settings, self.session)
        sqg = SparqlQueryGraph(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)

        # sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionRelationUser)
        # query = sqb.load_from_file(sparql_template, { 'OwlProperty' : 'owl:ObjectProperty'}).query
        # results = ql.process_query(query)

        results = ql.process_query(sqg.get_abstraction_relation('owl:ObjectProperty').query)

        data['relations'] = results

        for elt in results:
            if not elt['object'] in list_entities:
                list_entities[elt['object']] = 0
            if not elt['subject'] in list_entities:
                list_entities[elt['subject']] = 0

        #sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionRelationUser)
        #query = sqb.load_from_file(sparql_template, { 'OwlProperty' : 'owl:SymmetricProperty'}).query
        #results = ql.process_query(query)

        #data['relationsSym'] = results

        #for elt in results:
        #    if not elt['object'] in list_entities:
        #        list_entities[elt['object']]=0
        #    if not elt['subject'] in list_entities:
        #        list_entities[elt['subject']]=0

        filter_entities = ' '.join(["<"+s+">" for s in list_entities.keys()])
        # sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionEntityUser)
        # query = sqb.load_from_file(sparql_template, {"entities" : filter_entities }).query
        # results = ql.process_query(query)

        results = ql.process_query(sqg.get_abstraction_entity(filter_entities).query)

        data['entities'] = results

        # sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionAttributesEntityUser)
        # query = sqb.load_from_file(sparql_template, {"entities" : filter_entities }).query
        # results = ql.process_query(query)

        results = ql.process_query(sqg.get_abstraction_attribute_entity(filter_entities).query)

        data['attributes'] = results

        # sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionCategoriesEntityUser)
        # query = sqb.load_from_file(sparql_template, {"entities" : filter_entities }).query
        # results = ql.process_query(query)

        results = ql.process_query(sqg.get_abstraction_category_entity(filter_entities).query)

        data['categories'] = results

        # sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionPositionableEntityUser)
        # query = sqb.load_from_file(sparql_template, {}).query
        # results = ql.process_query(query)

        results = ql.process_query(sqg.get_abstraction_positionable_entity().query)

        data['positionable'] = results


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

    def build_sparql_query_from_json(self, variates, constraintes_relations, limit, send_request_to_tps):
        """
        Build a sparql query from JSON constraints
        """

        select = ' '.join(variates)

        sqb = SparqlQueryBuilder(self.settings, self.session)
        query_launcher = QueryLauncher(self.settings, self.session)

        query = self.build_recursive_block('', constraintes_relations)

        # if limit != None and limit > 0:
        #     query += ' LIMIT ' + str(limit)

        if send_request_to_tps:
            results = query_launcher.process_query(sqb.custom_query(select, query).query)
        else:
            results = []

        return results, query


    def build_sparql_query_from_json2(self, variates, constraintes_relations, limit, send_request_to_TPS):
        """
        build a sparql query from json
        """
        self.log.debug("variates")
        self.log.debug(variates)
        self.log.debug("constraintes_relations")
        self.log.debug(constraintes_relations)

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)

        req = ""
        req += "SELECT DISTINCT "+' '.join(variates)+"\n"
        #TODO OFI: External Service do not work and, anyway, graphes have to be selectionned by the user in the UI
        #
        #for graph in namedGraphs:
        #    req += "FROM "+ "<"+graph+ ">"+"\n"
        req += "WHERE \n"
        req += self.build_recursive_block('', constraintes_relations)
        if limit != None and limit >0 :
            req +=" LIMIT "+str(limit)


        sqb = SparqlQueryBuilder(self.settings, self.session)
        prefixes = sqb.header_sparql_config(req)
        query = prefixes+req

        results = {}

        if send_request_to_TPS:
            ql = QueryLauncher(self.settings, self.session)
            results = ql.process_query(query)
        else:
            # add comment inside query to inform user
            query = "# endpoint = "+self.get_param("askomics.endpoint") + "\n" + query

        return results, query
