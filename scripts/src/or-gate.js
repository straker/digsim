/*****************************************************************************
 * Program: 
 *  or-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function OR(numInputs) {
    this.type = digsim.OR;
    this.name = 'OR';

    this.next = [];
    this.prev = [];
    this.prevConnect = [];
    this.connections = [];
    this.juncts = [];
    this.numInputs = numInputs || 2;
    var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension = {'row': size, 'col': (size + 1)};

    this.outPt = 2;
};
OR.prototype = new Drawable();

/*****************************************************************************
 * CHANGE SIZE
 *  Changes the size of the gate based on numInputs
 ****************************************************************************/
OR.prototype.changeSize = function() {
    var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension = {'row': size, 'col': (size + 1)};
}

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
OR.prototype.draw = function(context, lineColor) {
    var factor = Math.floor(this.numInputs / 2);
    
    // Draw wires
    this.drawWires(context);
    
    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth = 2;
    
    // Draw gate
    var factor = Math.floor(this.numInputs / 2); 
    var gsf = digsim.GRID_SIZE * factor;
    
    context.moveTo(0, 0);
    context.lineTo(gsf,  0);            
    
    // VECTOR CALCULUS... good luck. :)
    
    var t = 0.28;               // SET THIS TO CHANGE CURVATURE
    var baseCurveature = 1.15;  // SET THIS TO CHANGE BASE CURVATURE
    var height = 2 * factor + 1;    // Height (in grids) of gate
    var x0 = gsf;                   // (x0, y0) = starting point
    var y0 = 0;
    var y1 = height * digsim.GRID_SIZE / 2; // (x1, y1) = ending point
    var x1 = y1 * 2 + digsim.GRID_SIZE;
    var xc = (x0 + x1) / 2;   // (xc, yc) = midpoint between start and end point
    var yc = (y0 + y1) / 2;
    var x = (y1 - y0) * t + xc; // The x coordinate of the parameterization
    var y = (x0 - x1) * t + yc; // The y coordinate of the parameterization
    
    context.quadraticCurveTo(x, y, x1, y1);
    
    x0 = x1;
    y0 = y1;
    x1 = gsf;
    y1 = height * digsim.GRID_SIZE;
    xc = (x0 + x1) / 2;
    yc = (y0 + y1) / 2;
    x = (y1 - y0) * t + xc;
    y = (x0 - x1) * t + yc;
    
    context.quadraticCurveTo(x, y, x1, y1);

    context.lineTo(0, y1);
    
    // Base curve
    context.quadraticCurveTo(digsim.GRID_SIZE * baseCurveature, y1 / 2, 
                             0, 0);
    context.stroke();
    context.fill();
    context.restore();
    
    for (var i = 0; i < this.juncts.length; ++i) {
        // console.log(".onSjunct:…………………………………………");
        // console.log("ROW: " + this.row + " COL: " + this.column);

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
 *  ANDs all the input wires together to set the current state of the gate. 
 ****************************************************************************/
OR.prototype.computeLogic = function() {
    var computedState = this.prev[0].state; 
    
    for (var i = 1; i < this.numInputs; ++i) {
        computedState = computedState || (this.prev[i] ? this.prev[i].state : 0);
        console.log("PREV["+i+"].state: " + (this.prev[i] ? this.prev[i].state : 0));
    }
    this.state = computedState;
};




