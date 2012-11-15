/*****************************************************************************
 * Program: 
 *  switch.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function Switch() {
    this.type = digsim.SWITCH;
    this.next = [];
    this.connections = [];
    this.state = 0;
    this.dimension = {'row': 3, 'col': 1};
    this.visited = 0;
    this.visitLimit = 1;
    this.conRow = 1;
    this.conCol = 1;
};

Switch.prototype = new Drawable();

/****************************************************************************
 * DRAW
 *  Draws a wire on a grid space
 ***************************************************************************/
Switch.prototype.draw = function(context) {
    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    
    context.fillStyle = '#FFFFFF';
    context.lineWidth = 2;
    
    context.moveTo(0, 0);
    context.beginPath();
    
    // draw 1 and line thingy
    context.moveTo(digsim.GRID_SIZE / 4, digsim.GRID_SIZE / 4 * 3);
    context.lineTo(digsim.GRID_SIZE / 4, digsim.GRID_SIZE / 4 * 5);
    context.moveTo(digsim.GRID_SIZE / 4, digsim.GRID_SIZE);
    context.lineTo(digsim.GRID_SIZE * 3 / 4, digsim.GRID_SIZE);
    
    // draws connection to 1 or 0
    if (this.state) {
        context.lineTo(digsim.GRID_SIZE / 4 * 5, digsim.GRID_SIZE / 2 * 3);
        context.moveTo(digsim.GRID_SIZE * 3 / 4 , digsim.GRID_SIZE * 2);

    }
    else {
        context.moveTo(digsim.GRID_SIZE / 4 * 5, digsim.GRID_SIZE / 2 * 3);
        context.lineTo(digsim.GRID_SIZE * 3 / 4, digsim.GRID_SIZE * 2);
    }
    
    context.lineTo(digsim.GRID_SIZE / 2, digsim.GRID_SIZE * 2);
    context.stroke();

    context.beginPath();
    
    context.arc(digsim.GRID_SIZE / 4, digsim.GRID_SIZE * 2, digsim.GRID_SIZE / 4, 0, 2 * Math.PI);
    
    context.stroke();
    context.fill();

    context.beginPath();
    context.moveTo(digsim.GRID_SIZE / 4 * 5, digsim.GRID_SIZE / 2 * 3);
    context.lineTo(digsim.GRID_SIZE * 1.5, digsim.GRID_SIZE / 2 * 3);

    context.stroke();
    context.restore();
};


