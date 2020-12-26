
class WXAMC {

  /**
   * Constructor.
   */
  constructor() {

    // The predefined Webix isNumber and isEmail validation functions count a blank field as invalid, but in some cases
    // we don't want that, we want blank to be considered valid, so we'll provide a new validation function here.
    webix.rules.isNumberOrBlank = function (inValue) {
      if (inValue == "") {
        return true;
      }
      return webix.rules.isNumber(inValue);
    };
    webix.rules.isEmailOrBlank = function (inValue) {
      if (inValue == "") {
        return true;
      }
      return webix.rules.isEmail(inValue);
    };

    // Module classes.
    this.moduleClasses = {};

    // Loaded modules.
    this.modules = {};

    // The currently active module, if any.
    this.activeModule = null;

    // Every module "registers" itself with wxAMC by adding itself here.
    this.registeredModules = [];

    // The current UI type ("mobile" or "desktop").
    if (webix.env.mobile) {
      this.uiType = "mobile";
    } else {
      this.uiType = "desktop";
    }

    this.deLocale = webix.i18n.locales["de-DE"];
    this.deLocale.dateFormat = "%d.%m.%Y";
    this.deLocale.parseFormat = "%c";
    this.deLocale.decimalDelimiter = ".";
    this.deLocale.groupDelimiter = "'";
    this.deLocale.priceSettings = {
      groupSize: 3,        // the number of digits in a group
      groupDelimiter: "'", // a mark that divides numbers with many digits into groups
      decimalDelimiter: ".",// the decimal delimiter
      decimalSize: 2       // the number of digits after the decimal mark
    };


    webix.i18n.locales["de-DE"] = this.deLocale;
    webix.i18n.setLocale("de-DE");

    this.parameter = new Map();

    this.registGui = null;
    this.loginGui = null;
    this.isAuthenticated = false;
    this.loggedUser = "";
    this.UserRole = "";

    webix.skin.flat.barHeight = 45; webix.skin.flat.tabbarHeight = 45; webix.skin.flat.rowHeight = 34; webix.skin.flat.listItemHeight = 34; webix.skin.flat.inputHeight = 38; webix.skin.flat.layoutMargin.wide = 10; webix.skin.flat.layoutMargin.space = 10; webix.skin.flat.layoutPadding.space = 10;
    webix.skin.set('flat');

    // Custom window component so that by default windows will animated when opened and when hidden.
    webix.protoUI({
      name: "ani-window",
      $init: function () {
        this.$ready.push(function () {
          this.attachEvent("onShow", function () {
            let base = this.$view.className.split("animated")[0];
            this.$view.className = base + " animated bounceIn";
          });
          this.attachEvent("onHide", function () {
            this.$view.style.display = "block";
            this.$view.className = this.$view.className + " animated bounceOut";
          });
        });
      }
    }, webix.ui.window);

    // Build the UI when the DOM is ready.
    webix.ready(this.start.bind(this));

  } /* End constructor. */

  async reloadParameters() {

    const url = "/Parameter/data";
    const promiseModule = await fetch(url)
      .then((response) => response.json())
      .catch((error) => webix.message({
        type: "error",
        text: "Fetch Parameter. " + error,
        expire: -1
      }));
    await Promise.resolve(promiseModule)
      .then((lparam) => {
        console.log('lparam: ', lparam);
        if (lparam != null) {
          wxAMC.version = lparam.pop().value;
          for (let ind2 = 0; ind2 < lparam.length; ind2++) {
            const param = lparam[ind2];
            wxAMC.parameter.set(param.key, param.value);
          }
        }
      })
      .catch((e) => webix.message({
        type: "error",
        text: "Resolve Parameter. " + e,
        expire: -1
      }));
  } /* End reloadParameters */

  /**
   * Builds the UI app shell.
   */
  async start() {

    // Instantiate modules.
    for (let moduleName of wxAMC.registeredModules) {
      wxAMC.modules[moduleName] = new wxAMC.moduleClasses[moduleName]();
    }

    await this.reloadParameters();
    console.log(this.parameter);

    // The base layout of the page.
    webix.ui(this.getBaseLayoutConfig());

    // Populate the day-at-a-glance screen.
    wxAMC.dayAtAGlance();

    wxAMC.setHidden();

    const promiseModule = await fetch('/System/env')
      .then((response) => response.json())
      .catch((error) => webix.message({
        type: "error",
        text: "Fetch Environemnt " + error,
        expire: -1
      }));
    await Promise.resolve(promiseModule)
      .then((env) => {
        console.log('env: ', env);
        if (env != null) {
          wxAMC.env = env.env;
        }
      })
      .catch((e) => webix.message({
        type: "error",
        text: "Resolve Environemt. " + e,
        expire: -1
      }));

    if (wxAMC.env == 'development') {
      wxAMC.isAuthenticated = true;
      wxAMC.loggedUser = 'Development';
      wxAMC.UserRole = 'admin';
      webix.message("Welcome " + wxAMC.loggedUser, "Info");
      wxAMC.setHidden();

    } else
      if (window.PasswordCredential) {
        if (!wxAMC.isAuthenticated) {
          navigator.credentials.get({
            password: true,
            mediation: 'silent'
          }).then(c => {
            if (c) {
              if (c.type == 'password')
                return doLogin(c);
            }
            return Promise.resolve();
          }).then(profile => {
            if (profile) {
              doLogin(profile);
            }
          }).catch(error => {
            console.log('Sign-in Failed');
          });
        }
      }

  } /* End start(). */


  /**
   * Launch a module.
   *
   * @param inModuleName The name of the module.
   */
  async launchModule(inModuleName) {

    // Don't trigger on initial click of the top-level menu item.
    if (inModuleName === "Modules") {
      return;
    }

    // Mobile mode.
    if (wxAMC.uiType === "mobile") {

      // Let the currently active module, if any, de-activate.
      if (wxAMC.activeModule) {
        wxAMC.modules[wxAMC.activeModule].deactivate();
      }

      // Record the new active module.
      wxAMC.activeModule = inModuleName;

      // Set flags to indicate not editing an existing item.
      wxAMC.modules[wxAMC.activeModule].editingID = null;
      wxAMC.modules[wxAMC.activeModule].isEditingExisting = false;

      // Switch the multiview to the module and show the module's summary view.
      $$(`module${inModuleName}-itemsCell`).show();
      $$(`module${inModuleName}-container`).show();

      // Desktop mode.
    } else {

      let moduleWindow = $$(`moduleWindow-${inModuleName}`);

      // Module window already exists, just show it.
      if (moduleWindow) {

        moduleWindow.show();
        return;

        // Module window doesn't exist yet, built it.
      } else {

        // Get module's app config.
        const moduleUIConfig = wxAMC.modules[inModuleName].getUIConfig();

        // Figure out the window sizing.  We'll use the width and height the module defines, making sure
        // the viewport will allow it, otherwise we'll override and size it to fit the viewport.  Readresse to account
        // for the toolbar too either way!
        let toolbarHeight = $$("toolbar").$height;
        let vpWidth = document.documentElement.clientWidth - 100;
        let vpHeight = document.documentElement.clientHeight - 100 - toolbarHeight;
        let winWidth = moduleUIConfig.winWidth;
        let winHeight = moduleUIConfig.winHeight;
        if (vpWidth < winWidth) {
          winWidth = vpWidth;
        }
        if (vpHeight < winHeight) {
          winHeight = vpHeight;
        }
        const centerX = ((vpWidth - winWidth) / 2) + 50;
        const centerY = ((vpHeight - winHeight) / 2) + (toolbarHeight * 2);

        // Create a window with the app's layout inside it.
        webix.ui({
          view: "ani-window",
          move: true,
          width: winWidth,
          height: winHeight,
          left: centerX,
          top: centerY,
          resize: true,
          id: `moduleWindow-${inModuleName}`,
          toFront: true,
          fullscreen: false,
          head: {
            view: "toolbar",
            cols: [{
              view: "label",
              id: inModuleName,
              label: moduleUIConfig.winLabel
            },
            {
              view: "icon",
              icon: "webix_icon mdi mdi-window-minimize",
              click: function () {
                // Hide the window and toggle it's taskbar button.
                $$(`moduleWindow-${inModuleName}`).hide();
                $$(`moduleTasbbarButton-${inModuleName}`).toggle();
              }
            },
            {
              view: "icon",
              icon: "webix_icon mdi mdi-window-maximize",
              click: function () {
                // Reconfigure the module's window to be full-screen and resize it.
                const win = $$(`moduleWindow-${inModuleName}`);
                win.config.fullscreen = !win.config.fullscreen;
                win.resize();
                // Now change this icon's, err, ICON, as appropriate, and position the
                // window based on it's new state.
                if (win.config.fullscreen) {
                  this.config.icon = "webix_icon mdi mdi-window-restore";
                  win.setPosition(0, 0);
                } else {
                  this.config.icon = "webix_icon mdi mdi-window-maximize";
                  win.setPosition(centerX, centerY);
                }
                // Refresh this icon to reflect the change.
                this.refresh();
                // Finally, blur off the icon so there's no "selection" artifact.
                this.blur();
              }
            },
            {
              view: "icon",
              icon: "webix_icon mdi mdi-window-close",
              click: function () {
                // Close the window and remove taskbar button.
                $$(`moduleWindow-${inModuleName}`).close();
                $$("taskbar").removeView(`moduleTasbbarButton-${inModuleName}`);
              }
            }
            ]
          },
          body: moduleUIConfig
        }).show();

        // Add a taskbar button for this module.
        const taskbar = $$("taskbar");
        const moduleButton = webix.ui({
          id: `moduleTasbbarButton-${inModuleName}`,
          view: "toggle",
          type: "icon",
          width: 140,
          height: 50,
          icon: moduleUIConfig.winIcon,
          label: moduleUIConfig.winLabel,
          click: function () {
            // Hide or show the module's window based on the CURRENT state of the button.
            const moduleName = this.config.id.split('-')[1];
            if (this.getValue() === 1) {
              $$(`moduleWindow-${moduleName}`).hide();
            } else {
              $$(`moduleWindow-${moduleName}`).show();
            }
            // Blur off the button so there's no "selection" artifact.
            this.blur();
          }
        });
        moduleButton.toggle();
        taskbar.addView(moduleButton);

      } /* End moduleWindow exists check. */

    } /* End uiType check. */

    // Refresh data for the module to show their lists of items.
    await wxAMC.modules[inModuleName].refreshData()
      .catch((e) => webix.message({
        type: "error",
        text: e
      }));

    // Finally, call the module's activate() handler.
    wxAMC.modules[inModuleName].activate();

  } /* End launchModule(). */


  // **************************************** Module helper methods ****************************************
  async importLoadedFile() {
    var f = $$("fisupload").files;

    f.data.each(function (file) {
      var status = file.status; // upload status
      var fname = file.name;    // file name
      var sname = file.sname;   // storage name
      var message = 'Upload: ' + status + ' for ' + fname + 'stored as ' + sname;
      webix.message(message, 'Info');
      console.log(message, 'Info');

      const url = "/Journal/import";

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
        body: JSON.stringify(file) // body data type must match "Content-Type" header  
      })
        .then((response) => {
          if (!response.ok) {                                  // ***
            webix.message({ type: "error", text: "HTTP error " + response.status });  // ***
          }
          return response.json();
        })
        .catch((e) => webix.message(`Datei ${file.name} konnte nicht erfolgreich importiert werden: ${e}`, "error", -1)
        );
      Promise.resolve(promiseModule)
        .then((response) => {
          webix.message(fname + " wurde importiert.", "info", -1);
        })
        .catch((e) => webix.message(`Fehler beim Importieren der Datei ${file.name}: ${e}`, "error", -1)
        );
    })

    $$("message_win").close();
  }

  /**
   * Sort an array of objects by a specified property in descending order.
   *
   * @param inArray     The array to sort.
   * @param inProperty  The property of the objects in the array to sort on.
   * @param inDirection "A"scending or "D"escending.
   */
  sortArray(inArray, inProperty, inDirection) {

    inArray.sort(function compare(inA, inB) {

      // Normalize strings so we do a case-insensitive sort.
      inA = (inA[inProperty] + "").toLowerCase();
      inB = (inB[inProperty] + "").toLowerCase();

      if (inA > inB) {
        if (inDirection === "D") {
          return -1;
        } else {
          return 1;
        }
      } else if (inA < inB) {
        if (inDirection === "D") {
          return 1;
        } else {
          return -1;
        }
      } else {
        return 0;
      }

    });

  } /* End sort Array(). */


  /**
   * Takes in an object and returns an array where each element is a property of the object.
   * Note that order IS NOT guaranteed!
   *
   * @param  inObject The object to create an array from.
   * @return          (Array) The resulting array.
   */
  objectAsArray(inObject) {

    const array = [];

    for (const key in inObject) {
      if (inObject.hasOwnProperty(key)) {
        array.push(inObject[key]);
      }
    }

    return array;

  } /* End objectAsArray(). */


  /**
   * Get the data for a specified module from local storage.
   *
   * @param  inModuleName The name of the module.
   * @return           The data as an object.
   */
  async getModuleData(inModuleName) {

    const url = "/" + inModuleName + "/data";

    fetch(url)
      .then(function (response) {
        //  console.log(response);
        return response.json();
      }).catch(function (error) {
        webix.message({
          type: "error",
          text: error
        });
      });

  } /* End getModuleData(). */


  /**
   * Handles clicks of the save button for modules.
   *
   * @param inModuleName The name of the module.
   * @param inFormIDs    An array of form IDs.
   */
  async saveHandler(inModuleName, inFormID) {
    var itemData;
    // Merge all forms together.  Usually there's just one, but some modules may have more than one.
    if ($$(inFormID).isDirty()) {
      itemData = $$(inFormID).getValues();
    } else {
      webix.message({
        type: "info",
        text: "Keine Änderungen vorgenommen"
      });
      $$(`module${inModuleName}-itemsCell`).show();
      return;
    }

    console.log("saveHandler: itemData: ", itemData);
    const url = "/" + inModuleName + "/data";

    var smethond = (wxAMC.modules[inModuleName].editingID > 0 ? "PUT" : "POST");

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
            text: "HTTP error " + response.status
          }); // ***
        }
      })
      .then(function () {
        // Refresh the module's summary list and return to that list.
        wxAMC.modules[inModuleName].refreshData();
        $$(`module${inModuleName}-itemsCell`).show();

        // Give the day-at-a-glance screen a chance to update (needed for desktop mode).
        wxAMC.dayAtAGlance();

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

  } /* End saveHandler(). */

  /**
   * Handles clicks of the save button for modules.
   *
   * @param inModuleName The name of the module.
   * @param inFormIDs    An array of form IDs.
   */
  async excelDatasheet(objSave) {

    const url = "/Anlaesse/sheet";
    if ($$("datumSelect"))
      objSave.year = $$("datumSelect").getValue();
    else
      objSave.year = wxAMC.parameter.get('CLUBJAHR');

    fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(objSave) // body data type must match "Content-Type" header
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
        webix.message({
          type: "success",
          text: "erstellt und downloaded"
        });
        // download file
        webix.send("./exports/Stammblätter.xlsx", {}, "GET");
      })
      .catch((e) => webix.message({
        type: "error",
        text: e
      }));

  } /* End excelDatasheet(). */

  /**
   * Handles clicks of the save button for modules.
   *
   * @param inModuleName The name of the module.
   * @param inFormIDs    An array of form IDs.
   */
   writeAuswertung() {

    var objSave = {};
    const url = "/Anlaesse/writeAuswertung";
    if ($$("moduleAuswertungendatumSelect"))
      objSave.year = $$("moduleAuswertungendatumSelect").getValue();
    else
      return;

    fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(objSave) // body data type must match "Content-Type" header
    })
      .then((response) => {
        if (!response.ok) { // ***
          webix.message({
            type: "error",
            text: "HTTP error " + response.status
          }); // ***
        } else {
          webix.message({
            type: "success",
            text: "erstellt und downloaded"
          });
          // download file
          webix.send("./exports/Meisterschaft-" + objSave.year + ".xlsx", {}, "GET");
        }
      })
      .catch((e) => webix.message({
        type: "error",
        text: e
      }));

  } /* End writeAuswertung(). */

  /**
   * Handles clicks of the delete button for modules.
   *
   * @param inModuleName The name of the module.
   */
  async deleteHandler(inModuleName) {

    webix.html.addCss(webix.confirm({
      title: `Please Confirm`,
      ok: "Yes",
      cancel: "No",
      type: "confirm-warning",
      text: `Are you sure you want to delete this item?`,
      width: 300,
      callback: function (inResult) {
        // Delete confirmed.
        if (inResult) {
          const url = "/" + inModuleName + "/data/";
          var data = $$(`module${inModuleName}-items`).getSelectedItem();
          fetch(url, {
            method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
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
            .then(function () {
              // Refresh the module's summary list and return to that list.
              wxAMC.modules[inModuleName].refreshData();
              // Give the day-at-a-glance screen a chance to update (needed for desktop mode).
              wxAMC.dayAtAGlance();
              // Finally, show a completion message.
              webix.message({
                type: "success",
                text: "gelöscht"
              });
            })
            .catch((e) => webix.message({
              type: "error",
              text: e
            }));
        }
      }
    }), "animated bounceIn");

  } /* End deleteHandler(). */


  /**
   * Switch between desktop and mobile mode.
   */
  switchMode() {

    // Destroy any existing module windows.
    for (let moduleName of wxAMC.registeredModules) {
      let moduleWindow = $$(`moduleWindow-${moduleName}`);
      if (moduleWindow) {
        moduleWindow.close();
      }
    }

    // Make sure there's no active module.
    wxAMC.activeModule = null;

    // Destroy existing base layout.
    $$("sidemenu").destructor();
    $$("dayAtAGlance").destructor();
    $$("moduleArea").destructor();
    $$("baseLayout").destructor();


    // Switch UI type.
    switch (wxAMC.uiType) {
      case "desktop":
        wxAMC.uiType = "mobile";
        break;
      case "mobile":
        wxAMC.uiType = "desktop";
        break;
    }

    // Rebuild the UI (also effectively resets all modules).
    wxAMC.start();

  } /* End switchMode(). */

  showRegistGui() {
    if (wxAMC.registGui == null)
      return;

    webix.ui(wxAMC.registGui).show();
  }

  showLoginGui() {
    if (wxAMC.loginGui == null)
      return;

    // Hide the sidemenu (whether it's showing or even valid in the current mode or not).
    //$$("sidemenu").hide();

    if (window.PasswordCredential) {
      if (!wxAMC.isAuthenticated) {
        navigator.credentials.get({
          password: true,
          mediation: 'silent'
        }).then(c => {
          if (c) {
            if (c.type == 'password')
              return doLogin(c);
          }
          return Promise.resolve();
        }).then(profile => {
          if (profile) {
            doLogin(profile);
          }
        }).catch(error => {
          showError('Sign-in Failed');
        });
      }
    }

    webix.ui(wxAMC.loginGui).show();
  }


  doLogout() {
    // Hide the sidemenu (whether it's showing or even valid in the current mode or not).
    //$$("sidemenu").hide();

    const url = "/user/logout";
    fetch(url, {
      method: 'POST' // *GET, POST, PUT, DELETE, etc.
    })
      .then(function (resp) {
        if (resp.ok) {
          webix.message("Bye bye " + wxAMC.loggedUser, "Info");
          wxAMC.isAuthenticated = false;
          wxAMC.loggedUser = "";
          wxAMC.UserRole = "";
          wxAMC.setHidden();
          // if (navigator.credentials && navigator.credentials.preventSilentAccess) {
          //   navigator.credentials.preventSilentAccess();
          // }
        }
      })
      .catch((e) => console.error(e)); // ***


  } /* End doLogout */

  doLogin(cred) {
    var user;

    if (cred === undefined || typeof cred == 'string') {
      user = $$("login-detailsform").getValues();

      if (user.username == "" || user.password == "") {
        $$("message").setValue("Not all fields are filled");
        return;
      }
      user.email = user.username;
    } else {
      console.log(cred);
    }

    const url = "/user/login";

    $$("message").setValue("")

    const promiseModule = fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'include', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(user) // body data type must match "Content-Type" header
    })
      .then(resp => {
        if (!resp.ok) {
          $$("message").setValue("an error occurred while creating user");
        }
        return resp.json();
      })
      .catch((e) => $$("message").setValue(e)); // ***

    Promise.resolve(promiseModule)
      .then(function (resp) {
        if (resp.status == 'error') {
          $$("message").setValue(resp.message);
        } else {
          wxAMC.isAuthenticated = true;
          wxAMC.loggedUser = resp.name;
          wxAMC.UserRole = resp.role;
          webix.message("Welcome " + wxAMC.loggedUser, "Info");
          wxAMC.setHidden();
          if (window.PasswordCredential) {
            var data = {
              id: resp.email,
              name: resp.name,
              password: resp.password
            }
            var creds = new PasswordCredential(data);
            navigator.credentials.store(creds)
              .then(
                closeWindow()
              )
          } else {
            closeWindow();
            return Promise.resolve(resp);
          }
        }
      })
      .catch((e) => $$("message").setValue(e)); // ***;

  }

} /* End WXAMC. */


// The one and only instance of WXAMC.
const wxAMC = new WXAMC();
const eachElement = (selector, fn) => {
  for (let e of document.querySelectorAll(selector)) {
    fn(e);
  }
}; /* End eachElement */