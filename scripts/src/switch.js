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

/******************************************************************************
 * GET EXTRA COMPONENT SPACE
 *  Return the space {row, col, con, index} above and below the Component.
 * @param {number} length - How many spaces to return (top & bottom or left & right count as 1).
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Switch.prototype.getExtraComponentSpace = function(length) {
    var space = [];
    var col = this.col, row = this.row;
    var index;

    for (var i = 0; i < length; i++) {
        // Get space based on rotations
        for (var y = 0; y < 2; ++y) {
            // Component is rotated on it's side (90 or 270)
            if (((this.rotation) / 90) % 2) {
                // Right
                if (y) {
                    col = this.col + this.dimension.col;
                    index = 3;
                }
                // Left
                else {
                    index = 1;
                    col = this.col - 1;
                }
            }
            // Component is rotated normally (0 or 180)
            else {
                // Below
                if (y) {
                    row = this.row + this.dimension.row;
                    index = 0;
                }
                // Above
                else {
                    index = 2;
                    row = this.row - 1;
                }
            }

            space.push({
                'row'  : row,
                'col'  : col,
                'con'  : false,
                'index': index
            });
        }

        if (this.rotation === 90 || this.rotation === 270) {
            ++row;
        }
        else {
            ++col;
        }
    }

    return space;
};

/******************************************************************************
 * GET COMPONENT SPACE
 *  Return every {row, col, index} that the component fills. Helpful for setting
 *  and deleting placeholders.
 * @return {Array} array of objects of {row, col, index}. Index is
 *                 only present if space is a wire.
 *****************************************************************************/
Switch.prototype.getComponentSpace = function() {
    // Call parent implementations
    var space = Component.prototype.getComponentSpace.call(this);

    // Combine the arrays
    space = space.concat(this.getExtraComponentSpace(1));

    return space;
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