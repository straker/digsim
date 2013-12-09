/*****************************************************************************
 * Program:
 *  not-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * NOT
 * @constructor
 * @extends Component
 ****************************************************************************/
function NOT() {
    this.type        = digsim.NOT;
    this.name        = 'NOT';

    this.numInputs   = 1;
    this.numOutputs  = 1;
    this.dimension   = {'row': 1, 'col': 2};  // Height and width of component
    this.extraSpace  = 1;
}
NOT.prototype = new Component();

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
NOT.prototype.isAGate = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the NOT gate to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
NOT.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;

    // Rotation
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = -0.5;
    }
    else if (this.rotation === 270) {
        offsetH = 0.5;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw gate
    context.beginPath();
    context.moveTo(0, -digsim.gridSize / 3);
    context.lineTo(digsim.gridSize * 1.625, digsim.gridSize * 0.5);
    context.lineTo(0, digsim.gridSize * 4 / 3);
    context.closePath();
    context.fill();
    context.stroke();

    // Draw circle
    context.beginPath();
    context.moveTo(digsim.gridSize * 1.75, digsim.gridSize * 0.5);
    context.beginPath();
    context.arc(digsim.gridSize * 1.8125, digsim.gridSize * 0.5, digsim.gridSize * 3 / 16, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  NOTs the input wire to set the current state of the gate.
 ****************************************************************************/
NOT.prototype.computeLogic = function() {
    var ins = this.inputs.get()[0];   // NOT gate can only have 1 input
    this.state = (!ins.state ? 1 : 0);
};