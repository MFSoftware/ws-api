export default class Context {
    constructor(opts, ws) {
        this.message = opts;

        this.reply = message => {
            let msg = message;

            if (message instanceof Object) msg = JSON.parse(message);

            ws.send(msg);
        };
    }
}