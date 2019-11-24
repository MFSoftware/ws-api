import validator from 'validator';
import uuidv1 from 'uuid/v1';

import Joi from '@hapi/joi';
import WebSocket from 'ws';

export default class WebSocketAPI {
    constructor(opts = {}) {
        // Websocket server
        this.wss = new WebSocket.Server(opts);

        // Array of connected users
        this.clients = [];
        // List of event handlers
        this._list = [];

        // API events
        this._connectionHandlers = [];
        this._postConnectionHandlers = [];

        this.wss.on('connection', (ws, req) => {
            let ip = req.connection.remoteAddress;
            let uuid = uuidv1();
            let id = this.clients.length;

            for (let i = 0; i < this._connectionHandlers.length; i++)
                this._connectionHandlers[i]({ ip, uuid, ws });
          
            ws.on('message', data => {
              if (!validator.isJSON(data)) {
                ws.close();
                delete this.clients[id];
                return;
              }
          
              for (let i = 0; i < this._list.length; i++) {
                  let eventObj = this._list[i];

                  if (eventObj.schema['type'] == undefined)
                    eventObj.schema['type'] = Joi.string().required();

                  if (Joi.object(eventObj.schema).validate(JSON.parse(data)).error == null) {
                    data = JSON.parse(data);
                    let type = data.type;
                    delete data.type;
              
                    this.executeEvent(type, data);
                    break;
                  }
              }
            });
          
            ws.on('close', () => delete clients[id]);
          
            for (let i = 0; i < this._postConnectionHandlers.length; i++)
                this._postConnectionHandlers[i]();

            this.clients.push({ uuid, ip, ws });
        });

        this.sendAll = message => {
            for (let i = 0; i < this.clients.length; i++)
                this.clients[i]['ws'].send(message);
        }
    }

    on(event, schema = {
        type: Joi.string()
    }, callback) {
        switch (event) {
            case 'postConnection':
                this._postConnectionHandlers.push(callback);
                break;
            case 'connection':
                this._connectionHandlers.push(callback);
                break;
            default:
                this._list.push({ name: event, callback, schema });
                break;
        }
    }

    async executeEvent(name, data) {
        let searched = this._list.find(element => element.name === name);

        if (searched == null) return;

        searched.callback(data);
    }
}