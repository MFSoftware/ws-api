# Magic WebSocket API
Library for creating WebSocket servers with **JSON support**
## How to install
```bash
npm i magicws-api --save
```

## Example
Simple example with scheme validation
```javascript
const WebSocketAPI = require('magicws-api').default;
server.on('message', {
    required: [ 'text' ],
    schema: {
        text: 'string'
    }
}, context => {
    console.log(context.text);
});
```
Or with middleware
```javascript
server.on('message', {}, () => console.log('test middleware'), context => {
    console.log('todo');
});
```