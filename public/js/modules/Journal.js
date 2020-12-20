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
                  //value: wxAMC.parameter.get("CLUBJAHR"),
                  //css: "open",                  
                  on: {
                    onChange: function(newV, oldV) {                                    
                      if (oldV != "" && this.getList().getItem(oldV)) webix.html.removeCss(this.getNode(), this.getList().getItem(oldV).$css);
                      if (newV != "" && this.getList().getItem(newV)) webix.html.addCss(this.getNode(), this.getList().getItem(newV).$css);
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
                  var sJahr = $$("moduleJournal-dateSelect").getValue();
                  if (sJahr == "") {
                    $$("moduleJournal-dateSelect").setValue(wxAMC.parameter.get('CLUBJAHR'));                    
                    sJahr = wxAMC.parameter.get('CLUBJAHR');
                  }
                  this.hideOverlay();
                  $$("count_journal").setValue("Anzahl " + this.count());
                  const value = $$("moduleJournal-dateSelect").getList().getItem(sJahr);
                  if (value) {
                    console.log(value);
                    webix.html.removeCss($$("moduleJournal-dateSelect").getNode(), 'open')
                    webix.html.removeCss($$("moduleJournal-dateSelect").getNode(), 'prov-closed')
                    webix.html.removeCss($$("moduleJournal-dateSelect").getNode(), 'closed')
                    webix.html.addCss($$("moduleJournal-dateSelect").getNode(), value.$css)
                    if (value.$css == "closed") {
                      $$("moduleJournal-editButton").hide();
                      $$("moduleJournal-deleteButton").hide();
                      $$("moduleJournal-addForm").hide();
                    } else {
                      $$("moduleJournal-editButton").show();
                      $$("moduleJournal-deleteButton").show();
                      $$("moduleJournal-addForm").show();
                      $$("moduleJournal-editButton").disable();
                      $$("moduleJournal-deleteButton").disable();
                    }
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
                      css: "small",
                      width: 250
                    },
                    {
                      view: "combo", suggest: "/Account/getFkData", name: "to_account", label: "Konto",
                      labelPosition: "top",
                      required: true,
                      css: "small",
                      width: 250
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
                    ] /* End cols */
                  }
                },
                {
                  header: "Erfolgsrechnung",
                  body:
                    { cols:
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
                    ] /* End cols */
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
        /* ---------- Fiscalyear details cell. ---------- */
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
                {
                  view: "text",
                  label: "Jahr",
                  required: true,
                  name: "year",
                  labelWidth: 100
                },
                {
                  label: "Name",
                  view: "text",
                  required: true,
                  name: "name",
                  labelWidth: 100
                },
                {
                  label: "Status",
                  view: "combo",
                  options: [
                    {id: 1, value: "Offen"},
                    {id: 2, value: "Prov. Abgeschlossen"},
                    {id: 3, value: "Abgeschlossen"}
                  ],
                  required: true,
                  name: "state",
                  labelWidth: 100
                }
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
                    wxAMC.modules["Journal"].saveFiscalyear()
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
    const sJahr = $$("moduleJournal-dateSelect").getValue();
    const value = $$("moduleJournal-dateSelect").getList().getItem(sJahr).value.split(' - ');    

    var state = 1;
    switch (value[1]) {
      case "abgeschlossen":
        state = 3
        break;
      case "prov. abgeschlossen":
        state = 2
        break;
      
      default:
        state = 1
        break;
    }

    var data = {year: sJahr, name: value[0], state: state};

    $$("moduleJournal-details").show();
    $$("moduleJournal-detailsForm").clear();
    $$("moduleJournal-detailsForm").setValues(data);

  }

  /**
   * Save the edited Fiscalyear
   */
  saveFiscalyear() {    
    // Merge all forms together.  Usually there's just one, but some modules may have more than one.
    if ($$("moduleJournal-detailsForm").isDirty()) {
      var itemData = $$("moduleJournal-detailsForm").getValues();
    } else {
      webix.message({
        type: "info",
        text: "Keine Änderungen vorgenommen"
      });
      $$("moduleJournal-itemsCell").show();
      return;
    }

    console.log("saveHandler: itemData: ", itemData);
    const url = "/Fiscalyear/data";

    fetch(url, {
      method: "PUT", // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(itemData) // body data type must match "Content-Type" header
    })
      .then((response) => {
        if (!response.ok) { // ***
          webix.message({
            type: "error",
            text: "HTTP error " + response.status
          }); // ***
        }
      })
      .then(function () {
        // Refresh the module's summary list and return to that list.
        $$("moduleJournal-itemsCell").show();
        const itemOld = $$("moduleJournal-dateSelect").getList().getItem(itemData.year);
        var list = $$("moduleJournal-dateSelect").getList();
        list.clearAll();
        list.load("/Fiscalyear/getFkData", async function() {
          const item = $$("moduleJournal-dateSelect").getList().getItem(itemData.year);
          if (item) {
            await wxAMC.modules['Journal'].refreshData();

            webix.html.removeCss($$("moduleJournal-dateSelect").getNode(), itemOld.$css);          
            webix.html.addCss($$("moduleJournal-dateSelect").getNode(), item.$css);          
            $$("moduleJournal-dateSelect").setValue(item.id);
          }
          // Give the day-at-a-glance screen a chance to update (needed for desktop mode).
          wxAMC.dayAtAGlance();
  
          // Finally, show a completion message.
          webix.message({
            type: "success",
            text: "gesichert"
          });  
        })
        .catch(e => webix.message({
          type: "error",
          text: e
          }));
      })
      .catch((e) => webix.message({
        type: "error",
        text: e
      }));

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

  /**
   * Show details of Fiscalyear
   */
  showFiscalYear() {
    var sJahr = $$("moduleJournal-dateSelect").getValue();
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
          if (value.amount != null)
            return value.level == 1;
          else 
            return false;
        });
        var arPassiv = itemsAsArray.filter(function(value, index, array) {
          if (value.amount != null)
            return value.level == 2;
          else 
            return false;
        });
        var arAufwand = itemsAsArray.filter(function(value, index, array) {
          if (value.amount != null)
            return value.level == 4;
          else 
            return false;
        });
        var arErfolg = itemsAsArray.filter(function(value, index, array) {
          if (value.amount != null)
            return value.level == 6;
          else 
            return false;
        });

        var iGewinnVerlust = 0;
        arAktiv.forEach(element => {
          if (element.amount != null)            
            iGewinnVerlust -= parseFloat(element.amount);
        });
        arPassiv.forEach(element => {
          if (element.amount != null)
            iGewinnVerlust += parseFloat(element.amount);
        });

        $$("moduleJournal-FiscalYeardetails").show();
        console.log(iGewinnVerlust);
        var record1 = {};
        var record2 = {};

        if (iGewinnVerlust >= 0) {
          record1.id = 0;
          record1.order = 9999
          record1.name = "Verlust"
          record1.amount = iGewinnVerlust
          record1.level = 1
          record1.$css = 'closed'
          arAktiv.push(record1);  

          record2.id = 0;
          record2.order = 9999
          record2.name = "Verlust"
          record2.amount = iGewinnVerlust
          record2.level = 6
          record2.$css = 'closed'
          arErfolg.push(record2);
        } else {
          iGewinnVerlust *= -1;

          record1.id = 0;
          record1.order = 9999
          record1.name = "Gewinn"
          record1.amount = iGewinnVerlust
          record1.$css = 'open'
          record1.level = 2
          arPassiv.push(record1);  

          record2.id = 0;
          record2.order = 9999
          record2.name = "Gewinn"
          record2.amount = iGewinnVerlust
          record2.$css = 'open'
          record2.level = 4
          arAufwand.push(record2);
        }

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
    if (sJahr == "") {
      sJahr = wxAMC.parameter.get("CLUBJAHR");
    }
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
