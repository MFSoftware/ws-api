"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validator = _interopRequireDefault(require("validator"));

var _v = _interopRequireDefault(require("uuid/v1"));

var _ajv = _interopRequireDefault(require("ajv"));

var _ws = _interopRequireDefault(require("ws"));

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
      let ip = req.connection.remoteAddress;
      let uuid = (0, _v.default)();
      let id = this.clients.length;
      if (this.onConnection) this.onConnection({
        ip,
        uuid,
        ws
      });
      ws.on('message', data => {
        if (!_validator.default.isJSON(data)) {
          ws.close();
          this.clients[id] = undefined;
          return;
        }

        for (let i = 0; i < this._list.length; i++) {
          let eventObj = this._list[i];
          data = JSON.parse(data);

          if (ajv.validate(eventObj.schema, data)) {
            let type = data.messageType;
            data.messageType = undefined;
            this.executeEvent(type, data);
            break;
          }
        }
      });
      ws.on('close', () => delete clients[id]);
      if (this.onPostConnection) this.onPostConnection();
      this.clients.push({
        uuid,
        ip,
        ws
      });
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
      cbObject.schema['items'] = {};
      cbObject.schema['items'] = opts.schema;
      cbObject.schema['items']['messageType'] = 'string';
      cbObject.schema['required'] = ['messageType'];
      if (opts.required) for (let i = 0; i < opts.required.length; i++) cbObject.schema['required'].push(opts.required[i]);
    }

    console.log(cbObject);

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
    console.log(searched);
    if (searched.middleware) for (let i = 0; i < searched.middleware.length; i++) searched.middleware[i]();
    searched.callback(context);
  }

}

exports.default = WebSocketAPI;