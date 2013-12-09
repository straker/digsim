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

    // DFF state : 0 = Q, 1 = Qnot
    this.state = [0, 0];
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
 * RESET
 *  Reset the state of the component.
 *****************************************************************************/
DFF.prototype.reset = function() {
    this.state = [0, 0];
    this.previousClockState = 0;
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
    return Component.prototype.getOutputRotation.call(this, outputIndex, skip);
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
    context.font        =  (digsim.gridSize / 2) + "px Arial";
    context.fontWidth   = digsim.gridSize / 4;

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

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

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
    var d = this.inputs.getConnectionComponents(0)[0];
    var clock = this.inputs.getConnectionComponents(1)[0];

    if (d && clock) {
        // Clock switched to rising edge
        if (this.previousClockState === 0 && clock.state) {
            // Set
            if (d.state) {
                this.state[0] = 1;
                this.state[1] = 0;
            }
            // Reset
            else {
                this.state[0] = 0;
                this.state[1] = 1;
            }
        }

        this.previousClockState = clock.state;
    }
};