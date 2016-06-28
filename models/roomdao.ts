import { Database } from "sqlite3";
import { Statement } from "sqlite3";
import { Util } from "../util";


export module RoomDAO {
  let database: Database = new Database('./data/rooms.db');
  database.run("CREATE TABLE if not exists rooms (room_id TEXT, auto_rank TEXT, moderate INTEGER, auto_join INTEGER)");

  export function getRoomModerationStatus(roomid: string, callback: any) {
    database.all("SELECT moderate FROM rooms WHERE room_id=$roomid", { $roomid: roomid }, (err, rows) => {
      if (err) return Util.errorMsg(err);
      return callback(((rows[0] && rows[0].moderate) ? rows[0].moderate : 0));
    });
  }

  export function getAllModeratedRooms(callback: any) {
    database.all("SELECT room_id FROM rooms WHERE moderate=$moderate", { $moderate: 1 }, (err, rows) => {
      if (err) return Util.errorMsg(err);
      return callback(rows.map(r => r.room_id));
    });
  }

  export function setRoomModeration(roomid: string, status: number, callback?: any) {
    roomid = Util.toId(roomid);
    database.all("SELECT * FROM rooms WHERE room_id=$roomid", { $roomid: roomid }, (err, rows) => {
      if (rows.length < 1) {
        database.run("INSERT INTO rooms(room_id, moderate) VALUES ($roomid, $status)", { $roomid: roomid, $status: status }, (err) => {
          if (err) return Util.errorMsg(err);
          if (callback) return callback();
        });
      } else {
        database.run("UPDATE rooms SET moderate=$status WHERE room_id=$roomid", { $status: status, $roomid: roomid }, (err) => {
          if (err) return Util.errorMsg(err);
          if (callback) return callback();
        });
      }
    });
  }

  export function getAllAutoJoinedRooms(callback: any) {
    database.all("SELECT room_id FROM rooms WHERE auto_join=$autojoin", { $autojoin: 1 }, (err, rows) => {
      if (err) return Util.errorMsg(err);
      return callback(rows.map(r => r.room_id));
    });
  }

  export function setRoomAutoJoin(roomid: string, status: number, callback?: any) {
    roomid = Util.toId(roomid);
    database.all("SELECT * FROM rooms WHERE room_id=$roomid", { $roomid: roomid }, (err, rows) => {
      if (rows.length < 1) {
        database.run("INSERT INTO rooms(room_id, auto_join) VALUES ($roomid, $status)", { $roomid: roomid, $status: status }, (err) => {
          if (err) return Util.errorMsg(err);
          if (callback) return callback();
        });
      } else {
        database.run("UPDATE rooms SET auto_join=$status WHERE room_id=$roomid", { $status: status, $roomid: roomid }, (err) => {
          if (err) return Util.errorMsg(err);
          if (callback) return callback();
        });
      }
    });
  }
}
