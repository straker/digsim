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
    this.outPt = 1;
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

                    this.juncts.push( { 'x': (this.conCol + this.column), 'y': (this.conRow + this.row) } );
                }
            }
        }
    }
    else {
        console.log("STEP 1.5");
        var PH, cnt = 0, conRow, conCol;
        var factor = Math.floor(this.numInputs / 2) || 1; 
        console.log("THIS.NUMINPUTS: " + this.numInputs);
        // Endpoint contains a wire
        for (var j = 0; j < this.numInputs; ++j) {
            conCol = this.column - 1;
            if (this.type === digsim.NOT) {
                conRow = this.row + 1;
            }
            else {
                if (j % 2) { 
                    conRow = this.row + (factor * 2) - cnt++;
                }
                else {
                    conRow = this.row + cnt;
                }
            }
            console.log("conRow: " + conRow);
            console.log("conCol: " + conCol);
            for (var i = 1; i < 4; ++i) {
                if (PH = digsim.placeholder[conRow][conCol][i]) {
                    obj = digsim.components[PH.ref];
                    if ((obj !== this) && ($.inArray(obj, this.prevConnect) === -1)) { // connection is not part of the previous
                        console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                        this.prevConnect.push(obj);
                        obj.connections.push(this);
                        this.juncts.push( {'x': conCol, 'y': conRow} );
                    }
                }
            }
        }

        // Output wire
        conCol = this.column + factor * 2 + this.outPt;
        conRow = this.row + factor;
        console.log("\nOUTPUT WIRE:");
        console.log("CONCOL: " + conCol);
        console.log("CONROW: " + conRow);
        console.log("FACTOR: " + factor);
        console.log("OBJ.OUTPT: " + obj.outPt);
        console.log("OBJ.COLUMN: " + obj.column);
        console.log("OBJ.ROW: " + obj.row);
        for (var i = 1; i < 4; ++i) {
            if (PH = digsim.placeholder[conRow][conCol][i]) {
                obj = digsim.components[PH.ref];
                if ((obj !== this) && ($.inArray(obj, this.connections) === -1)) { // connection is not part of the previous
                    console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                    this.connections.push(obj);
                    obj.type < 0 ? obj.prevConnect.push(this) : obj.connections.push(this);
                    this.juncts.push( {'x': conCol, 'y': conRow} );
                }
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
                console.error("ERROR! Multiple drivers on 1 wire [passState()]");
            }
        }
    }
};

/******************************************************************************
 * DRAW WIRES
 *  Draws..... wires?
 *****************************************************************************/
Drawable.prototype.drawWires = function(context) {
     // Draw wires
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.lineWidth = 2;

    var factor = Math.floor(this.numInputs / 2) || 1; 
    var cnt = 0;
    if (this.type != digsim.NOT) {
        for (var i = 0; i < this.numInputs; ++i) {
            if (i % 2) { 
                context.moveTo((this.column + 1) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + (factor * 2) + .5 - cnt));   
                context.lineTo((this.column - 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + (factor * 2) + .5 - cnt++));
            }
            else {
                context.moveTo((this.column + 1) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + cnt + .5));   
                context.lineTo((this.column - 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + cnt + .5));
            }
        }
    }
    else {
        context.moveTo((this.column + 1) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + cnt + 1.5));   
        context.lineTo((this.column - 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + cnt + 1.5));     
    }


    var pt = this.type === NOR || this.type 
    context.moveTo((this.column + (factor * 2) + this.outPt) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + factor + .5));   
    context.lineTo((this.column + (factor * 2) + this.outPt + 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + factor + .5));   

    context.stroke();
}

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
                    console.error("ERROR! Multiple switches driving one wire [traverse()]");
                    return false;
                }
                else if (con.type === digsim.LED) {
                    currObject.setNext(con);
                    console.log("CURRObject.setNext(con)");
                }
                else if (con.type === digsim.WIRE) {

                    if (typeof con.next[0] === "undefined" && !found) {
                        currObject.setNext(con);
                        conQueue.splice(1, 0, con);
                        console.log("conQueue.push(con)");
                    }
                }
                else if (con.type < 0) {// Gates have a negative index
                    
                    if ($.inArray(currObject, con.connections) !== -1) {
                        console.error("ERROR! Driver connected to gate output [traverse()]");
                        // Need to go back through the circuit and undo any nexts already set. 
                        return false;
                    }
                    else {
                        currObject.setNext(con);
                        if (typeof con.next[0] === "undefined") {
                            conQueue.splice(1, 0, con); // push_font()
                            console.log("conQueue.push(con):: (NEXT OF GATE NOT SET)");
                        }
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
