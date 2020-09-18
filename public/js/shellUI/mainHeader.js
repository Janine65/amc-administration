
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
          label : ""
        },
        { view : "toolbar", id : "taskbar", borderless : true, 
        elements : [ ] },
        { view : "toolbar", id: "auth0", borderless : true, 
          elements : [ 
            // login - logoff
            { view: "button", label : "Login", width : "80", type : "icon",
              icon : "mdi mdi-login", id : "qsLoginBtn", 
              click : function(){
                login();
              }, css:"auth-invisible"
            },
            { view: "button", label : "Logout", width : "80", type : "icon",
              icon : "mdi mdi-logout", id : "qsLogoutBtn", 
              click : function(){
                logout();
              }, css:"auth-visible"
            }
          ] 
        },
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