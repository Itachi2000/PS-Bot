import * as request from 'request';
import { UserDAO } from "../models/userdao";
import { IChatPlugin } from "../models/ichatplugin";
import { IAnalyzer } from "../models/ianalyzer.ts";
import { Util } from "../util";
import { Config } from "../config";

const API_ROOT = 'http://ws.audioscrobbler.com/2.0/';
const YT_ROOT = 'https://www.googleapis.com/youtube/v3/search';
const VIDEO_ROOT = 'https://youtu.be/';

let lastfmData: any = [];

class LastfmPlugin implements IChatPlugin {

   Commands: any = {
      lastfm: (userstr: string, message: string, room: string) => {
         return new Promise((resolve, reject) => {
            if (!Util.canUse(userstr, 1)) return { pmreply: "Permission denied." };

            if (!Config.lastfmKey) return Util.errorMsg("No last.fm API key found.");

            let userid = Util.toId(userstr);
            let accountname = message || userstr.substr(1);
            let userData = lastfmData.find(e => e.user === userid);
            if (!message && (typeof userData !== typeof undefined)) message = userData.lastfm;

            let url = API_ROOT + '?method=user.getrecenttracks&user=' + message + '&limit=1&api_key=' + Config.lastfmKey + '&format=json';
            let req = new Promise(function (resolve, reject) {
               request(url, function (error, response, body) {
                  if (error) {
                     Util.errorMsg(error);
                     reject(error);
                  } else {
                     resolve(JSON.parse(body));
                  }
               });
            });

            return req.then(data => {
               let msg = '';
               if (data["recenttracks"] && data["recenttracks"].track && data["recenttracks"].track.length) {
                  msg += accountname;
                  let track = data["recenttracks"].track[0];
                  if (track['@attr'] && track['@attr'].nowplaying) {
                     msg += " is now listening to: ";
                  } else {
                     msg += " was last seen listening to: ";
                  }
                  let trackname = '';
                  // Should always be the case but just in case.
                  if (track.artist && track.artist['#text']) {
                     trackname += track.artist['#text'] + ' - ';
                  }
                  trackname += track.name;
                  msg += trackname;
                  let yturl = YT_ROOT + '?part=snippet&order=relevance&maxResults=1&q=' + encodeURIComponent(trackname) + '&key=' + Config.youtubekey;
                  let yt = new Promise(function (resolve, reject) {
                     request(yturl, function (error, response, body) {
                        if (error) {
                           Util.errorMsg(error);
                           reject(error);
                        } else {
                           resolve(JSON.parse(body));
                        }
                     });
                  });

                  return yt.then(video => {
                     if (video["error"]) {
                        Util.errorMsg(video["error"].message);
                        msg = 'Something went wrong with the youtube API.';
                     } else if (video["items"] && video["items"].length && video["items"][0].id) {
                        msg += ' ' + VIDEO_ROOT + video["items"][0].id.videoId;
                        msg += ' | Profile link: http://www.last.fm/user/' + message;
                     }
                     resolve({ reply: msg });
                  });
               } else if (data["error"]) {
                  resolve({ reply: msg + data["message"] + '.' });
               } else {
                  resolve({ reply: msg + message + ' doesn\'t seem to have listened to anything recently.' });
               }
            });
         });
      },

      registerlastfm: (userstr: string, message: string, room: string) => {
         return new Promise((resolve, reject) => {
            if (!message) resolve({ pmreply: "No username entered." });

            let userid = Util.toId(userstr);
            let username = message.replace(/[^A-Za-z0-9-_]/g, '');

            lastfmData.push({ user: userid, lastfm: username });
            UserDAO.setLastfmName(userid, username);

            resolve({ pmreply: "You've been registered as " + username + "." });
         });
      }
   }
}

fillLastfmData();

function fillLastfmData() {
   UserDAO.getAllLastfmNames().then((data: any[]) => {
      data.forEach(e => {
         lastfmData.push({ user: e.user_id, lastfm: e.lastfm_name });
      });
   });
}

module.exports = new LastfmPlugin();