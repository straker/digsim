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
    this.name = 'AND';

    this.next = [];
    this.prev = [];
    this.prevConnect = [];
    this.connections = [];
    this.juncts = [];
    this.numInputs = numInputs || 2;
    var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension = {'row': size, 'col': size};

    this.outPt = 1;
};
AND.prototype = new Drawable();

/*****************************************************************************
 * CHANGE SIZE
 *  Changes the size of the gate based on numInputs
 ****************************************************************************/
AND.prototype.changeSize = function() {
    var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension = {'row': size, 'col': size};
}

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
AND.prototype.draw = function(context) {
     
    this.drawWires(context);   

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
AND.prototype.computeLogic = function() {
    var computedState = this.prev[0].state; 
    
    for (var i = 1; i < this.numInputs; ++i) {
        computedState = computedState && (this.prev[i] ? this.prev[i].state : 0);
        console.log("PREV["+i+"].state: " + (this.prev[i] ? this.prev[i].state : 0));
    }
    this.state = computedState;
};




