/***************************************************************************
 * Program: 
 *  led.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 **************************************************************************/

function LED() {
    this.type = digsim.LED;
    this.prev = [];
    this.connections = [];
    this.connectOffset.x = 0.5;
    this.connectOffset.y = 2;
    this.state = 0;
    this.connectPoint = {'x': -1, 'y': -1};
    this.dimension = {'row': 2, 'col': 1};
    this.visited = 0;
    this.visitLimit = 1;
};

LED.prototype = new Drawable();

/****************************************************************************
 * DRAW
 *  Draws a wire on a grid space
 ***************************************************************************/
LED.prototype.draw = function(context) {
    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    context.fillStyle = '#FFFFFF';
    context.lineWidth = 2;

    // Fill LED light part
    context.beginPath();
    var P0x = digsim.GRID_SIZE / 8;
    var P0y = digsim.GRID_SIZE;
    var P1x = 7 * P0x;
    var P1y = P0y;
    var Mx  = digsim.GRID_SIZE / 2;
    var My  = P0x;
    var C0x = P0x;
    var Cy = (4 * My - P0y) / 3;
    var C1x = P1x;
    
    context.moveTo(P0x, P0y);
    context.bezierCurveTo(C0x, Cy, C1x, Cy, P1x, P1y); 
    
    if (this.state) {
        context.fillStyle = '#FF0000';
    }
    context.stroke();
    context.fill();

    // Bottom part
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    
    context.moveTo(0, digsim.GRID_SIZE);
    context.lineTo(digsim.GRID_SIZE, digsim.GRID_SIZE);
    
    context.stroke();
    
    context.beginPath();
    context.moveTo(digsim.GRID_SIZE * 7 / 8, digsim.GRID_SIZE);
    context.lineTo(digsim.GRID_SIZE * 7 / 8, digsim.GRID_SIZE * 5 / 3);
    context.lineTo(digsim.GRID_SIZE / 8, digsim.GRID_SIZE * 5 / 3);
    context.lineTo(digsim.GRID_SIZE / 8, digsim.GRID_SIZE);
    context.closePath();
    context.stroke();
    context.fill();
    
    context.moveTo(digsim.GRID_SIZE / 2, digsim.GRID_SIZE * 5 / 3);
    context.lineTo(digsim.GRID_SIZE / 2, digsim.GRID_SIZE * 5 / 3);
    context.lineTo(digsim.GRID_SIZE / 2, 2 * digsim.GRID_SIZE);
    context.stroke();
    
    context.restore();
};