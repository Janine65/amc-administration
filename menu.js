module.exports = function(req){

    var menu = [
        {id:"home", value:"Home", icon:"webix_icon mdi mdi-home", href:"/"},
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
        {id:"3", value:"Info", icon:"webix_icon mdi mdi-information-variant", href:""}
    ];

    for (var i=0; i<menu.length; i++) {
        if (menu[i].href == null && menu[i].data != null)
            for (var j = 0; j < menu[i].data.length; j++) {
            var item = menu[i].data[j];
            if (item.href == req.url)
                item.css = "selected";
            }
        else if (menu[i].href == req.url)
                menu[i].css = "selected";
        
    }
  return { menu };

};