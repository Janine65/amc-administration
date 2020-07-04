
// "Register" this module with wxAMC.
wxAMC.registeredModules.push("Anlaesse");


wxAMC.moduleClasses.Anlaesse = class {


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

  mark_kegeln (value, config) {
    if (value.istkegeln == 1) {
      return "<span class='webix_icon mdi mdi-checkbox-marked'></span>";
    } else {
      return "<span class='webix_icon mdi mdi-checkbox-blank-outline'></span>";
    }
  }
  
   mark_nachkegeln (value, config) {
    if (value.nachkegeln == 1) {
      return "<span class='webix_icon mdi mdi-checkbox-marked'></span>";
    } else {
      return "<span class='webix_icon mdi mdi-checkbox-blank-outline'></span>";
    }
  }
  
  show_vorjahr (value, config) {
    if (value.anlaesseId != "" && value.anlaesseId != null ) {
      return value.anlaesseId;
    } else return "";
  }



  /**
   * Return the module's UI config object.
   */
  getUIConfig() {

    return {
      winWidth : 800, winHeight : 800, winLabel : "Anlaesse", winIcon : "mdi mdi-calendar-check",
      id : "moduleAnlaesse-container",
      cells : [
        /* ---------- Anlass list cell. ---------- */
        { id : "moduleAnlaesse-itemsCell",
          rows : [
            { view : "datatable", id : "moduleAnlaesse-items",
            css:"webix_header_border webix_data_border", 
            select:true, autofit:true,
            resizeColumn: { headerOnly:true},
            scroll:true, 
            editable:false, 
            columns:[
              { id:"datum", header:[{text:"Datum"},{content:"textFilter"}], sort:"date", adjust:true, format:webix.i18n.dateFormatStr},
              { id:"name", header:[{text:"Name"},{content:"textFilter"}], sort:"string", adjust:true},
              { id:"punkte", header:[{text:"Punkte"},{content:"textFilter"}], sort:"int", adjust:true},
              { id:"gaeste", header:[{text:"Gäste"},{content:"textFilter"}], sort:"int", adjust:true},
              { id:"istkegeln", css:{'text-align':'center'}, header:[{text:"Kegeln?"},{content:"selectFilter"}], sort:"text", template:this.mark_kegeln},
              { id:"nachkegeln", css:{'text-align':'center'},header:[{text:"Nachkegeln?"},{content:"selectFilter"}], sort:"text", template:this.mark_nachkegeln},		
              { id:"beschreibung", header:[{text:"Beschreibung"},{content:"textFilter"}], sort:"string", adjust:"header"},
              { id:"anlaesseId", header:[{text:"Vorjahres Termin"},{content:"selectFilter"}], sort:"text", adjust:"header", template:this.show_vorjahr}  
            ],
            hover: "hoverline",
            sort:"multi",
            on : {
               onBeforeLoad:function(){
                this.showOverlay("Loading...");
              },
              onAfterLoad:function(){
                this.hideOverlay();
                $$("count_anlass").setValue("Anzahl " + this.count());	  
              },
              onAfterSelect:function(selection, preserve){
                $$("moduleAnlaesse-editButton").enable();
                $$("moduleAnlaesse-copyButton").enable();
                $$("moduleAnlaesse-deleteButton").enable();
              }
              }
            },
            /* Anlass list toolbar. */
            { view : "toolbar",
            cols : [
              { id: "count_anlass", view : "label", label: "Anzahl 0"},
              { },
              { id: "moduleAnlaesse-editButton", view : "button", default : true, label : "Edit", width : "80", type : "iconButton", disabled: true,
                icon : "webix_icon mdi mdi-pencil", click : this.editExisting.bind(this)
              },
              { id: "moduleAnlaesse-copyButton", view : "button", label : "Copy", width : "80", type : "iconButton", disabled: true,
                icon : "webix_icon mdi mdi-content-duplicate", click : this.editExisting.bind(this)
              },
              { id : "moduleAnlaesse-deleteButton", view : "button", label : "Delete", width : "80", type : "iconButton", disabled: true,
              icon : "webix_icon mdi mdi-delete", click : () => { wxAMC.deleteHandler("Anlaesse"); }
              },
              { id: "moduleAnlaesse-newButton", view : "button", label : "New", width : "80", type : "iconButton",
                icon : "webix_icon mdi mdi-plus", click : this.newHandler.bind(this)
              },
              { width : 6 }
            ] /* End toolbar items. */
            } /* End toolbar. */
          ] /* End anlass list rows. */
        }, /* End anlass list cell. */
        /* ---------- Anlass details cell. ---------- */
        { id : "moduleAnlaesse-details",
          rows : [
            /* Anlass details form. */
            { view : "form", id : "moduleAnlaesse-detailsForm", borderless : true,
              elementsConfig : { view : "text", labelWidth : 100, bottomPadding : 20,
                on : { onChange : () => {
                  $$("moduleAnlaesse-saveButton")[$$("moduleAnlaesse-detailsForm").validate() ?
                    "enable" : "disable"]();
                } }
              },
              elements : [
                { view: "datepicker", name : "datum", label : "Datum", required : true,
                  invalidMessage : "Datum ist notwendig"
                },
                { view : "text", name : "name", label : "Anlass", required : true,
                  invalidMessage: "Anlass ist notwendig"
                },
                { view:"text", type:"number", name : "punkte", label : "Punkte", required : true,
                  invalidMessage: "Punkte ist notwendig"
                },
                { view:"text", type:"number", name : "gaeste", label : "Anzahl Gäste"
                },
                { name : "beschreibung", label : "Beschreibung", view : "textarea"
                },
                { view : "radio", name : "istkegeln", label : "Kegeln?", value : 0,
                  options : [
                    { id : 0, value : "Nein" }, { id : 1, value : "Ja" }
                  ]
                },
                { view : "radio", name : "nachkegeln", label : "Nachkegeln?", value : 0,
                  options : [
                    { id : 0, value : "Nein" }, { id : 1, value : "Ja" }
                  ]
                }
              ]
            }, /* End anlass details form. */
            { },
            /* Anlass details toolbar. */
            { view : "toolbar",
              cols : [
                { width : 6 },
                { view : "button", label : "Zurück", width : "170",
                  type : "iconButton", icon : "webix_icon mdi mdi-arrow-left",
                  click : () => {
                    $$("moduleAnlaesse-itemsCell").show();
                  }
                },
                { },
                { view : "button", label : "Save", width : "80",
                  type : "iconButton", icon : "webix_icon mdi mdi-content-save",
                  id : "moduleAnlaesse-saveButton", disabled : true,
                  click : function() {
                    wxAMC.saveHandler("Anlaesse", [ "moduleAnlaesse-detailsForm" ]);
                  }
                },
                { width : 6 }
              ]
            } /* End anlass details toolbar. */
          ] /* End anlass details cell rows. */
        } /* End anlass details cellw. */
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
   * Handle clicks on the New button.
   */
  newHandler() {

    // We're adding a new anlass, so set the editing flag and create an ID.
    wxAMC.isEditingExisting = false;
    wxAMC.editingID = new Date().getTime();

    // Now show the details form and clear it, then set any defaults.  Don't
    // forget to disable the delete button since we obviously can't delete
    // during an add.
    $$("moduleAnlaesse-details").show();
    $$("moduleAnlaesse-detailsForm").clear();
    $$("moduleAnlaesse-detailsForm").elements.istkegeln.data.value = 0;
    $$("moduleAnlaesse-detailsForm").elements.nachkegeln.data.value = 0;
    $$("moduleAnlaesse-deleteButton").disable();

  } /* End newHandler(). */


  /**
   * Handles clicks on the Save button.
   */
  editExisting(inID) {

    const anlass = $$('moduleAnlaesse-items').getSelectedItem();

    // Set flag to indicate editing an existing anlass and show the details.
    wxAMC.isEditingExisting = true;
    wxAMC.editingID = anlass.id;

    // Clear the details form.
    $$("moduleAnlaesse-detailsForm").clear();

    // Show the form.  Note that this has to be done before the call to
    // setValues() below otherwise we get an error due to setting the value of
    // the richtext (my guess is it lazy-builds the DOM and it's not actually
    // there until the show() executes.
    $$("moduleAnlaesse-details").show();

    // Special handling for dates.
      anlass.datum = new Date(anlass.datum);

    // Populate the form.
    $$("moduleAnlaesse-detailsForm").setValues(anlass);

    // Finally, enable the delete button.
    $$("moduleAnlaesse-deleteButton").enable();

   } /* End editExisting(). */


  /**
   * Refresh the anlaesse list from local storage.
   */
  refreshData() {

    // Get the collection of data items from local storage.  If none,
    // create it now.
//    const dataItems = wxAMC.getModuleData("Anlaesse");
    const url = "/Anlaesse/data";
   // var dataItems;

    const promiseModule = fetch(url)
      .then(function(response) {
        //console.log(response);
        return response.json();
      }).catch(function(error) {
        webix.message({ type:"error", text: error})
  });
  Promise.resolve(promiseModule)
  .then(function(dataItems) {
    //console.log('dataItems: ',dataItems);
    // Get the items as an array of objects.
    const itemsAsArray = wxAMC.objectAsArray(dataItems);

    // Sort the array by the value property (ascending) so they appear in
    // alphabetical order.
    wxAMC.sortArray(itemsAsArray, "datum", "D");

    //console.log('itemsAsArray: ',itemsAsArray);
    // Populate the tree.
    $$("moduleAnlaesse-items").clearAll();
    $$("moduleAnlaesse-items").parse(itemsAsArray);

  });

} /* End refreshData(). */


  /**
   * Service requests from day-at-a-glance to present data for this module.
   */
  dayAtAGlance() {

    // Add a section to the day-at-a-glance body for this module if there isn't one already.
    if (!$$("dayAtAGlanceScreen_Anlaesse")) {
      $$("dayAtAGlanceBody").addView({
        view : "fieldset", label : "Anlaesse", 
        body : { id: "dayAtAGlanceScreen_Anlaesse", cols: [ ] }
      });
      $$("dayAtAGlanceBody").addView({ height : 20 });
    } 

    // Populate the day-at-a-glance screen.
    var rows = [ ];

    const promiseModule = fetch("/Anlaesse/getOverviewData")
      .then((response) => response.json())
      .catch((e) => webix.message({ type:"error", text: e}));

    Promise.resolve(promiseModule)
    .then(totals => {
      totals.forEach(total => {
        rows.push(
          { view:"fieldset", label: total.label, body: { 
            rows : [ 
              {view: "label", label : total.value}
            ]}
          });
      })
    })
    .then(function(){
      //console.log(rows);
      webix.ui (rows, $$("dayAtAGlanceScreen_Anlaesse"));
    })
    .catch((e) => webix.message({ type:"error", text: e}));


  } /* End dayAtAGlance(). */

}; /* End Anlaesse class. */
