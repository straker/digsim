
/**
 * Test the NOR Gate
 */
module('NOR Gate');

test('Test object creation', function() {
    nor = new NOR();
    ok(nor, 'NOR object successfully created');
});
test('Test numInputs', function() {
    nor = new NOR(4);
    equal(nor.numInputs, 4, "NOR gate num inputs equals 4");
});
test('Test init()', function() {
    nor = new NOR(4);
    nor.init(25,50,1);
    equal(nor.row, 25, "NOR gate row equals 25");
    equal(nor.col, 50, "NOR gate col equals 50");
    equal(nor.rotation, 1, "NOR gate rotations equals 1");
});
asyncTest('Test gate logic 2-input', function() {
    // load schematic
    $.getJSON('tests/schematics/2-input-nor-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/2-input-nor-gate.txt', function(truthTable) {
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
asyncTest('Test gate logic 3-input', function() {
    // load schematic
    $.getJSON('tests/schematics/3-input-nor-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/3-input-nor-gate.txt', function(truthTable) {
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
    $.getJSON('tests/schematics/4-input-nor-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/4-input-nor-gate.txt', function(truthTable) {
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