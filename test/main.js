const WebSocketAPI = require('../lib/index').default;

let server = new WebSocketAPI({ port: 1241 });
server.on('message', {
    text: {
        type: 'string',
        required: true
    }
}, context => {
    console.log(context.text);
});