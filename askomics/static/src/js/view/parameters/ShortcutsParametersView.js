
/*jshint esversion: 6 */
/*jshint multistr:true */

let instanceShortcutsParametersView  ;

class ShortcutsParametersView extends InterfaceParametersView {

  constructor() {
    super();
    /* Implement a Singleton */
    if ( instanceShortcutsParametersView !== undefined ) {
        return instanceShortcutsParametersView;
    }

    this.config = {};
    this.shortcuts = {};
    this.updateShortcutsIsDone = false ;
    instanceShortcutsParametersView = this;
    this.updateShortcuts();
  }

  setShortcut(sparql_res) {

      if ( ! (sparql_res.shortcut in this.shortcuts) ) {
        this.shortcuts[sparql_res.shortcut] = {};
        this.shortcuts[sparql_res.shortcut].label = sparql_res.label;
        this.shortcuts[sparql_res.shortcut].version = sparql_res.version;
        this.shortcuts[sparql_res.shortcut].comment = sparql_res.comment;
        this.shortcuts[sparql_res.shortcut].prefix_string = sparql_res.prefix_string;
        this.shortcuts[sparql_res.shortcut].sparql_string = sparql_res.sparql_string;
        this.shortcuts[sparql_res.shortcut].in = {};
        this.shortcuts[sparql_res.shortcut].out = {};
        this.shortcuts[sparql_res.shortcut].output_var = {};
      }
      if ( ! (sparql_res.in in this.shortcuts[sparql_res.shortcut].in) ) {
        this.shortcuts[sparql_res.shortcut].in[sparql_res.in] = "";
      }
      if ( ! (sparql_res.out in this.shortcuts[sparql_res.shortcut].out) ) {
        this.shortcuts[sparql_res.shortcut].out[sparql_res.out] = "";
      }
      if ( ! (sparql_res.output_var in this.shortcuts[sparql_res.shortcut].output_var) ) {
        this.shortcuts[sparql_res.shortcut].output_var[sparql_res.output_var] = sparql_res.output_varname;
      }

      console.log("SHORTCUT : \n"+JSON.stringify(this.shortcuts[sparql_res.shortcut]));
  }

  getShortcuts(list_in_entity) {
    let list = {};
    new ShortcutsParametersView().updateShortcuts();

    for (let l in this.shortcuts) {

      console.log("test avec:"+JSON.stringify(this.shortcuts[l].in));
      if ( this.shortcuts[l].in.length != list_in_entity.lenth ) {
        console.log("entry list of shortcuts if different with list_in_entity");
        continue;
      }
      let match = true;

      for (let in_entity in list_in_entity ) {
        if ( ! (list_in_entity[in_entity].uri in this.shortcuts[l].in) ) {
          match = false;
          break;
        }
      }
      if ( match ) {
        list[l] = (JSON.parse(JSON.stringify(this.shortcuts[l])));
      }
    }
    return list ;
  }

  getAllShortcuts() {
    new ShortcutsParametersView().updateShortcuts();
    return (JSON.parse(JSON.stringify(this.shortcuts)));
  }

  importShortcut(json_def) {

    let shortcuts_rdf = "";
    let prefix = "" ;
    try {
     let shortcut_def = $.parseJSON( json_def );

     /* Check some basic prerequisite */

     if ( shortcut_def.in.length === 0 ) {
       alert("in key can not be empty !");
       return;
     }
     if ( shortcut_def.out.length === 0 ) {
       alert("out key can not be empty !");
       return;
     }

     shortcuts_rdf = "";
     shortcuts_rdf += ":"+shortcut_def.name.replace(/\s/g,"_")+"-"+shortcut_def.version.replace(/\s/g,"_")+" a :shortcuts;\n";
     shortcuts_rdf += "rdfs:label \""+shortcut_def.name+"\"^^xsd:string;\n";
     shortcuts_rdf += "rdfs:comment \""+shortcut_def.comment+"\"^^xsd:string;\n";
     shortcuts_rdf += ":shortcuts_version \""+shortcut_def.version+"\"^^xsd:string;\n";
     for (let l in shortcut_def.in ) {
       shortcuts_rdf += ":shortcuts_in "+shortcut_def.in[l]+";\n";
     }
     for (let l in shortcut_def.out ) {
       shortcuts_rdf += ":shortcuts_out "+shortcut_def.out[l]+";\n";
     }
     for (let l in shortcut_def.output_var ) {
       shortcuts_rdf += ":shortcuts_output_var \""+shortcut_def.output_var[l]+"\"^^xsd:string;\n";
     }
     for (let l in shortcut_def.output_varname ) {
       shortcuts_rdf += ":shortcuts_output_varname \""+shortcut_def.output_varname[l]+"\"^^xsd:string;\n";
     }
     shortcuts_rdf += ":shortcuts_prefix \""+shortcut_def.prefix.replace(/(\r\n|\n|\r)/gm,"\\n")+"\"^^xsd:string;\n";
     shortcuts_rdf += ":shortcuts_sparql \""+shortcut_def.sparql.replace(/(\r\n|\n|\r)/gm,"\\n")+"\"^^xsd:string.";

     prefix = shortcut_def.prefix;
    }
   catch (e) {
     alert("error: "+e);
     return ;
   }

   //alert(shortcuts_rdf);

   var service = new RestServiceJs("importShortcut");
   let data = {};
   data.prefix = prefix;
   data.shortcut_def = shortcuts_rdf;
   service.post(data,function(response){
     if ('error' in response) {
       alert("Import has failed !");
       return;
     }
     new ShortcutsParametersView().updateShortcuts(true);
   });
  }

  updateShortcuts(force) {
    if ( force === undefined || force !== true ) {
      if ( this.updateShortcutsIsDone ) {
        return this.shortcuts;
      }
    }
    this.updateShortcutsIsDone = true ;

    this.shortcuts = {};
    let service = new RestServiceJs("sparqlquery");
    let tab2 = __ihm.getGraphBuilder().getEndpointAndGraph();

    let param = {
      'export'               : false,
      'endpoints'            : tab2[0],
      'type_endpoints'       : tab2[1],
      'graphs'               : ['askomics:graph:shortcut'],
      'variates'             : ["?graph","?shortcut","?label","?comment","?version","?in","?out","?output_var","?output_varname","?prefix_string","?sparql_string"],
      'constraintesRelations': [[["?shortcut a :shortcuts",
                                 "?shortcut rdfs:label ?label",
                                 "?shortcut rdfs:comment ?comment",
                                 "?shortcut :shortcuts_version ?version",
                                 [["?shortcut :shortcuts_in ?in"],"OPTIONAL"],
                                 [["?shortcut :shortcuts_out ?out"],"OPTIONAL"],
                                 [["?shortcut :shortcuts_output_var ?output_var"],"OPTIONAL"],
                                 [["?shortcut :shortcuts_output_varname ?output_varname"],"OPTIONAL"],
                                 "?shortcut :shortcuts_prefix ?prefix_string",
                                 "?shortcut :shortcuts_sparql ?sparql_string"],'GRAPH ?graph'],''],
      'constraintesFilters'  : [],
      'limit'                : -1
    };

    service.postsync(param,function(data) {
      //alert(accordion.find("[id^='collapse_']").length);
      for (let i in data.values) {
        new ShortcutsParametersView().setShortcut(data.values[i]);
      }

      $("#Shortcuts_adm").empty();

      let template = AskOmics.templates.shortcuts;
      let context = {shortcuts: data.values};
      let html = template(context);

      $("#Shortcuts_adm").append(html);
    });
    return this.shortcuts;
  }


  removeShortcut(shortcut) {
      let service = new RestServiceJs("deleteShortcut");
      let param = {
        'shortcut' : shortcut
      };
      service.post(param,function() {});
      new ShortcutsParametersView().updateShortcuts(true);
    }
}
