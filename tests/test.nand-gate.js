
/**
 * Test the NAND Gate
 */
module('NAND Gate');

test('Test object creation', function() {
    nand = new NAND();
    ok(nand, 'NAND object successfully created');
});
test('Test numInputs', function() {
    nand = new NAND(4);
    equal(nand.numInputs, 4, "NAND gate num inputs equals 4");
});
test('Test init()', function() {
    nand = new NAND(4);
    nand.init(25,50,1);
    equal(nand.row, 25, "NAND gate row equals 25");
    equal(nand.col, 50, "NAND gate col equals 50");
    equal(nand.rotation, 1, "NAND gate rotations equals 1");
});
asyncTest('Test gate logic 2-input', function() {
    // load schematic
    $.getJSON('tests/schematics/2-input-nand-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/2-input-nand-gate.txt', function(truthTable) {
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
    $.getJSON('tests/schematics/3-input-nand-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/3-input-nand-gate.txt', function(truthTable) {
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
    $.getJSON('tests/schematics/4-input-nand-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/4-input-nand-gate.txt', function(truthTable) {
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