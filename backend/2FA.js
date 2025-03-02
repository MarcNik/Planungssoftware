function create2FACode() {
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
}

module.exports = {
    create2FACode,
};