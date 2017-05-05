/*jshint esversion: 6 */

class AskomicsPositionableLink extends AskomicsLink {

  constructor(link,sourceN,targetN) {
    super(link,sourceN,targetN);

    this.type         = 'included' ;
    this.label        = 'included in';
    this.same_tax     =  false;
    this.same_ref     =  true;
    this.which_strand =  'both'; // same/opp;
    this.strict       =  true ;

    this.startNodeVar = null ;
    this.endNodeVar   = null ;
    this.startSecondNodeVar = null ;
    this.endSecondNodeVar   = null ;

  }

  setjson(obj) {
    super.setjson(obj);
    this.type     = obj.type ;
    this.label    = obj.label;
    this.same_tax  =  obj.same_tax ;
    this.same_ref  =  obj.same_ref ;
    this.same_strand = obj.same_strand ;
    this.strict   =  obj.strict ;
  }

  getTextFillColor() { return 'darkgreen'; }

  buildConstraintsSPARQL() {

    let node = this.target ;
    let secondNode = this.source ;
    let blockConstraint = [];

    /* block management */
    blockConstraint.push("?"+'URI'+node.SPARQLid+" "+ ":blockstart"+" "+ "?s1");
    blockConstraint.push("?"+'URI'+secondNode.SPARQLid+" "+ ":blockstart"+" "+ "?s2");
    
    blockConstraint.push("?"+'URI'+node.SPARQLid+" "+ ":blockend"+" "+ "?e1");
    blockConstraint.push("?"+'URI'+secondNode.SPARQLid+" "+ ":blockend"+" "+ "?e2");
    //this.setFiltersOperator(blockConstraint,'s1','s2','e1','e2');

    /* manage start and end variates */
    this.startNodeVar = node.att_position_active("start") ;
    if ( this.startNodeVar === null  ) { 
      this.startNodeVar = "start_"+node.SPARQLid;
      blockConstraint.push("?"+'URI'+node.SPARQLid+" "+ "faldo:location/faldo:begin/faldo:position"+" "+ "?"+this.startNodeVar);
    }
    this.endNodeVar = node.att_position_active("end") ;
    if ( this.endNodeVar === null ) { 
      this.endNodeVar = "end_"+node.SPARQLid ;
      blockConstraint.push("?"+'URI'+node.SPARQLid+" "+ "faldo:location/faldo:end/faldo:position"+" "+ "?"+this.endNodeVar);
    }
    this.startSecondNodeVar = secondNode.att_position_active("start") ;
    if ( this.startSecondNodeVar === null ) { 
      this.startSecondNodeVar = "start_"+secondNode.SPARQLid;
      blockConstraint.push("?"+'URI'+secondNode.SPARQLid+" "+ "faldo:location/faldo:begin/faldo:position"+" "+ "?"+this.startSecondNodeVar);
    }
    this.endSecondNodeVar =  secondNode.att_position_active("end") ;
    if ( this.endSecondNodeVar === null ) { 
      this.endSecondNodeVar = "end_"+secondNode.SPARQLid;
      blockConstraint.push("?"+'URI'+secondNode.SPARQLid+" "+ "faldo:location/faldo:end/faldo:position"+" "+ "?"+this.endSecondNodeVar );
    }

    /* constrainte to target the same ref */
    if (this.same_ref) {
      let att1 = node.att_position_active("ref") ;
      let att2 = secondNode.att_position_active("ref") ;
      if ( att1 === null && att2 === null) { 
        blockConstraint.push("?"+'URI'+node.SPARQLid+" "+ "faldo:location/faldo:begin/faldo:reference"+" "+ "?URICat"+node.SPARQLid+secondNode.SPARQLid);
        blockConstraint.push("?"+'URI'+secondNode.SPARQLid+" "+ "faldo:location/faldo:begin/faldo:reference"+" "+ "?URICat"+node.SPARQLid+secondNode.SPARQLid);
      } else if ( att1 === null ) {
        blockConstraint.push("?"+'URI'+node.SPARQLid+" "+ "faldo:location/faldo:begin/faldo:reference"+" "+ "?URICat"+att2);
      } else if ( att2 === null ) {
        blockConstraint.push("?"+'URI'+secondNode.SPARQLid+" "+ "faldo:location/faldo:begin/faldo:reference"+" "+ "?URICat"+att1);
      } else {
        blockConstraint.push("FILTER ( "+ "?"+att1+"="+"?"+att2+" )");
      }
    }

    /* constrainte to target the same taxon */
    if (this.same_tax) {
      let att1 = node.att_position_active("taxon") ;
      let att2 = secondNode.att_position_active("taxon") ;
      if ( att1 === null && att2 === null) { 
        blockConstraint.push("?"+'URI'+node.SPARQLid+" "+ ":position_taxon"+" "+ "?taxon_"+node.SPARQLid+secondNode.SPARQLid);
        blockConstraint.push("?"+'URI'+secondNode.SPARQLid+" "+ ":position_taxon"+" "+ "?taxon_"+node.SPARQLid+secondNode.SPARQLid);
      } else if ( att1 === null ) {
        blockConstraint.push("?"+'URI'+node.SPARQLid+" "+ ":position_taxon"+" "+ "?"+att2);
      } else if ( att2 === null ) {
        blockConstraint.push("?"+'URI'+secondNode.SPARQLid+" "+ ":position_taxon"+" "+ "?"+att1);
      } else {
        blockConstraint.push("FILTER ( "+ "?"+att1+"="+"?"+att2+" )");
      }
    }

    /* constraint to target the same/opposite strand */
    if (this.which_strand == "same" ) {
      let att1 = node.att_position_active("strand") ;
      let att2 = secondNode.att_position_active("strand") ;
      if ( att1 === null && att2 === null) { 
        blockConstraint.push("?"+'URI'+node.SPARQLid+" "+ ":position_strand"+" "+ "?strand_"+node.SPARQLid+secondNode.SPARQLid);
        blockConstraint.push("?"+'URI'+secondNode.SPARQLid+" "+ ":position_strand"+" "+ "?strand_"+node.SPARQLid+secondNode.SPARQLid);
      } else if ( att1 === null ) {
        blockConstraint.push("?"+'URI'+node.SPARQLid+" "+ ":position_strand"+" "+ "?"+att2);
      } else if ( att2 === null ) {
        blockConstraint.push("?"+'URI'+secondNode.SPARQLid+" "+ ":position_strand"+" "+ "?"+att1);
      } else {
        blockConstraint.push("FILTER ( "+ "?"+att1+"="+"?"+att2+" )");
      }
    }


    this.buildFiltersSPARQL(blockConstraint);
    return [blockConstraint,''];
  }

  setFiltersOperator(filters, startVar1,startVar2,endVar1,endVar2) {
    let equalsign = '';

    if (!this.strict) {
      equalsign = '=';
    }
    switch(this.type) {
      case 'included' :
          filters.push('FILTER(( ' + "?s2" +' >='+  "?s1"+ ') && ('+ "?e2" +' <='+  "?e1" + ')' +
                        '   && ('+"?"+startVar2+' >'+equalsign+' '+"?"+startVar1+' ) && ('+"?"+endVar2+' <'+equalsign+' '+"?"+endVar1+'))');
          break;
      case 'excluded':
          filters.push('FILTER('+"?"+endVar1+' <'+equalsign+' '+"?"+startVar2+' || '+"?"+startVar1+' >'+equalsign+' '+"?"+endVar2+')');
          break;

      case 'overlap':
          filters.push('FILTER((('+"?"+endVar2+' >'+equalsign+' '+"?"+startVar1+') && ('+"?"+startVar2+' <'+equalsign+' '+"?"+endVar1+
          ')) || (('+"?"+startVar2+' <'+equalsign+' '+"?"+endVar1+') && ('+"?"+endVar2+' >'+equalsign+' '+"?"+startVar1+')))');
          break;

      case 'near':
        console.log('sorry, near query is not implemanted yet !');
        return;

      default:
        throw new Error("buildPositionableConstraintsGraph: unkown type: "+this.type);
    }
  }

  buildFiltersSPARQL(filters) {

    /*
    let equalsign = '';

    if (!this.strict) {
      equalsign = '=';
    }

    let node = this.target ;
    let secondNode = this.source ;

    switch(this.type) {
      case 'included' :
          filters.push('FILTER(('+"?"+this.startSecondNodeVar+' >'+equalsign+' '+"?"+this.startNodeVar+' ) && ('+"?"+this.endSecondNodeVar+' <'+equalsign+' '+"?"+this.endNodeVar+'))');
          break;
      case 'excluded':
          filters.push('FILTER('+"?"+this.endNodeVar+' <'+equalsign+' '+"?"+this.startSecondNodeVar+' || '+"?"+this.startNodeVar+' >'+equalsign+' '+"?"+this.endSecondNodeVar+')');
          break;

      case 'overlap':
          filters.push('FILTER((('+"?"+this.endSecondNodeVar+' >'+equalsign+' '+"?"+this.startNodeVar+') && ('+"?"+this.startSecondNodeVar+' <'+equalsign+' '+"?"+this.endNodeVar+
          ')) || (('+"?"+this.startSecondNodeVar+' <'+equalsign+' '+"?"+this.endNodeVar+') && ('+"?"+this.endSecondNodeVar+' >'+equalsign+' '+"?"+this.startNodeVar+')))');
          break;

      case 'near':
        console.log('sorry, near query is not implemanted yet !');
        return;

      default:
        throw new Error("buildPositionableConstraintsGraph: unkown type: "+this.type);
    }
    */
    this.setFiltersOperator(filters,this.startNodeVar,this.startSecondNodeVar,this.endNodeVar,this.endSecondNodeVar);
  }

  instanciateVariateSPARQL(variates) {

  }


}
