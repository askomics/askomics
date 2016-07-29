/*jshint esversion: 6 */

class AskomicsPositionableLink extends AskomicsLink {

  constructor(uriL,sourceN,targetN) {
    super(uriL,sourceN,targetN);

    this.type     = 'included' ;
    this.label    = 'included in';
    this.same_tax  =   'undef';
    this.same_ref  =   'undef';
    this.which_strand = 'both' ; // 'both', 'same' or 'opp'
    this.strict   =  false ;
    this.position_taxon = 'undef' ;
    this.position_ref = 'undef' ;
    this.position_strand = 'undef' ;
  }

  setCommonPosAttr() {
    /*  get list of common positionable attributes
        (taxon, ref and strand) */
    let service = new RestServiceJs("positionable_attr");
    let model = { 'node': this.source.uri,
                  'second_node': this.target.uri,
                  'link': this };

    displayModal('Please wait', '', 'Close');
    service.post(model, function(data) {
        if (data.error) {
          throw new Error(data.error);
        }

        model.link.position_taxon = data.results.position_taxon;
        model.link.position_ref = data.results.position_ref;
        model.link.position_strand = data.results.position_strand;

        model.link.same_tax = data.results.position_taxon?true:false;
        model.link.same_ref = data.results.position_ref?true:false;
        hideModal();
    });
  }

  setjson(obj) {
    super.setjson(obj);
    this.type     = obj.type ;
    this.label    = obj.label;
    this.same_tax  =  obj.same_tax ;
    this.same_ref  =  obj.same_ref ;
    this.which_strand = obj.which_strand ;
    this.strict   =  obj.strict ;
    this.position_taxon = obj.position_taxon ;
    this.position_ref = obj.position_ref ;
    this.position_strand = obj.position_strand ;
  }
  getPanelView() {
    return new AskomicsPositionableLinkView(this);
  }

  getTextFillColor() { return 'darkgreen'; }

  buildConstraintsSPARQL(constraintRelations) {

    let node = this.target ;
    let secondNode = this.source ;
    let ua = userAbstraction;

    let info = ua.getPositionableEntities();

    /* constrainte to target the same ref */
    if (this.position_ref) {
      constraintRelations.push(["?"+'URI'+node.SPARQLid, ":position_ref", "?ref_"+node.SPARQLid]);
      constraintRelations.push(["?"+'URI'+secondNode.SPARQLid, ":position_ref", "?ref_"+secondNode.SPARQLid]);
    }

    /* constrainte to target the same taxon */
    if (this.position_taxon) {
      constraintRelations.push(["?"+'URI'+node.SPARQLid, ":position_taxon", "?taxon_"+node.SPARQLid]);
      constraintRelations.push(["?"+'URI'+secondNode.SPARQLid, ":position_taxon", "?taxon_"+secondNode.SPARQLid]);
    }

    /* constraint to target the same/opposite strand */
    if (this.position_strand) {
      constraintRelations.push(["?"+'URI'+node.SPARQLid, ":position_strand", "?strand_"+node.SPARQLid]);
      constraintRelations.push(["?"+'URI'+secondNode.SPARQLid, ":position_strand", "?strand_"+secondNode.SPARQLid]);
    }

    /* manage start and end variates */
    constraintRelations.push(["?"+'URI'+node.SPARQLid, ":position_start", "?start_"+node.SPARQLid]);
    constraintRelations.push(["?"+'URI'+node.SPARQLid, ":position_end", "?end_"+node.SPARQLid]);

    constraintRelations.push(["?"+'URI'+secondNode.SPARQLid, ":position_start", "?start_"+secondNode.SPARQLid]);
    constraintRelations.push(["?"+'URI'+secondNode.SPARQLid, ":position_end", "?end_"+secondNode.SPARQLid]);
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
      //TODO: test which of the following line is the fastest
      filters.push('FILTER(?ref_'+node.SPARQLid+' = ?ref_'+secondNode.SPARQLid+')');
      //filters.push('FILTER(SAMETERM(?ref_'+node.SPARQLid+', ?ref_'+secondNode.SPARQLid+'))');
    }

    if (this.same_tax) {
      //TODO: test which of the following line is the fastest
      filters.push('FILTER(?taxon_'+node.SPARQLid+' = ?taxon_'+secondNode.SPARQLid+')');
      //filters.push('FILTER(SAMETERM(?taxon_'+node.SPARQLid+', ?taxon_'+secondNode.SPARQLid+'))');
    }

    if (this.which_strand == 'same') {
      filters.push('FILTER(?strand_'+node.SPARQLid+' = ?strand_'+secondNode.SPARQLid+')');
    }else if (this.which_strand == 'opp') {
      filters.push('FILTER(?strand_'+node.SPARQLid+' != ?strand_'+secondNode.SPARQLid+')');
    }


    switch(this.type) {
      case 'included' :
          filters.push('FILTER((?start_'+secondNode.SPARQLid+' >'+equalsign+' ?start_'+node.SPARQLid+' ) && (?end_'+secondNode.SPARQLid+' <'+equalsign+' ?end_'+node.SPARQLid+'))');
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
