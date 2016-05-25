#! /usr/bin/env python3
# -*- coding: utf-8 -*-

from glob import glob
import os.path
import re

from askomics.libaskomics.integration.SourceFile import SourceFile
from askomics.libaskomics.integration.AbstractedEntity import AbstractedEntity
from askomics.libaskomics.integration.AbstractedRelation import AbstractedRelation
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.ParamManager import ParamManager

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

    def __init__(self, settings, session):
        ParamManager.__init__(self, settings, session)

    def get_template(self, template_file):
        """
        Read a template file and return its content.

        :param template_file: path of the template file
        :return: template_file content
        :rtype: string
        """
        with open(template_file) as template:
            return template.readlines()

    def get_source_files_list(self):
        """
        :return: List of the file to convert paths
        :rtype: List
        """
        source_files_dir = self.get_source_file_directory()
        source_files_list = glob(source_files_dir + '/*')
        return source_files_list

    def get_first_lines(self, limit):
        """
        Read and return the first lines of a list of files.

        :param limit: the number of lines to read.
        :return: for each file, return its name and the content of its limit first lines
        :rtype: List
        """
        source_files_list = self.get_source_files_list()
        source_files = []

        for curr_file in source_files_list:
            #ignore directory
            if os.path.isdir(curr_file):
                continue
            #ignore file type
            match = re.search(".type$", curr_file)
            if match:
                continue

            val_cell_type = {}
            with open(curr_file, 'r') as src:
                cpt = 0
                content = []
                for line in src:
                    if cpt == 1:
                        cell_types = []
                        col_cpt = 0
                        for cell in line.rstrip('\r\n').split():
                            if col_cpt == 0:
                                curr_cell_type = "Entity"
                            elif cell.isdigit() or is_float(cell):
                                curr_cell_type = "Numeric"
                            else:
                                curr_cell_type = "Text"
                                #OFI : We try to guess if the present colonne is a 'Category'
                                val_cell_type[col_cpt] = []
                                val_cell_type[col_cpt].append(cell)

                            cell_types.append(">" + curr_cell_type)
                            col_cpt += 1
                        content.append(cell_types)
                    content.append(line.rstrip('\r\n').split())
                    if cpt > 1:
                        col_cpt = 0
                        for cell in line.rstrip('\r\n').split():
                            if col_cpt in val_cell_type:
                                val_cell_type[col_cpt].append(cell)
                            col_cpt += 1
                    cpt += 1
                    if cpt == int(limit):
                        break


                for col_cpt in val_cell_type.keys():
                    dic_category = {}
                    for value in val_cell_type[col_cpt]:
                        if value in dic_category:
                            dic_category[value] += 1
                        else:
                            dic_category[value] = 1
                    if len(dic_category) < cpt/2:
                        content[1][col_cpt] = ">Category"

                source_files.append(SourceFile(curr_file.split('/')[-1], content))

        return source_files

    def get_turtle(self, file_name, col_types, limit, start_position_list, attribute_list_output, attribute_has_header_domain_list_output, request_output_domain, request_abstraction_output):
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

        delims = {"Numeric": ('', ''), "Text": ('"', '"'), "Category": (":", ""), "Entity": (":", "")}
        col_types = key_to_int(col_types)
        category_domain_code_dict = {}
        relation_code_dict = {}
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
            cells = line.split()
            for col_cpt in range(0, len(cells)):
                if col_cpt in col_types.keys():
                    headers[col_cpt] = cells[col_cpt].rstrip('\r\n')
                    # startpositions handling
                    if col_types[col_cpt] == "Entity (Start)":
                        if max_lines == 0:
                            start_position_list.append(":" + cells[col_cpt].rstrip('\r\n') + ' displaySetting:startPoint "true"^^xsd:boolean .\n')
                        col_types[col_cpt] = "Entity"
                    # Column is an attribute, add it to namespace "displaysetting:attribute"
                    if col_types[col_cpt] != "Entity": ##### VOIR POUR CATEGORY OFI.....
                        attributes_setting_list.append(":" + cells[col_cpt].rstrip('\r\n') + ' displaySetting:attribute "true"^^xsd:boolean .\n')


            cpt = 1
            # ================= Input handling ===============
            for line in src:
                cells = line.split()
                if len(cells) <= 0:
                    continue
                attribute_code += ":" + cells[0] + " rdf:type :" + headers[0] + " ;\n"
                attribute_code += (len(cells[0]) + 1) * " " + " rdfs:label \"" + cells[0] + "\" ;\n"
                for i in range(1, len(cells)):
                    if i in col_types.keys():
                        if col_types[i] == "Category":
                            category_domain_code_dict.setdefault(headers[i], []).append(cells[i].rstrip('\r\n'))
                        if col_types[i] == "Entity":
                            if headers[i] not in relation_code_dict.keys():
                                relation_code_dict[headers[i]] = {}
                            relation_code_dict[headers[i]].setdefault(cells[0], []).append(cells[i].rstrip('\r\n'))
                        else:
                            # Associate entity with a value and the relation has_ (example transcriptX has_taxon Brassica_napus)
                            attribute_code += (len(cells[0]) + 1) * " " + " :has_" + headers[i] + " " + delims[col_types[i]][0] + cells[i].rstrip('\r\n') + delims[col_types[i]][1] + " ;\n"
                attribute_code = attribute_code[:-2] + ".\n"
                cpt += 1
                if cpt == max_lines:
                    break
                if max_lines == 0:
                    attribute_list_output.append(attribute_code)
                    attribute_code = ""

        for header in category_domain_code_dict.keys():
            category_domain_code_dict[header] = list(set(category_domain_code_dict[header]))

        for header in relation_code_dict.keys():
            curr_relation_code = ""
            attribute_has_header_domain_list_output[header] = []
            # Removing @ from the heasder for relation
            idx = header.find("@");
            headername = header
            if idx != -1:
                headername = header[0:idx]

            for ref_entity in relation_code_dict[header].keys():
                curr_entity_code = ""
                first_line = True
                for target_entity in relation_code_dict[header][ref_entity]:
                    if first_line:
                        # MODIF OFI ==> RELATION est le nom de l'entete avec suppression du @
                        indent = len(ref_entity) * " " + len(headername) * " " + 4 * " "
                        curr_entity_code += ":" + ref_entity + " :" + headername + " :" + target_entity + " ,\n"
                        first_line = False
                    else:
                        curr_entity_code += indent + ":" + target_entity + " ,\n"
                curr_entity_code = curr_entity_code[:-2] + ".\n"
                #print("========================"+curr_entity_code)

                if max_lines == 0:
                    attribute_has_header_domain_list_output[header].append(curr_entity_code)

                curr_relation_code += curr_entity_code
            relation_code.append(curr_relation_code)

        # Category type handling
        #----------------------------
        for header in category_domain_code_dict.keys():
            curr_category_code = ":" + header + " displaySetting:has_category :"
            indent = len(header) * " " + len("displaySetting:has_category") * " " + 3 * " "
            curr_category_code += (" , \n" + indent + ":").join(category_domain_code_dict[header]) + " .\n"
            domain_code.append(curr_category_code)
            for item in category_domain_code_dict[header]:
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
            return [], [header for header in headers.values()], []
        bdd_relations, new_headers, missing_headers, present_headers = [], [], [], []
        for result in results:
            bdd_relations.append(result["relation"].replace(self.get_param("askomics.prefix"), "").replace("has_", ""))
        for bdd_relation in bdd_relations:
            if bdd_relation not in headers.values():
                missing_headers.append(bdd_relation)
        for header in headers.values():
            if header not in bdd_relations and header != curr_entity:
                new_headers.append(header)
            elif header not in missing_headers and header != curr_entity:
                present_headers.append(header)
        return missing_headers, new_headers, present_headers

    # FIXME file_name is not used
    def generate_abstraction(self, file_name, headers, col_types, abstraction_output_request):
        """ write the abstraction file according to the headers of the files to convert """

        type_dict = {"Numeric": "xsd:decimal", "Text": "xsd:string", "Category": ":", "Entity": ":"}
        abstacted_entities, abstracted_relations = [], []
        for key in headers.keys():
            key_type = col_types[key]
            if key == 0:
                ref_entity = headers[key]
                abstacted_entities.append(AbstractedEntity(ref_entity))
            else:
                abstracted_relations.append(AbstractedRelation(key_type, headers[key], ref_entity, type_dict[key_type]))

        for entity in abstacted_entities:
            abstraction_output_request.append(entity.get_turtle())

        for relation in abstracted_relations:
            abstraction_output_request.append(relation.get_turtle())


# TODO move these to some place more appropriate
def key_to_int(dic):
    new_dic = {}
    for key in dic.keys():
        new_dic[int(key)] = dic[key]
    return new_dic

def is_float(value):
  try:
    float(value)
    return True
  except ValueError:
    return False
