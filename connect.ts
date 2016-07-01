import * as WebSocket  from 'websocket';
import { Handler } from "./handler";
import { Main } from "./main";
import { Config } from "./config";
import { Util } from "./util";

export module Connector {
    const WebSocketClient = WebSocket.client;
    const RETRY_TIME = 10; // Time (in seconds) before the bot retries a failed connection.

      export function connect() {
        const client = new WebSocketClient();

        client.on('connectFailed', error => {
            Util.errorMsg('Connection failed with error: ' + error + '. Retrying in ' + RETRY_TIME + 's.');
            setTimeout(connect, RETRY_TIME * 1000);
        });

        client.on('connect', connection => {
            Main.Connection = connection;
            Util.statusMsg('WebSocket Client Connected');
            connection.on('error', error => {
                Util.errorMsg(error + '. Reconnecting in ' + RETRY_TIME + 's.');
                setTimeout(connect, RETRY_TIME * 1000);
            });
            connection.on('close', () => {
                Util.errorMsg('Closed connection, reconnecting in ' + RETRY_TIME + 's.');
                setTimeout(connect, RETRY_TIME * 1000);
            });
            connection.on('message', message => {
                Handler.Parser.parse(message.utf8Data);
            });
        });

        client.connect('ws://' + Config.host + ':' + Config.port + '/showdown/websocket');
    }
}

 