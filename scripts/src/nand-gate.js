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
    this.numInputs = numInputs || 2;
    
    for (var i = 0; i < this.numInputs; ++i) {
        var wire = new Wire();
        this.setPrev(wire);
    }
    var wire = new Wire();
    this.setNext(wire);
};

NAND.prototype = new Drawable();

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
NAND.prototype.draw = function(context) {
    
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
    
    context.moveTo(digsim.GRID_SIZE * 10 / 3, digsim.GRID_SIZE * 1.5);
    context.beginPath();
    context.arc(digsim.GRID_SIZE * 19 / 6, digsim.GRID_SIZE * 1.5, digsim.GRID_SIZE / 6, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    context.restore();
    
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