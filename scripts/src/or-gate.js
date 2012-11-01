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
    this.next = [];
    this.prev = [];
    this.connections = [];
    this.state = 0;
    this.numInputs = numInputs || 2;
    this.connectPoint = {'x': -1, 'y': -1};
    var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension = {'row': size, 'col': (size + 1)};
    
    this.visitLimit = 2 * this.numInputs;
    this.visited = 0;
    
    var factor = Math.floor(this.numInputs / 2); 
    
    this.connectOffset.x = (factor * 2) + 2;
    this.connectOffset.y = factor;
    
    
    for (var i = 0; i < this.numInputs; ++i) {
        var wire = new Wire();
        this.setPrev(wire);
        wire.init(0, 0, 0, digsim.iComp);
        digsim.components[digsim.iComp++] = wire;
        wire.connections.push(this);
        // Reset wire path
        wire.path = [];
        wire.path.push({'x': 1, 'y': 0});
        wire.path.push({'x': -1, 'y': 0});
        wire.startPos = 1;
        wire.endPos = 1;
        wire.dx = -1;
        
    }
    var wire = new Wire();
    this.setNext(wire);
    this.connections[0] = wire;
    wire.init(0, 0, 0, digsim.iComp);
    digsim.components[digsim.iComp++] = wire;
    
    // Reset wire path
    wire.path = [];
    wire.path.push({'x': 1, 'y': 0});
    wire.startPos = 1;
    wire.endPos = 1;
    wire.dx = 1;
    
};

OR.prototype = new Drawable();

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
OR.prototype.draw = function(context) {
    var factor = Math.floor(this.numInputs / 2);
    
    // Draw wires
    var cnt = 0;
    for (var i = 0; i < this.numInputs; ++i) {
        if (i % 2) { 
            this.prev[i].column = this.column;
            this.prev[i].row = this.row + (factor * 2) + .5 - cnt++;
        }
        else {
            this.prev[i].column = this.column;
            this.prev[i].row = this.row + cnt + .5;
        }
        
        this.prev[i].draw(context);
        this.prev[i].updatePos();
    }
    
    this.next[0].column = this.column + (factor * 2) + 2;
    this.next[0].row = this.row + factor + .5;
    
    this.next[0].draw(context);
    this.next[0].updatePos();
    
    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    context.beginPath();
    context.fillStyle = '#FFFFFF';
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
    
    
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  ANDs all the input wires together to set the current state of the gate. 
 ****************************************************************************/
OR.prototype.computeLogic = function() {
    var computedState = this.prev[0].state; 
    
    for (var i = 1; i < this.numInputs; ++i) {
        computedState = computedState || this.prev[i].state;
    }
    this.state = computedState;
};




