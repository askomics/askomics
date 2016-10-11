/*jshint esversion: 6 */
/*jshint multistr:true */

/* */
class InterfaceParametersView  {

  constructor() {

  }

  configuration(keyword) {

    if ( this.config === undefined ) {
      throw "InterfaceParametersView::configuration Classes extends InterfaceParametersView have to defined a config property !";
    }

    if ( ! (keyword in this.config))
      throw "GOParametersView::configuration unkown keyword:"+keyword;

    return this.config[keyword];
  }

  /* Build an input for parameters views */
  createInput(label,configKey) {
    let div = $("<div></div>").addClass("row");
    let lab = $("<label></label>").html(label);
    let inp = $("<input/>")
                      .attr("type", "text")
                      .val(this.configuration(configKey))
                      .addClass("form-control");

    let currentInterface = this;

    inp.change(function(d) {
      currentInterface.config[configKey] = $(this).val();
    });

    div.append(lab);
    div.append(inp);
    return div;
  }

  /* Build a select for parameters views */
  createSelect(label,configKey,listOptionsValue,listOptionsText) {

    if ( listOptionsValue.length != listOptionsText.length ) {
      throw "TriplestoreParametersView::createSelect bads arguments with option list ";
    }

    let div = $("<div></div>").addClass("row");
    let lab = $("<label></label>").html(label);
    let sel = $("<select/>").addClass("form-control");

    for (let iOpt in listOptionsValue) {
      let option = $('<option/>').attr('value',listOptionsValue[iOpt]).text(listOptionsText[iOpt]);

      if ( listOptionsValue[iOpt] === this.config[configKey])
        option.attr("selected", "selected");

      sel.append(option);
    }

    let currentInterface = this;

    sel.change(function(d) {
      currentInterface.config[configKey] = $(this).val();
    });

    div.append(lab);
    div.append(sel);
    return div;
  }

  /* Build an input for parameters views */
  createTextArea(label,configKey,buttonLabel,actionClick) {
    let div = $("<div></div>").addClass("row");
    let lab = $("<label></label>").html(label);
    let textArea = $("<textarea/>")
            .attr("row", "5")
            .val(this.configuration(configKey))
            .addClass("form-control");

    let currentInterface = this;

    textArea.change(function(d) {
        currentInterface.config[configKey] = $(this).val();
    });

    let button = $('<button></button>')
                  .addClass('btn')
                  .addClass('btn-default')
                  .text(buttonLabel)
                  .on('click',actionClick);


    div.append(lab);
    div.append(textArea);
    div.append(button);
    return div;
  }
}
