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

        static list() {
            log.debug("List "+BaseModel.name);
            var coll = BaseModel.collection;
            var cursor = coll.find();
            return P.promisify(cursor.toArray, cursor)();
        }

        static show(id) {
            log.debug("show "+BaseModel.name, id);
            var _this = this;
            var coll = BaseModel.collection;
            return P.promisify(coll.findOne, coll)({id: id}).then(function(data) {
                return _this.wrap(data);
            });
        }

        static create(data) {
            var val = Joi.validate(data || {}, BaseModel.Schema);
            if(val.error) {
                throw val.error;
            }
            else {
                return new BaseModel(val.value);
            }
        }

        static wrap(data) {
            if(typeof data !== BaseModel.name)
                return BaseModel(data);
            else
                return data;
        }

        save(data) {
            log.debug("Save "+BaseModel.name, this.id);
            var coll = BaseModel.collection;
            return P.promisify(coll.update, coll)({id: this.id}, {$set: data }, { multi: false, upsert: true});
        }

        remove() {
            log.debug("Remove "+BaseModel.name, this.id);
            var coll = BaseModel.collection;
            return P.promisify(coll.removeOne, coll)({id: this.id});
        }

    }

    return BaseModel;
};
