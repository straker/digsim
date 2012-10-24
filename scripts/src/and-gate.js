/*****************************************************************************
 * Program: 
 *  and-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function AND(numInputs) {
    this.type = digsim.AND;
    this.next = [];
    this.prev = [];
    this.connections = [];
    this.state = 0;
    this.numInputs = numInputs || 2;
    this.connectPoint = {'x': -1, 'y': -1};
    
    var factor = Math.floor(this.numInputs / 2); 

    this.connectOffset.x = (factor * 2) + 2;
    this.connectOffset.y = factor;
    

    for (var i = 0; i < this.numInputs; ++i) {
        var wire = new Wire();
        this.setPrev(wire);
        wire.init(0, 0, 0, digsim.iComp);
        digsim.components[digsim.iComp++] = wire;
        wire.connections.push(this);
    }
    var wire = new Wire();
    this.setNext(wire);
    this.connections[0] = wire;
    wire.init(0, 0, 0, digsim.iComp);
    digsim.components[digsim.iComp++] = wire;
};

AND.prototype = new Drawable();

// Draws a generic gate... just a start.
/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
AND.prototype.draw = function(context) {
        
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
    context.restore();
  
    // Draw wires
    var cnt = 0;
    for (var i = 0; i < this.numInputs; ++i) {
        if (i % 2) { 
            this.prev[i].column = this.column;
            this.prev[i].row = this.row + (factor * 2) + .5 - cnt;
        }
        else {
            this.prev[i].column = this.column;
            this.prev[i].row = this.row + cnt + .5;
        }
        // Reset wire path
        this.prev[i].path = [];
        this.prev[i].path.push({'x': -1, 'y': 0});

        this.prev[i].draw(context);
    }
    this.next[0].column = this.column + (factor * 2) + 1;
    this.next[0].row = this.row + factor + .5;
    // Reset wire path
    this.next[0].path = [];
    this.next[0].path.push({'x': 1, 'y': 0});

    this.next[0].draw(context);
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  ANDs all the input wires together to set the current state of the gate. 
 ****************************************************************************/
AND.prototype.computeLogic = function() {
    var computedState = this.prev[0].state; 
    
    for (var i = 1; i < this.numInputs; ++i) {
        computedState = computedState && this.prev[i].state;
    }
    this.state = computedState;
};




