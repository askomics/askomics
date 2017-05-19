/*jshint esversion: 6 */

class AskomicsIsALink extends GraphLink {


  constructor(link,sourceN,targetN) {
    super(link,sourceN,targetN);
  }

  setjson(obj) {
    super.setjson(obj);
  }

  buildConstraintsSPARQL() {
    return [[],''];
  }

  instanciateVariateSPARQL(variates) {
  }

  getTextFillColor() {
    return 'blue';
  }

  getLinkColor() {
    return 'blue';
  }

  getClassSVG() {
    return "subclassofClass";
  }

}
