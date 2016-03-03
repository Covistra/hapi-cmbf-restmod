var Joi = require('joi'),
    P = require('bluebird'),
    _ = require('lodash');

module.exports = function(server, config, log) {
    "use strict";

    var dbName = config.get('plugins:restmod:dbname','MAIN');
    var random = server.plugins['covistra-system'].random;

    /**
     * key[><=]value;
     */
    var _parseFilter = P.method(function(model, filter) {
        return filter;
    });

    class BaseModel {

        constructor(data) {
            _.merge(this, data);
        }

        static get validation() {
            var params = {};
            params.id = Joi.string().required();
            return {
                create: {
                    payload: this.constructor.Schema
                },
                update: {
                    payload: this.constructor.Schema
                },
                upsert: {
                    payload: this.constructor.Schema
                },
                remove: {
                    params: params
                },
                show: {
                    params: params
                },
                list: {
                    query: {
                        filter: Joi.string(),
                        offset: Joi.number().precision(0),
                        size: Joi.number().precision(0)
                    }
                }
            }
        }

        static get auth() {
            return "token";
        }

        static get db() {
            return server.plugins['covistra-mongodb'][dbName];
        }

        static get idField() {
            return "id";
        }

        // THESE METHODS MUST BE OVERRIDEN BY SUBCLASSES

        static get collection() {
            throw new Error("collection must be overriden for model "+this);
        }

        static get endpoint() {
            throw new Error("endpoint must be overriden for model "+this);
        }

        static get name() {
            throw new Error("name must be overriden for model "+this);
        }

        static get Schema() {
            return Joi.object();
        }

        static list(options) {
            log.debug("list %s", this.constructor.name);
            options = options || {};
            var coll = this.db.collection(this.collection);

            return _parseFilter(this, options.filter).then((query) => {
                return coll.find(query).toArray().then((results) => {
                    if(options.wrap) {
                        return P.map(results, (r) => { return this.wrap(r)});
                    }
                    else {
                        return results;
                    }
                });
            });

        }

        static show(id, options) {
            log.debug("show %s ", this.name, id);
            options = options || {};
            var _this = this;
            var coll = this.db.collection(this.collection);
            var q = {};
            q[this.idField] = id;
            return coll.findOne(q).then(function(data) {
                if(options.wrap) {
                    return _this.wrap(data);
                }
                else {
                    return data;
                }
            });
        }

        static wrap(data) {
            if(!(data instanceof this)) {
                return new this(data);
            }
            else
                return data;
        }

        /**
         * Helpful wrapper to create instances we know for sure doesn't exists
         * @returns {*}
         */
        create() {
            return this.save(null,{upsert: true});
        }

        save(data, options) {
            data = data || this;
            log.debug("Save", data[this.constructor.idField] || this[this.constructor.idField]);
            options = options || {upsert: false};
            var val = Joi.validate(data, this.constructor.Schema);
            if(val.error) {
                throw val.error;
            }
            else {
                // Update our internal values
                var fields = _.omit(this.toJSON(), this.constructor.idField);
                var q = {};
                q[this.constructor.idField] = this[this.constructor.idField];

                if(!this[this.constructor.idField]) {
                    q[this.constructor.idField] = this[this.constructor.idField] = random.id();
                }

                log.debug("Retrieving collection %s from db", this.constructor.collection, this.constructor.db);
                var coll = this.constructor.db.collection(this.constructor.collection);
                return coll.updateOne(q, {$set: fields }, { upsert: options.upsert});
            }
        }

        static remove(id) {
            log.debug("Remove", id);
            var coll = this.db.collection(this.collection);
            var q= {};
            q[this.idField] = id;
            return coll.removeOne(q);
        }

        remove() {
            log.debug("Remove", this[this.constructor.idField]);
            var coll = this.constructor.db.collection(this.constructor.collection);
            var q= {};
            q[this.constructor.idField] = this[this.constructor.idField];
            return coll.removeOne(q);
        }

        toJSON() {
            var val = Joi.validate(this, this.constructor.Schema);
            if(val.error) {
                throw val.error;
            }
            else {
                return _.omit(val.value);
            }
        };

        isUnique() {
            var coll = this.constructor.db.collection(this.constructor.collection);
            var q= {};
            q[this.constructor.idField] = this[this.constructor.idField];
            return coll.findOne(q).then(function(existing) {
                return !existing;
            });
        };

    }

    return BaseModel;
};
