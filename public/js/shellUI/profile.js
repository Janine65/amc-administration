// Create a window with the app's layout inside it.
wxAMC.ProfileGui = {
    view: "ani-window", move: true, width: 450, height: 300,
    position: "center",
    resize: false, id: "profileWindow", toFront: true,
    fullscreen: false, modal: true,
    head: {
        view: "toolbar",
        cols: [
            { view: "label", label: "Profile" },
        ]
    },
    body: {
        id: "profile-details",
        rows: [
            {view: "label", id: "messageprofile", value: ""},
            {
                view: "htmlform", id: "profile-detailsform",
                template: "http->js/shellUI/profileUI.html"
            },
            {
                cols: [
                    {
                        id: "profile-detailsformSave",
                        label: "Save",
                        type: "form",
                        view: "button",
                        icon: "webix_icon mdi mdi-content-save",
                        click: updateProfile.bind(this)
                    },
                    {
                        label: "Cancel",
                        type: "form",
                        view: "button",
                        icon: "webix_icon mdi mdi-close",
                        click: closeWindow.bind(this)
                    }

                ]
            }
        ]
    }
};

function closeWindow() {
    $$("profileWindow").close();
}

function updateProfile() {
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
        .then(function (resp) {
            if (!resp.ok) {
                $$("messageprofile").setValue("an error occurred while creating user");
            }
            return resp.json();
        })
        .catch((e) => $$("messageprofile").setValue(e));  // ***

    Promise.resolve(promiseModule)
        .then(function (resp) {
            if (resp.status == 'error') {
                $$("messageprofile").setValue(resp.message);
            } else {
                $$("profileWindow").close();
            }
        })
        .catch((e) => $$("messageprofile").setValue(e));  // ***;

}
