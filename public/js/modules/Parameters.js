// "Register" this module with wxAMC.
wxAMC.registeredModules.push("Parameters");


wxAMC.moduleClasses.Parameters = class {


  /**
   * Constructor.
   */
  constructor() {

    // Flag set to true when editing an existing item, false when adding a new one.
    this.isEditingExisting = false;

    // The ID of the item being edited in the current module, if any.
    this.editingID = null;

    // Store the adressen for the selected date, if any.
    this.currentData = { };

  } /* End constructor. */


/**
   * Return the module's UI config object.
   */
  getUIConfig() {
    var elements = [{id: "SYSTEM", label: "Systemparameter", type: "label"},];
    elements.push();
    wxAMC.parameter.forEach((value, key) => {
      elements.push({id:key , label: key , type: "text", value: value},);
    });
    elements.push({ id: "USER", label: "Andere", type: "label"});

    return {
      winWidth : 300, winHeight : 300, winLabel : "Parameters", winIcon : "mdi mdi-clipboard-list-outline",
      id : "moduleParameters-container",
      cells : [
        /* ---------- Param list cell. ---------- */
        { id : "moduleParameters-itemsCell",
          rows : [
            { view : "property", id : "moduleParameters-items",
            css:"webix_header_border webix_data_border", 
            select:true, autofit:true,
            resizeColumn: { headerOnly:true},
            scroll:true, 
            editable:true,
            elements: elements,
            hover: "hoverline",
            on : {
              onAfterEditStop:function(){
                $$("moduleParameters-saveButton").enable();
              }
              }
            },
            /* Param list toolbar. */
            { view : "toolbar",
            cols : [
              { id: "count_param", view : "label", label: "Anzahl 1"},
              { },
              { view : "button", label : "Save", width : "80",
                type : "icon", icon : "webix_icon mdi mdi-content-save",
                id : "moduleParameters-saveButton", disabled : true,
                click : this.saveParameters.bind(this)
              },
              { width : 6 }
            ] /* End toolbar items. */
            } /* End toolbar. */
          ] /* End param list rows. */
        }, /* End param list cell. */
      ] /* End main layout cells. */
    };

  } /* End getUIConfig(). */


  /**
   * Called whenever this module becomes active.
   */
  activate() {
  } /* End activate(). */


  /**
   * Called whenever this module becomes inactive.
   */
  deactivate() {
  } /* End deactivate(). */



  /**
   * Refresh the parameters list from local storage.
   */
  refreshData() {  

} /* End refreshData(). */


  /**
   * Save the parameters to the database
   */

  saveParameters() {
    var mUpdate = new Map();

    wxAMC.parameter.forEach((value, key) => 
      mUpdate.set(key, $$("moduleParameters-items").getItem(key).value)
    );
    console.log(mUpdate);

      webix.html.addCss(webix.confirm({
        title : `Please Confirm`, ok : "Yes", cancel : "No", type : "confirm-warning",
        text : `Are you sure you want to update this item?`, width : 300,
        callback : function(inResult) {
          if (inResult) {
            const url = "/Parameters/data/";
            fetch(url, {
              method: 'PUT', // *GET, POST, PUT, DELETE, etc.
              mode: 'cors', // no-cors, *cors, same-origin
              cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
              credentials: 'same-origin', // include, *same-origin, omit
              headers: {
                // 'Content-Type': 'application/x-www-form-urlencoded'
                'Content-Type': 'application/json'
              },
              redirect: 'follow', // manual, *follow, error
              referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
              body: mUpdate // body data type must match "Content-Type" header
            })
            .then((response) => response.json())
            .then(function(){
                // Refresh the module's summary list and return to that list.
                wxAMC.modules['Parameters'].refreshData();
                // Give the day-at-a-glance screen a chance to update (needed for desktop mode).
                wxAMC.dayAtAGlance();
                // Finally, show a completion message.
                webix.message({ type : "success", text : "gesichert" });
              })
            .catch((e) => webix.message({ type:"error", text: e}));      
          }  
        }
      }), "animated bounceIn");
    
  } /* End saveParameters */


  /**
   * Service requests from day-at-a-glance to present data for this module.
   */
  dayAtAGlance() {

    // Add a section to the day-at-a-glance body for this module if there isn't one already.
    if (!$$("dayAtAGlanceScreen_Parameters")) {
      $$("dayAtAGlanceBody").addView({
        view : "fieldset", label : "Parameters", 
        body : { id: "dayAtAGlanceScreen_Parameters", cols: [ ] }
      });
      $$("dayAtAGlanceBody").addView({ height : 20 });
    } 

    // Populate the day-at-a-glance screen.
    var rows = [ ];
    rows.push( 
        { view:"fieldset", label: "Clubjahr", body: 
          { rows : 
              [ { view: "label", label : wxAMC.parameter.get('CLUBJAHR') }
              ] 
          }
        }
    );
    webix.ui (rows, $$("dayAtAGlanceScreen_Parameters"));
  } /* End dayAtAGlance(). */

}; /* End Parameters class. */
