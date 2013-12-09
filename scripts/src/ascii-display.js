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
    this.previousClockState = 0;   // Keep track of clock state to know when it is on rising edge

    // Display variables
    this.text = "";
    this.numCols = 13;   // Number of columns in the display screen
    this.numRows = 4;    // Number of rows in the display screen

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

/******************************************************************************
 * RESET
 *  Reset the state of the component.
 *****************************************************************************/
ASCIIDisplay.prototype.reset = function() {
    this.text = "";
    this.previousClockState = 0;
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
    return Component.prototype.getInputRotation.call(this, inputIndex, 0);
};

/******************************************************************************
 * GET CLOCK PULSE ROTATION
 *  Return the row, col, and index of the select based on rotation.
 * @param {number} selectIndex - Index of select.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
ASCIIDisplay.prototype.getCPRotation = function() {
    var row, col, index;

    // Get the row and col of the wire
    switch (this.rotation / 90) {
        case 0:
            row = this.row + this.dimension.row;
            col = this.col + 1;
            index = 0;
            break;
        case 1:
            row = this.row + 1;
            col = this.col - 1;
            index = 1;
            break;
        case 2:
            row = this.row - 1;
            col = this.col + this.dimension.col - 2;
            index = 2;
            break;
        case 3:
            row = this.row + this.dimension.row - 2;
            col = this.col + this.dimension.col;
            index = 3;
    }

    return {row: row, col: col, index: index};
};

/******************************************************************************
 * GET COMPONENT SPACE
 *  Return every {row, col, index} that the component fills. Helpful for setting
 *  and deleting placeholders.
 * @return {Array} array of objects of {row, col, index}. Index is
 *                 only present if space is a wire.
 *****************************************************************************/
ASCIIDisplay.prototype.getComponentSpace = function() {
    // Call parent implementations
    var spaces = Component.prototype.getComponentSpace.call(this);

    // Get the select wire space
    var space = [];
    var cp = this.getCPRotation();

    space.push({
        'row'     : cp.row,
        'col'     : cp.col,
        'index'   : cp.index,
        'con'     : true,
        'conIndex': 'cp',
        'name'    : 'cp',
    });
    return spaces.concat(space);
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
        offsetV = -2;
    }
    else if (this.rotation === 270) {
        offsetH = 2;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // CP Wire
    context.beginPath();
    context.moveTo(1.5 * digsim.gridSize, (this.zeroDimension.row + 0.5) * digsim.gridSize);
    context.lineTo(1.5 * digsim.gridSize, (this.zeroDimension.row - 1) * digsim.gridSize);
    context.stroke();

    // Draw display
    context.beginPath();
    context.fillRect(0, 0, this.zeroDimension.col * digsim.gridSize, this.zeroDimension.row * digsim.gridSize);
    context.strokeRect(0, 0, this.zeroDimension.col * digsim.gridSize, this.zeroDimension.row * digsim.gridSize);

    // Draw display screen
    var screenWidth = (this.zeroDimension.col - 2) * digsim.gridSize;
    var screenHeight = (this.zeroDimension.row - 2) * digsim.gridSize;
    context.roundRect(digsim.gridSize, digsim.gridSize, screenWidth, screenHeight, digsim.gridSize / 2).stroke();

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
    this.drawConnectionDots(context);

    // Draw display text to screen
    // Canvas does not support newline characters, so we must implement them manually
    // http://stackoverflow.com/questions/5026961/html5-canvas-ctx-filltext-wont-do-line-breaks
    var col = 0;
    var row = 0;
    var colStart = digsim.gridSize / 6 + digsim.gridSize;
    var rowStart = digsim.gridSize * 2;

    var fontWidth = digsim.gridSize / 4;
    var fontHeight = screenHeight / this.numRows;
    var fontSize = screenWidth / this.numCols * fontHeight / digsim.gridSize - fontWidth / 1.5;

    context.fillStyle = 'black';
    context.font      = fontSize + "px Arial";
    context.fontWidth = fontWidth;

    var character, index, i;
    for (i = 0; i < this.text.length; i++) {
        character = this.text[i];
        context.fillText(character, colStart + (fontSize - fontWidth) * col++, rowStart + fontHeight * row);

        // Go to next row
        if (col >= this.numCols || character === "\n") {
            row++;
            col = 0;
        }

        // Remove first row of characters
        if (row >= this.numRows && i !== this.text.length - 1) {

            // Find where the first row ends by seeing if a new line character comes before the end of a row
            index = this.text.indexOf("\n");
            if (index === -1 || index > this.numCols)
                index = this.numCols;
            else
                index++;
            this.text = this.text.substring(index);
        }
    }

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  Set state based on input address and programmed hex number.
 ****************************************************************************/
ASCIIDisplay.prototype.computeLogic = function() {
    // Ensure we have the named connections to work with
    var clock = this.namedConnections.cp;

    if (!clock) {
        return;
    }

    // Clock switched to rising edge
    if (this.previousClockState === 0 && clock.state) {
        // Get binary value of inputs
        var binary = "";
        var i, comp, state, character, code;
        for (i = this.numInputs - 1; i >= 0; i--) {
            comp = this.inputs.getConnectionComponents(i)[0];
            state = (typeof comp !== 'undefined' && comp.state >= 0 ? comp.state : 0);
            binary += state + "";
        }

        // Get ascii character
        character = this.bin2asc(binary);
        code = character.charCodeAt(0);

        // Allowed codes: C (12), D (13), 20 (32) - 7E (126)
        if (code === 12 || code === 13 || (code >= 32 && code <= 126)) {

            // Need to set the CR code to NL for JavaScript
            if (code === 13)
                character = "\n";

            // Implement a clear screen
            if (code === 12) {
                this.text = "";
                character = "";
            }

            this.text += character;

            // Trim text if too long for display
            if (this.text.length > this.numCols * this.numRows)
                this.text = this.text.substring(this.numCols);
        }
    }

    this.previousClockState = clock.state;
};