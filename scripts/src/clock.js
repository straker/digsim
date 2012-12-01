/*****************************************************************************
 * Program: 
 *  clock.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function Clock() {
    this.type = digsim.CLOCK;
    this.next = [];
    this.connections = [];
    this.juncts = [];
    this.state = 0;
    this.dimension = {'row': 3, 'col': 2};    
    this.visited = 0;
    this.conRow = 1;
    this.conCol = 2;
    this.visitLimit = 1;
    this.junct = 0;
};

Clock.prototype = new Drawable();

/****************************************************************************
 * DRAW
 *  Draws a wire on a grid space
 ***************************************************************************/
Clock.prototype.draw = function(context) {

        // SQUARE CLOCK
    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    
    context.fillStyle = '#FFFFFF';
    context.lineCap = 'round';
    context.lineWidth = 2;

    // Outside rectangle
    context.rect(0, digsim.GRID_SIZE * 0.75, digsim.GRID_SIZE * 2, digsim.GRID_SIZE * 1.5);
    context.fill();
    context.stroke();

    // Inside triangle
    context.beginPath();
    context.moveTo(digsim.GRID_SIZE * 2, digsim.GRID_SIZE * 1.25);
    context.lineTo(digsim.GRID_SIZE * 1.75, digsim.GRID_SIZE * 1.5);
    context.lineTo(digsim.GRID_SIZE * 2, digsim.GRID_SIZE * 1.75);
    context.stroke();

    // Clock signal
    context.beginPath();
    context.moveTo(digsim.GRID_SIZE * 5 / 3, digsim.GRID_SIZE );
    context.lineTo(digsim.GRID_SIZE * 5 / 3, digsim.GRID_SIZE * 2);
    context.lineTo(digsim.GRID_SIZE        , digsim.GRID_SIZE * 2);
    context.lineTo(digsim.GRID_SIZE        , digsim.GRID_SIZE);
    context.lineTo(digsim.GRID_SIZE / 3    , digsim.GRID_SIZE);
    context.lineTo(digsim.GRID_SIZE / 3, digsim.GRID_SIZE * 2);
    // context.lineTo(digsim.GRID_SIZE * 9 / 16, digsim.GRID_SIZE * 2);
    // context.lineTo(digsim.GRID_SIZE * 9 / 16, digsim.GRID_SIZE);
    // context.lineTo(digsim.GRID_SIZE * 0.25, digsim.GRID_SIZE);
    // context.lineTo(digsim.GRID_SIZE * 0.25, digsim.GRID_SIZE * 2);
    context.fill();
    context.stroke();

    // Connection
    context.moveTo(digsim.GRID_SIZE * 2, digsim.GRID_SIZE * 1.5);
    context.lineTo(digsim.GRID_SIZE * 2.5, digsim.GRID_SIZE * 1.5);
    context.stroke();
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


