var _ = require('lodash');

module.exports = function(Model, server, config, log) {

    return function(msg) {
        log.debug("Create %s service", Model.name);
        var model = Model.wrap(msg.data);
        return model.isUnique().then(function() {
            log.trace("Model %s is unique", model[Model.idField]);
            var opts = _.pick(msg, "credentials");
            return model.create(opts).then(function() {
                log.debug("Model %s instance %s was successfully created", Model.name, model[Model.idField]);
                return model.toJSON();
            });
        });
    };

};
