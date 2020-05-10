const fs = require('fs');

module.exports = {
    addMitgliedPage: (req, res) => {
        res.render('add-mitglied.ejs', {
            title: "Willkommen auf der AMC-Administration | Mitglied hinzufügen"
            ,message: ''
        });
    },
    addMitglied: (req, res) => {
        /*if (!req.files) {
            return res.status(400).send("No files were uploaded.");
        }*/

        let message = '';
        let vorname = req.body.vorname;
        let name = req.body.name;
        let anrede = req.body.anrede;
        let mnr_sam = req.body.mnr_sam;
        
        let usernameQuery = "SELECT * FROM `adressen` WHERE name = '" + name + "' and vorname = '" + vorname + "'";

        db.query(usernameQuery, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                message = 'Diese Person existiert bereits';
                res.render('add-mitglied.ejs', {
                    message,
                    title: "Willkommen auf der AMC-Administration  | Mitglied hinzufügen"
                });
            } else {
                // send the mitglied's details to the database
                let query = "INSERT INTO `adressen` (vorname, name, anrede, mnr_sam) VALUES ('" +
                    vorname + "', '" + name + "', '" + anrede + "', '" + mnr_sam + "')";
                db.query(query, (err, result) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    res.redirect('/');
                });
            }
        });
    },
    editMitgliedPage: (req, res) => {
        let mitgliedId = req.params.mnr;
        console.log(mitgliedId);
        console.log(req.params);
        let query = "SELECT * FROM `adressen` WHERE MNR = '" + mitgliedId + "' ";
        db.query(query, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.render('edit-mitglied.ejs', {
                title: "Mitglied ändern"
                ,mitglied: result[0]
                ,message: ''
            });
        });
    },
    editMitglied: (req, res) => {
        let mitgliedId = req.params.mnr;
        let vorname = req.body.vorname;
        let name = req.body.name;
        let mnr_sam = req.body.mnr_sam;

        let query = "UPDATE `adressen` SET `vorname` = '" + vorname + "', `name` = '" + name + "', `mnr_sam` = '" + mnr_sam + "' WHERE `adressen`.`MNR` = " + mitgliedId;
        db.query(query, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.redirect('/');
        });
    },
    deleteMitglied: (req, res) => {
        let mitgliedId = req.params.mnr;
        let deleteUserQuery = 'UPDATE adressen SET austritt = NOW() WHERE MNR = ' + mitgliedId;

        db.query(deleteUserQuery, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.redirect('/');
        });
    }
};
