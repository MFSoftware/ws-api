# Magic WebSocket API

## How to install
```bash
npm i magicws-api --save
```

## Example
Simple example with scheme validation
```javascript
const WebSocketAPI = require('magicws-api').default;

let server = new WebSocketAPI({ port: 1241 });
server.on('message', {
    text: {
        type: 'string',
        required: true
    }
}, context => {
    console.log(context.text);
});
```