var Calibrate = require('calibrate'),
    _ = require('lodash'),
    Boom = require('boom');

module.exports = function(server, config, log) {
    "use strict";

    return function(Model) {
        log.trace("initializing model %s upsert handler", Model.name);
        return function(req, reply) {
            log.debug("Upsert %s(%s) request", Model.name, req.params.id);
            var opts = _.merge(req.query || {}, { params: req.params || {}, credentials: _.get(req.auth, "credentials") });
            return Model.show(req.params.id, opts).then(function(model) {
                if(model) {
                    return model.save(req.payload, {upsert: true}).then(function() {
                        log.debug("Model %s instance %s was successfully updated", Model.name, model.id);
                        return model.toJSON();
                    });
                }
                else {
                    throw Boom.notFound(req.params.id);
                }
            }).catch(Calibrate.error).then(reply);
        }
    }

};
