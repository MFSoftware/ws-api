# Magic WebSocket API
Library for creating WebSocket servers with **JSON support**
## How to install
With NPM
```bash
npm i magicws-api --save
```
with yarn
```bash
yarn add magicws-api
```

## Example
ES5
```javascript
const WebSocketAPI = require('magicws-api').default;
```

ES6
```javascript
import WebSocketAPI from 'magicws-api';
```

Simple example with scheme validation
```javascript
let server = new WebSocketAPI({ port: 1241 });
server.on('message', {
    required: [ 'text' ],
    schema: {
        text: 'string'
    }
}, context => {
    console.log(context.message.text);
    context.reply({ hello: 'world' });
});
```
With middleware and with out validation
```javascript
server.on('message', {}, () => console.log('test middleware'), context => {
    console.log('todo');
});
```

License