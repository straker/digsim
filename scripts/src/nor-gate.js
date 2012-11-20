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
    this.next = [];
    this.prev = [];
    this.state = 0;
    this.connections = [];
    this.numInputs = numInputs || 2;
    var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension = {'row': size, 'col': (size + 1)};
    
    this.visitLimit = 2 * this.numInputs;
    this.visited = 0;    
    
    var factor = Math.floor(this.numInputs / 2); 
        
    for (var i = 0; i < this.numInputs; ++i) {
        var wire = new Wire();
        this.prev[i] = wire;
        wire.init(0, 0, 0, digsim.iComp);
        digsim.components[digsim.iComp++] = wire;
        wire.connections.push(this);
        // Reset wire path
        wire.path = [];
        wire.path.push({'x': -0.5, 'y': 0});
        wire.startPos = 1;
        wire.endPos = 1;
        wire.delta.x = -1;

    }
    var wire = new Wire();
    this.setNext(wire);
    this.connections[0] = wire;
    wire.init(0, 0, 0, digsim.iComp);
    digsim.components[digsim.iComp++] = wire;
    
    // Reset wire path
    wire.path = [];
    wire.path.push({'x': 0.5, 'y': 0});
    wire.startPos = 1;
    wire.endPos = 1;
    wire.delta.x = 1;
    
};


NOR.prototype = new Drawable();

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
NOR.prototype.draw = function(context) {
    
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

        // Finish wire path to gate (asthetics only)
        context.beginPath();
        context.moveTo(this.prev[i].column * digsim.GRID_SIZE, this.prev[i].row * digsim.GRID_SIZE);
        context.lineTo((this.prev[i].column + 0.6) * digsim.GRID_SIZE, this.prev[i].row * digsim.GRID_SIZE);
        context.fillStyle = '#FFFFFF';
        context.lineWidth = 2;
        context.stroke();
        
        this.prev[i].draw(context);
        this.prev[i].updatePos();
    }
    
    this.next[0].column = this.column + (factor * 2) + 2;
    this.next[0].row = this.row + factor + .5;
    // Reset wire path
    //this.next[0].path = [];
    //this.next[0].path.push({'x': 1, 'y': 0});
    
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
        computedState = computedState || this.prev[i].state;
    }
    this.state = !computedState;
};