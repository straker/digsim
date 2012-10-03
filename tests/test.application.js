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


/**
 * Test the AND Gate
 */
module('AND Gate');

test('Test object creation', function() {
	and = new AND();
	ok(and, 'AND object successfully created');
});
test('Test numInputs', function() {
	and = new AND(4);
	equal(and.numInputs, 4, "AND gate num inputs equals 2");
});
test('Test init()', function() {
	and = new AND(4);
        and.init(25,50,1);
	equal(and.column, 25, "AND gate column equals 25");
        equal(and.row, 50, "AND gate row equals 50");
        equal(and.rotation, 1, "AND gate rotations equals 1");
});
test('Test gate logic 2-input', function() {
        and = new AND(2);
        and.init(25,50,1);

        and.prev[0].state = 0;
        and.prev[1].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:0, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:1, Output:0");
        
        and.prev[0].state = 1;
        and.prev[1].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:0, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 1;
        and.computeLogic();
        equal(and.state, 1, "Input1:1, Input2:1, Output:1");
});

test('Test gate logic 3-input', function() {
        and = new AND(3);
        and.init(25,50,1);

        and.prev[0].state = 0;
        and.prev[1].state = 0;
        and.prev[2].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:0, Input3:0, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 0;
        and.prev[2].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:0, Input3:1, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 1;
        and.prev[2].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:1, Input3:0, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 1;
        and.prev[2].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:1, Input3:1, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 0;
        and.prev[2].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:0, Input3:0, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 0;
        and.prev[2].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:0, Input3:1, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 1;
        and.prev[2].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:1, Input3:0, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 1;
        and.prev[2].state = 1;
        and.computeLogic();
        equal(and.state, 1, "Input1:1, Input2:1, Input3:1, Output:1");
});

test('Test gate logic 4-input', function() {
        and = new AND(4);
        and.init(25,50,1);

        and.prev[0].state = 0;
        and.prev[1].state = 0;
        and.prev[2].state = 0;
        and.prev[3].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:0, Input3:0, Input4:0, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 0;
        and.prev[2].state = 0;
        and.prev[3].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:0, Input3:0, Input4:1, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 0;
        and.prev[2].state = 1;
        and.prev[3].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:0, Input3:1, Input4:0, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 0;
        and.prev[2].state = 1;
        and.prev[3].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:0, Input3:1, Input4:1, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 1;
        and.prev[2].state = 0;
        and.prev[3].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:1, Input3:0, Input4:0, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 1;
        and.prev[2].state = 0;
        and.prev[3].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:1, Input3:0, Input4:1, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 1;
        and.prev[2].state = 1;
        and.prev[3].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:1, Input3:1, Input4:0, Output:0");

        and.prev[0].state = 0;
        and.prev[1].state = 1;
        and.prev[2].state = 1;
        and.prev[3].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:0, Input2:1, Input3:1, Input4:1, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 0;
        and.prev[2].state = 0;
        and.prev[3].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:0, Input3:0, Input4:0, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 0;
        and.prev[2].state = 0;
        and.prev[3].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:0, Input3:0, Input4:1, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 0;
        and.prev[2].state = 1;
        and.prev[3].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:0, Input3:1, Input4:0, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 0;
        and.prev[2].state = 1;
        and.prev[3].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:0, Input3:1, Input4:1, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 1;
        and.prev[2].state = 0;
        and.prev[3].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:1, Input3:0, Input4:0, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 1;
        and.prev[2].state = 0;
        and.prev[3].state = 1;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:1, Input3:0, Input4:1, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 1;
        and.prev[2].state = 1;
        and.prev[3].state = 0;
        and.computeLogic();
        equal(and.state, 0, "Input1:1, Input2:1, Input3:1, Input4:0, Output:0");

        and.prev[0].state = 1;
        and.prev[1].state = 1;
        and.prev[2].state = 1;
        and.prev[3].state = 1;
        and.computeLogic();
        equal(and.state, 1, "Input1:1, Input2:1, Input3:1, Input4:1, Output:1");
});

test('Test passState', function() {
        and = new AND(2);
        and.init(25,50,1);

        and.prev[0].passState(1);
        equal(and.prev[0].state, 1, "Input1 state is 1");
        equal(and.state, 0, "AND gate state is 0");
        equal(and.next[0].state, 0, "Output state is 0");

        and.prev[1].passState(1);
        equal(and.prev[0].state, 1, "Input2 state is 1");
        equal(and.state, 1, "AND gate state is 1");
        equal(and.next[0].state, 1, "Output state is 1");
});