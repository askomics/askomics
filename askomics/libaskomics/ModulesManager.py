# -*- coding: utf-8 -*-

import os.path
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
            self.log.debug('reading  '+fil)
            a = json.loads(open(fil).read())
            self.moduleFiles[a['module']] = a

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


        if mo['state'] == 'wait':
            self.log.debug(" ******************  WAIT MODE **************** :" + urimodule)
            return

        self.log.debug(" delete MO state :" + urimodule)
        self.deleteMoState(urimodule,mo)
        self.log.debug(" insert new MO state :"+urimodule)
        self.importMoSate(mo,"wait")

        if active:
            ql = QueryLauncher(self.settings, self.session)
            fp = tempfile.NamedTemporaryFile(prefix="module_"+self.escape['entity'](namemodule), suffix=".ttl", mode="w", delete=False)
            print("load TTL module ======> "+fp.name)
            fp.write('\n'.join(self.moduleFiles[namemodule]['rdf']))
            fp.close()
            sft = SourceFileTtl(self.settings, self.session, fp.name)
            sft.persist(host_url, 'public','load')
            mo['graph'] = sft.graph
            #loading owl file
            ql.load_data(self.moduleFiles[namemodule]['owl'],mo['graph'])
            self.log.debug(" delete MO state :" + urimodule)
            self.deleteMoState(urimodule,mo)
            self.log.debug(" insert new MO state :"+urimodule)
            self.importMoSate(mo,"ok")

        else:
            ql  = QueryLauncher(self.settings, self.session)
            sqb = SparqlQueryBuilder(self.settings, self.session)
            ql.execute_query(sqb.get_drop_named_graph(mo['graph']).query)
            ql.execute_query(sqb.get_delete_metadatas_of_graph(mo['graph']).query)
            self.log.debug(" delete MO state :" + urimodule)
            self.deleteMoState(urimodule,mo)
            self.log.debug(" insert new MO state :"+urimodule)
            self.importMoSate(mo,"off")
