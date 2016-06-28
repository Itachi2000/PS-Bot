import { Database } from "sqlite3";
import { Statement } from "sqlite3";
import { Util } from "../util";

export module UserDAO {
   let database: Database = new Database('./data/users.db');
   database.run("CREATE TABLE if not exists users (user_id TEXT, bot_rank TEXT, lastfm_name TEXT)");

   export function getLastfmName(userid: string, callback: any) {
      database.all("SELECT lastfm-name FROM users WHERE user_id=$userid", { $userid: userid }, (err, rows) => {
         if (err) return Util.errorMsg(err);
         return callback(((rows[0] && rows[0].lastfm_name) ? rows[0].lastfm_name : ""));
      });
   }

   export function getAllLastfmNames(callback: any) {
      database.all("SELECT user_id, lastfm_name FROM users WHERE lastfm_name IS NOT NULL", (err, rows) => {
         if (err) return Util.errorMsg(err);
         return callback(rows);
      });
   }

   export function setLastfmName(userid: string, lastfmName: string, callback?: any) {
      userid = Util.toId(userid);
      database.all("SELECT * FROM users WHERE user_id=$userid", { $userid: userid }, (err, rows) => {
         if (rows.length < 1) {
            database.run("INSERT INTO users(user_id, lastfm_name) VALUES ($userid, $lastfm)", { $userid: userid, $lastfm: lastfmName }, (err) => {
               if (err) return Util.errorMsg(err);
               if (callback) return callback();
            });
         } else {
            database.run("UPDATE users SET lastfm_name=$lastfm WHERE user_id=$userid", { $lastfm: lastfmName, $userid: userid }, (err) => {
               if (err) return Util.errorMsg(err);
               if (callback) return callback();
            });
         }
      });
   }
}