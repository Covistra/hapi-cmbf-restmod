var Calibrate = require('calibrate');

module.exports = function(server, config, log) {
    "use strict";

    return function(Model) {
        log.trace("initializing model %s show handler", Model.name);
        return function(req, reply) {
            log.debug("Show %s(%s) request", Model.name, req.params.id);
            return Model.show(req.params.id).then(Calibrate.response).catch(Calibrate.error).then(reply);
        }
    }

};
