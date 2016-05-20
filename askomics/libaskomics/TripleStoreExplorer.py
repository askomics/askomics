#! /usr/bin/env python3
# -*- coding: utf-8 -*-
import logging

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.CounterManager import CounterManager

from askomics.libaskomics.graph.Node import Node
from askomics.libaskomics.graph.Link import Link
from askomics.libaskomics.graph.Attribute import Attribute

from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher


class TripleStoreExplorer(ParamManager, CounterManager):
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
        CounterManager.__init__(self, dico)

        self.log = logging.getLogger(__name__)

    def has_setting(self, uri, setting):
        """
        Look for a specific setting (see displaySetting in your domain knowledge) for a node class.

        :param uri: Name of the node
        :param setting: Name of your setting
        :type uri: str
        :type setting: str
        :return: List of results found for a setting
        :rtype: dict

        """
        self.log.debug(" =========== TripleStoreExplorer:has_setting =========== [ uri:"+ uri + ", setting:"+ setting+"]")
        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)
        sparql_template = self.get_template_sparql(self.ASKOMICS_setting_query_file)
        query = sqb.load_from_file(sparql_template, {"nodeClass": uri, "setting": setting}).query
        results = ql.process_query(query)

        return [res[setting] for res in results]

    def has_category(self, entity, category, uri_category):
        """
        Get different categories for a node class.

        :param entity : Name of the entity associated with the node
        :param uri: Name of the node
        :type uri: str
        :return: List of categories
        :rtype: list

        """
        self.log.debug(" =========== TripleStoreExplorer:has_category ===========[ entity:"+ entity + ", category:"+ category+"]")
        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)
        sparql_template = self.get_template_sparql(self.ASKOMICS_has_category_query_file)
        query = sqb.load_from_file(sparql_template, {"nodeClass": uri_category, "category" : category, "entity" : entity}).query
        results = ql.process_query(query)

        return [res["label"] for res in results]

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
            node_id = label + str(self.get_new_id(label))
            shortcuts_list = self.has_setting(uri, 'shortcut')
            nodes.append(Node(node_id, uri, label, shortcuts_list))

        return nodes

    def get_attributes_of(self, uri):
        """
        Get all attributes of a node class (identified by his uri). These
        attributes are known thanks to the domain knowledge of your RDF database.

        :param uri: Uri of the node class
        :type uri: str
        :return: All attributes of a node class
        :rtype: Attribute list
        """
        self.log.debug(" =========== TripleStoreExplorer:get_attributes_of ===========")
        attributes = []
        results = []

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)

        fragment = uri.rsplit('#', 1)[-1]
        parent = fragment + str(self.get_new_id(fragment))

        # Send a request to know all the neighbors of a node (from uri).
        sparql_template = self.get_template_sparql(self.ASKOMICS_neighbor_query_file)

        query = sqb.load_from_file(sparql_template, {
            "nodeClass": '<%s>' % uri,
            "neighborClass": "?nodeUri"
            }).query

        results = (ql.process_query(query))
        for result in results:
            neighbor_uri = result["relationUri"]
            if 'nodeLabel' in result:
                neighbor_label = result["nodeLabel"]
            else:
                neighbor_label = result["relationLabel"]

            neighbor_id = neighbor_label + str(self.get_new_id(neighbor_label))

            if self.has_setting(result["nodeUri"], 'attribute') or self.has_setting(neighbor_uri, 'attribute'):
                attributes.append(
                    Attribute(neighbor_id,
                        neighbor_uri,
                        result["nodeUri"],
                        neighbor_label,
                        parent)
                    )

        return attributes

    def get_neighbours_for_node(self, node, uri_new_instance):
        """
        Get all neighbors of a node in the RDF database. This function
        process the results from the database based on your domain knowledge
        (if there are attributes, hidden neighbor, neighbor with a relation
        which can be specified or normal neighbor).

        :param node: Source node
        :param uri_new_instance : uri of the new element asked ("None" value instanciate all elements)
        :return: A tuple (attribute, node, link) which contains in first position
                a list of all the attribute of our node class, follows by a list of all the nodes in
                relation with our source node and finally a list which contains all the
                links to those nodes.
        :rtype: (Attribute list, Node list, Link list)

        """
        results = {'direct':[], 'reverse':[]}
        nodes = []
        links = []
        attributes = []
        shortcuts_list = []

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)

        # Search for shortcuts if there are.
        if len(node.get_shortcuts()) > 0:
            sparql_template = self.get_template_sparql(self.ASKOMICS_neighbor_query_following_shortcuts_file)

            for shortcut in node.get_shortcuts():
                query = sqb.load_from_file(sparql_template, {"nodeClass": node.get_uri(), "shortcut": shortcut}).query
                results["direct"] = ql.process_query(query)

                for result in results["direct"]:
                    result["relationUri"] = shortcut
                    result["relationLabel"] = "has"

        # Send a request to know all the neighbors of a node (from and to node).
        sparql_template = self.get_template_sparql(self.ASKOMICS_neighbor_query_file)

        query = sqb.load_from_file(sparql_template, {
            "nodeClass": '<%s>' % node.get_uri(),
            "neighborClass": "?nodeUri"
            }).query

        reverse_query = sqb.load_from_file(sparql_template, {
            "nodeClass": "?nodeUri",
            "neighborClass": '<%s>' % node.get_uri()
            }).query

        results["direct"].extend(ql.process_query(query))
        results["reverse"] = ql.process_query(reverse_query)

        # remove identity relation (exemple Personne has_Personne) in the reverse otherwise there two proposition on the graph
        for r1 in results["direct"]:
            for r2 in results["reverse"]:
                if r1['nodeUri'] == r2['nodeUri'] and r1['relationUri'] == r2['relationUri']:
                    results["reverse"].remove(r2)

        self.print_stat()

        go_out_loop = False
        # Sort the results between attributes, nodes and links
        for direction in results:
            for result in results[direction]:
                neighbor_uri = result["nodeUri"]
                self.log.debug("URI===>"+neighbor_uri)

                # We just want to add a new possibility of instance for a previous node
                if uri_new_instance != None:
                    if uri_new_instance == neighbor_uri:
                        go_out_loop = True
                    else:
                        continue

                neighbor_label = result["nodeLabel"] if 'nodeLabel' in result else result["relationLabel"]

                if  not self.ASKOMICS_prefix["xsd"] in neighbor_uri:
                    if self.has_setting(neighbor_uri, 'hidden'):
                        continue

                shortcuts_list = self.has_setting(neighbor_uri, 'shortcut')

                spec = self.has_setting(result["relationUri"], 'specified_by')
                specified_by = spec[0] if spec else ""

                clause = self.has_setting(result["relationUri"], 'specialQuery')
                spec_clause = clause[0] if clause else ""
                #if uri_new_instance == None or uri_new_instance == neighbor_uri:
                att_h = self.has_setting(result["nodeUri"], 'attribute')
                rel_h = self.has_setting(result["relationUri"], 'attribute')

                if att_h or rel_h or (result["propertyType"] == self.ASKOMICS_prefix["owl"] + "DatatypeProperty"): # FIXME doesn't detect categories
                    self.log.debug("====>ATTRIB")
                    attribute_id = node.get_id() + '_' + neighbor_label + str(self.get_new_id(node.get_id() + '_' + neighbor_label))
                    attributes.append(
                        Attribute(attribute_id,
                            result["relationUri"],
                            result["nodeUri"],
                            neighbor_label,
                            node.get_id()
                            )
                        )
                else:
                    self.log.debug("====>NODE")
                    self.log.debug(neighbor_label)
                    neighbor_id = neighbor_label + str(self.get_new_id(neighbor_label))

                    # Add nodes and their links to node
                    nodes.append(
                        Node(neighbor_id,
                            neighbor_uri,
                            neighbor_label,
                            shortcuts_list))

                    if direction == "direct":
                        links.append(
                            Link(node.get_uri(),
                                node.get_id(),
                                neighbor_uri,
                                neighbor_id,
                                result["relationUri"],
                                result["relationLabel"],
                                specified_by,
                                spec_clause))
                    else:
                        links.append(
                            Link(neighbor_uri,
                                neighbor_id,
                                node.get_uri(),
                                node.get_id(),
                                result["relationUri"],
                                result["relationLabel"],
                                specified_by,
                                spec_clause))
                    if go_out_loop:
                        break

        return (attributes, nodes, links)
