

module.exports = function(Model, server, config, log) {

    return function(msg) {
        return Model.list(msg.query);
    }
};
