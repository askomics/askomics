# -*- coding: utf-8 -*-
#
"""
select distinct ?a where {
GRAPH ?g {
?a ?b ?c.
}
VALUES ?g {<askomics:graph:module>}
}

DELETE WHERE {
GRAPH <askomics:graph:module> {
 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#BioPAX_s3_20_s3_3A_s3_20Biological_s3_20Pathways_s3_20Exchange> ?p ?o
 }
 }

"""

import os.path
import traceback,sys
import json
import glob
import tempfile

from askomics.libaskomics.ParamManager import ParamManager
from askomics.libaskomics.rdfdb.SparqlQueryBuilder import SparqlQueryBuilder
from askomics.libaskomics.rdfdb.QueryLauncher import QueryLauncher
from askomics.libaskomics.source_file.SourceFileTtl import SourceFileTtl

class ModulesManager(ParamManager):
    """
        Manage Askomics modules : list/import/remove
    """
    def __init__(self, settings, session):
        '''
            Manage Modules Askomics
        '''
        ParamManager.__init__(self, settings, session)

        '''
            All modules have to be composed with thes keys
        '''
        self.latt = ['module','comment','version','owl','rdf']

        self.moduleFiles = {}
        self.graph_modules="askomics:graph:module"
        self.modulesdir='askomics/static/modules/'
        self.data = {}

    def loadAvailableMo(self):
        '''

        Initialize self.module with all <module>.mod file find in the rith directory
        Each module have to defined with :
        - name     : module name
        - comment  : comment describing the module
        - version  : version of this module
        - graph    : graph where data have to saved in the TPS
        - owl      : OWL file to upload in the TPS
        - rdf      : Askomics asbtraction

        '''

        if not os.path.isdir(self.modulesdir):
            self.log.debug('ca not find module directory: '+self.modulesdir)
            self.data['error'] = 'ca not find module directory ['+self.modulesdir+'] on server !'
            return

        lfiles = glob.glob(self.modulesdir+"*.mo")

        for fil in lfiles:
            try:
                self.log.debug('reading  '+fil)
                a = json.loads(open(fil).read())
                self.moduleFiles[a['module']] = a
            except Exception as e:
                traceback.print_exc(file=sys.stdout)
                self.log.error(str(e))


    def saveMo(self,modulename):
        '''
        '''

        if not os.path.isdir(self.modulesdir):
            self.log.debug('ca not find module directory: '+self.modulesdir)
            self.data['error'] = 'ca not find module directory ['+self.modulesdir+'] on server !'
            return

        lfiles = glob.glob(self.modulesdir+"*.mo")

        for fil in lfiles:
            try:
                self.log.debug('reading  '+fil)
                a = json.loads(open(fil).read())
                if a['module'] == modulename:
                    with open(fil, 'w') as outfile:
                        json.dump(self.moduleFiles[a['module']],outfile, sort_keys=True,indent=4,separators=(',', ': '))
                    #json.dumps(self.moduleFiles[a['module']])
                    return

            except Exception as e:
                traceback.print_exc(file=sys.stdout)
                self.log.error(str(e))



    def checkMo(self):
        '''
            Check validity of modules finded in the module directory
        '''

        for module in self.moduleFiles:
            if not all( att in self.moduleFiles[module] for att in self.latt ) :
                self.log.debug('bad construction of module name : '+module)
                self.moduleFiles[module] = None
                raise ValueError("Module ["+ module +"] Miss one of these keys :"+str(self.latt))

    def deleteMoState(self,urimo,mo):
        self.log.debug(' ***** Delete module '+urimo+' on TPS ***** ')
        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql = QueryLauncher(self.settings, self.session)

        ql.execute_query(sqb.prepare_query(
        """
        DELETE WHERE { GRAPH <"""+self.graph_modules+"""> { <"""+urimo+"""> ?p ?o } }
        """
        ).query)

    def importMoSate(self,mo,state):
        '''
            Import in the TPS all triplet necessary to defined an askomics module
        '''

        rdf = ":"+self.escape['entity'](mo['module'])+" rdfs:label " + self.escape['text'](mo['module'])+";\n"
        rdf += " rdfs:comment " + self.escape['text'](mo['comment'])+";\n"
        rdf += " :module_version " + self.escape['text'](mo['version'])+";\n"
        rdf += " :module_state " + self.escape['text'](state)+""
        if (state == 'ok'):
            rdf += ";\n :module_graph " + '<'+mo['graph']+'>.\n'
        else:
            rdf += ".\n"

        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql  = QueryLauncher(self.settings, self.session)
        sh = sqb.header_sparql_config('')

        ql.insert_data(rdf, self.graph_modules , sh)

    def moStateOnTPS(self):
        '''
            check if module files state is saved on the TPS.
            if not all modules files are saved with the unchecked status !
        '''
        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql  = QueryLauncher(self.settings, self.session)
        results = ql.process_query(sqb.build_query_on_the_fly({
            'select': '?uri ?module ?comment ?version ?graph ?state',
            'from'  : '<'+self.graph_modules+'>',
            'query': '{\n'+
            '?uri rdfs:label ?module .\n'+
            '?uri rdfs:comment ?comment .\n'+
            '?uri :module_version ?version .\n'+
            '?uri :module_state ?state .\n'+
            'OPTIONAL { ?uri :module_graph ?graph . } \n'+
            '}\n'
            },True).query)

        self.log.debug(' ***** module on TPS ***** ')
        listMoOnTps = {}
        for result in results:
            result['checked'] = (result['state'] == "ok")
            result['wait'] = (result['state'] == "wait")
            listMoOnTps[result['module']] = 0
            self.log.debug('module : '+result['module'])
            #=======================*************** A ENLEVER *********=======================================
            #pour debugger
            #if result['wait'] :
            #    result['wait'] = False
            #==============================================================

        self.log.debug(' ***** check Available Modules ***** ')

        requestAgain = False

        for mo in self.moduleFiles:
            self.log.debug(" --> module "+mo);
            if mo not in listMoOnTps:
                self.log.debug(" --====== > new module < =======");
                self.importMoSate(self.moduleFiles[mo],'off')
                requestAgain = True

        if requestAgain :
            return False

        return results

    def getListModules(self):
        '''
        '''
        self.loadAvailableMo()
        self.checkMo()

        d = self.moStateOnTPS()
        #manage new database
        if d == False :
            d = self.moStateOnTPS()
        return d

    def generateAbstractAskomicsRDF(self,graph):
        '''
        '''
        sqb = SparqlQueryBuilder(self.settings, self.session)
        ql  = QueryLauncher(self.settings, self.session)
        results = ql.process_query(sqb.build_query_on_the_fly({
            'select': '?entityDom ?entityDomLab ?relation ?entityRan ?entityRanLab',
            'query': '{\n'+
            'GRAPH ?g { \n' +
            '?relation a owl:ObjectProperty.\n'+
            '?relation rdfs:domain ?entityDom.\n'+
            '?entityDom a owl:Class .\n'+
            'OPTIONAL { ?entityDom rdfs:label ?entityDomLab }.\n'+
            '?relation rdfs:range ?entityRan .\n'+
            '?entityRan a owl:Class .\n'+
            'OPTIONAL { ?entityRan rdfs:label ?entityRanLab }.\n'+
            'FILTER ( isIRI(?entityDom)).\n ' +
            'FILTER ( isIRI(?entityRan)).\n ' +
            '}\n'+
            'VALUES ?g {<'+graph+'>}'
            '}\n'
            },True).query)

        entities   = {}
        attributes = {}
        label      = {}

        for r in results:
            if r['entityDom'] not in entities:
                entities[r['entityDom']] = {}

            if r['entityRan'] not in entities:
                entities[r['entityRan']] = {}

            entities[r['entityDom']][r['relation']] = r['entityRan']

            if ('entityDomLab' in r) and (r['entityDom'] not in label):
                if r['entityDomLab'] != '':
                    label[r['entityDom']] = r['entityDomLab']
            if ('entityRanLab' in r) and (r['entityRan'] not in label):
                if r['entityRan'] != '':
                    label[r['entityRan']] = r['entityRanLab']


        if len(entities)>0:
            values = ""
            for ent in entities:
                values += '<'+ent+'> '

            results = ql.process_query(sqb.build_query_on_the_fly({
                'select': '?entity ?attribute ?basetype',
                'query': '{\n'+
                'GRAPH ?g { \n' +
                '?attribute a owl:DatatypeProperty.\n'+
                '?attribute rdfs:domain ?entity.\n'+
                '?entity a owl:Class .\n'+
                '?attribute rdfs:range ?basetype .\n'+
                'FILTER ( isIRI(?basetype)).\n ' +
                'VALUES ?entity {'+values+'}.\n ' +
                '}\n'+
                'VALUES ?g {<'+graph+'>}'
                '}\n'
                },True).query)


            for r in results:
                if r['entity'] not in attributes:
                    attributes[r['entity']] = {}
                attributes[r['entity']][r['attribute']] = r['basetype']

        rdftab = []

        rdftab.append("@prefix displaySetting: <"+self.ASKOMICS_prefix['displaySetting']+">.")
        rdftab.append("@prefix rdfs: <"+self.ASKOMICS_prefix['rdfs']+">.")

        for ent in entities:
            rdftab.append("<"+ent +"> displaySetting:entity \"true\"^^xsd:boolean.")
            if ent not in label:
                rdftab.append("<"+ent +"> rdfs:label "+self.escape['text'](ent)+"^^xsd:string.")
            if len(entities[ent])>0:
                 rdftab.append("<"+ ent +"> displaySetting:startPoint \"true\"^^xsd:boolean.")
            if ent in attributes:
                for at in attributes[ent]:
                    rdftab.append("<"+ at +"> displaySetting:attribute \"true\"^^xsd:boolean.")

        return rdftab

    def importRDF(self,mo,namemodule,host_url,graph=None):
        fp = tempfile.NamedTemporaryFile(prefix="module_"+self.escape['entity'](namemodule), suffix=".ttl", mode="w", delete=False)
        fp.write('\n'.join(self.moduleFiles[namemodule]['rdf']))
        fp.close()
        sft = SourceFileTtl(self.settings, self.session, fp.name)
        if graph != None:
            sft.setGraph(graph)
        else:
            mo['graph'] = sft.graph
        sft.persist(host_url, 'public','load')


    def manageModules(self,host_url,urimodule,namemodule,active):
        '''
            activate/desactivate module
        '''
        self.log.debug(" --======================> manageModules <========================--- ");
        self.log.debug(" uri:"+urimodule)
        self.log.debug(" namemodule:"+namemodule)
        self.log.debug(" active:"+str(active))

        listMo = self.getListModules()
        mo = None
        for i in listMo:
            if i["uri"] == urimodule:
                mo = i
                break

        if mo == None:
            raise ValueError("Can not find Mo on TPS !")

        ##########################################################################################
        if mo['state'] == 'wait':
            self.log.debug(" ******************  WAIT MODE **************** :" + urimodule)
            return

        self.log.debug(" delete MO state :" + urimodule)
        self.deleteMoState(urimodule,mo)
        self.log.debug(" insert new MO state :"+urimodule)
        self.importMoSate(mo,"wait")
        ql = QueryLauncher(self.settings, self.session)

        if active:
            self.importRDF(mo,namemodule,host_url)
            #loading owl file
            ql.load_data(self.moduleFiles[namemodule]['owl'],mo['graph'])
            self.log.debug(" delete MO state :" + urimodule)
            self.deleteMoState(urimodule,mo)
            self.log.debug(" insert new MO state :"+urimodule)
            self.importMoSate(mo,"ok")
            ##########################################################################################
            # manage owl if dos not exist in the MO file
            if 'rdf' not in self.moduleFiles[namemodule]:
                self.moduleFiles[namemodule]['rdf'] = []
            if len(self.moduleFiles[namemodule]['rdf'])<=0:
                self.moduleFiles[namemodule]['rdf'] = self.generateAbstractAskomicsRDF(mo['graph'])
                self.importRDF(mo,namemodule,host_url,mo['graph'])
                self.saveMo(namemodule)

        else:
            sqb = SparqlQueryBuilder(self.settings, self.session)
            ql.execute_query(sqb.get_drop_named_graph(mo['graph']).query)
            ql.execute_query(sqb.get_delete_metadatas_of_graph(mo['graph']).query)
            self.log.debug(" delete MO state :" + urimodule)
            self.deleteMoState(urimodule,mo)
            self.log.debug(" insert new MO state :"+urimodule)
            self.importMoSate(mo,"off")
