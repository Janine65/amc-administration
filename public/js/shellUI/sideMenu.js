"use strict";

/**
 * Get the UI config object for the sidemenu.
 */
wxAMC.getSideMenuConfig = function() {

  const listItems = [ ];
  listItems.push({ id: "loggedUser", value: "not logged in", icon: "webis_icon mdi mdi-account", $css: "loggedinUser"});
  listItems.push({id: "switchMode", value : (wxAMC.uiType == "mobile" ? "Mobile" : "Desktop"), 
        icon: (wxAMC.uiType == "mobile" ? "webix_icon mdi mdi-tablet-cellphone" : "webix_icon mdi mdi-desktop-classic"),
        $css: "logoutMenu"});
  listItems.push({ id: "home", value : "Home", icon : "webix_icon mdi mdi-home"});

  return {
    view : "sidebar", id : "sidemenu", width : 220,
    position : "left", collapsed: (wxAMC.uiType == "mobile" ? true : false),
    css: "cssSideMenu",
    activeTitle: true,
    data :  listItems,
    on:{
      onAfterSelect: function(id) {
        wxAMC.actionSidemenu(id)
      }
    }
  };

}; /* End getSideMenuConfig(). */

wxAMC.actionSidemenu = function(id) {
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
}