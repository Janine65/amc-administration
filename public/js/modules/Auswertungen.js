// "Register" this module with wxAMC.
wxAMC.registeredModules.push("Auswertungen");

wxAMC.moduleClasses.Auswertungen = class {


  /**
   * Constructor.
   */
  constructor() {

    // Flag set to true when editing an existing item, false when adding a new one.
    this.isEditingExisting = false;

    // The ID of the item being edited in the current module, if any.
    this.editingID = null;

    // Store the adressen for the selected date, if any.
    this.currentData = {};

  } /* End constructor. */


  /**
     * Return the module's UI config object.
     */
  getUIConfig() {

    return {
      winWidth: 1000, winHeight: 800, winLabel: "Auswertungen Ctrl+W", winIcon: "mdi mdi-chart-bar", winHotkey: "ctrl+w",
      id: "moduleAuswertungen-container",
      cells: [
        /* ---------- Auswertungen list cell. ---------- */
        {
          id: "moduleAuswertungen-itemsCell",
          rows: [
            {
              view: "select", value: wxAMC.parameter.get('CLUBJAHR'), label: "Jahr wählen:",
              id: "moduleAuswertungendatumSelect",
              options: [
                { "id": (parseInt(wxAMC.parameter.get('CLUBJAHR')) - 1), value: parseInt(wxAMC.parameter.get('CLUBJAHR')) - 1 },
                { "id": parseInt(wxAMC.parameter.get('CLUBJAHR')), value: parseInt(wxAMC.parameter.get('CLUBJAHR')), selected: true },
                { "id": (parseInt(wxAMC.parameter.get('CLUBJAHR')) + 1), value: parseInt(wxAMC.parameter.get('CLUBJAHR')) + 1 }
              ],
              on: {
                onViewShow: this.refreshData.bind(this),
                onChange: this.refreshData.bind(this)
              }
            },
            {
              view: "chart", type: "stackedBarH", id: "moduleAuswertungenChart", 
              //barWidth:60,
              radius: 0,
              alpha:0.7,
              gradient:"falling",
              yAxis:{
               template:"#anlass#",
               lineColor: "#000000"
              },
              padding:{
                left:10
              },
              xAxis:{
                lineColor: "#000000"
              },
              legend:{
                values:[{text:"Mitglieder",color:"#58dccd"},{text:"Gäste",color:"#a7ee70"}],
                valign:"bottom",
                align:"left",
                width:90,
                layout:"x"              },
              series:[
                {
                  value:"#teilnehmer#",
                  color: "#58dccd", 
                  tooltip:{
                    template:"#teilnehmer#"
                  }
                },
                {
                  value:"#gaeste#",
                  color:"#a7ee70", 
                  tooltip:{
                    template:"#gaeste#"
                  }
                }
              ]
            } /* End chart. */
          ] /* End auswertungen list rows. */
        } /* End auswertungen list cell. */
      ] /* End main layout cells. */
    };
  } /* End getUIConfig(). */

  /**
   * Called whenever this module becomes active.
   */
  activate() {
    this.refreshData();
  } /* End activate(). */


  /**
   * Called whenever this module becomes inactive.
   */
  deactivate() {
  } /* End deactivate(). */

  /**
   * Refresh the auswertungen list from local storage.
   */
  async refreshData() {

    var sSelYear = $$("moduleAuswertungendatumSelect").getValue();
    const url = "/Meisterschaft/getChartData?jahr=" + sSelYear;
    
    const promiseModule = fetch(url)
      .then(function (response) {
        //console.log(response);
        return response.json();
      }).catch(function (error) {
        webix.message({ type: "error", text: error })
      });
    Promise.resolve(promiseModule)
      .then(async function (dataItems) {
        // Get the items as an array of objects.
        const itemsAsArray = wxAMC.objectAsArray(dataItems);

        $$("moduleAuswertungenChart").clearAll();

        $$("moduleAuswertungenChart").parse(itemsAsArray);

      });

  } /* End refreshData(). */


  /**
   * Service requests from day-at-a-glance to present data for this module.
   */
  async dayAtAGlance() {


  } /* End dayAtAGlance(). */

}; /* End Auswertungen class. */
