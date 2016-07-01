import { Config } from "./config";
import { Main } from "./main";

export module Util {

      // TODO: abstract logging away from the global namespace.
      var stdout: string = "";

      export var output = string => {
            stdout += string + '\n';
            console.log(string);
      };

      export var toId = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');

      export var sanitize = text => ('' + text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\//g, '&#x2f;');

      const timeElem = string => (string < 10 ? '0' : '') + string;

      export var consoleMsg = msg => {
            let time = new Date();
            output('[' + timeElem(time.getHours()) + ':' + timeElem(time.getMinutes()) + '] ' + msg);
      };

      // Maybe also something more elaborate for this one
      export var logMsg = msg => {
            let time = new Date();
            output('[' + timeElem(time.getDate()) + '/' + timeElem(time.getMonth() + 1) + ' ' + timeElem(time.getHours()) + ':' + timeElem(time.getMinutes()) + '] ' + msg);
      };

      // For now these are pretty basic, but this might get fancier if/when I implement colors and other markup.

      export var statusMsg = msg => output('[STATUS] ' + msg);

      export var errorMsg = msg => output('[ERROR] ' + msg);

      export var pmMsg = msg => consoleMsg(msg);

      export var forceQuit = msg => {
            output('[FATAL] ' + msg);

            let time = new Date();
            output('Bot forcequit ' + timeElem(time.getHours()) + ':' + timeElem(time.getMinutes()) + '.');
            process.exit(0);
      };

      export var canUse = function (userstr: string, permission) {
            if (Config.admins.indexOf(toId(userstr)) > 0) return true;
            switch (userstr[0]) {
                  case '~':
                        return (permission < 7);
                  case '#':
                  case '&':
                        return (permission < 6);
                  case '@':
                        return (permission < 5);
                  case '%':
                        return (permission < 4);
                  case '+':
                        return (permission < 2);
                  default:
                        return !permission;
            }
      };

      let ipQueue: any = []

      export function checkIp(userid, resolver) {
            Main.Connection.send('|/ip ' + userid);
            ipQueue.push({ query: userid, resolver: resolver });
      }

      export function sendPM(userstr: string, message: string) {
            Main.Connection.send('|/w ' + userstr + ', ' + message);
      }
}