const WebSocketAPI = require('../lib/index').default;

let server = new WebSocketAPI({ port: 1241 });
server.on('message', {
    required: [ 'text' ],
    schema: {
        text: 'string'
    }
}, () => console.log('test middleware'), context => {
    console.log(context.text);
});