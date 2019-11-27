import validator from 'validator';

import Ajv from 'ajv';
import WebSocket from 'ws';

import Client from './core/classes/Client';
import Context from './core/classes/Context';

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
        this.onConnection = 0;
        this.onPostConnection = 0;
        this.onDisconnect = 0;

        this.wss.on('connection', (ws, req) => {
            let client = new Client;
            client.ws = ws;
            client.ip = req.connection.remoteAddress;

            let id = this.clients.length;

            if (this.onConnection) this.onConnection(client);
          
            ws.on('message', data => {
                if (!validator.isJSON(data)) {
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
                
                        this.executeEvent(type, new Context(data));
                        break;
                    }
              }
            });
          
            ws.on('close', () => {
                delete this.clients[id];

                if (this.onDisconnect) this.onDisconnect();
            });
          
            if (this.onPostConnection) this.onPostConnection();

            this.clients.push(client);
        });

        /**
         * Send message to all connected users
         * @param {object} message 
         */
        this.sendAll = message => {
            let msg = message;

            if (message instanceof Object) msg = JSON.parse(msg);

            for (let i = 0; i < this.clients.length; i++)
                this.clients[i]['ws'].send(msg);
        }
    }

    on(event, opts, ...callbacks) {
        let cbObject = { name: event };

        cbObject.schema = {};
        cbObject.schema['type'] = 'object';

        cbObject.schema['propertys'] = {};
        
        if (opts.schema) cbObject.schema['propertys'] = opts.schema;

        cbObject.schema['propertys']['type'] = 'string';

        cbObject.schema['required'] = [ 'type' ];

        if (opts.schema)
            if (opts.required)
                for (let i = 0; i < opts.required.length; i++)
                    cbObject.schema['required'].push(opts.required[i]);

        if (callbacks.length > 2) {
            cbObject.callback = callbacks[callbacks.length - 1];
            cbObject.middleware = callbacks.splice(0, callbacks.length - 2);
        }
        else if (callbacks.length == 2) {
            cbObject.callback = callbacks[1];
            cbObject.middleware = [ callbacks[0] ];
        }
        else if (callbacks.length == 1)
            cbObject.callback = callbacks[0];
        else throw new Error('Callback must be defined');

        this._list.push(cbObject);
    }

    async executeEvent(name, context) {
        let searched = this._list.find(element => element.name === name);

        if (searched == null) return;

        if (searched.middleware)
            for (let i = 0; i < searched.middleware.length; i++)
                searched.middleware[i]();

        searched.callback(context);
    }
}