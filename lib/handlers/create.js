var Calibrate = require('calibrate'),
    Boom = require('boom');

module.exports = function(server, config, log) {
    "use strict";

    return function(Model) {
        log.trace("initializing model %s create handler", Model.name);
        return function(req, reply) {
            log.debug("Create %s request", Model.name);
            try {
                var model = Model.wrap(req.payload);
                return model.isUnique().then(function() {
                    log.trace("Model %s is unique", model.id);
                    return model.create().then(function() {
                        log.debug("Model %s instance %s was successfully created", Model.name, model.id);
                        return model.toJSON();
                    });
                }).catch(Calibrate.error).then(reply);
            }
            catch(err) {
                reply(Boom.badRequest(err));
            }

        }
    }

};
