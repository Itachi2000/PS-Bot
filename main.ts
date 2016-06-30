
import { Connector } from "./connect";

export module Main {

   // Start our webserver
   const server = require('./web-server.ts');
   server.init();

   // Finally, open the connection to the Pokemon Showdown server.
   export var Connection: any = null;
   Connector.connect();

}