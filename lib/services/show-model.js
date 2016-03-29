
var _ = require('lodash');

module.exports = function(Model, server, config, log) {

    return function(msg) {
        log.debug("Show %s(%s) request", Model.name, msg.id);
        return Model.show(msg.id, {wrap: msg.wrap, params: _.omit(msg, "credentials"), credentials: msg.credentials });
    }
};
