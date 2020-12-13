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
      winWidth: 1000, winHeight: 800, winLabel: "Auswertungen", winIcon: "mdi mdi-chart-bar", winHotkey: "ctrl+w",
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
              cols: [
                {
                  view: "checkbox", label: "Vergleich Vorjahr", id: "checkVorjahr", value: 0, labelWidth: 150,
                  on: {
                    onViewShow: this.refreshData.bind(this),
                    onChange: this.refreshData.bind(this)
                  }
                },
                {
                  view: "button", label: "Bild speicher", id: "saveImage",
                  type: "icon", icon: "webix_icon mdi mdi-printer",
                  click: this.saveImage.bind(this)
                },
                {
                  view: "button", label: "Excel erstellen", id: "excelCreate",
                  type: "icon", icon: "webix_icon mdi mdi-file-excel",
                  click: wxAMC.writeAuswertung.bind(this)
                }
              ]
            },
            {
              view: "chart", type: "stackedBarH", id: "moduleAuswertungenChartOhne", hidden: false,
              //barWidth:60,
              radius: 0,
              yAxis: {
                template: "#anlass#",
                lineColor: "#fff"
              },
              padding: {
                left: 10
              },
              xAxis: {
                lineColor: "#fff"
              },
              legend: {
                values: [{ text: "Mitglieder", color: "#FDBD67" }, { text: "Gäste", color: "#5CCEF2" }],
                valign: "bottom",
                alpha: 0.9,
                align: "left",
                width: 120,
                layout: "x"
              },
              series: [
                {
                  value: "#teilnehmer#",
                  color: "#FDBD67 ",
                  tooltip: {
                    template: "#teilnehmer#"
                  }
                },
                {
                  value: "#gaeste#",
                  color: "#5CCEF2",
                  tooltip: {
                    template: "#gaeste#"
                  }
                }
              ]
            }, /* End chart. */
            {
              view: "chart", type: "barH", id: "moduleAuswertungenChartMit", hidden: true,
              //barWidth:60,
              radius: 0,
              yAxis: {
                template: "#anlass#",
                lineColor: "#fff",
                color: "#fff"
              },
              padding: {
                left: 10
              },
              xAxis: {
                lineColor: "#fff",
                color: "#fff"
              },
              legend: {
                values: [{ text: "aktuelles Jahr", color: "#27ae60" }, { text: "Vorjahr", color: "#FF8063" }],
                valign: "bottom",
                alpha: 0.9,
                align: "left",
                width: 120,
                layout: "x"
              },
              series: [
                {
                  value: "#aktjahr#",
                  color: "#27ae60",
                  tooltip: {
                    template: "#aktjahr#"
                  }
                },
                {
                  value: "#vorjahr#",
                  color: "#FF8063",
                  tooltip: {
                    template: "#vorjahr#"
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
   * Save the image just shown
   */
  async saveImage() {
    let chart
    let docHeader
    if ($$("checkVorjahr").getValue() == 1) {
      chart = "moduleAuswertungenChartMit";
      docHeader = "Auswertung für das Jahr " + $$("moduleAuswertungendatumSelect").getValue() + " - Vergleich mit dem Vorjahr";
    } else {
      chart = "moduleAuswertungenChartOhne";
      docHeader = "Auswertung für das Jahr " + $$("moduleAuswertungendatumSelect").getValue();
    }
    await webix.toPDF([
      { id: chart, options: { display: "image" } }, 
      { id: chart, options: { autowidth: true } }], 
      {
        filename: "auswertung", orientation: "landscape",
        docHeader: {
          text: docHeader,
          textAlign: "center",
          color: 0x666666
        }
      });

  } /* End saveImage */

  /**
   * Refresh the auswertungen list from local storage.
   */
  async refreshData() {

    var sSelYear = $$("moduleAuswertungendatumSelect").getValue();
    var url = "/Meisterschaft/getChartData?jahr=" + sSelYear;
    let chart
    if ($$("checkVorjahr").getValue() == 1) {
      url += "&vorjahr=true";
      chart = $$("moduleAuswertungenChartMit");
      $$("moduleAuswertungenChartOhne").hide();
      $$("moduleAuswertungenChartMit").show();
    } else {
      url += "&vorjahr=false";
      chart = $$("moduleAuswertungenChartOhne");
      $$("moduleAuswertungenChartOhne").show();
      $$("moduleAuswertungenChartMit").hide();
    }

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

        chart.clearAll();
        chart.parse(itemsAsArray);

      });

  } /* End refreshData(). */


  /**
   * Service requests from day-at-a-glance to present data for this module.
   */
  async dayAtAGlance() {


  } /* End dayAtAGlance(). */

}; /* End Auswertungen class. */
