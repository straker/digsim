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
    this.name = 'Switch';

    this.numInputs = 0;
    this.numOutputs = 1;
    this.next = [];
    this.connections = [];
    this.juncts = [];
    this.dimension = {'row': 1, 'col': 1};

    this.conRow = 0;
    this.conCol = 1;
    this.conIndex = 3;
};
Switch.prototype = new Drawable();

/****************************************************************************
 * DRAW
 *  Draws a wire on a grid space
 ***************************************************************************/
Switch.prototype.draw = function(context, lineColor) {

    context.save();
    context.translate(this.col * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);

    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth = 2;

    // Rotatation
    var center = {'row': (this.dimension.row / 2) * digsim.GRID_SIZE,
        'col': (this.dimension.col / 2) * digsim.GRID_SIZE };
    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    context.moveTo(0, 0);

    // Draw 1
    context.moveTo(digsim.GRID_SIZE / 4, -digsim.GRID_SIZE / 4);
    context.lineTo(digsim.GRID_SIZE / 4, digsim.GRID_SIZE / 4);
    context.moveTo(digsim.GRID_SIZE / 4, 0);
    context.lineTo(digsim.GRID_SIZE * 3 / 4, 0);

    // Draw connection to 1 or 0
    if (this.state && digsim.mode === digsim.SIM_MODE) {
        context.lineTo(digsim.GRID_SIZE / 4 * 5, digsim.GRID_SIZE / 2);
        context.moveTo(digsim.GRID_SIZE * 3 / 4 , digsim.GRID_SIZE);

    }
    else {
        context.moveTo(digsim.GRID_SIZE / 4 * 5, digsim.GRID_SIZE / 2);
        context.lineTo(digsim.GRID_SIZE * 3 / 4, digsim.GRID_SIZE);
    }
    context.lineTo(digsim.GRID_SIZE / 2, digsim.GRID_SIZE);
    context.stroke();

    // Draw 0
    context.beginPath();
    context.arc(digsim.GRID_SIZE / 3, digsim.GRID_SIZE, digsim.GRID_SIZE / 5, 0, 2 * Math.PI);
    context.stroke();
    context.fill();

    // Connection
    context.beginPath();
    context.moveTo(digsim.GRID_SIZE / 4 * 5, digsim.GRID_SIZE / 2);
    context.lineTo(digsim.GRID_SIZE * 1.5, digsim.GRID_SIZE / 2);
    context.stroke();

    this.drawLabel(context, lineColor);

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


