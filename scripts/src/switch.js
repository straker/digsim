/*****************************************************************************
 * Program:
 *  switch.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * SWITCH
 * @constructor
 * @extends Component
 ****************************************************************************/
function Switch() {
    this.type        = digsim.SWITCH;
    this.name        = 'Switch';

    this.numInputs   = 0;
    this.numOutputs  = 1;
    this.dimension   = {'row': 1, 'col': 1};  // Height and width of component
    this.extraSpace  = 1;
}
Switch.prototype = new Component();

/******************************************************************************
 * IS A DRIVER
 *  Return true if the component is a driver.
 * @return {boolean}
 *****************************************************************************/
Switch.prototype.isADriver = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the Switch to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
Switch.prototype.draw = function(context, lineColor) {
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

    context.moveTo(0, 0);

    // Draw 1
    context.moveTo(digsim.gridSize / 4, -digsim.gridSize / 4);
    context.lineTo(digsim.gridSize / 4, digsim.gridSize / 4);
    context.moveTo(digsim.gridSize / 4, 0);
    context.lineTo(digsim.gridSize * 3 / 4, 0);

    // Draw connection to 1 or 0
    if (this.state && digsim.mode === digsim.SIM_MODE) {
        context.lineTo(digsim.gridSize / 4 * 5, digsim.gridSize / 2);
        context.moveTo(digsim.gridSize * 3 / 4 , digsim.gridSize);

    }
    else {
        context.moveTo(digsim.gridSize / 4 * 5, digsim.gridSize / 2);
        context.lineTo(digsim.gridSize * 3 / 4, digsim.gridSize);
    }
    context.lineTo(digsim.gridSize / 2, digsim.gridSize);
    context.stroke();

    // Draw 0
    context.beginPath();
    context.arc(digsim.gridSize / 3, digsim.gridSize, digsim.gridSize / 5, 0, 2 * Math.PI);
    context.stroke();
    context.fill();

    // Connection
    context.beginPath();
    context.moveTo(digsim.gridSize / 4 * 5, digsim.gridSize / 2);
    context.lineTo(digsim.gridSize * 1.5, digsim.gridSize / 2);
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};