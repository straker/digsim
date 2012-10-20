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
    this.state = 0;
    this.conOffsetX = 2;
    this.conOffsetY = 1;
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
    
    context.moveTo(digsim.GRID_SIZE / 4, digsim.GRID_SIZE / 4 * 3);
    context.lineTo(digsim.GRID_SIZE / 4, digsim.GRID_SIZE / 4 * 5);
    context.moveTo(digsim.GRID_SIZE / 4, digsim.GRID_SIZE);
    context.lineTo(digsim.GRID_SIZE, digsim.GRID_SIZE);
    
    if (this.state) {
        context.lineTo(digsim.GRID_SIZE / 2 * 3, digsim.GRID_SIZE / 2 * 3);
    }
    else {
        context.moveTo(digsim.GRID_SIZE / 2 * 3, digsim.GRID_SIZE / 2 * 3);
    }
    
    context.lineTo(digsim.GRID_SIZE * 2, digsim.GRID_SIZE / 2 * 3);
    context.moveTo(digsim.GRID_SIZE / 2 * 3, digsim.GRID_SIZE / 2 * 3);
    
    if (!this.state) {
        context.lineTo(digsim.GRID_SIZE, digsim.GRID_SIZE * 2);
    }
    else {
        context.moveTo(digsim.GRID_SIZE, digsim.GRID_SIZE * 2);
    }

    context.lineTo(digsim.GRID_SIZE / 2, digsim.GRID_SIZE * 2);
    context.stroke();

    context.beginPath();
    
    context.arc(digsim.GRID_SIZE / 4, digsim.GRID_SIZE * 2, digsim.GRID_SIZE / 4, 0, 2 * Math.PI);
    
    context.stroke();
    context.fill();
    context.restore();
};

/*****************************************************************************
 * CHECK CONNECTION
 *  Checks adjacent spaces for other objects to connect to
 ****************************************************************************/
Switch.prototype.checkConnect = function() {
    
    if (obj = digsim.placeholder[this.connectPtY][this.connectPtX]) {
        console.log("STEP 1");
        var conObj = digsim.components[obj.ref];
        if (conObj.type === digsim.WIRE) {
            console.log("STEP 2");
            
            if (conObj.row === this.connectPtY + 0.5 ||
                conObj.path[conObj.path.length - 1] === this.connectPtY + 0.5) {
                console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                
            }
        }
    }
};