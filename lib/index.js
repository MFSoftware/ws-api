"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validator = _interopRequireDefault(require("validator"));

var _v = _interopRequireDefault(require("uuid/v1"));

var _joi = _interopRequireDefault(require("@hapi/joi"));

var _ws = _interopRequireDefault(require("ws"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class WebSocketAPI {
  constructor(opts = {}) {
    // Websocket server
    this.wss = new _ws.default.Server(opts); // Array of connected users

    this.clients = []; // List of event handlers

    this._list = []; // API events

    this._connectionHandlers = [];
    this._postConnectionHandlers = [];
    this.wss.on('connection', (ws, req) => {
      let ip = req.connection.remoteAddress;
      let uuid = (0, _v.default)();
      let id = this.clients.length;

      for (let i = 0; i < this._connectionHandlers.length; i++) this._connectionHandlers[i]({
        ip,
        uuid,
        ws
      });

      ws.on('message', data => {
        if (!_validator.default.isJSON(data)) {
          ws.close();
          delete this.clients[id];
          return;
        }

        for (let i = 0; i < this._list.length; i++) {
          let eventObj = this._list[i];
          if (eventObj.schema['type'] == undefined) eventObj.schema['type'] = _joi.default.string().required();

          if (_joi.default.object(eventObj.schema).validate(JSON.parse(data)).error == null) {
            data = JSON.parse(data);
            let type = data.type;
            delete data.type;
            this.executeEvent(type, data);
            break;
          }
        }
      });
      ws.on('close', () => delete clients[id]);

      for (let i = 0; i < this._postConnectionHandlers.length; i++) this._postConnectionHandlers[i]();

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

  on(event, schema = {
    type: _joi.default.string()
  }, callback) {
    switch (event) {
      case 'postConnection':
        this._postConnectionHandlers.push(callback);

        break;

      case 'connection':
        this._connectionHandlers.push(callback);

        break;

      default:
        this._list.push({
          name: event,
          callback,
          schema
        });

        break;
    }
  }

  async executeEvent(name, data) {
    let searched = this._list.find(element => element.name === name);

    if (searched == null) return;
    searched.callback(data);
  }

}

exports.default = WebSocketAPI;