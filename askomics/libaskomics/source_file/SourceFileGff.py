#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""
Classes to import data from a gff3 source files
"""


import re,os
import datetime
from BCBio.GFF import GFFExaminer
from BCBio import GFF

from askomics.libaskomics.source_file.SourceFile import SourceFile
from askomics.libaskomics.utils import rreplace

class SourceFileGff(SourceFile):
    """
    Class representing a Gff3 Source file
    """

    def __init__(self, settings, session, path, uri_set=None):

        SourceFile.__init__(self, settings, session, path, uri_set=uri_set)

        self.type = 'gff'

        self.abstraction_dict = {}

        self.domain_knowledge_dict = {}

        self.pos_attr_list = [
            'position_taxon', 'position_ref', 'position_start', 'position_end',
            'position_strand'
        ]

        self.categories_list = ['position_taxon', 'position_ref', 'position_strand']

        self.taxon = ''

        self.entities = []

        self.timestamp = datetime.datetime.now().isoformat()

        self.getLabelFromUri = {}

        if uri_set and len(uri_set)>0:
            self.prefix = self.uri[0]
        else:
            self.prefix=None

    def set_taxon(self, taxon):

        self.taxon = taxon

    def set_entities(self, entities):

        self.entities = entities


    def get_entities(self):
        """
        get all the entities present in a gff file

        :return: The list of all the entities
        :rtype: List
        """
        exam = GFFExaminer()
        handle = open(self.path, encoding="utf-8", errors="ignore")
        entities = []
        gff_type = exam.available_limits(handle)['gff_type']
        for ent in gff_type:
            entities.append(ent[0])

        handle.close()

        return entities


    def get_turtle(self):
        """
        Get turtle string for a gff file
        """

        self.log.debug(self.path)
        handle = open(self.path, encoding="utf-8", errors="ignore")

        # To suffix all biological element without ID and try to have unique ID
        suffixURI = os.path.splitext(os.path.basename(self.path))[0]

        limit = dict(gff_type=self.entities)

        regex = re.compile(r'.*:')
        ttl = ''
        #Keep type of each entities to be able to build abstraction for 'Parent' relation
        type_entities = {}
        icount = {}
        lEntities = {}
        toBuild = []

        taxon_entity = 'askomics:unknown'
        if self.taxon != '' :
            taxon_entity = self.encode_to_rdf_uri(self.taxon.strip(),'askomics:')

        self.getLabelFromUri[taxon_entity] = self.taxon.strip()
        self.getLabelFromUri['askomics:plus'] = 'plus'
        self.getLabelFromUri['askomics:minus'] = 'minus'
        self.getLabelFromUri['askomics:none'] = ''

        blockbase=10000

        for rec in GFF.parse(handle, limit_info=limit, target_lines=1):
            # Reference have to be common with other reference of other taxon => askomics:
            ref_entity =  self.encode_to_rdf_uri(str(rec.id),prefix='askomics:')
            if ref_entity not in self.getLabelFromUri:
                self.getLabelFromUri[ref_entity] = str(rec.id)

            for feat in rec.features:
                # if there is no ID field, take the entity type as id
                type_entity = self.encode_to_rdf_uri(feat.type,prefix=self.prefix)
                type_entity_label = feat.type
                if type_entity not in self.getLabelFromUri:
                    self.getLabelFromUri[type_entity] = str(feat.type)

                build_entity_id = False

                if feat.id != '':
                    id_entity = self.encode_to_rdf_uri(feat.id,prefix=self.prefix)
                    self.getLabelFromUri[id_entity] = str(feat.id)
                else:
                    if not type_entity in icount:
                        icount[type_entity] = 0
                    icount[type_entity] += 1

                    #self.log.warning("can not succed get ID feat :"+type_entity+"\n"+str(feat))
                    if self.taxon != '' :
                        id_entity = self.taxon.strip() + "_" + suffixURI+ "_" + self.getLabelFromUri[type_entity] + "_"+ str(icount[type_entity])
                    else:
                        id_entity = suffixURI+ "_" + self.getLabelFromUri[type_entity] + "_"+ str(icount[type_entity])

                    id_entity = self.encode_to_rdf_uri(id_entity,prefix=self.prefix)
                    
                    build_entity_id = True
                    self.getLabelFromUri[id_entity] = str(feat.type) + "_" + str(icount[type_entity])

                start_entity = int(feat.location.start)
                end_entity = int(feat.location.end)
                faldo_strand =""

                if int(feat.location.strand == 1):
                    strand_entity = 'askomics:plus'
                    faldo_strand = "faldo:ForwardStrandPosition"
                elif int(feat.location.strand == -1):
                    strand_entity = 'askomics:minus'
                    faldo_strand = "faldo:ReverseStrandPosition"
                else:
                    strand_entity = 'askomics:none'
                    faldo_strand = "faldo:BothStrandPosition"

                block_idxstart = int(start_entity) // blockbase
                block_idxend = (int(end_entity) // blockbase)
                listSliceRef = []
                listSlice = []
                for sliceb in range(block_idxstart,block_idxend+1):
                        listSliceRef.append(self.encode_to_rdf_uri("askomics:"+str(rec.id)+"_"+str(sliceb)))
                        listSlice.append(str(sliceb))

                attribute_dict = {
                    'rdf:type':  [type_entity],
                    'askomics:position_taxon' : [taxon_entity],
                    'askomics:position_ref'   : [ref_entity],
                    'askomics:position_start' : [start_entity],
                    'askomics:position_end'   : [end_entity],
                    'askomics:position_strand': [strand_entity],
                    'askomics:blockstart'     : [str(block_idxstart*blockbase)],
                    'askomics:blockend'       : [str(block_idxend*blockbase)],
                    'askomics:IsIncludeInRef' : listSliceRef,
                    'askomics:IsIncludeIn'    : listSlice,
                    'faldo:location' : ["[ a faldo:Region ;\n"+
                                        "    faldo:begin [ a faldo:ExactPosition;\n"+
                                        "                  a "+faldo_strand+";\n"+
                                        "                  faldo:position "+str(start_entity)+";\n"+
                                        "                  faldo:reference "+ref_entity+" ];\n"+
                                        "    faldo:end [ a faldo:ExactPosition;\n"+
                                        "                a "+faldo_strand+";\n"+
                                        "                  faldo:position "+str(end_entity)+";\n"+
                                        "                  faldo:reference "+ref_entity+" ]"+
                                        "]"],
                    'rdfs:label' : ['\"'+self.decode_to_rdf_uri(self.getLabelFromUri[id_entity],prefix=self.prefix)+'\"^^xsd:string']
                }

                # Abstraction
                if type_entity not in self.abstraction_dict.keys():
                    self.abstraction_dict[type_entity] = {'pos_attr': self.pos_attr_list, 'normal_attr' : []}

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

                # ---------------------------------------------------------------------------------
                buildLater = False
                for qualifier_key, qualifier_value in feat.qualifiers.items():
                    keyuri = self.encode_to_rdf_uri(qualifier_key,prefix=self.prefix)
                  
                    attribute_dict[keyuri] = []

                    for val in qualifier_value:
                        valuri = self.encode_to_rdf_uri(val,prefix=self.prefix)

                        if qualifier_key == 'ID':
                            if (valuri not in type_entities) and type_entity != '':
                                type_entities[valuri] = type_entity_label

                            attribute_dict['rdfs:label'] = ['\"'+ str(val) +'\"^^xsd:string']

                        elif qualifier_key in ['Parent', 'Derives_from']:
                            qualifier_key_uri = self.encode_to_rdf_uri(qualifier_key,prefix=self.prefix)
                            if not valuri in type_entities:
                                #raise ValueError("Unknown "+qualifier_key+" ID ["+val+"]")
                                #build later
                                buildLater = True
                                if not qualifier_key in attribute_dict:
                                    attribute_dict[qualifier_key_uri] = []
                                attribute_dict[qualifier_key_uri].append(valuri)
                            else:

                                keyuri = self.encode_to_rdf_uri(qualifier_key+"_"+type_entities[valuri],prefix=self.prefix)
                                if not keyuri in attribute_dict:
                                    attribute_dict[keyuri] = []

                                attribute_dict[keyuri].append(str(valuri))
                                # Store the parent relation in abstraction
                                DomAndRange = {keyuri : self.encode_to_rdf_uri(type_entities[valuri],prefix=self.prefix) }
                                if DomAndRange not in self.abstraction_dict[type_entity]['normal_attr']:
                                    self.abstraction_dict[type_entity]['normal_attr'].append(DomAndRange)
                        else:
                            attribute_dict[keyuri].append(str('\"' + val + '\"^^xsd:string'))
                            # store normal attr in abstraction
                            if keyuri not in self.abstraction_dict[type_entity]['normal_attr']:
                                self.abstraction_dict[type_entity]['normal_attr'].append(keyuri)

                if build_entity_id:
                    if str(attribute_dict) in lEntities :
                        continue

                    lEntities[str(attribute_dict)]="0"

                if not buildLater :
                    entity = {id_entity: attribute_dict}
                    yield self.get_content_ttl(entity)
                else:
                    toBuild.append([id_entity,attribute_dict])

        for elt in toBuild:
            id_entity = elt[0]
            attribute_dict = elt[1]

            for qualifier_key in ['Parent','Derives_from']:
                if qualifier_key in attribute_dict:
                    for valuri in attribute_dict[qualifier_key]:
                        if not valuri in type_entities:
                            self.log.warning("Unknown "+qualifier_key+" ID ["+self.decode_to_rdf_uri(valuri,prefix=self.prefix)+"]. Certainly because this element have not been selected.")
                            continue
                        keyuri = self.encode_to_rdf_uri(qualifier_key+"_"+type_entities[valuri],prefix=self.prefix)
                        attribute_dict[keyuri] = str(valuri)
                        # Store the parent relation in abstraction
                        DomAndRange = {keyuri : self.encode_to_rdf_uri(type_entities[valuri],prefix=self.prefix) }
                        if DomAndRange not in self.abstraction_dict[type_entity]['normal_attr']:
                            self.abstraction_dict[type_entity]['normal_attr'].append(DomAndRange)
                        del attribute_dict[qualifier_key]
                entity = {id_entity: attribute_dict}
                yield self.get_content_ttl(entity)

        handle.close()

    def get_content_ttl(self, entity):
        """
        Get the ttl string for an entity
        """

        for id_entity, attribute_dict in entity.items():
            first = True

            ttl = id_entity
            indent = len(id_entity) * ' ' + ' '
            for key, attr in attribute_dict.items():
                if len(attr) <= 0 : # empty attr, dont insert triple
                    continue
                for v in attr:
                    if first:
                        ttl += ' ' + str(key) + ' ' + str(v) + ' ;\n'
                        first = False
                    else:
                        ttl += indent +  str(key) + ' ' + str(v) + ' ;\n'

        ttl += '\n'

        ttl = rreplace(ttl, ';', '.', 1)
        return ttl

    def get_abstraction(self):
        """
        Get Abstraction (turtle) of the GFF
        """

        order_dict = {
            'Name': '2',
            'position_ref': '3',
            'position_start': '4',
            'position_end': '5',
            'position_strand': '6',
            'position_taxon': '7'
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
            ttl += indent + 'rdfs:label \"' + self.decode_to_rdf_uri(entity,prefix=self.prefix) + "\"^^xsd:string ;\n"
            ttl += indent + 'askomics:startPoint \"true\"^^xsd:boolean ;\n'
            ttl += indent + 'askomics:entity \"true\"^^xsd:boolean .\n\n'

            ttl += '\n'
            ttl += indent + 'rdfs:label rdfs:domain '+entity+' .\n'
            ttl += '\n'

            for type_attr, attr_list in attribute_dict.items():
                if type_attr == 'pos_attr': # positionable attributes
                    for pos_attr in attr_list:
                        if pos_attr in ('position_start', 'position_end'):
                            ttl += self.encode_to_rdf_uri('askomics:'+pos_attr) + ' askomics:attribute \"true\"^^xsd:boolean ;\n'
                            indent = len(pos_attr) * ' ' + '  '
                            ttl += indent + 'rdf:type owl:DatatypeProperty ;\n'
                            ttl += indent + 'rdfs:label \"' + pos_attr.replace('position_', '') + '\"^^xsd:string ;\n'
                            ttl += indent + 'rdfs:domain ' + entity + ' ;\n'
                            ttl += indent + 'rdfs:range xsd:decimal .\n\n'
                            ttl += self.encode_to_rdf_uri('askomics:'+pos_attr) + ' askomics:attributeOrder "' + order_dict[pos_attr] + '"^^xsd:decimal .\n'
                        else:
                            # No taxon, don't write triple and continue loop
                            if pos_attr == 'position_taxon' and self.taxon == '':
                                continue
                            ttl += self.encode_to_rdf_uri('askomics:'+pos_attr) + ' askomics:attribute \"true\"^^xsd:boolean ;\n'
                            indent = len(pos_attr) * ' ' + '  '
                            ttl += indent + 'rdf:type owl:ObjectProperty ;\n'
                            ttl += indent + 'rdfs:label \"' + pos_attr.replace('position_', '') + '\"^^xsd:string ;\n'
                            ttl += indent + 'rdfs:domain ' + entity + ' ;\n'
                            ttl += indent + 'rdfs:range ' + self.encode_to_rdf_uri('askomics:'+pos_attr.replace('position_', '')+ "Category") + ".\n\n"
                            ttl += self.encode_to_rdf_uri('askomics:'+pos_attr) + ' askomics:attributeOrder "' + order_dict[pos_attr] + '"^^xsd:decimal .\n'
                else: # other attributes
                    for attr in attr_list:
                        if isinstance(attr, dict): # Parent relation
                            for key, value in attr.items():
                                ttl += key + ' rdf:type owl:ObjectProperty ;\n'
                                indent = len(key) * ' ' + '  '
                                ttl += indent + 'rdfs:label \"' + self.decode_to_rdf_uri(key,prefix=self.prefix) + '\"^^xsd:string ;\n'
                                ttl += indent + 'rdfs:domain ' + entity + " ;\n"
                                ttl += indent + 'rdfs:range ' + value + ' .\n\n'
                        else: # normal attributes
                            ttl += attr + ' askomics:attribute \"true\"^^xsd:boolean ;\n'
                            indent = len(attr) * ' ' + '  '
                            ttl += indent + 'rdf:type owl:DatatypeProperty ;\n'
                            ttl += indent + 'rdfs:label \"' + self.decode_to_rdf_uri(attr,prefix=self.prefix) + '\"^^xsd:string ;\n'
                            ttl += indent + 'rdfs:domain ' + entity + " ;\n"
                            ttl += indent + 'rdfs:range xsd:string .\n\n'
                            if attr == 'Name':
                                ttl += attr + ' askomics:attributeOrder "' + order_dict[attr] + '"^^xsd:decimal .\n'
        #print(ttl)
        return ttl

    def get_domain_knowledge(self):
        """
        Get Domain Knowledge (turtle) of the GFF
        """

        ttl =  '######################\n'
        ttl += '#  Domain knowledge  #\n'
        ttl += '######################\n\n'

        for entity, dk_dict in self.domain_knowledge_dict.items():
            # Positionable entity
            ttl += self.encode_to_rdf_uri(entity,prefix=self.prefix) + ' askomics:is_positionable \"true\"^^xsd:boolean .\n'
            ttl += 'askomics:is_positionable rdfs:label \'is_positionable\'^^xsd:string .\n'
            ttl += 'askomics:is_positionable rdf:type owl:ObjectProperty .\n\n'

            for category_dict in dk_dict.values():
                for category, cat_list in category_dict.items():
                    # dont write triple for taxon if user don't enter one
                    if category == 'position_taxon' and self.taxon == '':
                        continue
                    for cat in cat_list:
                        if self.getLabelFromUri[cat] == '':
                            continue
                        ttl += self.encode_to_rdf_uri('askomics:'+str(category.replace('position_', ''))+'Category') + ' askomics:category ' + str(cat) + ' .\n'
                        ttl += str(cat) + ' rdf:type ' + self.encode_to_rdf_uri('askomics:'+str(category.replace('position_', ''))) + ' ;\n'
                        indent = len(str(cat)) * ' ' + ' '
                        ttl += indent + 'rdfs:label \"' + self.getLabelFromUri[cat] + '\"^^xsd:string .\n'

            ttl += '\n'
        #print(ttl)
        return ttl
