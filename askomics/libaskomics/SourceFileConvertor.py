from glob import glob
import logging
import os.path
import re

from askomics.libaskomics.integration.SourceFile import SourceFile
from askomics.libaskomics.integration.AbstractedEntity import AbstractedEntity
from askomics.libaskomics.integration.AbstractedRelation import AbstractedRelation
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.source_file.SourceFile import SourceFile

class SourceFileConvertor(ParamManager):
    """
    A SourceFileConvertor instance provides methods to:
        - display an overview of the tabulated files the user want to convert in AskOmics.
        - convert the tabulated files in turtle files, taking care of:
            * the format of the data already in the database
              (detection of new and missing headers in the user files).
            * the abstraction generation corresponding to the header of the user files.
            * the generation of the part of the domain code that wan be automatically generated.
    """

    def __init__(self, settings, session, type_dict=None, delims=None):
        #FIXME: Can we get dict()s from config ?
        self.type_dict = {
            'Numeric' : 'xsd:decimal',
            'Text'    : 'xsd:string',
            'Category': ':',
            'Entity'  : ':'} if type_dict is None else type_dict

        self.delims = {
            'Numeric' : ('', ''),
            'Text'    : ('"', '"'),
            'Category': (':', ''),
            'Entity'  : (':', '')} if delims is None else delims

        ParamManager.__init__(self, settings, session)
        self.log = logging.getLogger(__name__)

    def get_template(self, template_file):
        """
        Read a template file and return its content.

        :param template_file: path of the template file
        :return: template_file content
        :rtype: string
        """
        with open(template_file) as template:
            return template.readlines()

    def get_source_files(self, limit):
        """
        :return: List of the file to convert paths
        :rtype: List
        """
        src_dir = self.get_source_file_directory()
        paths = glob(src_dir + '/*')

        files = []
        for p in paths:
            files.append(SourceFile(p, limit))

        return files

    # FIXME: attribute_has_header_domain_list_output not used.
    def get_turtle(self, file_name, col_types, limit,
                   start_position_list, attribute_list_output, attribute_has_header_domain_list_output, request_output_domain, request_abstraction_output):
        """
        :param file_name: the name of a tabulated file
        :param col_types: a dict with the column number as key and the type of this column content as value
        :param limit: a boolean to set or not a limit of lines to convert
        :return: the result of the comparison of the format of the new data with the data already in the database and some turtle code:
            - missing_headers a list of the attributes or neighbor entity of an entity present in the database but missing in the tabulated file headers
            - new_headers a list of the attributes or neighbor entity of an entity present in the tabulated file headers but missing in the database
            - present_headers a list of the attributes or neighbor entities of an entity present in both the database and the tabulated file headers
            - attribute_code the abstraction turtle code defining the attributes of the reference entity contained in the 1st column
            - relation_code the abstraction turtle code defining the neighbor entities of the reference entity contained in the 1st column
            - domain_code the domain turtle code defining allowing to represent as attributes the entities described as Categories
        """
        if limit:
            max_lines = int(self.get_param("askomics.overview_lines_limit"))
        else:
            max_lines = 0

        col_types = {int(k):v for k,v in col_types.items()}
        category_domain_code_dict = {} # Header -> Categories domain
        relation_code_dict = {} # Header -> EntityLabel -> Cells
        attribute_code = ""
        relation_code = []
        domain_code = []
        attributes_setting_list = []
        indent = ""

        with open(self.get_user_data_file(file_name), 'r') as src:

            headers = {}

            line = src.readline()

            # ================= HEADER treatment ===============
            # headers[col_cpt]  => column name (markeur, chromosome, qtl, etc...)
            # col_types[col_cpt] => column type (Entity, Category, Text, etc...)
            headers = line.split()
            for col_cpt, cell in enumerate(headers):
                cell = cell.rstrip('\r\n')
                if col_cpt in col_types.keys():
                    # startpositions handling
                    if col_types[col_cpt] == "Entity (Start)":
                        if max_lines == 0:
                            start_position_list.append(":" + cell + ' displaySetting:startPoint "true"^^xsd:boolean .\n')
                        col_types[col_cpt] = "Entity"
                    # Column is an attribute, add it to namespace "displaysetting:attribute"
                    if col_types[col_cpt] != "Entity": ##### VOIR POUR CATEGORY OFI.....
                        attributes_setting_list.append(":" + cell + ' displaySetting:attribute "true"^^xsd:boolean .\n')


            cpt = 1
            # ================= Input handling ===============
            for line in src:
                cells = line.split()
                entityLabel = cells[0]
                if len(cells) <= 0:
                    continue
                attribute_code += ":" + entityLabel + " rdf:type :" + headers[0] + " ;\n"
                attribute_code += (len(entityLabel) + 1) * " " + " rdfs:label \"" + entityLabel + "\" ;\n"
                for i, (header, cell) in enumerate(zip(headers, cells)):
                    if i != 0 and i in col_types:
                        col_type = col_types[i]
                        cell = cell.rstrip('\r\n')
                        if col_type == "Category":
                            category_domain_code_dict.setdefault(header, set()).add(cell)
                        if col_type == "Entity":
                            relation_code_dict.setdefault(header, {}).setdefault(entityLabel, []).append(cell)
                        else:
                            # Associate entity with a value and the relation has_ (example transcriptX has_taxon Brassica_napus)
                            attribute_code += (len(entityLabel) + 1) * " " + " :has_" + header + " " \
                                              + self.delims[col_type][0] + cell + self.delims[col_type][1] + " ;\n"
                attribute_code = attribute_code[:-2] + ".\n"
                cpt += 1
                if cpt == max_lines:
                    break
                if max_lines == 0:
                    attribute_list_output.append(attribute_code)
                    attribute_code = ""

        for header, ref_entity2target_entities in relation_code_dict.items():
            curr_relation_code = ""
            ref_entity_has_code = []
            for ref_entity, target_entities in ref_entity2target_entities.items():
                curr_entity_code = ""
                first_line = True
                for target_entity in target_entities:
                    if first_line:
                        indent = len(ref_entity) * " " + len("has_" + header) * " " + 4 * " "
                        curr_entity_code += ":" + ref_entity + " :has_" + header + " :" + target_entity + " ,\n"
                        first_line = False
                    else:
                        curr_entity_code += indent + ":" + target_entity + " ,\n"
                curr_entity_code = curr_entity_code[:-2] + ".\n"
                if max_lines == 0:
                    ref_entity_has_code.append(curr_entity_code)
                curr_relation_code += curr_entity_code
            #FIXME: Attribute_has_header_domain_list_output is the main output of this function.
            # It contains the has_ relations for all the entities column.
            # --> This is mad: it's an argument mutated by reference !
            # "relation_code" is properly accumulated from the start, but is only used for the (broken) preview
            attribute_has_header_domain_list_output[header] = ref_entity_has_code
            relation_code.append(curr_relation_code)

        # Category type handling
        #----------------------------
        for header, categories in category_domain_code_dict.items():
            curr_category_code = ":" + header + " displaySetting:has_category :"
            indent = len(header) * " " + len("displaySetting:has_category") * " " + 3 * " "
            curr_category_code += (" , \n" + indent + ":").join(categories) + " .\n"
            domain_code.append(curr_category_code)
            for item in categories:
                domain_code.append(":" + item + " rdf:type :" + header + " ;\n" + len(item) * " " + "  rdfs:label \"" + item + "\" .\n")
        attributes_setting_list.extend(domain_code)

        if max_lines == 0:
            for code in attributes_setting_list:
                request_output_domain.append(code)

            self.generate_abstraction(file_name, headers, col_types, request_abstraction_output)

            return [], [], [], "Attribute file written\n", "Relation file(s) written\n", "Domain file(s) written"
        else:
            missing_headers, new_headers, present_headers = self.compare_file_to_database(headers)
            return missing_headers, new_headers, present_headers, attribute_code + "\n\n", "\n\n".join(relation_code), "\n\n".join(attributes_setting_list)

    def compare_file_to_database(self, headers):
        """ Ask the database to compare the headers of a file to convert to the corresponding class in the database """
        curr_entity = headers[0]
        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)
        sparql_template = self.get_template_sparql(self.ASKOMICS_get_class_info_from_abstraction_queryFile)
        query = sqb.load_from_file(sparql_template, {"#nodeClass#": curr_entity}).query

        results = ql.process_query(query)
        if results == []:
            return [], headers, []
        bdd_relations, new_headers, missing_headers, present_headers = [], [], [], []
        for result in results:
            bdd_relation = result["relation"].replace(self.get_param("askomics.prefix"), "").replace("has_", "")
            bdd_relations.append(bdd_relation)
            if bdd_relation not in headers:
                self.log.warning('Relation "%s" not found in tables columns: %s.', bdd_relation, repr(headers))
                missing_headers.append(bdd_relation)
        for header in headers:
            if header != curr_entity:
                if header not in bdd_relations:
                    self.log.info('Adding column "%s".', header)
                    new_headers.append(header)
                elif header not in missing_headers:
                    present_headers.append(header)
        return missing_headers, new_headers, present_headers

    # FIXME file_name is not used
    def generate_abstraction(self, file_name, headers, col_types, abstraction_output_request):
        """ write the abstraction file according to the headers of the files to convert """

        ref_entity = headers[0]
        assert all(type(key) is int for key in col_types)
        abstraction_output_request.append(AbstractedEntity(ref_entity).get_turtle())
        abstraction_output_request.extend(
            AbstractedRelation(key_type, headers[key], ref_entity, self.type_dict[key_type]).get_turtle()
            for key, key_type in col_types.items()
            if key != 0)
