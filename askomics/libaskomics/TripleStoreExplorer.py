#! /usr/bin/env python3
# -*- coding: utf-8 -*-
import logging

from askomics.libaskomics.ParamManager import ParamManager

from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
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

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)
        sparql_template = self.get_template_sparql(self.ASKOMICS_initial_query)
        query = sqb.load_from_file(sparql_template, {}).query
        results = ql.process_query(query)

        for result in results:
            uri = result["nodeUri"]
            label = result["nodeLabel"]
            nodes.append({ 'uri': uri, 'label': label })

        return nodes

    def getUserAbstraction(self):
        """
        Get the user abstraction (relation and entity as subject and object)

        :return:
        :rtype:
        """
        data = {}
        listEntities = {}

        self.log.debug(" =========== TripleStoreExplorer:getUserAbstraction ===========")

        nodes_startpoint = self.get_start_points()
        # add start node at first
        for node in nodes_startpoint:
            listEntities[node['uri']]=0

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)

        sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionRelationUser)
        query = sqb.load_from_file(sparql_template, { 'OwlProperty' : 'owl:ObjectProperty'}).query
        results = ql.process_query(query)

        data['relations'] = results

        for elt in results:
            if not elt['object'] in listEntities:
                listEntities[elt['object']]=0
            if not elt['subject'] in listEntities:
                listEntities[elt['subject']]=0

        #sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionRelationUser)
        #query = sqb.load_from_file(sparql_template, { 'OwlProperty' : 'owl:SymmetricProperty'}).query
        #results = ql.process_query(query)

        #data['relationsSym'] = results

        #for elt in results:
        #    if not elt['object'] in listEntities:
        #        listEntities[elt['object']]=0
        #    if not elt['subject'] in listEntities:
        #        listEntities[elt['subject']]=0

        filterEntities = ' '.join(["<"+s+">" for s in listEntities.keys()])
        sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionEntityUser)
        query = sqb.load_from_file(sparql_template, {"entities" : filterEntities }).query
        results = ql.process_query(query)

        data['entities'] = results

        sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionAttributesEntityUser)
        query = sqb.load_from_file(sparql_template, {"entities" : filterEntities }).query
        results = ql.process_query(query)

        data['attributes'] = results

        sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionCategoriesEntityUser)
        query = sqb.load_from_file(sparql_template, {"entities" : filterEntities }).query
        results = ql.process_query(query)

        data['categories'] = results

        sparql_template = self.get_template_sparql(self.ASKOMICS_abstractionPositionableEntityUser)
        query = sqb.load_from_file(sparql_template, {}).query
        results = ql.process_query(query)

        data['positionable'] = results


        return data
    # build SPARQL Block following this grammar :
    # B ==> [ A , KEYWORKD ] . KEYWORKD is a string prefix for BLOCK (ex: OPTIONAL, SERVICE)
    # A ==> [ ((B|F),)+ ] . a list of Block or constraints leafs
    # F ==> [ CONSTRAINT1, CONSTRAINT2,.... ] an array contains only constraints
    def buildRecursiveBlock(self,tabul,constraints):
        if len(constraints) == 2 and isinstance(constraints[0], list) and isinstance(constraints[1], str):
            return tabul+constraints[1] + "{\n"+ self.buildRecursiveBlock(tabul+'\t',constraints[0])+"\n"+tabul+"}\n"
        else:
            req = "";
            for elt in constraints:
                if isinstance(elt, str):
                    req+=tabul+elt+".\n"
                elif len(elt) == 2 and isinstance(elt[0], list) and isinstance(elt[1], str):
                    req+= tabul+elt[1] + "{\n"+ self.buildRecursiveBlock(tabul+'\t',elt[0])+"\n"+tabul+"}\n"

                else:
                    raise ValueError("buildRecursiveBlock:: constraint malformed :"+str(elt))
            return req
        return ""

    def build_sparql_query_from_json(self,variates,constraintesRelations,limit,sendRequestToTPS):
        self.log.debug("variates")
        self.log.debug(variates)
        self.log.debug("constraintesRelations")
        self.log.debug(constraintesRelations)

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)
        res = ql.execute_query(sqb.get_list_named_graphs().query)

        namedGraphs = []

        for indexResult in range(len(res['results']['bindings'])):
            namedGraphs.append(res['results']['bindings'][indexResult]['g']['value'])

        req = ""
        req += "SELECT DISTINCT "+' '.join(variates)+"\n"
        for graph in namedGraphs:
            req += "FROM "+ "<"+graph+ ">"+"\n"
        req += "WHERE \n"
        req += self.buildRecursiveBlock('',constraintesRelations)
        if limit != None and limit >0 :
            req +=" LIMIT "+str(limit)


        sqb = SparqlQueryBuilder(self.settings, self.session)
        prefixes = sqb.header_sparql_config()
        query = prefixes+req

        results = {}

        if sendRequestToTPS:
            ql = QueryLauncher(self.settings, self.session)
            results = ql.process_query(query)
        else:
            # add comment inside query to inform user
            query = "# endpoint = "+self.get_param("askomics.endpoint") + "\n" + query

        return results,query
