

module.exports = function(Model, server, config, log) {

    return function(msg) {
        log.debug("Remove %s request", Model.name, msg.id);
        return Model.remove(msg.id, { credentials: msg.credentials});
    }
};
