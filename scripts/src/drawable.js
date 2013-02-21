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

function Drawable() {
    this.col = 0;
    this.drawStatic = true;
    this.id = 0;
    this.numInputs = 2;
    this.outPt = 0;
    this.rotation = 0;
    this.row = 0;
    this.state = 0;
    this.type = 0;
};

/******************************************************************************
 * INIT
 *  Initiates a drawable object at a given column, row, and rotation
 *****************************************************************************/
Drawable.prototype.init = function (col, row, rot, id) {
    this.col = col;
    this.drawStatic = true;
    this.id = id;
    this.rotation = rot;
    if (rot === 90 || rot === 270) {
        // Swap row/col
        this.dimension.row = this.dimension.row ^ this.dimension.col;
        this.dimension.col = this.dimension.row ^ this.dimension.col;
        this.dimension.row = this.dimension.row ^ this.dimension.col;
    }
    this.row = row;    
};

/*****************************************************************************
 * CHECK CONNECTION
 *  Checks adjacent spaces for other objects to connect to
 ****************************************************************************/
Drawable.prototype.checkConnect = function() {
    
    console.log("SETP 0");
    console.log(this);
    if (this.type >= 0) {
        console.log("STEP 1");
        var PH;
        // Endpoint contains a wire
        for (var i = 0; i < 4; ++i) {
            // Output wire
            utilMath = digsim.rotationMath(this, digsim.NEXT, 0, 0);
            conRow = utilMath.conRow;
            conCol = utilMath.conCol;

            console.log("ROW, COL: " + this.row + " " + this.col);
            console.log("CONROW, CONCOL: " + conRow + " " + conCol);
            if (PH = digsim.placeholder[conRow][conCol][i]) {
                console.log(PH);
                obj = digsim.components[PH.ref];
                if ((obj !== this) && ($.inArray(obj, this.connections) === -1) && PH.connectable) { // connection is not part of the previous
                    console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                    this.connections.push(obj);

                    utilMath = digsim.rotationMath(obj, digsim.PREV, 0, 0);
                    objConRow = utilMath.conRow;
                    objConCol = utilMath.conCol;
                    cnt = utilMath.cnt;
                    index = utilMath.index;

                    if (obj.type < 0) {
                        if (((obj.rotation / 90 % 2) && (conRow === objConRow)) || (((obj.rotation / 90) % 2) === 0) && (conCol === objConCol)) {
                            obj.prevConnect.push(this);
                        }
                        else  {
                            obj.connections.push(this);
                        }
                    }
                    else {
                        obj.connections.push(this);
                    }

                    this.juncts.push( { 'x': conCol, 'y': conRow } );
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

            utilMath = digsim.rotationMath(this, digsim.PREV, i, cnt);
            conRow = utilMath.conRow;
            conCol = utilMath.conCol;
            cnt = utilMath.cnt;

            console.log("•••••••conRow: " + conRow);
            console.log("•••••••conCol: " + conCol);
            for (var i = 1; i < 4; ++i) {
                if (PH = digsim.placeholder[conRow][conCol][i]) {
                    obj = digsim.components[PH.ref];
                    if ((obj !== this) && ($.inArray(obj, this.prevConnect) === -1) && PH.connectable) { // connection is not part of the previous
                        console.log("(*&$%($%)*&CONNECTION∂∆ƒ˙∂ƒ¬˚ß¨∂∫´");
                        this.prevConnect.push(obj);
                        obj.connections.push(this);
                        this.juncts.push( {'x': conCol, 'y': conRow} );
                    }
                }
            }
        }

        // Output wire
        utilMath = digsim.rotationMath(this, digsim.NEXT, i, cnt);
        conRow = utilMath.conRow;
        conCol = utilMath.conCol;
        cnt = utilMath.cnt;

        console.log("conCol:" + conCol);
        console.log("conRow:" + conRow);
        console.log("outPt:" + this.outPt);
        
        for (var i = 0; i < 4; ++i) {
            if (PH = digsim.placeholder[conRow][conCol][i]) {
                obj = digsim.components[PH.ref];
                if ((obj !== this) && ($.inArray(obj, this.connections) === -1) && PH.connectable) { // connection is not part of the previous
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
    if (this.type < 0) {
        this.computeLogic();
    }
    else {
        this.state = pState;            
    }

    if (typeof this.next[0] !== "undefined") {
        console.log("this.next.length = " + this.next.length);
        for (var i = 0, len = this.next.length; i < len; ++i) {
            console.log("");
            console.log(this);
            console.log("THIS.ID: " + this.id);
            console.log("THIS.NEXT[0]:");
            console.log(this.next[0]);
            console.log("THIS.NEXT[0].ID: " + this.next[0].id);
            console.log("PASSES STATE: " + pState);
            
            if (this.next[i].type < 0 || this.next[i].state !== this.state) {
                this.next[i].passState(this.state);
            }
        }
    }
    else if (this.type !== digsim.LED) {
        console.error("ERROR! Multiple drivers on 1 wire [passState()]");
        if (this.type === digsim.WIRE) {
            digsim.addMessage(digsim.WARNING, "[14]Warning: Unexpected end of wire.");
        }
    }
};

/******************************************************************************
 * DRAW WIRES
 *  Draws..... wires?
 *****************************************************************************/
Drawable.prototype.drawWires = function(context, lineColor) {
    // Draw wires
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth = 2;
    
    var factor = Math.floor(this.numInputs / 2) || 1;
    var cnt = 0;
    if (this.type == undefined) {
        if (this.name == "JKFF") {
            context.moveTo(0, digsim.GRID_SIZE * 2.5);
            context.lineTo(digsim.GRID_SIZE / -2, digsim.GRID_SIZE * 2.5);
        }
        context.moveTo(0, digsim.GRID_SIZE / 2);
        context.lineTo(digsim.GRID_SIZE / -2, digsim.GRID_SIZE / 2);
        context.moveTo(0, digsim.GRID_SIZE * 1.5);
        context.lineTo(digsim.GRID_SIZE / -2, digsim.GRID_SIZE * 1.5);
        context.moveTo(digsim.GRID_SIZE * 2, digsim.GRID_SIZE / 2);
        context.lineTo(digsim.GRID_SIZE * 2.5, digsim.GRID_SIZE / 2);
        context.moveTo(digsim.GRID_SIZE * 2, digsim.GRID_SIZE * 2.5);
        context.lineTo(digsim.GRID_SIZE * 2.5, digsim.GRID_SIZE * 2.5);   
    }
    else if (this.type != digsim.NOT) {
        for (var i = 0; i < this.numInputs; ++i) {
            if (i % 2) {
                context.moveTo(digsim.GRID_SIZE, digsim.GRID_SIZE * ((factor * 2) + .5 - cnt));
                context.lineTo(digsim.GRID_SIZE / -2, digsim.GRID_SIZE * ((factor * 2) + .5 - cnt++));
            }
            else {
                context.moveTo(digsim.GRID_SIZE, digsim.GRID_SIZE * (cnt + .5));
                context.lineTo(digsim.GRID_SIZE / -2, digsim.GRID_SIZE * (cnt + .5));
            }
        }
    }
    else {
        context.moveTo(digsim.GRID_SIZE, digsim.GRID_SIZE * (cnt + 1.5));
        context.lineTo(digsim.GRID_SIZE / -2, digsim.GRID_SIZE * (cnt + 1.5));
    }
    
    context.moveTo(((factor * 2) + this.outPt) * digsim.GRID_SIZE, digsim.GRID_SIZE * (factor + .5));
    context.lineTo(((factor * 2) + this.outPt + 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE * (factor + .5));
    
    context.stroke();
}

/******************************************************************************
 * DRAW WIRES
 *  Draws..... wires?
 *****************************************************************************
Drawable.prototype.drawWires = function(context, lineColor) {
     // Draw wires
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth = 2;

    var factor = Math.floor(this.numInputs / 2) || 1; 
    var cnt = 0;
    if (this.type != digsim.NOT) {
        for (var i = 0; i < this.numInputs; ++i) {
            if (i % 2) { 
                context.moveTo((this.col + 1) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + (factor * 2) + .5 - cnt));   
                context.lineTo((this.col - 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + (factor * 2) + .5 - cnt++));
            }
            else {
                context.moveTo((this.col + 1) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + cnt + .5));   
                context.lineTo((this.col - 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + cnt + .5));
            }
        }
    }
    else {
        context.moveTo((this.col + 1) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + cnt + 1.5));   
        context.lineTo((this.col - 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + cnt + 1.5));     
    }

    context.moveTo((this.col + (factor * 2) + this.outPt) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + factor + .5));
    context.lineTo((this.col + (factor * 2) + this.outPt + 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE * (this.row + factor + .5));   

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
        for (var i = 0, len = conQueue[0].connections.length; i < len; ++i) {
            
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
                if (con.type === digsim.SWITCH || con.type === digsim.CLOCK) {
                    console.error("ERROR! Multiple switches driving one wire [traverse()]");
                    digsim.addMessage(digsim.ERROR, "[16]Error: Multiple switches driving one wire.");
                    return false;
                }
                else if (con.type === digsim.LED) {
                    currObject.setNext(con);
                    //con.state = currObject.state;
                    console.log("CURRObject.setNext(con)");
                }
                else if (con.type === digsim.WIRE) {

                    if (typeof con.next[0] === "undefined" && !found) {
                        currObject.setNext(con);
                        //con.state = currObject.state;
                        conQueue.splice(1, 0, con);
                        console.log("conQueue.push(con)");
                    }
                }
                else if (con.type < 0) {// Gates have a negative index
                    
                    if ($.inArray(currObject, con.connections) !== -1) {
                        console.error("ERROR! Driver connected to gate output [traverse()]");
                        digsim.addMessage(digsim.ERROR, "[17]Error: Switch connected to the output of a gate.");
                        // Need to go back through the circuit and undo any nexts already set. 
                        return false;
                    }
                    else {
                        currObject.setNext(con);
                       // con.computeLogic();
                        if (typeof con.next[0] === "undefined") {
                            conQueue.splice(1, 0, con); // push_font()
                            console.log("conQueue.push(con):: (NEXT OF GATE NOT SET)");
                        }
                    }
                }           
                else {
                    console.log("UNKNOWN CASE IN TRAVERSE() FUNCTION");
                }
            }
            console.log("");
        }
        conQueue.shift();
    }
    return true;    
};
