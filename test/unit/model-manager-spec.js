var Cmbf = require('cmbf-core'),
    expect = require('chai').expect;

describe('model-manager', function() {
    "use strict";
    var ctx, modelManager;

    before(function (done) {
        Cmbf.test_ctx.then(function(result) {
            ctx = result;

            // Retrieve any required dependencies for the test
            modelManager = ctx.server.plugins['cmbf-hapi-restmodel'].modelManager;

            done();
        });
    });

    it('should keep a reference to a registered model', function() {
        var modelSpec = {
            field: true
        };
        modelManager.registerModel('test', modelSpec);
        expect(modelManager.models.test).to.be.defined;
    });

});
