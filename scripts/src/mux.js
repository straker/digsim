/*****************************************************************************
 * Program: 
 *  mux.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function MUX(numInputs) {
    this.type = undefined;
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
 *  This will draw the mux on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
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
        offsetV = -0.5;
    }
    else if (this.rotation === 270) {
        offsetH = 0.5;
    }
    
    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.GRID_SIZE,
        'col': (this.dimension.col / 2 + offsetH) * digsim.GRID_SIZE};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);
    
    this.drawWires(context, lineColor);
    
    // Draw body
    context.moveTo(0, 0);
    context.lineTo(0, this.dimension.row * digsim.GRID_SIZE);
    context.lineTo(digsim.GRID_SIZE * 2, (this.dimension.row - this.numInputs / 4) * digsim.GRID_SIZE);
    context.lineTo(digsim.GRID_SIZE * 2, digsim.GRID_SIZE * this.numInputs / 4);
 
    context.closePath();   
    context.fill();
    context.stroke();
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




