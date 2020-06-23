"use strict";

// "Register" this module with wxAMC.
wxAMC.registeredModules.push("Adressen");

wxAMC.moduleClasses.Adressen = class {


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


   mark_sam_mitglied (value, config) {
    if (value.sam_mitglied == 1) {
      return "<span class='webix_icon mdi mdi-checkbox-marked'></span>";
    } else {
      return "<span class='webix_icon mdi mdi-checkbox-blank-outline'></span>";
    }
  }
  
   mark_ehrenmitglied (value, config) {
    if (value.ehrenmitglied == 1) {
      return "<span class='webix_icon mdi mdi-checkbox-marked'></span>";
    } else {
      return "<span class='webix_icon mdi mdi-checkbox-blank-outline'></span>";
    }
  }
  
   mark_vorstand (value, config) {
    if (value.vorstand == 1) {
      return "<span class='webix_icon mdi mdi-checkbox-marked'></span>";
    } else {
      return "<span class='webix_icon mdi mdi-checkbox-blank-outline'></span>";
    }
  }
  
   mark_revisor (value, config) {
    if (value.revisor == 1) {
      return "<span class='webix_icon mdi mdi-checkbox-marked'></span>";
    } else {
      return "<span class='webix_icon mdi mdi-checkbox-blank-outline'></span>";
    }
  }
  
   mark_allianz (value, config) {
    if (value.allianz == 1) {
      return "<span class='webix_icon mdi mdi-checkbox-marked'></span>";
    } else {
      return "<span class='webix_icon mdi mdi-checkbox-blank-outline'></span>";
    }
  }
  
  show_geworben (value, config) {
    if (value.adressenId != "" && value.adressenId != null ) {
      return value.adressenId;
    } else return "";
  }

  /**
   * Return the module's UI config object.
   */
  getUIConfig() {

    return {
      winWidth : 1200, winHeight : 800, winLabel : "Adressen", winIcon : "webix_icon mdi mdi-contacts",
      id : "moduleAdressen-container",
      cells : [
        /* ---------- Adresse list cell. ---------- */
        { id : "moduleAdressen-itemsCell",
          rows : [ {
            view:"datatable", id:"moduleAdressen-items", 
            css:"webix_header_border webix_data_border", 
            select:true, autofit:true,
            resizeColumn: { headerOnly:true},
            scroll:true, 
            editable:false, 
            headermenu:{
              data: [
              { id:"mobile", value:"Mobile"},
              { id:"email", value:"Email"},
              { id:"notes", value:"Notizen"},
              { id:"mnr_sam", value:"SAM Nr."},
              { id:"sam_mitglied", value:"SAM Mitglied"},		
              { id:"ehrenmitglied", value:"Ehrenmitglied"},		
              { id:"vorstand", value:"Vorstand"},		
              { id:"revisor", value:"Revisor"},		
              { id:"allianz", value:"Allianz"},		
              { id:"eintritt", value:"Eintritt"},
              { id:"austritt", value:"Austritt"},
              { id:"adressenId", value:"Geworben von"}
              ]
            },
            defaultData: {geschlecht: "1", land: "CH", sam_mitglied:"1"},	
            columns:[
              { id:"mnr", css:{'text-align':'right'}, header:[{text:"MNR"},{content:"numberFilter"}], sort:"int", adjust:true},
              { id:"geschlecht", header:[{text:"Geschlecht"}], options:[
                      { id:"1", value:"M" },
                      { id:"2", value:"W" }], adjust:true},
              { id:"name", header:[{text:"Name"},{content:"textFilter"}], sort:"string", adjust:true},
              { id:"vorname", header:[{text:"Vorname"},{content:"textFilter"}], sort:"string", adjust:true},
              { id:"adresse", header:[{text:"Adresse"},{content:"textFilter"}], adjust:true},
              { id:"plz", header:[{text:"PLZ"},{content:"numberFilter"}], adjust:true},
              { id:"ort", header:[{text:"Ort"},{content:"textFilter"}], adjust:true},
              { id:"land", header:[{text:"Land"},{content:"textFilter"}], adjust:true},
              { id:"telefon_p", header:"Telefon (P)"},
              { id:"mobile", header:"Mobile"},
              { id:"email", header:"Email"},
              { id:"notes", header:"Notizen", hidden:true},
              { id:"mnr_sam", css:{'text-align':'right'}, header:[{text:"SAM Nr."},{content:"numberFilter"}], sort:"int", adjust:true},
              { id:"sam_mitglied", css:{'text-align':'center'}, header:[{text:"SAM Mitglied"},{content:"selectFilter"}], sort:"text", template:this.mark_sam_mitglied},
              { id:"ehrenmitglied", css:{'text-align':'center'},header:[{text:"Ehrenmitglied"},{content:"selectFilter"}], sort:"text", template:this.mark_ehrenmitglied},		
              { id:"vorstand", css:{'text-align':'center'},header:[{text:"Vorstand"},{content:"selectFilter"}], sort:"text", template:this.mark_vorstand, hidden:true},		
              { id:"revisor", css:{'text-align':'center'},header:[{text:"Revisor"},{content:"selectFilter"}], sort:"text", template:this.mark_revisor, hidden:true},		
              { id:"allianz", css:{'text-align':'center'},header:[{text:"Allianz"},{content:"selectFilter"}], sort:"text", template:this.mark_allianz, hidden:true},		
              { id:"eintritt", header:[{text:"Eintritt"},{content:"textFilter"}], sort:"string", adjust:true, template:function(obj){return new Date(obj.eintritt).getFullYear();}, hidden:true},
              { id:"austritt", header:[{text:"Austritt"},{content:"textFilter"}], sort:"string", adjust:true, template:function(obj){return new Date(obj.austritt).getFullYear();}, hidden:true},
              { id:"adressenId", header:[{text:"Geworben von"},{content:"selectFilter"}], sort:"text", adjust:"header", template:this.show_geworben, hidden:true}
            ],
            hover: "hoverline",
            sort:"multi",
            ready:function(){
              this.sort([
                { by:"name", dir:"asc" }, 
                { by:"vorname", dir:"asc" }
                ]);
              this.markSorting("name", "asc");
              this.markSorting("vorname", "asc", true);
            },
            on:{
              onBeforeLoad:function(){
                this.showOverlay("Loading...");
              },
              onAfterLoad:function(){
                this.hideOverlay();
              //console.info(this.count());
              $$("count_adr").setValue("Anzahl " + this.count());	  
              },
              onAfterSelect:function(selection, preserve){
                $$("moduleAdressen-editButton").enable();
              }
            },
            url:"/adresse/data", save:"rest->/adresse/data"
            },
            { view : "toolbar",
              cols : [
                { },
                { id: "moduleAdressen-emailAllButton", view : "button", label : "Email", width : "80", type : "iconButton",
                  icon : "webix_icon mdi mdi-email-plus", click : wxAMC.emailHandler("Adressen", "all")
                },
                { id: "moduleAdressen-editButton", view : "button", label : "Edit", width : "80", type : "iconButton", disabled: true,
                  icon : "webix_icon mdi mdi-pencil", click : this.editExisting.bind(this)
                },
                { id: "moduleAdressen-newButton", view : "button", label : "New", width : "80", type : "iconButton",
                  icon : "webix_icon mdi mdi-plus", click : this.newHandler.bind(this)
                },
                { width : 6 }
              ] /* End toolbar items. */
            } /* End toolbar. */        
            ] /* End adresse list rows. */            
            /* Adresse list toolbar. */
          }, /* End adresse list cell. */
        /* ---------- Memeber details cell. ---------- */
        { id : "moduleAdressen-details",
          rows : [
            /* Adresse details form. */
            { view : "form", id : "moduleAdressen-detailsForm", borderless : false, scroll: true,
              elementsConfig : { view : "text", labelWidth : 100,
                on : { onChange : () => {
                  $$("moduleAdressen-saveButton")
                    [$$("moduleAdressen-detailsForm").validate()? "enable" : "disable"]();
                    $$("moduleAdressen-emailButton")
                    [$$("moduleAdressen-detailsForm").validate()? "enable" : "disable"]();
                } }
              },
              elements:[
                { readonly:true, view:"text", name:"mnr", label:"MNR", hidden:true },
                  { view:"combo", 
                      options:[{ id:"1", value:"männlich" }, { id:"2", value:"weiblich" }], 
                      name:"geschlecht", label:"Geschlecht", required : true },
                  { view:"text", name:"name", label:"Name", required : true,
                  invalidMessage : "Subject is required" },
                  { view:"text", name:"vorname", label:"Vorname", required : true,
                  invalidMessage : "Subject is required" },
                { view:"text", name:"adresse", label:"Adresse", required : true,
                invalidMessage : "Subject is required" },
                { view:"text", width:150, name:"plz", label:"PLZ", required : true,
                invalidMessage : "Subject is required", attributes : { maxlength : 5 }},
                { view:"text", name:"ort", label:"Ort", required : true,
                invalidMessage : "Subject is required" },
                { view:"combo", 
                      options:[{ id:"CH", value:"Schweiz" }, { id:"DE", value:"Deutschland" }], 
                      name:"land", label:"Land", required : true }
                ,
                { view:"text", name:"telefon_p", label:"Telefon" },
                { view:"text", name:"mobile", label:"Mobile" },
                { view:"text", name:"email", label:"Email(s)", required : true }
                ,
                { view:"textarea", name:"notes", label:"Notizen" },
                { view:"text", type:"number", name:"mnr_sam", label:"SAM Nr." },
                { view:"checkbox", name:"sam_mitglied", label:"SAM Mitglied", width:300 },
                { view:"checkbox", name:"ehrenmitglied", label:"Ehrenmitglied", width:300 }
                ,
                { view:"checkbox", name:"vorstand", label:"Vorstand" },
                { view:"checkbox", name:"revisor", label:"Revisor" }
                ,
                { view:"datepicker", name:"eintritt", label:"Eintritt" },
                { view:"datepicker", name:"austritt", label:"Austritt" }
                ,
                { view:"combo", suggest:"/data/getFkData", name:"adressenId", label:"Geworben von" }
              ],
              rules:{
                "name":webix.rules.isNotEmpty,
                "vorname":webix.rules.isNotEmpty,
                "adresse":webix.rules.isNotEmpty,
                "plz":webix.rules.isNotEmpty,
                "plz":webix.rules.isNumber,
                "ort":webix.rules.isNotEmpty
              }
              }, /* End adresse details form. */
            /* Adresse details toolbar. */
            { view : "toolbar",
              cols : [
                { width : 6 },
                { view : "button", label : "Back To Summary", width : "170",
                  type : "iconButton", icon : "mdi mdi-arrow-left",
                  click : () => {
                    $$("moduleAdressen-itemsCell").show();
                  }
                },
                { },
                { id : "moduleAdressen-emailButton", view : "button", label : "Email",
                  width : "90", type : "iconButton",
                  icon : "webix_icon mdi mdi-email-box", disabled : true, 
                    click : () => { wxAMC.emailHandler("Adressen", $$("moduleAdressen-detailsForm").elements.email.data.value); }
                },
                { id : "moduleAdressen-deleteButton", view : "button", label : "Delete",
                  width : "90", type : "iconButton",
                  icon : "webix_icon mdi mdi-delete", click : () => { wxAMC.deleteHandler("Adressen"); }
                },
                { },
                { view : "button", label : "Save", width : "80", type : "iconButton",
                  icon : "webix_icon mdi mdi-content-save", id : "moduleAdressen-saveButton", disabled : true,
                  click : () => { wxAMC.saveHandler("Adressen", [ $$("moduleAdressen-detailsForm")])
                  }
                },
                { width : 6 }
              ]
            } /* End adresse details toolbar. */
          ] /* End adresse details cell rows. */
        } /* End adresse details cell. */
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

    // We're adding a new adresse, so set the editing flag and create an ID.
    wxAMC.modules.Adressen.isEditingExisting = false;
    wxAMC.modules.Adressen.editingID = 0;

    // Now show the details form and clear it, then set any defaults.  Don't forget to
    // disable the delete button since we obviously can't delete during an add.
    $$("moduleAdressen-details").show();
    $$("moduleAdressen-detailsForm").clear();
    $$("moduleAdressen-deleteButton").disable();

  } /* End newHandler(). */


  /**
   * Handles clicks on the Save button.
   */
  editExisting(inID) {

    const adresse = $$("moduleAdressen-items").getSelectedItem();

    // Set flag to indicate editing an existing adresse and show the details.
    wxAMC.modules.Adressen.isEditingExisting = true;
    wxAMC.modules.Adressen.editingID = inID;

    // Clear the details form.
    $$("moduleAdressen-detailsForm").clear();

    // Show the form.  Note that this has to be done before the call to setValues()
    // below otherwise we get an error due to setting the value of the richtext (my
    // guess is it lazy-builds the DOM and it's not actually there until the show()
    // executes).
    $$("moduleAdressen-details").show();

    // Populate the form.
    $$("moduleAdressen-detailsForm").setValues(adresse);

    // Finally, enable the delete button.
    $$("moduleAdressen-deleteButton").enable();

   } /* End editExisting(). */


  /**
   * Refresh the adressen list from local storage.
   */
  refreshData() {

    // First, get the data for this module.  Then, create a new object from it where
    // the keys are normalized (without time component) dates and store the object on
    // the module class instance.
    const dataItems = wxAMC.getModuleData("Adressen");

    // Now, have the adresse list refresh itself using the new data object.
    $$("moduleAdressen-items").refresh();

  } /* End refreshData(). */

  /**
   * Service requests from day-at-a-glance to present data for this module.
   */
  dayAtAGlance() {

    // Add a section to the day-at-a-glance body for this module if there isn't one already.
    if (!$$("dayAtAGlanceScreen_Adressen")) {
      $$("dayAtAGlanceBody").addView({
        view : "fieldset", label : "Adressen",
        body : { id : "dayAtAGlanceScreen_Adressen",  rows : [ ] }
      });
      $$("dayAtAGlanceBody").addView({ height : 20 });
    }

    // Populate the day-at-a-glance screen.
    const template = webix.template("#subject# - #when# #location#");
    let dataItems = wxAMC.getModuleData("Adressen");
    dataItems = wxAMC.objectAsArray(dataItems);
    wxAMC.sortArray(dataItems, "when", "A");
    const currentDate = new Date().setHours(0, 0, 0, 0);
    const rows = [ ];
    for (let i = 0; i < dataItems.length; i++) {
      const item = dataItems[i];
      const itemDate = new Date(item.when).setHours(0, 0, 0, 0);
      if (itemDate == currentDate) {
        if (item.location) {
          item.location = "(" + item.location + ")";
        } else {
          item.location = "";
        }
        item["when"] = webix.i18n.timeFormatStr(new Date(item.when));
        rows.push({ borderless : true, template : template(item), height : 30 });
      }
    }
    webix.ui(rows, $$("dayAtAGlanceScreen_Adressen"));

  } /* End dayAtAGlance(). */


}; /* End Adressen class. */
