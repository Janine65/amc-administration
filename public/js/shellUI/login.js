
// Create a window with the app's layout inside it.
wxAMC.loginGui = {
    view : "ani-window", move : true, width: "450", height: "256",
    left : centerX, top : centerY,
    resize : false, id : "loginWindow", toFront : true,
    fullscreen : false,
    head : {
        view : "toolbar",
        cols : [
        { view : "label", label: "Login" },
        ]
    },
    body : { id : "login-details",
    rows : [
        {view: "label", id: "message", value: ""},
        {view: "htmlform", id : "login-detailsform",
            template: "http->js/shellUI/loginUI.html"
        },
        {cols: [
            {view: "button", value: "Login", css:"webix_primary", click: wxAMC.doLogin.bind(this), hotkey: "enter"},
            {view: "button", value: "Cancel", click: closeWindow.bind(this), hotkey: "esc"}
        ]}
        
    ]}
};

function closeWindow() {
    $$("loginWindow").close();
}

