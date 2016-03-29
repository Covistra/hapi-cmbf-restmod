var Calibrate = require('calibrate'),
    _ = require('lodash'),
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
                    log.trace("Model %s is unique", model[Model.idField]);
                    var opts = _.merge(req.query || {}, { credentials: _.get(req.auth, "credentials")});
                    return model.create(opts).then(function() {
                        log.debug("Model %s instance %s was successfully created", Model.name, model[Model.idField]);
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
