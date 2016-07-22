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
    let taxonNodeId = node.categories[info[node.uri].taxon].SPARQLid;
    let refNodeId = node.categories[info[node.uri].ref].SPARQLid;
    let startNodeId = node.attributes[info[node.uri].start].SPARQLid;
    let endNodeId = node.attributes[info[node.uri].end].SPARQLid;

    let taxonSecNodeId = secondNode.categories[info[secondNode.uri].taxon].SPARQLid;
    let refSecNodeId = secondNode.categories[info[secondNode.uri].ref].SPARQLid;
    let startSecNodeId = secondNode.attributes[info[secondNode.uri].start].SPARQLid;
    let endSecNodeId = secondNode.attributes[info[secondNode.uri].end].SPARQLid;


    constraintRelations.push([ua.URI(node.uri),'displaySetting:position_taxon',"?"+"id_taxon_"+node.SPARQLid]);
    constraintRelations.push([ua.URI(node.uri),'displaySetting:position_reference',"?"+"id_ref_"+node.SPARQLid]);
    constraintRelations.push([ua.URI(node.uri),'displaySetting:position_start',"?"+"id_start_"+node.SPARQLid]);
    constraintRelations.push([ua.URI(node.uri),'displaySetting:position_end',"?"+"id_end_"+node.SPARQLid]);

    constraintRelations.push([ua.URI(secondNode.uri),'displaySetting:position_taxon',"?"+"id_taxon_"+secondNode.SPARQLid]);
    constraintRelations.push([ua.URI(secondNode.uri),'displaySetting:position_reference',"?"+"id_ref_"+secondNode.SPARQLid]);
    constraintRelations.push([ua.URI(secondNode.uri),'displaySetting:position_start',"?"+"id_start_"+secondNode.SPARQLid]);
    constraintRelations.push([ua.URI(secondNode.uri),'displaySetting:position_end',"?"+"id_end_"+secondNode.SPARQLid]);

    /* constrainte to target the same ref/taxon */

    constraintRelations.push(["?"+'URI'+node.SPARQLid,"?"+"id_taxon_"+node.SPARQLid,"?"+taxonNodeId]);
    constraintRelations.push(["?"+'URI'+node.SPARQLid,"?"+"id_ref_"+node.SPARQLid,"?"+refNodeId]);

    constraintRelations.push(["?"+'URI'+secondNode.SPARQLid,"?"+"id_taxon_"+secondNode.SPARQLid,"?"+taxonSecNodeId]);
    constraintRelations.push(["?"+'URI'+secondNode.SPARQLid,"?"+"id_ref_"+secondNode.SPARQLid,"?"+refSecNodeId]);

    /* manage start and end variates */
    constraintRelations.push(["?"+'URI'+node.SPARQLid,"?"+"id_start_"+node.SPARQLid,"?"+startNodeId]);
    constraintRelations.push(["?"+'URI'+node.SPARQLid,"?"+"id_end_"+node.SPARQLid,"?"+endNodeId]);

    constraintRelations.push(["?"+'URI'+secondNode.SPARQLid,"?"+"id_start_"+secondNode.SPARQLid,"?"+startSecNodeId]);
    constraintRelations.push(["?"+'URI'+secondNode.SPARQLid,"?"+"id_end_"+secondNode.SPARQLid,"?"+endSecNodeId]);
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

    let taxonNodeId = node.categories[info[node.uri].taxon].SPARQLid;
    let refNodeId = node.categories[info[node.uri].ref].SPARQLid;
    let startNodeId = node.attributes[info[node.uri].start].SPARQLid;
    let endNodeId = node.attributes[info[node.uri].end].SPARQLid;

    let taxonSecNodeId = secondNode.categories[info[secondNode.uri].taxon].SPARQLid;
    let refSecNodeId = secondNode.categories[info[secondNode.uri].ref].SPARQLid;
    let startSecNodeId = secondNode.attributes[info[secondNode.uri].start].SPARQLid;
    let endSecNodeId = secondNode.attributes[info[secondNode.uri].end].SPARQLid;

    alert(this.sameRef);
    if (this.sameRef) {
      filters.push('FILTER(' + "SAMETERM(?"+refNodeId + "," + "?"+refSecNodeId +'))');
    }

    if (this.sameTax) {
      filters.push('FILTER(' + "SAMETERM(?"+taxonNodeId + "," + "?"+taxonSecNodeId +'))');
    }

    switch(this.type) {
      case 'included' :
          filters.push('FILTER((?'+startSecNodeId+' >'+equalsign+' ?'+startNodeId+') && (?'+endSecNodeId+' <'+equalsign+' ?'+endNodeId+'))');
          break;
      case 'excluded':
          filters.push('FILTER(?'+endNodeId+' <'+equalsign+' ?'+startSecNodeId+' || ?'+startNodeId+' >'+equalsign+' ?'+endSecNodeId+')');
          break;

      case 'overlap':
          filters.push('FILTER(((?'+endSecNodeId+' >'+equalsign+' ?'+startNodeId+') && (?'+startSecNodeId+' <'+equalsign+' ?'+endNodeId+')) || ((?'+startSecNodeId+' <'+equalsign+' ?'+endNodeId+') && (?'+endSecNodeId+' >'+equalsign+' ?'+startNodeId+')))');
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
