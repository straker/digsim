/***************************************************************************
 * Program:
 *  led.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 **************************************************************************/

/*****************************************************************************
 * LED
 * @constructor
 * @extends Component
 ****************************************************************************/
function LED() {
    this.type        = digsim.LED;
    this.name        = 'LED';

    this.numInputs   = 1;
    this.numOutputs  = 0;
    this.dimension   = {'row': 2, 'col': 1};  // Height and width of component
}
LED.prototype = new Component();

/******************************************************************************
 * GET INPUT ROTATION
 *  Return the row, col, and index of the input based on rotation.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
LED.prototype.getInputRotation = function() {
    var row, col, index;

    switch(this.rotation / 90) {
        case 0:
            row = this.row + this.dimension.row;
            col = this.col;
            index = 0;
            break;
        case 1:
            row = this.row;
            col = this.col -1;
            index = 1;
            break;
        case 2:
            row = this.row - 1;
            col = this.col;
            index = 2;
            break;
        case 3:
            row = this.row;
            col = this.col + this.dimension.col;
            index = 3;
            break;
    }

    return {row: row, col: col, index: index};
};

/*****************************************************************************
 * DRAW
 *  Draw the LED to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
LED.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, (this.row) * digsim.gridSize);

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

    // Fill LED light part
    context.beginPath();
    var P0x = digsim.gridSize / 8;
    var P0y = digsim.gridSize * 4 / 3;
    var P1x = 7 * P0x;
    var P1y = P0y;
    var My  = digsim.gridSize / 4;
    var C0x = P0x;
    var Cy = (4 * My - P0y) / 3;
    var C1x = P1x;

    context.moveTo(P0x, P0y);
    context.bezierCurveTo(C0x, Cy, C1x, Cy, P1x, P1y);

    if (this.state === 1 && digsim.mode === digsim.SIM_MODE) {
        context.fillStyle = '#FF0000';
    }
    context.stroke();
    context.fill();

    // Bottom part
    context.beginPath();
    context.fillStyle = '#FFFFFF';

    context.moveTo(0, 4 / 3 * digsim.gridSize);
    context.lineTo(digsim.gridSize, 4 / 3 * digsim.gridSize);

    context.stroke();

    context.beginPath();
    context.moveTo(digsim.gridSize * 7 / 8, 4 / 3 * digsim.gridSize);
    context.lineTo(digsim.gridSize * 7 / 8, digsim.gridSize * 2);
    context.lineTo(digsim.gridSize / 8, digsim.gridSize * 2);
    context.lineTo(digsim.gridSize / 8, 4 / 3 * digsim.gridSize);
    context.closePath();
    context.stroke();
    context.fill();

    context.moveTo(digsim.gridSize / 2, digsim.gridSize * 2);
    context.lineTo(digsim.gridSize / 2, 5 / 2 * digsim.gridSize);
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};