///<reference path="./typings/index.d.ts"/>
///<reference path="./typings/node.d.ts"/>
import { Config } from "./config";
import { Main } from "./main";
import { Util } from "./util";
import { IChatPlugin } from "./models/ichatplugin";
import { IAnalyzer } from "./models/ianalyzer.ts";
import { RoomDAO } from "./models/roomdao";

const fs = require("fs");
const request = require('request');

const ACTION_URL = 'http://play.pokemonshowdown.com/action.php';

export module Handler {
    let plugins: IChatPlugin = {};
    let analyzers: any = {};  //must change to IAnalyzer
    let commands: any = {};

    fs.readdirSync('./plugins')
        .filter((file) => file.endsWith('.ts'))
        .forEach((file) => {
            let plugin = require('./plugins/' + file);
            let name = file.slice(0, -3);
            plugins[name] = plugin;
            if (plugin.Analyzer) {
                analyzers[name] = plugin.Analyzer;
                plugin.fillAnalyzedRooms();
            }
            if (plugin.Commands) {
                Object.keys(plugin.Commands).forEach((c) => {
                    commands[c] = plugin.Commands[c];
                });
            }
        });

    function analyze(room: string, userstr: string, message?: string) {
        for (let i in analyzers) {
            let analyzer = analyzers[i];
            if (analyzer.getAnalyzedRooms().includes(room)) {
                if (analyzer.type === 'chat' && message) analyzer.parse(room, userstr, message);
                else if (analyzer.type === 'join' && !message) analyzer.parse(room, userstr);
            }
        }
    }

    function parseCommand(userstr: string, message: string, room?: string) {
        let username = userstr.substr(1);

        let words = message.split(' ');
        let cmd = words.splice(0, 1)[0].substr(1);
        if (!(cmd in commands)) {
            if (room) return;
            return Util.sendPM(username, 'Invalid command.');
        }

        let user = (!room && userstr[0] === ' ' ? '+' : userstr[0]) + username;
        commands[cmd](user, words.join(' '), room).then((action) => {
            if (!action) return;
            if (action.then) {
                action.then(val => parseAction(username, val, room));
            } else {
                parseAction(username, action, room);
            }
        });
    }

    function parseAction(userstr: string, action: any, room?: string) {
        if (!action) return;
        if (action.pmreply) {
            Util.sendPM(userstr, action.pmreply);
        }
        if (action.reply) {
            if (room) {
                Main.Connection.send(room + '|' + action.reply.replace(/trigger/g, 't⁠igger'));
            } else {
                Util.sendPM(userstr, action.reply);
            }
        }
    }

    function setup() {
        return new Promise((resolve, reject) => {
            Main.Connection.send('|/avatar 184');
            RoomDAO.getAllAutoJoinedRooms().then((rooms: string[]) => {
                Config.rooms = Config.rooms.concat(rooms);
                Main.Connection.send('|/autojoin ' + Config.rooms.splice(0, 11).join(','));
                Util.statusMsg('Setup done.')
                resolve();
            });
        });
    }

    export class Parser {
        static parse(message: string) {
            if (!message) return;
            let split = message.split('|');
            if (!split[0]) split[0] = '>lobby\n';

            let roomid;

            switch (split[1]) {
                case 'challstr':
                    Util.statusMsg('Received challstr, logging in...');

                    let challstr = split.slice(2).join('|');

                    request.post(ACTION_URL, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: 'act=login&name=' + Config.username + '&pass=' + Config.password + '&challstr=' + challstr,
                    }, (error, response, body) => {
                        if (!error && response.statusCode === 200) {
                            if (body[0] === ']') {
                                try {
                                    body = JSON.parse(body.substr(1));
                                } catch (e) { }
                                if (body.assertion && body.assertion[0] !== ';') {
                                    Main.Connection.send('|/trn ' + Config.username + ',0,' + body.assertion);
                                } else {
                                    Util.errorMsg('Couldn\'t log in.');
                                }
                            } else {
                                Util.errorMsg('Incorrect request.');
                            }
                        }
                    });
                    break;
                case 'updateuser':
                    if (split[2] !== Config.username) return false;
                    setup().then(() => {
                        Util.statusMsg('Logged in as ' + split[2] + '.');

                        if (Config.rooms.length) {
                            Util.statusMsg('Joining additional rooms.');
                            Config.rooms.map((room) => (
                                new Promise((resolve) => {
                                    Main.Connection.send('|/join ' + room);
                                    setTimeout(resolve, 500);
                                })
                            )).reduce(
                                (thenable, p: any) => thenable.then(p),
                                Promise.resolve()
                                );
                        }
                    });
                    break;

                case 'pm':
                    if (Util.toId(split[2]) === Util.toId(Config.username) || split[2].indexOf('Do not reply') > 0) return false;
                    split[4] = split.splice(4).join('|');
                    if (split[4].startsWith(Config.commandSymbol)) {
                        parseCommand(split[2], split[4]);
                    } else {
                        if (Util.canUse(split[2], 2) && split[4].startsWith('/invite')) {
                            let room = split[4].substr(8);
                            RoomDAO.setRoomAutoJoin(room, 1);
                            return Main.Connection.send('|/join ' + room);
                        }
                        Util.pmMsg('PM from ' + (split[2][0] === ' ' ? split[2].substr(1) : split[2]) + ': ' + split[4]);
                        Main.Connection.send("|/reply Hi I'm a chatbot made by Nii Sama. I moderate rooms, provide chat analytics, and have a few other neat features. For help with using the bot, use ``.help`` for a list of available topics.");
                    }
                    break;
                case 'c':
                    if (Util.toId(split[2]) === Config.username) return;

                    roomid = split[0].slice(1, -1);
                    split[3] = split.splice(3).join('|');
                    if (split[3].startsWith(Config.commandSymbol)) {
                        parseCommand(split[2], split[3], roomid);
                    }
                    analyze(roomid, split[2], split[3]);
                    break;
                case 'c:':
                    if (Util.toId(split[3]) === Config.username) return;

                    roomid = split[0].slice(1, -1);
                    split[4] = split.splice(4).join('|');
                    if (split[4].startsWith(Config.commandSymbol)) {
                        parseCommand(split[3], split[4], roomid);
                    }
                    analyze(roomid, split[3], split[4]);
                    break;
                case 'J':
                    roomid = split[0].slice(1, -1);
                    analyze(roomid, split[2]);
                    break;
                case 'raw':
                    //Raw logic here
                    break;
            }
        }
    }
}