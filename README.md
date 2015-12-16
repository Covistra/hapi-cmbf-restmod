# CMBF REST Model

This HAPI plugin exposes helpers to easily create RESTful API from
a model definition based on Joi schema.

*It requires the use of other CMBF plugins. See [CMBF-Core](https://www.npmjs.com/package/cmbf-core) for more details*

## Install the plugin

Install using npm:

```npm install cmbf-hapi-restmodel --save```

With the CMBF launcher, you just add a server hook to load additional plugins like this :

```javascript
{'register-plugins': function(params, defaultImpl) {
    "use strict";
    var Cmbf = this;

    Cmbf.log.debug("Registering specific plugins");
    return defaultImpl().then(function() {
        return P.join(
            Cmbf.installPlugin(require('cmbf-hapi-restmodel'))
            // Load other plugins...
        );
    });

}}
```

You just register this server hook by calling the registerHooks method:

```Cmbf.registerHooks(require('./lib/server-hooks'));```

## ModelManager

The primary service to register models is called **modelManager**. Inside your plugin implementation,
you retrieve a reference to it through the configured plugins:

```
var modelManager = server.plugins['cmbf-restmod'].modelManager;
```

This service exposes a ```registerModel``` method that you call, providing a model definition.

```
modelManager.registerModel('banana', require('./models/bananas.js);
```

The model will create all required routes and mongodb collections for the following operations:

- create
- show
- update
- upsert
- remove
- list

## Model

Ideally, you define your model using the new ES6 class concept:

```
var Joi = require('joi');

module.exports = function(server, config, log) {
    "use strict";

    var BaseModel = server.plugins['cmbf-hapi-restmodel'].BaseModel;
    var clock = server.plugins['covistra-system'].clock;

    class Document extends BaseModel {

        static get endpoint() {
            return "documents";
        }

        static get auth() {
            return "token";
        }

        static get name() {
            return "document";
        }

        static get collection() {
            return 'documents';
        }

        static get Schema() {
            return Joi.object().keys({
                key: Joi.string().required(),
                name: Joi.string().required(),
                ownerId: Joi.string(),
                customerId: Joi.string(),
                type: Joi.string(),
                tags: Joi.array().items(Joi.string()),
                content: Joi.any(),
                created_at: Joi.date().default(clock.nowTs, "Default to current time")
            });
        }

    }

    return Document;
};

```

You then register this model descriptor:

```
var Document = require('./models/document')(server, config, log);
modelManager.registerModel('document', Document`);
```

This model will get automatically exposed when the server stats with all standard routes
generated for you.

### Overriding ID field

Sometimes you need to override the field through which you model is referenced. By default,
we use a ```id``` field, but you just have to override the idField property in your
derived model:

```
class MyModel extends BaseModel {

    static get idField() {
        return 'key';
    }
}
```

