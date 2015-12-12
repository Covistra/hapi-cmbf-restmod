var Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var BaseModel = server.plugins['cmbf-restmod'].BaseModel;

    class Banana extends BaseModel {

        static get collection() {
            return "bananas";
        }

        static get endpoint() {
            return 'bananas';
        }

        static get name() {
            return "banana";
        }

        static get Schema() {
            return Joi.object().keys({
                key: Joi.string(),
                brand: Joi.string(),
                color: Joi.string(),
                price: Joi.number(),
                unit: Joi.number
            });
        }

    }

    return Banana;
};
