import * as path from 'path';
import * as url from 'url';
import * as connect from 'connect';
import * as serveStatic from 'serve-static';
import { Util } from "./util";
import { Config } from "./config";

class WebServer {

   protocol: string;
   host: string;
   port: number;
   url: string;
   index: string;
   site: any;
   _server: any;
   isRestarting: boolean;
   restartPending: boolean;

	constructor(host, port) {
		Util.statusMsg('Setting up web server.');

		let protocol = (port === 443) ? 'https' : 'http';
		this.protocol = protocol;
		this.host = host;
		this.port = port;
		this.url = protocol + '://' + host + (protocol === 'http' && port !== 80 ? ':' + port : '') + '/';

		this.index = path.resolve(__dirname, './public');
		this.site = connect();
		this.site.use(serveStatic(this.index));
		this._server = null;

		this.isRestarting = false;
		this.restartPending = false;

		Util.statusMsg('Web server started successfully.');
	}

	// Returns either the HTTP or the HTTPS module depending on whether or not
	// the server is hosted using SSL.
	get nativeProtocolModule() {
		return require(this.protocol);
	}

	// Bootstraps the HTTP/HTTPS server.
	init() {
		// Add the middleware for redirecting any unknown requests to a 404
		// error page here, so it can always be the last one added.
		this.site.use((req, res) => {
			let {path} = url.parse(req.url);
			let buffer = '<h1>404 Not Found</h1>';
			if (path.endsWith('/data')) {
				let room = path.substr(6);
				buffer += '<p>Data for the room "' + room + '" could not be found.</p>';
			} else if (path.endsWith('/quotes')) {
				let room = path.substr(8);
				buffer += '<p>Quotes for the room "' + room + '" could not be found.</p>';
			}
			res.end(buffer);
		});

		this._server = this.nativeProtocolModule.createServer(this.site);
		this._server.listen(this.port);
	}

	// Configures the routing for the given path using the given function,
	// which dynamically generates the HTML to display on that path.
	addRoute(path, resolver) {
		this.site.use(path, resolver);
	}

	// Adds other sorts of middleware to the router.
	addMiddleware(middleware) {
		this.site.use(middleware);
	}

	// Restarts the server.
	restart() {
		if (this.isRestarting) {
			this.restartPending = true;
			return false;
		}
		if (!this._server) return false;

		this.isRestarting = true;
		this._server.close(() => {
			this.init();
			this.isRestarting = false;
			if (this.restartPending) {
				this.restartPending = false;
				this.restart();
			}
		});
	}
}

module.exports = new WebServer(Config.serverhost, Config.serverport);
