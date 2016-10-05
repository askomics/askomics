/*jshint esversion: 6 */
/*jshint multistr:true */

/*
var askomics_abstraction="\
?attribute displaySetting:attribute \"true\"^^xsd:boolean .\
\
?attribute rdf:type owl:DatatypeProperty;\
           rdfs:label ?labelAttribute ;\
           rdfs:domain ?entity;\
           rdfs:range ?typeAttribute.\
";
*/

let instanceGOParametersView;

class GOParametersView extends InterfaceParametersView {

  constructor() {
    super();
    /* Implement a Singleton */
    if ( instanceGOParametersView !== undefined ) {
        return instanceGOParametersView;
    }

    /* adding */
/*
    $("body").append($("<script />", {
      src: "http://cdn.berkeleybop.org/jsapi/bbop.js"
    }));
*/
    this.config = {
      url_service              : "http://cloud-60.genouest.org/go/sparql"     ,
      //url_service              : "http://localhost:8891/sparql"     ,
      number_char_search_allow : 5                                            ,
      web_link                 : "http://amigo.geneontology.org/amigo/term/%s"  ,
      askomics_abstraction     : ''
    };

    instanceGOParametersView = this;
  }

  configurationView() {

    /* if the content have ever been created */
    if ( $("#content_gene_ontology").length>0) return;

    /* build otherwise */
    let container = $("<div></div>").addClass("container").attr("id","content_gene_ontology");
    let lab = $("<h3></h3>").html("Gene Ontology Service");


    container.append($('<hr/>'))
             .append(lab)
             .append($('<hr/>'))
             .append(this.createTextArea("ABSTRACTION",'askomics_abstraction',"Inject in the triplestore",function(e){
               /*
               PREFIX : <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#>
PREFIX displaySetting: <http://www.irisa.fr/dyliss/rdfVisualization/display>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdfg: <http://www.w3.org/2004/03/trix/rdfg-1/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX prov: <http://www.w3.org/ns/prov#>
SELECT DISTINCT ?nodeUri ?nodeLabel
WHERE {
    GRAPH <urn:sparql:tests-askomics:insert:informative1> {
    ?g rdfg:subGraphOf <urn:sparql:tests-askomics:insert:informative1> }
    GRAPH ?g {
        ?nodeUri displaySetting:startPoint "true"^^xsd:boolean .
        ?nodeUri rdfs:label ?nodeLabel
    }
}

               */
              console.log("ABSTRACTION "+new GOParametersView().config.askomics_abstraction);
              $.sparql("http://gov.tso.co.uk/education/sparql")
                  .prefix("sch-ont","http://education.data.gov.uk/def/school/")
                  .select(["?name"])
                  .where("?school","a","sch-ont:School")
                  .where("sch-ont:establishmentName", "?name")
                  .where("sch-ont:districtAdministrative", "<http://statistics.data.gov.uk/id/local-authority-district/00HB>")
                  .orderby("?name")
                  .limit(10)
                  .execute(function(results) {
                    console.log(JSON.stringify(results));
                  });


             }))
             .append($('<hr/>'))
             .append(this.createInput("ENDPOINT",'url_service'))
             .append($('<hr/>'))
             .append(this.createInput("NUMBER OF CHAR",'number_char_search_allow'))
             .append($('<hr/>'))
             .append(this.createInput("WEB LINK",'web_link'));

    $('body').append(container);
  }

}
