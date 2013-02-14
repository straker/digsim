/*****************************************************************************
 * Program: 
 *  not-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function NOT() {
    this.type = digsim.NOT;
    this.name = 'NOT';
    
    this.next = [];
    this.prev = [];
    this.prevConnect = [];
    this.connections = [];
    this.juncts = [];
    this.numInputs = 1;
    this.dimension = {'row': 1, 'col': 2};

    this.outPt = 0; 
};
NOT.prototype = new Drawable();

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
NOT.prototype.draw = function(context, lineColor) {
    
    context.save();
    context.translate(this.col * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth = 2;
    
    // Rotatation
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
    
    // Draw wires
    context.beginPath();
    context.strokeStyle = lineColor || 'black';
    context.moveTo(digsim.GRID_SIZE * 2.5, digsim.GRID_SIZE * 0.5);
    context.lineTo(digsim.GRID_SIZE * -0.5, digsim.GRID_SIZE * 0.5);
    context.stroke();
    
    // Draw gate  
    context.beginPath();
    context.moveTo(0, -digsim.GRID_SIZE / 3);
    context.lineTo(digsim.GRID_SIZE * 1.625, digsim.GRID_SIZE * 0.5);
    context.lineTo(0, digsim.GRID_SIZE * 4 / 3);
    context.closePath();
    context.fill();
    context.stroke();
    
    // Draw circle
    context.beginPath();
    context.moveTo(digsim.GRID_SIZE * 1.75, digsim.GRID_SIZE * 0.5);
    context.beginPath();
    context.arc(digsim.GRID_SIZE * 1.8125, digsim.GRID_SIZE * 0.5, digsim.GRID_SIZE * 3 / 16, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
    context.restore();

    for (var i = 0; i < this.juncts.length; ++i) {
        // console.log(".onSjunct:…………………………………………");
        // console.log("ROW: " + this.row + " COL: " + this.col);

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
 *  NOTs all the input wires together to set the current state of the gate. 
 ****************************************************************************/
NOT.prototype.computeLogic = function() {
    this.state = !(this.prev[0] ? this.prev[0].state : 0);
    console.log("PREV[0].state: " + (this.prev[0] ? this.prev[0].state : 0));
};




