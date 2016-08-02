/*jshint esversion: 6 */

describe('AskomicsLink', function(){
    let node1 = new GraphNode({ uri:"http://wwww.system/test1",label:'',_id: 15,  _SPARQLid: "HelloWorldNode1", _suggested: false }, 12.5,16.3);
    let node2 = new GraphNode({ uri:"http://wwww.system/test2",_id: 16,  _SPARQLid: "HelloWorlNode2", _suggested: true }, 14.1,26.3);
    let link = new AskomicsLink({ uri:'http://wwww.system/link1'},node1,node2);
    describe('#Constructeur empty', function(){
        it('* test all methods *', function(){
            chai.assert.deepEqual(link.source, node1);
            chai.assert.deepEqual(link.target, node2);

            chai.assert.deepEqual(link.source._SPARQLid, '');
            chai.assert.deepEqual(link.target._SPARQLid, '');
        });
    });

    describe('#Sparql Constraints', function() {
        it('* buildConstraintsSPARQL method *', function() {
            let expectedResult = [['?URI http://wwww.system/link1 ?URI'], ''];
            chai.assert.deepEqual(link.buildConstraintsSPARQL(), expectedResult);
        });
    });




});
