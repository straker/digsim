/*******************************************************************************
 * Program: 
 *  xor-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ******************************************************************************/

function DFF(numInputs) {
    this.type = undefined; //digsim.DFF;
    this.name = 'DFF';
    
    this.next = [];
    this.prev = [];
    this.prevConnect = [];
    this.connections = [];
    this.juncts = [];
    this.numInputs = 2;
    this.dimension = {'row': 1, 'col': 1}; // 3, 2
    this.clockState = 0;
};

DFF.prototype = new Drawable();

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
DFF.prototype.draw = function(context, lineColor) {
    
    var fontSize = digsim.GRID_SIZE / 2;
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

    this.drawWires(context, lineColor);

    // Draw gate
    context.moveTo(0, 0);
    context.lineTo(2 * digsim.GRID_SIZE,  0);
    context.lineTo(2 * digsim.GRID_SIZE,  3 * digsim.GRID_SIZE);
    context.lineTo(0,  3 * digsim.GRID_SIZE);
    context.closePath();
    context.fill();
    context.font =  (digsim.GRID_SIZE / 2) + "px Arial";
    context.fontWidth = digsim.GRID_SIZE / 4;
    context.fillStyle = lineColor || 'black';

    // Font position based on bottom left of letter
    context.fillText("D", digsim.GRID_SIZE / 6, digsim.GRID_SIZE * 0.75);
    context.fillText("Q", digsim.GRID_SIZE * 1.375, digsim.GRID_SIZE * 0.75);
    context.fillText("Q", digsim.GRID_SIZE * 1.375, digsim.GRID_SIZE * 2.75);

    // Draw Q's bar
    context.moveTo(digsim.GRID_SIZE * 1.4, digsim.GRID_SIZE * 2.3);
    context.lineTo(digsim.GRID_SIZE * 1.75, digsim.GRID_SIZE * 2.3);

    // Draw Clock triangle
    context.moveTo(0, digsim.GRID_SIZE * 1.25);
    context.lineTo(digsim.GRID_SIZE / 4, digsim.GRID_SIZE * 1.5);
    context.lineTo(0, digsim.GRID_SIZE * 1.75);
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

// Infallable logic function
/*******************************************************************************
 * COMPUTE LOGIC
 *  Truth table: *** changes only on the rising edge of the clock
 *  Q   D   Qnext
 *  0   0   0
 *  0   1   1
 *  1   0   0
 *  1   1   1
 ******************************************************************************/
DFF.prototype.computeLogic = function() {  
    if (digsim.RISING_EDGE && this.clockState) {
        this.state = this.D;
    }
};

