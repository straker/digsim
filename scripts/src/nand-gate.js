/*****************************************************************************
 * Program:
 *  and-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * AND
 * @constructor
 * @extends Component
 * @param {number} numInputs - Number of input connections.
 ****************************************************************************/
function NAND(numInputs) {
    this.type        = digsim.NAND;
    this.name        = 'NAND';

    this.numInputs   = numInputs || 2;
    this.numOutputs  = 1;
    var size         = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension   = {'row': size, 'col': size};  // Height and width of component
}
NAND.prototype = new Component();

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs and the size of the Component.
 * @param {number} numInputs - Number of inputs to change to.
 ****************************************************************************/
NAND.prototype.changeNumInputs = function(numInputs) {
    if (numInputs >= 2) {
        this.numInputs = numInputs;
        var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
        this.dimension = {'row': size, 'col': size};
        this.zeroDimension = {'row': size, 'col': size};
    }
};

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
NAND.prototype.isAGate = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the NAND gate to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
NAND.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;

    // Rotation
    var center = {'row': (this.dimension.row / 2) * digsim.gridSize,
        'col': (this.dimension.col / 2) * digsim.gridSize };
    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw gate
    var factor = Math.floor(this.numInputs / 2);
    var gsf = digsim.gridSize * factor;

    context.moveTo(0, 0);
    context.lineTo(gsf,  0);

    var P1y = gsf * 2 + digsim.gridSize;
    var Cx = (4 * P1y - gsf) / 3;

    context.bezierCurveTo(Cx, 0, Cx, P1y, gsf, P1y);
    context.lineTo(0, P1y);

    context.closePath();
    context.stroke();
    context.fill();

    context.moveTo(digsim.gridSize * 10 / 3, digsim.gridSize * 1.5);
    context.beginPath();

    context.arc(digsim.gridSize / 6 + (2 * factor + 1) * digsim.gridSize, (factor + 0.5) * digsim.gridSize,  // center
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
 *  ANDs all the input wires together and then inverts that to set the
 *  current state of the gate.
 ****************************************************************************/
NAND.prototype.computeLogic = function() {
    var ins = this.inputs.get();
    var computedState = ins[0].state;

    for (var i = 1, len = ins.length; i < len; ++i) {
        computedState = computedState && ins[i].state;
    }
    this.state = (!computedState ? 1 : 0);
};