/*****************************************************************************
 * Program: 
 *  mux.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function MUX(numInputs) {
    this.type = digsim.MUX;
    this.name = 'MUX';

    this.next = [];
    this.prev = [];
    this.prevConnect = [];
    this.connections = [];
    this.juncts = [];
    this.numInputs = (numInputs != 3) ? numInputs : 2;
    this.dimension = {'row': (this.numInputs + 1), 'col': 2};

    this.outPt = 2;
};
MUX.prototype = new Drawable();

/*****************************************************************************
 * CHANGE SIZE
 *  Changes the size of the gate based on numInputs
 ****************************************************************************/
MUX.prototype.changeSize = function() {
    this.dimension = {'row': this.numInputs + 1, 'col': 2};
}

/*****************************************************************************
 * DRAW
 *  This will draw the mux on the screen. THIS IS STILL INCOMPLETE! The 
 *  rotations are not consistent, and we dont have a means of knowing which 
 *  input is which yet. 
 ****************************************************************************/
MUX.prototype.draw = function(context, lineColor) {

//    var factor = Math.floor(this.numInputs / 2); ?????
    context.save();
    context.translate(this.col * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth = 2;
    
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = 0.5;
    }
    else if (this.rotation === 270) {
        offsetH = -0.5;
    }
    
    var center = {'row': ((this.numInputs + 1) / 2 + offsetV) * digsim.GRID_SIZE,
        'col': (1 + offsetH) * digsim.GRID_SIZE};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);
    this.drawWires(context, lineColor);
    
    // Draw body
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, (this.numInputs + 1) * digsim.GRID_SIZE);
    context.lineTo(digsim.GRID_SIZE * 2, ((this.numInputs + 1) - this.numInputs / 4) * digsim.GRID_SIZE);
    context.lineTo(digsim.GRID_SIZE * 2, digsim.GRID_SIZE * this.numInputs / 4);
    context.closePath();   
    context.fill();
    context.stroke();
    
    // Select Line text
    context.moveTo(0,0);
    context.font =  (digsim.GRID_SIZE / 2) + "px Arial";
    context.fontWidth = digsim.GRID_SIZE / 4;
    var textX, textY;
    if (this.numInputs == 4)
    {
        textX = digsim.GRID_SIZE * 7 / 6;
        textY = digsim.GRID_SIZE * 4;
        context.fillText("S1", textX - digsim.GRID_SIZE, textY + digsim.GRID_SIZE * .5);
    }
    else
    {
        textX = digsim.GRID_SIZE / 6;
        textY = digsim.GRID_SIZE * 2.5;
    }
    context.fillText("S0", textX, textY);
    context.restore();
    
    for (var i = 0; i < this.juncts.length; ++i) {
        context.beginPath();
        context.strokeStyle = '#000000';
        context.fillStyle = '#000000';
        context.arc((this.juncts[i].x + 0.5) * digsim.GRID_SIZE, (this.juncts[i].y + 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE / 10, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
    }    
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  MUXs all the input wires together to set the current state of the gate. 
 ****************************************************************************/
MUX.prototype.computeLogic = function() {
    var i = this.sel0 + this.sel1 * 2
    this.state = inputWire[i];
};




