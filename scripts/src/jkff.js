/*******************************************************************************
 * Program:
 *  jkff.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * @deprecated
 ******************************************************************************/

/*****************************************************************************
 * JKFF
 * @constructor
 * @extends Component
 * @param {number} numInputs - Number of input connections.
 ****************************************************************************/
function JKFF(numInputs) {
    this.type = digsim.JKFF;
    this.name = 'JKFF';

    this.numInputs = 3;
    this.numOutputs = 2;
    this.dimension = {'row': 3, 'col': 2};
    this.previousClockState = 0;

    // Keep track of which connections are attached and how
    this.namedConnections = {};
    this.state = {
        'Q': false,
        'Qnot': false
    };
};
JKFF.prototype = new Component();

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method.
 ****************************************************************************/
JKFF.prototype.draw = function(context, lineColor) {

    var fontSize = digsim.gridSize / 2;
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth = 2;

    // Rotatation
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
    context.fillStyle = lineColor || 'black';

    // Font position based on bottom left of letter
    context.fillText("J", digsim.gridSize / 6, digsim.gridSize * 0.75);
    context.fillText("K", digsim.gridSize / 6, digsim.gridSize * 2.75);
    context.fillText("Q", digsim.gridSize * 1.375, digsim.gridSize * 0.75);
    context.fillText("Q", digsim.gridSize * 1.375, digsim.gridSize * 2.75);

    // Draw Q's bar
    context.moveTo(digsim.gridSize * 1.4, digsim.gridSize * 2.3);
    context.lineTo(digsim.gridSize * 1.75, digsim.gridSize * 2.3);

    // Draw Clock
    context.moveTo(0, digsim.gridSize * 1.25);
    context.lineTo(digsim.gridSize / 4, digsim.gridSize * 1.5);
    context.lineTo(0, digsim.gridSize * 1.75);

    context.stroke();
    context.restore();
};

// Infallable logic function
/*******************************************************************************
 * COMPUTE LOGIC
 *  Truth table: *** changes only on the rising edge of the clock
 *  J   K  Qnext    Comment
 *  0   0   Q       hold state
 *  0   1   0       reset
 *  1   0   1       set
 *  1   1   Qnot    toggle
 ******************************************************************************/
JKFF.prototype.computeLogic = function() {

    // Ensure we have the named connections to work with
    if (this.namedConnections['J'] && this.namedConnections['K'] && this.namedConnections['clock']) {
        // Clock switched to rising edge
        if (this.previousClockState == 0 && this.namedConnections['clock'].state) {
            // Set
            if (this.namedConnections['D'].state) {
                this.state['Q'] = 1;
                this.state['Qnot'] = 0;
            }
            // Reset
            else {
                this.state['Q'] = 0;
                this.state['Qnot'] = 1;
            }
        }

        this.previousClockState = this.namedConnections['clock'].state;
    }
};

