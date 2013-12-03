/*****************************************************************************
 * Program:
 *  ascii-display.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * ASCII DISPLAY
 * @constructor
 * @extends Component
 ****************************************************************************/
function ASCIIDisplay() {
    this.type        = digsim.ASCIIDISPLAY;
    this.name        = 'ASCIIDisplay';

    this.numInputs   = 8;  // 8 address bits
    this.numOutputs  = 0;
    this.dimension   = {'row': 8, 'col': 12};  // Height and width of component

    // 8 bit state
    this.state = [0, 0, 0, 0, 0, 0, 0, 0];
    this.display = "";

    // Keep track of the clock pulse (CP) connection
    this.namedConnections = {};
}
ASCIIDisplay.prototype = new Component();

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
ASCIIDisplay.prototype.isAGate = function() {
    return true;
};

/*****************************************************************************
 * BINARY TO ASCII
 *  Converts a binary value to an ascii character.
 * @param {number} bin - Binary to convert.
 * @param {string} Ascii character
 ****************************************************************************/
ASCIIDisplay.prototype.bin2asc = function(bin) {
    return String.fromCharCode(parseInt(bin, 2));
};

/******************************************************************************
 * GET INPUT ROTATION
 *  Return the row, col, and index of the input based on rotation and input index.
 * @param {number} inputIndex - Index of input.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
ASCIIDisplay.prototype.getInputRotation = function(inputIndex) {
    var row, col, index;

    // Get the row and col of the first wire (0), then modify by inputIndex
    switch(this.rotation / 90) {
        case 0:
            row = this.row + inputIndex;
            col = this.col - 1;
            index = 1;
            break;
        case 1:
            row = this.row - 1;
            col = this.col + this.dimension.col - 1 - inputIndex;
            index = 2;
            break;
        case 2:
            row = this.row + this.dimension.row - 1 - inputIndex;
            col = this.col + this.dimension.col;
            index = 3;
            break;
        case 3:
            row = this.row + this.dimension.row;
            col = this.col + inputIndex;
            index = 0;
            break;
    }

    return {row: row, col: col, index: index};
};

/*****************************************************************************
 * ROUND RECT
 *  Draws a rounded rectangle using the current state of the canvas.
 * @param {number} x - Top left x coordinate.
 * @param {number} y - top left y coordinate.
 * @param {number} w - Width of the rectangle.
 * @param {number} h - Height of the rectangle.
 * @param {number} r - Corner radius.
 ****************************************************************************/
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    return this;
};

/*****************************************************************************
 * DRAW
 *  Draw the ASCIIDisplay to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
ASCIIDisplay.prototype.draw = function(context, lineColor) {
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
        //offsetV = 2;
    }
    else if (this.rotation === 270) {
        //offsetH = -2;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw display
    context.beginPath();
    context.fillRect(0, 0, 12 * digsim.gridSize, 8 * digsim.gridSize);
    context.strokeRect(0, 0, 12 * digsim.gridSize, 8 * digsim.gridSize);

    context.roundRect(digsim.gridSize, digsim.gridSize, 10 * digsim.gridSize, 6 * digsim.gridSize, 10).stroke();

    // Font properties
    context.beginPath();
    context.fillStyle = lineColor || 'black';

    // Font position based on bottom left of letter
    // Inputs
    context.fillText("00", digsim.gridSize / 6, digsim.gridSize * 0.75);
    context.fillText("01", digsim.gridSize / 6, digsim.gridSize * 1.75);
    context.fillText("02", digsim.gridSize / 6, digsim.gridSize * 2.75);
    context.fillText("03", digsim.gridSize / 6, digsim.gridSize * 3.75);
    context.fillText("04", digsim.gridSize / 6, digsim.gridSize * 4.75);
    context.fillText("05", digsim.gridSize / 6, digsim.gridSize * 5.75);
    context.fillText("06", digsim.gridSize / 6, digsim.gridSize * 6.75);
    context.fillText("07", digsim.gridSize / 6, digsim.gridSize * 7.75);
    context.fillText("CP", digsim.gridSize / 6 + digsim.gridSize, digsim.gridSize * 7.75);

    context.stroke();
    context.fill();

    // Draw Component Select circle
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(digsim.gridSize * 1.5, digsim.gridSize * 8 + digsim.gridSize / 6,  // center
                digsim.gridSize / 6, 0,
                2 * Math.PI);
    context.fill();
    context.stroke();

    this.drawLabel(context, lineColor);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  Set state based on input address and programmed hex number.
 ****************************************************************************/
ASCIIDisplay.prototype.computeLogic = function() {
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
    var address = parseInt(address, 2);

    // Convert the decimal to a binary
    state = digsim.pad(digsim.dec2bin(this.addresses[address]), this.numOutputs);

    // Compute state
    var counter = this.state.length - 1;
    for (i = counter; i >= 0; i--) {
        this.state[i] = state[counter - i];
    }
};