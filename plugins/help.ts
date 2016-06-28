import { Util } from "../util";
import { IChatPlugin } from "../models/ichatplugin";

const webserver = require('../webserver.ts');

const helpTopics = {
   commands: 'commands.html'
};

class HelpPlugin implements IChatPlugin {

   Commands: any = {
      help: (userstr: string, message: string, room: string, callback: any): any => {
         if (!Util.canUse(userstr, 1)) return callback({ pmreply: "Permission denied." });
         if (!message) return callback({ reply: "Available help topics: " + Object.keys(helpTopics).join(', ') });

         message = Util.toId(message);
         if (!(message in helpTopics)) return callback({ pmreply: "Invalid option for topic." });
         return callback({ reply: webserver.url + helpTopics[message] });
      }
   }
}

module.exports = new HelpPlugin();