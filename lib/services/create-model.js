var _ = require('lodash');

module.exports = function(Model, server, config, log) {

    return function(msg) {
        log.debug("Create %s service", Model.name);
        var model = Model.wrap(msg.data);
        return model.isUnique().then(function() {
            log.trace("Model %s is unique", model[Model.idField]);
            return model.create({wrap: msg.wrap, params: _.omit(msg, "credentials"), credentials: msg.credentials }).then(function() {
                log.debug("Model %s instance %s was successfully created", Model.name, model[Model.idField]);
                return model.toJSON();
            });
        });
    };

};
