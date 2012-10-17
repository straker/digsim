/*******************************************************************************
 * Program: 
 *  wire.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ******************************************************************************/

function Wire() {
    this.type = digsim.WIRE;
    this.next = [];
    this.prev = [];
    this.path = [];
    this.state = 0;
};

Wire.prototype = new Drawable();

/******************************************************************************
 * DRAW
 *  Draws a wire on a grid space
 *****************************************************************************/
Wire.prototype.draw = function(context) {
    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);

    context.beginPath();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    
    context.moveTo(0, 0);
    for (var i = 0; i < this.path.length; ++i) {
        context.lineTo(this.path[i].x * digsim.GRID_SIZE, this.path[i].y * digsim.GRID_SIZE);
    }
    context.stroke();
    context.restore();
};