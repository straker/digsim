
/**
 * Test the XOR Gate
 */
module('XOR Gate');

test('Test object creation', function() {
    xor = new XOR();
    ok(xor, 'XOR object successfully created');
});
test('Test numInputs', function() {
    xor = new XOR(4);
    equal(xor.numInputs, 4, "XOR gate num inputs equals 4");
});
test('Test init()', function() {
    xor = new XOR(4);
    xor.init(25,50,1);
    equal(xor.row, 25, "XOR gate row equals 25");
    equal(xor.col, 50, "XOR gate col equals 50");
    equal(xor.rotation, 1, "XOR gate rotations equals 1");
});
asyncTest('Test gate logic 2-input', function() {
    // load schematic
    $.getJSON('tests/schematics/2-input-xor-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/2-input-xor-gate.txt', function(truthTable) {
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
    $.getJSON('tests/schematics/3-input-xor-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/3-input-xor-gate.txt', function(truthTable) {
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
    $.getJSON('tests/schematics/4-input-xor-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/4-input-xor-gate.txt', function(truthTable) {
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