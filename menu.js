module.exports = 
{
    getMenu:function(req){

    var menu = [
        {id:"home", value:"Home", icon:"webix_icon mdi mdi-home", href:"/"},
        {id:"menu1", value:"Mitglieder", icon:"webix_icon mdi mdi-account", 
            data:[
                {id:"menu11",value:"Mitglieder verwalten", href:"/grid"},
                {id:"menu12", value:"Mitglieder exportieren", href:""}
        ]},
        {id:"menu2", value:"Anlässe", icon:"webix_icon mdi mdi-timetable", 
            data:[
                {id:"menu21",value:"Anlässe buchen", href:""},
                {id:"menu22",value:"Anlässe verwalten", href:""}
        ]},
        {id:"menu3", value:"Info", icon:"webix_icon mdi mdi-information-variant", href:""}
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
    },

    getToolbar:function(){
        const toolbar = { view: "toolbar", padding:3, elements: [
            { view: "button", type: "icon", icon: "mdi mdi-menu",
                width: 37, align: "left", css: "app_button", click: function(){
                    $$("sidebar").toggle();
                }
            },
            { id: "top_label", view: "label", label: "AMC"}, {},
            { id: "copyright", view: "label", label: "@ Janine Franken 2020, GNU license.", css:{ "text-align": "right", "font-style":"italic"}}
            ]};
        return toolbar;
    },

    firstCol:function(){
        const firstCol = 
        {
        cols: [ {
            view:"sidebar", id:"sidebar", data:getMenu(this), collapsed:false,
			arrow: function(obj) {
				var html = "";
				for (var i=1; i<=obj.$level; i++) {
					if (i==obj.$level && obj.$count) {
						var icon = "wxi-angle-"+(obj.open?"down":"left");
						var className = "webix_sidebar_dir_icon webix_icon "+ icon;
						html+="<span class='"+className+"'></span>";
					}
				}
				return html;
			}
            }
        ]
        };
        return firstCol;
    }

};