
/**
 * Get the UI config object for the base layout.
 */
wxAMC.getBaseLayoutConfig = function() {

  return {
    id : "baseLayout",
    rows : [
      /* ---------- wxAMC header. ---------- */
      wxAMC.getMainHeaderConfig(),
      wxAMC.getMultiviewConfig()
    ]
  };

}; /* End getBaseLayoutConfig(). */
