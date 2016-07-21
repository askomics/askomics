/*jshint esversion: 6 */

class AskomicsPositionableLink extends AskomicsLink {

  constructor(uriL,sourceN,targetN) {
    super(uriL,sourceN,targetN);

    this.type     = 'included' ;
    this.label    = 'included in';
    this.sameTax  =  true ;
    this.sameRef  =  true ;
    this.strict   =  true ;
  }
  setjson(obj) {
    super.setjson(obj);
    this.type     = obj.type ;
    this.label    = obj.label;
    this.sameTax  =  obj.sameTax ;
    this.sameRef  =  obj.sameRef ;
    this.strict   =  obj.strict ;
  }
  getPanelView() {
    return new AskomicsPositionableLinkView(this);
  }

  getFillColor() { return 'darkgreen'; }

  buildConstraintsSPARQL(constraintRelations) {

    let node = this.target ;
    let secondNode = this.source ;
    let ua = userAbstraction;

    let info = ua.getPositionableEntities();

    /* constrainte to target the same ref/taxon */

    constraintRelations.push(["?"+'URI'+node.SPARQLid+" :position_taxon ?taxon_"+node.SPARQLid]);
    constraintRelations.push(["?"+'URI'+node.SPARQLid+" :position_ref ?ref_"+node.SPARQLid]);

    constraintRelations.push(["?"+'URI'+secondNode.SPARQLid+" :position_taxon ?taxon_"+secondNode.SPARQLid]);
    constraintRelations.push(["?"+'URI'+secondNode.SPARQLid+" :position_ref ?ref_"+secondNode.SPARQLid]);

    /* manage start and end variates */
    constraintRelations.push(["?"+'URI'+node.SPARQLid+" :position_start ?start_"+node.SPARQLid]);
    constraintRelations.push(["?"+'URI'+node.SPARQLid+" :position_end ?end_"+node.SPARQLid]);

    constraintRelations.push(["?"+'URI'+secondNode.SPARQLid+" :position_start ?start_"+secondNode.SPARQLid]);
    constraintRelations.push(["?"+'URI'+secondNode.SPARQLid+" :position_end ?end_"+secondNode.SPARQLid]);
  }

  buildFiltersSPARQL(filters) {
    let equalsign = '';
    let ua = userAbstraction;

    if (!this.strict) {
      equalsign = '=';
    }

    let node = this.target ;
    let secondNode = this.source ;
    let info = ua.getPositionableEntities();

    if (this.same_ref) {
      filters.push('FILTER(?ref_'+node.SPARQLid+' = ?ref_'+secondNode.SPARQLid+')');
    }

    if (this.same_tax) {
      filters.push('FILTER(?taxon_'+node.SPARQLid+' = ?taxon_'+secondNode.SPARQLid+')');
    }

    switch(this.type) {
      case 'included' :
          filters.push('FILTER((?start_'+secondNode.SPARQLid+' >'+equalsign+' start_'+node.SPARQLid+' ) && (?end_'+secondNode.SPARQLid+' <'+equalsign+' ?end_'+node.SPARQLid+'))');
          //filters.push('FILTER((?'+startSecNodeId+' >'+equalsign+' ?'+startNodeId+') && (?'+endSecNodeId+' <'+equalsign+' ?'+endNodeId+'))');
          break;
      case 'excluded':
          filters.push('FILTER(?end_'+node.SPARQLid+' <'+equalsign+' ?start_'+secondNode.SPARQLid+' || ?start_'+node.SPARQLid+' >'+equalsign+' ?end_'+secondNode.SPARQLid+')');
          break;

      case 'overlap':
          filters.push('FILTER(((?end_'+secondNode.SPARQLid+' >'+equalsign+' ?start_'+node.SPARQLid+') && (?start_'+secondNode.SPARQLid+' <'+equalsign+' ?end_'+node.SPARQLid+')) || ((?start_'+secondNode.SPARQLid+' <'+equalsign+' ?end_'+node.SPARQLid+') && (?end_'+secondNode.SPARQLid+' >'+equalsign+' ?start_'+node.SPARQLid+')))');
          break;

      case 'near':
        alert('sorry, near query is not implemanted yet !');
        hideModal();
        exit();
          break;

      default:
        throw new Error("buildPositionableConstraintsGraph: unkown type :"+JSON.stringify(type));
    }
  }

  instanciateVariateSPARQL(variates) {

  }


}
