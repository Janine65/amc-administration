
/**
 * Get the UI config object for the base layout.
 */
wxAMC.getBaseLayoutConfig = function() {
  let baseLayout = {
      id : "baseLayout",
      rows : [
        /* ---------- wxAMC header. ---------- */
        wxAMC.getMainHeaderConfig(),
        { template: " ", height: "2"},
        { cols: [ wxAMC.getSideMenuConfig(),
          wxAMC.getMultiviewConfig()
        ] }
      ]
    };

  return baseLayout;

}; /* End getBaseLayoutConfig(). */
