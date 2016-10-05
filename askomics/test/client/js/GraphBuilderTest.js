/*jshint esversion: 6 */
/*jshint multistr:true */

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


describe('AskomicsGraphBuilder', function () {
  describe('#Constructor', function(){
    it('* Constructor *', function() {
      let graphBuilder = new AskomicsGraphBuilder();
    });
  });
  describe('#nodes', function(){
    it('* without args *', function(){

      let graphBuilder = new AskomicsGraphBuilder();
			graphBuilder.reset();
      chai.assert.deepEqual(graphBuilder.nodes(), []);
      /*
      chai.expect(function () {  r.is_valid();}).
            to.throw("AskomicsResultsView :: data prototyperty in unset!");
        });*/
      });
    it('* without args and with nodes != [] *', function(){
      let graphBuilder = new AskomicsGraphBuilder();
			graphBuilder.reset();
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      chai.assert.equal(graphBuilder.nodes().length, 2);
    });

    it('* without args and with only one args selectednode *', function(){
      let graphBuilder = new AskomicsGraphBuilder();
			graphBuilder.reset();
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let selectedNode = graphBuilder.nodes()[1];
      chai.expect(function () {  graphBuilder.nodes(selectedNode);}).
            to.throw("AskomicsGraphBuilder :: nodes -> Define kindparam when use selectedOrderList param");
    });

    it('* without args  *', function(){
      let graphBuilder = new AskomicsGraphBuilder();
			graphBuilder.reset();
      graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
      let selectedNode = [8];
      chai.assert.equal(graphBuilder.nodes(selectedNode,'id').length, 1);
      selectedNode = [0,8];
      chai.assert.equal(graphBuilder.nodes(selectedNode,'id').length, 2);
      selectedNode = [7];
      chai.assert.equal(graphBuilder.nodes(selectedNode,'id').length, 0);
    });
  });
  describe('#links', function(){
    it('* without args *', function(){

      let graphBuilder = new AskomicsGraphBuilder();
			graphBuilder.reset();
      chai.assert.deepEqual(graphBuilder.links(), []);

      });
    it('* with args *', function(){

        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        chai.assert.equal(graphBuilder.nodes().length, 2);

      });
    });
    describe('#getInternalState', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        graphBuilder.getInternalState();
      });
    });
    describe('#addInstanciedElt', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        var n = {_uri:"http://wwww.system/test1",_label:'node1',_id:15,_SPARQLid:"H12",_suggested:true, _nothing:'nothing', _weight:0, _nlink : {} };
        graphBuilder.addInstanciedElt(n);
      });
    });
    describe('#addInstanciedLink', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        var node1 = new GraphNode({ uri:"http://wwww.system/test1",label:'',_id: 15,  _SPARQLid: "HelloWorldNode1", _suggested: false }, 12.5,16.3);
        var node2 = new GraphNode({ uri:"http://wwww.system/test2",_id: 16,  _SPARQLid: "HelloWorlNode2", _suggested: true }, 14.1,26.3);

        var link = new GraphLink({ uri:'http://wwww.system/link1'},node1,node2);
        graphBuilder.addInstanciedLink(link);
      });
    });
    describe('#findElt', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        let v = AskomicsGraphBuilder.findElt(graphBuilder.nodes(),8);
        chai.assert.equal(v[0], 1);
      });
    });
    describe('#removeInstanciedNode', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        let v = graphBuilder.removeInstanciedNode(graphBuilder.nodes()[1]);
        chai.assert.equal(graphBuilder.nodes().length, 1);
      });
    });
    describe('#removeInstanciedLink', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        chai.assert.equal(graphBuilder.links().length, 1);
        let v = graphBuilder.removeInstanciedLink(graphBuilder.links()[0]);
        chai.assert.equal(graphBuilder.links().length, 0);
      });
    });
    describe('#setSPARQLVariateId', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        graphBuilder.setSPARQLVariateId(graphBuilder.nodes()[0]);
      });
    });
    describe('#getId', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        graphBuilder.getId(graphBuilder.nodes()[0]);
      });
    });
    describe('#setStartpoint', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        graphBuilder.setStartpoint(graphBuilder.nodes()[0]);
      });
    });
    describe('#getInstanciedNode', function(){
      it('*  without nodes *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        chai.expect(function () {  graphBuilder.getInstanciedNode(0);}).
              to.throw("GraphBuilder::getInstanciedNode Can not find instancied node:0");
      });
      it('*  with nodes *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        graphBuilder.getInstanciedNode(0);
      });
    });
    describe('#getInstanciedLink', function(){
      it('*  without links *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        chai.expect(function () {  graphBuilder.getInstanciedLink(0);}).
              to.throw("GraphBuilder::getInstanciedLink Can not find instancied link:0");
      });
      it('*  with links *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        graphBuilder.getInstanciedLink(9);
      });
    });
    describe('#setSuggestedNode', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
        graphBuilder.setSuggestedNode(geneNode,0.5,0.5);
      });
    });
    describe('#instanciateNode', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
        graphBuilder.instanciateNode(geneNode);
      });
    });
    describe('#isInstanciatedNode', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        let geneNode = new AskomicsNode({uri:"http://wwww.system/test1",label:''},0.0,0.0);
        graphBuilder.setSuggestedNode(geneNode);
        chai.assert.isNotOk(graphBuilder.isInstanciatedNode(geneNode));
        graphBuilder.instanciateNode(geneNode);
        chai.assert.isOk(graphBuilder.isInstanciatedNode(geneNode));
      });
    });
    describe('#instanciateLink', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.instanciateLink([{uri:"H1"},{uri:"H2"}]);
      });
    });
    describe('#synchronizeInstanciatedNodesAndLinks', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        graphBuilder.synchronizeInstanciatedNodesAndLinks(graphBuilder.nodes(),graphBuilder.links());
      });
    });
    describe('#buildConstraintsGraph', function(){
      it('*  *', function(){
        let graphBuilder = new AskomicsGraphBuilder();
				graphBuilder.reset();
        graphBuilder.setNodesAndLinksFromState(dump_graphBuilder);
        let v = graphBuilder.buildConstraintsGraph();
        //console.log(v);
      });
    });
});
