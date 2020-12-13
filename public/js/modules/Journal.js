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
      winWidth: 1200, winHeight: 800, winLabel: "Journal", winIcon: "mdi mdi-bank", winHotkey: "ctrl+j",
      winCss: "authenticate_admin",
      id: "moduleJournal-container",
      cells: [
        /* ---------- Journal list cell. ---------- */
        {
          id: "moduleJournal-itemsCell",
          rows: [
            {
              cols: [
                {
                  view: "richselect", id: "moduleJournal-dateSelect",
                  options: "/Fiscalyear/getFkData",
                  value: wxAMC.parameter.get('CLUBJAHR'),
                  css: 'open',
                  on: {
                    onChange: function(newV, oldV) {                      
                      if (oldV) webix.html.removeCss(this.getNode(), this.getList().getItem(oldV).$css);
                      if (newV) webix.html.addCss(this.getNode(), this.getList().getItem(newV).$css);
                      wxAMC.modules['Journal'].refreshData();
                    }
                  }
                },
                {
                  view: "toolbar",
                  cols: [
                    {
                      id: "moduleJournal-closeFinalFiscalyear", view: "button", label: "Final Close", width: "120", type: "icon",
                      icon: "webix_icon mdi mdi-close", click () { wxAMC.modules['Journal'].closeFiscalYear(3); }
                    },
                    {
                      id: "moduleJournal-closeFiscalyear", view: "button", label: "Prov. Close", width: "120", type: "icon",
                      icon: "webix_icon mdi mdi-close", click () { wxAMC.modules['Journal'].closeFiscalYear(2); }
                    },
                    {
                      id: "moduleJournal-editFiscalyear", view: "button", label: "Edit", width: "80", type: "icon",
                      icon: "webix_icon mdi mdi-plus", click: this.editFiscalYear.bind(this)
                    },
                    {
                      id: "moduleJournal-showFiscalyear", view: "button", label: "Show", width: "80", type: "icon",
                      icon: "webix_icon mdi mdi-waves", click: this.showFiscalYear.bind(this)
                    }
                  ]
                }
              ]
            },
            {
              view: "datatable", id: "moduleJournal-items",
              css: "webix_header_border webix_data_border",
              select: true, autofit: true,
              resizeColumn: { headerOnly: true },
              scroll: true,
              editable: false,
              columns: [
                { id: "journalNo", header: "No", adjust: true, hidden: false },
                {
                  id: "date", header: "Date", adjust: true,
                  "editor": "date", hidden: false,
                  format: webix.i18n.dateFormatStr
                },
                { header: "From", adjust: true, hidden: false, template: "#fromAccount.order# #fromAccount.name#" },
                { header: "To", adjust: true, hidden: false, template: "#toAccount.order# #toAccount.name#" },
                {
                  id: "amount", header: "Amount",
                  "editor": "text", hidden: false,
                  css: { 'text-align': 'right' }, format: webix.i18n.numberFormat
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
                  icon: "webix_icon mdi mdi-pen", click: this.editExisting.bind(this)
                },
                {
                  id: "moduleJournal-copyButton", view: "button", label: "Copy", width: "80", type: "icon", disabled: true,
                  icon: "webix_icon mdi mdi-content-copy", click: this.copyExisting.bind(this)
                },
                {
                  id: "moduleJournal-deleteButton", view: "button", label: "Delete", width: "80", type: "icon", disabled: true,
                  icon: "webix_icon mdi mdi-delete", click: () => { wxAMC.deleteHandler("Journal"); }
                },
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
              view: "form", id: "moduleJournal-addForm",
              "autoheight": true,
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
                      labelPosition: "top",
                      required: true,
                      width: 200
                    },
                    {
                      view: "combo", suggest: "/Account/getFkData", name: "to_account", label: "Konto",
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
                      format: "1'111.00",
                      labelPosition: "top",
                      placeholder: "0.00",
                      width: 100,
                      labelAlign: "right",
                      inputAlign: "right"
                    }
                  ]
                },
                {
                  cols: [
                    {
                      view: "button", css: "webix_primary", label: "Clear",
                      icon: "mdi mdi-close-octagon", id: "moduleJournal-clearButton",
                      click: () => {
                        $$("moduleJournal-addForm").clear();
                        this.isEditingExisting = false;
                        this.editingID = 0;
                      }
                    },
                    {
                      view: "button", css: "webix_primary", label: "Save",
                      icon: "mdi mdi-content-save", id: "moduleJournal-addButton", disabled: true,
                      click: () => {
                        wxAMC.saveHandler("Journal", "moduleJournal-addForm");
                        $$("moduleJournal-addForm").clear();
                        this.isEditingExisting = false;
                        this.editingID = 0;
                      }
                    }
                  ]
                }
              ]
            }
          ] /* End journal list rows. */
        }, /* End journal list cell. */
        /* ---------- Fiscal Overview cell. ---------- */
        {
          id: "moduleJournal-FiscalYeardetails",
          rows: [
            {
              view: "tabview",
              cells: [
                {
                  header: "Bilanz",
                  body:
                  {
                    cols:
                      [
                        {
                          view: "treetable", id: "moduleJournal-FiscalYeardetailsTreeB1", borderless: true, scroll: true,
                          columns: [
                            { id: "order", header: "", css: { "text-align": "right" }, width: 50 },
                            {
                              id: "name", header: "Konto", width: 250,
                              template: function (obj, common) {
                                if (obj.$group) return common.treetable(obj, common) + obj.name;
                                return obj.name;
                              }
                            },
                            { id: "amount", header: "Amount", width: 200, css: { "text-align": "right" }, format: webix.i18n.numberFormat }
                          ],
                          autoheight: false,
                          autowidth: false,
                          scheme: {
                            $group: {
                              by: "level",
                              map: {
                                amount: ["amount", "sum"],
                                name: ["name"]
                              }
                            },
                            $sort: { by: "order", as: "int", dir: "asc" }
                          }
                        },
                        {
                          view: "treetable", id: "moduleJournal-FiscalYeardetailsTreeB2", borderless: true, scroll: true,
                          columns: [
                            { id: "order", header: "", css: { "text-align": "right" }, width: 50 },
                            {
                              id: "name", header: "Konto", width: 250,
                              template: function (obj, common) {
                                if (obj.$group) return common.treetable(obj, common) + obj.name;
                                return obj.name;
                              }
                            },
                            { id: "amount", header: "Amount", width: 200, css: { "text-align": "right" }, format: webix.i18n.numberFormat }
                          ],
                          autoheight: false,
                          autowidth: false,
                          scheme: {
                            $group: {
                              by: "level",
                              map: {
                                amount: ["amount", "sum"],
                                name: ["name"]
                              }
                            },
                            $sort: { by: "order", as: "int", dir: "asc" }
                          }
                        }
                      ]
                  }
                },
                {
                  header: "Erfolgsrechnung",
                  body:
                  {
                    cols:
                      [
                        {
                          view: "treetable", id: "moduleJournal-FiscalYeardetailsTreeE4", borderless: true, scroll: true,
                          columns: [
                            { id: "order", header: "", css: { "text-align": "right" }, width: 50 },
                            {
                              id: "name", header: "Konto", width: 250,
                              template: function (obj, common) {
                                if (obj.$group) return common.treetable(obj, common) + obj.name;
                                return obj.name;
                              }
                            },
                            { id: "amount", header: "Amount", width: 200, css: { "text-align": "right" }, format: webix.i18n.numberFormat }
                          ],
                          autoheight: false,
                          autowidth: false,
                          scheme: {
                            $group: {
                              by: "level",
                              map: {
                                amount: ["amount", "sum"],
                                name: ["name"]
                              }
                            },
                            $sort: { by: "order", as: "int", dir: "asc" }
                          }
                        },
                        {
                          view: "treetable", id: "moduleJournal-FiscalYeardetailsTreeE6", borderless: true, scroll: true,
                          columns: [
                            { id: "order", header: "", css: { "text-align": "right" }, width: 50 },
                            {
                              id: "name", header: "Konto", width: 250,
                              template: function (obj, common) {
                                if (obj.$group) return common.treetable(obj, common) + obj.name;
                                return obj.name;
                              }
                            },
                            { id: "amount", header: "Amount", width: 200, css: { "text-align": "right" }, format: webix.i18n.numberFormat }
                          ],
                          autoheight: false,
                          autowidth: false,
                          scheme: {
                            $group: {
                              by: "level",
                              map: {
                                amount: ["amount", "sum"],
                                name: ["name"]
                              }
                            },
                            $sort: { by: "order", as: "int", dir: "asc" }
                          }
                        }
                      ]
                  }
                }
              ]
            },
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
                  view: "button", label: "Export", width: "80", type: "icon",
                  icon: "mdi mdi-file-excel", id: "moduleJournal-excelFiscalButton", hotkey: "enter",
                  click: this.exportData.bind(this)
                },
                { width: 6 }
              ]
            }
          ]
        },
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
                  "timepicker": false,
                  "labelWidth": 100,
                  "format": "%d.%m.%Y",
                  name: "date"
                },
                {
                  label: "From Account",
                  view: "combo",
                  suggest: "/Account/getFkData",
                  required: true,
                  name: "from_account",
                  labelWidth: 100
                },
                {
                  label: "To Account",
                  view: "combo",
                  suggest: "/Account/getFkData",
                  required: true,
                  name: "to_account",
                  labelWidth: 100
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

  editFiscalYear() {

  }

  /**
   * Close the Fiscalyear
   */
   closeFiscalYear(iStatus) {
    var sJahr = $$("moduleJournal-dateSelect").getValue();
    if (sJahr == "")
      sJahr = wxAMC.parameter.get("CLUBJAHR");
    const url = "/Fiscalyear/close?jahr=" + sJahr + "&status=" + iStatus;

    const promiseModule = fetch(url, {method: 'POST'})
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Schliessen des Buchungsjahres', 'Error');
        return response.json();
      }).catch(function (error) {
        webix.message({ type: "error", text: error })
      });
    Promise.resolve(promiseModule)
      .then( async function (response) {
        if (response.type == "error") {
          webix.message({type: "error", text: response.message});
        } else {
          // Window schliessen
          $$("moduleWindow-Journal").close();
          $$("taskbar").removeView("moduleTasbbarButton-Journal");
          
          // Window neu starten
          await wxAMC.launchModule('Journal');
          wxAMC.modules['Journal'].dayAtAGlance();
          webix.message({ type: "info", text: response.message });
        }
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });
  }

  showFiscalYear() {
    var sJahr = $$("moduleJournal-dateSelect").getValue();
    if (sJahr == "")
      sJahr = wxAMC.parameter.get("CLUBJAHR");
    const url = "/Account/showData?jahr=" + sJahr;

    const promiseModule = fetch(url)
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Lesen der Accountdaten', 'Error');
        return response.json();
      }).catch(function (error) {
        webix.message({ type: "error", text: error })
      });
    Promise.resolve(promiseModule)
      .then(function (dataItems) {
        //console.log('dataItems: ',dataItems);
        // Get the items as an array of objects.
        const itemsAsArray = wxAMC.objectAsArray(dataItems);

        var arAktiv = itemsAsArray.filter(function(value, index, array) {
          return value.level == 1;
        });
        var arPassiv = itemsAsArray.filter(function(value, index, array) {
          return value.level == 2;
        });
        var arAufwand = itemsAsArray.filter(function(value, index, array) {
          return value.level == 4;
        });
        var arErfolg = itemsAsArray.filter(function(value, index, array) {
          return value.level == 6;
        });
        $$("moduleJournal-FiscalYeardetails").show();
        $$("moduleJournal-FiscalYeardetailsTreeB1").clearAll();
        $$("moduleJournal-FiscalYeardetailsTreeB1").parse(arAktiv);
        $$("moduleJournal-FiscalYeardetailsTreeB1").openAll();
        $$("moduleJournal-FiscalYeardetailsTreeB2").clearAll();
        $$("moduleJournal-FiscalYeardetailsTreeB2").parse(arPassiv);
        $$("moduleJournal-FiscalYeardetailsTreeB2").openAll();

        $$("moduleJournal-FiscalYeardetailsTreeE4").clearAll();
        $$("moduleJournal-FiscalYeardetailsTreeE4").parse(arAufwand);
        $$("moduleJournal-FiscalYeardetailsTreeE4").openAll();
        $$("moduleJournal-FiscalYeardetailsTreeE6").clearAll();
        $$("moduleJournal-FiscalYeardetailsTreeE6").parse(arErfolg);
        $$("moduleJournal-FiscalYeardetailsTreeE6").openAll();
      });
  }

  /**
   * Import Journal from an Excelfile
   */
  importData() {
    var message_text = "Exceldatei hier hochladen, um sie als Einträge ins Journal zu importieren";

    var compose_form = {
      view: "form", rows: [
        {
          view: "textarea", value: message_text, label: "message", labelPosition: "top", autoheight: true
        },
        {
          view: "uploader", value: 'Choose files', link: "mytemplate",
          upload: "/uploadFiles", accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          multiple: true, autosend: false,
          name: "uploadFiles", id: "fisupload",
          on: {
            onAfterFileAdd: () => { $$("fisupload_import").enable(); }
          }
        },
        {
          view: "list",
          id: "mytemplate",
          type: "uploader",
          autoheight: true,
          miniminHeight: 30,
          borderless: true
        },
        {
          cols: [
            {
              view: "button", value: "Start Import", id: "fisupload_import", disabled: true,
              click: function () {
                $$("fisupload").send(function (response) {
                  if (response) {
                    if (response.status == 'server')
                      wxAMC.importLoadedFile();
                    else
                      webix.message('Fehler beim Upload: ' + response.error);
                  }
                });
              }
            },
            {
              view: "button", value: "Cancel", click: function () { $$("message_win").close(); }
            }
          ]
        }
      ]
    };

    webix.ui({
      view: "window", body: compose_form, head: "Import File",
      width: 450, id: "message_win",
      position: "center"
    }).show();

  }


  /**
   * Export selected data to Excel
   */
  exportData() {

    if ($$("moduleJournal-FiscalYeardetails")) {
      const sJahr = $$("moduleJournal-dateSelect").getValue();

      // read the fiscalyear to handle all the rights
      const promiseFiscal = fetch("/Fiscalyear/export?jahr=" + sJahr)
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
          webix.message({type: 'Info', content: 'Export finished'});
          webix.send("./exports/Bilanz.xlsx", {}, "GET", "_blank");
        })
        .catch(function (error) {
          webix.message({ type: "error", text: error })
        });  
    } else {
      webix.toExcel($$("moduleJournal-items"), {
        filename: "Journal",
        rawValues: false
      });
    }
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
    $$("moduleJournal-addForm").clear();

    // Populate the form.
    $$("moduleJournal-addForm").setValues(journal);

  } /* End editExisting(). */


  /**
   * Handles clicks on the Save button.
   */
  async copyExisting() {

    const journal = $$("moduleJournal-items").getSelectedItem();
    journal.id = 0;
    // Set flag to indicate editing an existing journal and show the details.
    this.isEditingExisting = false;
    this.editingID = 0;

    // Clear the details form.
    $$("moduleJournal-addForm").clear();

    // Populate the form.
    $$("moduleJournal-addForm").setValues(journal);

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
    const promiseFiscal = fetch("/Fiscalyear/getOneData?jahr=" + sJahr)
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
        view: "fieldset", label: "Journal",
        body: { id: "dayAtAGlanceScreen_Journal", cols: [] }
      });
      $$("dayAtAGlanceBody").addView({ height: 20 });
    }

    // Populate the day-at-a-glance screen.
    var rows = [];

    const sJahr = wxAMC.parameter.get("CLUBJAHR");

    // read the fiscalyear to handle all the rights
    const promiseFiscal = fetch("/Fiscalyear/getOneData?jahr=" + sJahr)
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
          {
            view: "fieldset", label: "Buchhaltung", body: {
              rows: [
                { view: "label", label: data.name + status }
              ]
            }
          });
        webix.ui(rows, $$("dayAtAGlanceScreen_Journal"));
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });



  } /* End dayAtAGlance(). */

}; /* End Journal class. */
