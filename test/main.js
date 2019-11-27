const WebSocketAPI = require('../lib/index').default;

let server = new WebSocketAPI({ port: 1241 });
server.onConnection = () => {
    console.log('New user connected');
};
server.onDisconnect = () => {
    console.log('User disconnected');
};
server.on('message', {}, context => {
    console.log(context.message.text);
});