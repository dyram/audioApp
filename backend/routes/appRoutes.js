module.exports = app => {
    const passwordHash = require("password-hash")
    const jwt = require("jsonwebtoken");

    const key = require("../config/key.json");

    const users = require("../models").Users;

    // const Tournaments = require("../controllers/tournamentController");
    // const Bookings = require("../controllers/bookingController")

    app.get("/", (req, res) => {
        res.send("Working Fine!!");
    });

    app.post("/signup", (req, res) => {
        let data = req.body.password;
        let hash = passwordHash.generate(data);
        users.create({
            email: req.body.email,
            password: hash,
            role: false,
            artist: req.body.available
        });
        res.send("create Success")
    })

    app.post("/login", (req, res) => {
        let data = req.body;
        users
            .findAll({
                attributes: ["id", "email", "password", "role", "artist"],
                where: { email: data.email }
            })
            .then(prom => {
                let val = passwordHash.verify(data.password, prom[0].password);
                let token;
                if (val) {
                    token = {
                        id: jwt.sign(
                            {
                                exp: Date.now() / 1000 + 60 * 60,
                                id: prom[0].id
                            },
                            key.tokenKey
                        ),
                        validity: true,
                        role: prom[0].role,
                        artist: prom[0].artist
                    };
                } else {
                    token = {
                        id: jwt.sign({ id: prom[0].id }, key.tokenKey),
                        validity: false,
                    };
                }
                res.send(token);
            });
    })

    app.post("/tournament", (req, res) => {
        let resp = Tournaments.addTournament(req.body.tName, req.body.tDesc, req.body.available, req.body.seats, req.body.seatCost);
        res.send(resp);
    });

    app.get("/tournament", (req, res) => {
        Tournaments.getTournament().then(resp => {
            res.send(resp);
        });
    })

    app.get("/users", (req, res) => {
        users
            .findAll({
                attributes: ["id", "email", "password", "money"],
                where: { role: false }
            }).then(prom => {
                res.send(prom)
            })
    })

    app.post("/user", (req, res) => {
        let decodedData = jwt.verify(req.body.data, key.tokenKey);
        users
            .findOne({
                attributes: ["id", "money"],
                where: { id: decodedData.id }
            }).then(prom => {
                res.send(prom)
            })
    })

    app.post("/booking", (req, res) => {
        let resp = Bookings.addBookings(req.body.money.id, req.body.id, req.body.money.money, req.body.seatCost, req.body.availSeat);
        res.send(resp);
    })

    app.post("/getBooking", (req, res) => {
        let decodedData = jwt.verify(req.body.data, key.tokenKey);
        Bookings.getBookings(decodedData.id).then(resp => {
            res.send(resp)
        })
    })

    app.post("/getBookedUsers", async (req, res) => {
        let resp = await Bookings.getBookedUsers(req.body.id)
        res.send(resp);
    })


}