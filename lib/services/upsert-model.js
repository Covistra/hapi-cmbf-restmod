var Boom = require('boom');
var _ = require('lodash');

module.exports = function(Model, server, config, log) {

    return function(msg) {
        log.debug("Upsert %s(%s) request", Model.name, msg.id);
        return Model.show(msg.id, {wrap: true, params: _.omit(msg, "credentials"), credentials: msg.credentials }).then(function(model) {
            if(model) {
                return model.save(msg.data, {upsert: true}).then(function() {
                    log.debug("Model %s instance %s was successfully updated", Model.name, msg.id);
                    return model.toJSON();
                });
            }
            else {
                throw Boom.notFound(msg.id);
            }
        });
    }
};
