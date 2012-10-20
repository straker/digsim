/******************************************************************************
 * Program: 
 *  drawable.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  Mother class for all objects drawable. 
 *****************************************************************************/

function Drawable(col, row, rot) {
    this.id = 0;

    this.connectOffset = {'x': -1, 'y': -1};
    this.connectPoint = {'x': -1, 'y': -1};

    this.column = 0;
    this.row = 0;
    this.type = -1;
    this.rotation = 0;
    this.numInputs = 2;
    this.next = [];
    this.prev = [];
    this.state = 0;
    this.drawStatic = true;
};

/******************************************************************************
 * INIT
 *  Initiates a drawable object at a given column, row, and rotation
 *****************************************************************************/
Drawable.prototype.init = function (col, row, rot, id) {
    this.column = col;
    this.row = row;
    this.rotation = rot;
    this.id = id;
    this.drawStatic = true;
    this.updatePos();
};

/******************************************************************************
 * UPDATE POSITION
 *  Update the position of the gate when dragged and dropped.
 *****************************************************************************/
Drawable.prototype.updatePos = function() {
    
    this.connectPoint.x = this.column + this.connectOffset.x;
    this.connectPoint.y = this.row + this.connectOffset.y;
    console.log("UPDATE: (" + this.connectPoint.x + ", " + this.connectPoint.y + ")");
};

/*****************************************************************************
 * CHECK CONNECTION
 *  Checks adjacent spaces for other objects to connect to
 ****************************************************************************/
Drawable.prototype.checkConnect = function() {
    
    console.log("SETP 0");
    console.log(this);
    if (obj = digsim.placeholder[Math.floor(this.connectPoint.y)][Math.floor(this.connectPoint.x)]) {
        console.log("STEP 1");
        var conObj = digsim.components[obj.ref];
        if (conObj.type === digsim.WIRE) {
            console.log("STEP 2");
            console.log(conObj);
            
            console.log(conObj.column == this.connectPoint.x);
            console.log(conObj.row === this.connectPoint.y);
            console.log(conObj.path[conObj.path.length - 1].x + conObj.column === this.connectPoint.x);
            console.log(conObj.path[conObj.path.length - 1].y + conObj.row === this.connectPoint.y);
            if ((conObj.column == this.connectPoint.x && conObj.row === this.connectPoint.y) ||
                (conObj.path[conObj.path.length - 1].x + conObj.column === this.connectPoint.x && 
                    conObj.path[conObj.path.length - 1].y + conObj.row === this.connectPoint.y)) {
                console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                
            }
        }
        else if (conObj.type === digsim.LED || conObj.type === digsim.SWITCH) {
            console.log("STEP 2");
            console.log(conObj);
            
            console.log(conObj.connectPoint.x == this.column);
            console.log(conObj.connectPoint.y == this.row);
            if ((conObj.connectPoint.x == this.column && conObj.connectPoint.y == this.row) || 
                (conObj.connectPoint.x == this.path[this.path.length - 1].x + this.column && 
                    conObj.connectPoint.y == this.path[this.path.length - 1].y + this.row)) {
                console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
            }
        }
    }
};

/******************************************************************************
 * PASS STATE
 *  Passes the state of the current object to the next object (be it a wire, 
 *  gate, LED, etc). 
 *****************************************************************************/
Drawable.prototype.passState = function(pState) {
    if (this.type === digsim.WIRE || 
        this.type === digsim.SWITCH || 
        this.type === digsim.LED) {
        this.state = pState;
        // To do: change color 
        for (iWire in this.next) {
            this.next[iWire].passState(pState);
        }
    }
    else { // always a gate
        this.computeLogic();
        this.next[0].passState(this.state);
    }
};


/******************************************************************************
 * SET NEXT
 *  Objects are doubly linked. Called when an object is dragged into place 
 *  and connected with another object.
 *****************************************************************************/
Drawable.prototype.setNext = function(obj) {
    this.next.push(obj);
    obj.prev.push(this);
};

/******************************************************************************
 * SET PREVIOUS
 *  Objects are doubly linked. Called when an object is dragged into place 
 *  and connected with another object.
 *****************************************************************************/
Drawable.prototype.setPrev = function(obj) {
    this.prev.push(obj);
    obj.next.push(this);
};

