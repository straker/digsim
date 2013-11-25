/*******************************************************************************
 * Program:
 *  dff.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ******************************************************************************/


/*****************************************************************************
 * DFF
 * @constructor
 * @extends Component
 ****************************************************************************/
function DFF() {
    this.type               = digsim.DFF;
    this.name               = 'DFF';

    this.numInputs          = 2;
    this.numOutputs         = 2;
    this.dimension          = {'row': 3, 'col': 2};  // Height and width of component
    this.previousClockState = 0;   // Keep track of clock state to know when it is on rising edge

    // Keep track of which connections are attached and how
    this.namedConnections = {};
    this.state = {
        'Q': false,
        'Qnot': false
    };
}
DFF.prototype = new Component();

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate
 * @return {boolean}
 *****************************************************************************/
DFF.prototype.isAGate = function() {
    return true;
};

/******************************************************************************
 * GET OUTPUT ROTATION
 *  Return the row, col, and index of the output based on rotation and output index.
 * @param {number} outputIndex - Index of output.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
DFF.prototype.getOutputRotation = function(outputIndex) {
    // Skip a row/col for even input Components
    var skip = (this.numInputs % 2 === 0 && outputIndex >= this.numInputs / 2 ? 1 : 0);
    var row, col, index;

    // Get the row and col of the first wire (0), then modify by outputIndex
    switch(this.rotation / 90) {
        case 0:
            row = this.row + outputIndex + skip;
            col = this.col + this.dimension.col;
            index = 3;
            break;
        case 1:
            row = this.row + this.dimension.row;
            col = this.col + this.dimension.col - 1 - outputIndex - skip;
            index = 0;
            break;
        case 2:
            row = this.row + this.dimension.row - 1 - outputIndex - skip;
            col = this.col - 1;
            index = 1;
            break;
        case 3:
            row = this.row - 1;
            col = this.col + outputIndex + skip;
            index = 2;
            break;
    }

    return {row: row, col: col, index: index};
};

/******************************************************************************
 * GET COMPONENT INPUT SPACE
 *  Return every {row, col, con, index, name} that the component input fills.
 * @return {Array} array of objects of {row, col, con, index, name}.
 *****************************************************************************/
DFF.prototype.getComponentInputSpace = function() {
    var space = Component.prototype.getComponentInputSpace.call(this);
    var name;

    for (var i = 0; i < space.length; i++) {
        switch (i) {
            case 0:
                name = 'D';
                break;
            case 1:
                name = 'clock';
                break;
        }

        space[i].name = name;
    }

    return space;
};

/******************************************************************************
 * GET COMPONENT OUPUT SPACE
 *  Return every {row, col, con, index, name} that the component output fills.
 * @return {Array} array of objects of {row, col, con, index, name}.
 *****************************************************************************/
DFF.prototype.getComponentOutputSpace = function() {
    var space = Component.prototype.getComponentOutputSpace.call(this);
    var name;

    for (var i = 0; i < space.length; i++) {
        switch (i) {
            case 0:
                name = 'Q';
                break;
            case 1:
                name = 'Qnot';
                break;
        }

        space[i].name = name;
    }

    return space;
};

/*****************************************************************************
 * DRAW
 *  Draw the DFF to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
DFF.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;

    // Rotation
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = 0.5;
    }
    else if (this.rotation === 270) {
        offsetH = -0.5;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw gate
    context.fillRect(0, 0, 2 * digsim.gridSize, 3 * digsim.gridSize);
    context.strokeRect(0, 0, 2 * digsim.gridSize, 3 * digsim.gridSize);

    // Font properties
    context.font =  (digsim.gridSize / 2) + "px Arial";
    context.fontWidth = digsim.gridSize / 4;
    context.fillStyle = lineColor || 'black';

    // Font position based on bottom left of letter
    context.fillText("D", digsim.gridSize / 6, digsim.gridSize * 0.75);
    context.fillText("Q", digsim.gridSize * 1.375, digsim.gridSize * 0.75);
    context.fillText("Q", digsim.gridSize * 1.375, digsim.gridSize * 2.75);

    // Draw Q's bar
    context.beginPath();
    context.moveTo(digsim.gridSize * 1.4, digsim.gridSize * 2.3);
    context.lineTo(digsim.gridSize * 1.75, digsim.gridSize * 2.3);

    // Draw Clock triangle
    context.moveTo(0, digsim.gridSize * 2.25);
    context.lineTo(digsim.gridSize / 4, digsim.gridSize * 2.5);
    context.lineTo(0, digsim.gridSize * 2.75);
    context.stroke();
    context.restore();
};

/*******************************************************************************
 * COMPUTE LOGIC
 *  Truth table: *** changes only on the rising edge of the clock
 *  E/C  D     Q      Qnot       Comment
 *   0   X   Qprev   Qnotprev   No change
 *   1   0     0       1          Reset
 *   1   1     1       0           Set
 ******************************************************************************/
DFF.prototype.computeLogic = function() {

    // Ensure we have the named connections to work with
    if (this.namedConnections.D && this.namedConnections.clock) {
        // Clock switched to rising edge
        if (this.previousClockState === 0 && this.namedConnections.clock.state) {
            // Set
            if (this.namedConnections.D.state) {
                this.state.Q = 1;
                this.state.Qnot = 0;
            }
            // Reset
            else {
                this.state.Q = 0;
                this.state.Qnot = 1;
            }
        }

        this.previousClockState = this.namedConnections.clock.state;
    }
};