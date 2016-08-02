/*jshint esversion: 6 */

describe('AskomicsPositionableLink', function(){
    let node1 = new GraphNode({ uri:"http://wwww.system/test1",label:'',_id: 15,  _SPARQLid: "HelloWorldNode1", _suggested: false }, 12.5,16.3);
    let node2 = new GraphNode({ uri:"http://wwww.system/test2",_id: 16,  _SPARQLid: "HelloWorlNode2", _suggested: true }, 14.1,26.3);
    let link = new AskomicsPositionableLink({ uri:'http://wwww.system/link1'},node1,node2);
    describe('#Constructeur empty', function(){
        it('* test constructor *', function(){
            chai.assert.deepEqual(link.type, 'included');
            chai.assert.deepEqual(link.label, 'included in');
            chai.assert.deepEqual(link.same_tax, true);
            chai.assert.deepEqual(link.same_ref, true);
            chai.assert.deepEqual(link.strict, true);
        });
    });

    describe('#SetJSON', function() {
        it('* test setjson() *', function() {
            let link2 = new AskomicsPositionableLink({ uri:'http://wwww.system/link1'},node1,node2);
            let JSON_link = {
              "_id": 11,
              "_SPARQLid": "positionable1",
              "_suggested": false,
              "_uri": "positionable",
              "_label": "excluded of",
              "_linkindex": 1,
              "_source": {},
              "_target": {},
              "_transitive": true,
              "_negative": false,
              "type": "excluded",
              "same_tax": false,
              "same_ref": true,
              "strict": false
            }
            
            chai.expect(function () { link2.setjson(JSON_link); }).to.throw("Devel error: setjson : graphBuilder is not instancied!");
            //FIXME: make the following work
            //link.setjson(JSON_link);
            //chai.assert.deepEqual(link, JSON_link);
        });
    });


    describe('#BuiltConstraintSPARQL', function() {
        it('* test the constraints *', function() {
            let expectedResult = [
              [
                "?URI :position_taxon ?taxon_",
                "?URI :position_ref ?ref_",
                "?URI :position_taxon ?taxon_",
                "?URI :position_ref ?ref_",
                "?URI :position_start ?start_",
                "?URI :position_end ?end_",
                "?URI :position_start ?start_",
                "?URI :position_end ?end_",
                "FILTER(?ref_ = ?ref_)",
                "FILTER(?taxon_ = ?taxon_)",
                "FILTER((?start_ > ?start_ ) && (?end_ < ?end_))"
              ],
              ""
            ];
            chai.assert.deepEqual(link.buildConstraintsSPARQL(), expectedResult);
        });
    });


    describe('#BuiltFiltersSPARQL', function() {
        it('* test the filters *', function() {
            let expectedResult = [
                "FILTER(?ref_ = ?ref_)",
                "FILTER(?taxon_ = ?taxon_)",
                "FILTER((?start_ > ?start_ ) && (?end_ < ?end_))"
            ];
            let filters = [];
            link.buildFiltersSPARQL(filters);
            chai.assert.deepEqual(filters, expectedResult);
        });

        it('* test the error *', function() {
            let link2 = link;
            let filters = [];
            link2.type = 'bla';
            chai.expect(function () { link2.buildFiltersSPARQL(filters); }).to.throw("buildPositionableConstraintsGraph: unkown type: bla");

        });
    });

    describe('#Positionable link Display methods', function(){
        it('* String output *', function(){
            chai.assert.typeOf(link.getFillColor(),'string');
        });
    });
    
});