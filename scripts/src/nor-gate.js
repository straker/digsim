/*****************************************************************************
 * Program: 
 *  nor-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function NOR(numInputs) {
    this.type = digsim.NOR;
    this.name = 'NOR';

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
NOR.prototype = new Drawable();

/*****************************************************************************
 * CHANGE SIZE
 *  Changes the size of the gate based on numInputs
 ****************************************************************************/
NOR.prototype.changeSize = function() {
    var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension = {'row': size, 'col': (size + 1)};
}

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
NOR.prototype.draw = function(context, lineColor) {
    
    this.drawWires(context, lineColor);
    
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
    
    // This is explained in or-gate.js
    
    var t = 0.28;               // SET THIS TO CHANGE CURVATURE
    var baseCurveature = 1.15;  // SET THIS TO CHANGE BASE CURVATURE
    var height = 2 * factor + 1;
    var x0 = gsf;
    var y0 = 0;
    var y1 = height * digsim.GRID_SIZE / 2;
    var x1 = y1 * 2 + digsim.GRID_SIZE;
    var xc = (x0 + x1) / 2;
    var yc = (y0 + y1) / 2;
    var x = (y1 - y0) * t + xc;
    var y = (x0 - x1) * t + yc;
    
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
    
    context.quadraticCurveTo(digsim.GRID_SIZE * baseCurveature, y1 / 2, 
                             0, 0);
    context.stroke();
    context.fill();
    
    context.beginPath();
    context.arc(digsim.GRID_SIZE / 6 + (2 * factor + 2) * digsim.GRID_SIZE, (factor + 0.5) * digsim.GRID_SIZE,  // center
                digsim.GRID_SIZE / 6, 0, 
                2 * Math.PI);
    context.fill();
    context.stroke();
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

// Infallable logic function
/*****************************************************************************
 * COMPUTE LOGIC
 *  ORs all the input wires together and then inverts them to set the 
 *  current state of the gate. 
 ****************************************************************************/
NOR.prototype.computeLogic = function() {
    var computedState = this.prev[0].state; 
    
    for (var i = 1; i < this.numInputs; ++i) {
        computedState = computedState || (this.prev[i] ? this.prev[i].state : 0);
        console.log("PREV["+i+"].state: " + (this.prev[i] ? this.prev[i].state : 0));
    }
    this.state = !computedState;
};