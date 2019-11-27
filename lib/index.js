"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validator = _interopRequireDefault(require("validator"));

var _ajv = _interopRequireDefault(require("ajv"));

var _ws = _interopRequireDefault(require("ws"));

var _Client = _interopRequireDefault(require("./core/classes/Client"));

var _Context = _interopRequireDefault(require("./core/classes/Context"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ajv = new _ajv.default();

class WebSocketAPI {
  constructor(opts = {}) {
    // Websocket server
    this.wss = new _ws.default.Server(opts); // Array of connected users

    this.clients = []; // List of event handlers

    this._list = []; // API events

    this.onConnection = 0;
    this.onPostConnection = 0;
    this.wss.on('connection', (ws, req) => {
      let client = new _Client.default();
      client.ws = ws;
      client.ip = req.connection.remoteAddress;
      let id = this.clients.length;
      if (this.onConnection) this.onConnection(client);
      ws.on('message', data => {
        if (!_validator.default.isJSON(data)) {
          ws.close();
          delete this.clients[id];
          return;
        }

        for (let i = 0; i < this._list.length; i++) {
          let eventObj = this._list[i];
          data = JSON.parse(data);

          if (ajv.validate(eventObj.schema, data)) {
            let type = data.type;
            delete data.type;
            this.executeEvent(type, new _Context.default(data));
            break;
          }
        }
      });
      ws.on('close', () => delete clients[id]);
      if (this.onPostConnection) this.onPostConnection();
      this.clients.push(client);
    });

    this.sendAll = message => {
      for (let i = 0; i < this.clients.length; i++) this.clients[i]['ws'].send(message);
    };
  }

  on(event, opts, ...callbacks) {
    let cbObject = {
      name: event
    };

    if (opts.schema) {
      cbObject.schema = {};
      cbObject.schema['type'] = 'object';
      cbObject.schema['propertys'] = {};
      cbObject.schema['propertys'] = opts.schema;
      cbObject.schema['propertys']['type'] = 'string';
      cbObject.schema['required'] = ['type'];
      if (opts.required) for (let i = 0; i < opts.required.length; i++) cbObject.schema['required'].push(opts.required[i]);
    }

    if (callbacks.length > 2) {
      cbObject.callback = callbacks[callbacks.length - 1];
      cbObject.middleware = callbacks.splice(0, callbacks.length - 2);
    } else if (callbacks.length == 2) {
      cbObject.callback = callbacks[1];
      cbObject.middleware = [callbacks[0]];
    } else if (callbacks.length == 1) cbObject.callback = callbacks[0];else throw new Error('Callback must be defined');

    this._list.push(cbObject);
  }

  async executeEvent(name, context) {
    let searched = this._list.find(element => element.name === name);

    if (searched == null) return;
    if (searched.middleware) for (let i = 0; i < searched.middleware.length; i++) searched.middleware[i]();
    searched.callback(context);
  }

}

exports.default = WebSocketAPI;