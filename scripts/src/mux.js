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

    // Keep track of component select connections
    this.namedConnections = {};
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

        if (this.rotation === 0 || this.rotation === 180)
            this.dimension = {'row': this.numInputs + 1, 'col': this.numInputs / 2};
        else
            this.dimension = {'row': this.numInputs / 2, 'col': this.numInputs + 1};

        this.zeroDimension = {'row': this.numInputs + 1, 'col': this.numInputs / 2};
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

/******************************************************************************
 * GET SELECT ROTATION
 *  Return the row, col, and index of the select based on rotation and select index.
 * @param {number} selectIndex - Index of select.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
Component.prototype.getSelectRotation = function(selectIndex) {
    var row, col, index;

    // Get the row and col of the wire
    switch (this.rotation / 90) {
        case 0:
            row = this.row + this.dimension.row;
            col = this.col + this.dimension.col - 1 - selectIndex;
            index = 0;
            break;
        case 1:
            row = this.row + this.dimension.row - 1 - selectIndex;
            col = this.col - 1;
            index = 1;
            break;
        case 2:
            row = this.row - 1;
            col = this.col + selectIndex;
            index = 2;
            break;
        case 3:
            row = this.row + selectIndex;
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
MUX.prototype.getComponentSpace = function() {
    // Call parent implementations
    var spaces = Component.prototype.getComponentSpace.call(this);

    // Get the select wire space
    var numSelect = this.numInputs / 2;
    var space = [], select;
    for (var i = 0; i < numSelect; i++) {
        select = this.getSelectRotation(i);

        space.push({
            'row'     : select.row,
            'col'     : select.col,
            'index'   : select.index,
            'con'     : true,
            'conIndex': 's'+i,
            'name'    : 's'+i,
        });
    }

    return spaces.concat(space);
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
    // TODO: FIX FOR BETTER SCALING
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        if (this.numInputs === 2)
            offsetV = 1;
        else
            offsetV = 1.5;
    }
    else if (this.rotation === 270) {
        if (this.numInputs === 2)
            offsetH = -1;
        else
            offsetH = -1.5;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Select Wires
    var factor = Math.floor(this.numInputs / 2);

    context.beginPath();
    context.moveTo(0.5 * digsim.gridSize, (this.numInputs + 1.5) * digsim.gridSize);
    context.lineTo(0.5 * digsim.gridSize, (this.numInputs) * digsim.gridSize);
    if (this.numInputs == 4) {
        context.moveTo(1.5 * digsim.gridSize, (this.numInputs + 1.5) * digsim.gridSize);
        context.lineTo(1.5 * digsim.gridSize, (this.numInputs) * digsim.gridSize);
    }
    context.stroke();

    // Draw body
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, (this.numInputs + 1) * digsim.gridSize);
    context.lineTo(digsim.gridSize * factor, ((this.numInputs + 1) - this.numInputs / 4) * digsim.gridSize);
    context.lineTo(digsim.gridSize * factor, digsim.gridSize * this.numInputs / 4);
    context.closePath();
    context.fill();

    // Select Line text
    var textX = digsim.gridSize * (this.numInputs == 2 ? 1 / 6 : 7 / 6);
    var textY = digsim.gridSize * (this.numInputs == 2 ? 2.5 : 4);
    context.fillStyle = context.strokeStyle;
    context.fillText("S0", textX, textY);
    if (this.numInputs == 4) {
        context.fillText("S1", textX - digsim.gridSize, textY);
    }
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  Set state based on select inputs address.
 ****************************************************************************/
MUX.prototype.computeLogic = function() {
    var select = "";
    var s, comp;
    for (var i = this.numInputs / 2 - 1; i >= 0; i--) {
        comp = this.namedConnections['s'+i];
        s = (typeof comp !== 'undefined' && comp.state >= 0 ? comp.state : 0);
        select += s + "";
    }
    var input = parseInt(select, 2);
    comp = this.inputs.getConnectionComponents(input)[0];
    if (comp)
        this.state = comp.state;
    else
        this.state = 0;
};