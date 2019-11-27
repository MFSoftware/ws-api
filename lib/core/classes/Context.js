"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class Context {
  constructor(opts, ws) {
    this.message = opts;

    this.reply = message => {
      let msg = message;
      if (message instanceof Object) msg = JSON.parse(message);
      ws.send(msg);
    };
  }

}

exports.default = Context;