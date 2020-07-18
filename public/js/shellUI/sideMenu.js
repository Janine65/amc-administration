
/**
 * Get the UI config object for the sidemenu.
 */
wxAMC.getSideMenuConfig = function() {

  const listItems = [ ];
  for (let moduleName of wxAMC.registeredModules) {
    listItems.push({ id : moduleName, value : wxAMC.modules[moduleName].getUIConfig().winLabel,
      icon : wxAMC.modules[moduleName].getUIConfig().winIcon
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
        { view : "list", scroll : true,
          select : false, type : { height : 40 }, id : "sidemenu_list",
          template : `<span class="#icon#"></span> #value#`,
          data : listItems, click : wxAMC.launchModule
        },
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
