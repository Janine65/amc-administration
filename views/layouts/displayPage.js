// set all the necessary elements global


const topmenu_data = [
        {id:"home", value:"Home", icon:"webix_icon mdi mdi-home"},
        {id:"1", value:"Mitglieder", icon:"webix_icon mdi mdi-account", 
            data:[
                {id:"11",value:"Mitglieder verwalten", href:"/grid"},
                {id:"12", value:"Mitglieder exportieren", href:""}
        ]},
        {id:"2", value:"Anlässe", icon:"webix_icon mdi mdi-timetable", 
            data:[
                {id:"21",value:"Anlässe buchen", href:""},
                {id:"22",value:"Anlässe verwalten", href:""}
        ]},
        {id:"3", value:"Info", icon:"webix_icon mdi mdi-information-variant" }
    ];

const footer_data = "@ Janine Franken 2020, GNU license.";

const top_toolbar = { view: "toolbar", padding:3, elements: [
    { view: "button", type: "icon", icon: "mdi mdi-menu",
        width: 37, align: "left", css: "app_button", click: function(){
            $$("sidebar").toggle();
        }
    },
    { id: "top_label", view: "label", label: "AMC"}
    ]};

const firstCol = 
        {
        cols: [ {
            view:"sidebar", id:"sidebar", data:topmenu_data, collapsed:false
            }
        ]
        };
