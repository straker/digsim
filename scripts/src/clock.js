/*****************************************************************************
 * Program:
 *  clock.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * CLOCK
 * @constructor
 * @extends Component
 ****************************************************************************/
function Clock() {
    this.type        = digsim.CLOCK;
    this.name        = 'Clock';
    this.frequency   = 2;   // in Hz

    this.numInputs   = 0;
    this.numOutputs  = 1;
    this.dimension   = {'row': 1, 'col': 2};  // Height and width of component
}
Clock.prototype = new Component();

/******************************************************************************
 * IS A DRIVER
 *  Return true if the component is a driver.
 * @return {boolean}
 *****************************************************************************/
Clock.prototype.isADriver = function() {
    return true;
};

/******************************************************************************
 * GET EXTRA COMPONENT SPACE
 *  Return the space {row, col, con, index} above and below the Component.
 * @param {number} length - How many spaces to return (top & bottom or left & right count as 1).
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Clock.prototype.getExtraComponentSpace = function(length) {
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
Clock.prototype.getComponentSpace = function() {
    // Call parent implementations
    var space = Component.prototype.getComponentSpace.call(this);

    // Combine the arrays
    space = space.concat(this.getExtraComponentSpace(2));

    return space;
};

/****************************************************************************
 * DRAW
 *  Draw the clock to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ***************************************************************************/
Clock.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineCap     = 'round';
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

    context.moveTo(0, 0);

    // Outside rectangle
    context.rect(0, digsim.gridSize * -0.25, digsim.gridSize * 2, digsim.gridSize * 1.5);
    context.fill();
    context.stroke();

    // Inside triangle
    context.beginPath();
    context.moveTo(digsim.gridSize * 2    , digsim.gridSize * 0.25);
    context.lineTo(digsim.gridSize * 1.75 , digsim.gridSize * 0.5);
    context.lineTo(digsim.gridSize * 2    , digsim.gridSize * 0.75);
    context.stroke();

    // Clock signal
    context.beginPath();
    context.moveTo(digsim.gridSize * 5 / 3, 0);
    context.lineTo(digsim.gridSize * 5 / 3, digsim.gridSize);
    context.lineTo(digsim.gridSize        , digsim.gridSize);
    context.lineTo(digsim.gridSize        , 0);
    context.lineTo(digsim.gridSize / 3    , 0);
    context.lineTo(digsim.gridSize / 3    , digsim.gridSize);
    context.fill();
    context.stroke();

    // Connection
    context.beginPath();
    context.moveTo(digsim.gridSize * 2    , digsim.gridSize * 0.5);
    context.lineTo(digsim.gridSize * 2.5  , digsim.gridSize * 0.5);
    context.stroke();

    this.drawLabel(context, lineColor);

    context.restore();
};