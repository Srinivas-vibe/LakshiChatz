const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for resolving .mjs files used by Lucide Icons
config.resolver.sourceExts.push('mjs');

module.exports = config;
