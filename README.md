# CMBF REST Model

This HAPI plugin exposes helpers to easily create RESTful API from
a model definition based on Joi schema.

*It requires the use of other CMBF plugins*

## Install the plugin

Install using npm:

```npm install cmbf-restmod --save```

With the CMBF launcher, you just add a server hook to load additional plugins like this :

```javascript
{'register-plugins': function(params, defaultImpl) {
    "use strict";
    var Cmbf = this;

    Cmbf.log.debug("Registering specific plugins");
    return defaultImpl().then(function() {
        return P.join(
            Cmbf.installPlugin(require('cmbf-restmod'))
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

