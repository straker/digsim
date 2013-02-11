/*****************************************************************************
 * Program: 
 *  application.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  A fully functional circuit simulation program. 
 *
 * To-do:
 * pick up wires
 * Rotations
 * Reformat row/col of UI to handle adding new buttons better
 * Panning
 * auto-route
 * implement touch controls
 * D flip flop, JK flip flop, 2/4 to 1 MUX
 * save and load schematics/files
 * 
 ****************************************************************************/

/*****************************************************************************
 * DIGSIM
 *  Holds all the constants, animation, and data variables for the program
 ****************************************************************************/
function Digsim() {
    // Constants
    this.GRID_SIZE = 20;
    this.GRID_ZOOM = 5;
    this.MAX_GRID_SIZE = 50;
    this.MIN_GRID_SIZE = 5;
    this.HIT_RADIUS = .73333333;
    this.NUM_COLS = Math.floor((window.innerWidth - $('.canvases').position().left) / this.GRID_SIZE);
    this.NUM_ROWS = Math.floor((window.innerHeight - $('.canvases').position().top) / this.GRID_SIZE);
    this.CLK_FREQ = 60; 
    
    // Type identifiers
    this.AND = -1;  // Gates are negative because they have a special
    this.NAND = -2; // quality for simulation mode. Making them all
    this.OR = -3;   // negative will catch all gates
    this.NOR = -4;
    this.XOR = -5;
    this.NOT = -6;
    this.CLOCK = 5;
    this.WIRE = 6;
    this.SWITCH = 7;
    this.LED = 8;
    this.DEFAULT_MODE = 0;
    this.WIRE_MODE = 1;
    this.SIM_MODE = 2;
    this.PLACE_MODE = 3;
    this.WARNING = 0;
    this.ERROR = 1;
    
    // Wire identifiers
    this.TL = 0;    // top-left
    this.TR = 1;    // top-right
    this.BR = 2;    // bottom-right
    this.BL = 3;    // bottom-left
    this.MID = 4;   // connect wire to wire

    // Animation variables
    this.wirePos = {
        startX: -1, 
        startY: -1, 
        startPos: -1, 
    };
    this.dragging = false;
    this.draggingGate;
    this.lockH = 0;
    this.lockV = 0;
    this.clkCnt = 0;

    // Grid variables
    this.gridWidth = this.NUM_COLS * this.GRID_SIZE;
    this.gridHeight = this.NUM_ROWS * this.GRID_SIZE;
    this.mousePos = { x: -1, y: -1 };
    this.offsetCol = 0;
    this.offsetRow = 0;
    this.gridToggle = 0;

    // Gate identifier
    this.iComp = 0;
    this.numGateInputs = 2;
    this.prevGate = "";

    // Misc
    this.clipboard;
    this.selectedComponent;
    this.mode = 0;

    // Autorouting
    this.autoroute = false;    
    this.neighbors = [];
    this.Q = [];
    this.dist = [];
    this.prev = [];

    // Data arrays
    this.components = [];   // Holds all of the objects by their unique ID 
    this.drivers = [];      // Holds the place of the logic drivers in components[].
    this.placeholder = [];  // Holds component positions on grid
    for (var i = 0; i < this.NUM_COLS; ++i) {
        this.placeholder[i] = [];
        this.Q[i] = [];
        this.dist[i] = [];
    }
};

/*****************************************************************************
 * INIT
 *  Tests to see if the canvas is supported, returning true if it is
 ****************************************************************************/
Digsim.prototype.init = function() {
    // Get the canvas element
    this.gridCanvas = document.getElementById('grid');
    this.staticCanvas = document.getElementById('static');
    this.movingCanvas = document.getElementById('moving');
    
    // Test to see if canvas is supported
    if (this.gridCanvas.getContext) {

        // Canvas variables
        var canvasWidth = this.gridWidth + 1;
        var canvasHeight = this.gridHeight + 1;
        
        this.gridContext = this.gridCanvas.getContext('2d');
        this.staticContext = this.staticCanvas.getContext('2d');
        this.movingContext = this.movingCanvas.getContext('2d');
        
        this.gridCanvas.width = this.gridWidth;
        this.gridCanvas.height = this.gridHeight;
        this.staticCanvas.width = this.gridWidth;
        this.staticCanvas.height = this.gridHeight;
        this.movingCanvas.width = this.gridWidth;
        this.movingCanvas.height = this.gridHeight;
        
        return true;
    } else {
        return false;
    }
};

/*****************************************************************************
 * RUN
 *  Starts doing stuff (window.onload)
 ****************************************************************************/
Digsim.prototype.run = function() {
    $('.messages').css('height', this.gridHeight - 37);

    if(this.init()) {
        // onClick events
        $("canvas").on("mousedown", this.onGridMouseDown);
        $("canvas").on("mouseup", this.onGridMouseUp);
        $("canvas").on("click", this.onGridClicked);
        $("canvas").on("mousemove", this.onGridMouseMove);
        $(".gates a, .io a, .modes a").on("click", this.onButtonClicked);
        $("#New").on("click", this.newFile);
        $("#Toggle_Grid").on("click", this.toggleGrid);
        $("#Zoom_In").on("click", this.zoomIn);
        $("#Zoom_Out").on("click", this.zoomOut);
        $('#2-input, #3-input, #4-input').on("click", this.changeNumInputs);
        $('#Cut').on("click", this.cut);
        $('#Copy').on("click", this.copy);
        $('#Paste').on("click", this.paste);
        $('#Delete').on("click", this.delete);
        $('#Rotate_CCW').on("click", {dir: 270}, this.rotate);
        $('#Rotate_CW').on("click", {dir: 90}, this.rotate);

        // Set hotkey info on buttons
        var curr, hotkey;
        $("li a").each(function(index) {
            curr = $(this);
            hotkey = HOT_KEYS[curr.attr('id')]
            if (hotkey) {
                curr.attr('title', curr.attr('title') + " (" + hotkey + ")");
            }
        });

        /*** Temporary disable buttons as functionality is being worked out ****/
        this.disableButton("Open");
        this.disableButton("Save");
        this.disableButton("Submit");
        this.disableButton("Empty");
        this.disableButton("Delete");
        this.disableButton("Rotate_CW");
        this.disableButton("Rotate_CCW");
        this.disableButton("Cut");
        this.disableButton("Copy");
        this.disableButton("Paste");

        this.drawGrid(this.gridContext);
    }
};

/*****************************************************************************
 * CLEAR CANVAS
 *  Clears the given canvas. 
 ****************************************************************************/
Digsim.prototype.clearCanvas = function(context, width, height) {
    // Store the current transformation matrix
    context.save();
    
    // Use the identity matrix while clearing the canvas
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    
    // Restore the transform
    context.restore();
};

/*****************************************************************************
 * DRAW GRID
 *  Draws the underlying blue grid on the screen
 ****************************************************************************/
Digsim.prototype.drawGrid = function(context) {
    // Outline the canvas   
    this.clearCanvas(context, this.gridWidth, this.gridHeight);
    context.strokeStyle = '#000000';
    context.strokeRect(.5, .5, this.gridWidth-1, this.gridHeight-1);
    
    // Grid grid
    if (this.gridToggle % 3 === 0) {
        context.strokeStyle = '#8DCFF4';
        context.lineWidth = 1;
        context.save();
        context.translate(0.5, 0.5);
        context.beginPath();
        
        // Draw the columns
        for (var col = 1; col < this.NUM_COLS; col++) {
            context.moveTo(col * this.GRID_SIZE, 0);
            context.lineTo(col * this.GRID_SIZE, this.gridHeight-1);
        }
        // Draw the rows
        for (var row = 1; row < this.NUM_ROWS; row++) {
            context.moveTo(1, row * this.GRID_SIZE);
            context.lineTo(this.gridWidth-1, row * this.GRID_SIZE);
        }
        context.stroke();
        context.restore();
    }

    // Dotted Grid
    else if (this.gridToggle % 3 === 1) {
        context.fillStyle = '#0d91db';
        context.lineWidth = 1;
        context.save();
        context.translate(digsim.GRID_SIZE / 2 - 0.5,digsim.GRID_SIZE / 2 - 0.5);
        context.beginPath();

        for (var col = 0; col < this.NUM_COLS; ++col) {
            for (var row = 0; row < this.NUM_ROWS; ++row) {
                context.fillRect(col * digsim.GRID_SIZE, row * digsim.GRID_SIZE, 1.5, 1.5);
            }
        }
        context.stroke();
        context.restore();
    }
};



/*============================================================================
  ============================================================================
  ========================= COMPONENTS & PLACEHOLDERS ========================
  ============================================================================
  ============================================================================*/

/*****************************************************************************
 * DRAW COMPONENTS
 *  Redraws all the components on the static canvas, after everything has been
 *  dragged and dropped
 ****************************************************************************/
Digsim.prototype.drawComponents = function() {
    this.clearCanvas(this.staticContext, this.gridWidth, this.gridHeight);
    console.log(this.components);
    for (index in this.components) {
        if(typeof this.components[index] !== 'undefined' && this.components[index].drawStatic) {
            this.components[index].draw(this.staticContext);
        }
    }
};

/*****************************************************************************
 * DELETE COMPONENT
 *  duh.
 ****************************************************************************/
Digsim.prototype.deleteComponent = function() {
    obj = this.selectedComponent;
    // Remove the component from the array
    if (obj.type === this.SWITCH || obj.type === this.CLOCK) {
        this.drivers.splice(this.drivers.indexOf(obj.id), 1);
    }
    this.disableControls();
    this.components[obj.id] = undefined;
    this.deleteConnections(obj);
    this.deletePlaceholder(obj);
}

/*****************************************************************************
 * DELETE CONNECTIONS
 *  Remove all connections for the component
 ****************************************************************************/
Digsim.prototype.deleteConnections = function(obj) {
    console.log("•••••••••••• DELETE CONNECTIONS•••••••••••••••");
    for (var i = 0; i < obj.connections.length; ++i) {
        var connections = obj.connections[i].connections;
        console.log("connections.indexOf(obj) = " + connections.indexOf(obj));
        connections.splice(connections.indexOf(obj),1);
    }

    // Remove connetions to gates
    if (obj.type < 0) {
        console.log("OBJ IS GATE");
        for (var i = 0; i < obj.prevConnect.length; ++i) {
        //     console.log("I: " + i);
        //     console.log("obj.prevConnect.length: " + obj.prevConnect.length);
        //     console.log(obj.prevConnect[i]);
            var connections = obj.prevConnect[i].connections;
        //     console.log("CONNECTIONS: ••••••••••••");
             console.log(connections);
             var index = connections.indexOf(obj);
             console.log("INDEX: " + index);
             if (index >= 0) {
                 connections.splice(index, 1);
             }
        //     console.log("connections.indexOf(obj) = " + connections.indexOf(obj));
        //     var poo = connections.splice(connections.indexOf(obj),1);
        //     console.log("POO: "); 
        //     console.log(poo);
        }
    }
    
    obj.connections = [];
};

/*****************************************************************************
 * SET PLACEHOLDERS
 *  Given a gate object, adds it to the placeholder data array with unique
 *  identifier. 
 ****************************************************************************/
Digsim.prototype.setPlaceholders = function(obj) {

    var row, col, cnt, conCol, conRow, placeholder, utilMath;
    var factor = Math.floor(obj.numInputs / 2) || 1;
    var index, rot = obj.rotation; // rotation variables

    // Check the object space for collision
    console.log(obj.row + ", " + obj.column);
    for (row = 0; row < obj.dimension.row; ++row) {
        for (col = 0; col < obj.dimension.col; ++col) {
            if (this.placeholder[obj.row + row][obj.column + col]) {
                console.error("COLLISION! ERROR!");
                digsim.addMessage(digsim.WARNING, "[1]Collision detected! Unable to place component. ");
                return false;
            }
        }
    } 

    // Check connection points for collision
    if (obj.type < 0) { // gate
        cnt = 0;        

        // Previous
        for (var i = 0; i < obj.numInputs; ++i) {
            
            utilMath = this.rotationMath(obj, "prev", i, cnt);
            conRow = utilMath.conRow;
            conCol = utilMath.conCol;
            cnt = utilMath.cnt;
            index = utilMath.index;
            
            if (!(this.placeholder[conRow][conCol] instanceof Array) && this.placeholder[conRow][conCol]) {
                console.error("Connection point collision error!");
                digsim.addMessage(digsim.WARNING, "[2]Collision detected! Unable to place component.");
                return false;
            }
            else if (!(this.placeholder[conRow][conCol] instanceof Array)) {
                this.placeholder[conRow][conCol] = [];
            }
            else if (this.placeholder[conRow][conCol][index]) {
                console.error("Connection point collision error!");
                digsim.addMessage(digsim.WARNING, "[3]Collision detected! Unable to place component.");
                return false;
            }
        }

        // Nexts
        utilMath = this.rotationMath(obj, "next", i, cnt);
        conRow = utilMath.conRow;
        conCol = utilMath.conCol;
        cnt = utilMath.cnt;
        index = utilMath.index;
        console.log("ROW: " + conRow);
        
        if (!(this.placeholder[conRow][conCol] instanceof Array) && this.placeholder[conRow][conCol]) {
            console.error("Connection point collision error!");
            digsim.addMessage(digsim.WARNING, "[4]Collision detected! Unable to place component.");
            return false;
        }
        else if (!(this.placeholder[conRow][conCol] instanceof Array)) {
            this.placeholder[conRow][conCol] = [];
        }
        else if (this.placeholder[conRow][conCol][index]) {
            console.error("Connection point collision error!");
            digsim.addMessage(digsim.WARNING, "[5]Collision detected! Unable to place component.");
            return false;
        }
        console.log("NO COLLISION! :)");

        // Place connection placeholders
        // Previous
        cnt = 0;
        
        
        // Previous
        for (var i = 0; i < obj.numInputs; ++i) {
            
            utilMath = this.rotationMath(obj, "prev", i, cnt);
            conRow = utilMath.conRow;
            conCol = utilMath.conCol;
            cnt = utilMath.cnt;
            index = utilMath.index;
            
            console.log("••••••••••••• " + conRow + ", " + conCol + " •••••••••••••");
            placeholder = new Placeholder(obj.id, obj.column + 1, obj.row + 1, obj.dimension.col, obj.dimension.row);
            this.placeholder[conRow][conCol][index] = placeholder;
        }
            
        
        // Next
        utilMath = this.rotationMath(obj, "next", i, cnt);
        conRow = utilMath.conRow;
        conCol = utilMath.conCol;
        cnt = utilMath.cnt;
        index = utilMath.index;
        
        console.log("ROW: " + conRow);
        placeholder = new Placeholder(obj.id, obj.column + 1, obj.row + 1, obj.dimension.col, obj.dimension.row);
        this.placeholder[conRow][conCol][index] = placeholder;
    }
    else {
        // Draw top and bottom small placeholders for switches and clocks
        if (obj.type !== digsim.LED) {
            // Check for collision top
            if (!(this.placeholder[obj.row - 1][obj.column] instanceof Array) && this.placeholder[obj.row - 1][obj.column]) {
                console.error("Connection point collision error!");
                digsim.addMessage(digsim.WARNING, "[8]Collision detected! Unable to place component.");
                return false;
            }
            else if (!(this.placeholder[obj.row - 1][obj.column] instanceof Array)) {
                this.placeholder[obj.row - 1][obj.column] = [];
            }
            else if(this.placeholder[obj.row - 1][obj.column][2]) {
                console.error("Connection point collision error!");
                digsim.addMessage(digsim.WARNING, "[9]Collision detected! Unable to place component.");
                return false;
            }

            // Check for collision bottom
            if (!(this.placeholder[obj.row + 1][obj.column] instanceof Array) && this.placeholder[obj.row + 1][obj.column]) {
                console.error("Connection point collision error!");
                digsim.addMessage(digsim.WARNING, "[10]Collision detected! Unable to place component.");
                return false;
            }
            else if (!(this.placeholder[obj.row + 1][obj.column] instanceof Array)) {
                this.placeholder[obj.row + 1][obj.column] = [];
            }
            else if(this.placeholder[obj.row + 1][obj.column][0]) {
                console.error("Connection point collision error!");
                digsim.addMessage(digsim.WARNING, "[11]Collision detected! Unable to place component.");
                return false;
            }

            // Place placeholders
            placeholder = new Placeholder(obj.id, obj.column, obj.row - 1, obj.dimension.col, obj.dimension.row);
            this.placeholder[obj.row - 1][obj.column][2] = placeholder;
            placeholder = new Placeholder(obj.id, obj.column, obj.row + 1, obj.dimension.col, obj.dimension.row);
            this.placeholder[obj.row + 1][obj.column][0] = placeholder;
        }

        conCol = obj.column + obj.conCol;
        conRow = obj.row + obj.conRow;

        if (!(this.placeholder[conRow][conCol] instanceof Array) && this.placeholder[conRow][conCol]) {
            console.error("Connection point collision error!");
            digsim.addMessage(digsim.WARNING, "[6]Collision detected! Unable to place component.");
            return false;
        }
        else if (!(this.placeholder[conRow][conCol] instanceof Array)) {
            this.placeholder[conRow][conCol] = [];
        }
        else if(this.placeholder[conRow][conCol][obj.conIndex]) {
            console.error("Connection point collision error!");
            digsim.addMessage(digsim.WARNING, "[7]Collision detected! Unable to place component.");
            return false;
        }

        // Place connection placeholders
        placeholder = new Placeholder(obj.id, conCol, conRow, obj.dimension.col, obj.dimension.row);
        this.placeholder[conRow][conCol][obj.conIndex] = placeholder;

    }

    // Places the placeholder for the object
    for (row = 0; row < obj.dimension.row; ++row) {
        for (col = 0; col < obj.dimension.col; ++col) {
            var placeholder = new Placeholder(obj.id, col, row, obj.dimension.col, obj.dimension.row);
            this.placeholder[obj.row + row][obj.column + col] = placeholder;
        }
    }

    console.log("RETURN TRUE:");
    return true;
};


/*****************************************************************************
 * UTILITY: ROTATION MATH
 *  To get rid of redundant code, this will take care of all the rotation math
 *  that must be computed.
 ****************************************************************************/
Digsim.prototype.rotationMath = function(obj, con, i, cnt) {
    
    var conCol, conRow;
    var factor = Math.floor(obj.numInputs / 2) || 1;
    var index, rot = obj.rotation; // rotation variables
    
    if (con === "prev") {
        // Previous
        switch (rot / 90)
        {
            case 0:
                conCol = obj.column - 1;
                index = 1;
                break;
            case 1:
                conRow = obj.row - 1;
                index = 2;
                break;
            case 2:
                conCol = obj.dimension.col + obj.column;
                index = 3;
                break;
            default:
                conRow = obj.dimension.row + obj.row;
                index = 0;
                break;
        }
        
        if (obj.type === digsim.NOT) {
            conRow = obj.row + 1;
        }
        else {
            if (i % 2) {
                if (rot === 0 || rot === 180) {
                    conRow = obj.row + (factor * 2) - cnt++;
                }
                else {
                    conCol = obj.column + (factor * 2) - cnt++;
                }
            }
            else {
                if (rot === 0 || rot === 180) {
                    conRow = obj.row + cnt;
                }
                else {
                    conCol = obj.column + cnt;
                }
            }
        }
    }
    
    else {
        // Next
        switch (rot / 90)
        {
            case 0:
                conCol = obj.column + obj.dimension.col;
                conRow = obj.row + factor;
                index = 3;
                console.log("case 0");
                break;
            case 1:
                index = 0;
                conCol = obj.column + factor;
                conRow = obj.row + obj.dimension.row;
                console.log("case 1");
                break;
            case 2:
                index = 1;
                conCol = obj.column  - 1;
                conRow = obj.row + factor;
                console.log("case 2");
                break;
            default:
                index = 2;
                conCol = obj.column + factor;
                conRow = obj.row - 1;
                console.log("case doody");
        }
        console.log("ROW: " + conRow);
    }
    
    return {"conRow": conRow, "conCol": conCol, "cnt": cnt, "index": index};
};

/*****************************************************************************
 * SET WIRE PLACEHOLDER
 *  Given a wire object, adds it to the placeholder data array with unique
 *  identifier. 
 ****************************************************************************/
Digsim.prototype.setWirePlaceholder = function(wire, dx, dy) {
    //console.log("row: " + row + "\ncol: " + col);
    
    console.log(wire);
    var endRow = wire.path[0].y + wire.row; 
    var endCol = wire.path[0].x + wire.column; // Current ending pos
    
    var floorEndRow = Math.floor(endRow);
    var floorEndCol = Math.floor(endCol);
       
    console.log("wire.column: " + wire.column + " wire.row: " + wire.row);
    
    var initial = Math.floor(dx ? Math.floor(wire.column): (dy ? Math.floor(wire.row) : 0));
    var endBool = (dx ? floorEndCol + dx : (dy ? floorEndRow + dy : 0));
    var inc = dx ? dx : (dy ? dy : 0);
    var row, col, end, begin, j, thisPH;
    console.log("DX: " + dx + "  DY: " + dy);
    console.log("I: " + initial + "  ENDBOOL " + endBool);
    console.log("INC: " + inc);
    if (dx) {
        console.log("CHECKING FOR COLLISION(DX)");
        end = Math.max(wire.column, endCol);
        begin = Math.min(wire.column, endCol);
        j = Math.floor(begin);
        while (j < end) {
            console.log("J: " + j + "  END: " + (end) + "  INC/2: " + inc/2)
            console.log("J%1: " + (j % 1));
            thisPH = this.placeholder[floorEndRow][Math.floor(j)];

            if (thisPH instanceof Array) {
                if (j >= begin) {
                    
                    if (j % 1) {
                        console.log("placed at index " + 1);
                        if (thisPH[1]) {
                            console.error("wire collision error!");
                            digsim.addMessage(digsim.WARNING, "[8]Collision detected! Unable to place wire.");
                            return false;
                        }
                    }
                    else if (thisPH[3]) {
                        console.error("wire collision error!");
                        digsim.addMessage(digsim.WARNING, "[9]Collision detected! Unable to place wire.");
                        return false;
                    }
                }
                j += 0.5;
            }
            else if (thisPH) {
                console.error("COLLISION! ERROR!");
                digsim.addMessage(digsim.WARNING, "[10]Collision detected! Unable to place wire.");
                return false;
            }
            else {
                ++j;
            }
            console.log("");
        }
    }
    else if (dy) {
        console.log("CHECKING FOR COLLISION(DY)");
        end = Math.max(wire.row, endRow);
        begin = Math.min(wire.row, endRow);
        j = Math.floor(begin);
        while (j < end) {
            console.log("J: " + j + "  END: " + (end) + "  INC/2: " + inc/2)
            console.log("J%1: " + (j % 1));
            thisPH = this.placeholder[Math.floor(j)][floorEndCol];
            if (thisPH instanceof Array) {
                if (j >= begin) {
                    
                    if (j % 1) {
                        console.log("placed at index " + 1);
                        if (thisPH[2]) {
                            console.error("wire collision error!");
                            digsim.addMessage(digsim.WARNING, "[11]Collision detected! Unable to place wire.");
                            return false;
                        }
                    }
                    else if (thisPH[0]) {
                        console.error("wire collision error!");
                        digsim.addMessage(digsim.WARNING, "[12]Collision detected! Unable to place wire.");
                        return false;
                    }
                }
                j += 0.5;
            }
            else if (thisPH) {
                console.error("COLLISION! ERROR!");
                digsim.addMessage(digsim.WARNING, "[13]Collision detected! Unable to place wire.");
                return false;
            }
            else {
                ++j;
            }
            console.log("");
        }
    }

    console.log("NO COLLISION DETECTED");
    placeholder = new Placeholder(wire.id, 0, 0, 1);

    if (dx) {
        console.log("DX: " + dx);
        var end = Math.max(wire.column, endCol);
        for (var j = Math.min(wire.column, endCol); j !== end; j += 0.5) {
            console.log("J: " + j + "  END: " + (endCol) + "  INC/2: " + inc/2)
            console.log("J%1: " + (j % 1));
            col = Math.floor(j);
            console.log("typeof thisPH: " + typeof thisPH);
            if (typeof this.placeholder[floorEndRow][col] === 'undefined') {
                this.placeholder[floorEndRow][col] = [];
                console.log("thisPH is undefined");
            }
            if (j % 1) {
                console.log("placed at index " + 1);
                this.placeholder[floorEndRow][col][1] = placeholder;
            }
            else {
                console.log("placed at index " + 3);
                this.placeholder[floorEndRow][col][3] = placeholder;
            }
            console.log("");
        }
    }
    else if (dy) {
        var end = Math.max(wire.row, endRow);
        for (var j = Math.min(wire.row, endRow); j !== end; j += 0.5) {
            console.log("J: " + j + "  END: " + (endRow) + "  INC/2: " + inc/2)
            console.log("J%1: " + (j % 1));
            row = Math.floor(j);
            if (typeof this.placeholder[row][floorEndCol] == 'undefined') {
                this.placeholder[row][floorEndCol] = [];
            }
            if (j % 1) {
                this.placeholder[row][floorEndCol][2] = placeholder;
            }
            else {
                this.placeholder[row][floorEndCol][0] = placeholder;
            }
        }
    }

    console.log("RETURN TRUE:");
    return true;
};

/*****************************************************************************
 * DELETE PLACEHOLDER
 *  Delete component placehoders
 ****************************************************************************/
Digsim.prototype.deletePlaceholder = function(obj) {
    
    if (obj.type === digsim.WIRE) {
        console.log(obj);
        var endRow = obj.row + obj.path[0].y;
        var endCol = obj.column + obj.path[0].x;
        var floorEndRow = Math.floor(endRow);
        var floorEndCol = Math.floor(endCol);
        var row, col;
        console.log("endRow: " + endRow);
        console.log("endCol: " + endCol);
        console.log("floorEndRow: " + floorEndRow);
        console.log("floorEndCol: " + floorEndCol);
        
        if (obj.dx) {
            var end = Math.max(obj.column, endCol);
            for (var j = Math.min(obj.column, endCol); j !== end; j += 0.5) {
                console.log("J%1: " + (j % 1));
                col = Math.floor(j);
                console.log("col: " + col);
                console.log(this.placeholder[floorEndRow][col]);
                if (j % 1) {
                    console.log("placed at index " + 1);
                    this.placeholder[floorEndRow][col][1] = undefined;
                }
                else {
                    console.log("placed at index " + 3);
                    this.placeholder[floorEndRow][col][3] = undefined;
                }
                console.log("");
            }
        }
        else if (obj.dy) {
            var end = Math.max(obj.row, endRow);
            for (var j = Math.min(obj.row, endRow); j !== end; j += 0.5) {
                console.log("J%1: " + (j % 1));
                row = Math.floor(j);
                if (j % 1) {
                    this.placeholder[row][floorEndCol][2] = undefined;
                }
                else {
                    this.placeholder[row][floorEndCol][0] = undefined;
                }
            }
        }
        this.drawComponents();
        return;
    }
    
    // Remove the component from the array
    for (var row = 0; row < obj.dimension.row; ++row) {
        for (var col = 0; col < obj.dimension.col; ++col) {
            digsim.placeholder[obj.row + row][obj.column + col] = undefined;
        }
    }
    
    var row, col, cnt, conCol, conRow, index;
    var factor = Math.floor(obj.numInputs / 2) || 1;

    if (obj.type < 0) { // gate
        cnt = 0;

        // Previous
        for (var i = 0; i < obj.numInputs; ++i) {            
            utilMath = this.rotationMath(obj, "prev", i, cnt);
            conRow = utilMath.conRow;
            conCol = utilMath.conCol;
            cnt = utilMath.cnt;
            index = utilMath.index;
            
            var noneFound = true;
            for (var j = 0; j < 4; ++j) {
                console.log(conRow);
                console.log(conCol);
                console.log("¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥¥");
                if (j != index && this.placeholder[conRow][conCol][j]) {
                    noneFound = false;
                }
            }
            if (noneFound) {
                this.placeholder[conRow][conCol] = undefined;
            }
            else {
                this.placeholder[conRow][conCol][index] = undefined;
            }
        }

        // Next
        utilMath = this.rotationMath(obj, "next", i, cnt);
        conRow = utilMath.conRow;
        conCol = utilMath.conCol;
        cnt = utilMath.cnt;
        index = utilMath.index;
        
        var noneFound = true;
        for (var j = 0; j < 4; ++j) {
            if (j != 3 && this.placeholder[conRow][conCol][j]) {
                noneFound = false;
            }
        }
        if (noneFound) {
            this.placeholder[conRow][conCol] = undefined;
        }
        else {
            this.placeholder[conRow][conCol][index] = undefined;
        }
    }
    else {
        conCol = obj.column + obj.conCol;
        conRow = obj.row + obj.conRow;

        for (var j = 0; j < 4; ++j) {
            if (j != obj.conIndex && this.placeholder[conRow][conCol][j]) {
                noneFound = false;
            }
        }
        if (noneFound) {
            this.placeholder[conRow][conCol] = undefined;
        }
        else {
            this.placeholder[conRow][conCol][obj.conIndex] = undefined;
        }
    }

    // Visually remove component from static canvas. 
    this.drawComponents();
};

/*****************************************************************************
 * DEACTIVATE
 *  Removes the active class from any button, and redraws the components if
 *  the active button was Run.
 ****************************************************************************/
 Digsim.prototype.deactivate = function(id) {
    $("canvas").css('cursor','default');
    $('ul:not(.num-inputs) .active').removeClass('active');
    this.disableControls();
    console.log("disable controls");
    this.mode = this.DEFAULT_MODE;
    this.dragging = false;
    this.draggingGate = {};
    this.clearCanvas(this.movingContext, this.gridWidth, this.gridHeight);
    this.disableControls();

    if (id == "Run") {
        console.log("done running");
        for (var i = 0, len = this.components.length; i < len; ++i) {
            if (typeof this.components[i] !== 'undefined') {
                this.components[i].state = 0;
            }
        }
        this.drawComponents();
    }
};



/*============================================================================
  ============================================================================
  =============================== BIND EVENTS ================================
  ============================================================================
  ============================================================================*/

/*****************************************************************************
 * ON BUTTON CLICKED
 *  When a button is clicked, do this. Creates a gate when button is clicked. 
 *  This only works because of id on the html matches the name of the gate. 
 *  "AND", "OR", etc...
 ****************************************************************************/
Digsim.prototype.onButtonClicked = function (event) {
    event.preventDefault();
    var id = $(this).attr("id");

    // Activate butotn
    if (!$(this).hasClass('active')) {
        // Remove the active class from all buttons that have it
        digsim.deactivate($('ul:not(.num-inputs) .active').attr('id'));
        $(this).addClass('active');

        if (id == "Wire") {
            $("canvas").css('cursor','crosshair');
            digsim.mode = digsim.WIRE_MODE;
        }
        else if (id == "Run") {
            if (digsim.drivers.length === 0) {
                digsim.addMessage(digsim.ERROR, "[15]Error: No drivers in schematic!");
                return;
            }
            $("canvas").css('cursor','pointer');
            $('#messages').html('');
            digsim.mode = digsim.SIM_MODE;

            // Clear the next/prev list for each item
            for (var j = 0, len = digsim.components.length; j < len; ++j) {
                if (typeof digsim.components[j] !== 'undefined') {
                    digsim.components[j].next = [];
                    digsim.components[j].prev = [];
                }
            }
            // Loop through each driver and pass state
            for (var i = 0, len = digsim.drivers.length; i < len; ++i) {
                var obj = digsim.components[ digsim.drivers[i] ];
                if (obj.traverse()) {
                    console.log("");
                    console.log("");
                    console.log("");
                    console.log("********************BEGIN PASS STATE!********************");
                    obj.passState(1);
                    obj.passState(0);
                }
            }

            cycleClock();
            digsim.drawComponents();
        }
        else {
            $("canvas").css('cursor','default');
            digsim.mode = digsim.PLACE_MODE;
            digsim.enableButton('Rotate_CW');
            digsim.enableButton('Rotate_CCW');

            // Use reflection to dynamically create gate based on id :)
            var Class = window[id];
            var gate = new Class(digsim.numGateInputs); 
            digsim.prevGate = id;
            digsim.offsetRow = 0;
            digsim.offsetCol = 0;

            // Initialize the new object at the mouse position
            var row = Math.floor(digsim.mousePos.y / digsim.GRID_SIZE) || 2;
            var col = Math.floor(digsim.mousePos.x / digsim.GRID_SIZE) || 2;
            gate.init(col, row, 0, digsim.iComp);
            digsim.dragging = true;
            digsim.draggingGate = gate;
            digsim.draggingGate.draw(digsim.movingContext);
            animate();
        }
    }
    // Deactivate button
    else {
        digsim.deactivate(id);
    }
};

/*****************************************************************************
 * ON GRID CLICKED
 *  Called when wire mode is on - for dragging wires. 
 ****************************************************************************/
Digsim.prototype.onGridClicked = function(event) {
    // Only handle left click events
    if (event.button !== 0) {
        return;
    }
    if (digsim.selectedComponent) {
        digsim.selectedComponent.draw(digsim.staticContext);
    }

    var mouseX = event.offsetX || event.layerX || event.clientX - $(".canvases").position().left;
    var mouseY = event.offsetY || event.layerY || event.clientY - $(".canvases").position().top;;
    var row = Math.floor(mouseY / digsim.GRID_SIZE);
    var col = Math.floor(mouseX / digsim.GRID_SIZE);

    if (digsim.mode === digsim.WIRE_MODE) {
        event.preventDefault();
        var x, y, dx = 0, dy = 0;
        
        if (!digsim.dragging) {
            digsim.dragging = true;
            digsim.wirePos.startX = col + 0.5;
            digsim.wirePos.startY = row + 0.5;
            digsim.lockH = digsim.lockV = 0;
            animateWire();
        }
        /* */
        else if (digsim.autoroute) {
            //Dijkstra pathfinding algorithm - www.zsheffield.net/dijkstra-pathfinding
            var start = {'r': 0, 'c': 0};
            var target = {'r': 0, 'c': 0};
            var neighbors = [];
            var BIGNUM = ~(1 << 31) - 10;
            var shortest;
            var u;
            var pathfound;
            var alt;
            var S = [];
            for (var r = 0; r < digsim.NUM_ROWS; ++r) {
                for (var c = 0; c < digsim.NUM_COLS; ++c) {
                    dist[r][c] = BIGNUM;
                    Q[r][c] = digsim.placeholder[r][c]; // placeholders go here
                    prev[r][c] = undefined;
                }
            }
            
            dist[start.r][start.c] = 0;
            while (function isempty() {
                   for (var r = 1; r < digsim.NUM_ROWS; ++r) {
                   for (var c = 1; c < digsim.NUM_COLS; ++c) {
                   if (Q[r][c] != undefined) { return true; } } } } )
            {
                // Find smallest distance from u
                shortest = BIGNUM;
                u = {'r': undefined, 'c': undefined };
                for (var r = 1, sQ = true; r < digsim.NUM_ROWS && sQ; ++r) {
                    for (var c = 1; c < digsim.NUM_COLS && sQ; ++c) {
                        if (Q[r][c] != undefined) {
                            u = {'r': r, 'c': c};
                            shortest = dist[u.r][u.c];
                            sQ = false;
                        }
                    }
                }
                for (var r = 1; r < digsim.NUM_ROWS; ++r) {
                    for (var c = 1; c < digsim.NUM_COLS; ++c) {
                        if (Q[r][c] != undefined) {
                            if (dist[r][c] < shortest) {
                                shortest = dist[r][c];
                                u = {'r': r, 'c': c};
                            }
                        }
                    }
                }
                // u now contains the coordinate in Q with the
                // smallest distance in dist[]
                
                // If we've reached our target, then we're done
                Q[u.r][u.c] = undefined;
                if (u.r == target.r && u.c == target.c) {
                    pathfound = true;
                    break;
                }
                // If the shortest distance from u is BIGNUM, there is no path
                if (dist[u.r][u.c] == BIGNUM) {
                    pathfound = false;
                    break;
                }
                
                // FIND NEIGHBORS
                // Neighbor above
                if (dist[u.r - 1][u.c] != undefined &&
                    Q[u.r - 1][u.c] != undefined &&
                    grid[u.r - 1][u.c] != 1) {
                    neighbors.push( {'r': u.r - 1, 'c': u.c} );
                }
                // Neighbor below
                if (dist[u.r + 1][u.c] != undefined &&
                    Q[u.r + 1][u.c] != undefined &&
                    grid[u.r + 1][u.c] != 1) {
                    neighbors.push( {'r': u.r + 1, 'c': u.c} );
                }
                // Neighbor left
                if (dist[u.r][u.c - 1] != undefined &&
                    Q[u.r][u.c - 1] != undefined &&
                    grid[u.r][u.c - 1] != 1) {
                    neighbors.push( {'r': u.r, 'c': u.c - 1} );
                }
                // Neighbor right
                if (dist[u.r][u.c + 1] != undefined &&
                    Q[u.r][u.c + 1] != undefined &&
                    grid[u.r][u.c + 1] != 1) {
                    neighbors.push( {'r': u.r, 'c': u.c + 1} );
                }
                
                // Add the right neighbor to the path
                for (var i = 0; i < neighbors.length; ++i) {
                    alt = dist[u.r][u.c] + 1;
                    if (alt < dist[ neighbors[i].r ][ neighbors[i].c ]) {
                        dist[ neighbors[i].r ][ neighbors[i].c ] = alt;
                        prev[neighbors[i].r][neighbors[i].c] = u;
                    }
                }
                neighbors = [];
            }
            u = target;
            while (prev[u.r][u.c] != undefined) {
                S.splice(0, 0, u);
                u = prev[u.r][u.c];
            }
            // Now S is an array (from start to target) that contains
            // {row, column} objects of the path
            
            // There might be an error here because wires crossing each other
            // perpendicularly is ok, but this algorithm does not yet take that
            // into account
            
        } // End of autoroute
        else {
            digsim.dragging = false;
            
            
            // Check wire path for other components.
            if (digsim.lockV) {
                dy = (row < Math.floor(digsim.wirePos.startY)) ? -1 : ((row === Math.floor(digsim.wirePos.startY)) ? 0 : 1);
            }
            else if (digsim.lockH) {
                dx = (col < Math.floor(digsim.wirePos.startX)) ? -1 : ((col === Math.floor(digsim.wirePos.startX)) ? 0 : 1);
            }
            
            if (dx == 0 && dy == 0) {
                // Stop wire placing
                return;
            }
            
            // Valid mouse clickage
            if ((digsim.lockV && dy) || (digsim.lockH && dx)) {
                var wire = new Wire();
                wire.init(digsim.wirePos.startX, digsim.wirePos.startY, 0, digsim.iComp);
                wire.dx = dx;
                wire.dy = dy;
                if (digsim.lockH) {
                    wire.path.push( {'x': col + 0.5 - digsim.wirePos.startX, 'y': 0 } );
                }
                else if (digsim.lockV) {
                    //console.log(Math.floor(mouseY / digsim.GRID_SIZE) - digsim.wirePos.startY);
                    wire.path.push( {'x': 0, 'y': row + 0.5 - digsim.wirePos.startY } );
                }
                else {
                    return;
                }
                
                var validPlacement = digsim.setWirePlaceholder(wire, dx, dy);
                
                if (validPlacement) {
                    console.log("WE HAVE A VALID PLACEMENT!");
                    
                    // Create the wire in components array
                    
                    digsim.components[digsim.iComp++] = wire;
                    // Going up/down and left/right?
                    
                    if (digsim.lockH) {
                        //console.log(Math.floor(mouseX / digsim.GRID_SIZE) - digsim.wirePos.startX);
                        
                        console.log("LOCKH!");
                        digsim.dragging = true;
                        digsim.lockH = false;
                        digsim.lockV = true;
                        digsim.wirePos.startX = col + 0.5;
                    }
                    else if (digsim.lockV) {
                        console.log("LOCKV!");
                        digsim.dragging = true;
                        digsim.lockH = true;
                        digsim.lockV = false;
                        digsim.wirePos.startY = row + 0.5;
                        // Now we need to move the startXY position to the current position
                    }
                    else {
                        return;
                    }
                    // Draws the wire on static context.
                    wire.checkConnect();
                    wire.draw(digsim.staticContext);
                }
                else {
                    wire.path.pop();
                    digsim.dragging = true;
                    // DO NOT PLACE WIRE, there's something in the way.
                }
            }
            else {
                digsim.dragging = true;
            }
        }
    }
    else if (digsim.dragging) {
        // Prevent selection of gates when placed on top of each other.
        return;
    }
    else if (digsim.mode === digsim.DEFAULT_MODE) {
        if (digsim.placeholder[row][col] instanceof Array) {
            //Selected a wire
            console.log("Wire selected");
            
            var relX = mouseX % digsim.GRID_SIZE;
            var relY = mouseY % digsim.GRID_SIZE;
            var leftVert = topHor = Math.ceil(digsim.GRID_SIZE * (1 - digsim.HIT_RADIUS) / 2);
            var rightVert = bottomHor = digsim.GRID_SIZE - topHor;
            var diagSep = digsim.GRID_SIZE - relX;
            var vert = (relX >= topHor) && (relX <= bottomHor);
            var hor = (relY >= leftVert) && (relY <= rightVert);
            var index = -1;
            var array = digsim.placeholder[row][col];

            
            console.log("hor: " + hor);
            console.log("vert: " + vert);
            if (vert && hor && (array[0] || array[2]) && (array[1] || array[3])) {
                console.log("fatal error:");
                // mid click and multiple wires
                // Determine grid snap for wires not connecting to other wires. 
                if (relY < relX) {  // top
                    if (relY < diagSep) {  // top-left
                        index = digsim.TL;
                    }
                    else { // top-right
                        index = digsim.TR;
                    }
                }
                else { // bottom
                    if (relY < diagSep) { // bottom-left
                        index = digsim.BL;
                    }
                    else { // bottom-right
                        index = digsim.BR;
                    }
                }                
            }
            else if (hor && (array[1] || array[3]) && relY >= topHor && relY <= bottomHor) {
                console.log("non-fatal error");
                if (relX <= digsim.GRID_SIZE / 2) {
                    index = 3;
                }
                else {
                    index = 1;
                }
            }
            else if (vert && relX >= leftVert && relX <= rightVert) {
                console.log("this is hello world");
                if (relY <= digsim.GRID_SIZE / 2) {
                    index = 0;
                }
                else {
                    index = 2;
                }
            }

            if (index === -1) {
                console.log("§§§ no wire §§§");
            }

            console.log("index: " + index);
            console.log("Selected ");
            console.log(digsim.placeholder[row][col][index]);
            
            if (index != -1 && digsim.placeholder[row][col][index]) {
                
                digsim.selectedComponent = digsim.components[ digsim.placeholder[row][col][index].ref ];
                if (!$('#Cut').hasClass('disabled')) {
                    digsim.disableButton('Cut');
                    digsim.disableButton('Copy');
                    digsim.disableButton('Rotate_CCW');
                    digsim.disableButton('Rotate_CW');
                }
                digsim.enableButton('Delete');
                digsim.selectedComponent.draw(digsim.staticContext, 'red');
            }
        }
        else if (digsim.placeholder[row][col]) {
            // Selected a component
            console.log("Component selected");
            digsim.selectedComponent = digsim.components[ digsim.placeholder[row][col].ref ];
            digsim.enableButton('Cut');
            digsim.enableButton('Copy');
            digsim.enableButton('Delete');
            digsim.enableButton('Rotate_CCW');
            digsim.enableButton('Rotate_CW');
            digsim.selectedComponent.draw(digsim.staticContext, 'red');
            /* NEED TO SHOW SOMEHOW THAT COMPONENT IS SELECTED */
        }
    }
};                     

/*****************************************************************************
 * ON GRID MOUSE DOWN
 *  Click and drag gates. Only called in default mode. 
 ****************************************************************************/
Digsim.prototype.onGridMouseDown = function(event) {
    // Only handle left click events
    if (event.button !== 0) {
        return;
    }

    // Gets mouse position on canvas
    var mouseX = event.offsetX || event.layerX || event.clientX - $(".canvases").position().left;
    var mouseY = event.offsetY || event.layerY || event.clientY - $(".canvases").position().top;;
    
    // Tells us where on the grid (we've created) the click is
    var col = Math.floor(mouseX / digsim.GRID_SIZE);
    var row = Math.floor(mouseY / digsim.GRID_SIZE); 

    if (digsim.mode === digsim.DEFAULT_MODE) {
        event.preventDefault();
        
        // If the onMosueUp event didn't get triggered, trigger it here
        if (digsim.dragging) {
            $("canvas").mouseup();
            return;
        }
        digsim.dragging = false;
        
        // Here's where the magic happens
        console.log("ROW: " + row + ", COL: " + col);
        if (digsim.placeholder[row][col] instanceof Array) { // wire 
            // deal with this later
        }
        else if (digsim.placeholder[row][col]) {
            digsim.dragging = true;
            
            console.log("digsim.placeholder[row][col]: ");
            console.log(digsim.placeholder[row][col]);
            console.log("");
            var ref = digsim.placeholder[row][col].ref;
            console.log("REF: " + ref + "\n");
            digsim.draggingGate = digsim.components[ref];
            digsim.draggingGate.drawStatic = false;
            digsim.offsetRow = digsim.placeholder[row][col].posY;
            digsim.offsetCol = digsim.placeholder[row][col].posX;
            digsim.deleteConnections(digsim.draggingGate);
            digsim.deletePlaceholder(digsim.draggingGate);
            
            digsim.draggingGate.draw(digsim.movingContext);
            animate();
        }
        else {
            // There's nothing where you clicked, dude. 
            console.log("empty");
            digsim.disableControls();
        }
    }
    else if (digsim.mode === digsim.SIM_MODE) {        
        if (digsim.placeholder[row][col]) {
            var obj = digsim.components[ digsim.placeholder[row][col].ref ];
            if (obj.type === digsim.SWITCH) {
                console.log("");
                console.log("");
                console.log("");
                console.log("********************BEGIN PASS STATE!********************");
                obj.passState(!obj.state);
                digsim.drawComponents();
            }
        }
    }
};

/*****************************************************************************
 * ON GRID MOUSE UP
 *  When the mouse is realeased while on the canvas, this will take care of all
 *  the things that change after stuff being dragged around. 
 ****************************************************************************/
Digsim.prototype.onGridMouseUp = function(event) {
    // Only handle left click events
    if (event.button !== 0) {
        return;
    }

    if (digsim.mode === digsim.DEFAULT_MODE) {
        if (digsim.dragging) {
            var validPlacement = digsim.setPlaceholders(digsim.draggingGate);
            if (validPlacement) {
                console.log("valid placement");
                digsim.components[digsim.draggingGate.id] = digsim.draggingGate;
                digsim.draggingGate.drawStatic = true;
                digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
                digsim.draggingGate.checkConnect();
                digsim.draggingGate.draw(digsim.staticContext);

                digsim.dragging = false;
            }
            else {
                digsim.dragging = true;
                // DO NOT PLACE COMPONENT, there's something in the way. 
            }
        }
        
    }
    else if (digsim.mode === digsim.PLACE_MODE) {
        var validPlacement = digsim.setPlaceholders(digsim.draggingGate);
        if (validPlacement) {

             // Create new gate for next place
            if($('.gates a').hasClass('active') || $('.io a').hasClass('active')) {
                var id = digsim.prevGate;
                if (id === "Switch" || id === "Clock") {
                    digsim.drivers.push(digsim.iComp);
                }

                digsim.components[digsim.draggingGate.id] = digsim.draggingGate;
                digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
                digsim.draggingGate.checkConnect();
                digsim.draggingGate.draw(digsim.staticContext);   
           
                var Class = window[id];
                var gate = new Class(digsim.numGateInputs); 
                var row = Math.floor(digsim.mousePos.y / digsim.GRID_SIZE) || 2;
                var col = Math.floor(digsim.mousePos.x / digsim.GRID_SIZE) || 2;
                gate.init(col, row, 0, ++digsim.iComp);
                digsim.draggingGate = gate;
                digsim.draggingGate.draw(digsim.movingContext);
                digsim.dragging = true;
            }
            // A pasted gate
            else {
                var id = digsim.draggingGate.name;
                if (id === "Switch" || id === "Clock") {
                    digsim.drivers.push(digsim.iComp);
                }

                digsim.components[digsim.iComp++] = digsim.draggingGate;
                digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
                digsim.draggingGate.checkConnect();
                digsim.draggingGate.draw(digsim.staticContext);

                digsim.mode = digsim.DEFAULT_MODE;
                digsim.dragging = false;
                digsim.disableControls();
            }
        }
    }
};

/*****************************************************************************
 * MOUSE MOVE
 *  Gets the position of the mouse on the canvas. 
 ****************************************************************************/
Digsim.prototype.onGridMouseMove = function(event) {
    var mouseX = event.offsetX || event.layerX || event.clientX - $(".canvases").position().left;
    var mouseY = event.offsetY || event.layerY || event.clientY - $(".canvases").position().top;;
    digsim.mousePos = { x: mouseX, y: mouseY };

    // Show movable components
    if (digsim.mode === digsim.DEFAULT_MODE && !digsim.dragging) {
        var row = Math.floor(mouseY / digsim.GRID_SIZE);
        var col = Math.floor(mouseX / digsim.GRID_SIZE);
        var PH = digsim.placeholder[row][col];
        if (PH instanceof Array) {
            /* FIX LATER */
            $("canvas").css('cursor','default');
        }
        else if (PH) {
            $("canvas").css('cursor','move');
        }
        else {
            $("canvas").css('cursor','default');
        }
    }
};

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs for a gate
 ****************************************************************************/
Digsim.prototype.changeNumInputs = function(event) {
    if (!$(this).hasClass('active')) {
        $('.num-inputs .active').removeClass('active');
        $(this).addClass('active');
        digsim.numGateInputs = $(this).data('inputs');
        if (digsim.draggingGate) {
            var type = digsim.draggingGate.type;
            if (type !== digsim.NOT && type < 0 && !digsim.selectedComponent) {
                digsim.draggingGate.numInputs = digsim.numGateInputs;
                digsim.draggingGate.changeSize();
            }
        }
        console.log(digsim.numGateInputs);
    }
};

/*****************************************************************************
 * COPY
 *  Copy a component into the clipboard
 ****************************************************************************/
Digsim.prototype.copy = function(event) {
    if (!$('#Copy').hasClass('disabled')) {
        digsim.clipboard = digsim.selectedComponent;
        if ($('#Paste').hasClass('disabled')) {
            digsim.enableButton('Paste');
        }
    }
 };

 /*****************************************************************************
 * CUT
 *  Cut a component into the clipboard
 ****************************************************************************/
Digsim.prototype.cut = function(event) {
    if (!$('#Cut').hasClass('disabled')) {
        digsim.clipboard = digsim.selectedComponent;
        digsim.deleteComponent(digsim.selectedComponent);
        if ($('#Paste').hasClass('disabled')) {
            digsim.enableButton('Paste');
        }
    }
};

/*****************************************************************************
 * PASTE
 *  Paste a component from the clipboard to the cavans
 ****************************************************************************/
Digsim.prototype.paste = function(event) {
    if (!$('#Paste').hasClass('disabled')) {
        $("canvas").css('cursor','default');
        digsim.mode = digsim.PLACE_MODE;
        
        // Use reflection to dynamically create gate based on id
        var id = digsim.clipboard.name;
        var Class = window[id];
        var gate = new Class(digsim.clipboard.numInputs);
        
        // Initialize the new object at the mouse position
        var row = Math.floor(digsim.mousePos.y / digsim.GRID_SIZE) || 2;
        var col = Math.floor(digsim.mousePos.x / digsim.GRID_SIZE) || 2;
        gate.init(col, row, 0, digsim.iComp);
        digsim.dragging = true;
        digsim.draggingGate = gate;
        digsim.draggingGate.draw(digsim.movingContext);
        animate();
    }
};

/*****************************************************************************
 * DELETE
 *  Delete a component
 ****************************************************************************/
Digsim.prototype.delete = function(event) {
    if (!$('#Delete').hasClass('disabled')) {
        digsim.deleteComponent();
    }
};

/*****************************************************************************
 * ROTATE
 *  تدور باتجاه الساعة
 ****************************************************************************/
Digsim.prototype.rotate = function(event) {
    
    if (!$('#Rotate_CW').hasClass('disabled')) {
        var obj = digsim.selectedComponent || digsim.draggingGate;
        
        if (!digsim.dragging) {
            digsim.deletePlaceholder(obj);
        }
        
        obj.rotation = (obj.rotation + event.data.dir) % 360;
        
        // Swap row/col
        obj.dimension.row = obj.dimension.row ^ obj.dimension.col;
        obj.dimension.col = obj.dimension.row ^ obj.dimension.col;
        obj.dimension.row = obj.dimension.row ^ obj.dimension.col;
        
        digsim.drawComponents();
        
        if (digsim.dragging) {
            obj.draw(digsim.movingContext, 'red');
        }
        else {
            if (digsim.setPlaceholders(obj)) {
                obj.draw(digsim.staticContext, 'red');
                obj.checkConnect();
            }
            else {
                obj.draw(digsim.movingContext, 'red');
            }
        }
    }
};

/*****************************************************************************
 * DISABLE BUTTON
 *  Disable a button
 ****************************************************************************/
Digsim.prototype.disableButton = function(id) {
    $('#' + id).addClass('disabled');
    $('#' + id).removeAttr('href');
    $('#' + id).removeAttr('title');
};

/*****************************************************************************
 * DISABLE CONTROLS
 *  Disable all Controls
 ****************************************************************************/
Digsim.prototype.disableControls = function() {
    digsim.disableButton('Cut');
    digsim.disableButton('Copy');
    digsim.disableButton('Delete');
    digsim.disableButton('Rotate_CCW');
    digsim.disableButton('Rotate_CW');
    
    if (digsim.selectedComponent) {
        digsim.selectedComponent.draw(digsim.staticContext);
    }
    this.selectedComponent = undefined;
};

/*****************************************************************************
 * ENABLE BUTTON
 *  Enable a button
 ****************************************************************************/
Digsim.prototype.enableButton = function(id) {
    var title = id.replace("_", " ");
    var hotkey = HOT_KEYS[id];

    $('#' + id).removeClass('disabled');
    $('#' + id).attr('href', '#');
    $('#' + id).attr('title', title + (hotkey ? " (" + HOT_KEYS[id] + ")" : ""));
};

/*****************************************************************************
 * NEW FILE
 *  Create a new file
 ****************************************************************************/
Digsim.prototype.newFile = function(event) {
    digsim.iComp = 0;
    digsim.components = [];
    digsim.drivers = [];
    digsim.placeholder = [];
    for (var i = 0; i < digsim.NUM_COLS; ++i) {
        digsim.placeholder[i] = [];
    }
    digsim.clearCanvas(digsim.staticContext, digsim.gridWidth, digsim.gridHeight);
    digsim.deactivate();
};

/*****************************************************************************
 * TOGGLE GRID
 *  Toggle grid on/off
 ****************************************************************************/
Digsim.prototype.toggleGrid = function(event) {
    digsim.gridToggle++; digsim.gridToggle %= 3;
    digsim.drawGrid(digsim.gridContext);
};

/*****************************************************************************
 * ZOOM IN
 *  Zoom in on the canvas
 ****************************************************************************/
Digsim.prototype.zoomIn = function(event) {
    digsim.GRID_SIZE += digsim.GRID_ZOOM;
    if (digsim.GRID_SIZE > digsim.MAX_GRID_SIZE) {
        digsim.GRID_SIZE = digsim.MAX_GRID_SIZE;
    }
    else {
        if ($('#Zoom_Out').hasClass('disabled')) {
            digsim.enableButton('Zoom_Out');
        }
        digsim.changeHitRadius();
        digsim.NUM_COLS = (window.innerWidth - $('.canvases').position().left) / digsim.GRID_SIZE;
        digsim.NUM_ROWS = (window.innerHeight - $('.canvases').position().top) / digsim.GRID_SIZE;
        digsim.init();
        digsim.drawGrid(digsim.gridContext);
        digsim.drawComponents();

        if (digsim.GRID_SIZE === digsim.MAX_GRID_SIZE) {
            digsim.disableButton('Zoom_In');
        }
    }
};

/*****************************************************************************
 * ZOOM OUT
 *  Zoom out on the canvas
 ****************************************************************************/
Digsim.prototype.zoomOut = function(event) {
    digsim.GRID_SIZE -= digsim.GRID_ZOOM;
    if (digsim.GRID_SIZE < digsim.MIN_GRID_SIZE) {
        digsim.GRID_SIZE = digsim.MIN_GRID_SIZE;
    }
    else {
        if ($('#Zoom_In').hasClass('disabled')) {
            digsim.enableButton('Zoom_In');
        }
        digsim.changeHitRadius();
        digsim.NUM_COLS = (window.innerWidth - $('.canvases').position().left) / digsim.GRID_SIZE;
        digsim.NUM_ROWS = (window.innerHeight - $('.canvases').position().top) / digsim.GRID_SIZE;
        digsim.init();
        digsim.drawGrid(digsim.gridContext);
        digsim.drawComponents();
        if (digsim.GRID_SIZE === digsim.MIN_GRID_SIZE) {
            digsim.disableButton('Zoom_Out');
        }
    }
};

/*****************************************************************************
 * CHANGE HIT RADIUS
 *  When zooming, changes the hit radius so that wires will be easier to 
 *  select.
 ****************************************************************************/
Digsim.prototype.changeHitRadius = function() {
    this.HIT_RADIUS = .80 / (digsim.MIN_GRID_SIZE - digsim.MAX_GRID_SIZE) *
    (digsim.GRID_SIZE - digsim.MIN_GRID_SIZE) + 1; 
}

/*****************************************************************************
 * WINDOW RESIZE
 *  Handles resizing of the browser window and sets all needed variables to 
 *  set canvas size
 ****************************************************************************/
$(window).resize(function() {
    // Resize Canvas
    digsim.NUM_COLS = Math.floor((window.innerWidth - $('.canvases').position().left) / digsim.GRID_SIZE);
    digsim.NUM_ROWS = Math.floor((window.innerHeight - $('.canvases').position().top) / digsim.GRID_SIZE);
    digsim.gridWidth = digsim.NUM_COLS * digsim.GRID_SIZE;
    digsim.gridHeight = digsim.NUM_ROWS * digsim.GRID_SIZE;
    $('canvas').width(digsim.gridWidth);
    $('canvas').height(digsim.gridHeight);
    digsim.init();
    digsim.drawGrid(digsim.gridContext);
    digsim.drawComponents();

    // Resize message box
    $('.messages').css('height', digsim.gridHeight - 37);

});

/*****************************************************************************
 * KEY EVENTS
 *  The keycodes that will be mapped when a user presses a button
 ****************************************************************************/
KEY_CODES = {
    27: 'esc',
    50: 'two',
    51: 'three',
    52: 'four',
    's65': 'NAND',
    's82': 'NOR',
    65: 'AND',
    69: 'LED',
    84: 'NOT',
    82: 'OR',
    83: 'Switch',
    85: 'Run',
    87: 'Wire',
    88: 'XOR',
    71: 'Toggle_Grid',
    90: 'Zoom_In',
    's90': 'Zoom_Out',
    46: 'Delete',
    'c88': 'Cut',
    'c67': 'Copy',
    'c86': 'Paste',
    50: '2-input',
    51: '3-input',
    52: '4-input',
    67: 'Clock',
    9: 'Rotate_CW',
    's9': 'Rotate_CCW'
};
HOT_KEYS = {
    'AND': 'A',
    'OR': 'R',
    'NOT': 'T',
    'NAND': 'shift+A',
    'NOR': 'shift+R',
    'XOR': 'X',
    'Switch': 'S',
    'LED': 'E',
    'Wire': 'W',
    'Run': 'U',
    'Toggle_Grid': 'G',
    'Zoom_In': 'Z',
    'Zoom_Out': 'shift+Z',
    'Delete': 'del',
    'Cut': 'ctrl+X',
    'Copy': 'ctrl+C',
    'Paste': 'ctrl+V',
    '2-input': '2',
    '3-input': '3',
    '4-input': '4',
    'Clock': 'C',
    'Rotate_CW': 'Tab',
    'Rotate_CCW': 'shift+Tab'
};
document.onkeydown = function(event) {
    // return which key was pressed.
    var keyCode = (event.keyCode) ? event.keyCode : event.charCode; // Firefox and opera use charCode instead of keyCode to
    var id;

    console.log('Pressed: ' + keyCode);
    console.log(event);

    // Stop tabbing of buttons
    if (keyCode === 9) {
        event.preventDefault();
    }

    // Don't do anything when mac user refresh
    if (!(keyCode === 82 && event.metaKey)) {
    
        if(event.shiftKey) {
            id = KEY_CODES['s'+keyCode];
        }
        else if (event.ctrlKey) {
            console.log("ctrl down");
            id = KEY_CODES['c'+keyCode];
        }
        else {
            id = KEY_CODES[keyCode];
        }
        console.log("ID: " + id);

        if (id === 'esc') {
            digsim.deactivate();
            console.log("deactivate");
        }
        else if (id) {
            if(!$('#'+id).hasClass('disabled')) {
                $("#" + id).click();
            }
        }
    }
};



/*============================================================================
  ============================================================================
  ============================ ANIMATION FUNCTIONS ===========================
  ============================================================================
  ============================================================================*/

/*****************************************************************************
 * ANIMATE
 *  Anything that is being moved will be drawn with this function on the 
 *  movingContext canvas. 
 ****************************************************************************/
function animate() {
    if (digsim.dragging) {
        digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
        
        requestAnimFrame(animate);
        
        // Draw gate
        var col = Math.floor(digsim.mousePos.x / digsim.GRID_SIZE);
        var row = Math.floor(digsim.mousePos.y / digsim.GRID_SIZE);
        digsim.draggingGate.column = col - digsim.offsetCol;
        digsim.draggingGate.row = row - digsim.offsetRow;
        digsim.draggingGate.draw(digsim.movingContext, 'red');
    }
};

/*****************************************************************************
 * ANIMATE WIRE
 *  While a wire is being placed, keep a line drawn from starting point to 
 *  mouse position
 ****************************************************************************/
function animateWire() {
    var context = digsim.movingContext;
    digsim.clearCanvas(context, digsim.gridWidth, digsim.gridHeight);
    
    var col = Math.floor(digsim.mousePos.x / digsim.GRID_SIZE);
    var row = Math.floor(digsim.mousePos.y / digsim.GRID_SIZE);
    
    if (digsim.dragging) {
        
        requestAnimFrame(animateWire);
        
        // Draw wire
        context.beginPath();
        context.fillStyle = '#000000';
        context.lineWidth = 2;
        context.strokeStyle = '#3399FF';
        context.lineCap = 'round';
        context.arc(digsim.wirePos.startX * digsim.GRID_SIZE, digsim.wirePos.startY * digsim.GRID_SIZE, 2, 0, 2 * Math.PI);
        context.moveTo(digsim.wirePos.startX * digsim.GRID_SIZE, digsim.wirePos.startY * digsim.GRID_SIZE);
        var x, y;
        // Chooses which direction to lock to, based on which component is furthest from
        // the start point.
        if (Math.abs(digsim.wirePos.startY * digsim.GRID_SIZE - digsim.mousePos.y) >
            Math.abs(digsim.wirePos.startX * digsim.GRID_SIZE - digsim.mousePos.x)) {
            digsim.lockV = true;
            digsim.lockH = false;
        }
        else {
            digsim.lockV = false;
            digsim.lockH = true;
        }
        
        if (digsim.lockH) {
            x = digsim.mousePos.x;
            y = digsim.wirePos.startY * digsim.GRID_SIZE;
        }
        else if (digsim.lockV) {
            y = digsim.mousePos.y;
            x = digsim.wirePos.startX * digsim.GRID_SIZE;
        }
        else {
            x = digsim.mousePos.x;
            y = digsim.mousePos.y;
        }
        context.lineTo(x, y); 
        context.stroke();
    }
};

/*****************************************************************************
 * CLOCK CYCLE
 *  Animate function for the clock
 ****************************************************************************/
function cycleClock() {
    
    if (digsim.mode === digsim.SIM_MODE) {
        ++digsim.clkCnt;
        requestAnimFrame(cycleClock);
        if (digsim.clkCnt > digsim.CLK_FREQ) { // FPS is approximately 60 Hz
            
            digsim.clkCnt = 0;
            for (var i = 0, len = digsim.drivers.length; i < len; ++i) {
                var driver = digsim.components[ digsim.drivers[i] ];
                if (driver.type === digsim.CLOCK) {
                    console.log("");
                    console.log("");
                    console.log("");
                    console.log("********************BEGIN PASS STATE!********************");
                    driver.passState(!driver.state);
                    digsim.drawComponents();
                }
            }
        }
    }
};

/*****************************************************************************
 * REQUEST ANIMATION FRAME
 *  Optimizes the 60 frames/sec animation frame rate relative to the browser
 ****************************************************************************/
window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(callback, element){
                window.setTimeout(callback, 1000 / 60);
            };
})();



/*============================================================================
  ============================================================================
  ============================= HELPER FUNCTIONS =============================
  ============================================================================
  ============================================================================*/

/*****************************************************************************
 * ADD MESSAGE
 *  Adds error and warning messages to the message window
 ****************************************************************************/
Digsim.prototype.addMessage = function(type, msg) {
    if (type === digsim.ERROR) {
        $('#messages').append("<span class='error'>" + msg + "</span><br>");
        digsim.deactivate();
    }
    else if (type === digsim.WARNING) {
        $('#messages').append("<span class='warning'>" + msg + "</span><br>");
    }
    
}

/*****************************************************************************
 * SHOW PLACEHOLDERS
 *  Debug method used to see placeholder objects visually on the grid.
 ****************************************************************************/
Digsim.prototype.showPlaceholders = function() {
    this.clearCanvas(this.gridContext, this.gridWidth, this.gridHeight);
    this.drawGrid(this.gridContext);

    var row = 0; col = 0;
    for (row = 0; row < this.NUM_ROWS; row++) {
        for (col = 0; col < this.NUM_COLS; col++) {
            if (this.placeholder[row][col] instanceof Array) {
                for (var z = 0; z < 4; z++) {
                    if (this.placeholder[row][col][z]) {
                        this.gridContext.fillStyle = 'orange';
                        this.gridContext.save();

                        this.gridContext.translate(col * this.GRID_SIZE, row * this.GRID_SIZE);

                        this.gridContext.translate(this.GRID_SIZE / 2, this.GRID_SIZE / 2)
                        this.gridContext.rotate((90 * z) * Math.PI / 180);
                        this.gridContext.translate(-this.GRID_SIZE / 2, -this.GRID_SIZE / 2)

                        this.gridContext.beginPath();
                        this.gridContext.moveTo(0,0);
                        this.gridContext.lineTo(this.GRID_SIZE, 0);
                        this.gridContext.lineTo(this.GRID_SIZE / 2, this.GRID_SIZE / 2);
                        this.gridContext.closePath();
                        this.gridContext.stroke();
                        this.gridContext.fill();
                        this.gridContext.restore();

                        this.movingContext.fillStyle = 'black';
                        this.movingContext.font = "10pt Calibri";
                        this.movingContext.fillText(this.placeholder[row][col][z].ref, col * this.GRID_SIZE + this.GRID_SIZE / 2 - (z % 2 * 10), row * this.GRID_SIZE + this.GRID_SIZE / 2 + (z % 2 * 10));
                    }
                }
            }
            else if (this.placeholder[row][col]) {
                this.gridContext.fillStyle = 'orange';
                this.gridContext.fillRect(col * this.GRID_SIZE + 1, row * this.GRID_SIZE + 1, this.GRID_SIZE - 1, this.GRID_SIZE - 1);
                this.movingContext.fillStyle = 'black';
                this.movingContext.font = "18pt Calibri";
                this.movingContext.fillText(this.placeholder[row][col].ref, col * this.GRID_SIZE + this.GRID_SIZE / 2 - 10, row * this.GRID_SIZE + this.GRID_SIZE / 2 + 10);
            }
        }
    }
};

/*****************************************************************************
 * NAMESPACE
 *  Create namespace for the application. If namespace already exisists, don't
 *  override it, otherwise create an empty object.
 ****************************************************************************/
var digsim = digsim || new Digsim();





