/*jshint esversion: 6 */

let attributesList = {
  "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_end":
    {
      "uri":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_end",
      "type":"http://www.w3.org/2001/XMLSchema#decimal",
      "label":"end",
      "SPARQLid":"position_end1",
      "id":1,
      "actif":false
    },
  "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_start":
      {
        "uri":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_start",
        "type":"http://www.w3.org/2001/XMLSchema#decimal",
        "label":"start",
        "SPARQLid":"position_start1",
        "id":2,
        "actif":false
      }
};

let categoriesList = {
  "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_ref":
    {
      "uri":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_ref",
      "type":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#chromosomeNameCategory",
      "label":"chromosomeName",
      "SPARQLid":"position_ref1",
      "id":3,
      "actif":false
    },
  "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_taxon":
    {
      "uri":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_taxon",
      "type":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#taxonCategory",
      "label":"taxon",
      "SPARQLid":"position_taxon1",
      "id":4,
      "actif":false
    },
  "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#featureType":
    {
      "uri":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#featureType",
      "type":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#featureTypeCategory",
      "label":"featureType","SPARQLid":"featureType1","id":5,"actif":false
    },
    "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#strand":
      {
        "uri":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#strand",
        "type":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#strandCategory",
        "label":"strand",
        "SPARQLid":"strand1",
        "id":6,
        "actif":false
      }
    };

let geneJSON = {
  "_id":0,
  "_SPARQLid":"Gene1",
  "_suggested":false,
  "_actif":true,
  "_weight":4,
  "_x":0.0,
  "_y":0.0,
  "_nlink":{},
  "_linkvar": {},
  "_uri":"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Gene",
  "_attributes": attributesList,
  "_categories": categoriesList,
  "_filters": {},
  "_values":  {},
  "_isregexp":{},
  "_inverseMatch": {},
  "_label":"Gene"
  };

describe('AskomicsNode', function(){
  describe('#Constructor/JSON', function(){
    it('* test all methods *', function(){
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1"},0.0,0.0);
      geneNode.setjson(geneJSON);
      chai.assert.deepEqual(geneNode, geneJSON);
    });
  });
  describe('#Getter/Setter', function(){
    it('* test all methods *', function(){
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
      geneNode.setjson(geneJSON);
      geneNode.attributes = attributesList;
      chai.assert.deepEqual(geneNode.attributes,attributesList);
      geneNode.categories = categoriesList;
      chai.assert.deepEqual(geneNode.categories,categoriesList);
    });
  });

  function setAndCheckFilter(geneNode,sparqlid,value) {
    geneNode.setFilterAttributes(sparqlid,value,'FILTER ( ?'+sparqlid+' = "'+value+'" )');
    chai.assert(geneNode.uri,"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Gene");
    chai.assert(geneNode.label,"Gene");
    chai.assert.deepEqual(geneNode.filters, {"positionnnnn_ref1":"FILTER ( ?positionnnnn_ref1 = \"QQ\" )"});
    chai.assert.deepEqual(geneNode.values, {"positionnnnn_ref1":"QQ"});
  }

  describe('#Testing attribute properties', function(){
    it('* Setting with errors *', function(){
      let sparqlid = "positionnnnn_ref1"; /* not exist */
      let value = "QQ";
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
      geneNode.setjson(geneJSON);
      setAndCheckFilter(geneNode,sparqlid,value);
      chai.expect(function () { geneNode.setActiveAttribute(sparqlid,true,true);}).
        to.throw("activeAttribute : can not find attribute:positionnnnn_ref1");
      chai.expect(function () { geneNode.setActiveAttribute(sparqlid,true,false);}).
        to.throw("activeAttribute : can not find attribute:positionnnnn_ref1");
      chai.expect(function () { geneNode.setActiveAttribute(sparqlid,false,false);}).
        to.throw("activeAttribute : can not find attribute:positionnnnn_ref1");
      chai.expect(function () { geneNode.setActiveAttribute(sparqlid,false,true);}).
        to.throw("activeAttribute : can not find attribute:positionnnnn_ref1");
    });

    it('* empty the filter with empty string to trim *', function(){
      let sparqlid = "positionnnnn_ref1"; /* not exist */
      let value = "QQ";
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
      geneNode.setjson(geneJSON);

      setAndCheckFilter(geneNode,sparqlid,value);

      geneNode.setFilterAttributes(sparqlid,'   ','FILTER ( ?'+sparqlid+' = "'+value+'" )');
      chai.assert.deepEqual(geneNode.filters, {});
      chai.assert.deepEqual(geneNode.values, {});

      setAndCheckFilter(geneNode,sparqlid,value);

      geneNode.setFilterAttributes(sparqlid,value,'   ');
      chai.assert.deepEqual(geneNode.filters, {});
      chai.assert.deepEqual(geneNode.values, {"positionnnnn_ref1": 'QQ'});

      setAndCheckFilter(geneNode,sparqlid,value);
    });

    it('* empty filter *', function(){
      let sparqlid = "positionnnnn_ref1"; /* not exist */
      let value = "QQ";
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
      geneNode.setjson(geneJSON);
      setAndCheckFilter(geneNode,sparqlid,value);

      geneNode.setFilterAttributes(sparqlid,'','FILTER ( ?'+sparqlid+' = "'+value+'" )');
      chai.assert.deepEqual(geneNode.filters, {});
      chai.assert.deepEqual(geneNode.values, {});

      setAndCheckFilter(geneNode,sparqlid,value);

      geneNode.setFilterAttributes(sparqlid,value,'');
      chai.assert.deepEqual(geneNode.filters, {});
      chai.assert.deepEqual(geneNode.values, {"positionnnnn_ref1": 'QQ'});
    });

    it('* ActiveAttribute *', function(){
      let sparqlid = "position_ref1";
      let value = "QQ";
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);

      geneNode.setjson(geneJSON);
      geneNode.setFilterAttributes(sparqlid,value,'FILTER ( ?'+sparqlid+' = "'+value+'" )');

      chai.assert.deepEqual(geneNode.filters, {"position_ref1":"FILTER ( ?position_ref1 = \"QQ\" )"});
      chai.assert.deepEqual(geneNode.values, {"position_ref1":"QQ"});
      geneNode.setActiveAttribute(sparqlid,true,true);
      geneNode.setActiveAttribute(sparqlid,true,false);
      geneNode.setActiveAttribute(sparqlid,false,false);
      geneNode.setActiveAttribute(sparqlid,false,true);
    });

    it('* RegExp *', function(){
      let sparqlid = "position_ref1";
      let value = "QQ";
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);

      chai.assert.isNotOk(geneNode.isRegexpMode("TestUnknownId"),"Sparql id is not set. have to get False");
      geneNode.switchRegexpMode("TestUnknownId");
      chai.assert(geneNode.isRegexpMode("TestUnknownId"));

      geneNode.setjson(geneJSON);
      geneNode.setFilterAttributes(sparqlid,value,'FILTER ( ?'+sparqlid+' = "'+value+'" )');
      geneNode.switchRegexpMode(sparqlid);
      chai.assert(geneNode.isRegexpMode(sparqlid));
    });

    it('* inverseMatch *', function(){
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
      geneNode.inverseMatch = [];
      chai.assert.deepEqual(geneNode.inverseMatch,[]);

      geneNode.setjson(geneJSON);
      let attSPARQLid = "position_start1";
      let catSPARQLid = "position_ref1" ;
      geneNode.inverseMatch[attSPARQLid] = true ;
      geneNode.setActiveAttribute(attSPARQLid,true);
      let tab = geneNode.buildConstraintsSPARQL();
      let attendu = [["?URIGene1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Gene>",
                      "?URIGene1 rdfs:label ?Gene1",
                      [["?URIGene1 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_start> ?position_start1",
                        "FILTER isLiteral(?position_start1)"],""]],""];
      chai.assert.deepEqual(tab,attendu);

      geneNode.inverseMatch[catSPARQLid] = true ;
      geneNode.setActiveAttribute(catSPARQLid,true);
      tab = geneNode.buildConstraintsSPARQL();
      attendu = [["?URIGene1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Gene>",
                  "?URIGene1 rdfs:label ?Gene1",
                  [["?URIGene1 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_start> ?position_start1",
                  "FILTER isLiteral(?position_start1)"],""],
                  [["?URIGene1 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_ref> ?URICatposition_ref1",
                  "[] askomicsns:category ?URICatposition_ref1",
                  "?URICatposition_ref1 rdfs:label ?position_ref1"],""]],""];
      chai.assert.deepEqual(tab,attendu);
    });

    it('* switchRegexpMode *', function(){
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
      chai.expect(function () { geneNode.switchRegexpMode(); }).
        to.throw("switchRegexpMode : undefined attribute !");
      let sparqlid = "position_ref1";
      geneNode.switchRegexpMode(sparqlid);
      chai.assert.isOk(geneNode.isregexp[sparqlid]);
      geneNode.switchRegexpMode(sparqlid);
      chai.assert.isNotOk(geneNode.isregexp[sparqlid]);
    });
  });
  describe('#JSON method', function(){
    it('* initializing object with json format *', function(){
      let nodeEmpty = new AskomicsNode({ label:"HelloWorld", uri:"/huoulu/lolo/dddddd#", _id: 15,  _SPARQLid: "HelloWorld16", _suggested: true }, 12.5,16.3);
      var obj = new AskomicsNode({ label:"H", uri:"/h/l/d#", _id: 15,  _SPARQLid: "H2", _suggested: true }, 0.5,1.3);
      nodeEmpty.setjson(obj);
      chai.assert.deepEqual(nodeEmpty, obj);
    });
  });
  describe('#Attribute Graph Display methods', function(){
    it('* String output *', function(){
      let nodeEmpty = new AskomicsNode({ label:"HelloWorld", uri:"/huoulu/lolo/dddddd#", _id: 15,  _SPARQLid: "HelloWorld16", _suggested: true }, 12.5,16.3);
      chai.assert.typeOf(nodeEmpty.getTextFillColor(),'string');
      chai.assert.typeOf(nodeEmpty.getTextStrokeColor(),'string');
      chai.assert.isNumber(nodeEmpty.getRNode(),'R size is a number');
    });
  });
  describe('#Build SPARQL Query to get Category value', function(){
    it('* buildConstraintsGraphForCategory bad args *', function(){
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
      geneNode.setjson(geneJSON);
      let tab = geneNode.buildConstraintsGraphForCategory();

      chai.expect(tab).to.deep.equal([[],[]],'buildConstraintsGraphForCategory with none argument give empty array!');
      tab = geneNode.buildConstraintsGraphForCategory("");
      chai.assert.isArray(tab);
      chai.expect(tab).to.deep.equal([[],[]],'buildConstraintsGraphForCategory with a empty string as argument give empty array!');
      tab = geneNode.buildConstraintsGraphForCategory("position_taxon1");
      chai.assert.isArray(tab);
      chai.expect(tab).to.deep.equal([[],[]],'buildConstraintsGraphForCategory with a argument targeting a basic type!');
    });

    it('* buildConstraintsGraphForCategory *', function(){
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
      geneNode.setjson(geneJSON);
      let tab = geneNode.buildConstraintsGraphForCategory("position_ref1");
    });
  });
  describe('#getPanelView', function(){
    it('* test type *', function(){
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
      geneNode.setjson(geneJSON);
      let panel = geneNode.getPanelView();
      chai.expect(panel).to.be.an.instanceof(AskomicsNodeView);
    });
  });
  describe('#Build SPARQL Query', function(){
    let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
    geneNode.setjson(geneJSON);
    let tab ;
    let sparqlid = "position_ref1";
    let value = "QQ";
    let waitResults1 = [["?URIGene1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Gene>","?URIGene1 rdfs:label ?Gene1",
    [["?URIGene1 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_ref> ?URICatposition_ref1",
    "[] askomicsns:category ?URICatposition_ref1",
    "?URICatposition_ref1 rdfs:label ?position_ref1"],""]],""];
    let waitResults2 = [["?URIGene1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Gene>","?URIGene1 rdfs:label ?Gene1",
    [["?URIGene1 <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#position_ref> ?URICatposition_ref1",
    "[] askomicsns:category ?URICatposition_ref1",
    "?URICatposition_ref1 rdfs:label ?position_ref1"],"OPTIONAL"]],""];

    it('* buildConstraintsSPARQL simple args *', function(){
      tab = geneNode.buildConstraintsSPARQL();
      chai.assert.deepEqual(tab, [["?URIGene1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Gene>","?URIGene1 rdfs:label ?Gene1"],""]);
    });

    it('* instanciate variables *', function(){
      let variates = [];
      geneNode.instanciateVariateSPARQL(variates);
      chai.assert.deepEqual(variates, ["?Gene1"]);
    });

    it('* buildConstraintsSPARQL attribute is not actif *', function(){

      geneNode.setFilterAttributes(sparqlid,value,'FILTER ( ?'+sparqlid+' = "'+value+'" )');
      // attribute is not actif
      geneNode.setActiveAttribute(sparqlid,false);
      tab = geneNode.buildConstraintsSPARQL();
      chai.assert.deepEqual(tab, [["?URIGene1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Gene>","?URIGene1 rdfs:label ?Gene1"],""]);
    });

    it('* setFilterAttributes *', function(){
      geneNode.setFilterAttributes(sparqlid,'','');
      tab = geneNode.buildConstraintsSPARQL();
      chai.assert.deepEqual(tab, [["?URIGene1 rdf:type <http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Gene>","?URIGene1 rdfs:label ?Gene1"],""]);
    });

    // resultats attendus pour les deux prochain tests

    it('* buildConstraintsSPARQL attribute is actif and not optional *', function(){
      // attribute is actif and not optional
      geneNode.setActiveAttribute(sparqlid,true);
      tab = geneNode.buildConstraintsSPARQL();
      chai.assert.deepEqual(tab, waitResults1);
    });

    it('* buildConstraintsSPARQL attribute is actif and not optional *', function(){
      // attribute is actif and not optional
      geneNode.setActiveAttribute(sparqlid,true,false);
      tab = geneNode.buildConstraintsSPARQL();
      chai.assert.deepEqual(tab, waitResults1);
    });

    it('* buildConstraintsSPARQL attribute is actif and optional *', function(){
      // attribute is actif and optional
      geneNode.setActiveAttribute(sparqlid,true,true);
      tab = geneNode.buildConstraintsSPARQL();
      chai.assert.deepEqual(tab, waitResults2);
    });
/*
    it('* buildConstraintsSPARQL test active attribute with set false *', function(){
      geneNode.setActiveAttribute(sparqlid,false);
      chai.assert.isNotOk(geneNode.isActiveAttribute(sparqlid));
    });
    it('* buildConstraintsSPARQL test active attribute with set true *', function(){
      geneNode.setActiveAttribute(sparqlid,true);
      chai.assert.isOk(geneNode.isActiveAttribute(sparqlid));
    });
    it('* buildConstraintsSPARQL test active attribute with a unknow variable *', function(){
      chai.expect(function () { geneNode.isActiveAttribute("DOESNOTEXIST"); }).
        to.throw("isActiveAttribute : can not find attribute:DOESNOTEXIST");
    });
    */
  });
  describe('#string test', function(){
    it('* simple test *', function(){
      let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
      chai.assert.typeOf(geneNode.toString(),'string');
    });
  });

});
