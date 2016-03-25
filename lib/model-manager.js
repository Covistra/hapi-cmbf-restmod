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

        log.debug("Generating routes for model %s", Model);

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
                auth: Model.list_auth || Model.auth || 'token',
                cache: Model.cache,
                validate: Model.validation.list
            }
        });

        routes.push({
            method:'GET',
            path: endpoint + "/{id}",
            config: {
                handler: handlers.show(Model),
                tags: Model.tags || ['api'],
                auth: Model.show_auth || Model.auth || 'token',
                cache: Model.cache,
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
                auth: Model.create_auth || Model.auth || 'token',
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
                auth: Model.upsert_auth || Model.auth || 'token',
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
                auth: Model.update_auth || Model.auth || 'token',
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
                auth: Model.delete_auth || Model.auth,
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

    var _registerServices = P.method(function(Model, server) {

        var impl = {
            list: require('./services/list-model')(Model, server, config, log),
            show: require('./services/show-model')(Model, server, config, log),
            create: require('./services/create-model')(Model, server, config, log),
            remove: require('./services/remove-model')(Model, server, config, log),
            update: require('./services/update-model')(Model, server, config, log),
            upsert: require('./services/upsert-model')(Model, server, config, log)
        };

        var handler = function(service) {
            return function(msg, done) {
                return P.method(service)(msg).asCallback(done);
            };
        };

        if(_.isFunction(server.service)) {
            _.forOwn(impl, function(service, action) {
                server.seneca.add({role:'model', target: Model.name, action:action}, handler(service));
            });
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
                return P.join(
                    _generateRoutes(_this.models[modelKey], server).then(function(routes) {
                        server.route(routes);
                        return routes;
                    }),
                    _registerServices(_this.models[modelKey], server)
                )
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


