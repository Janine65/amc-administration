
// Create a window with the app's layout inside it.
wxAMC.loginGui = {
    view: "ani-window", move: true, width: "450", height: "300",
    position: "center",
    resize: false, id: "loginWindow", toFront: true,
    fullscreen: (wxAMC.uiType === "mobile"), modal: true,
    head: {
        view: "toolbar",
        cols: [
            { view: "label", label: "Login" },
        ]
    },
    body: {
        id: "login-details",
        rows: [
            { view: "label", id: "loginmessage", value: "" },
            {
                view: "htmlform", id: "login-detailsform",
                template: "http->js/shellUI/loginUI.html"
            },
            {
                cols: [
                    { view: "button", value: "Login", css: "webix_primary", click: wxAMC.doLogin.bind(this), hotkey: "enter" },
                    { view: "button", value: "Cancel", click: closeWindow.bind(this), hotkey: "esc" }
                ]
            },
            { view: "button", value: "Send a new Password", click: sendEmail.bind(this) }

        ]
    }
};

function closeWindow() {
    $$("loginWindow").close();
}

function sendEmail() {
    var loginInfo = $$("login-detailsform").getValues();

    if (loginInfo.username == undefined || loginInfo.username == "") {
        $$("loginmessage").setValue("Email missing for sending a new password");
        return;
    }

    // verify email 
    var url = '/Users/checkEmail?email=' + loginInfo.username;

    const promiseModule = fetch(url)
        .then(resp => {
            if (!resp.ok) {
                $$("loginmessage").setValue("an error occurred while creating user");
                return null;
            }
            return resp.json();
        })
        .catch((e) => {
            $$("loginmessage").setValue(e)
            return null;
        }); // ***

    Promise.resolve(promiseModule)
        .then(function (user) {
            if (user.status == 'error') {
                $$("loginmessage").setValue(user.message);
                return;
            }
            // ein neues Password generieren
            if (user != undefined) {
                closeWindow();

                user.password = Math.random().toString(36).slice(-8);
                var mail = {
                    email_an: user.email, email_subject: "Auto-Moto-Club Swissair : Login für Internes", email_body:
                        "<p>Hallo " + user.name + "</p>" +
                        "<p>Hier ist dein neues Passwort. " + user.password + "</p>" +
                        "<p>Bitte ändere es bei nächster Gelegenheit!</p>",
                    email_signature: "JanineFranken"
                };
                // update password in database
                url = "/Users/updateProfile";

                const promiseModuleU = fetch(url, {
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
                            webix.message("Fehler beim ändern des Passwords auf der Datanbank", "error", -1)
                            return null;
                        }
                        return resp.json();
                    })
                    .catch((e) => webix.message(e, "error", -1));  // ***

                Promise.resolve(promiseModuleU)
                    .then(function (resp) {
                        if (resp.status == 'error') {
                            webix.message(resp.error, "error", -1)
                            return null;
                        }
                    })
                    .catch((e) => {
                        webix.message(e, "error", -1)
                        return null;
                    });  // ***;          

                // Mail senden
                url = "/Adressen/email/";

                const promiseModuleM = fetch(url, {
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
                    body: JSON.stringify(mail) // body data type must match "Content-Type" header
                })
                    .then((response) => {
                        if (!response.ok) {                                  // ***
                            webix.message({ type: "error", text: "HTTP error " + response.status });  // ***
                            return null;
                        }
                        return response.json();
                    })
                    .catch((e) => {
                        webix.message("Mail konnte nicht erfolgreich gesendet werden: " + e, "error", -1);
                        return null;
                    });
                Promise.resolve(promiseModuleM)
                    .then((response) => {
                        webix.message("Email wurde gesendet.", "info");
                    })
                    .catch((e) => {
                        webix.message(`Fehler beim Senden der Nachricht: ${e}`, "error", -1)
                        return null;
                    });
            }
        })
        .catch((e) => $$("loginmessage").setValue(e)); // ***;

}
