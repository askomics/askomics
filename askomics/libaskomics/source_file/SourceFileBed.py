"""
Classe to import data from a bed source file
"""

import datetime
from pybedtools import BedTool

from askomics.libaskomics.source_file.SourceFile import SourceFile
# from askomics.libaskomics.utils import rreplace

class SourceFileBed(SourceFile):
    """
    Class representing a BED Source file
    """

    def __init__(self, settings, session, path, uri_set=None):

        SourceFile.__init__(self, settings, session, path, uri_set=uri_set)

        self.type = 'bed'

        self.abstraction_dict = {}

        self.domain_knowledge_dict = {}

        self.pos_attr_list = [
            'position_taxon', 'position_ref', 'position_start', 'position_end',
            'position_strand'
        ]

        self.categories_list = ['position_taxon', 'position_ref', 'position_strand']

        self.taxon = ''

        self.timestamp = datetime.datetime.now().isoformat()

        self.get_label_from_uri = {}

        self.entity = ''

    def set_taxon(self, taxon):
        """Set the taxon"""

        self.taxon = taxon

    def set_entity_name(self, entity):
        """set the entity name"""

        self.entity = entity


    def open_bed(self):
        """Try to parse the file"""

        try:
            BedTool(self.path)
        except Exception as e:
            raise e


    def get_turtle(self):
        """Get turtle content for a bed file

        :yield: the ttl string
        :rtype: string
        """

        taxon_entity = ':unknown'
        if self.taxon != '':
            taxon_entity = self.encode_to_rdf_uri(self.taxon.strip(),prefix=':')

        self.get_label_from_uri[taxon_entity] = self.taxon.strip()
        self.get_label_from_uri[':plus'] = 'plus'
        self.get_label_from_uri[':minus'] = 'minus'
        self.get_label_from_uri[':none'] = ''

        blockbase = 10000

        # Read the bed file
        try:
            bedfile = BedTool(self.path)
        except Exception as e:
            self.log.error(str(e))
            raise e

        count = 0

        for feature in bedfile:

            # Type
            type_entity = 'element'
            if self.entity != '':
                type_entity = self.entity

            # Name
            if feature.name != '.':
                name_entity = feature.name
            else:
                name_entity = type_entity + '_' + str(count)
            count += 1

            type_entity = self.encode_to_rdf_uri(type_entity)

            # Reference
            ref_entity = self.encode_to_rdf_uri(str(feature.chrom))
            if ref_entity not in self.get_label_from_uri:
                self.get_label_from_uri[ref_entity] = str(feature.chrom)

            # Start & end
            start_entity = int(feature.start) +1 #+1 because bed is 0 based
            end_entity = int(feature.end)

            # Strand
            faldo_strand = ''
            if feature.strand == '+':
                strand_entity = ':plus'
                faldo_strand = "faldo:ForwardStrandPosition"
            elif feature.strand == '-':
                strand_entity = ':minus'
                faldo_strand = "faldo:ReverseStrandPosition"
            else:
                strand_entity = ':none'
                faldo_strand = "faldo:BothStrandPosition"

            # Score
            score_entity = None
            if feature.score != '.':
                score_entity = feature.score

            # Block
            block_idxstart = start_entity // blockbase
            block_idxend = end_entity // blockbase

            # Write turtle string
            indent = len(self.uri[0]) * ' ' + '   '
            ttl = self.encode_to_rdf_uri(name_entity) + ' rdf:type ' + type_entity + ' ;\n'
            ttl += indent + 'rdfs:label "' + name_entity + '"^^xsd:string ;\n'
            ttl += indent + 'askomics:position_taxon ' + taxon_entity + ' ;\n'
            ttl += indent + 'askomics:position_strand ' + strand_entity + ' ;\n'
            ttl += indent + 'askomics:position_ref ' + ref_entity + ' ;\n'

            if score_entity is not None:
                ttl += indent + ':score ' + score_entity + ' ;\n'

            ttl += indent + 'askomics:blockstart ' + str(block_idxstart * blockbase) + ' ;\n'
            ttl += indent + 'askomics:blockend ' + str(block_idxend * blockbase) + ' ;\n'
            for sliceb in range(block_idxstart, block_idxend + 1):
                ttl += indent + 'askomics:IsIncludeInRef ' + ref_entity + '_' + str(sliceb) + ' ;\n'
                ttl += indent + 'askomics:IsIncludeIn ' + str(sliceb)+ ' ;\n'

            ttl += indent + " faldo:location [ a faldo:Region ;\n" + \
                   indent + "                  faldo:begin [ a faldo:ExactPosition;\n" + \
                   indent + "                                a " + faldo_strand + ";\n" + \
                   indent + "                                faldo:position " + str(start_entity) + ";\n" + \
                   indent + "                                faldo:reference " + ref_entity + " ];\n" + \
                   indent + "                  faldo:end [ a faldo:ExactPosition;\n" + \
                   indent + "                              a " + faldo_strand + ";\n" + \
                   indent + "                              faldo:position " + str(end_entity) + ";\n" + \
                   indent + "                              faldo:reference " + ref_entity + " ]] .\n"


            # Abstraction
            if type_entity not in self.abstraction_dict.keys():
                self.abstraction_dict[type_entity] = {'pos_attr': self.pos_attr_list, 'normal_attr' : []}

            if score_entity is not None:
                if 'score' not in self.abstraction_dict[type_entity]['normal_attr']:
                    self.abstraction_dict[type_entity]['normal_attr'].append('score')

            # Domain knowledge ---------------------------------------------------------------
            if type_entity not in self.domain_knowledge_dict.keys():
                self.domain_knowledge_dict[type_entity] = {'category' : {}}

            if self.domain_knowledge_dict[type_entity]['category'] == {}:
                for category in self.categories_list:
                    self.domain_knowledge_dict[type_entity]['category'][category] = []

            # Strand
            if strand_entity not in self.domain_knowledge_dict[type_entity]['category']['position_strand']:
                self.domain_knowledge_dict[type_entity]['category']['position_strand'].append(strand_entity)
            # taxon
            if taxon_entity not in self.domain_knowledge_dict[type_entity]['category']['position_taxon']:
                self.domain_knowledge_dict[type_entity]['category']['position_taxon'].append(taxon_entity)
            # ref
            if ref_entity not in self.domain_knowledge_dict[type_entity]['category']['position_ref']:
                self.domain_knowledge_dict[type_entity]['category']['position_ref'].append(ref_entity)

            yield ttl


    def get_abstraction(self):
        """Get abstraction of a bed file

        :returns: abstraction in turtle
        :rtype: string
        """

        order_dict = {
            'Name': '2',
            'position_ref': '3',
            'position_start': '4',
            'position_end': '5',
            'position_strand': '6',
            'position_taxon': '7',
            'score': '8'
        }

        ttl =  '#################\n'
        ttl += '#  Abstraction  #\n'
        ttl += '#################\n\n'
        ttl += '\n'
        ttl += 'rdfs:label rdf:type owl:DatatypeProperty .\n'
        ttl += 'rdfs:label askomics:attribute "true"^^xsd:boolean .\n'
        ttl += 'rdfs:label askomics:attributeOrder "1"^^xsd:decimal .\n'
        ttl += 'rdfs:label rdfs:label "label" .\n'
        ttl += 'rdfs:label rdfs:range xsd:string .\n'
        ttl += '\n'

        for entity, attribute_dict in self.abstraction_dict.items():
            ttl += entity + ' ' + 'rdf:type owl:Class ;\n'
            indent = len(entity) * ' ' + ' '
            ttl += indent + 'rdfs:label \"' + self.decode_to_rdf_uri(entity) + "\"^^xsd:string ;\n"
            ttl += indent + 'askomics:startPoint \"true\"^^xsd:boolean ;\n\n'
            ttl += indent + 'askomics:entity \"true\"^^xsd:boolean .\n\n'

            ttl += '\n'
            ttl += indent + 'rdfs:label rdfs:domain '+entity+' .\n'
            ttl += '\n'
            
            for type_attr, attr_list in attribute_dict.items():
                if type_attr == 'pos_attr': # positionable attributes
                    for pos_attr in attr_list:
                        if pos_attr in ('position_start', 'position_end'):
                            ttl += self.encode_to_rdf_uri("askomics:"+pos_attr) + ' askomics:attribute \"true\"^^xsd:boolean ;\n'
                            indent = len(pos_attr) * ' ' + '  '
                            ttl += indent + 'rdf:type owl:DatatypeProperty ;\n'
                            ttl += indent + 'rdfs:label \"' + pos_attr.replace('position_', '') + '\"^^xsd:string ;\n'
                            ttl += indent + 'rdfs:domain ' + entity + ' ;\n'
                            ttl += indent + 'rdfs:range xsd:decimal .\n\n'
                            ttl += self.encode_to_rdf_uri("askomics:"+pos_attr) + ' askomics:attributeOrder "' + order_dict[pos_attr] + '"^^xsd:decimal .\n'
                        else:
                            # No taxon, don't write triple and continue loop
                            if pos_attr == 'position_taxon' and self.taxon == '':
                                continue
                            ttl += self.encode_to_rdf_uri("askomics:"+pos_attr) + ' askomics:attribute \"true\"^^xsd:boolean ;\n'
                            indent = len(pos_attr) * ' ' + '  '
                            ttl += indent + 'rdf:type owl:ObjectProperty ;\n'
                            ttl += indent + 'rdfs:label \"' + pos_attr.replace('position_', '') + '\"^^xsd:string ;\n'
                            ttl += indent + 'rdfs:domain ' + entity + ' ;\n'
                            ttl += indent + 'rdfs:range ' + "askomics:"+pos_attr.replace('position_', '') + "Category .\n\n"
                            ttl += self.encode_to_rdf_uri("askomics:"+pos_attr) + ' askomics:attributeOrder "' + order_dict[pos_attr] + '"^^xsd:decimal .\n'
                else: # other attributes
                    for attr in attr_list:
                        if isinstance(attr, dict): # Parent relation
                            for key, value in attr.items():
                                ttl += key + ' rdf:type owl:ObjectProperty ;\n'
                                indent = len(key) * ' ' + '  '
                                ttl += indent + 'rdfs:label \"' + key + '\"^^xsd:string ;\n'
                                ttl += indent + 'rdfs:domain ' + entity + " ;\n"
                                ttl += indent + 'rdfs:range ' + value + ' .\n\n'
                        else: # normal attributes
                            ttl += attr + ' askomics:attribute \"true\"^^xsd:boolean ;\n'
                            indent = len(attr) * ' ' + '  '
                            ttl += indent + 'rdf:type owl:DatatypeProperty ;\n'
                            ttl += indent + 'rdfs:label \"' + attr + '\"^^xsd:string ;\n'
                            ttl += indent + 'rdfs:domain ' + entity + " ;\n"
                            if attr in ('score', ):
                                ttl += indent + 'rdfs:range xsd:decimal .\n\n'
                            else:
                                ttl += indent + 'rdfs:range xsd:string .\n\n'
                            if attr == 'Name':
                                ttl += attr + ' askomics:attributeOrder "' + order_dict[attr] + '"^^xsd:decimal .\n'
                            if attr == 'score':
                                ttl += attr + ' askomics:attributeOrder "' + order_dict[attr] + '"^^xsd:decimal .\n'
        return ttl

    def get_domain_knowledge(self):
        """Get domain knowledge of a bed file

        :returns: domain knowledge in turtle
        :rtype: string
        """

        ttl =  '######################\n'
        ttl += '#  Domain knowledge  #\n'
        ttl += '######################\n\n'

        for entity, dk_dict in self.domain_knowledge_dict.items():
            # Positionable entity
            ttl += entity + ' askomics:is_positionable \"true\"^^xsd:boolean .\n'
            ttl += 'askomics:is_positionable rdfs:label \'is_positionable\'^^xsd:string .\n'
            ttl += 'askomics:is_positionable rdf:type owl:ObjectProperty .\n\n'

            for category_dict in dk_dict.values():
                for category, cat_list in category_dict.items():
                    # dont write triple for taxon if user don't enter one
                    if category == 'position_taxon' and self.taxon == '':
                        continue
                    for cat in cat_list:
                        if self.get_label_from_uri[cat] == '':
                            continue
                        ttl += 'askomics:'+str(category.replace('position_', '')) + 'Category askomics:category ' + str(cat) + ' .\n'
                        ttl += str(cat) + ' rdf:type ' + 'askomics:'+str(category.replace('position_', '')) + ' ;\n'
                        indent = len(str(cat)) * ' ' + ' '
                        ttl += indent + 'rdfs:label \"' + self.get_label_from_uri[cat] + '\"^^xsd:string .\n'

            ttl += '\n'

        return ttl
