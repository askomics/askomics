/*jshint esversion: 6 */
var dump_graphBuilder = '[\
	1.1,\
	[\
		[\
			"AskomicsNode",\
			{\
				"_id": 0,\
				"_SPARQLid": "Personne1",\
				"_suggested": false,\
				"_uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Personne",\
				"_label": "Personne",\
				"_actif": true,\
				"_weight": 1,\
				"_x": 240.7906200614623,\
				"_y": 92.02368442202555,\
				"_nlink": {\
          "5": 0,\
					"8": 1\
				},\
				"_attributes": {\
					"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Age": {\
						"uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Age",\
						"type": "http://www.w3.org/2001/XMLSchema#decimal",\
						"basic_type": "decimal",\
						"label": "Age",\
						"SPARQLid": "Age1",\
						"id": 1,\
						"actif": true,\
						"optional": false\
					},\
					"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#ID": {\
						"uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#ID",\
						"type": "http://www.w3.org/2001/XMLSchema#string",\
						"basic_type": "string",\
						"label": "ID",\
						"SPARQLid": "ID1",\
						"id": 2,\
						"actif": false\
					},\
					"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label": {\
						"uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label",\
						"type": "http://www.w3.org/2001/XMLSchema#string",\
						"basic_type": "string",\
						"label": "label",\
						"SPARQLid": "label1",\
						"id": 3,\
						"actif": false,\
						"optional": false\
					}\
				},\
				"_categories": {\
					"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Sexe": {\
						"uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Sexe",\
						"type": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#SexeCategory",\
						"basic_type": "category",\
						"label": "Sexe",\
						"SPARQLid": "Sexe1",\
						"id": 4,\
						"actif": true,\
						"optional": false\
					}\
				},\
				"_filters": {},\
				"_values": {},\
				"_isregexp": {\
					"Personne1": true,\
					"ID1": true,\
					"label1": true\
				},\
				"_inverseMatch": {},\
				"_linkvar": {},\
				"index": 0,\
				"px": 240.81264680785853,\
				"py": 92.04473897760359\
			}\
		],\
		[\
			"AskomicsNode",\
			{\
				"_id": 8,\
				"_SPARQLid": "Instrument1",\
				"_suggested": false,\
				"_uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Instrument",\
				"_label": "Instrument",\
				"_actif": true,\
				"_weight": 2,\
				"_x": 247.87298205177316,\
				"_y": 260.78482589905985,\
				"_nlink": {\
					"0": 1,\
					"13": 1\
				},\
				"_attributes": {\
					"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label": {\
						"uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label",\
						"type": "http://www.w3.org/2001/XMLSchema#string",\
						"basic_type": "string",\
						"label": "label",\
						"SPARQLid": "label2",\
						"id": 12,\
						"actif": true,\
						"optional": false\
					}\
				},\
				"_categories": {},\
				"_filters": {},\
				"_values": {},\
				"_isregexp": {\
					"Instrument1": true,\
					"label2": true\
				},\
				"_inverseMatch": {},\
				"_linkvar": {},\
				"index": 1,\
				"px": 247.88564600894696,\
				"py": 260.7593494330308,\
				"fixed": 0\
			}\
		]\
	],\
	[\
		[\
			"AskomicsLink",\
			{\
				"_id": 9,\
				"_SPARQLid": "Joue1",\
				"_suggested": false,\
				"_uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Joue",\
				"_label": "Joue",\
				"_linkindex": 1,\
				"_source": {\
					"_id": 0,\
					"_SPARQLid": "Personne1",\
					"_suggested": false,\
					"_uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Personne",\
					"_label": "Personne",\
					"_actif": true,\
					"_weight": 1,\
					"_x": 240.7906200614623,\
					"_y": 92.02368442202555,\
					"_nlink": {\
						"5": 0,\
						"8": 1\
					},\
					"_attributes": {\
						"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Age": {\
							"uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Age",\
							"type": "http://www.w3.org/2001/XMLSchema#decimal",\
							"basic_type": "decimal",\
							"label": "Age",\
							"SPARQLid": "Age1",\
							"id": 1,\
							"actif": true,\
							"optional": false\
						},\
						"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#ID": {\
							"uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#ID",\
							"type": "http://www.w3.org/2001/XMLSchema#string",\
							"basic_type": "string",\
							"label": "ID",\
							"SPARQLid": "ID1",\
							"id": 2,\
							"actif": false\
						},\
						"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label": {\
							"uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label",\
							"type": "http://www.w3.org/2001/XMLSchema#string",\
							"basic_type": "string",\
							"label": "label",\
							"SPARQLid": "label1",\
							"id": 3,\
							"actif": false,\
							"optional": false\
						}\
					},\
					"_categories": {\
						"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Sexe": {\
							"uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Sexe",\
							"type": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#SexeCategory",\
							"basic_type": "category",\
							"label": "Sexe",\
							"SPARQLid": "Sexe1",\
							"id": 4,\
							"actif": true,\
							"optional": false\
						}\
					},\
					"_filters": {},\
					"_values": {},\
					"_isregexp": {\
						"Personne1": true,\
						"ID1": true,\
						"label1": true\
					},\
					"_inverseMatch": {},\
					"_linkvar": {},\
					"index": 0,\
					"px": 240.81264680785853,\
					"py": 92.04473897760359\
				},\
				"_target": {\
					"_id": 8,\
					"_SPARQLid": "Instrument1",\
					"_suggested": false,\
					"_uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#Instrument",\
					"_label": "Instrument",\
					"_actif": true,\
					"_weight": 2,\
					"_x": 247.87298205177316,\
					"_y": 260.78482589905985,\
					"_nlink": {\
						"0": 1,\
						"13": 1\
					},\
					"_attributes": {\
						"http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label": {\
							"uri": "http://www.semanticweb.org/irisa/ontologies/2016/1/igepp-ontology#label",\
							"type": "http://www.w3.org/2001/XMLSchema#string",\
							"basic_type": "string",\
							"label": "label",\
							"SPARQLid": "label2",\
							"id": 12,\
							"actif": true,\
							"optional": false\
						}\
					},\
					"_categories": {},\
					"_filters": {},\
					"_values": {},\
					"_isregexp": {\
						"Instrument1": true,\
						"label2": true\
					},\
					"_inverseMatch": {},\
					"_linkvar": {},\
					"index": 1,\
					"px": 247.88564600894696,\
					"py": 260.7593494330308,\
					"fixed": 0\
				},\
				"_transitive": false,\
				"_negative": false\
			}\
		]\
	],\
	{\
		"Personne": 1,\
		"Age": 1,\
		"ID": 1,\
		"label": 2,\
		"Sexe": 1,\
		"Instrument": 1,\
		"Joue": 1\
	},\
	15\
]';

var data_test = {
  "values":
  [
    { "Instrument1":"piano","Age1":"23","Sexe1":"F","label2":"Piano","Personne1":"A" },
    { "Instrument1":"violon","Age1":"25","Sexe1":"M","label2":"Violon","Personne1":"B" },
    { "Instrument1":"violon","Age1":"45","Sexe1":"M","label2":"Violon","Personne1":"D" },
    { "Instrument1":"piano","Age1":"45","Sexe1":"M","label2":"Piano","Personne1":"D" },
    { "Instrument1":"violon","Age1":"55","Sexe1":"F","label2":"Violon","Personne1":"E" },
    { "Instrument1":"piano","Age1":"55","Sexe1":"F","label2":"Piano","Personne1":"E" },
    { "Instrument1":"piano","Age1":"77","Sexe1":"M","label2":"Piano","Personne1":"F" },
    { "Instrument1":"violon","Age1":"99","Sexe1":"M","label2":"Violon","Personne1":"G" }
  ]
};


describe('AskomicsResultsView', function () {
  describe('#Constructor/JSON', function(){
    it('* Empty constructor *', function(){
      let r = new AskomicsResultsView(new AskomicsGraphBuilder(new AskomicsUserAbstraction()));
    });
    it('* Constructor *', function(){
      /* state of GraphBuilder corresponding with the resultst data_test */
      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let r = new AskomicsResultsView(graphBuilder,data_test);
    });
  });

  describe('#is valid', function(){
    it('* Constructor with data && graphBuilder null*', function(){
      let r = new AskomicsResultsView(new AskomicsUserAbstraction());
      chai.expect(function () {  r.is_valid();}).
        to.throw("AskomicsResultsView :: data prototyperty in unset!");
    });
  });
  describe('#is valid', function(){
    it('* Constructor with data null*', function(){

      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);

      let r = new AskomicsResultsView(graphBuilder);

      chai.expect(function () {  r.is_valid();}).
        to.throw("AskomicsResultsView :: data prototyperty in unset!");
    });
  });
  describe('#setActivesAttributes', function(){
    it('* Constructor *', function(){
      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let r = new AskomicsResultsView(graphBuilder,data_test);

      r.setActivesAttributes();
    });
  });
  describe('#displayResults', function(){
    it('* displayResults *', function(){
      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let r = new AskomicsResultsView(graphBuilder,data_test);
      r.setActivesAttributes();
      r.displayResults();
    });
  });

  describe('#build_header_results', function(){
    it('* build_header_results without execute activeAttribute*', function(){
      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let r = new AskomicsResultsView(graphBuilder,data_test);
      chai.expect(function () { r.build_header_results();}).
        to.throw("AskomicsResultsView :: activesAttributes is not set.");
    // console.log(.html());
    });
    it('* build_header_results without execute activeAttribute*', function(){
      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let r = new AskomicsResultsView(graphBuilder,data_test);
      r.setActivesAttributes();
      let header = r.build_header_results();
      chai.assert.isOk(header.find("th").length == 2);
    });
  });
  describe('#build_subheader_results', function(){
    it('* build_subheader_results without execute activeAttribute*', function(){
      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let r = new AskomicsResultsView(graphBuilder,data_test);
      chai.expect(function () { r.build_subheader_results(graphBuilder.nodes());}).
        to.throw("AskomicsResultsView :: activesAttributes is not set.");
    });
    it('* build_subheader_results without execute activeAttribute*', function(){
      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let r = new AskomicsResultsView(graphBuilder,data_test);
      r.setActivesAttributes();
      let header = r.build_subheader_results(graphBuilder.nodes());
      chai.assert.isOk(header.find("th").length == 2);
    });
  });
  describe('#build_body_results', function(){
    it('* build_subheader_results without execute activeAttribute*', function(){
      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let r = new AskomicsResultsView(graphBuilder,data_test);
      chai.expect(function () { r.build_body_results(graphBuilder.nodes());}).
        to.throw("AskomicsResultsView :: activesAttributes is not set.");
    });
    it('* build_body_results without execute activeAttribute*', function(){
      let graphBuilder = new AskomicsGraphBuilder(new AskomicsUserAbstraction());
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let r = new AskomicsResultsView(graphBuilder,data_test);
      r.setActivesAttributes();
      let body = r.build_body_results(graphBuilder.nodes());
      chai.assert.isOk(body.find("tr").length == 8);
    });
  });
});
