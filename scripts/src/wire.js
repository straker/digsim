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
    this.name = 'Wire';
    
    this.next = [];
    this.prev = [];
    this.path = [];
    this.connections = [];
    this.juncts = [];
};
Wire.prototype = new Drawable();

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
    console.log("CHECK JUNCT " + pos);
    if (digsim.placeholder[row][col] instanceof Array) {
        // We want to connect. 
        for (var i = 0; i < 4; ++i) {
            if (PH = digsim.placeholder[row][col][i]) {
                obj = digsim.components[PH.ref];
                ++wireCnt;
                if (obj !== this) { // connection is not already in the connections
                    if ($.inArray(obj, this.connections) === -1) {
                        console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                        this.connections.push(obj);
                        if (obj.type < 0) {
                            if (col < obj.column) {
                                obj.prevConnect.push(this);
                            }
                            else {
                                obj.connections.push(this);
                            }
                        }
                        else {
                            obj.connections.push(this);
                        }
                    }

                    // Check for dots
                    if (obj.type !== digsim.WIRE) {
                        this.juncts.push( { 'x': col, 'y': row } );
                        dot = 1;
                    }
                }
                if (wireCnt > 2) {
                    console.log("wireCnt > 1 £££££££££££££££££££££££££££££")
                    this.juncts.push( { 'x': col, 'y': row } );
                    dot = 1;
                }

            }
        }
        if (dot && pos === 'end') {
            //digsim.endWire = 1;
            digsim.dragging = 0;
        }
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

