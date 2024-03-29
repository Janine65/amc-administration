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
      return value.linkedEvent.vorjahr;
    } else return "";
  }

 custom_status(obj, common, value){
    if (value)
        return "<div class=' custom checked'> Aktiv </div>";
    else
        return "<div class=' custom notchecked'> Inaktiv </div>";
}

custom_checkbox(obj, common, value){
  if (value)
      return "<div class='webix_icon mdi mdi-checkbox-marked'></div>";
  else
      return "<div class='webix_icon mdi mdi-checkbox-blank-outline'></div>";
}

/**
   * Return the module's UI config object.
   */
  getUIConfig() {

    return {
      winWidth : 1000, winHeight : 800, winLabel : "Anlässe", winIcon : "mdi mdi-calendar-check", winHotkey: "ctrl+e",
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
              { id:"istsamanlass", css:{'text-align':'center'}, header:[{text:"SAM-Anlass?"}], template:this.custom_checkbox},
              { id:"beschreibung", header:[{text:"Beschreibung"}], adjust:"header"},
              { id:"vorjahr", header:[{text:"Vorjahres Termin"}], adjust:true, template:this.show_vorjahr}  
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
                console.log(this);
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
                $$("moduleAnlaesse-eventButton").enable();
                
              },
              onItemDblClick:function(selection, preserve){
                wxAMC.modules['Anlaesse'].eventsEditing();
              }
              }
            },
            /* Anlass list toolbar. */
            { view : "toolbar",
            cols : [
              { id: "count_anlass", view : "label", label: "Anzahl 0"},
              { },
              { id: "moduleAnlaesse-eventButton", view : "button", default : true, label : "Event", autowidth: true, type : "icon", disabled: true,
                icon : "webix_icon mdi mdi-calendar-multiple-check", click : this.eventsEditing.bind(this)
              },
              { id: "moduleAnlaesse-printButton1", view : "button", default : true, label : "Datenblatt", autowidth: true, type : "icon", disabled: false,
                icon : "webix_icon mdi mdi-file-excel", click : () => { wxAMC.excelDatasheet({id:0, type: 0}); }
              },
              { id: "moduleAnlaesse-printButton2", view : "button", default : true, label : "leer", autowidth: true, type : "icon", disabled: false,
                icon : "webix_icon mdi mdi-file-excel", click : () => { wxAMC.excelDatasheet({id:0, type: 1}); }
              },
              { id: "moduleAnlaesse-printButton3", view : "button", default : true, label : "voll", autowidth: true, type : "icon", disabled: false,
                icon : "webix_icon mdi mdi-file-excel", click : () => { wxAMC.excelDatasheet({id:0, type: 2}); }
              },
              { },
              { id: "moduleAnlaesse-editButton", view : "button", default : false, label : "Edit", autowidth: true, type : "icon", disabled: true,
                icon : "webix_icon mdi mdi-pencil", click : this.editExisting.bind(this)
              },
              { id: "moduleAnlaesse-copyButton", view : "button", default : false, label : "Copy", autowidth: true, type : "icon", disabled: true,
                icon : "webix_icon mdi mdi-content-duplicate", click : this.copyHandler.bind(this)
              },
              { id : "moduleAnlaesse-deleteButton", view : "button", default : false, label : "Delete", autowidth: true, type : "icon", disabled: true,
              icon : "webix_icon mdi mdi-delete", click : () => { wxAMC.deleteHandler("Anlaesse"); }
              },
              { id: "moduleAnlaesse-newButton", view : "button", default : false, label : "New", autowidth: true, type : "icon",
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
              elementsConfig : { labelWidth : 150, 
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
                { view:"combo", required: true, invalidMessage: "Status muss gesetzt sein",
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
                { view : "checkbox", name : "istkegeln", label : "Kegeln?", value : false
                },
                { view : "checkbox", name : "nachkegeln", label : "Nachkegeln?", value : false
                },
                { view : "checkbox", name : "istsamanlass", label : "SAM-Anlass?", value : false
                },
                { view:"combo", suggest:"/Anlaesse/getFkData", name:"anlaesseid", label:"Vorjahresevent" }
              ]
            }, /* End anlass details form. */
            //{ },
            /* Anlass details toolbar. */
            { view : "toolbar",
              cols : [
                { width : 6 },
                { view : "button", label : "Zurück", autowidth: true,
                  type : "icon", icon : "webix_icon mdi mdi-arrow-left",
                  click : () => {
                    $$("moduleAnlaesse-itemsCell").show();
                  }
                },
                { },
                { view : "button", label : "Save", autowidth: true,
                  type : "icon", icon : "webix_icon mdi mdi-content-save",
                  id : "moduleAnlaesse-saveButton", disabled : true, hotkey: "enter",
                  click : function() {
                    wxAMC.saveHandler("Anlaesse", "moduleAnlaesse-detailsForm");
                  }
                },
                { width : 6 }
              ]
            } /* End anlass details toolbar. */
          ] /* End anlass details cell rows. */
        }, /* End anlass details cells. */
        /* ---------- Anlass Punkte cell. ---------- */
        { id: "moduleAnlaesse-punkte", 
          rows: [
            {cols: [ 
                { id : "moduleAnlaesse-punkteEvent", 
                  view: "label",
                  label: ""
                },
                { id : "moduleAnlaesse-punkteAnzahl", 
                  view: "label",
                  label: ""
                },
                { id: "moduleAnlaesse-anzahlGaeste",
                  view: "label", 
                  label: ""
                },
                { view : "button", default : false, label : "Edit", autowidth: true, type : "icon", disabled: false,
                  icon : "webix_icon mdi mdi-pencil", click : this.editExisting.bind(this)
                }
              ]
            },
            {height: 20},
            {cols: [
                  { id: "moduleAnlaesse-punkteList", 
                    view: "list", select: true,
                    data: [], 
                    template: "#punkte# - #fullname#",
                    on : {
                      onAfterSelect:function(selection, preserve){
                        $$("moduleAnlaesse-deletePunkteButton").enable();
                        $$("moduleAnlaesse-punkteForm").enable();
                        $$("punkte")[wxAMC.modules['Anlaesse'].anlass.nachkegeln ? "disable" : "enable"]();
                        $$("kegelresultate")[wxAMC.modules['Anlaesse'].anlass.istkegeln ? "show" : "hide"]();
                        $$("moduleAnlaesse-punkteForm").bind(this);
                        $$("mitgliedid").show();
                        $$("mitgliedListe").hide();
                  
                      }
                    }
                  },
                  { id: "moduleAnlaesse-punkteForm", 
                    view: "form", scroll: false, minHeight: 400,
                    elementsConfig : { labelWidth: 100, 
                      on : { 
                        onKeyPress: function(code, e) {
                          if (e.type == "keydown" && (e.keyCode >= 48 && e.keyCode <= 57)) {
                              if (e.srcElement.parentNode == $$("wurf1").$view.children[0]) {
                                $$("wurf1").setValue(e.key);
                                $$("wurf2").focus();                                
                                return false;
                              }
                              else if (e.srcElement.parentNode == $$("wurf2").$view.children[0]) {
                                $$("wurf2").setValue(e.key);
                                $$("wurf3").focus();
                                return false;
                              }
                              else if (e.srcElement.parentNode == $$("wurf3").$view.children[0]) {
                                $$("wurf3").setValue(e.key);
                                $$("wurf4").focus();
                                return false;
                              }
                              else if (e.srcElement.parentNode == $$("wurf4").$view.children[0]) {
                                $$("wurf4").setValue(e.key);
                                $$("wurf5").focus();
                                return false;
                              }
                              else if (e.srcElement.parentNode == $$("wurf5").$view.children[0]) {
                                $$("wurf5").setValue(e.key);
                                $$("wurf1").focus();
                                return false;
                              }
                           } 
                           return true;
                        },
                        onChange : () => {
                          $$("moduleAnlaesse-savePunkteButton")[$$("moduleAnlaesse-punkteForm").validate() ? "enable" : "disable"]();
                          this.calcTotal();
                        } 
                      }
                    },
                    elements: [
                      { view:"combo", suggest:"/data/getFkData", id: "mitgliedListe", name:"mitgliedid", label:"Teilnehmer", required: true, hidden: true },
                      { view:"text", id: "mitgliedid", name:"fullname", label:"Teilnehmer", disabled: true },
                      { view: "text", type:"number", id: "punkte", name: "punkte", label: "Punkte" },
                      { view: "fieldset", id: "kegelresultate", label: "Kegelresultate", hidden: true,
                      body: 
                        { cols: [
                          { view: "text", id:"wurf1", name: "wurf1", label: "", attributes : { maxlength : 1 }, pattern: {mask: "#", allow:/[0-9]/g}},
                          { view: "text", id:"wurf2", name: "wurf2", label: "", attributes : { maxlength : 1 }, pattern: {mask: "#", allow:/[0-9]/g}},
                          { view: "text", id:"wurf3", name: "wurf3", label: "", attributes : { maxlength : 1 }, pattern: {mask: "#", allow:/[0-9]/g}},
                          { view: "text", id:"wurf4", name: "wurf4", label: "", attributes : { maxlength : 1 }, pattern: {mask: "#", allow:/[0-9]/g}},
                          { view: "text", id:"wurf5", name: "wurf5", label: "", attributes : { maxlength : 1 }, pattern: {mask: "#", allow:/[0-9]/g}},
                          { view: "text", name: "zusatz", label: "",  readonly: true},
                          { view: "text", id: "kegelTotal", name: "total", label: "", readonly: true, css: "markedbox"}
                          ]
                        }
                      }
                    ]
                  }
                ] 
            },
            /* Anlass punkte toolbar. */
            { view : "toolbar", 
              cols : [
                { width : 6 },
                { view : "button", label : "Zurück", autowidth: true,
                  type : "icon", icon : "webix_icon mdi mdi-arrow-left",
                  click : () => {
                    $$("moduleAnlaesse-itemsCell").show();
                  }
                },
                { width: 60},
                { view : "button", label : "Add", autowidth: true,
                  type : "icon", icon : "webix_icon mdi mdi-plus",
                  id : "moduleAnlaesse-addPunkteButton", disabled : false,
                  click : this.addPunkteForm.bind(this)
                },
                { view : "button", label : "Delete", autowidth: true,
                  type : "icon", icon : "webix_icon mdi mdi-delete",
                  id : "moduleAnlaesse-deletePunkteButton", disabled : true,
                  click : this.deletePunkteForm.bind(this)
                },
                { width : 100 },
                { view : "button", label : "Save", autowidth: true,
                  type : "icon", icon : "webix_icon mdi mdi-content-save",
                  id : "moduleAnlaesse-savePunkteButton", disabled : true,
                  click : this.savePunkteForm.bind(this), hotkey: "enter"
                },
                { width : 6 }
              ]
            } /* End anlass punkte toolbar. */
          ]
        } /* End anlass punkte form. */
      ] /* End main layout cells. */
    };

  } /* End getUIConfig(). */

  calcTotal() {
    let data = $$("moduleAnlaesse-punkteForm").getValues();

    let total = Number(data.wurf1) + Number(data.wurf2) + Number(data.wurf3) + Number(data.wurf4) + Number(data.wurf5) + Number(data.zusatz);
    $$("kegelTotal").setValue(total);


  } /* End calcTotal */

  /**
   * Called whenever this module becomes active.
   */
  activate() {
     this.refreshData();
  } /* End activate(). */


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
    let anlass = [];
    anlass.id = null;
    anlass.datum = null;
    anlass.name = null;
    anlass.status = 1;
    anlass.beschreibung = null;
    anlass.istkegeln = false;
    anlass.nachkegeln = false;
    anlass.istsamanlass = false;
    anlass.punkte = 50;
    anlass.anlaesseid = null;
    $$("moduleAnlaesse-detailsForm").setValues(anlass);
    $$("moduleAnlaesse-detailsForm").setDirty(true);
    $$("moduleAnlaesse-deleteButton").disable();

  } /* End newHandler(). */


  eventsEditing() {
    const anlass = $$('moduleAnlaesse-items').getSelectedItem();

    // Set flag to indicate editing an existing anlass and show the details.
    this.isEditingExisting = false;
    this.editingID = 0;
    this.anlass = anlass;

    // Show the form.  Note that this has to be done before the call to
    // setValues() below otherwise we get an error due to setting the value of
    // the richtext (my guess is it lazy-builds the DOM and it's not actually
    // there until the show() executes.
    $$("moduleAnlaesse-punkte").show();
    $$("moduleAnlaesse-punkteList").clearAll();
    $$("moduleAnlaesse-punkteForm").clear();
    $$("moduleAnlaesse-punkteForm").disable();
    let longname = new Date(anlass.datum).toLocaleDateString() + ' ' + anlass.name;
    $$("moduleAnlaesse-punkteEvent").setValue("<div style='font-size:20px;'>" + longname + "</div>");
    $$("moduleAnlaesse-anzahlGaeste").setValue("<div style='font-size:20px;'>Anzahl Gäste: " + anlass.gaeste + "</div>");

    let zusatz = [this.anlass.istkegeln ? [this.anlass.nachkegeln ? 0 : 5] : 0];
    $$("punkte")[this.anlass.nachkegeln ? "disable" : "enable"]();
    $$("kegelresultate")[this.anlass.istkegeln ? "show" : "hide"]();

    // Special handling for dates.
      anlass.datum = new Date(anlass.datum);

      const url = "/Meisterschaft/data/?eventid=" + anlass.id;
   
       const promiseModule = fetch(url)
         .then(function(response) {
           //console.log(response);
           return response.json();
         }).catch(function(error) {
           webix.message({ type:"error", text: error})
     });
     Promise.resolve(promiseModule)
      .then(function(dataItems) {
        // Populate the list.
        //webix.i18n.dateFormatStr
        
        for (let ind2 = 0; ind2 < dataItems.length; ind2++) {
          const eintrag = dataItems[ind2];
            eintrag.fullname = eintrag.teilnehmer.fullname;
            eintrag.mitgliedid = eintrag.teilnehmer.id;
            eintrag.zusatz = zusatz;
            $$("moduleAnlaesse-punkteList").add(eintrag);
        }
        $$("moduleAnlaesse-punkteAnzahl").setValue("<div style='font-size:20px;'>Anzahl " + $$("moduleAnlaesse-punkteList").count() + "</div>");
        if(!$$("moduleAnlaesse-punkteList").count()){ // if there are no data items
          webix.message({ type: "info", text: "no data found"});
        }        
      })
      .catch(function(error) {
        webix.message({ type:"error", text: error})
      });
      this.addPunkteForm();
      
  } /* End eeventsEditing */

  deletePunkteForm() {
    let itemData = $$(`moduleAnlaesse-punkteList`).getSelectedItem();
    const url = "/Meisterschaft/data";
    let smethod = "DELETE";

    fetch(url, {
      method: smethod, // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(itemData) // body data type must match "Content-Type" header
    })
    .then((response) => {
      if (!response.ok) {                                  // ***
        webix.message({ type:"error", text: "HTTP error " + response.status});  // ***
      }
      return response.json();
    })
    .then((data) => {
      // Refresh the module's summary list and return to that list.
      let idEntry = $$(`moduleAnlaesse-punkteList`).getSelectedId(); 
      $$(`moduleAnlaesse-punkteList`).remove(idEntry);
      $$("moduleAnlaesse-punkteForm").clear();
      $$("moduleAnlaesse-punkteForm").disable();
      $$("moduleAnlaesse-punkteAnzahl").setValue("<div style='font-size:20px;'>Anzahl " + $$("moduleAnlaesse-punkteList").count() + "</div>");

      // Finally, show a completion message.
      webix.message({ type : "success", text : "deleted" });
    })
    .catch((e) => webix.message({type : "error", text : e}));



  } /* End savePunkteForm */

  addPunkteForm() {
    $$(`moduleAnlaesse-punkteList`).unselectAll();
    $$("moduleAnlaesse-punkteForm").clear();
    $$("moduleAnlaesse-punkteForm").enable();
    let itemData = { id: 0, eventid: this.anlass.id, punkte: this.anlass.punkte, zusatz: [this.anlass.istkegeln ? [this.anlass.nachkegeln ? 0 : 5] : 0], wurf1: 0, wurf2: 0, wurf3: 0, wurf4: 0, wurf5: 0, streichresultat: 0 };
    $$("moduleAnlaesse-punkteForm").setValues(itemData);
    $$("punkte")[this.anlass.nachkegeln ? "disable" : "enable"]();
    $$("kegelresultate")[this.anlass.istkegeln ? "show" : "hide"]();
    $$("mitgliedid").hide();
    $$("mitgliedListe").show();
    $$("mitgliedListe").setValue("");
    $$("mitgliedListe").focus(true);


  } /* End savePunkteForm */

  savePunkteForm() {
    if (!$$("moduleAnlaesse-punkteForm").isDirty())
      return;

    let itemData = $$("moduleAnlaesse-punkteForm").getValues();

    console.log("savePunkteForm: itemData: ",itemData);
    const url = "/Meisterschaft/data";
    //$$("mitgliedid").show();
    //$$("mitgliedListe").hide();

    let smethond = (itemData.id > 0 ? "PUT" : "POST");

    if (itemData.id == 0 || itemData.id == null) {
      // check duplicate
      let fObj = $$(`moduleAnlaesse-punkteList`).find(function(obj)
      {
        return (obj.mitgliedid == itemData.mitgliedid)
      },true);
      if (fObj != null) {
        // ERROR
        webix.message({type: "error", text: "Für dieses Mitglied wurden bereits Ergebnisse erfasst!"})
        return ;
      }
    }

    fetch(url, {
      method: smethond, // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(itemData) // body data type must match "Content-Type" header
    })
    .then((response) => {
      if (!response.ok) {                                  // ***
        webix.message({ type:"error", text: "HTTP error " + response.status});  // ***
      }
      return response.json();
    })
    .then((data) => {
      // Refresh the module's summary list and return to that list.
      if (smethond == 'PUT') {
        let idEntry = $$(`moduleAnlaesse-punkteList`).getSelectedId(); 
        $$(`moduleAnlaesse-punkteList`).updateItem(idEntry, itemData);
      } else {
        console.log('after post', data);
        const promiseModule = fetch('/Meisterschaft/getOneData/?id=' + data)
          .then(function(response) {
            return response.json();
          })
          .catch(function(error) {
            webix.message({ type:"error", text: error})
        });
        Promise.resolve(promiseModule)
          .then((dataItem) => { 
            dataItem.fullname = dataItem.teilnehmer.fullname;
            dataItem.mitgliedid = dataItem.teilnehmer.id;
            $$(`moduleAnlaesse-punkteList`).add(dataItem);
            $$(`moduleAnlaesse-punkteList`).sort("#fullname#", "asc");
          })
          .catch((e) => webix.message({type : "error", text : e}));
      }
      $$("moduleAnlaesse-punkteForm").clear();
      $$("moduleAnlaesse-punkteForm").disable();
      $$(`moduleAnlaesse-punkteList`).unselectAll();
      $$("moduleAnlaesse-punkteAnzahl").setValue("<div style='font-size:20px;'>Anzahl " + $$("moduleAnlaesse-punkteList").count() + "</div>");
      this.addPunkteForm();

      // Finally, show a completion message.
      webix.message({ type : "success", text : "gesichert" });
    })
    .catch((e) => webix.message({type : "error", text : e}));

  } /* End savePunkteForm */

  copyHandler() {

    // We're adding a new anlass, but with the value of the selected one.
    this.isEditingExisting = false;
    this.editingID = 0;

    const anlassOrig = $$('moduleAnlaesse-items').getSelectedItem();
    console.log(anlassOrig);
    let anlass = [];
    anlass.id = null;
    let datum = new Date(anlassOrig.datum);
    datum.setUTCFullYear(new Date(anlassOrig.datum).getUTCFullYear()+1);
    anlass.datum = datum;
    anlass.name = anlassOrig.name;
    anlass.status = 1;
    anlass.beschreibung = anlassOrig.beschreibung;
    anlass.istkegeln = anlassOrig.istkegeln;
    anlass.nachkegeln = anlassOrig.nachkegeln;
    anlass.istsamanlass = anlassOrig.istsamanlass;
    anlass.punkte = anlassOrig.punkte;
    anlass.anlaesseid = anlassOrig.id;

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
   // let dataItems;

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
    let sSelYear = $$("datumSelect").getValue();
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
    let rows = [ ];

    const promiseModule = fetch("/Anlaesse/getOverviewData")
      .then((response) => response.json())
      .catch((e) => webix.message({ type:"error", text: e}));

    Promise.resolve(promiseModule)
    .then(totals => {
      for (let ind2 = 0; ind2 < totals.length; ind2++) {
        const total = totals[ind2];
        rows.push(
          { view:"fieldset", label: total.label, body: { 
            rows : [ 
              {view: "label", label : total.value}
            ]}
          });
      }
    })
    .then(function(){
      //console.log(rows);
      webix.ui (rows, $$("dayAtAGlanceScreen_Anlaesse"));
    })
    .catch((e) => webix.message({ type:"error", text: e}));


  } /* End dayAtAGlance(). */

}; /* End Anlaesse class. */
