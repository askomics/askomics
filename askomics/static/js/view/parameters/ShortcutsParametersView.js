
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

    instanceShortcutsParametersView = this;

    this.updateShortcuts();
  }

  setShortcut(sparql_res) {
      console.log("===> SETUP SHORTCUT :"+sparql_res.shortcut+" \n"+JSON.stringify(sparql_res));
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

  getShortcuts(in_entity) {
    console.log("in_entity:"+in_entity.uri);
    let list = {};
    for (let l in this.shortcuts) {
      console.log("test avec:"+JSON.stringify(this.shortcuts[l].in));
      if ( in_entity.uri in this.shortcuts[l].in ) {
          list[l] = (JSON.parse(JSON.stringify(this.shortcuts[l])));
      }
    }
    return list ;
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
     new ShortcutsParametersView().updateShortcuts();
   });
  }

  updateShortcuts() {
    console.log("!!! update shortcuts !!!");
    this.shortcuts = {};
    let service = new RestServiceJs("sparqlquery");
    let param = {
      'export'               : false,
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

    service.post(param,function(data) {
/*
      let table = $("#table_shortcuts_list");

      table.empty();

      let head = $('<thead></thead>');

      head.append($("<tr></tr>").addClass("table-bordered")
            .append($("<th></th>").attr("style", "text-align:center;").html("name"))
            .append($("<th></th>").attr("style", "text-align:center;").html("version"))
            .append($("<th></th>").attr("style", "text-align:center;").html("comment"))
          );

      table.append(head);

      let body = $('<tbody></tbody');

      for (let i in data.values) {
        body.append($("<tr></tr>").addClass("table-bordered")
                .append($("<td></td>").attr("style", "text-align:center;").html(data.values[i].label))
                .append($("<td></td>").attr("style", "text-align:center;").html(data.values[i].version))
                .append($("<td></td>").attr("style", "text-align:center;").html(data.values[i].comment))
              );

          new ShortcutsParametersView().setShortcut(data.values[i]);
      }
      table.append(body);
*/
      let accordion = $("#accordion_shortcuts");
      accordion.empty();
      //alert(accordion.find("[id^='collapse_']").length);
      let icount = 0;
      for (let i in data.values) {
      
        icount++;
        let div1 = $("<div></div>").addClass("panel panel-default");
        let div2 = $("<div></div>").addClass("panel-heading").append(
          $("<h4></h4>").addClass("panel-title").append(
              $("<a></a>").attr("data-toggle","collapse")
                          .attr("data-parent","#accordion_shortcuts")//+data.values[i].label+data.values[i].version
                          .attr("href","#collapse_"+icount.toString()).html(data.values[i].label)
          )
        );
        let button = new ShortcutsParametersView().buildRemoveButton(data.values[i].shortcut);

        div1.append(div2);
        let div3 = $("<div></div>").attr("id","collapse_"+icount.toString()).addClass("panel-collapse collapse").append(
            $("<div></div>").addClass("panel-body").html(
              $("<div></div>").append($("<h4></h4>").html("Definition"))
                              .append($("<p></p>").html(data.values[i].comment))
                              .append($("<hr/>"))
                              .append($("<h4></h4>").html("Version"))
                              .append($("<p></p>").html(data.values[i].version))
                              .append($("<hr/>"))
                              .append($("<h4></h4>").html("Input"))
                              .append($("<p></p>").html(data.values[i].in))
                              .append($("<hr/>"))
                              .append($("<h4></h4>").html("Output"))
                              .append($("<p></p>").html(data.values[i].out))
                              .append($("<hr/>"))
                              .append($("<h4></h4>").html("Printing Output"))
                              .append($("<p></p>").html(data.values[i].output_var+":"+data.values[i].output_varname))
                              .append($("<hr/>"))
                              .append($("<h4></h4>").html("Prefix"))
                              .append($("<p></p>").text(data.values[i].prefix_string))
                              .append($("<hr/>"))
                              .append($("<h4></h4>").html("Sparql"))
                              .append($("<p></p>").text(data.values[i].sparql_string))
                              .append(button)
            )
        );
        div1.append(div3);

        accordion.append(div1);
        new ShortcutsParametersView().setShortcut(data.values[i]);
      }
      console.log("========================= SHORTCUTS ===================================== \n"+JSON.stringify(new ShortcutsParametersView().shortcuts));
    });
  }

  buildRemoveButton(shortcut) {
    let button = $("<button></button>").addClass("btn btn-danger").html("remove");
    button.on( "click",function (d) {
      let service = new RestServiceJs("deleteShortcut");
      let param = {
        'shortcut' : shortcut
      };
      service.post(param,function() {});
      new ShortcutsParametersView().updateShortcuts();
    });
    return button;
  }
}
