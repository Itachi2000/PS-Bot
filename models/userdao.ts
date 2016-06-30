import { Database } from "sqlite3";
import { Statement } from "sqlite3";
import { Util } from "../util";

export module UserDAO {
   let database: Database = new Database('./data/users.db');
   database.run("CREATE TABLE if not exists users (user_id TEXT, bot_rank TEXT, lastfm_name TEXT)");

   export function getLastfmName(userid: string) {
      return new Promise((resolve, reject) => {
         database.all("SELECT lastfm-name FROM users WHERE user_id=$userid", { $userid: userid }, (err, rows) => {
            if (err) reject(Util.errorMsg(err));
            resolve(((rows[0] && rows[0].lastfm_name) ? rows[0].lastfm_name : ""));
         });
      });
   }

   export function getAllLastfmNames() {
      return new Promise((resolve, reject) => {
         database.all("SELECT user_id, lastfm_name FROM users WHERE lastfm_name IS NOT NULL", (err, rows) => {
            if (err) reject(Util.errorMsg(err));
            resolve(rows);
         });
      });
   }

   export function setLastfmName(userid: string, lastfmName: string) {
      return new Promise((resolve, reject) => {
         userid = Util.toId(userid);
         database.all("SELECT * FROM users WHERE user_id=$userid", { $userid: userid }, (err, rows) => {
            if (rows.length < 1) {
               database.run("INSERT INTO users(user_id, lastfm_name) VALUES ($userid, $lastfm)", { $userid: userid, $lastfm: lastfmName }, (err) => {
                  if (err) reject(Util.errorMsg(err));
                  resolve(rows);
               });
            } else {
               database.run("UPDATE users SET lastfm_name=$lastfm WHERE user_id=$userid", { $lastfm: lastfmName, $userid: userid }, (err) => {
                  if (err) reject(Util.errorMsg(err));
                  resolve(rows);
               });
            }
         });
      });
   }
}