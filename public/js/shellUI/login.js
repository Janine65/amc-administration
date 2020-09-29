
// Create a window with the app's layout inside it.
wxAMC.loginGui = {
    view : "ani-window", move : true, width : vpWidth, height : vpHeight,
    left : centerX, top : centerY,
    resize : true, id : "loginWindow", toFront : true,
    fullscreen : false,
    head : {
        view : "toolbar",
        cols : [
        { view : "label", label: "Login" },
        ]
    },
    body : { id : "login-details",
    rows : [
        {view:"form", id : "login-detailsform",
            elements: [
            {
                view: "label",
                id: "message",
                label: ""
            },
            {
                view: "text",
                width: 500,
                label: "Email",
                labelAlign: "right",
                placeholder: "user@muster.com",
                type: "email",
                name: "email",
                labelWidth: 100,
                required: true,
                attributes: {autocomplete: "username"}
            },
            {
                view: "text",
                width: 500,
                label: "Password",
                labelAlign: "right",
                type: "password",
                name: "password",
                labelWidth: 100,
                placeholder: "",
                required: true,
                attributes: {autocomplete: "current-password"}
            },
            {cols: [
                {
                    id : "login-detailsformLogin",
                    label: "Login",
                    type: "form",
                    view: "button",
                    width: 200,
                    icon: "webix_icon mdi mdi-login",
                    click: doLogin.bind(this), hotkey: "enter"
                },
                {
                    label: "Cancel",
                    type: "form",
                    view: "button",
                    width: 200,
                    icon: "webix_icon mdi mdi-close",
                    click: closeWindow.bind(this), hotkey: "cancel"
                }
    
            ]}
        ]}        
    ]}
};

function closeWindow() {
    $$("loginWindow").close();
}

function doLogin() {
    if (!$$("login-detailsform").validate()) {
        $$("message").setValue("Not all fields are filled")
        return;
    }

    const user = $$("login-detailsform").getValues();

    const url = "/user/login";

    $$("message").setValue("")

    const promiseModule = fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(user) // body data type must match "Content-Type" header
    })
    .then(function(resp) {
        if (!resp.ok) {
            $$("message").setValue("an error occurred while creating user");
        }
        return resp.json();
    })
    .catch((e) => $$("message").setValue(e));  // ***
    
    Promise.resolve(promiseModule)
    .then(function(resp) {
        if (resp.status == 'error') {
            $$("message").setValue(resp.message);
        } else {
            wxAMC.loggedUser = resp;
            wxAMC.isAuthenticated = true;
            wxAMC.loggedUser = resp.name;
            wxAMC.UserRole = resp.role;
            webix.message("Welcome " + wxAMC.loggedUser, "Info");
            wxAMC.setHidden();
            closeWindow();
        }
        })
    .catch((e) => $$("message").setValue(e));  // ***;

}
