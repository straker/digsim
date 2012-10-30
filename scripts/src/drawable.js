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
    this.connections = [];
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
    
    if (this.type < 0) { // Houston, we have a gate...
        
        var cnt = 0;
        var factor = Math.floor(this.numInputs / 2); 
        
        for (var i = 0; i < this.numInputs; ++i) {
            if (i % 2) { 
                this.prev[i].init(this.column, this.row + (factor * 2) + .5 - cnt++, row, this.prev[i].id);
            }
            else {
                this.prev[i].init(this.column, this.row + cnt + .5, rot, this.prev[i].id);
            }
            this.prev[i].drawStatic = false;
        }
        this.next[0].init(this.column + this.dimension.col, this.row + factor + .5, rot, this.next[0].id);
        this.next[0].drawStatic = false;
    }
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
                this.connections.push(conObj);
                    conObj.connections.push(this);
                
            }
        }
    }
    
    if (this.type < 0) { // gate
        for (var i = 0; i < this.numInputs; ++i) {
            this.prev[i].checkConnect();
        }
        this.next[0].checkConnect();
    }
};

/******************************************************************************
 * PASS STATE
 *  Passes the state of the current object to the next object (be it a wire, 
 *  gate, LED, etc). 
 *****************************************************************************/
Drawable.prototype.passState = function(pState) {
    if (this.type < 0) {
        this.computeLogic();
        this.next[0].passState(this.state);
    }
    else {
        this.state = pState;
        for (iWire in this.next) {
            this.next[iWire].passState(pState);
        }
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

/******************************************************************************
 * TRAVERSE
 *  Iterate through each connection and set it's nexts and prevs to what they
 *  need to be. Called before sim-mode. 
 *****************************************************************************/
Drawable.prototype.traverse = function() {
    
    var conQueue = [];
    // Always done on switches, so guaranteed to have only 1 next. 
    conQueue.push(this.connections[0]);
    this.setNext(this.connections[0]);
    
    while (conQueue.length) {
        console.log("\n======START=====");
        console.log(conQueue[0]);
        
        for (var i = 0; i < conQueue[0].connections.length; ++i) {
            
            var currObject = conQueue[0];
            var con = currObject.connections[i];
            
            console.log("THIS.CONNECTIONS[" + i + "]: ");
            console.log(currObject.connections[i]);
            
            console.log("THIS.PREV:");
            console.log(currObject.prev);
            
            console.log("$.inArray(con, conQueue[0].prev) = " + ($.inArray(con, currObject.prev)));
            
            //  $ <- jquery stuff
            if ($.inArray(con, currObject.prev) === -1) { // connection is not part of the previous
                                                    // don't set its next to its previous
                console.log("CON.TYPE: " + con.type);
                console.log(con);
                
                if (con.type === digsim.SWITCH) {
                    alert("ERROR! Multiple switches driving one wire");
                    console.log("ERROR! Multiple switches driving one wire");
                    return;
                }
                else if (con.type === digsim.LED) {
                    currObject.setNext(con);
                }
                else if (con.type === digsim.WIRE) {
                    if (currObject.type > 0) {
                        currObject.setNext(con);
                        console.log("NOT A GATE");
                    }
                    conQueue.push(con);
                }
                else if (con.type < 0) {// Gates have a negative index
                    
                    console.log(con.next[0].next[0]);
                    if (typeof con.next[0].next[0] === "undefined") {
                        conQueue.push(con);
                    }
                }           
                else {
                    console.log("UNKNOWN CASE IN TRAVERSE() FUNCTION");
                }
            }
        }
        conQueue.shift();
    }

    // RECURSIVE VERSION OF traverse(), WHICH IS TOO ROBUST FOR JAVASCRIPT
    // BTW, this works perfectly
    
    /*
    console.log("\n======START=====");
    console.log(this);

    for (var i = 0; i < this.connections.length; ++i) {
        var con = this.connections[i];
        
        console.log("THIS.CONNECTIONS[" + i + "]: ");
        console.log(this.connections[i]);
        
        console.log("THIS.PREV:");
        console.log(this.prev);
        
        console.log("$.inArray(con, this.prev) = " + ($.inArray(con, this.prev)));
        //  $ <- jquery stuff
        if ($.inArray(con, this.prev) === -1) { // connection is not part of the previous
                                                // don't set its next to its previous
            console.log("CON.TYPE: " + con.type);
            console.log(con);
            
            if (con.type === digsim.SWITCH) {
                alert("ERROR! Multiple switches driving one wire");
                console.log("ERROR! Multiple switches driving one wire");
                return;
            }
            else if (con.type === digsim.LED) {
                this.setNext(con);
            }
            else if (con.type === digsim.WIRE) {
                if (this.type > 0) {
                    this.setNext(con);
                    console.log("NOT A GATE");
                }
                con.traverse();
            }
            else if (con.type < 0) {// Gates have a negative index
                
                console.log(con.next[0].next[0]);
                if (typeof con.next[0].next[0] === "undefined") {
                    con.traverse();
                }
            }           
            else {
                console.log("UNKNOWN CASE IN TRAVERSE() FUNCTION");
            }
        }
    }
    
    return;
     */
    
    
};
