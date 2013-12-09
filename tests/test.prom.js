
/**
 * Test the PROM Gate
 */
module('PROM');

test('Test object creation', function() {
    prom = new PROM();
    ok(prom, 'PROM object successfully created');
});
test('Test numInputs', function() {
    prom = new PROM(4);
    equal(prom.numInputs, 7, "PROM gate num inputs equals 7");
});
test('Test init()', function() {
    prom = new PROM(2);
    prom.init(25,50,1);
    equal(prom.row, 25, "PROM gate row equals 25");
    equal(prom.col, 50, "PROM gate col equals 50");
    equal(prom.rotation, 1, "PROM gate rotations equals 1");
});
asyncTest('Test gate logic', function() {
    // load schematic
    $.getJSON('tests/schematics/prom.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        // run test
        $.get('tests/truthTables/prom.txt', function(truthTable) {
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