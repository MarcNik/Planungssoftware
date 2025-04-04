const { randomUUID } = require("crypto");

function create2FACode() {
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
}

function createTempToken() {
    return randomUUID();
}

module.exports = {
    create2FACode,
    createTempToken,
};
