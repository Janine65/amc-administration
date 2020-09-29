
let vpWidth = document.documentElement.clientWidth - 100;
let vpHeight = document.documentElement.clientHeight - 100;
if (vpWidth > 650)
    vpWidth = 650;
if (vpHeight > 700)
    vpHeight = 700;
let centerX = (vpWidth  / 2) + 50;
let centerY = (vpHeight / 3) - 50;

// Create a window with the app's layout inside it.
wxAMC.registGui = {
    view : "ani-window", move : true, width : vpWidth, height : vpHeight,
    left : centerX, top : centerY,
    resize : true, id : "registerWindow", toFront : true,
    fullscreen : false,
    head : {
        view : "toolbar",
        cols : [
        { view : "label", label: "Register" },
        ]
    },
    body : { id : "register-details",
    rows : [
        {view:"form", id : "register-detailsform",
            elementsConfig : { 
                on : { onChange : () => {
                    $$("register-detailsformSave")
                        [$$("register-detailsform").validate()? "enable" : "disable"]();
                } }
            },
            elements: [
            {
                view: "label",
                css: "hiddeen",
                id: "message",
                label: ""
            },
            {
                view: "text",
                width: 500,
                label: "Name",
                labelAlign: "right",
                name: "name",
                labelWidth: 100,
                placeholder: "Max Muster",
                required: true
            },            {
                view: "text",
                width: 500,
                label: "Email",
                labelAlign: "right",
                placeholder: "user@muster.com",
                type: "email",
                name: "email",
                labelWidth: 100,
                required: true
            },
            {
                view: "text",
                width: 500,
                label: "Password",
                labelAlign: "right",
                type: "password",
                name: "password",
                labelWidth: 100,
                placeholder: "at least length of 8",
                required: true
            },
            {
                view: "text",
                width: 500,
                label: "Password to verify",
                labelAlign: "right",
                type: "password",
                name: "passwordVerify",
                labelWidth: 100,
                placeholder: "",
                required: true
            },
            {cols: [
                {
                    id : "register-detailsformSave",
                    label: "Register",
                    type: "form",
                    view: "button",
                    width: 200,
                    icon: "webix_icon mdi mdi-account-plus",
                    click: doRegister.bind(this),
                    disabled: true
                },
                {
                    label: "Cancel",
                    type: "form",
                    view: "button",
                    width: 200,
                    icon: "webix_icon mdi mdi-close",
                    click: closeWindow.bind(this)
                }
    
            ]}
        ]}        
    ]}
};

function closeWindow() {
    $$("registerWindow").close();
}

function doRegister() {
    if (!$$("register-detailsform").validate()) {
        $$("message").setValue("Not all fields are filled")
        return;
    }

    const user = $$("register-detailsform").getValues();
    if (user.password !== user.passwordVerify) {
        $$("message").setValue("Passwords ar not equal")
        return;
    }

    const url = "/user/register";

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
    // .then((response) => {
    //     console.log(response);
    //     if (!response.ok) {                                  // ***
    //         $$("message").setValue("An error occurred while creating user") ; // ***
    //         return response.json();
    //     }})
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
            closeWindow();
        }
        })
    .catch((e) => $$("message").setValue(e));  // ***;

}
