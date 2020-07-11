
/**
 * Get the UI config object for the main header.
 */
wxAMC.getMainHeaderConfig = function() {

  // Configuraqtion for the mode switch checkbox.
  wxAMC.modeSwitchConfig = {
    view : "checkbox", label : "Desktop", labelWidth : 70, width : 110,
    value : (wxAMC.uiType === "mobile" ? 0 : 1), click : wxAMC.switchMode
  };

  // Mobile UI uses a sidemenu.
//  if (wxAMC.uiType === "mobile") {

    return {
      view : "toolbar", id : "toolbar", height : 50,
      elements : [
        { view: "icon", icon: "webix_icon mdi mdi-menu",
          click : function() {
            if ($$("sidemenu").isVisible()) {
              $$("sidemenu").hide();
            } else {
              $$("sidemenu").show();
            }
          }
        },
        { id : "headerLabel", view: "label",
          label : "", defaultLabel : "Auto-Moto Club Swissair"
        },
        { view : "toolbar", id : "taskbar", borderless : true, elements : [ ] },
      ]
    };

  // Desktop UI uses a typical desktop taskbar/"start" menu.
  /* } else {

    return {
      view : "toolbar", id : "toolbar", height : 50,
      elements : [
        { view : "menu", width : 100, css : { "padding-top" : "4px" },
          data : [
            { value : "Modules", id : "Modules",
              submenu : wxAMC.registeredModules.sort()
            }
          ],
      		on : { onMenuItemClick : wxAMC.launchModule }
        },
        { view : "toolbar", id : "taskbar", borderless : true, elements : [ ] },
        { },
        wxAMC.modeSwitchConfig
      ]
    };
 
  } *//* End uiType check. */

}; /* End getMainHeaderConfig(). */
