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

    // Rotate the wire from it's start point
    context.rotate(this.rotation * Math.PI / 180);

    context.beginPath();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    
    context.moveTo(0, 0);
    context.lineTo(digsim.GRID_SIZE, 0);
    context.stroke();
    context.restore();
};

/******************************************************************************
 * DRAW
 *  Draws half a wire on a grid space (used for corners)
 *****************************************************************************/
Wire.prototype.halfDraw = function(context) {
    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);

    // Rotate the wire from it's start point
    context.rotate(this.rotation * Math.PI / 180);

    context.beginPath();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    
    context.moveTo(0, 0);
    context.lineTo(digsim.GRID_SIZE / 2, 0);
    context.stroke();
    context.restore();
};
