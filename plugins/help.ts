import { Util } from "../util";
import { IChatPlugin } from "../models/ichatplugin";

const webserver = require('../web-server.ts');

const helpTopics = {
   commands: 'commands.html'
};

class HelpPlugin implements IChatPlugin {

   Commands: any = {
      help: (userstr: string, message: string, room: string) => {
         return new Promise((resolve, reject) => {
            if (!Util.canUse(userstr, 1)) resolve({ pmreply: "Permission denied." });
            if (!message) resolve({ reply: "Available help topics: " + Object.keys(helpTopics).join(', ') });

            message = Util.toId(message);
            if (!(message in helpTopics)) resolve({ pmreply: "Invalid option for topic." });
            resolve({ reply: webserver.url + helpTopics[message] });
         });
      }
   }
}

module.exports = new HelpPlugin();