var Joi = require('joi'),
    _ = require('lodash');

module.exports = function(server, config, log) {
    "use strict";

    var dbName = config.get('plugins:restmod:dbname', 'MAIN');

    class BaseModel {

        constructor(data) {
            _.merge(this, data);
        }

        static get validation() {
            return {
                create: {
                    payload: BaseModel.Schema
                },
                update: {
                    payload: BaseModel.Schema
                },
                upsert: {
                    payload: BaseModel.Schema
                },
                remove: {
                    params: {
                        id: Joi.string().required()
                    }
                },
                show: {
                    params: {
                        id: Joi.string().required()
                    }
                },
                list: {
                    query: {
                        offset: Joi.number().precision(0),
                        size: Joi.number().precision(0)
                    }
                }
            }
        }

        static get db() {
            return server.plugins['covistra-mongodb'][dbName];
        }

        static get auth() {
            return "token";
        }

        // THESE METHODS MUST BE OVERRIDEN BY SUBCLASSES

        static get collection() {
            throw new Error("must be overriden");
        }

        static get endpoint() {
            throw new Error("must be overriden");
        }

        static get name() {
            throw new Error("must be overriden");
        }

        static get Schema() {
            return Joi.object();
        }

        static list(options) {
            log.debug("list %s", BaseModel.name);
            options = options || {};
            var coll = BaseModel.collection;
            var cursor = coll.find(options.filter);
            return P.promisify(cursor.toArray, cursor)().then(function(results) {
                if(options.wrap) {
                    return P.map(results, function(r){ return BaseModel.wrap(r)});
                }
                else {
                    return results;
                }
            });
        }

        static show(id) {
            log.debug("show %s ", BaseModel.name, id);
            var _this = this;
            var coll = BaseModel.collection;
            return P.promisify(coll.findOne, coll)({id: id}).then(function(data) {
                return _this.wrap(data);
            });
        }

        static wrap(data) {
            if(data instanceof BaseModel)
                return BaseModel.create(data);
            else
                return data;
        }

        save(data, options) {
            data = data || this;
            log.debug("Save", data.id || this.id);
            options = options || {upsert: false};
            var coll = BaseModel.collection;
            var val = Joi.validate(data, BaseModel.Schema);
            if(val.error) {
                throw val.error;
            }
            else {
                // Update our internal values
                _.assign(this, val.value);
                return P.promisify(coll.update, coll)({id: this.id}, {$set: _.omit(val.value, 'id') }, { multi: false, upsert: options.upsert});
            }
        }

        static remove(id) {
            log.debug("Remove", id);
            var coll = BaseModel.collection;
            return P.promisify(coll.removeOne, coll)({id: id});
        }

        remove() {
            log.debug("Remove", this.id);
            var coll = BaseModel.collection;
            return P.promisify(coll.removeOne, coll)({id: this.id});
        }

        toJSON() {
            var val = Joi.validate(this, BaseModel.Schema);
            if(val.error) {
                throw val.error;
            }
            else {
                return val.value;
            }
        };

        isUnique() {
            var coll = BaseModel.collection;
            return P.promisify(coll.findOne, coll)({id: this.id}).then(function(existing) {
                return !existing;
            });
        };

    }

    return BaseModel;
};
