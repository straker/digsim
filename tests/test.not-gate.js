
/**
 * Test the NOT Gate
 */
module('NOT Gate');

test('Test object creation', function() {
    not = new NOT();
    ok(not, 'NOT object successfully created');
});
test('Test numInputs', function() {
    not = new NOT(4);
    equal(not.numInputs, 1, "NOT gate num inputs equals 1");
});
test('Test init()', function() {
    not = new NOT(4);
    not.init(25,50,1);
    equal(not.row, 25, "NOT gate row equals 25");
    equal(not.col, 50, "NOT gate col equals 50");
    equal(not.rotation, 1, "NOT gate rotations equals 1");
});
asyncTest('Test gate logic', function() {
    // load schematic
    $.getJSON('tests/schematics/not-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/not-gate.txt', function(truthTable) {
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