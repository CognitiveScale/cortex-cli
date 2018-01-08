const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports.readConfig = function readConfig() {
    const configDir = path.join(os.homedir(), '.cortex');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    const configFile = path.join(configDir, 'config');
    if (fs.existsSync(configFile)) {
        return JSON.parse(fs.readFileSync(configFile));
    }

    return {};
};

module.exports.loadProfile = function(profile) {
    const config = readConfig();
    return config[profile] || {};
};

module.exports.writeConfig = function(config) {
    const configDir = path.join(os.homedir(), '.cortex');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    const configFile = path.join(configDir, 'config');
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
};