// "Register" this module with wxAMC.
wxAMC.registeredModules.push("Journal");

wxAMC.moduleClasses.Journal = class {


  /**
   * Constructor.
   */
  constructor() {

    // Flag set to true when editing an existing item, false when adding a new one.
    this.isEditingExisting = false;

    // The ID of the item being edited in the current module, if any.
    this.editingID = null;

    // Store the journal for the selected date, if any.
    this.currentData = {};

  } /* End constructor. */

  /**
   * Return the module's UI config object.
   */
  getUIConfig() {

    return {
      winWidth: 1200, winHeight: 800, winLabel: "Journal Ctrl+J", winIcon: "mdi mdi-bank", winHotkey: "ctrl+j",
      winCss: "authenticate_admin",
      id: "moduleJournal-container",
      cells: [
        /* ---------- Journal list cell. ---------- */
        {
          id: "moduleJournal-itemsCell",
          rows: [
            {
              view: "select", id: "moduleJournal-dateSelect",
              options: "/Fiscalyear/getFkData",
              value: wxAMC.parameter.get('CLUBJAHR'),
              on: {
                onViewShow: this.refreshData.bind(this),
                onChange: this.refreshData.bind(this)
              }
            },
            {
              view: "datatable", id: "moduleJournal-items",
              css: "webix_header_border webix_data_border",
              select: true, autofit: true,
              resizeColumn: { headerOnly: true },
              scroll: true,
              editable: false,
              columns: [
                { id: "journalNo", header: "No", adjust:true,  hidden: false },
                {
                  id: "date", header: "Date", adjust:true,
                   "editor": "date", hidden: false,
                  format: webix.i18n.dateFormatStr
                },
                {  header: "From", adjust:true,  hidden: false, template: "#fromAccount.order# #fromAccount.name#" },
                {  header: "To", adjust:true,  hidden: false, template: "#toAccount.order# #toAccount.name#" },
                {
                  id: "amount", header: "Amount", 
                  "editor": "text", hidden: false,
                  css:{'text-align':'right'}, format:webix.i18n.numberFormat
                },
                { id: "memo", header: "Memo", fillspace: true, hidden: false }
              ],
              hover: "hoverline",
              on: {
                onBeforeLoad: function () {
                  this.showOverlay("Loading...");
                },
                onAfterLoad: function () {
                  this.hideOverlay();
                  $$("count_journal").setValue("Anzahl " + this.count());
                  if (wxAMC.fiscalyear.state < 3) {
                    $$("moduleJournal-editButton").show();
                    $$("moduleJournal-deleteButton").show();
                    $$("moduleJournal-addForm").show();
                    $$("moduleJournal-editButton").disable();
                    $$("moduleJournal-deleteButton").disable();
                    } else {
                    $$("moduleJournal-editButton").hide();
                    $$("moduleJournal-deleteButton").hide();
                    $$("moduleJournal-addForm").hide();
                  }
                },
                onAfterFilter: function () {
                  $$("count_journal").setValue("Anzahl " + this.count());
                },
                onAfterSelect: function (selection, preserve) {
                  $$("moduleJournal-editButton").enable();
                  $$("moduleJournal-deleteButton").enable();
                },
                onItemDblClick: function (selection, preserve) {
                  wxAMC.modules['Journal'].editExisting();
                }
              }
            },
            {
              view: "toolbar",
              cols: [
                { id: "count_journal", view: "label", label: "Anzahl 0" },
                { width: 6 },
                {
                  id: "moduleJournal-editButton", view: "button", label: "Edit", width: "80", type: "icon", disabled: true,
                  icon: "webix_icon mdi mdi-pencil", click: this.editExisting.bind(this)
                },
                {
                  id: "moduleJournal-deleteButton", view: "button", label: "Delete", width: "80", type: "icon", disabled: true,
                  icon: "webix_icon mdi mdi-delete", click: () => { wxAMC.deleteHandler("Journal"); }
                },
                // {
                //   id: "moduleJournal-newButton", view: "button", label: "New", width: "80", type: "icon",
                //   icon: "webix_icon mdi mdi-plus", click: this.newHandler.bind(this)
                // },
                { width: 6 },
                {
                  id: "moduleJournal-exportButton", view: "button", label: "Export", width: "80", type: "icon",
                  icon: "webix_icon mdi mdi-export", click: this.exportData.bind(this)
                },
                {
                  id: "moduleJournal-importButton", view: "button", label: "Import", width: "80", type: "icon",
                  icon: "webix_icon mdi mdi-import", click: this.importData.bind(this)
                },
                { width: 6 }
              ] /* End toolbar items. */
            }, /* End toolbar. */
            {
              "autoheight": false,
              view: "form", id: "moduleJournal-addForm",
              elementsConfig: {
                on: {
                  onChange: () => {
                    $$("moduleJournal-addButton")
                    [$$("moduleJournal-addForm").validate() ? "enable" : "disable"]();
                  }
                }
              },
              rows: [
                {
                  cols: [
                    {
                      view: "datepicker",
                      name: "date",
                      required: true,
                      label: "Date",
                      labelPosition: "top",
                      width: 120
                    },
                    {
                      view: "combo", suggest: "/Account/getFkData", name: "from_account", label: "Konto",
                      height: 46,
                      labelPosition: "top",
                      required: true,
                      width: 200
                    },
                    {
                      view: "combo", suggest: "/Account/getFkData", name: "to_account", label: "Konto",
                      height: 44,
                      labelPosition: "top",
                      required: true,
                      width: 200
                    },
                    { label: "Text", view: "text", height: 28, labelPosition: "top", name: "memo" },
                    {
                      label: "Amount",
                      name: "amount",
                      view: "text",
                      required: true,
                      format:"1'111.00",
                      height: 46,
                      labelPosition: "top",
                      placeholder: "0.00",
                      width: 100,
                      labelAlign: "right",
                      inputAlign: "right"
                    }
                  ]
                },
                { view: "button", css: "webix_primary", label: "Save",
                icon: "mdi mdi-content-save", id: "moduleJournal-addButton", disabled: true,
                click: () => { wxAMC.saveHandler("Journal", "moduleJournal-addForm") }
               }
              ]
            }
          ] /* End journal list rows. */
        }, /* End journal list cell. */
        /* ---------- Journal details cell. ---------- */
        {
          id: "moduleJournal-details",
          rows: [
            /* Journal details form. */
            {
              view: "form", id: "moduleJournal-detailsForm", borderless: false, scroll: true,
              elementsConfig: {
                on: {
                  onChange: () => {
                    $$("moduleJournal-saveButton")
                    [$$("moduleJournal-detailsForm").validate() ? "enable" : "disable"]();
                  }
                }
              },
              elements: [
                { label: "No.", view: "text", "labelWidth": 100, "type": "number", name: "journalNo" },
                {
                  view: "datepicker",
                  label: "Date",
                  "value": "2020-11-08T15:03:10.974Z",
                  "timepicker": false,
                  "labelWidth": 100,
                  "format": "%d.%m.%Y",
                  height: 0,
                  name: "date"
                },
                {
                  label: "From Account",
                  "value": "1",
                  view: "combo",
                  suggest: "/Account/getFkData",
                  "labelWidth": 100,
                  required: true
                },
                {
                  label: "To Account",
                  "value": "1",
                  view: "combo",
                  suggest: "/Account/getFkData",
                  required: true,
                  name: "to_account",
                  "labelWidth": 100
                },
                {
                  label: "Amount",
                  view: "text",
                  "labelWidth": 100,
                  "type": "text",
                  required: true,
                  name: "amount"
                },
                { label: "Memo", view: "textarea", labelPosition: "top", name: "memo" }
              ]
            }, /* End journal details form. */
            /* Journal details toolbar. */
            {
              view: "toolbar",
              cols: [
                { width: 6 },
                {
                  view: "button", label: "Zurück", width: "90",
                  type: "icon", icon: "mdi mdi-arrow-left",
                  click: () => {
                    $$("moduleJournal-itemsCell").show();
                  }
                },
                {},
                {
                  view: "button", label: "Save", width: "80", type: "icon",
                  icon: "mdi mdi-content-save", id: "moduleJournal-saveButton", disabled: true, hotkey: "enter",
                  click: () => {
                    wxAMC.saveHandler("Journal", "moduleJournal-detailsForm")
                  }
                },
                { width: 6 }
              ]
            } /* End journal details toolbar. */
          ]
        }
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
   * Import Journal from an Excelfile
   */
  importData() {
    var message_text = "Exceldatei hier hochladen, um sie als Einträge ins Journal zu importieren";

    var compose_form = {
      view:"form", rows: [
        { view:"textarea", value:message_text, label:"message", labelPosition:"top", autoheight:true 
        },
        { view: "uploader", value: 'Choose files', link:"mytemplate", 
          upload: "/upload", 
          multiple: true, autosend: false,
          name:"uploadFiles", id:"fisupload",
          on: {
            onAfterFileAdd: () => { $$("fisupload_import").enable(); }
          }
        },
        {
          view:"list",
          id:"mytemplate", 
          type:"uploader",
          height: 30,
          borderless:true 
        },
        {cols: [
          { view:"button", value:"Start Import", id: "fisupload_import",  disabled: true, click: function() {
            $$("fisupload").send(function(response){
              if(response)
                webix.message(response.status);
              wxAMC.importLoadedFile();
            });
          }},
          { view:"button", value:"Cancel", click: function() {$$("message_win").close();}
          }  
        ]}
      ]
    };
    
    webix.ui({
      view:"window", body:compose_form, head:"Import File",
      width:450, id:"message_win",
      position:"center"
    }).show();
    
  }


  /**
   * Export selected data to Excel
   */
  exportData() {
    webix.toExcel($$("moduleJournal-items"), {
      filename: "Journal",
      rawValues: false
    });
  } /* End exportData(). */


  /**
   * Handles clicks on the Save button.
   */
  async editExisting() {

    const journal = $$("moduleJournal-items").getSelectedItem();

    // Set flag to indicate editing an existing journal and show the details.
    this.isEditingExisting = true;
    this.editingID = journal.id;

    // Clear the details form.
    $$("moduleJournal-detailsForm").clear();

    // Show the form.  Note that this has to be done before the call to setValues()
    // below otherwise we get an error due to setting the value of the richtext (my
    // guess is it lazy-builds the DOM and it's not actually there until the show()
    // executes).
    $$("moduleJournal-details").show();

    // Populate the form.
    $$("moduleJournal-detailsForm").setValues(journal);

  } /* End editExisting(). */

  /**
   * Refresh the journal list from local storage.
   */
  async refreshData() {

    var sJahr = $$("moduleJournal-dateSelect").getValue();
    if (sJahr == "")
      sJahr = wxAMC.parameter.get("CLUBJAHR");
    const url = "/Journal/data?jahr=" + sJahr;

    // read the fiscalyear to handle all the rights
    const promiseFiscal = fetch("/Fiscalyear/getOneData?year=" + sJahr)
    .then(function (response) {
      if (!response.ok)
        webix.message('Fehler beim Lesen der Journaldaten', 'Error');
      return response.json();
    })
    .catch(function (error) {
      webix.message({ type: "error", text: error })
    });

    Promise.resolve(promiseFiscal)
    .then(function (data) {
      wxAMC.fiscalyear = data;      
    })
    .catch(function (error) {
      webix.message({ type: "error", text: error })
    });

    const promiseModule = fetch(url)
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Lesen der Journaldaten', 'Error');
        return response.json();
      }).catch(function (error) {
        webix.message({ type: "error", text: error })
      });
    Promise.resolve(promiseModule)
      .then(function (dataItems) {
        //console.log('dataItems: ',dataItems);
        // Get the items as an array of objects.
        const itemsAsArray = wxAMC.objectAsArray(dataItems);

        $$("moduleJournal-items").clearAll();
        $$("moduleJournal-items").parse(itemsAsArray);
      });
  } /* End refreshData(). */

  /**
   * Service requests from day-at-a-glance to present data for this module.
   */
  async dayAtAGlance() {
    // Add a section to the day-at-a-glance body for this module if there isn't one already.
    if (!$$("dayAtAGlanceScreen_Journal")) {
      $$("dayAtAGlanceBody").addView({
        view : "fieldset", label : "Journal - Ctrl+J", 
        body : { id: "dayAtAGlanceScreen_Journal", cols: [ ] }
      });
      $$("dayAtAGlanceBody").addView({ height : 20 });
    } 

    // Populate the day-at-a-glance screen.
    var rows = [ ];

    const sJahr = wxAMC.parameter.get("CLUBJAHR");

    // read the fiscalyear to handle all the rights
    const promiseFiscal = fetch("/Fiscalyear/getOneData?year=" + sJahr)
    .then(function (response) {
      if (!response.ok)
        webix.message('Fehler beim Lesen des Buchhaltungsjahres', 'Error');
      return response.json();
    })
    .catch(function (error) {
      webix.message({ type: "error", text: error })
    });

    Promise.resolve(promiseFiscal)
    .then(function (data) {
      wxAMC.fiscalyear = data;      
      let status
      switch (data.state) {
        case 1:
          status = " - offen"
          break;
        case 2:
          status = " - prov. abgeschlossen"
          break;
        default:
          status = " - abgeschlossen"
          break;
      }
      rows.push(
        { view:"fieldset", label: "Buchhaltung", body: { 
          rows : [ 
            {view: "label", label : data.name + status}
          ]}
        });
        webix.ui (rows, $$("dayAtAGlanceScreen_Journal"));
    })
    .catch(function (error) {
      webix.message({ type: "error", text: error })
    });



  } /* End dayAtAGlance(). */

}; /* End Journal class. */
