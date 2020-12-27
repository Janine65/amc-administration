
let vpWidth = document.documentElement.clientWidth - 100;
let vpHeight = document.documentElement.clientHeight - 100;
if (vpWidth > 650)
    vpWidth = 650;
if (vpHeight > 700)
    vpHeight = 700;

// Create a window with the app's layout inside it.
wxAMC.ProfileGui = {
    view : "ani-window", move : true, width : vpWidth, height : vpHeight,
    position: "center",
    resize : true, id : "profileWindow", toFront : true,
    fullscreen : false,
    head : {
        view : "toolbar",
        cols : [
        { view : "label", label: "Profile" },
        ]
    },
    body : { id : "profile-details",
    rows : [
        {view:"form", id : "profile-detailsform",
            elementsConfig : { 
                on : { onChange : () => {
                    $$("profile-detailsformSave")
                        [$$("profile-detailsform").validate()? "enable" : "disable"]();
                } }
            },
            elements: [
            {
                view: "label",
                css: "hiddeen",
                id: "messageprofile",
                label: ""
            },
            {
                view: "text",
                width: 500,
                label: "Name",
                labelAlign: "right",
                name: "name",
                labelWidth: 200,
                placeholder: "Max Muster"
            },            {
                view: "text",
                width: 500,
                label: "Email",
                labelAlign: "right",
                placeholder: "user@muster.com",
                type: "email",
                name: "email",
                labelWidth: 200
            },
            {
                view: "text",
                width: 500,
                label: "New Password",
                labelAlign: "right",
                type: "password",
                name: "password",
                labelWidth: 200,
                placeholder: "at least length of 8"
            },
            {
                view: "text",
                width: 500,
                label: "Password verify",
                labelAlign: "right",
                type: "password",
                name: "passwordVerify",
                labelWidth: 200,
                placeholder: ""
            },
            {cols: [
                {
                    id : "profile-detailsformSave",
                    label: "Save",
                    type: "form",
                    view: "button",
                    width: 200,
                    icon: "webix_icon mdi mdi-content-save",
                    click: updateProfile.bind(this),
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
    $$("profileWindow").close();
}

function updateProfile() {
    if (!$$("profile-detailsform").isDirty()) {
        webix.message({
            type: "info",
            text: "Keine Änderungen vorgenommen"
          });
          $$("profileWindow").close();
          return;
        }

    if (!$$("profile-detailsform").validate()) {
        $$("messageprofile").setValue("Not all fields are filled")
        return;
    }

    const user = $$("profile-detailsform").getValues();
    if (user.password !== user.passwordVerify) {
        $$("messageprofile").setValue("Passwords ar not equal")
        return;
    }

    const url = "/Users/updateProfile";

    $$("messageprofile").setValue("")

    const promiseModule = fetch(url, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
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
            $$("messageprofile").setValue("an error occurred while creating user");
        }
        return resp.json();
    })
    .catch((e) => $$("messageprofile").setValue(e));  // ***
    
    Promise.resolve(promiseModule)
    .then(function(resp) {
        if (resp.status == 'error') {
            $$("messageprofile").setValue(resp.message);
        } else {
            $$("profileWindow").close();
        }
    })
    .catch((e) => $$("messageprofile").setValue(e));  // ***;

}
