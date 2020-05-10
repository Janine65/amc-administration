module.exports = {
    getHomePage: (req, res) => {
        let query = "SELECT * FROM `adressen` where austritt is null ORDER BY name ASC, vorname ASC"; // query database to get all the players

        // execute query
        db.query(query, (err, result) => {
            if (err) {
                res.redirect('/');
            }
            res.render('index.ejs', {
                title: "Auto-Moto-Club Swissair | Mitglieder anzeigen"
                ,mitglieder: result
            });
        });
    },
};