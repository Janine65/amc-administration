
// "Register" this module with wxAMC.
wxAMC.registeredModules.push("Users");


wxAMC.moduleClasses.Users = class {


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


  /**
     * Return the module's UI config object.
     */
  getUIConfig() {
    return {
      winWidth: 800, winHeight: 800, winLabel: "Users", winIcon: "mdi mdi-account", winHotkey: "ctrl+u",
      id: "moduleUsers-container",
      cells: [
        /* ---------- Users list cell. ---------- */
        {
          id: "moduleUsers-itemsCell",
          rows: [
            {
              view: "datatable", id: "moduleUsers-items",
              css: "webix_header_border webix_data_border",
              select: true, autofit: true,
              resizeColumn: { headerOnly: true },
              scroll: true,
              editable: false,
              columns: [
                { id: "name", header: "Name", fillspace: true, hidden: false },
                { id: "email", header: "Email", adjust: true, hidden: false },
                { id: "role", header: "Role", adjust: true, hidden: false },
                { id: "last_login", header: "Last Login", adjust: true, hidden: false, format: webix.i18n.fullDateFormatStr }
              ],
              hover: "hoverline",
              on: {
                onBeforeLoad: function () {
                  this.showOverlay("Loading...");
                },
                onAfterLoad: function () {
                  this.hideOverlay();
                  $$("count_users").setValue("Anzahl " + this.count());
                },
                onAfterSelect: function (selection, preserve) {
                  if (wxAMC.UserRole == 'admin') {
                    $$("moduleUsers-deleteButton").enable();
                    wxAMC.modules['Users'].editExisting();
                  }
                },
                onItemDblClick: function (selection, preserve) {
                  if (wxAMC.UserRole == 'admin')
                    wxAMC.modules['Users'].editExisting();
                }
              }
            },
            {
              view: "toolbar",
              cols: [
                { id: "count_users", view: "label", label: "Anzahl 0" },
                { width: 6 },
                {
                  id: "moduleUsers-registButton", view: "button", label: "Register", autowidth: true, type: "icon", 
                  icon: "webix_icon mdi mdi-account-plus", click: () => { wxAMC.modules['Users'].showRegistGUI(); }
                },
                {
                  id: "moduleUsers-deleteButton", view: "button", label: "Delete", autowidth: true, type: "icon", disabled: true,
                  icon: "webix_icon mdi mdi-delete", click: () => { wxAMC.deleteHandler("Users"); }
                },
                { width: 6 }
              ] /* End toolbar items. */
            }, /* End toolbar. */
            { id: "moduleUsers-detail", hidden: true,
              rows: [
                {
                  view: "form", id: "moduleUsers-addForm",
                  "autoheight": true,
                  elementsConfig: {
                    on: {
                      onChange: () => {
                        $$("moduleUsers-saveButton")
                        [$$("moduleUsers-addForm").validate() ? "enable" : "disable"]();
                      }
                    }
                  },
                  rows: [
                    {
                      cols: [
                        {
                          view: "text",
                          name: "name",
                          required: true,
                          label: "Name",
                          labelPosition: "top",
                          width: 250
                        },
                        {
                          view: "text",
                          name: "email",
                          type: "email",
                          label: "Email",
                          labelPosition: "top",
                          required: true,
                          width: 250
                        },
                        {
                          view: "combo",
                          options: [
                            { id: "user", value: "User" },
                            { id: "revisor", value: "Revisor" },
                            { id: "admin", value: "Admin" }
                          ],
                          name: "role",
                          label: "Role",
                          labelPosition: "top",
                          required: true,
                          css: "small",
                          width: 250
                        }
                      ]
                    },
                    {
                      cols: [
                        {
                          view: "button", css: "webix_primary", label: "Clear",
                          icon: "mdi mdi-close-octagon", id: "moduleUsers-clearButton",
                          click: () => {
                            $$("moduleUsers-addForm").clear();
                            this.isEditingExisting = false;
                            this.editingID = 0;
                            $$("moduleUsers-detail").hide();
                            $$("moduleUsers-deleteButton").disable();
                            $$("moduleUsers-items").unselectAll();
                          }
                        },
                        {
                          view: "button", css: "webix_primary", label: "Save",
                          icon: "mdi mdi-content-save", id: "moduleUsers-saveButton", disabled: true,
                          click: () => {
                            wxAMC.saveHandler("Users", "moduleUsers-addForm");
                            $$("moduleUsers-addForm").clear();
                            this.isEditingExisting = false;
                            this.editingID = 0;
                            $$("moduleUsers-detail").hide();
                            $$("moduleUsers-deleteButton").disable();
                            $$("moduleUsers-items").unselectAll();
                          }
                        }
                      ]
                    }
                  ]
                }                    
              ]
            }
          ] /* End users list rows. */
        }, /* End users list cell. */
        {
          id : "register-details",
          rows : [
              {view:"form", id : "register-detailsform",
                  elementsConfig : { 
                      on : { onChange : () => {
                          $$("register-detailsformSave")
                              [$$("register-detailsform").validate()? "enable" : "disable"]();
                      } }
                  },
                  elements: [
                  {
                      view: "label",
                      css: "hiddeen",
                      id: "message",
                      label: ""
                  },
                  {
                      view: "text",
                      width: 500,
                      label: "Name",
                      labelAlign: "right",
                      name: "name",
                      labelWidth: 200,
                      placeholder: "Max Muster",
                      required: true
                  },            {
                      view: "text",
                      width: 500,
                      label: "Email",
                      labelAlign: "right",
                      placeholder: "user@muster.com",
                      type: "email",
                      name: "email",
                      labelWidth: 200,
                      required: true
                  },
                  {
                      view: "text",
                      width: 500,
                      label: "Password",
                      labelAlign: "right",
                      type: "password",
                      name: "password",
                      labelWidth: 200,
                      placeholder: "at least length of 8",
                      required: true
                  },
                  {
                      view: "text",
                      width: 500,
                      label: "Password verify",
                      labelAlign: "right",
                      type: "password",
                      name: "passwordVerify",
                      labelWidth: 200,
                      placeholder: "",
                      required: true
                  },
                  {
                      view: "radio",
                      width: 500,
                      label: "User Role",
                      labelAlign: "right",
                      name: "role",
                      labelWidth: 200,
                      value: "user",
                      required: true,
                      vertical: true,
                      options: [
                          {id: "user", value: "User"},
                          {id: "revisor", value: "Revisor"},
                          {id: "admin", value: "Administration"}
                      ]
                  },
                  {cols: [
                      {
                          id : "register-detailsformSave",
                          label: "Register",
                          type: "form",
                          view: "button",
                          width: 200,
                          icon: "webix_icon mdi mdi-account-plus",
                          click: () => {
                            wxAMC.modules['Users'].doRegister()},
                          disabled: true
                      },
                      {
                          label: "Cancel",
                          type: "form",
                          view: "button",
                          width: 200,
                          icon: "webix_icon mdi mdi-close",
                          click: () => {
                            $$("moduleUsers-itemsCell").show();
                          }
                      }
          
                  ]}
              ]}        
          ]          
        },
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


showRegistGUI() {
  $$("register-details").show();
  $$("register-detailsform").clear();

}

 doRegister() {
    if (!$$("register-detailsform").validate()) {
        $$("message").setValue("Not all fields are filled")
        return;
    }

    const user = $$("register-detailsform").getValues();
    if (user.password !== user.passwordVerify) {
        $$("message").setValue("Passwords ar not equal")
        return;
    }

    const url = "/user/register";

    $$("message").setValue("")

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
      body: JSON.stringify(user) // body data type must match "Content-Type" header
    })
    .then(function(resp) {
        if (!resp.ok) {
            $$("message").setValue("an error occurred while creating user");
        }
        return resp.json();
    })
    .catch((e) => $$("message").setValue(e));  // ***
    
    Promise.resolve(promiseModule)
    .then(function(resp) {
        if (resp.status == 'error') {
            $$("message").setValue(resp.message);
        } else {
          $$("moduleUsers-itemsCell").show();
          wxAMC.modules['Users'].refreshData();
        }
    })
    .catch((e) => $$("message").setValue(e));  // ***;

}

  /**
   * Handles clicks on the Save button.
   */
  async editExisting() {

    const user = $$("moduleUsers-items").getSelectedItem();

    // Set flag to indicate editing an existing users and show the details.
    this.isEditingExisting = true;
    this.editingID = user.id;

    // Clear the details form.
    $$("moduleUsers-detail").show();
    $$("moduleUsers-addForm").clear();

    // Populate the form.
    $$("moduleUsers-addForm").setValues(user);

  } /* End editExisting(). */



  /**
   * Refresh the users list from local storage.
   */
  async refreshData() {
    $$("moduleUsers-addForm").clear();
    this.isEditingExisting = false;
    this.editingID = 0;
    $$("moduleUsers-detail").hide();
    $$("moduleUsers-deleteButton").disable();

    const promiseModule = fetch("/Users/data")
      .then(function (response) {
        if (!response.ok)
          webix.message('Fehler beim Lesen der Userdaten', 'Error');
        return response.json();
      }).catch(function (error) {
        webix.message({ type: "error", text: error })
      });
    Promise.resolve(promiseModule)
      .then(function (dataItems) {
        //console.log('dataItems: ',dataItems);
        // Get the items as an array of objects.
        const itemsAsArray = wxAMC.objectAsArray(dataItems);

        $$("moduleUsers-items").clearAll();
        $$("moduleUsers-items").parse(itemsAsArray.filter(element => element.name != wxAMC.loggedUser));

});
  } /* End refreshData(). */


  /**
   * Save the users to the database
   */

  async saveUsers() {


  } /* End saveUsers */


  /**
   * Service requests from day-at-a-glance to present data for this module.
   */
  dayAtAGlance() {

    return;

  } /* End dayAtAGlance(). */

}; /* End Users class. */
