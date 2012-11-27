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
    if ((this.type === digsim.LED) || (this.type === digsim.SWITCH)) {
        console.log("STEP 1");
        var PH;
        // Endpoint contains a wire
        for (var i = 1; i < 4; ++i) {
            if (PH = digsim.placeholder[this.conRow + this.row][this.conCol + this.column][i]) {
                obj = digsim.components[PH.ref];
                if ((obj !== this) && ($.inArray(obj, this.connections) === -1)) { // connection is not part of the previous
                    console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                    this.connections.push(obj);
                    obj.connections.push(this);

                    this.junct = 1;
                }
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
    if (this.visited++ < this.visitLimit) {
        if (this.type < 0) {
            this.computeLogic();
            this.next[0].passState(this.state);
        }
        else {
            this.state = pState;
            console.log(this);
            console.log("this.next[0]: ");
            console.log(this.next[0]);
            console.log("");
            if (typeof this.next[0] !== "undefined") {
                console.log("this.next.length = " + this.next.length);
                for (iWire in this.next) {                
                    this.next[iWire].passState(pState);
                }
            }
            else if (this.type !== digsim.LED) {
                console.log("Error! Multiple drivers on 1 wire");
            }
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
    
    for (var i = 0, len = this.connections.length; i < len; ++i) {
        conQueue.push(this.connections[i]);
        this.setNext(this.connections[i]);
    }

    while (conQueue.length) {
        console.log("\n======START=====");
        console.log(conQueue[0]);
        var len = conQueue[0].connections.length;
        for (var i = 0; i < len; ++i) {
            
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
                
                var found = false;
                for (var x = 0; x < con.prev.length; ++x) {
                    if ($.inArray(con.prev[x], currObject.prev) !== -1) {
                        found = true;
                        break;
                    }
                }
                if (con.type === digsim.SWITCH) {
                    console.log("ERROR! Multiple switches driving one wire");
                    return false;
                }
                else if (con.type === digsim.LED) {
                    currObject.setNext(con);
                    console.log("CURRObject.setNext(con)");
                }
                else if (con.type === digsim.WIRE) {
                    if (currObject.type >= 0 && typeof con.next[0] === "undefined" && !found) {
                        currObject.setNext(con);
                        console.log("NOT A GATE");
                        conQueue.splice(1, 0, con);
                        console.log("conQueue.push(con)");
                    }
                    else if (typeof con.next[0] === "undefined" && currObject.type < 0) {
                        conQueue.splice(1, 0, con);
                        console.log("conQueue.push(con)");
                    }
                }
                else if (con.type < 0) {// Gates have a negative index
                    
                    console.log(con.next[0].next[0]);
                    currObject.next.push(con);
                    if (typeof con.next[0].next[0] === "undefined") {
                        conQueue.splice(1, 0, con);
                        console.log("conQueue.push(con):: (NEXT OF GATE NOT SET)");
                    }
                }           
                else {
                    console.log("UNKNOWN CASE IN TRAVERSE() FUNCTION");
                }
                if (currObject.visitLimit > con.visitLimit) {
                    con.visitLimit = currObject.visitLimit;
                }
            }
            console.log("");
        }
        conQueue.shift();
    }
    return true;

/*
    // RECURSIVE VERSION OF traverse(), WHICH IS TOO ROBUST FOR JAVASCRIPT
    // BTW, this works perfectly
    
    
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
