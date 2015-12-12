var Calibrate = require('calibrate'),
    Boom = require('boom'),
    P = require('bluebird');

module.exports = function(server, config, log) {
    "use strict";

    return function(Model) {
        return function(req, reply) {
            return Model.list(req.query).then(Calibrate.response).catch(Calibrate.error).then(reply);
        }
    }

};
