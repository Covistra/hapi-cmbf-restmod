var P = require('bluebird'),
    _ = require('lodash');

module.exports = function(server, config, log) {
    "use strict";

    var handlers = {
        list: require('./handlers/list')(server, config, log),
        show: require('./handlers/show')(server, config, log),
        update: require('./handlers/update')(server, config, log),
        upsert: require('./handlers/upsert')(server, config, log),
        create: require('./handlers/create')(server, config, log),
        remove: require('./handlers/remove')(server, config, log)
    };

    var _generateRoutes = P.method(function(Model) {
        var routes = [];

        var endpoint = "/";
        if(Model.endpoint_prefix) {
            endpoint += Model.endpoint_prefix + '/';
        }

        endpoint += Model.endpoint;

        // List Model Instances
        routes.push({
            method: 'GET',
            path: endpoint,
            config: {
                handler: handlers.list(Model),
                tags: Model.tags || ['api'],
                description: "List all accessible "+endpoint,
                auth: Model.auth || 'token',
                validate: Model.validation.list
            }
        });

        routes.push({
            method:'GET',
            path: endpoint + "/{id}",
            config: {
                handler: handlers.show(Model),
                tags: Model.tags || ['api'],
                auth: Model.auth || 'token',
                description: "Get a single "+Model.name+" instance",
                validate: Model.validation.show
            }
        });

        routes.push({
            method: "POST",
            path: endpoint,
            config: {
                handler: handlers.create(Model),
                tags: Model.tags || ['api'],
                auth: Model.auth || 'token',
                description: "Create a "+Model.name+" instance",
                validate: Model.validation.create
            }
        });

        routes.push({
            method: "POST",
            path: endpoint+"/{id}",
            config: {
                handler: handlers.upsert(Model),
                tags: Model.tags || ['api'],
                auth: Model.auth || 'token',
                description: "Upsert a "+Model.name+" instance",
                validate: Model.validation.upsert
            }
        });

        routes.push({
            method: "PUT",
            path: endpoint+"/{id}",
            config: {
                handler: handlers.update(Model),
                tags: Model.tags || ['api'],
                auth: Model.auth || 'token',
                description: "Update a "+Model.name+" instance",
                validate: Model.validation.update
            }
        });

        routes.push({
            method: "DELETE",
            path: endpoint+"/{id}",
            config: {
                handler: handlers.remove(Model),
                tags: Model.tags,
                auth: Model.auth,
                description: "Remove a "+Model.name+" instance",
                validate: Model.validation.remove
            }
        });

        // Append any additional model specific routes
        if(Model.routes) {
            if(_.isFunction(Model.routes)) {
                return Model.routes().then(function(result) {
                    routes = routes.concat(result);
                });
            }
            else if(_.isArray(Model.routes)) {
                routes = routes.concat(Model.routes);
                return routes;
            }
        }
        else {
            return routes;
        }
    });

    class ModelManager {
        constructor() {
            this.models = {};
        }

        publishModels() {
            log.debug("Publishing all registered models");
            var _this = this;

            // Regenerate all routes
            return P.map(_.keys(this.models), function(modelKey) {
                return _generateRoutes(_this.models[modelKey], server).then(function(routes) {
                    server.route(routes);
                    return routes;
                });
            });
        };

        registerModel(key, spec) {
            this.models[key] = spec;
        };

        getModel(key) {
            return this.models[key];
        };
    }

    return new ModelManager();

};


