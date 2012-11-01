/*****************************************************************************
 * Program: 
 *  and-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function NAND(numInputs) {
    this.type = digsim.NAND;
    this.next = [];
    this.prev = [];
    this.state = 0;
    this.connections = [];
    this.numInputs = numInputs || 2;
    var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension = {'row': size, 'col': size};
    
    this.visitLimit = 2 * this.numInputs;
    this.visited = 0;
    
    var factor = Math.floor(this.numInputs / 2); 
    
    for (var i = 0; i < this.numInputs; ++i) {
        var wire = new Wire();
        this.setPrev(wire);
        wire.init(0, 0, 0, digsim.iComp);
        digsim.components[digsim.iComp++] = wire;
        wire.connections.push(this);
        // Reset wire path
        wire.path = [];
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

NAND.prototype = new Drawable();

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
NAND.prototype.draw = function(context) {
    
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
    
    this.next[0].column = this.column + (factor * 2) + 1;
    this.next[0].row = this.row + factor + .5;    
    this.next[0].draw(context);
    this.next[0].updatePos();

    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.lineWidth = 2;
    
    // Draw gate
    var gsf = digsim.GRID_SIZE * factor;
    
    context.moveTo(0, 0);
    context.lineTo(gsf,  0);            
    
    // var P0x = gsf;
    // var P0y = 0;
    // var P1x = gsf;
    var P1y = gsf * 2 + digsim.GRID_SIZE;
    // var Mx  = P1y;
    // var My  = P1y / 2;
    // var C0y = gsf;
    var Cx = (4 * P1y - gsf) / 3;
    // var C1y = gsf;
    context.bezierCurveTo(Cx, 0, Cx, P1y, gsf, P1y);
    context.lineTo(0, P1y);
    
    context.closePath();
    context.stroke();
    context.fill();
    
    context.moveTo(digsim.GRID_SIZE * 10 / 3, digsim.GRID_SIZE * 1.5);
    context.beginPath();
    
    context.arc(digsim.GRID_SIZE / 6 + (2 * factor + 1) * digsim.GRID_SIZE, (factor + 0.5) * digsim.GRID_SIZE,  // center
                digsim.GRID_SIZE / 6, 0, 
                2 * Math.PI);
    context.fill();
    context.stroke();

    context.restore();
};

// Infallable logic function
/*****************************************************************************
 * COMPUTE LOGIC
 *  ANDs all the input wires together and then inverts that to set the 
 * current state of the gate. 
 ****************************************************************************/
NAND.prototype.computeLogic = function() {
    var computedState = this.prev[0].state; 
    
    for (var i = 1; i < this.numInputs; ++i) {
        computedState = computedState && this.prev[i].state;
    }
    this.state = !computedState;
};