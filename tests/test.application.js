/**
 * Test the Digsim Object
 */
module('Digsim Object');

test('Test object ceation', function() {
    digsim = new Digsim();
    ok(digsim, 'digsim object successfully created');
});
test('Test init()', function() {
    digsim = new Digsim();
    ok(digsim.init(), 'digsim successfully initiated');
    digsim.run();
});
asyncTest('Test openFile()', function() {
    // load schematic
    $.getJSON('tests/schematics/2-input-and-gate.json', function(schematic) {
        // jQuery .get or .getJSON automatically calls .parseJSON
        digsim.openFile(JSON.stringify(schematic));

        var comps = digsim.components.get();
        equal(comps.length, 4, "There should be 4 components.");
        equal(comps[0].type, digsim.AND, "First component should be an AND gate");
        equal(comps[1].type, digsim.SWITCH, "Second component should be a Switch");
        equal(comps[2].type, digsim.SWITCH, "Third component should be a Switch");
        equal(comps[3].type, digsim.LED, "Fourth component should be a LED");

        start();
    });
});