const WebSocketAPI = require('../lib/index').default;

let server = new WebSocketAPI({ port: 1241 });
server.onConnection = () => {
    console.log('New user connected');
};
server.on('message', {
    required: [ 'text' ],
    schema: {
        text: 'string'
    }
}, context => {
    console.log(context.message.text);
});