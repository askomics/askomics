/*jshint esversion: 6 */

var static_count_AskomicsPositionableLink = 0;

class AskomicsPositionableLink extends AskomicsLink {

  constructor(link,sourceN,targetN) {
    super(link,sourceN,targetN);
    this._positionable = true;
    this.type         = 'included' ;
    this.label        = 'included in';
    this.same_tax     =  false;
    this.same_ref     =  true;
    this.which_strand =  'same'; // same/opp;
    this.strict       =  true ;

    this.startNodeVar = null ;
    this.endNodeVar   = null ;
    this.startSecondNodeVar = null ;
    this.endSecondNodeVar   = null ;

  }

  setjson(obj,nodes) {
    super.setjson(obj,nodes);
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
    let s = "?s"+node.id+"_"+secondNode.id+"_"+static_count_AskomicsPositionableLink;
    static_count_AskomicsPositionableLink++;
    if (this.same_ref) {
      blockConstraint.push("?"+node.SPARQLid+" "+ "askomics:IsIncludeInRef"+" "+s );
      blockConstraint.push("?"+secondNode.SPARQLid+" "+ "askomics:IsIncludeInRef"+" "+ s);
    } else {
      blockConstraint.push("?"+node.SPARQLid+" "+ "askomics:IsIncludeIn"+" "+ s);
      blockConstraint.push("?"+secondNode.SPARQLid+" "+ "askomics:IsIncludeIn"+" "+ s);
    }

    /* manage start and end variates */
    this.startNodeVar = node.att_position_active("start") ;
    if ( this.startNodeVar === null  ) {
      this.startNodeVar = "start_"+node.SPARQLid;
      blockConstraint.push("?"+node.SPARQLid+" "+ "faldo:location/faldo:begin/faldo:position"+" "+ "?"+this.startNodeVar);
    }
    this.endNodeVar = node.att_position_active("end") ;
    if ( this.endNodeVar === null ) {
      this.endNodeVar = "end_"+node.SPARQLid ;
      blockConstraint.push("?"+node.SPARQLid+" "+ "faldo:location/faldo:end/faldo:position"+" "+ "?"+this.endNodeVar);
    }
    this.startSecondNodeVar = secondNode.att_position_active("start") ;
    if ( this.startSecondNodeVar === null ) {
      this.startSecondNodeVar = "start_"+secondNode.SPARQLid;
      blockConstraint.push("?"+secondNode.SPARQLid+" "+ "faldo:location/faldo:begin/faldo:position"+" "+ "?"+this.startSecondNodeVar);
    }
    this.endSecondNodeVar =  secondNode.att_position_active("end") ;
    if ( this.endSecondNodeVar === null ) {
      this.endSecondNodeVar = "end_"+secondNode.SPARQLid;
      blockConstraint.push("?"+secondNode.SPARQLid+" "+ "faldo:location/faldo:end/faldo:position"+" "+ "?"+this.endSecondNodeVar );
    }

     this.setFiltersOperator(blockConstraint,this.startNodeVar,this.startSecondNodeVar,this.endNodeVar,this.endSecondNodeVar);

    /* constrainte to target the same ref */
    /*
    if (this.same_ref) {
      let att1 = node.att_position_active("ref") ;
      let att2 = secondNode.att_position_active("ref") ;
      if ( att1 === null && att2 === null) {
      } else if ( att1 === null ) {
        blockConstraint.push("?"+node.SPARQLid+" "+ "faldo:location/faldo:begin/faldo:reference"+" "+ "?URICat"+att2);
      } else if ( att2 === null ) {
        blockConstraint.push("?"+secondNode.SPARQLid+" "+ "faldo:location/faldo:begin/faldo:reference"+" "+ "?URICat"+att1);
      } else {
        blockConstraint.push("FILTER ( "+ "?"+att1+"="+"?"+att2+" )");
      }
    }*/

    /* constrainte to target the same taxon */
    if (this.same_tax) {
      let att1 = node.att_position_active("taxon") ;
      let att2 = secondNode.att_position_active("taxon") ;
      if ( att1 === null && att2 === null) {
        blockConstraint.push("?"+node.SPARQLid+" "+ "askomics:position_taxon"+" "+ "?taxon_"+node.SPARQLid+secondNode.SPARQLid);
        blockConstraint.push("?"+secondNode.SPARQLid+" "+ "askomics:position_taxon"+" "+ "?taxon_"+node.SPARQLid+secondNode.SPARQLid);
      } else if ( att1 === null ) {
        blockConstraint.push("?"+node.SPARQLid+" "+ "askomics:position_taxon"+" "+ "?"+att2);
      } else if ( att2 === null ) {
        blockConstraint.push("?"+secondNode.SPARQLid+" "+ "askomics:position_taxon"+" "+ "?"+att1);
      } else {
        blockConstraint.push("FILTER ( "+ "?"+att1+"="+"?"+att2+" )");
      }
    }

    /* constraint to target the same/opposite strand */
    if (this.which_strand == "same" ) {
      let att1 = node.att_position_active("strand") ;
      let att2 = secondNode.att_position_active("strand") ;
      if ( att1 === null && att2 === null) {
        blockConstraint.push("?"+node.SPARQLid+" "+ "askomics:position_strand"+" "+ "?strand_"+node.SPARQLid+secondNode.SPARQLid);
        blockConstraint.push("?"+secondNode.SPARQLid+" "+ "askomics:position_strand"+" "+ "?strand_"+node.SPARQLid+secondNode.SPARQLid);
      } else if ( att1 === null ) {
        blockConstraint.push("?"+node.SPARQLid+" "+ "askomics:position_strand"+" "+ "?"+att2);
      } else if ( att2 === null ) {
        blockConstraint.push("?"+secondNode.SPARQLid+" "+ "askomics:position_strand"+" "+ "?"+att1);
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
          filters.push('FILTER(('+"?"+startVar2+' >'+equalsign+' '+"?"+startVar1+' ) && ('+"?"+endVar2+' <'+equalsign+' '+"?"+endVar1+'))');
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
    //this.setFiltersOperator(filters,this.startNodeVar,this.startSecondNodeVar,this.endNodeVar,this.endSecondNodeVar);
  }

  instanciateVariateSPARQL(variates) {

  }


}
