
/**
 * Test the OR Gate
 */
module('OR Gate');

test('Test object creation', function() {
    or = new OR();
    ok(or, 'OR object successfully created');
});
test('Test numInputs', function() {
    or = new OR(4);
    equal(or.numInputs, 4, "OR gate num inputs equals 4");
});
test('Test init()', function() {
    or = new OR(4);
    or.init(25,50,1);
    equal(or.row, 25, "OR gate row equals 25");
    equal(or.col, 50, "OR gate col equals 50");
    equal(or.rotation, 1, "OR gate rotations equals 1");
});
asyncTest('Test gate logic 2-input', function() {
    // load schematic
    $.getJSON('tests/schematics/2-input-or-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/2-input-or-gate.txt', function(truthTable) {
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
    $.getJSON('tests/schematics/3-input-or-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/3-input-or-gate.txt', function(truthTable) {
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
    $.getJSON('tests/schematics/4-input-or-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/4-input-or-gate.txt', function(truthTable) {
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