
/**
 * Get the UI config object for the mobile multiview.
 */
wxAMC.getMultiviewConfig = function() {

  const cellsConfig = [ wxAMC.getDayAtAGlanceConfig() ];
  if (wxAMC.uiType === "mobile") {
    for (let moduleName of wxAMC.registeredModules) {
      cellsConfig.push(wxAMC.modules[moduleName].getUIConfig());
    }
  } 

  return {
    view : "multiview", id : "moduleArea", cells : cellsConfig,
    animate : { type : "flip", subtype : "horizontal" }
  };

}; /* End getMultiviewConfig(). */
