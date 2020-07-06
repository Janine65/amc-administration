// Class for crypt passwords - access in global class
const crypto = require('crypto-js');

class CIPHER {
    constructor() {
        this.secret = "Auto Moto Club Swissair";
    }

    encrypt(decrypted) {
        return crypto.AES.encrypt(decrypted, this.secret).toString();
    }

    decrypt(encrypted) {
        return crypto.AES.decrypt(encrypted, this.secret).toString(crypto.enc.Utf8);
    }
}

global.cipher = new CIPHER();
