var Calibrate = require('calibrate');
var _ = require('lodash');

module.exports = function(server, config, log) {
    "use strict";

    return function(Model) {
        log.trace("initializing model %s remove handler", Model.name);
        return function(req, reply) {
            log.debug("Remove %s request", Model.name, req.params.id);
            var opts = _.merge(req.query || {}, { credentials: _.get(req.auth, "credentials")});
            Model.remove(req.params.id, opts).then(Calibrate.response).then(Calibrate.error).then(reply);
        }
    }

};
