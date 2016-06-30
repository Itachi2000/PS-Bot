import { IChatPlugin } from "../models/ichatplugin";
import { IAnalyzer } from "../models/ianalyzer.ts";
import { RoomDAO } from "../models/roomdao";
import { Util } from "../util";
import { Config } from "../config";
import { Main } from "../main";

let punishments = {};
let mutes = {};
let muteTimers = {};

let buffers = {};
let timers = {};

let analyzedRooms: string[] = [];

class ModerationPlugin implements IChatPlugin {

	fillAnalyzedRooms() {
		RoomDAO.getAllModeratedRooms().then((rooms: string[]) => {
			analyzedRooms = rooms;
		});
	}

	Commands: any = {
		moderation: (userstr: string, message: string, room: string) => {
			return new Promise((resolve, reject) => {
				if (!room) return { pmreply: "This command can't be used in PMs." };
				if (!Util.canUse(userstr, 5)) return { pmreply: "Permission denied." };

				message = Util.toId(message);
				switch (message) {
					case 'on':
					case 'true':
					case 'yes':
					case 'enable':
						RoomDAO.setRoomModeration(Util.toId(room), 1).then((result) => {
							this.fillAnalyzedRooms();
						});
						resolve({ reply: "Bot moderation was turned on in this room." });
						break;
					case 'off':
					case 'false':
					case 'no':
					case 'disable':
						RoomDAO.setRoomModeration(Util.toId(room), 0).then((result) => {
							this.fillAnalyzedRooms();
						});
						resolve({ reply: "Bot moderation was turned off in this room." });
						break;
					default:
						resolve({ pmreply: "Invalid value. Use 'on' or 'off'." });
				}
			});
		}
	}

	Analyzer: IAnalyzer = {
		type: 'chat',
		getAnalyzedRooms() { return analyzedRooms },
		parse(room: string, userstr: string, message: string) {
			if (Util.canUse(userstr, 2)) return false;

			let userid = Util.toId(userstr);

			addBuffer(userid, room, message);

			let msgs = 0;
			let identical = 0;

			for (let i = 0; i < buffers[room].length; i++) {
				if (buffers[room][i][0] === userid) {
					msgs++;
					if (buffers[room][i][1] === message) identical++;
				}
			}

			if (msgs >= 5 || identical >= 3) {
				if (Config.checkIps) {
					Util.checkIp(userid, (userid, ips) => {
						punish(userid, ips, room, 2, 'Bot moderation: flooding');
					});
				} else {
					punish(userid, [userid], room, 2, 'Bot moderation: flooding');
				}
				return;
			}

			// Moderation for caps and stretching copied from boTTT.
			let capsString = message.replace(/[^A-Za-z]/g, '').match(/[A-Z]/g);
			let len = Util.toId(message).length;

			if (len >= 8 && capsString && (capsString.length / len) >= 0.8) {
				if (Config.checkIps) {
					Util.checkIp(userid, (userid, ips) => {
						punish(userid, ips, room, 1, 'Bot moderation: caps');
					});
				} else {
					punish(userid, [userid], room, 1, 'Bot moderation: caps');
				}
				return;
			}

			if (/(.)\1{7,}/gi.test(message) || /(..+)\1{4,}/gi.test(message)) {
				if (Config.checkIps) {
					Util.checkIp(userid, (userid, ips) => {
						punish(userid, ips, room, 1, 'Bot moderation: stretching');
					});
				} else {
					punish(userid, [userid], room, 1, 'Bot moderation: stretching');
				}
				return;
			}
		}
	}
}

function getPunishment(val) {
	switch (val) {
		case 1:
		case 2:
			return 'warn';
		case 3:
		case 4:
			return 'mute';
		case 5:
			return 'hourmute';
		default:
			return 'roomban';
	}
}

function punish(userid, ips, room, val, msg) {
	if (!punishments[room]) punishments[room] = {};
	if (!ips) ips = [userid];
	let max = 0;

	for (let i = 0; i < ips.length; i++) {
		max = val;
		if (ips[i] in punishments[room]) {
			punishments[room][ips[i]] += val;
			if (punishments[room][ips[i]] > max) max = punishments[room][ips[i]];
		} else {
			punishments[room][ips[i]] = val;
		}
		setTimeout(() => {
			punishments[room][ips[i]] -= val;
			if (!punishments[room][ips[i]]) delete punishments[room][ips[i]];
		}, 1000 * 60 * 15);
	}

	Main.Connection.send(room + '|/' + getPunishment(max) + ' ' + userid + ',' + msg);

	if (max >= 3 && Config.checkIps) {
		if (!mutes[userid]) mutes[userid] = [];
		if (!muteTimers[userid]) muteTimers[userid] = {};
		if (mutes[userid].includes(room)) {
			clearTimeout(muteTimers[userid][room]);
		} else {
			mutes[userid].push(room);
		}
		if (mutes[userid].length >= 3) {
			Main.Connection.send('staff|/l ' + userid + ', Bot moderation: Breaking chat rules in multiple rooms.');
			Main.Connection.send('staff|/modnote ' + userid + ' was locked for breaking chat rules in the following rooms: ' + mutes[userid].join(', '));
			delete mutes[userid];
			for (let j in muteTimers[userid]) {
				clearTimeout(muteTimers[userid][j]);
			}
			delete muteTimers[userid];
		} else {
			muteTimers[userid][room] = setTimeout(() => {
				delete muteTimers[userid][room];
				mutes[userid].splice(mutes[userid].indexOf(room), 1);
				if (!mutes[userid].length) delete mutes[userid];
			}, 1000 * 60 * 15);
		}
	}
}

function addBuffer(userid, room, message) {
	if (!buffers[room]) buffers[room] = [];
	buffers[room].push([userid, message]);
	if (buffers[room].length > 7) buffers[room].splice(0, 1);
	if (timers[room]) clearTimeout(timers[room]);
	timers[room] = setTimeout(() => buffers[room] = [], 1000 * 3);

}

module.exports = new ModerationPlugin();

