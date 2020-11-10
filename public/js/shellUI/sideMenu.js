
/**
 * Get the UI config object for the sidemenu.
 */
wxAMC.getSideMenuConfig = function() {

  const listItems = [ ];
  for (let moduleName of wxAMC.registeredModules) {
    listItems.push({ id : moduleName, value : wxAMC.modules[moduleName].getUIConfig().winLabel,
      icon : wxAMC.modules[moduleName].getUIConfig().winIcon, css: wxAMC.modules[moduleName].getUIConfig().winCss
    });
  }

  return {
    view : "sidemenu", id : "sidemenu", width : 200,
    position : "left", css : "cssSideMenu",
    state : (inState) => {
      const toolbarHeight = $$("toolbar").$height;
      inState.top = toolbarHeight;
      inState.height -= toolbarHeight;
    },
    body : {
      rows : [
        { view : "label", id: "loggedUser", label: "not logged in", height : 20
        },
        { height : 2, template : "<hr>" },
        { view : "list", scroll : true,
          select : false, type : { height : 40 }, id : "sidemenu_list",
          template : `<span class="#icon#"></span> #value#`,
          data : listItems, click : wxAMC.launchModule, css: "authenticate_logged_in hidden",
          scheme:{
            $init:function(obj){
              if (obj.css != null) obj.$css = obj.css;
            }
          },
        },
        { height : 2, template : "<hr>" },
        {view : "label", id: "MainMenulogin", label: "Login", icon: "webix_icon mdi mdi-login",
          click: wxAMC.showLoginGui.bind(this), css: "authenticate_logged_out"},
        {view : "label", id: "MainMenulogout", label: "Logout", icon: "webix_icon mdi mdi-logout",
          click: wxAMC.doLogout.bind(this), css: "authenticate_logged_in hidden"},
        {view : "label", id: "MainMenuregister", label: "Register", icon: "webix_icon mdi mdi-account-plus",
          click: wxAMC.showRegistGui.bind(this), css: "authenticate_logged_in authenticate_admin hidden"},
        { height : 2, template : "<hr>" },
        { cols : [
          wxAMC.modeSwitchConfig,
          { },
          { view : "button", type : "icon", label : "", icon : "webix_icon mdi mdi-home",
            align : "right", width : 32,
            click : () => {
              // Populate day-at-a-glance screen data.
              wxAMC.dayAtAGlance();
              // Hide sidemenu and show day-at-a-glance screen.
              $$("sidemenu").hide();
              $$("dayAtAGlance").show();
            }
          }
        ] }
      ]
    }
  };

}; /* End getSideMenuConfig(). */
