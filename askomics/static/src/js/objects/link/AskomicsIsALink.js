/*jshint esversion: 6 */

class AskomicsIsALink extends GraphLink {


  constructor(link,sourceN,targetN) {
    super(link,sourceN,targetN);
  }

  setjson(obj,nodes) {
    super.setjson(obj,nodes);
  }

  buildConstraintsSPARQL() {
    return [[],''];
  }

  instanciateVariateSPARQL(variates) {
  }

  getTextFillColor() {
    return 'blue';
  }

  getStrokeColor() {
    return 'blue';
  }

  getClassSVG() {
    return "subclassofClass";
  }

}
