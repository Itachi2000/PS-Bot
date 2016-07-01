export module Config {

    // Host and port to use for the http server part
    export var serverhost: string = 'localhost';
    export var serverport: number = 8000;

    //Pokemon showdown server connection information
    export var host: string = "sim.smogon.com";
    export var port: number = 8000;

    // Username and password to use on PS.
    export var username: string = "";
    export var password: string = "";

    // Rooms to join and avatar to choose. The maximum amount of rooms Kid A can join upon connecting is 11.
    // The reason for these restrictions is the way PS protocol works. I might try to get around it at a later date, but this is it for now.
    export var rooms: string[] = ['lobby'];
    export var avatar: number = 184;

    // Symbol to use for commands.
    export var commandSymbol: string = ".";

    // Names of  the administrators of the bot.
    export var admins: string[] = [];

    // Whether the bot can (and should) check IPs instead of usernames for room moderation.
    export var checkIps: boolean = false;

    // Last.fm API key, used for the lastfm feature.
    export var lastfmKey: string = '';

    // youtube API key, used for the lastfm feature.
    export var youtubekey: string = '';

}