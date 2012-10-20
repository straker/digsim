/*****************************************************************************
 * Program: 
 *  wire.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function Wire() {
    this.type = digsim.WIRE;
    this.next = [];
    this.prev = [];
    this.path = [];
    this.state = 0;
    
    this.endConOffsetX = -1;
    this.endConOffsetY = -1;
    this.endConPtX = -1;
    this.endConPtY = -1;
    
    // Represents orientation of the wire at start and end.
    this.startPos = -1; 
    this.endPos = -1;
    
    // Represents the direction that the wire has been drawn. (-1 or 1)
    this.dx = 0;   
    this.dy = 0;
};

Wire.prototype = new Drawable();

/******************************************************************************
 * UPDATE POSITION
 *  Update the position of the gate when dragged and dropped.
 *****************************************************************************/
Wire.prototype.updatePos = function() {
    
    // FIX THIS!
    console.log(this);
    this.conOffsetX = (!(this.startPos % 2) ? -this.dx : 0);
    this.conOffsetY = (this.startPos % 2 ? -this.dy : 0);
    if (this.path.length) {
        this.endConOffsetX = this.path[this.path.length - 1].x + (!(this.endPos % 2) ? this.dx : 0);
        this.endConOffsetY = this.path[this.path.length - 1].y + (this.endPos % 2 ? this.dy : 0);
    }
    this.connectPtX = Math.floor(this.column + this.conOffsetX);
    this.connectPtY = Math.floor(this.row + this.conOffsetY);
    console.log("UPDATE: (" + this.connectPtX + ", " + this.connectPtY + ")");
    this.endConPtX = this.column + this.endConOffsetX;
    this.endConPtY = this.row + this.endConOffsetY;
    console.log("WIRE UPDATE END: (" + this.endConPtX + ", " + this.endConPtY + ")");
};

/****************************************************************************
 * DRAW
 *  Draws a wire on a grid space
 ***************************************************************************/
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