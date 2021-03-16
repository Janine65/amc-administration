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
      winWidth: 1200, winHeight: 1600, winLabel: "Journal", winIcon: "mdi mdi-bank", winHotkey: "ctrl+j",
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
                    onChange: function (newV, oldV) {
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
                      id: "moduleJournal-closeFinalFiscalyear", view: "button", label: "Final Close", autowidth: true, type: "icon",
                      icon: "webix_icon mdi mdi-close", click() { wxAMC.modules['Journal'].closeFiscalYear(3); }, disabled: (wxAMC.UserRole == 'admin' ? false : true)
                    },
                    {
                      id: "moduleJournal-closeFiscalyear", view: "button", label: "Prov. Close", autowidth: true, type: "icon",
                      icon: "webix_icon mdi mdi-close", click() { wxAMC.modules['Journal'].closeFiscalYear(2); }, disabled: (wxAMC.UserRole == 'admin' ? false : true)
                    },
                    {
                      id: "moduleJournal-editFiscalyear", view: "button", label: "Edit", autowidth: true, type: "icon",
                      icon: "webix_icon mdi mdi-plus", click: this.editFiscalYear.bind(this), disabled: (wxAMC.UserRole == 'admin' ? false : true)
                    },
                    {
                      id: "moduleJournal-showFiscalyear", view: "button", label: "Show", autowidth: true, type: "icon",
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
                { id: "journalno", header: "No", adjust: true, hidden: false },
                {
                  id: "date", header: "Date", adjust: true,
                  editor: "date", hidden: false,
                  format: webix.i18n.dateFormatStr
                },
                { id: "faccount", header: "From", adjust: true, hidden: false, template: "#fromAccount.order# #fromAccount.name#" },
                { id: "taccount", header: "To", adjust: true, hidden: false, template: "#toAccount.order# #toAccount.name#" },
                {
                  id: "amount", header: "Amount",
                  editor: "text", hidden: false,
                  css: { 'text-align': 'right' }, format: webix.i18n.numberFormat
                },
                { id: "memo", header: "Booking text", fillspace: true, hidden: false },
                {
                  id: "receipt", header: "Receipt", adjust: true, hidden: false, template: function (obj) {
                    return (obj.receipt ? "<span class='mdi mdi-paperclip'></span>" : "");
                  }
                }
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
                    webix.html.removeCss($$("moduleJournal-dateSelect").getNode(), 'open')
                    webix.html.removeCss($$("moduleJournal-dateSelect").getNode(), 'prov-closed')
                    webix.html.removeCss($$("moduleJournal-dateSelect").getNode(), 'closed')
                    webix.html.addCss($$("moduleJournal-dateSelect").getNode(), value.$css)
                    if (value.$css == "closed" || wxAMC.UserRole != 'admin') {
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
                onAfterSelect: function (selection, preserve) {
                  if (wxAMC.UserRole == 'admin') {
                    $$("moduleJournal-editButton").enable();
                    $$("moduleJournal-copyButton").enable();
                    $$("moduleJournal-deleteButton").enable();
                  }
                },
                onItemDblClick: function (selection, preserve) {
                  if (selection.column == "receipt") {
                    const data = this.getItem(selection.row);
                    wxAMC.modules['Journal'].show_attachment(data);
                  } else {
                    if (wxAMC.UserRole == 'admin')
                      wxAMC.modules['Journal'].editExisting();
                  }
                }
              }
            },
            {
              view: "toolbar",
              cols: [
                { id: "count_journal", view: "label", label: "Anzahl 0" },
                { width: 6 },
                {
                  id: "moduleJournal-budgetButton", view: "button", label: "Budget", autowidth: true, type: "icon",
                  icon: "webix_icon mdi mdi-feature-search", click: this.showBudget.bind(this), disabled: (wxAMC.UserRole == 'admin' ? false : true)
                },
                {
                  id: "moduleJournal-accEditButton", view: "button", label: "Accounts", autowidth: true, type: "icon",
                  icon: "webix_icon mdi mdi-bank", click: this.showAccounts.bind(this)
                },
                { width: 6 },
                {
                  id: "moduleJournal-editButton", view: "button", label: "Edit", autowidth: true, type: "icon", disabled: true,
                  icon: "webix_icon mdi mdi-pen", click: this.editExisting.bind(this)
                },
                {
                  id: "moduleJournal-copyButton", view: "button", label: "Copy", autowidth: true, type: "icon", disabled: true,
                  icon: "webix_icon mdi mdi-content-copy", click: this.copyExisting.bind(this)
                },
                {
                  id: "moduleJournal-deleteButton", view: "button", label: "Delete", autowidth: true, type: "icon", disabled: true,
                  icon: "webix_icon mdi mdi-delete", click: () => { wxAMC.deleteHandler("Journal"); }
                },
                { width: 6 },
                {
                  id: "moduleJournal-exportButton", view: "button", label: "Export", autowidth: true, type: "icon",
                  icon: "webix_icon mdi mdi-export", click: this.exportJournalData.bind(this)
                },
                {
                  id: "moduleJournal-importButton", view: "button", label: "Import", autowidth: true, type: "icon",
                  icon: "webix_icon mdi mdi-import", click: this.importData.bind(this), disabled: (wxAMC.UserRole == 'admin' ? false : true)
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
                      view: "combo",
                      options: "/Account/getFkData",
                      name: "from_account",
                      label: "Konto Soll",
                      labelPosition: "top",
                      required: true,
                      css: "small",
                      width: 250
                    },
                    {
                      view: "combo",
                      options: "/Account/getFkData",
                      name: "to_account",
                      label: "Konto Haben",
                      labelPosition: "top",
                      required: true,
                      css: "small",
                      width: 250
                    },
                    {
                      label: "Text",
                      view: "text",
                      labelPosition: "top",
                      required: true,
                      name: "memo"
                    },
                    {
                      label: "Amount",
                      name: "amount",
                      view: "text",
                      required: false,
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
                          view: "datatable", id: "moduleJournal-FiscalYeardetailsTreeB1", borderless: true, scroll: true, footer: true,
                          columns: [
                            {
                              id: "order", header: { text: "Konto", colspan: 2 }, css: { "text-align": "right" }, width: 50,
                              footer: { text: "1", css: { "text-align": "right", "font-weight": "bold" } }
                            },
                            {
                              id: "name", header: "", fillspace: true, footer: { text: "Aktiv", css: { "font-weight": "bold" } }
                            },
                            {
                              id: "amount", header: { text: "Amount", css: { "text-align": "right" } }, width: 120, css: { "text-align": "right" },
                              format: webix.i18n.numberFormat,
                              footer: { content: "summColumn", css: { "text-align": "right", "font-weight": "bold" } }
                            }
                          ],
                          autoheight: false,
                          autowidth: false,
                          scheme: {
                            $sort: { by: "order", as: "int", dir: "asc" }
                          }
                        },
                        { width: 6, css: { "background": "#3498db" } },
                        {
                          view: "datatable", id: "moduleJournal-FiscalYeardetailsTreeB2", borderless: true, scroll: true, footer: true,
                          columns: [
                            {
                              id: "order", header: { text: "Konto", colspan: 2 }, css: { "text-align": "right" }, width: 50,
                              footer: { text: "2", css: { "text-align": "right", "font-weight": "bold" } }
                            },
                            {
                              id: "name", header: "", fillspace: true, footer: { text: "Passiv", css: { "font-weight": "bold" } }
                            },
                            {
                              id: "amount", header: { text: "Amount", css: { "text-align": "right" } }, width: 120, css: { "text-align": "right" },
                              format: webix.i18n.numberFormat,
                              footer: { content: "summColumn", css: { "text-align": "right", "font-weight": "bold" } }
                            }
                          ],
                          autoheight: false,
                          autowidth: false,
                          scheme: {
                            $sort: { by: "order", as: "int", dir: "asc" }
                          }
                        }
                      ] /* End cols */
                  }
                },
                {
                  header: "Erfolgsrechnung",
                  body:
                  {
                    cols:
                      [
                        {
                          view: "datatable", id: "moduleJournal-FiscalYeardetailsTreeE4", borderless: true, scroll: true, footer: true,
                          columns: [
                            {
                              id: "order", header: { text: "Konto", colspan: 2 }, css: { "text-align": "right" }, width: 50,
                              footer: { text: "4", css: { "text-align": "right", "font-weight": "bold" } }
                            },
                            {
                              id: "name", header: "", fillspace: true, footer: { text: "Aufwand", css: { "font-weight": "bold" } }
                            },
                            {
                              id: "amount", header: { text: "Amount", css: { "text-align": "right" } }, width: 120, css: { "text-align": "right" },
                              format: webix.i18n.numberFormat,
                              footer: { content: "summColumn", css: { "text-align": "right", "font-weight": "bold" } }
                            },
                            {
                              id: "budget", header: { text: "Budget", css: { "text-align": "right" } }, width: 120, css: { "text-align": "right" },
                              format: webix.i18n.numberFormat,
                              footer: { content: "summColumn", css: { "text-align": "right", "font-weight": "bold" } }
                            },
                            {
                              id: "diff", header: { text: "Diff", css: { "text-align": "right" } }, width: 120, css: { "text-align": "right" },
                              format: webix.i18n.numberFormat,
                              footer: { content: "summColumn", css: { "text-align": "right", "font-weight": "bold" } }
                            }
                          ],
                          autoheight: false,
                          autowidth: false,
                          scheme: {
                            $sort: { by: "order", as: "int", dir: "asc" }
                          }
                        },
                        { width: 6, css: { "background": "#3498db" } },
                        {
                          view: "datatable", id: "moduleJournal-FiscalYeardetailsTreeE6", borderless: true, scroll: true, footer: true,
                          columns: [
                            {
                              id: "order", header: { text: "Konto", colspan: 2 }, css: { "text-align": "right" }, width: 50,
                              footer: { text: "6", css: { "text-align": "right", "font-weight": "bold" } }
                            },
                            {
                              id: "name", header: "", fillspace: true, footer: { text: "Ertrag", css: { "font-weight": "bold" } }
                            },
                            {
                              id: "amount", header: { text: "Amount", css: { "text-align": "right" } }, width: 120, css: { "text-align": "right" },
                              format: webix.i18n.numberFormat,
                              footer: { content: "summColumn", css: { "text-align": "right", "font-weight": "bold" } }
                            },
                            {
                              id: "budget", header: { text: "Budget", css: { "text-align": "right" } }, width: 120, css: { "text-align": "right" },
                              format: webix.i18n.numberFormat,
                              footer: { content: "summColumn", css: { "text-align": "right", "font-weight": "bold" } }
                            },
                            {
                              id: "diff", header: { text: "Diff", css: { "text-align": "right" } }, width: 120, css: { "text-align": "right" },
                              format: webix.i18n.numberFormat,
                              footer: { content: "summColumn", css: { "text-align": "right", "font-weight": "bold" } }
                            }
                          ],
                          autoheight: false,
                          autowidth: false,
                          scheme: {
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
                  view: "button", label: "Zurück", autowidth: true,
                  type: "icon", icon: "mdi mdi-arrow-left",
                  click: () => {
                    $$("moduleJournal-itemsCell").show();
                  }
                },
                {},
                {
                  view: "button", label: "Export", autowidth: true, type: "icon",
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
                  readonly: true,
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
                  view: "radio",
                  options: [
                    { id: 1, value: "<span class='open'>Offen</span>" },
                    { id: 2, value: "<span class='prov-closed'>Prov. Abgeschlossen</span>" },
                    { id: 3, value: "<span class='closed'>Abgeschlossen</span>" }
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
                  view: "button", label: "Zurück", autowidth: true,
                  type: "icon", icon: "mdi mdi-arrow-left",
                  click: () => {
                    $$("moduleJournal-itemsCell").show();
                  }
                },
                {},
                {
                  view: "button", label: "Save", autowidth: true, type: "icon",
                  icon: "mdi mdi-content-save", id: "moduleJournal-saveButton", disabled: true, hotkey: "enter",
                  click: () => {
                    wxAMC.modules["Journal"].saveFiscalyear()
                  }
                },
                { width: 6 }
              ]
            } /* End journal details toolbar. */
          ]
        },
        {
          id: "moduleJournal-listAccounts",
          rows: [
            {
              cols: [
                {
                  width: 320,
                  rows: [
                    {
                      cols: [
                        { "label": "", view: "text", "height": 48, id: "listAccountSearch" },
                        {
                          "icon": "mdi mdi-magnify", view: "icon", "width": 38, "height": 0,
                          click: function () {
                            var value = $$("listAccountSearch").getValue().toLowerCase();
                            $$("listAccountsList").filter("#name#", value);
                          }
                        },
                        {
                          view: "checkbox", label: "all", value: 0, id: "listAccountAll", labelWidth: 38, width: 76,
                          click: function () {
                            wxAMC.modules['Journal'].refreshAccountList(this.getValue());
                          }
                        }
                      ]
                    },
                    {
                      view: "list", id: "listAccountsList",
                      template: function (obj) {
                        if (obj.status == 0)
                          return "<span class='inactive'>" + obj.order + " " + obj.name + "</span>";
                        else
                          return obj.order + " " + obj.name;
                      },
                      select: true,
                      padding: 40,
                      scheme: {
                        $sort: {
                          by: "order",
                          dir: "asc"
                        }
                      },
                      on: {
                        onAfterSelect: function (id) {
                          wxAMC.modules['Journal'].refreshAccountData();
                        }
                      }
                    }
                  ]
                },
                {
                  view: "resizer", css: { "background": "#3498db" }
                },
                {
                  id: "listAccountsData",
                  view: "datatable",
                  css: "webix_header_border webix_data_border",
                  select: true, autofit: true,
                  resizeColumn: { headerOnly: true },
                  scroll: true,
                  editable: false,
                  columns: [
                    { id: "journalno", header: "No.", fillspace: false, hidden: false },
                    {
                      id: "account",
                      header: "Account",
                      fillspace: true,
                      hidden: false,
                      adjust: true
                    },
                    {
                      id: "date",
                      header: "Datum",
                      fillspace: false,
                      format: webix.i18n.dateFormatStr,
                      hidden: false,
                      adjust: true
                    },
                    { id: "memo", header: "Memo", fillspace: true, hidden: false },
                    {
                      id: "soll",
                      header: "Soll",
                      fillspace: false,
                      hidden: false,
                      adjust: true,
                      css: { 'text-align': 'right' },
                      format: webix.i18n.numberFormat
                    },
                    {
                      id: "haben",
                      header: "Haben",
                      fillspace: false,
                      hidden: false,
                      adjust: true,
                      css: { 'text-align': 'right' },
                      format: webix.i18n.numberFormat
                    }
                  ],
                  hover: "hoverline",
                  on: {
                    onBeforeLoad: function () {
                      this.showOverlay("Loading...");
                    },
                    onAfterLoad: function () {
                      this.hideOverlay();
                      $$("count_accjournal").setValue("Anzahl " + (this.count() - 1));
                    }
                  }
                }
              ]
            },
            {
              view: "toolbar",
              "height": 44,
              "cols": [
                {
                  view: "button", label: "Zurück", autowidth: true,
                  type: "icon", icon: "mdi mdi-arrow-left",
                  click: () => {
                    $$("moduleJournal-itemsCell").show();
                  }
                },
                { view: "label", "label": "Anzahl", id: "count_accjournal" },
                {},
                {
                  "label": "Add", view: "button", "height": 0, "autowidth": true,
                  type: "icon", icon: "mdi mdi-plus",
                  click: this.addAccount.bind(this), disabled: (wxAMC.UserRole == 'admin' ? false : true)
                },
                {
                  "label": "Edit", view: "button", "height": 0, "autowidth": true,
                  type: "icon", icon: "mdi mdi-pencil",
                  click: this.editAccount.bind(this), disabled: (wxAMC.UserRole == 'admin' ? false : true)
                },
                {
                  view: "button", "label": "Export Active", "height": 0, "autowidth": true,
                  type: "icon", icon: "mdi mdi-export",
                  click: this.exportAccount.bind(this)
                },
                {
                  view: "button", "label": "Export All", "autowidth": true,
                  type: "icon", icon: "mdi mdi-file-excel",
                  click: this.exportAllAccounts.bind(this)
                }
              ]
            }
          ]
        }, /* End AccountList */
        /* ---------- Account details cell. ---------- */
        {
          id: "Account-details",
          rows: [
            /* Account details form. */
            {
              view: "form", id: "Account-detailsForm", borderless: false, scroll: true,
              elementsConfig: {
                on: {
                  onChange: () => {
                    $$("Account-saveButton")
                    [$$("Account-detailsForm").validate() ? "enable" : "disable"]();
                  }
                }
              },
              elements: [
                {
                  label: "Level",
                  view: "combo",
                  options: [
                    { id: "1", value: "1 Aktivkonto" },
                    { id: "2", value: "2 Passivkonto" },
                    { id: "4", value: "4 Aufwandkonto" },
                    { id: "6", value: "6 Ertragkonto" },
                    { id: "9", value: "9 Hilfskonto" }
                  ],
                  required: true,
                  name: "level",
                  labelWidth: 100
                },
                {
                  view: "text",
                  label: "Order",
                  attributes: {
                    maxlength: 4,
                    required: "true",
                    title: "Order"
                  },
                  name: "order",
                  type: "number",
                  labelWidth: 100,
                  validate: "isNumber", validateEvent: "key"
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
                  view: "checkbox",
                  required: true,
                  name: "status",
                  labelWidth: 100,
                  value: 1
                }
              ]
            }, /* End account details form. */
            /* Account details toolbar. */
            {
              view: "toolbar",
              cols: [
                { width: 6 },
                {
                  view: "button", label: "Zurück", autowidth: true,
                  type: "icon", icon: "mdi mdi-arrow-left",
                  click: () => {
                    $$("moduleJournal-listAccounts").show();
                  }
                },
                {},
                {
                  view: "button", label: "Save", autowidth: true, type: "icon",
                  icon: "mdi mdi-content-save", id: "Account-saveButton", disabled: true, hotkey: "enter",
                  click: () => {
                    wxAMC.modules["Journal"].saveAccount()
                  }
                },
                { width: 6 }
              ]
            } /* End account details toolbar. */
          ]
        },
        { /* Begin Journal Attachment */
          id: "journalAtt-Detail",
          rows: [
            {
              view: "form", id: "journalAtt-Form",
              elements: [
                { view: "text", label: "Journal", labelPosition: "top", name: "journaltext", readonly: true },
                {
                  view: "uploader", value: 'Attachments', link: "journalupload_list", apiOnly: true,
                  upload: "/uploadFiles", accept: "application/pdf",
                  multiple: false, autosend: false,
                  name: "uploadFiles", id: "journalupload"
                },
                {
                  view: "list",
                  id: "journalupload_list",
                  type: "uploader",

                  autoheight: false,
                  height: 50,
                  scroll: false,
                  borderless: true
                }, /* End Journal Attachment From */
                { /* Begin Journal Attachment Toolbar */
                  view: "toolbar",
                  cols: [
                    { width: 6 },
                    {
                      view: "button", label: "Zurück", autowidth: true,
                      type: "icon", icon: "webix_icon mdi mdi-arrow-left",
                      click: () => {
                        $$("moduleJournal-itemsCell").show();
                      }
                    },
                    {},
                    {
                      id: "journalAtt-sendButton", view: "button", label: "Senden",
                      autowidth: true, type: "icon",
                      icon: "webix_icon mdi mdi-email-send",
                      click: this.save_attachment.bind(this)
                    }
                  ]
                } /* End Journal Attachment toolbar */
              ]
            }
          ]
        },
        { /* Begin Journal Attachment */
          id: "journalAtt-View",
          rows: [
            {
              view: "form", id: "journalAtt-ViewForm",
              elements: [
                { view: "text", label: "Journal", labelPosition: "top", name: "journaltext", readonly: true },
                // {
                //   view:"context",
                //   body:{ content:"details" },
                //   padding: 20,
                //   master:"areaA"
                // }
                { view: "iframe", id: "pdfFilename" }
              ]
            },
            { /* Begin Journal Attachment Toolbar */
              view: "toolbar",
              cols: [
                { width: 6 },
                {
                  view: "button", label: "Zurück", autowidth: true,
                  type: "icon", icon: "webix_icon mdi mdi-arrow-left",
                  click: () => {
                    $$("moduleJournal-itemsCell").show();
                  }
                },
                {},
                {
                  view: "button", label: "Löschen", autowidth: true,
                  type: "icon", icon: "webix_icon mdi mdi-delete",
                  click: this.del_attachment.bind(this), disabled: (wxAMC.UserRole == 'admin' ? false : true)
                },
              ]
            } /* End Journal Attachment toolbar */
          ]
        },
        {
          id: "moduleJournal-listBudget",
          rows: [
            { /* Begin Budget List */
              columns: [
                { id: "order", header: "Order", template: "#acc.order#", sort: "string", autowidth: true, hidden: false },
                { id: "name", header: "Account", template: "#acc.name#", fillspace: true, sort: "string", hidden: false },
                { id: "amount", header: "Budget", type: "number", editor: "text", autowidth: true, hidden: false },
                { id: "memo", header: "Notes", editor: "text", autowidth: true, hidden: false }
              ],
              view: "datatable",
              id: "listBudgetList",
              select: true, autofit: true,
              resizeColumn: { headerOnly: true },
              scroll: true,
              editable: true,
              editaction: "custom",
              on: {
                onItemClick: function (id) {
                  this.editColumn(id);
                }
              }
            }, /* End Budget List */
            { /* Begin Budget Toolbar */
              view: "toolbar",
              cols: [
                { width: 6 },
                {
                  view: "button", label: "Zurück", autowidth: true,
                  type: "icon", icon: "webix_icon mdi mdi-arrow-left",
                  click: () => {
                    $$("moduleJournal-itemsCell").show();
                  }
                },
                {},
                {
                  view: "button", label: "Save", autowidth: true,
                  type: "icon", icon: "webix_icon mdi mdi-content-save",
                  click: this.saveBudget.bind(this), disabled: (wxAMC.UserRole == 'admin' ? false : true)
                }
              ]
            } /* End Budget Toolbar */
          ]
        }, /* End Budget list */
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

  show_attachment(data) {
    if (!data.receipt) {
      if (wxAMC.UserRole == 'admin') {
        // show add attachment
        data.journaltext = data.date + " " + data.memo;
        $$("journalAtt-Form").setValues(data);
        $$("journalupload").addDropZone($$("journalupload_list").$view, "Drop files here");
        $$("journalAtt-Detail").show();
      }
    } else {
      // Anhang anzeigen oder hinzufügen, wenn null
      data.journaltext = data.date + " " + data.memo;
      const promiseObj = fetch('/Journal/getAtt?id=' + data.id)
        .then(function (response) {
          if (!response.ok)
            webix.message('Fehler beim Schreiben der Kontoauszüge', 'Error');
          return response.json();
        })
        .catch(function (error) {
          webix.message({ type: "error", text: error })
        });

      Promise.resolve(promiseObj)
        .then(function (res) {
          console.log(res.filename);
          data.downloadFile = res.filename;
          $$("journalAtt-ViewForm").setValues(data);
          $$("pdfFilename").load(data.downloadFile);
          $$("journalAtt-View").show();
        })
        .catch(err => webix.message(err, "error"));
    }
  }
  /**
   * save_attachment
   */
  save_attachment() {
    $$("journalupload").send(function () {
      fetch('/Journal/addAtt', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify($$("journalAtt-Form").getValues())
      })
        .then(resp => {
          if (!resp.ok) {
            webix.message(resp.statusText, "error")
            return null
          }
          if (resp.type == "error") {
            webix.message(resp.message, "error")
            return null
          }
          $$("moduleJournal-itemsCell").show();
          wxAMC.modules['Journal'].refreshData();
          return resp.json();
        })
        .catch(e => webix.message(e, "error", -1))
    });
  }

  /**
   * del_attachment
   */
  del_attachment() {
    const data = $$("journalAtt-ViewForm").getValues();
    fetch('/Journal/delAtt', {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: data.id })
    })
      .then(resp => {
        if (!resp.ok) {
          webix.message(resp.statusText, "error")
          return null
        }
        if (resp.type == "error") {
          webix.message(resp.message, "error")
          return null
        }
        $$("moduleJournal-itemsCell").show();
        wxAMC.modules['Journal'].refreshData();
        return resp.json();
      })
      .catch(e => webix.message(e, "error", -1));
  }

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

    var data = { year: sJahr, name: value[0], state: state };

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
        list.load("/Fiscalyear/getFkData", async function () {
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

  showBudget() {
    $$("moduleJournal-listBudget").show();
    $$("listBudgetList").clearAll();
    this.refreshBudgetList();
  }

  refreshBudgetList() {
    $$("listBudgetList").clearAll();
    $$("listBudgetList").load("/Budget/data?jahr=" + $$("moduleJournal-dateSelect").getValue());
  }

  saveBudget() {
    //TODO #39
    $$("listBudgetList").editStop();
    $$("listBudgetList").data.each(function (obj) {

      // add or upd record
      var data = { id: obj.id, account: obj.acc.id, amount: (obj.amount == "" ? 0 : obj.amount), memo: obj.memo, year: $$("moduleJournal-dateSelect").getValue() };
      //console.log(data);
      const url = "/Budget/data";
      var method = "PUT";
      if (obj.id == undefined)
        method = "POST";

      fetch(url, {
        method: method, // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json'
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
      })
        .then((response) => {
          if (!response.ok) { // ***
            webix.message({
              type: "error",
              text: "HTTP error " + response.status
            }); // ***
          }
        })
        .catch(e => webix.message({
          type: "error",
          text: e
        }));
    });
    $$("moduleJournal-itemsCell").show();
  }

  showAccounts() {
    $$("moduleJournal-listAccounts").show();

    $$("listAccountsList").clearAll();
    $$("listAccountsData").clearAll();
    $$("listAccountSearch").setValue("");
    $$("listAccountAll").setValue(0);
    this.refreshAccountList(0);
  }

  refreshAccountList(all) {
    $$("listAccountsList").clearAll();
    $$("listAccountsData").clearAll();
    $$("listAccountsList").load("/Account/data?jahr=" + $$("moduleJournal-dateSelect").getValue() + "&all=" + all);
  }

  addAccount() {
    var itemData = { id: 0, status: 1 };
    $$("Account-detailsForm").clear();
    $$("Account-details").show();
    $$("Account-detailsForm").setValues(itemData);
  }

  editAccount() {
    var itemData = $$("listAccountsList").getSelectedItem();
    console.log(itemData);
    $$("Account-detailsForm").clear();
    $$("Account-detailsForm").setValues(itemData);
    $$("Account-details").show();
  }

  exportAccount() {
    const sJahr = $$("moduleJournal-dateSelect").getValue();

    // read the fiscalyear to handle all the rights
    const promiseAccount = fetch("/Account/export?jahr=" + sJahr + "&all=0")
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Schreiben der Kontoauszüge', 'Error');
        return response.json();
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });

    Promise.resolve(promiseAccount)
      .then(function (data) {
        if (data.type == "info") {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", "./exports/" + data.filename, true);
          xhr.responseType = "blob";
          xhr.onload = function (e) {
            if (this.status === 200) {
              // blob response
              webix.html.download(this.response, data.filename);
              webix.message(data.message, "Info");
            }
          };
          xhr.send();
        } else {
          webix.message(data.message, "Error");
        }
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });
  }

  exportAllAccounts() {
    const sJahr = $$("moduleJournal-dateSelect").getValue();

    // read the fiscalyear to handle all the rights
    const promiseAccount = fetch("/Account/export?jahr=" + sJahr + "&all=1")
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Schreiben der Kontoauszüge', 'Error');
        return response.json();
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });

    Promise.resolve(promiseAccount)
      .then(function (data) {
        if (data.type == "info") {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", "./exports/" + data.filename, true);
          xhr.responseType = "blob";
          xhr.onload = function (e) {
            if (this.status === 200) {
              // blob response
              webix.html.download(this.response, data.filename);
              webix.message(data.message, "Info");
            }
          };
          xhr.send();
        } else {
          webix.message(data.message, "Error");
        }
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });
  }

  async saveAccount() {
    const itemData = $$("Account-detailsForm").getValues();
    if (!$$("Account-detailsForm").isDirty()) {
      webix.message({
        type: "info",
        text: "Keine Änderungen vorgenommen"
      });
      $$("moduleJournal-listAccounts").show();
      return;
    }

    if (itemData.level != itemData.order.substr(0, 1)) {
      webix.message({
        type: "error",
        text: "Kontonummer passt nicht zur gewählten Kontogruppe", expire: 0
      })
      return;
    }

    if (itemData.order.length != 4) {
      webix.message({
        type: "error",
        text: "Kontonummer muss 4-stelig sein.", expire: 0
      })
      return;
    }

    var fValid = true;

    if (itemData.id == undefined || itemData.id == 0) {
      const promiseModule = fetch("/Account/getOneDataByOrder?order=" + itemData.order)
        .then(function (response) {
          if (!response.ok)
            webix.message('Fehler beim Lesen der Konten', 'Error');
          fValid = false;
          return response.json();
        }).catch(function (error) {
          fValid = false;
          webix.message({ type: "error", text: error })
          console.log(error);
        });
      await Promise.resolve(promiseModule)
        .then(function (counts) {
          console.log('count', counts);
          if (counts > 0) {
            fValid = false;
            webix.message({
              type: "error",
              text: "Kontonummer ist nicht eindeutig"
            })
            return;
          }
        })
        .catch(function (error) {
          fValid = false;
          webix.message({ type: "error", text: error });
          console.log(error);
          return;
        });
    }

    if (fValid) {
      const url = "/Account/data";
      var smethond = (itemData.id > 0 ? "PUT" : "POST");

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
          if (!response.ok) { // ***
            webix.message({
              type: "error",
              text: "Error " + response.status + " - " + response.statusText
            });
          }
        }).then(function () {
          // Refresh the module's summary list and return to that list.

          wxAMC.modules['Journal'].refreshAccountList($$("listAccountAll").getValue());
          wxAMC.modules['Journal'].refreshData();
          $$("moduleJournal-listAccounts").show();

          // Finally, show a completion message.
          webix.message({
            type: "success",
            text: "gesichert"
          });
        })
        .catch((e) => webix.message({
          type: "error",
          text: e
        }));
    }
  }

  /**
   * refreshAccountData: Read the entries for the selected account
   */
  refreshAccountData() {
    var sJahr = $$("moduleJournal-dateSelect").getValue();
    var itemAcc = $$("listAccountsList").getSelectedItem();

    var url = "/Journal/getAccData?jahr=" + sJahr + "&acc=" + itemAcc.id;

    const promiseModule = fetch(url)
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Lesen der Buchungen', 'Error');
        return response.json();
      }).catch(function (error) {
        webix.message({ type: "error", text: error })
        console.log(error);
      });
    Promise.resolve(promiseModule)
      .then(function (dataItems) {
        const itemsAsArray = wxAMC.objectAsArray(dataItems);

        var iSaldo = 0
        for (let ind2 = 0; ind2 < itemsAsArray.length; ind2++) {
          const element = itemsAsArray[ind2];
          iSaldo -= eval(element.soll * 1);
          iSaldo += eval(element.haben * 1);
        }
        var record = { id: 0, journalno: "", account: "", memo: "Saldo", date: new Date(), soll: (iSaldo < 0 ? iSaldo * -1 : null), haben: (iSaldo < 0 ? null : iSaldo) };

        itemsAsArray.push(record);
        $$("listAccountsData").clearAll();
        $$("listAccountsData").parse(itemsAsArray);

      })
      .catch(function (error) {
        webix.message({ type: "error", text: error });
        console.log(error);
      });
  }

  /**
   * Close the Fiscalyear
   */
  closeFiscalYear(iStatus) {
    var sJahr = $$("moduleJournal-dateSelect").getValue();
    if (sJahr == "")
      sJahr = wxAMC.parameter.get("CLUBJAHR");
    const url = "/Fiscalyear/close?jahr=" + sJahr + "&status=" + iStatus;

    const promiseModule = fetch(url, { method: 'POST' })
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Schliessen des Buchungsjahres', 'Error');
        return response.json();
      }).catch(function (error) {
        webix.message({ type: "error", text: error })
      });
    Promise.resolve(promiseModule)
      .then(async function (response) {
        if (response != null && response.type == "error") {
          webix.message({ type: "error", text: response.message });
        } else {
          // Window schliessen
          $$("moduleWindow-Journal").close();
          $$("taskbar").removeView("moduleTasbbarButton-Journal");

          // Window neu starten
          await wxAMC.launchModule('Journal');
          wxAMC.modules['Journal'].dayAtAGlance();
          webix.message({ type: "info", text: "Meldung" });
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

        var arAktiv = [], arPassiv = [], arAufwand = [], arErtrag = [];
        var iGewinnVerlust = 0;
        var iGewinnVerlustBudget = 0;

        for (let ind2 = 0; ind2 < itemsAsArray.length; ind2++) {
          const element = itemsAsArray[ind2];
          if ((element.amount != null || element.$css == "") && element.level != element.order) {
            if (element.amount == null)
              element.amount = 0
            switch (element.level) {
              case 1:
                arAktiv.push(element);
                iGewinnVerlust -= parseFloat(element.amount);
                break;

              case 2:
                arPassiv.push(element);
                iGewinnVerlust += parseFloat(element.amount);
                break;

              case 4:
                arAufwand.push(element);
                iGewinnVerlustBudget += parseFloat(element.budget);
                break;

              case 6:
                arErtrag.push(element);
                iGewinnVerlustBudget -= parseFloat(element.budget);
                break;

              default:
                break;
            }
          }

        }

        $$("moduleJournal-FiscalYeardetails").show();
        var record1 = {};
        record1.id = 0;
        record1.order = 9998
        record1.amount = Math.abs(iGewinnVerlust);

        var record2 = {};
        record2.id = 0;
        record2.order = 9998
        record2.amount = Math.abs(iGewinnVerlust);
        record2.budget = Math.abs(iGewinnVerlustBudget);
        record2.diff = record2.budget - record2.amount;

        if (iGewinnVerlust >= 0) {
          record1.name = "Verlust"
          record1.level = 1
          record1.$css = 'closed'
          arAktiv.push(record1);

          record2.name = "Verlust"
          record2.level = 6
          record2.$css = 'closed'
          arErtrag.push(record2);
        } else {
          record1.name = "Gewinn"
          record1.$css = 'open'
          record1.level = 2
          arPassiv.push(record1);

          record2.name = "Gewinn"
          record2.$css = 'open'
          record2.level = 4
          arAufwand.push(record2);
        }

        $$("moduleJournal-FiscalYeardetailsTreeB1").clearAll();
        $$("moduleJournal-FiscalYeardetailsTreeB1").parse(arAktiv);

        $$("moduleJournal-FiscalYeardetailsTreeB2").clearAll();
        $$("moduleJournal-FiscalYeardetailsTreeB2").parse(arPassiv);

        $$("moduleJournal-FiscalYeardetailsTreeE4").clearAll();
        $$("moduleJournal-FiscalYeardetailsTreeE4").parse(arAufwand);

        $$("moduleJournal-FiscalYeardetailsTreeE6").clearAll();
        $$("moduleJournal-FiscalYeardetailsTreeE6").parse(arErtrag);
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
   * Exportiert das Journal
   */
  exportJournalData() {
    const sJahr = $$("moduleJournal-dateSelect").getValue();

    const promiseJournal = fetch("/Journal/export?jahr=" + sJahr)
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Exportieren des Journals', 'Error');
        return response.json();
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });

    Promise.resolve(promiseJournal)
      .then(function (data) {
        if (data.type == "info") {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", "./exports/" + data.filename, true);
          xhr.responseType = "blob";
          xhr.onload = function (e) {
            if (this.status === 200) {
              // blob response
              webix.html.download(this.response, data.filename);
              webix.message(data.message, "Info");
            }
          };
          xhr.send();
        } else {
          webix.message(data.message, "Error");
        }
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });


  } /* exportJournalData */

  /**
   * Export selected data to Excel
   */
  exportData() {
    const sJahr = $$("moduleJournal-dateSelect").getValue();

    // read the fiscalyear to handle all the rights
    const promiseFiscal = fetch("/Fiscalyear/export?jahr=" + sJahr)
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim schreiben der Exceldatei', 'Error');
        return response.json();
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });

    Promise.resolve(promiseFiscal)
      .then(function (data) {
        if (data.type == "info") {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", "./exports/" + data.filename, true);
          xhr.responseType = "blob";
          xhr.onload = function (e) {
            if (this.status === 200) {
              // blob response
              webix.html.download(this.response, data.filename);
              webix.message(data.message, "Info");
            }
          };
          xhr.send();
        } else {
          webix.message(data.message, "Error");
        }
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
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
    journal.receipt = null;
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
            status = "<span class='open'>" + data.name + " - offen</span>"
            break;
          case 2:
            status = "<span class='prov-closed'>" + data.name + " - prov. abgeschlossen</span>"
            break;
          default:
            status = "<span class='closed'>" + data.name + " - abgeschlossen</span>"
            break;
        }
        rows.push(
          {
            view: "fieldset", label: "Buchhaltung", body: {
              rows: [
                { view: "label", label: status }
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
