/**
 * Test the Digsim Object
 */
module('Digsim Object');

test('digsim object ceation', function() {
	digsim = new Digsim();
	ok(digsim, 'digsim object successfully created');
});
test('digsim init()', function() {
	digsim = new Digsim();
	ok(digsim.init(), 'digsim successfully initiated');
	digsim.run();
});
