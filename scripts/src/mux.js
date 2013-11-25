/*****************************************************************************
 * Program:
 *  mux.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * MUX
 * @constructor
 * @extends Component
 * @param {number} numInputs - Number of input connections.
 ****************************************************************************/
function MUX(numInputs) {
    this.type        = digsim.MUX;
    this.name        = 'MUX';

    this.numInputs   = (numInputs != 3) ? numInputs : 2;
    this.numOutputs  = 1;
    this.dimension   = {'row': this.numInputs + 1, 'col': this.numInputs / 2};  // Height and width of component
}
MUX.prototype = new Component();

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs and the size of the Component.
 * @param {number} numInputs - Number of inputs to change to.
 ****************************************************************************/
MUX.prototype.changeNumInputs = function(numInputs) {
    if (numInputs % 2 === 0) {
        this.numInputs = numInputs;
        this.dimension = {'row': this.numInputs + 1, 'col': this.numInputs / 2};
    }
};

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
MUX.prototype.isAGate = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the MUX to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
MUX.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;
    context.font        = (digsim.gridSize / 2) + "px Arial";
    context.fontWidth   = digsim.gridSize / 4;

    // Rotation
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = 0.5;
    }
    else if (this.rotation === 270) {
        offsetH = -0.5;
    }

    var center = {'row': ((this.numInputs + 1) / 2 + offsetV) * digsim.gridSize,
        'col': (1 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw body
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, (this.numInputs + 1) * digsim.gridSize);
    context.lineTo(digsim.gridSize * this.dimension.col, ((this.numInputs + 1) - this.numInputs / 4) * digsim.gridSize);
    context.lineTo(digsim.gridSize * this.dimension.col, digsim.gridSize * this.numInputs / 4);
    context.closePath();
    context.fill();

    // Select Line text
    var textX = digsim.gridSize * 7 / 6;
    var textY = digsim.gridSize * (this.numInputs == 4 ? 4 : 2.5);
    context.fillStyle = context.strokeStyle;
    if (this.numInputs == 4) {
        context.fillText("S1", textX - digsim.gridSize, textY);
    }

    context.fillText("S0", textX, textY);
    context.stroke();
    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  MUXs all the input wires together to set the current state of the gate.
 ****************************************************************************/
MUX.prototype.computeLogic = function() {
    var i = this.sel0 + this.sel1 * 2;
    this.state = inputWire[i];
};