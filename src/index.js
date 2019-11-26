import validator from 'validator';
import uuidv1 from 'uuid/v1';

import Ajv from 'ajv';
import WebSocket from 'ws';

const ajv = new Ajv;

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
                this.clients[id] = undefined;
                return;
              }
          
              for (let i = 0; i < this._list.length; i++) {
                    let eventObj = this._list[i];

                    if (eventObj.schema['messageType'] == undefined)
                        eventObj.schema['messageType'] = { type: 'string', required: true };

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
          
            for (let i = 0; i < this._postConnectionHandlers.length; i++)
                this._postConnectionHandlers[i]();

            this.clients.push({ uuid, ip, ws });
        });

        this.sendAll = message => {
            for (let i = 0; i < this.clients.length; i++)
                this.clients[i]['ws'].send(message);
        }
    }

    on(event, schema, callback) {
        switch (event) {
            case 'postConnection':
                this._postConnectionHandlers.push(callback);
                break;
            case 'connection':
                this._connectionHandlers.push(callback);
                break;
            default:
                if (callback) this._list.push({ name: event, callback, schema });
                else throw Error('callback must be defined');
                break;
        }
    }

    async executeEvent(name, context) {
        let searched = this._list.find(element => element.name === name);

        if (searched == null) return;

        searched.callback(context);
    }
}