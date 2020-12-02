// "Register" this module with wxAMC.
wxAMC.registeredModules.push("Meisterschaft");

wxAMC.moduleClasses.Meisterschaft = class {


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

    return {
      winWidth : 1000, winHeight : 800, winLabel : "Meisterschaft Ctrl+M", winIcon : "mdi mdi-numeric", winHotkey: "ctrl+m",
      id : "moduleMeisterschaft-container",
      cells : [
        /* ---------- Anlass list cell. ---------- */
        { id : "moduleMeisterschaft-itemsCell",
          rows : [
            {
              view:"select", value: wxAMC.parameter.get('CLUBJAHR'), label: "Jahr wählen:",
              id:"moduleMeisterschaftdatumSelect",
              options:[
                {"id":(parseInt(wxAMC.parameter.get('CLUBJAHR'))-1), value:parseInt(wxAMC.parameter.get('CLUBJAHR'))-1},
                {"id":parseInt(wxAMC.parameter.get('CLUBJAHR')), value:parseInt(wxAMC.parameter.get('CLUBJAHR')), selected: true},
                {"id":(parseInt(wxAMC.parameter.get('CLUBJAHR'))+1), value:parseInt(wxAMC.parameter.get('CLUBJAHR'))+1}
              ],
              on: {
                onChange: this.refreshData.bind(this)
              }
            },
            {cols: [
              { view: "label", label: "<div style='font-size:20px;'>Clubmeisterschaft</div>"},
              { view: "label", label: "<div style='font-size:20px;'>Kegelmeisterschaft</div>"}
            ]},
            {cols: [
              { view : "datatable", id : "moduleMeisterschaft-Citems",
                css:"webix_header_border webix_data_border", 
                select:true, autofit:true,
                resizeColumn: { headerOnly:true},
                scroll:true, 
                editable:false, 
                columns:[ 
                  { id:"rang", header:[{text:"Rang"}], adjust:true},
                  { id:"punkte", header:[{text:"Punkte"}], adjust:true},
                  { id:"vorname", header:[{text:"Vorname"}],  adjust:true},
                  { id:"nachname", header:[{text:"Nachname"}], adjust:true},
                  { id:"anlaesse", header:[{text:"Anlässe"}], adjust:true},
                  { id:"werbungen", header:[{text:"Werbungen"}],  adjust:true},
                  { id:"mitglieddauer", header:[{text:"Mitglieddauer"}], adjust: true},
                ],
                scheme:{
                  $change:function(item){
                    if (item.status == 0)
                      item.$css = "inactiveLine";
                  }},
                hover: "hoverline",
                on : {
                  onBeforeLoad:function(){
                    this.showOverlay("Loading...");
                  },
                  onAfterLoad:function(){
                    this.hideOverlay();
                    $$("moduleMeisterschaft-Ccount").setValue("Anzahl " + this.count());	  
                  }
                }  
              },
              { view:"resizer",
                id:"resizer" 
              },
              { view : "datatable", id : "moduleMeisterschaft-Kitems",
                css:"webix_header_border webix_data_border", 
                select:true, autofit:true,
                resizeColumn: { headerOnly:true},
                scroll:true, 
                editable:false, 
                columns:[
                  { id:"rang", header:[{text:"Rang"}], adjust:true},
                  { id:"punkte", header:[{text:"Punkte"}], adjust:true},
                  { id:"vorname", header:[{text:"Vorname"}],  adjust:true},
                  { id:"nachname", header:[{text:"Nachname"}], adjust:true},
                  { id:"anlaesse", header:[{text:"Anlässe"}], adjust:true},
                  { id:"babeli", header:[{text:"Babeli"}],  adjust:true},
                ],
                scheme:{
                  $change:function(item){
                    if (item.status == 0)
                      item.$css = "inactiveLine";
                  }},
                hover: "hoverline",
                on : {
                  onBeforeLoad:function(){
                    this.showOverlay("Loading...");
                  },
                  onAfterLoad:function(){
                    console.log(this);
                    this.hideOverlay();
                    $$("moduleMeisterschaft-Kcount").setValue("Anzahl " + this.count());	  
                  }
                }  
              }
             ]
            },
            /* Anlass list toolbar. */
            { view : "toolbar",
            cols : [
              { id: "moduleMeisterschaft-Ccount", view : "label", label: "Anzahl 0"},
              { width : 6 },
              { id: "moduleMeisterschaft-refreshButton", view : "button", default : true, label : "Refresh", width : "80", type : "icon", disabled: false,
              icon : "webix_icon mdi mdi-refresh", click : this.refreshMeister.bind(this)},
              { id: "moduleMeisterschaft-exporthButton", view : "button", default : true, label : "Excel", width : "80", type : "icon", disabled: false,
              icon : "webix_icon mdi mdi-file-excel", click : this.exportMeister.bind(this)},
              { width : 6 },
              { id: "moduleMeisterschaft-Kendjahr", view : "label", label: "", align: "right"},
              { id: "moduleMeisterschaft-Kcount", view : "label", label: "Anzahl 0", align: "right"},
            ] /* End toolbar items. */
            } /* End toolbar. */
          ] /* End anlass list rows. */
        } /* End anlass list cell. */
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
   * export both tables to one excel file
   */
  async exportMeister() {
    await webix.toExcel([{id: "moduleMeisterschaft-Citems", options: {name: "Clubmeisterschaft"}},
    {id: "moduleMeisterschaft-Kitems", options: {name: "Kegelmeisterschaft"}}],
    {filename: "Meisterschaft", styles:true});

  }
  /**
   * Recalculate both championships
   */
  async refreshMeister() {
    var url = "/Clubmeister/refresh?jahr=" + $$("moduleMeisterschaftdatumSelect").getValue();
    await fetch(url)      
      .catch(error => webix.message({ type:"error", text: error}));
    url = "/Kegelmeister/refresh?jahr=" + $$("moduleMeisterschaftdatumSelect").getValue();
    await fetch(url)
      .catch(error => webix.message({ type:"error", text: error}));
    await this.refreshData();
    webix.message({type: "info", text:"Ranglisten neu berechnet"});
}

  /**
   * Refresh the meisterschaft list from local storage.
   */
  async refreshData() {
    var sSelYear = $$("moduleMeisterschaftdatumSelect").getValue();
    if (sSelYear == "")
      sSelYear = wxAMC.parameter.get('CLUBJAHR');


    const url = "/Clubmeister/data?jahr=" + sSelYear;
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
    $$("moduleMeisterschaft-Citems").clearAll();
    $$("moduleMeisterschaft-Citems").parse(itemsAsArray);

    const promiseModuleK = fetch("/Kegelmeister/data?jahr=" + sSelYear)
      .then(function(response) {
        return response.json();
      }).catch(function(error) {
        webix.message({ type:"error", text: error})
    });
    Promise.resolve(promiseModuleK)
    .then(async function(dataItemsK) {
      // Get the items as an array of objects.
      const itemsKAsArray = wxAMC.objectAsArray(dataItemsK);
      
      // Populate the tree.
      $$("moduleMeisterschaft-Kitems").clearAll();
      $$("moduleMeisterschaft-Kitems").parse(itemsKAsArray);

      const promiseModuleKJ = fetch("Meisterschaft/checkJahr?jahr=" + sSelYear)
        .then(response => response.json())
        .catch(error => webix.message({type: "error", text: error}));
      Promise.resolve(promiseModuleKJ)
        .then(function(dataJahr) {
          if (dataJahr[0].AnzStreich > 0) 
            $$("moduleMeisterschaft-Kendjahr").setValue('<div style="font-size:small;color:yellow;">Streichresultate berücksichtigt</div>');
          else
            $$("moduleMeisterschaft-Kendjahr").setValue("");

        })
        .catch(error => webix.message({type: "error", text: error}));
      
    });
  });

} /* End refreshData(). */


  /**
   * Service requests from day-at-a-glance to present data for this module.
   */
  async dayAtAGlance() {

    // Add a section to the day-at-a-glance body for this module if there isn't one already.
    if (!$$("dayAtAGlanceScreen_Meisterschaft")) {
      $$("dayAtAGlanceBody").addView({
        view : "fieldset", label : "Meisterschaft - Ctrl+M", 
        body : { id: "dayAtAGlanceScreen_Meisterschaft", cols: [ ] }
      });
      $$("dayAtAGlanceBody").addView({ height : 20 });
    } 

    // Populate the day-at-a-glance screen.
    var rows = [ ];

    var promiseModule = await fetch("/Clubmeister/getOverviewData")
      .then((response) => response.json())
      .catch((e) => webix.message({ type:"error", text: e}));

    await Promise.resolve(promiseModule)
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
    })
    .catch((e) => webix.message({ type:"error", text: e}));

    promiseModule = await fetch("/Kegelmeister/getOverviewData")
      .then((response) => response.json())
      .catch((e) => webix.message({ type:"error", text: e}));

    await Promise.resolve(promiseModule)
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
    })
    .catch((e) => webix.message({ type:"error", text: e}));
    webix.ui (rows, $$("dayAtAGlanceScreen_Meisterschaft"));

  } /* End dayAtAGlance(). */

}; /* End Meisterschaft class. */
