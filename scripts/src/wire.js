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
    this.connections = [];
    this.state = 0;
    
    this.connectOffset = {'x': -1, 'y': -1, 'endX': -1, 'endY': -1};
    this.connectPoint = {'x': -1, 'y': -1, 'endX': -1, 'endY': -1};
    
    this.visitLimit = 2;
    this.visited = 0;
    
    // Represents orientation of the wire at start and end.
    this.startPos = -1; 
    this.endPos = -1;

    // Junction dots drawn on certain intersection points
    this.eJunct = false;
    this.sJunct = false;
    
    // Represents the direction that the wire has been drawn. (-1 or 1)
    this.delta = {'x': 0, 'y': 0};
};

Wire.prototype = new Drawable();

/******************************************************************************
 * UPDATE POSITION
 *  Update the position of the gate when dragged and dropped.
 *****************************************************************************/
Wire.prototype.updatePos = function() {
    
    this.connectOffset.x = (this.startPos % 2 && this.delta.x == 1 ? -1 : 0);
    this.connectOffset.y = (!(this.startPos % 2) && this.delta.y == 1 ? -1 : 0);
    if (this.path.length) {
        this.connectOffset.endX = this.path[this.path.length - 1].x + (this.endPos % 2 && this.delta.x == -1 ? -1 : 0);
        this.connectOffset.endY = this.path[this.path.length - 1].y + (!(this.endPos % 2) && this.delta.y == -1 ? -1 : 0);
    }
    this.connectPoint.x = this.column + this.connectOffset.x;
    this.connectPoint.y = this.row + this.connectOffset.y;
    this.connectPoint.endX = this.column + this.connectOffset.endX;
    this.connectPoint.endY = this.row + this.connectOffset.endY;
};

/*****************************************************************************
 * CHECK CONNECTION
 *  Checks adjacent spaces for other objects to connect to
 ****************************************************************************/
Wire.prototype.checkConnect = function() {
    
    console.log("CHECKING CONNECTION!åß¨∑∫∂¬˚¨ß¬∂¥¬˚∆∂…øß∂ˆå¨•••••••••••••••••••••")
    var row = Math.floor(this.row); 
    var col = Math.floor(this.column);
    this.checkJunction(row, col, "start");

    row = Math.floor(this.path[0].y + this.row); 
    col = Math.floor(this.path[0].x + this.column);
    this.checkJunction(row, col, "end");
};

/*****************************************************************************
 * CHECK JUNCTION
 *  Checks connections for jucntions so we can add aesthetic dots. 
 ****************************************************************************/
Wire.prototype.checkJunction = function(row, col, pos) {
    var PH, obj, wireCnt = 0, dot = 0;
    // Endpoint contains a wire
    if (digsim.placeholder[row][col] instanceof Array) {
        // We want to connect. 
        for (var i = 0; i < 4; ++i) {
            if (PH = digsim.placeholder[row][col][i]) {
                obj = digsim.components[PH.ref];
                ++wireCnt;
                if ((obj !== this) && ($.inArray(obj, this.connections) === -1)) { // connection is not part of the previous
                    console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                    this.connections.push(obj);
                    obj.connections.push(this);

                    // Check for dots
                    if (obj.type === digsim.LED || obj.type === digsim.SWITCH) {

                        dot = 1;
                    }
                    else if ((obj.connections[0] && obj.connections[0].type < 0) || (obj.prev[0] && obj.prev[0].type < 0)) {
                        dot = 1;
                    }
                }
                if (wireCnt > 2) {
                    console.log("wireCnt > 1 £££££££££££££££££££££££££££££")
                    dot = 1;
                }

            }
        }
    }

    console.log(pos + " DOT: " + dot);
    if (pos === "start") {
        this.sJunct = dot;
    }
    else {
        this.eJunct = dot;
    }
}

/****************************************************************************
 * DRAW
 *  Draws a wire on a grid space
 ***************************************************************************/
Wire.prototype.draw = function(context) {
    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);

    context.beginPath();
    context.strokeStyle = '#000000';
    context.fillStyle = '#000000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    if (digsim.mode === digsim.SIM_MODE) {
        if (this.state) {
            context.strokeStyle = '#FF0000';
        }
        else {
            context.strokeStyle = '#0000FF';
        }
    }        

    context.moveTo(0, 0);
    for (var i = 0; i < this.path.length; ++i) {
        context.lineTo(this.path[i].x * digsim.GRID_SIZE, this.path[i].y * digsim.GRID_SIZE);
    }
    context.stroke();
    context.restore();


    if (this.eJunct) {
        console.log(".onEjunct:…………………………………………");
        row = this.path[0].y + this.row; 
        col = this.path[0].x + this.column;
        console.log("ROW: " + row + " COL: " + col);

        context.beginPath();
        context.strokeStyle = '#000000';
        context.fillStyle = '#000000';
        context.arc(col * digsim.GRID_SIZE, row * digsim.GRID_SIZE, 2, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
    }

    if (this.sJunct) {
        console.log(".onSjunct:…………………………………………");
        console.log("ROW: " + this.row + " COL: " + this.column);

        context.beginPath();
        context.strokeStyle = '#000000';
        context.fillStyle = '#000000';
        context.arc(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE, 2, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
    }

};

