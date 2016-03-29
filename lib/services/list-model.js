
var _ = require('lodash');

module.exports = function(Model, server, config, log) {

    return function(msg) {
        return Model.list({params: _.omit(msg, "credentials"), credentials: msg.credentials });
    }
};
