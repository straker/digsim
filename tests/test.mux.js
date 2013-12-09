
/**
 * Test the MUX Gate
 */
module('MUX');

test('Test object creation', function() {
    mux = new MUX();
    ok(mux, 'MUX object successfully created');
});
test('Test numInputs', function() {
    mux = new MUX(3);
    equal(mux.numInputs, 2, "MUX gate num inputs equals 2");
    mux = new MUX(4);
    equal(mux.numInputs, 4, "MUX gate num inputs equals 4");
});
test('Test init()', function() {
    mux = new MUX(4);
    mux.init(25,50,1);
    equal(mux.row, 25, "MUX gate row equals 25");
    equal(mux.col, 50, "MUX gate col equals 50");
    equal(mux.rotation, 1, "MUX gate rotations equals 1");
});
asyncTest('Test gate logic 2-input', function() {
    // load schematic
    $.getJSON('tests/schematics/2-input-mux.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/2-input-mux.txt', function(truthTable) {
          var results = digsim.test.validateSchematic(truthTable);
            for (var i in results) {
                if (results.hasOwnProperty(i)) {
                    equal(results[i], true, i);
                }
            }
            start();
        });
    });
});
asyncTest('Test gate logic 4-input', function() {
    // load schematic
    $.getJSON('tests/schematics/4-input-mux.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/4-input-mux.txt', function(truthTable) {
          var results = digsim.test.validateSchematic(truthTable);
            for (var i in results) {
                if (results.hasOwnProperty(i)) {
                    equal(results[i], true, i);
                }
            }
            start();
        });
    });
});