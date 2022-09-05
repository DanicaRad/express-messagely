
const express = require("express");
const router = new express.Router();
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");
const Message = require("../models/message");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function(req, res, next) {
    try {
        if(typeof +req.params.id !== "number") {
            return next({status: 400, message: "Message ID must be a number"});
        }
        const message = await Message.get(req.params.id);
        if(message.from_user.username !== req.user.username && message.to_user.username !== req.user.username) {
            return next({status: 401, message: "Unauthorized."});
        }
        return res.json({ message });
    } catch(e) {
        return next(e);
    }
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function(req, res, next) {
    try {
        const {to_username, body} = req.body;
        const message = await Message.create(req.user.username, to_username, body);
        return res.json({ message });
    } catch(e) {
        next(e);
    }
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that only the intended recipient can mark as read.
 *
 **/
router.post("/:id", ensureLoggedIn, async function(req, res, next) {
    try {
        if(typeof +req.params.id !== "number") {
            return next({status: 400, message: "Message ID must be anumber."});
        }
        const message = await Message.get(req.params.id);
        if(message.to_user.username !== req.user.username) {
            return next({status: 401, message: "Unauthorized."});
        }
        
    } catch(e) {
        next(e);
    }
});

module.exports = router;
