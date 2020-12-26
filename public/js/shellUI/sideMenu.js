"use strict";

/**
 * Get the UI config object for the sidemenu.
 */

const loginUserMenu = ["MainMenulogout", "Adressen", "Anlaesse", "Meisterschaft", "Auswertungen", "Parameters"]
const loginRevisorMenu = ["MainMenulogout", "Journal"]
const loginAdminMenu = ["MainMenulogout", "MainMenuregister", "Adressen", "Anlaesse", "Meisterschaft", "Auswertungen", "Parameters"]
const logoffMenu = ["MainMenulogin"]

wxAMC.getSideMenuConfig = function () {

  const listItems = [];
  listItems.push({
    id: "loggedUser", value: "not logged in", icon: "webis_icon mdi mdi-account",
    data: [
      { id: "MainMenulogin", value: "Login", icon: "webis_icon mdi mdi-login" },
      { id: "MainMenulogout", value: "Logout", icon: "webix_icon mdi mdi-logout" },
      { id: "MainMenuregister", value: "Register", icon: "webix_icon mdi mdi-account-plus" }
    ]
  });
  listItems.push({value: ""});
  for (let moduleName of wxAMC.registeredModules) {
    listItems.push({
      id: moduleName,
      value: wxAMC.modules[moduleName].getUIConfig().winLabel + " (" + wxAMC.modules[moduleName].getUIConfig().winHotkey + ")",
      icon: wxAMC.modules[moduleName].getUIConfig().winIcon
    });
  }

  listItems.push({value: ""});
  listItems.push({
    id: "switchMode", value: (wxAMC.uiType == "mobile" ? "Mobile" : "Desktop"),
    icon: (wxAMC.uiType == "mobile" ? "webix_icon mdi mdi-tablet-cellphone" : "webix_icon mdi mdi-desktop-classic")
  });

  listItems.push({ id: "home", value: "Home", icon: "webix_icon mdi mdi-home" });

  webix.UIManager.addHotKey("ctrl+o",
    function (code, e) {
      const css = $$("sidemenu").getItem("MainMenulogout").$css
      if (css != undefined && !css.endsWith("disabledMenuItem"))
        wxAMC.actionSidemenu("MainMenulogout");

    });

  webix.UIManager.addHotKey("ctrl+i",
    function (code, e) {
      const css = $$("sidemenu").getItem("MainMenulogin").$css
      if (css != undefined && !css.endsWith("disabledMenuItem"))
        wxAMC.actionSidemenu("MainMenulogin");

    });

  for (let moduleName of wxAMC.registeredModules) {
    webix.UIManager.addHotKey(wxAMC.modules[moduleName].getUIConfig().winHotkey,
      function (code, e) {
        let css = $$("sidemenu").getItem(moduleName).$css
        if (css != undefined && !css.endsWith("disabledMenuItem"))
          wxAMC.actionSidemenu(moduleName);
      }
    );
  }

  const sidemenu = {
    view: "sidebar",
    id: "sidemenu",
    width: 220,
    position: "left",
    css: "cssSideMenu",
    borderless: true,
    scroll: true,
    data: listItems,
    on: {
      onBeforeSelect: function (id) {
        let css = $$("sidemenu").getItem(id).$css
        if (css != undefined && !css.endsWith("disabledMenuItem"))
          return true;
        return false;
      },
      onAfterSelect: function (id) {
        wxAMC.actionSidemenu(id)
      }
    }
  };

  console.log(sidemenu);

  return sidemenu;
}; /* End getSideMenuConfig(). */

wxAMC.setHidden = function () {

  let element
  let css
  var logged = $$("sidemenu").getItem("loggedUser");

  if (wxAMC.isAuthenticated) {
    logged.value = wxAMC.loggedUser;
    logged.icon = "webix_icon mdi mdi-login-variant"
    //$$("sidemenu").updateItem("loggedUser", logged)


    for (element of logoffMenu) {
      css = $$("sidemenu").getItem(element).$css
      if (css == undefined)
        css = " disabledMenuItem"
      else
        css += " disabledMenuItem"
      $$("sidemenu").getItem(element).$css = css;
    }

    switch (wxAMC.UserRole) {
      case "use3r":
        for (element of loginUserMenu) {
          css = $$("sidemenu").getItem(element).$css
          if (css == undefined)
            css = ""
          else
            css = css.replace(" disabledMenuItem", "")
          $$("sidemenu").getItem(element).$css = css;
        }
        break;

      case "admin":
        for (element of loginAdminMenu) {
          css = $$("sidemenu").getItem(element).$css
          if (css == undefined)
            css = ""
          else
            css = css.replace(" disabledMenuItem", "")
          $$("sidemenu").getItem(element).$css = css;
        }
        break;

      case "revisor":
        for (element of loginRevisorMenu) {
          css = $$("sidemenu").getItem(element).$css
          if (css == undefined)
            css = ""
          else
            css = css.replace(" disabledMenuItem", "")
          $$("sidemenu").getItem(element).$css = css;
        }
        break;

      default:
        break;
    }

  } else {
    console.log(logged);
    logged.value = "not logged in";
    logged.icon = "webix_icon mdi mdi-logout-variant"
    // $$("sidemenu").updateItem("loggedUser", logged)

    for (element of logoffMenu) {
      css = $$("sidemenu").getItem(element).$css
      if (css == undefined)
        css = " disabledMenuItem"
      else
        css += " disabledMenuItem"
      $$("sidemenu").getItem(element).$css = css;
    }
    for (element of loginAdminMenu) {
      css = $$("sidemenu").getItem(element).$css
      if (css == undefined)
        css = ""
      else
        css = css.replace(" disabledMenuItem", "")
      $$("sidemenu").getItem(element).$css = css;
    }
  }
  $$("sidemenu").refresh();

} /* End setHidden */

wxAMC.actionSidemenu = function (id) {
  console.log(id);

  switch (id) {
    case "MainMenulogin":
      wxAMC.showLoginGui();
      break;

    case "MainMenulogout":
      wxAMC.doLogout();
      break;

    case "MainMenuregister":
      wxAMC.showRegistGui();
      break;

    case "switchMode":
      wxAMC.switchMode();
      break;

    case "home":
      for (let moduleName of wxAMC.registeredModules) {
        let moduleWindow = $$(`moduleWindow-${moduleName}`);

        // Module window already exists, just close it.
        if (moduleWindow) {
          moduleWindow.close();
          $$("taskbar").removeView(`moduleTasbbarButton-${moduleName}`);
        }
      }
      // Populate day-at-a-glance screen data.
      wxAMC.dayAtAGlance();
      // Show day-at-a-glance screen.
      $$("dayAtAGlance").show();
      break;

    default:
      if (wxAMC.registeredModules.includes(id))
        wxAMC.launchModule(id)
      break;
  }

  $$("sidemenu").unselectAll();
} /* Ende actionSidemenu */