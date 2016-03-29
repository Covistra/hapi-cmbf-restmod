

module.exports = function(Model, server, config, log) {

    return function(msg) {
        log.debug("Show %s(%s) request", Model.name, msg.id);
        return Model.show(msg.id, { credentials: msg.credentials });
    }
};
