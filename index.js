var P = require('bluebird'),
    _ = require('lodash');

exports.deps = ['covistra-system', 'covistra-mongodb'];

exports.register = function (server, options, next) {
    "use strict";

    server.log(['plugin', 'info'], "Registering the REST model plugin");

    // Retrieve a reference to the current system configuration
    var config = server.plugins['hapi-config'].CurrentConfiguration;
    var log = server.plugins['covistra-system'].systemLog.child({plugin: 'restmod', level: config.get('plugins:restmod:log_level', 'info')});

    // Register our model manager
    var modelManager = require('./lib/model-manager')(server, config, log.child({service: 'model-manager'}));
    server.expose('modelManager', modelManager);
    server.expose('BaseModel', require('./lib/base-model')(server, config, log));

    // When everything is started, we generate all our routes
    server.methods.getCmbf().registerHook('before-server-start', function() {
        return modelManager.publishModels().then(function(models) {
           log.debug("%d model(s) were successfully published ", models.length);
        });
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
