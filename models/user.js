/** User class for message.ly */

const express = require("express");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR, DB_URI, SECRET_KEY } = require("../config");
const db = require("../db");

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    try {
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      const result = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
          VALUES ($1, $2, $3, $4, $5, current_timestamp)
          RETURNING username, password, first_name, last_name, phone`,
          [username, hashedPassword, first_name, last_name, phone]);

      return result.rows[0];
    } catch(e) {
      return;
    }
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    try {
      const result = await db.query(
        `SELECT password
          FROM users
          WHERE username = $1`,
          [username]
      );
      const user = result.rows[0];
      if(user) {
        if(await bcrypt.compare(password, user.password) === true) {
          return true;
        }
        return false;
      }
    } catch(e) {
      return e;
    }
  };

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try {
      const result = await db.query(
        `UPDATE users
          SET last_login_at = current_timestamp
          WHERE username = $2`,
          [username]
      );

    } catch(e) {
      return e;
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    try {
      const result = await db.query(
        `SELECT username, first_name, last_name, phone
          FROM users
          ORDER BY last_name, first_name`
      );
      return result.rows;

    } catch(e) {
      return e;
    }
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    try {
      const user = await db.query(
        `SELECT username, first_name, last_name, phone, join_at, last_login_at
          FROM users
          WHERE username = $1`,
          [username]
      );
      return user.rows[0];
    } catch(e) {
      return;
    }
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    try {
      const results = await db.query(
        `SELECT m.id, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone
          FROM messages AS m
            LEFT JOIN users AS u
              ON u.username = m.to_username
          WHERE m.from_username = $1`,
              [username]
      );

      const messages = results.rows.map(m => {
        const to_user = {"username": m.username, "first_name": m.first_name, "last_name": m.last_name, "phone": m.phone}
        const { id, body, sent_at, read_at } = m;
        return {id, body, sent_at, read_at, to_user};
      })
      return messages;
    } catch(e) {
      return;
    }
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    try {
      const results = await db.query(
        `SELECT m.id, m.from_username, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone
          FROM messages AS m
            LEFT JOIN users AS u
              ON u.username = m.from_username
          WHERE m.to_username = $1`,
          [username]
      );
      return results.rows.map(m => {
        const {id, body, sent_at, read_at} = m;
        const from_user = {"username": m.username, "first_name": m.first_name, "last_name": m.last_name, "phone": m.phone};
        return {id, body, sent_at, read_at, from_user};
      })

    } catch(e) {
      return;
    }
  }
}


module.exports = User;