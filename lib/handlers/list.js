var Calibrate = require('calibrate');
var _ = require('lodash');

module.exports = function(server, config, log) {
    "use strict";

    return function(Model) {
        return function(req, reply) {
            var opts = _.merge(req.query || {}, { params: req.params || {}, credentials: _.get(req.auth, "credentials") });
            return Model.list(opts).then(Calibrate.response).catch(Calibrate.error).then(reply);
        }
    }

};
