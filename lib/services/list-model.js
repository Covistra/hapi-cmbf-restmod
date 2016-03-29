
var _ = require('lodash');

module.exports = function(Model, server, config, log) {

    return function(msg) {
        return Model.list(_.pick(msg, "query", "credentials"));
    }
};
