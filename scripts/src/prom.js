/*****************************************************************************
 * Program:
 *  prom.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * PROM
 * @constructor
 * @extends Component
 ****************************************************************************/
function PROM() {
    this.type        = digsim.PROM;
    this.name        = 'PROM';

    this.numInputs   = 7;  // 6 address bits and 1 component select (CS)
    this.numOutputs  = 8;  // 8 bits
    this.dimension   = {'row': 8, 'col': 4};  // Height and width of component

    // 6 bit address (decimal) to 2 hex (decimal) dictionary
    this.addresses = {};
    for (var i = 0, len = Math.pow(2, this.numInputs - 1); i < len; i++) {
        this.addresses[i] = 0;
    }

    // 8 bit state\
    this.state = [0, 0, 0, 0, 0, 0, 0, 0];
}
PROM.prototype = new Component();

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
PROM.prototype.isAGate = function() {
    return true;
};

/******************************************************************************
 * GET INPUT ROTATION
 *  Return the row, col, and index of the input based on rotation and input index.
 * @param {number} inputIndex - Index of input.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
PROM.prototype.getInputRotation = function(inputIndex) {
    // Skip a row/col for the component select wire
    var skip = (inputIndex === this.numInputs - 1 ? 1 : 0);
    var row, col, index;

    // Get the row and col of the first wire (0), then modify by inputIndex
    switch(this.rotation / 90) {
        case 0:
            row = this.row + inputIndex + skip;
            col = this.col - 1;
            index = 1;
            break;
        case 1:
            row = this.row - 1;
            col = this.col + this.dimension.col - 1 - inputIndex - skip;
            index = 2;
            break;
        case 2:
            row = this.row + this.dimension.row - 1 - inputIndex - skip;
            col = this.col + this.dimension.col;
            index = 3;
            break;
        case 3:
            row = this.row + this.dimension.row;
            col = this.col + inputIndex + skip;
            index = 0;
            break;
    }

    return {row: row, col: col, index: index};
};

/******************************************************************************
 * GET OUTPUT ROTATION
 *  Return the row, col, and index of the output based on rotation and output index.
 * @param {number} outputIndex - Index of output.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
PROM.prototype.getOutputRotation = function(outputIndex) {
    return Component.prototype.getOutputRotation.call(this, outputIndex, 0);
};

/*****************************************************************************
 * DRAW
 *  Draw the PROM to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
PROM.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;
    context.font        = (digsim.gridSize / 2) + "px Arial";
    context.fontWidth   = digsim.gridSize / 4;

    // Rotation
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = 2;
    }
    else if (this.rotation === 270) {
        offsetH = -2;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw gate
    context.beginPath();
    context.fillRect(0, 0, this.zeroDimension.col * digsim.gridSize, this.zeroDimension.row * digsim.gridSize);
    context.strokeRect(0, 0, this.zeroDimension.col * digsim.gridSize, this.zeroDimension.row * digsim.gridSize);

    // Font properties
    context.fillStyle = lineColor || 'black';

    // Font position based on bottom left of letter
    // Inputs
    context.fillText("0", digsim.gridSize / 6, digsim.gridSize * 0.75);
    context.fillText("1", digsim.gridSize / 6, digsim.gridSize * 1.75);
    context.fillText("2", digsim.gridSize / 6, digsim.gridSize * 2.75);
    context.fillText("3", digsim.gridSize / 6, digsim.gridSize * 3.75);
    context.fillText("4", digsim.gridSize / 6, digsim.gridSize * 4.75);
    context.fillText("5", digsim.gridSize / 6, digsim.gridSize * 5.75);
    context.fillText("CS", digsim.gridSize / 6, digsim.gridSize * 7.75);

    // Outputs
    context.fillText("00", digsim.gridSize * 3.275, digsim.gridSize * 0.75);
    context.fillText("01", digsim.gridSize * 3.275, digsim.gridSize * 1.75);
    context.fillText("02", digsim.gridSize * 3.275, digsim.gridSize * 2.75);
    context.fillText("03", digsim.gridSize * 3.275, digsim.gridSize * 3.75);
    context.fillText("04", digsim.gridSize * 3.275, digsim.gridSize * 4.75);
    context.fillText("05", digsim.gridSize * 3.275, digsim.gridSize * 5.75);
    context.fillText("06", digsim.gridSize * 3.275, digsim.gridSize * 6.75);
    context.fillText("07", digsim.gridSize * 3.275, digsim.gridSize * 7.75);

    context.stroke();
    context.fill();

    // Draw Component Select circle
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(-digsim.gridSize / 6, digsim.gridSize * 7.5,  // center
                digsim.gridSize / 6, 0,
                2 * Math.PI);
    context.fill();
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  Set state based on input address and programmed hex number.
 ****************************************************************************/
PROM.prototype.computeLogic = function() {
    // Don't process state if the component select is off
    var componentSelect = this.inputs.getConnectionComponents(6)[0];
    if (typeof componentSelect !== 'undefined' && !componentSelect.state) {
        this.state = [0, 0, 0, 0, 0, 0, 0, 0];
        return;
    }

    // Compute address
    var address = "";
    var i, comp, s, state;
    for (i = this.numInputs - 2; i >= 0; i--) {  // Ignore CS input
        comp = this.inputs.getConnectionComponents(i)[0];
        s = (typeof comp !== 'undefined' && comp.state >= 0 ? comp.state : 0);
        address += s + "";
    }
    address = parseInt(address, 2);

    // Convert the decimal to a binary
    state = digsim.pad(digsim.dec2bin(this.addresses[address]), this.numOutputs);

    // Compute state
    var counter = this.state.length - 1;
    for (i = counter; i >= 0; i--) {
        this.state[i] = state[counter - i];
    }
};