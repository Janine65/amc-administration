module.exports = function(req){

  var menu = [
    { value:"Mitglieder verwalten", data:[
      { href:'/grid', value:"Mitglieder aufzeigen" },
    ]}
  ];

  for (var i=0; i<menu.length; i++)
    for (var j = 0; j < menu[i].data.length; j++) {
      var item = menu[i].data[j];
      if (item.href == req.url)
        item.css = "selected";
    }

  return { menu };
};