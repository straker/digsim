
/**
 * Test the DFF Gate
 */
module('DFF');

test('Test object creation', function() {
    dff = new DFF();
    ok(dff, 'DFF object successfully created');
});
test('Test numInputs', function() {
    dff = new DFF(4);
    equal(dff.numInputs, 2, "DFF gate num inputs equals 2");
});
test('Test init()', function() {
    dff = new DFF(2);
    dff.init(25,50,1);
    equal(dff.row, 25, "DFF gate row equals 25");
    equal(dff.col, 50, "DFF gate col equals 50");
    equal(dff.rotation, 1, "DFF gate rotations equals 1");
});
asyncTest('Test gate logic', function() {
    // load schematic
    $.getJSON('tests/schematics/dff.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/dff.txt', function(truthTable) {
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