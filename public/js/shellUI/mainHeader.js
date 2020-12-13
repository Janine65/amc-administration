
/**
 * Get the UI config object for the main header.
 */
wxAMC.getMainHeaderConfig = function() {

    return {
      view : "toolbar", id : "toolbar", height : 50,
      elements : [
        { view: "icon", icon: "webix_icon mdi mdi-menu",
          click : function() {
              $$("sidemenu").toggle();
          }
        },
        { id : "headerLabel", view: "label",
          label : ""
        },
        { view : "toolbar", id : "taskbar", borderless : true, 
          elements : [ 
        ] },
      ]
    };

}; /* End getMainHeaderConfig(). */
