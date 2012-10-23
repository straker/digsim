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
    
    console.log("======WIRE======");
    console.log(this);
    this.connectOffset.x = (this.startPos % 2 && this.dx == 1 ? -1 : 0);
    this.connectOffset.y = (!(this.startPos % 2) && this.dy == 1 ? -1 : 0);
    if (this.path.length) {
        this.connectOffset.endX = this.path[this.path.length - 1].x + (this.endPos % 2 && this.dx == -1 ? -1 : 0);
        this.connectOffset.endY = this.path[this.path.length - 1].y + (!(this.endPos % 2) && this.dy == -1 ? -1 : 0);
    }
    this.connectPoint.x = this.column + this.connectOffset.x;
    this.connectPoint.y = this.row + this.connectOffset.y;
    console.log("UPDATE: (" + this.connectPoint.x + ", " + this.connectPoint.y + ")");
    this.connectPoint.endX = this.column + this.connectOffset.endX;
    this.connectPoint.endY = this.row + this.connectOffset.endY;
    console.log("WIRE UPDATE END: (" + this.connectPoint.endX + ", " + this.connectPoint.endY + ")\n\n");
};

/*****************************************************************************
 * CHECK CONNECTION
 *  Checks adjacent spaces for other objects to connect to
 ****************************************************************************/
Wire.prototype.checkConnect = function() {
    
    console.log("SETP 0");
    console.log(this);
    if (obj = digsim.placeholder[Math.floor(this.connectPoint.y)][Math.floor(this.connectPoint.x)]) {
        console.log("STEP 1");
        var conObj = digsim.components[obj.ref];
        console.log(conObj);
        if (conObj.type === digsim.LED || conObj.type === digsim.SWITCH) {
            console.log("STEP 2");
            
            console.log(conObj.connectPoint.x == this.column);
            console.log(conObj.connectPoint.y == this.row);
            if (conObj.connectPoint.x == this.column && conObj.connectPoint.y == this.row) {
                console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                this.connections.push(conObj);
                conObj.connections.push(this);

                
            }
        }
    }
    
    if (obj = digsim.placeholder[Math.floor(this.connectPoint.endY)][Math.floor(this.connectPoint.endX)]) {
        console.log("STEP 1");
        var conObj = digsim.components[obj.ref];
        console.log(conObj);
        if (conObj.type === digsim.LED || conObj.type === digsim.SWITCH) {
            console.log("STEP 2");
            
            console.log(conObj.connectPoint.x == this.column);
            console.log(conObj.connectPoint.y == this.row);
            if (conObj.connectPoint.x == this.path[this.path.length - 1].x + this.column && 
                    conObj.connectPoint.y == this.path[this.path.length - 1].y + this.row) {
                console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                this.connections.push(conObj);
                conObj.connections.push(this);

            }
        }
    }
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