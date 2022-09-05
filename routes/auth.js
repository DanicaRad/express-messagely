express = require("express");
const router = new express.Router();
const jwt = require("jsonwebtoken");
const { SECRET_KEY, DB_URI } = require("../config");
const User = require("../models/user");
const {ensureLoggedIn, authenticateJWT} = require("../middleware/auth");
const ExpressError = require("../expressError");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

 router.post("/login", async function(req, res, next) {
    try {
        const { username, password } = req.body;
        if(await User.authenticate(username, password)) {
            User.updateLoginTimestamp(username);
            const token = jwt.sign({ username }, SECRET_KEY);
            return res.json({ token });
        }
        throw new ExpressError("Invalid username/password", 400);
    } catch(e) {
        return next(e);
    }
 });


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function(req, res, next) {
    try {
        if(!req.body.username || !req.body.password || !req.body.first_name || !req.body.last_name || ! req.body.phone) {
            next(new ExpressError("Must provide username, password, first and last name and phone number to register.", 400));
        }
        const user = await User.register(req.body);
        if(user) {
            let username = user.username;
            let token = jwt.sign({username}, SECRET_KEY);
            return res.json({ token });
        }
        next(new ExpressError("Could not register user", 500));

    } catch(e) {
        return next(e);
    }
});

module.exports = router;