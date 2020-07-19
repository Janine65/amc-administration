
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

  
  show_vorjahr (value, config) {
    if (value.linkedEvent != null ) {
      return value.linkedEvent.longname;
    } else return "";
  }

 custom_status(obj, common, value){
    if (value)
        return "<div class=' custom checked'> Aktiv </div>";
    else
        return "<div class=' custom notchecked'> Inaktiv </div>";
};

custom_checkbox(obj, common, value){
  if (value)
      return "<div class='webix_icon mdi mdi-checkbox-marked'></div>";
  else
      return "<div class='webix_icon mdi mdi-checkbox-blank-outline'></div>";
};

/**
   * Return the module's UI config object.
   */
  getUIConfig() {

    return {
      winWidth : 1000, winHeight : 800, winLabel : "Anlässe", winIcon : "mdi mdi-calendar-check",
      id : "moduleAnlaesse-container",
      cells : [
        /* ---------- Anlass list cell. ---------- */
        { id : "moduleAnlaesse-itemsCell",
          rows : [
            {
              view:"select", value: wxAMC.parameter.get('CLUBJAHR'), label: "Jahr wählen:",
              id:"datumSelect",
              options:[
                {"id":(parseInt(wxAMC.parameter.get('CLUBJAHR'))-1), value:parseInt(wxAMC.parameter.get('CLUBJAHR'))-1},
                {"id":parseInt(wxAMC.parameter.get('CLUBJAHR')), value:parseInt(wxAMC.parameter.get('CLUBJAHR')), selected: true},
                {"id":(parseInt(wxAMC.parameter.get('CLUBJAHR'))+1), value:parseInt(wxAMC.parameter.get('CLUBJAHR'))+1}
              ],
              on: {
                onViewShow: function() {
                  $$("moduleAnlaesse-items").filterByAll();
                },
                onChange: function() {
                  $$("moduleAnlaesse-items").filterByAll();
                }
              }
            },
            { view : "datatable", id : "moduleAnlaesse-items",
            css:"webix_header_border webix_data_border", 
            select:true, autofit:true,
            resizeColumn: { headerOnly:true},
            scroll:true, 
            editable:false, 
            scheme:{
              $change:function(item){
                if (item.status == 0)
                  item.$css = "inactiveLine";
              }
            },
            columns:[
              { id:"datum", header:[{text:"Datum"}], adjust:true, format:webix.i18n.dateFormatStr},
              { id:"name", header:[{text:"Name"}],  adjust:true},
              { id:"status", header:[{text:"Status"}], adjust:true, template:this.custom_status},
              { id:"punkte", header:[{text:"Punkte"}], adjust:true},
              { id:"gaeste", header:[{text:"Gäste"}],  adjust:true},
              { id:"istkegeln", css:{'text-align':'center'}, header:[{text:"Kegeln?"}], template:this.custom_checkbox},
              { id:"nachkegeln", css:{'text-align':'center'},header:[{text:"Nachkegeln?"}], template:this.custom_checkbox},		
              { id:"beschreibung", header:[{text:"Beschreibung"}], adjust:"header"},
              { id:"longname", header:[{text:"Vorjahres Termin"}], adjust:true, template:this.show_vorjahr}  
            ],
            hover: "hoverline",
            on : {
              onViewShow:function(){
                this.filterByAll();
              },
               onBeforeLoad:function(){
                this.showOverlay("Loading...");
              },
              onAfterLoad:function(){
                this.hideOverlay();
                $$("count_anlass").setValue("Anzahl " + this.count());	  
                $$("moduleAnlaesse-items").registerFilter(
                  $$("datumSelect"),  
                  { columnId:"datum" },
                  {  
                    getValue:function(view){
                      return view.getValue();
                    },
                    setValue:function(view, value){
                      view.setValue(value)
                    }
                  }
                );
              },
              onAfterFilter:function(){
                $$("count_anlass").setValue("Anzahl " + this.count());	  
              },
              onAfterSelect:function(selection, preserve){
                $$("moduleAnlaesse-editButton").enable();
                $$("moduleAnlaesse-copyButton").enable();
                $$("moduleAnlaesse-deleteButton").enable();
              },
              onItemDblClick:function(selection, preserve){
                wxAMC.modules['Anlaesse'].editExisting();
              }
              }
            },
            /* Anlass list toolbar. */
            { view : "toolbar",
            cols : [
              { id: "count_anlass", view : "label", label: "Anzahl 0"},
              { },
              { id: "moduleAnlaesse-editButton", view : "button", default : true, label : "Edit", width : "80", type : "icon", disabled: true,
                icon : "webix_icon mdi mdi-pencil", click : this.editExisting.bind(this)
              },
              { id: "moduleAnlaesse-copyButton", view : "button", label : "Copy", width : "80", type : "icon", disabled: true,
                icon : "webix_icon mdi mdi-content-duplicate", click : this.copyHandler.bind(this)
              },
              { id : "moduleAnlaesse-deleteButton", view : "button", label : "Delete", width : "80", type : "icon", disabled: true,
              icon : "webix_icon mdi mdi-delete", click : () => { wxAMC.deleteHandler("Anlaesse"); }
              },
              { id: "moduleAnlaesse-newButton", view : "button", label : "New", width : "80", type : "icon",
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
            { view : "form", id : "moduleAnlaesse-detailsForm", borderless : false, scroll: true,
              elementsConfig : { view : "text", labelWidth : 100, 
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
                { view:"combo", 
                options:[{ id:"0", value:"Inaktiv" }, { id:"1", value:"Aktiv" }], 
                  name : "status", label : "Status"
                },
                { view:"text", type:"number", name : "punkte", label : "Punkte", required : true,
                  invalidMessage: "Punkte ist notwendig"
                },
                { view:"text", type:"number", name : "gaeste", label : "Anzahl Gäste"
                },
                { name : "beschreibung", label : "Beschreibung", view : "textarea", height: 100
                },
                { view : "radio", name : "istkegeln", label : "Kegeln?", value : "0",
                  options : [
                    { id : 0, value : "Nein" }, { id : 1, value : "Ja" }
                  ]
                },
                { view : "radio", name : "nachkegeln", label : "Nachkegeln?", value : "0",
                  options : [
                    { id : 0, value : "Nein" }, { id : 1, value : "Ja" }
                  ]
                },
                { view:"combo", suggest:"/Anlaesse/getFkData", name:"anlaesseId", label:"Vorjahresevent" }
              ]
            }, /* End anlass details form. */
            //{ },
            /* Anlass details toolbar. */
            { view : "toolbar",
              cols : [
                { width : 6 },
                { view : "button", label : "Zurück", width : "90",
                  type : "icon", icon : "webix_icon mdi mdi-arrow-left",
                  click : () => {
                    $$("moduleAnlaesse-itemsCell").show();
                  }
                },
                { },
                { view : "button", label : "Save", width : "80",
                  type : "icon", icon : "webix_icon mdi mdi-content-save",
                  id : "moduleAnlaesse-saveButton", disabled : true,
                  click : function() {
                    wxAMC.saveHandler("Anlaesse", "moduleAnlaesse-detailsForm");
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
     this.refreshData();
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
    this.isEditingExisting = false;
    this.editingID = 0;

    // Now show the details form and clear it, then set any defaults.  Don't
    // forget to disable the delete button since we obviously can't delete
    // during an add.
    $$("moduleAnlaesse-details").show();
    $$("moduleAnlaesse-detailsForm").clear();
    $$("moduleAnlaesse-detailsForm").elements.istkegeln.data.value = 0;
    $$("moduleAnlaesse-detailsForm").elements.nachkegeln.data.value = 0;
    $$("moduleAnlaesse-detailsForm").elements.punkte.data.value = 50;
    $$("moduleAnlaesse-deleteButton").disable();

  } /* End newHandler(). */


  copyHandler() {

    // We're adding a new anlass, but with the value of the selected one.
    this.isEditingExisting = false;
    this.editingID = 0;

    const anlassOrig = $$('moduleAnlaesse-items').getSelectedItem();
    console.log(anlassOrig);
    var anlass = [];
    anlass.id = null;
    var datum = new Date(anlassOrig.datum);
    datum.setUTCFullYear(new Date(anlassOrig.datum).getUTCFullYear()+1);
    anlass.datum = datum;
    anlass.name = anlassOrig.name;
    anlass.beschreibung = anlassOrig.beschreibung;
    anlass.istkegeln = anlassOrig.istkegeln;
    anlass.nachkegeln = anlassOrig.nachkegeln;
    anlass.punkte = anlassOrig.punkte;
    anlass.anlaesseId = anlassOrig.id;

    // Now show the details form and clear it, then set any defaults.  Don't
    // forget to disable the delete button since we obviously can't delete
    // during an add.
    $$("moduleAnlaesse-details").show();
    $$("moduleAnlaesse-detailsForm").clear();
    // Populate the form.
    $$("moduleAnlaesse-detailsForm").setValues(anlass);
    $$("moduleAnlaesse-detailsForm").setDirty(true);
    $$("moduleAnlaesse-deleteButton").disable();

  } /* End newHandler(). */

  /**
   * Handles clicks on the Save button.
   */
  editExisting() {

    const anlass = $$('moduleAnlaesse-items').getSelectedItem();

    // Set flag to indicate editing an existing anlass and show the details.
    this.isEditingExisting = true;
    this.editingID = anlass.id;

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
  async refreshData() {

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
  .then(async function(dataItems) {
    // Get the items as an array of objects.
    const itemsAsArray = wxAMC.objectAsArray(dataItems);
    
    // Populate the tree.
    $$("moduleAnlaesse-items").clearAll();
    $$("moduleAnlaesse-items").parse(itemsAsArray);
    var sSelYear = $$("datumSelect").getValue();
    if (sSelYear == "")
      sSelYear = wxAMC.parameter.get('CLUBJAHR');

    await wxAMC.reloadParameters();
    
    $$("datumSelect").options = [
      {"id":(parseInt(wxAMC.parameter.get('CLUBJAHR'))-1), value:parseInt(wxAMC.parameter.get('CLUBJAHR'))-1},
      {"id":parseInt(wxAMC.parameter.get('CLUBJAHR')), value:parseInt(wxAMC.parameter.get('CLUBJAHR'))},
      {"id":(parseInt(wxAMC.parameter.get('CLUBJAHR'))+1), value:parseInt(wxAMC.parameter.get('CLUBJAHR'))+1}
    ];

    $$("datumSelect").setValue(sSelYear);
    $$("moduleAnlaesse-items").filterByAll();
});

} /* End refreshData(). */


  /**
   * Service requests from day-at-a-glance to present data for this module.
   */
  async dayAtAGlance() {

    // Add a section to the day-at-a-glance body for this module if there isn't one already.
    if (!$$("dayAtAGlanceScreen_Anlaesse")) {
      $$("dayAtAGlanceBody").addView({
        view : "fieldset", label : "Anlässe", 
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
