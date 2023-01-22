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
    this.currentData = {};

  } /* End constructor. */


  custom_checkbox(obj, common, value) {
    if (value)
      return "<div class='webix_icon mdi mdi-checkbox-marked'></div>";
    else
      return "<div class='webix_icon mdi mdi-checkbox-blank-outline'></div>";
  }

  show_geworben(value, config) {
    if (value.adressenid != "" && value.adressenid != null) {
      return value.adressenid;
    } else return "";
  }

  /**
   * Return the module's UI config object.
   */
  getUIConfig() {

    return {
      winWidth: 1200, winHeight: 800, winLabel: "Adressen", winIcon: "mdi mdi-contacts", winHotkey: "ctrl+l",
      id: "moduleAdressen-container",
      cells: [
        /* ---------- Adresse list cell. ---------- */
        {
          id: "moduleAdressen-itemsCell",
          rows: [
            {
              view: "datatable", id: "moduleAdressen-items",
              css: "webix_header_border webix_data_border",
              select: true, autofit: true,
              resizeColumn: { headerOnly: true },
              scroll: true,
              editable: false,
              columns: [
                { id: "mnr", css: { 'text-align': 'right' }, header: [{ text: "MNR" }, { content: "numberFilter" }], sort: "int", adjust: true },
                {
                  id: "geschlecht", header: [{ text: "Geschlecht" }], options: [
                    { id: "1", value: "M" },
                    { id: "2", value: "W" }], sort: "text", adjust: true
                },
                { id: "name", header: [{ text: "Name" }, { content: "textFilter" }], sort: "string", adjust: true },
                { id: "vorname", header: [{ text: "Vorname" }, { content: "textFilter" }], sort: "string", adjust: true },
                { id: "adresse", header: [{ text: "Adresse" }, { content: "textFilter" }], adjust: true },
                { id: "plz", header: [{ text: "PLZ" }, { content: "numberFilter" }], adjust: true },
                { id: "ort", header: [{ text: "Ort" }, { content: "textFilter" }], adjust: true },
                { id: "land", header: [{ text: "Land" }, { content: "textFilter" }], adjust: true },
                { id: "telefon_p", header: "Telefon (P)" },
                { id: "mobile", header: "Mobile" },
                { id: "email", header: "Email" },
                { id: "notes", header: "Notizen", hidden: true },
                { id: "mnr_sam", css: { 'text-align': 'right' }, header: [{ text: "SAM Nr." }, { content: "numberFilter" }], sort: "int", adjust: true },
                { id: "sam_mitglied", css: { 'text-align': 'center' }, header: [{ text: "SAM Mitglied" }, { content: "selectFilter" }], sort: "int", template: this.custom_checkbox },
                { id: "ehrenmitglied", css: { 'text-align': 'center' }, header: [{ text: "Ehrenmitglied" }, { content: "selectFilter" }], sort: "int", template: this.custom_checkbox },
                { id: "vorstand", css: { 'text-align': 'center' }, header: [{ text: "Vorstand" }, { content: "selectFilter" }], sort: "int", template: this.custom_checkbox, hidden: false },
                { id: "revisor", css: { 'text-align': 'center' }, header: [{ text: "Revisor" }, { content: "selectFilter" }], sort: "int", template: this.custom_checkbox, hidden: false },
                { id: "allianz", css: { 'text-align': 'center' }, header: [{ text: "Allianz" }, { content: "selectFilter" }], sort: "int", template: this.custom_checkbox, hidden: false },
                { id: "eintritt", header: [{ text: "Eintritt" }, { content: "textFilter" }], sort: "text", adjust: true, template: function (obj) { return new Date(obj.eintritt).getFullYear(); }, hidden: false },
                { id: "austritt", header: [{ text: "Austritt" }, { content: "textFilter" }], sort: "text", adjust: true, template: function (obj) { return new Date(obj.austritt).getFullYear(); }, hidden: false },
                { id: "adressenid", header: [{ text: "Geworben von" }, { content: "selectFilter" }], sort: "text", adjust: "header", template: this.show_geworben, hidden: false }
              ],
              hover: "hoverline",
              sort: "multi",
              ready: function () {
                // this.sort([
                //   { by:"name", dir:"asc" }, 
                //   { by:"vorname", dir:"asc" }
                //   ]);
                // this.markSorting("name", "asc");
                // this.markSorting("vorname", "asc", true);
              },
              on: {
                onCollectValues:function(id, req){
                  if (id == "sam_mitglied" || id == "ehrenmitglied" || id == "vorstand" || id == "revisor" || id == "allianz") {
                    for(let i = 0; i<req.values.length; i++){
                      //console.info(req.values[i]);
                      if (req.values[i].value == false) {
                        req.values[i].value = "Nein";
                        req.values[i].id = 0;
                      } else {
                        req.values[i].value = "Ja";
                        req.values[i].id = 1;
                      }
                    }
                  }
                },
                onBeforeLoad: function () {
                  this.showOverlay("Loading...");
                },
                onAfterLoad: function () {
                  this.hideOverlay();
                  //console.info(this.count());
                  $$("count_adr").setValue("Anzahl " + this.count());
                },
                onAfterFilter: function () {
                  $$("count_adr").setValue("Anzahl " + this.count());
                },
                onAfterSelect: function (selection, preserve) {
                  $$("moduleAdressen-editButton").enable();
                  $$("moduleAdressen-deleteButton").enable();
                },
                onItemDblClick: function (selection, preserve) {
                  wxAMC.modules['Adressen'].editExisting();
                }
              }
            },
            {
              view: "toolbar",
              cols: [
                { id: "count_adr", view: "label", label: "Anzahl 0" },
                {},
                {
                  id: "moduleAdressen-printButton1", view: "button", default: true, label: "leer", width: "80", type: "icon", disabled: false,
                  icon: "webix_icon mdi mdi-file-excel", click: () => { wxAMC.excelDatasheet({ id: 0, type: 1 }); }
                },
                {
                  id: "moduleAdressen-printButton2", view: "button", default: true, label: "voll", width: "80", type: "icon", disabled: false,
                  icon: "webix_icon mdi mdi-file-excel", click: () => { wxAMC.excelDatasheet({ id: 0, type: 2 }); }
                },
                {
                  id: "moduleAdressen-emailAllButton", view: "button", label: "Email", width: "80", type: "icon",
                  icon: "webix_icon mdi mdi-email-plus", click: this.showEmailFormAll.bind(this)
                },
                {
                  id: "moduleAdressen-editButton", view: "button", label: "Edit", width: "80", type: "icon", disabled: true,
                  icon: "webix_icon mdi mdi-pencil", click: this.editExisting.bind(this)
                },
                {
                  id: "moduleAdressen-deleteButton", view: "button", label: "Delete", width: "80", type: "icon", disabled: true,
                  icon: "webix_icon mdi mdi-delete", click: () => { wxAMC.deleteHandler("Adressen"); }
                },
                {
                  id: "moduleAdressen-newButton", view: "button", label: "New", width: "80", type: "icon",
                  icon: "webix_icon mdi mdi-plus", click: this.newHandler.bind(this)
                },
                { width: 6 },
                {
                  id: "moduleAdressen-createBillButton", view: "button", label: "Billing", width: "80", type: "icon",
                  icon: "webix_icon mdi mdi-export", click: () => { this.createBill(true) }
                },
                {
                  id: "moduleAdressen-exportButton", view: "button", label: "Export", width: "80", type: "icon",
                  icon: "webix_icon mdi mdi-export", click: this.exportData.bind(this)
                },
                { width: 6 }
              ] /* End toolbar items. */
            } /* End toolbar. */
          ] /* End adresse list rows. */
          /* Adresse list toolbar. */
        }, /* End adresse list cell. */
        /* ---------- Memeber details cell. ---------- */
        {
          id: "moduleAdressen-details",
          view: "tabview", multiview: true,
          cells: [
            {
              header: "<span class='webix_icon mdi mdi-account-box'></span>Adresse",
              body: {
                rows: [
                  /* Adresse details form. */
                  {
                    view: "form", id: "moduleAdressen-detailsForm", borderless: false, scroll: true,
                    elementsConfig: {
                      labelWidth: 100,
                      on: {
                        onChange: () => {
                          $$("moduleAdressen-saveButton")
                          [$$("moduleAdressen-detailsForm").validate() ? "enable" : "disable"]();
                          $$("moduleAdressen-emailButton")
                          [$$("moduleAdressen-detailsForm").validate() && $$("moduleAdressen-detailsForm").elements.email.data.value != "" ? "enable" : "disable"]();
                        }
                      }
                    },
                    elements: [
                      { readonly: true, view: "text", name: "mnr", label: "MNR" },
                      {
                        view: "combo",
                        options: [{ id: "1", value: "männlich" }, { id: "2", value: "weiblich" }],
                        name: "geschlecht", label: "Geschlecht", required: true
                      },
                      {
                        view: "text", name: "name", label: "Name", required: true,
                        invalidMessage: "Name ist notwendig"
                      },
                      {
                        view: "text", name: "vorname", label: "Vorname", required: true,
                        invalidMessage: "Vorname ist notwendig"
                      },
                      {
                        view: "text", name: "adresse", label: "Adresse", required: true,
                        invalidMessage: "Strasse ist notwendig"
                      },
                      {
                        view: "text", width: 200, name: "plz", label: "PLZ", required: true,
                        invalidMessage: "PLZ ist notwendig", attributes: { maxlength: 5 }
                      },
                      {
                        view: "text", name: "ort", label: "Ort", required: true,
                        invalidMessage: "Ort ist notwendig"
                      },
                      {
                        view: "combo",
                        options: [{ id: "CH", value: "Schweiz" }, { id: "DE", value: "Deutschland" }],
                        name: "land", label: "Land", required: true
                      },
                      { view: "text", name: "telefon_p", label: "Telefon" },
                      { view: "text", name: "mobile", label: "Mobile" },
                      { view: "text", name: "email", label: "Email(s)" },
                      { view: "textarea", name: "notes", label: "Notizen" },
                      { view: "text", type: "number", name: "mnr_sam", label: "SAM Nr." },
                      { view: "checkbox", name: "sam_mitglied", label: "SAM Mitglied", width: 300 },
                      { view: "checkbox", name: "ehrenmitglied", label: "Ehrenmitglied", width: 300 },
                      { view: "checkbox", name: "vorstand", label: "Vorstand" },
                      { view: "checkbox", name: "revisor", label: "Revisor" },
                      { view: "datepicker", name: "eintritt", label: "Eintritt" },
                      { view: "datepicker", name: "austritt", label: "Austritt" },
                      { view: "combo", suggest: "/data/getFkData", name: "adressenid", label: "Geworben von" }
                    ]
                  }, /* End adresse details form. */
                  /* Adresse details toolbar. */
                  {
                    view: "toolbar",
                    cols: [
                      { width: 6 },
                      {
                        view: "button", label: "Zurück", width: "90",
                        type: "icon", icon: "mdi mdi-arrow-left",
                        click: () => {
                          $$("moduleAdressen-itemsCell").show();
                        }
                      },
                      {},
                      {
                        id: "moduleAdressen-printButton3", view: "button", default: true, label: "leer", width: "80", type: "icon", disabled: false,
                        icon: "webix_icon mdi mdi-file-excel", click: () => { wxAMC.excelDatasheet({ id: this.editingID, type: 1 }); }
                      },
                      {
                        id: "moduleAdressen-printButton4", view: "button", default: true, label: "voll", width: "80", type: "icon", disabled: false,
                        icon: "webix_icon mdi mdi-file-excel", click: () => { wxAMC.excelDatasheet({ id: this.editingID, type: 2 }); }
                      },
                      {
                        id: "moduleAdressen-createBillButtonOne", view: "button", label: "Billing", width: "80", type: "icon",
                        icon: "webix_icon mdi mdi-export", click: () => { this.createBill(false) }
                      },
                      {
                        id: "moduleAdressen-emailButton", view: "button", label: "Email",
                        width: "80", type: "icon",
                        icon: "webix_icon mdi mdi-email-plus", disabled: true,
                        click: this.showEmailFormOne.bind(this)
                      },
                      {},
                      {
                        view: "button", label: "Save", width: "80", type: "icon",
                        icon: "mdi mdi-content-save", id: "moduleAdressen-saveButton", disabled: true, hotkey: "enter",
                        click: () => {
                          wxAMC.saveHandler("Adressen", "moduleAdressen-detailsForm")
                        }
                      },
                      { width: 6 }
                    ]
                  }, /* End adresse details toolbar. */
                ] /* End adresse details cell rows. */
              }
            }, /* End body */
            {
              header: "<span class='webix_icon mdi mdi-calendar'></span>Anlässe",
              body: {
                rows: [
                  /* Adresse details form. */
                  {
                    view: "treetable", id: "moduleAdressen-Anlaesseitems",
                    css: "webix_header_border webix_data_border",
                    select: true, autofit: true,
                    resizeColumn: { headerOnly: true },
                    scroll: true,
                    editable: false,
                    autowidth: true,
                    columns: [
                      {
                        view: "text", header: "Datum", id: "datum", fillspace: true,
                        template: function (obj, common) {
                          if (obj.$group) return common.treetable(obj, common) + obj.jahr;
                          return webix.i18n.dateFormatStr(obj.datum);
                        }
                      },
                      { view: "text", header: "Bezeichnung", id: "name", width: 250 },
                      { view: "text", header: "Punkte", id: "punkte", adjust: true },
                      { view: "text", header: "Total Kegeln", id: "total_kegeln", adjust: true,
                        template: function (obj, common) {
                          if (obj.total_kegeln == 5) return 0;
                          return obj.total_kegeln;
                        }},
                      { view: "text", header: "Streichresulutat", id: "streichresultat", adjust: true, hidden: true }
                    ],
                    on: {
                      "data->onGroupCreated": function (id, value, data) {
                        this.getItem(id).value = "Jahr " + value;
                      }
                    },
                    scheme: {
                      $group: {
                        by: "jahr",
                        map: {
                          punkte: ["punkte", "sum"],
                          total_kegeln: ["total_kegeln", "sum"]
                        }
                      },
                      $sort: { by: "jahr", as: "int", dir: "desc" }
                    }
                  },
                  {
                    view: "toolbar",
                    cols: [
                      { width: 6 },
                      {
                        view: "button", label: "Zurück", width: "90",
                        type: "icon", icon: "mdi mdi-arrow-left",
                        click: () => {
                          $$("moduleAdressen-itemsCell").show();
                        }
                      },
                      {}
                    ]
                  }
                ]
              }
            } /* End body*/
          ] /** End cells */
        }, /* End adresse details tabview. */
        { /* Begin email details cell. */
          id: "moduleAdressen-email",
          rows: [
            /* Adresse details form. */
            {
              view: "form", id: "moduleAdressen-emailForm", borderless: false, scroll: true,
              elementsConfig: {
                labelWidth: 100
              },
              elements: [
                { view: "textarea", name: "email_an", label: "TO:", height: 50 },
                { view: "textarea", name: "email_cc", label: "CC:", height: 50 },
                { view: "textarea", name: "email_bcc", label: "BCC:", height: 50 },
                { view: "text", name: "email_subject", label: "Betreff:", required: true },
                {
                  view: "uploader", value: 'Attachments', link: "emailupload_list",
                  upload: "/uploadFiles", accept: "application/pdf",
                  multiple: true, autosend: true,
                  name: "uploadFiles", id: "emailupload"
                },
                {
                  view: "list",
                  id: "emailupload_list",
                  type: "uploader",
                  autoheight: true,
                  miniminHeight: 30,
                  borderless: true
                },
                {
                  view: "nic-editor",
                  config: {
                    fullPanel: true
                  },
                  name: "email_body", label: "Meldung:", width: 800, required: true
                },
                {
                  view: "select",
                  name: "email_signature", label: "Signatur",
                  value: "HansjoergDutler", options: [{ id: "HansjoergDutler", value: "HansjoergDutler.html" }, { id: "JanineFranken", value: "JanineFranken.html" }]
                }
              ]
            }, // End Email form */
            /* Email details toolbar. */
            {
              view: "toolbar",
              cols: [
                { width: 6 },
                {
                  view: "button", label: "Zurück", width: "90",
                  type: "icon", icon: "webix_icon mdi mdi-arrow-left",
                  click: () => {
                    $$("moduleAdressen-itemsCell").show();
                  }
                },
                {},
                {
                  id: "moduleAdressen-sendButton", view: "button", label: "Senden",
                  width: "90", type: "icon",
                  icon: "webix_icon mdi mdi-email-send",
                  click: this.sendMail.bind(this)
                }
              ]
            } /* End Email details toolbar */
          ]
        } /* End email details cell. */
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
   * createBill
   * @param (boolean) fSelection alle selektierten Adresse oder 1 aus dem Formular
   **/
  createBill(fSelection) {
    // read the fiscalyear to handle all the rights

    let arAdr = [];

    if (fSelection) {
      let listId = $$("moduleAdressen-items").getFirstId();
      while (listId > 0) {
        arAdr.push($$("moduleAdressen-items").getItem(listId));
        listId = $$("moduleAdressen-items").getNextId(listId);
      }
    } else {
      arAdr.push($$("moduleAdressen-detailsForm").getValues());
    }
    for (const adresse of arAdr) {
      const promiseAccount = fetch("/Adressen/qrbill",
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          body: JSON.stringify(adresse) // body data type must match "Content-Type" header

        })
        .then(function (response) {
          if (!response.ok)
            webix.message('Fehler beim Erstellen der Rechnungen', 'Error');
          return response.json();
        })
        .catch(function (error) {
          webix.message({ type: "error", text: error })
        });

      Promise.resolve(promiseAccount)
        .then(data => {
          if (data.type == "info") {
            webix.message(data.message, "Info");
          } else {
            webix.message(data.message, "Error");
          }
        })
        .catch(function (error) {
          webix.message({ type: "error", text: error })
        });
    }

  }

  /**
   * Export selected data to Excel
   */
  exportData() {
    // read the fiscalyear to handle all the rights
    let state = $$("moduleAdressen-items").getState();

    const promiseAccount = fetch("/Adressen/export",
      {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json'
        },
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(state) // body data type must match "Content-Type" header

      })
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Exportieren der Adressen', 'Error');
        return response.json();
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });

    Promise.resolve(promiseAccount)
      .then(function (data) {
        if (data.type == "info") {
          webix.ajax().response("blob").get('./exports/' + data.filename, function(text, blob){
            webix.html.download(blob, data.filename);
            webix.message(data.message, "Info");
          });          
      } else {
          webix.message(data.message, "Error");
        }
      })
      .catch(function (error) {
        webix.message({ type: "error", text: error })
      });


  } /* End exportData(). */

  /**
   * Handle clicks on the New button.
   */
  newHandler() {

    // We're adding a new adresse, so set the editing flag and create an ID.
    this.isEditingExisting = false;
    this.editingID = 0;

    // Now show the details form and clear it, then set any defaults.  Don't forget to
    // disable the delete button since we obviously can't delete during an add.
    $$("moduleAdressen-details").show();
    $$("moduleAdressen-detailsForm").clear();
    $$("moduleAdressen-detailsForm").elements.geschlecht.data.value = 1;
    $$("moduleAdressen-detailsForm").elements.sam_mitglied.data.value = 1;
    $$("moduleAdressen-detailsForm").elements.land.data.value = "CH";
    $$("moduleAdressen-deleteButton").disable();

  } /* End newHandler(). */

  /**
   * Handles clicks on the Save button.
   */
  async editExisting() {

    const adresse = $$("moduleAdressen-items").getSelectedItem();

    // Set flag to indicate editing an existing adresse and show the details.
    this.isEditingExisting = true;
    this.editingID = adresse.id;

    // Clear the details form.
    $$("moduleAdressen-detailsForm").clear();
    $$("moduleAdressen-Anlaesseitems").clearAll();

    // Show the form.  Note that this has to be done before the call to setValues()
    // below otherwise we get an error due to setting the value of the richtext (my
    // guess is it lazy-builds the DOM and it's not actually there until the show()
    // executes).
    $$("moduleAdressen-details").show();

    // Populate the form.
    $$("moduleAdressen-detailsForm").setValues(adresse);

    // load Meisterschaft Daten
    if (this.editingID > 0) {
      const url = "/Meisterschaft/mitglied?id=" + this.editingID;

      const promiseModule = await fetch(url)
        .then((response) => {
          if (!response.ok) {                                  // ***
            webix.message({ type: "error", text: "HTTP error " + response.status });  // ***
          }
          return response.json();
        })
        .catch((e) => webix.message("Daten konnten nicht geladen werden: " + e, "error", -1));
      await Promise.resolve(promiseModule)
        .then(function (data) {
          const itemsAsArray = wxAMC.objectAsArray(data);
          $$("moduleAdressen-Anlaesseitems").parse(itemsAsArray);
          $$("moduleAdressen-Anlaesseitems").open($$("moduleAdressen-Anlaesseitems").getFirstId());
        })
        .catch((e) => webix.message("Daten konnten nicht geladen werden:" + e, "error", -1));
    }


  } /* End editExisting(). */

  async sendMail() {
    const mailForm = $$('moduleAdressen-emailForm').getValues();

    // validate form
    if (mailForm.email_an == "" && mailForm.email_cc == "" && mailForm.email_bcc == "") {
      webix.message({ type: "Error", text: "Kein Empfänger angegeben" });
      return;
    }
    if (mailForm.email_subject == "") {
      webix.message({ type: "Error", text: "Kein Betreff angegeben" });
      return;
    }
    if (mailForm.email_body == "") {
      webix.message({ type: "Error", text: "Keine Nachricht angegeben" });
      return;
    }


    const url = "/Adressen/email/";

    const promiseModule = fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(mailForm) // body data type must match "Content-Type" header
    })
      .then((response) => {
        if (!response.ok) {                                  // ***
          webix.message({ type: "error", text: "HTTP error " + response.status });  // ***
        }
        return response.json();
      })
      .catch((e) => {
        console.log("Mail konnte nicht erfolgreich gesendet werden: " + e)
        //webix.message("Mail konnte nicht erfolgreich gesendet werden: " + e, "error", -1)
      });
    Promise.resolve(promiseModule)
      .then((response) => {
        webix.message("Email wurde gesendet.", "info", -1);
        $$("moduleAdressen-itemsCell").show();
      })
      .catch((e) => webix.message(`Fehler beim Senden der Nachricht: ${e}`, "error", -1));

  } /* sendMail */

  showEmailFormOne() {

    const adresse = $$("moduleAdressen-items").getSelectedItem();
    const sEmailType = adresse.email;
    this.showEmailForm([sEmailType]);

  }


  showEmailFormAll() {

    let lstEmail = []
    $$("moduleAdressen-items").eachRow(function (row) {
      const record = $$("moduleAdressen-items").getItem(row);
      if (record.email != "")
        lstEmail.push(record.email);
    });
    this.showEmailForm(lstEmail);

  }

  /**
   * Show Email Form, depending on the parameter
   */

  showEmailForm(lstEmail) {

    let emailData = [];

    if (lstEmail.length > 1) {
      emailData.email_an = "info@automoto-sr.info";
      emailData.email_cc = "";
      emailData.email_bcc = lstEmail.join('; ');
    } else {
      emailData.email_an = lstEmail.join('; ');
      emailData.email_cc = "";
      emailData.email_bcc = "";
    }
    emailData.email_subject = "";
    emailData.email_body = "";

    // Populate the form.
    $$('moduleAdressen-email').show();
    $$('moduleAdressen-email').unbind();
    $$("moduleAdressen-emailForm").setValues(emailData);

  } /* End showEmailForm */

  /**
   * Refresh the adressen list from local storage.
   */
  async refreshData() {
    let state = $$("moduleAdressen-items").getState();
    if (!state || !state.sort)
      state.sort = [{ by: "name", id: "name", dir: "asc" }, { by: "vorname", id: "vorname", dir: "asc" }];
    // you can save it to the local storage 
    webix.storage.local.put("state", state);

    const url = "/Adressen/data";
    // let dataItems;

    const promiseModule = fetch(url)
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Lesen der Adressdaten', 'Error');
        return response.json();
      }).catch(function (error) {
        webix.message({ type: "error", text: error })
      });
    Promise.resolve(promiseModule)
      .then(function (dataItems) {
        //console.log('dataItems: ',dataItems);
        // Get the items as an array of objects.
        const itemsAsArray = wxAMC.objectAsArray(dataItems);

        // Sort the array by the value property (ascending) so they appear in
        // alphabetical order.
        //wxAMC.sortArray(itemsAsArray, "vorname", "A");
        //wxAMC.sortArray(itemsAsArray, "name", "A");

        $$("moduleAdressen-items").clearAll();
        $$("moduleAdressen-items").parse(itemsAsArray);
        $$("moduleAdressen-items").setState(state);
        if (state.sort instanceof Array) {
          for (let ind2 = 0; ind2 < state.sort.length; ind2++) {
            const element = state.sort[ind2];
            $$("moduleAdressen-items").markSorting(element.id, element.dir, true);
          }
        } else {
          $$("moduleAdressen-items").markSorting(state.sort.id, state.sort.dir);
        }


      });
  } /* End refreshData(). */

  /**
   * Service requests from day-at-a-glance to present data for this module.
   */
  async dayAtAGlance() {

    // Add a section to the day-at-a-glance body for this module if there isn't one already.
    if (!$$("dayAtAGlanceScreen_Adressen")) {
      $$("dayAtAGlanceBody").addView({
        view: "fieldset", label: "Adressen",
        body: { id: "dayAtAGlanceScreen_Adressen", cols: [] }
      });
      $$("dayAtAGlanceBody").addView({ height: 20 });
    }

    // Populate the day-at-a-glance screen.
    let rows = [];

    const promiseModule = fetch("/Adressen/getOverviewData")
      .then((response) => response.json())
      .catch((e) => webix.message({ type: "error", text: e }));
    Promise.resolve(promiseModule)
      .then(function (totals) {
        for (let ind2 = 0; ind2 < totals.length; ind2++) {
          const total = totals[ind2];
          rows.push(
            {
              view: "fieldset", label: total.label, body: {
                rows: [
                  { view: "label", label: total.anzahl }
                ]
              }
            });
        }
        //console.log(rows);
        webix.ui(rows, $$("dayAtAGlanceScreen_Adressen"));
      })
      .catch((e) => webix.message({ type: "error", text: e }));


  } /* End dayAtAGlance(). */


}; /* End Adressen class. */
