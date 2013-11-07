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

    this.numInputs = 0;
    this.next = [];
    this.prev = [];
    this.path = {'x': 0, 'y': 0};
    this.startConnections = [];
    this.endConnections = [];
    this.connections = [];
    this.juncts = [];
    this.dy = 0;
    this.dx = 0;
};
Wire.prototype = new Drawable();

/*****************************************************************************
 * CHECK CONNECTION
 *  Checks adjacent spaces for other objects to connect to
 ****************************************************************************/
Wire.prototype.checkConnect = function() {

    console.log("CHECKING CONNECTION!åß¨∑∫∂¬˚¨ß¬∂¥¬˚∆∂…øß∂ˆå¨•••••••••••••••••••••")
    var row = Math.floor(this.row);
    var col = Math.floor(this.col);
    this.checkJunction(row, col, "start");

    row = Math.floor(this.path.y + this.row);
    col = Math.floor(this.path.x + this.col);
    this.checkJunction(row, col, "end");
};

/*****************************************************************************
 * CHECK JUNCTION
 *  Checks connections for junctions so we can add aesthetic dots.
 ****************************************************************************/
Wire.prototype.checkJunction = function(row, col, pos) {
    var PH, obj, wireCnt = 0, dot = 0;
    // Endpoint contains a wire
    console.log("CHECK JUNCT " + pos);
    if (digsim.placeholder[row][col] instanceof Array) {
        // We want to connect.
        var array = digsim.placeholder[row][col];
        for (var i = 0; i < 4; ++i) {
            if (PH = array[i]) {
                obj = digsim.components[PH.ref];
                if (PH.connectable) {
                    ++wireCnt;
                    if (obj !== this) {

                        // Wire merging and spliting
                        if (obj.type === digsim.WIRE) {
                            // Merge wires only if they both go in the same direction
                            if (this.dx === obj.dx && this.dy === obj.dy) {
                                // Merge wires only if there are no other wires in the same grid space
                                if (typeof array[(i+1)%4] === 'undefined' && typeof array[ (i-1) < 0 ? 3 : (i-1) ] === 'undefined') {
                                    console.log("∂ß∂ƒ©˙∆˚¬˚∆˙∆©ƒƒ© MERGE ß∂ƒ©˙∆˚¬……æ˚∆˙©ƒ∂©˙∆˚¬");

                                    // Get the four points of both wires
                                    var point1, point2, point3, point4, endpoint;
                                    point1 = {'x': this.col, 'y': this.row};
                                    point2 = {'x': obj.col, 'y': obj.row};
                                    point3 = {'x': this.col + this.path.x, 'y': this.row + this.path.y}
                                    point4 = {'x': obj.col + obj.path.x, 'y': obj.row + obj.path.y}

                                    // Update wire coordinates
                                    obj.row = Math.min(point1.y, point2.y);
                                    obj.col = Math.min(point1.x, point2.x);
                                    endpoint = {'x': Math.max(point3.x, point4.x), 'y': Math.max(point3.y, point4.y)};
                                    obj.path = {'x': Math.abs(endpoint.x - obj.col), 'y': Math.abs(endpoint.y - obj.row)};

                                    // Update wire connections
                                    digsim.deletePlaceholder(obj);
                                    digsim.deleteConnections(obj);
                                    digsim.setWirePlaceholders(obj, true);
                                    obj.checkConnect();

                                    // Remove new wire
                                    delete digsim.components[this.id];

                                    return;
                                }
                            }
                            // Wire spliting
                            else {
                                // Split a wire if it goes through the new connction
                                if (array[(i+2)%4] && obj.id === array[(i+2)%4].ref) {
                                    console.log("´∑´®†¥¨ˆøπ“ SPLIT œ∑´®†¥¨ˆø");

                                    // Update first wire
                                    console.log("{"+col+", "+row+"}");
                                    var endpoint = {'x': Math.floor(obj.col + obj.path.x - col), 'y': Math.floor(obj.row + obj.path.y - row)};
                                    obj.path = {'x': Math.floor(col - obj.col + 0.5), 'y': Math.floor(row - obj.row + 0.5)};
                                    console.log(obj);
                                    console.log("TEST");
                                    digsim.deletePlaceholder(obj);
                                    digsim.deleteConnections(obj);
                                    digsim.setWirePlaceholders(obj, true);
                                    obj.checkConnect();

                                    // Create new wire
                                    var wire = new Wire();
                                    wire.init(col + 0.5, row + 0.5, 0, digsim.iComp);
                                    wire.dx = obj.dx;
                                    wire.dy = obj.dy;
                                    wire.path = endpoint;
                                    console.log(wire);
                                    console.log("TEST");
                                    digsim.components[digsim.iComp++] = wire;
                                    digsim.setWirePlaceholders(wire, true);
                                    wire.checkConnect();
                                    digsim.drawComponents();
                                }
                            }
                        }

                        // connection is not already in the connections
                        if (($.inArray(obj, this.connections) === -1)) {
                            console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                            this.connections.push(obj);

                            if (pos === "start") {
                                this.startConnections.push(obj.id);
                                if (this.id === 3) {
                                    console.log("CONNECTED START");
                                }
                            }
                            else {
                                this.endConnections.push(obj.id);
                                if (this.id === 3) {
                                    console.log("CONNECTED END");
                                }
                            }
                            if (this.id === 3) {
                                console.log(pos);
                            }
                            if (obj.type === digsim.WIRE) {
                                console.log("THIS: {"+(row + 0.5)+","+(col + 0.5)+"}");
                                console.log("OBJ: {"+obj.row+","+obj.col+"}");
                                console.log("OBJ: {"+(obj.row + obj.path.y)+","+(obj.col + obj.path.x)+"}");

                                if (obj.row === (row + 0.5) && obj.col === (col + 0.5)) {
                                    console.log("OBJ CONNECTS AT ITS START");
                                    obj.startConnections.push(this.id);
                                }
                                else if (obj.row + obj.path.y === (row + 0.5) && obj.col + obj.path.x === (col + 0.5)) {
                                    console.log("OBJ CONNECTS AT ITS END");
                                    obj.endConnections.push(this.id);
                                }
                            }

                            // Special connections
                            if (obj.type === digsim.DFF || obj.type === digsim.JKFF) {
                                obj.namedConnections[PH.name] = this;
                            }

                            utilMath = digsim.utils.rotationMath(obj, digsim.PREV, 0, 0);
                            conRow = utilMath.conRow;
                            conCol = utilMath.conCol;
                            cnt = utilMath.cnt;
                            index = utilMath.index;

                            if (obj.type < 0) {
                                if (((obj.rotation / 90 % 2) && (row === conRow)) || (((obj.rotation / 90) % 2) === 0) && (col === conCol)) {
                                    obj.prevConnect.push(this);
                                }
                                else  {
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
Wire.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);

    context.beginPath();
    context.strokeStyle = lineColor || 'black';
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
    context.lineTo(this.path.x * digsim.GRID_SIZE, this.path.y * digsim.GRID_SIZE);
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