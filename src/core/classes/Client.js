import uuidv1 from 'uuid/v1';

export default class Client {
    constructor() {
        this.uuid = uuidv1();
    }
}