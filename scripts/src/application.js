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
 * fix placeholder cleanup of switch and maybe others
 * select switch with wire click thingy yeah
 * pick up wires
 * Panning
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
    this.CLK_FREQ = 60; // This number divided by 60 is delay (in seconds) between changes in the clock state
    
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
    this.DFF = 100;
    this.JKFF = 101;
    this.MUX = 102;

    this.DEFAULT_MODE = 0; 
    this.WIRE_MODE = 1;     // For placing wires
    this.SIM_MODE = 2;      // For simulation
    this.PLACE_MODE = 3;    // Placing components

    this.WARNING = 0;       // Orange(ish) warning messages - simulation will still run
    this.ERROR = 1;         // Red error messages - will not simulate

    this.PREV = 0;
    this.NEXT = 1;

    this.TL = 0;            // Top, bottom, left, right selection of wires in grids
    this.TR = 1;
    this.BR = 2;
    this.BL = 3;

    // Animation variables
    this.wirePos = {        // When drawing wires, this will contain the 
        startX: -1,         // starting position information
        startY: -1, 
        startPos: -1, 
    };
    this.dragging = false;  // When this is true, we are dragging a wire
    this.draggingComponent;      // When this is true, we are dragging a gate
    this.lockH = 0;         // Locks the wire horizontally (non-autorouting)
    this.lockV = 0;         // Locks the wire vertically (non-autorouting)
    this.clkCnt = 0;        // This will count to digsim.CLK_FREQ before it resets and changes states
    this.rotation = 0;      // Gives the rotation of the current selected object in degrees - resets when 
                            // entering new modes
    // Grid variables
    this.gridWidth = this.NUM_COLS * this.GRID_SIZE;
    this.gridHeight = this.NUM_ROWS * this.GRID_SIZE;
    this.mousePos = { x: -1, y: -1 };
    this.offsetCol = 0;     // "Global" variable needed for even functions
    this.offsetRow = 0;     // "Global" variable needed for even functions
    this.gridToggle = 0;    // Toggles the grid (tri-state)

    // Gate identifier
    this.iComp = 0;         // Gives each component a new unique identifier
    this.numGateInputs = 2; // Number of inputs - attached to the user interface selection
    this.prevGate = "";     // Needed for event functions

    // Misc
    this.clipboard;         // Used for cut/copy/paste
    this.selectedComponent; // Used for selecting components :D
    this.mode = 0;          // The current mode

    // Flip flop simulation
    this.RISING_EDGE = false;   // Used to simulate the rising edge of the clock

    // Autorouting
    this.autoroute = true;  // Turns the autoroute function on and off
    this.endRoute = false;  // Decides if we will start a new wire where we've ended the
                            // last one, based on if we've connected to something or not
    // Data arrays
    this.components = [];   // Holds all of the objects by their unique ID 
    this.drivers = [];      // Holds the place of the logic drivers in components[].
    this.placeholder = [];  // Holds component positions on grid
    for (var i = 0; i < this.NUM_COLS; ++i) {
        this.placeholder[i] = [];   // Set placeholder to a 2D array
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
        // Assign funcitons to onClick events
        $("canvas").on("mousedown", this.onGridMouseDown);
        $("canvas").on("mouseup", this.onGridMouseUp);
        $("canvas").on("click", this.onGridClicked);
        $("canvas").on("mousemove", this.onGridMouseMove);
        $(".gates>ul>li>a, .io a, .modes a").on("click", this.onButtonClicked);
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
    for (index in this.components) {
        if(typeof this.components[index] !== 'undefined' && this.components[index].drawStatic) {
            this.components[index].draw(this.staticContext);
        }
    }
};

/*****************************************************************************
 * DELETE COMPONENT
 *  Remove component from component array, delete itself from all of its
 *  connections, then delete its placeholders
 ****************************************************************************/
Digsim.prototype.deleteComponent = function() {
    obj = this.selectedComponent;
    // If it's a driver, remove it from the drivers[] array also
    if (obj.type === this.SWITCH || obj.type === this.CLOCK) {
        this.drivers.splice(this.drivers.indexOf(obj.id), 1);
    }
    this.disableControls();
    delete this.components[obj.id]; // = undefined;
    this.deleteConnections(obj);
    this.deletePlaceholder(obj);
}

/*****************************************************************************
 * DELETE CONNECTIONS
 *  Remove all connections for the component.
 *
 *  obj - the object whose connections we need to delete
 ****************************************************************************/
Digsim.prototype.deleteConnections = function(obj) {

    var index, connections;
    // First, remove the object from its connections' list of connections
    for (var i = 0; i < obj.connections.length; ++i) {
        connections = obj.connections[i].connections;
        connections.splice(connections.indexOf(obj),1);
    }

    // Remove connetions to gates - must be used because gates use
    // a prevConnect variable
    if (obj.type < 0) {
        for (var i = 0; i < obj.prevConnect.length; ++i) {
            connections = obj.prevConnect[i].connections;
            index = connections.indexOf(obj);
            if (index >= 0) {
                connections.splice(index, 1);
            }
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

    var row, col, tempRow, tempCol, cnt, conCol, conRow, placeholder, utilMath;
    var factor = Math.floor(obj.numInputs / 2) || 1; // Used for sizeable gates
    var index, rot = obj.rotation; // rotation variables
    var tempPlaceholders = []; // Save placeholders here while checking for collisions

    // Check the object space for collision
    for (row = 0; row < obj.dimension.row; ++row) {
        for (col = 0; col < obj.dimension.col; ++col) {
            // Check for collision
            tempRow = obj.row + row;
            tempCol = obj.col + col;
            console.log("TEMPSTUFF: " + tempRow + "  " + tempCol);
            console.log(this.placeholder[tempRow][tempCol]);
            if (this.placeholder[tempRow][tempCol]) {
                console.error("COLLISION! ERROR!");
                digsim.addMessage(digsim.WARNING, "[1]Collision detected! Unable to place component. ");
                return false;
            }

            // Set temporary placeholder
            if (!(tempPlaceholders[tempRow] instanceof Array)) {
                tempPlaceholders[tempRow] = [];
            }
            tempPlaceholders[tempRow][tempCol] = new Placeholder(obj.id, col, row, obj.dimension.col, obj.dimension.row);
        }
    } 

    // Check connection points for collision
    cnt = 0;        

    // Previous
    for (var i = 0; i < obj.numInputs; ++i) {
        
        // Calculate positions of connections based on rotation
        utilMath = this.rotationMath(obj, this.PREV, i, cnt); 
        conRow = utilMath.conRow;
        conCol = utilMath.conCol;
        cnt = utilMath.cnt;
        index = utilMath.index;
        
        // If grid space is not an array and contains something...
        if (!(this.placeholder[conRow][conCol] instanceof Array) && this.placeholder[conRow][conCol]) {
            digsim.addMessage(digsim.WARNING, "[2]Collision detected! Unable to place component.");
            return false;
        }
        // If grid space is an array and contains something...
        else if ((this.placeholder[conRow][conCol] instanceof Array) && this.placeholder[conRow][conCol][index]) {
            digsim.addMessage(digsim.WARNING, "[3]Collision detected! Unable to place component.");
            return false;
        }

        // Set temporary placeholder
        if (!(tempPlaceholders[conRow] instanceof Array)) { // If it's not a 2D array, make it a 2D array
            tempPlaceholders[conRow] = [];
        }
        if (!(tempPlaceholders[conRow][conCol] instanceof Array)) { // If it's not a 3D array, make it a 3D array (for wires only)
            tempPlaceholders[conRow][conCol] = [];
        }
        tempPlaceholders[conRow][conCol][index] = new Placeholder(obj.id, obj.col + 1, obj.row + 1, obj.dimension.col, obj.dimension.row);
    }

    // Nexts
    utilMath = this.rotationMath(obj, this.NEXT, i, cnt);
    conRow = utilMath.conRow;
    conCol = utilMath.conCol;
    cnt = utilMath.cnt;
    index = utilMath.index;
    
    // If it's not a wire, but there's still something there...
    if (!(this.placeholder[conRow][conCol] instanceof Array) && this.placeholder[conRow][conCol]) {
        digsim.addMessage(digsim.WARNING, "[4]Collision detected! Unable to place component.");
        return false;
    }
    // If there's wires there and in the spot where we need the placeholder...
    else if ((this.placeholder[conRow][conCol] instanceof Array) && this.placeholder[conRow][conCol][index]) {
        digsim.addMessage(digsim.WARNING, "[5]Collision detected! Unable to place component.");
        return false;
    }

    // Set temporary placeholder
    if (!(tempPlaceholders[conRow] instanceof Array)) { // If it's not a 2D array, make it a 2D array
        tempPlaceholders[conRow] = [];
    }
    if (!(tempPlaceholders[conRow][conCol] instanceof Array)) { // If it's not a 3D array, make it a 3D array
        tempPlaceholders[conRow][conCol] = [];
    }
    tempPlaceholders[conRow][conCol][index] = new Placeholder(obj.id, obj.col + 1, obj.row + 1, obj.dimension.col, obj.dimension.row);

    // Additional placeholers for Not gate, Switch, and Clock
    if (obj.type === digsim.NOT) {
        var col = obj.col, row = obj.row, index;
        if (obj.rotation === 180) {
            col++;
        }
        else if (obj.rotation === 270) {
            row++;
        }
        for (var y = 0; y < 2; ++y) {
            if (((obj.rotation) / 90) % 2) {
                if (y) {
                    col = obj.col + obj.dimension.col;
                    index = 3;
                }
                else {
                    index = 1;
                    col = obj.col - 1;    
                }
            }
            else {
                if (y) {
                    row = obj.row + obj.dimension.row;
                    index = 0;
                }
                else {
                    index = 2;
                    row = obj.row - 1;
                }
            }
            // Check for collision
            // If it's not an array and there's something there...
            if (!(this.placeholder[row][col] instanceof Array) && this.placeholder[row][col]) {
                digsim.addMessage(digsim.WARNING, "[6]Collision detected! Unable to place component.");
                return false;
            }
            // If it is an array (wire) and there's something there
            else if ((this.placeholder[row][col] instanceof Array) && this.placeholder[row][col][index]) {
                digsim.addMessage(digsim.WARNING, "[7]Collision detected! Unable to place component.");
                return false;
            }

            // Set temporary placeholder
            if (!(tempPlaceholders[row] instanceof Array)) { // If it's not a 2D array, make it so
                tempPlaceholders[row] = [];
            }
            if (!(tempPlaceholders[row][col] instanceof Array)) { // If it's not a 3D array, make it so
                tempPlaceholders[row][col] = [];
            }
            tempPlaceholders[row][col][index] = new Placeholder(obj.id, col, row, obj.dimension.col, obj.dimension.row, false);
        }
    }
    else if (obj.type === digsim.SWITCH || obj.type === digsim.CLOCK) {
        var col = obj.col, row = obj.row, index;
        for (var x = 0, len = Math.max(obj.dimension.row, obj.dimension.col); x < len; ++x) {
            for (var y = 0; y < 2; ++y) {
                if (((obj.rotation) / 90) % 2) {
                    if (y) {
                        col = obj.col + obj.dimension.col;
                        index = 3;
                    }
                    else {
                        index = 1;
                        col = obj.col - 1;    
                    }
                }
                else {
                    if (y) {
                        row = obj.row + obj.dimension.row;
                        index = 0;
                    }
                    else {
                        index = 2;
                        row = obj.row - 1;
                    }
                }
                // Check for collision
                // If it's not a wire but there's still something there
                if (!(this.placeholder[row][col] instanceof Array) && this.placeholder[row][col]) {
                    digsim.addMessage(digsim.WARNING, "[8]Collision detected! Unable to place component.");
                    return false;
                }
                // If there are wires in this grid space, make sure there aren't wires in the place we're putting the component
                else if ((this.placeholder[row][col] instanceof Array) && this.placeholder[row][col][index]) {
                    digsim.addMessage(digsim.WARNING, "[9]Collision detected! Unable to place component.");
                    return false;
                }

                // Set temporary placeholder
                if (!(tempPlaceholders[row] instanceof Array)) { // If it's not 2D, make it so
                    tempPlaceholders[row] = [];
                }
                if (!(tempPlaceholders[row][col] instanceof Array)) { // If it's not 3D, make it so
                    tempPlaceholders[row][col] = [];
                }
                tempPlaceholders[row][col][index] = new Placeholder(obj.id, col, row, obj.dimension.col, obj.dimension.row, false);
            }
            if (obj.rotation === 90 || obj.rotation === 270) {
                ++row;
            }
            else {
                ++col;
            }
        }
    }

    console.log("NO COLLISION! :)");

    // There are no collisions, so transfer the temporary placeholders to permanent placeholders
    for(var row in tempPlaceholders) {
        for (var col in tempPlaceholders[row]) {
            if (tempPlaceholders[row][col] instanceof Array) {
                if (!(this.placeholder[row][col] instanceof Array)) {
                    this.placeholder[row][col] = [];
                }
                for (var index in tempPlaceholders[row][col]) {
                    this.placeholder[row][col][index] = tempPlaceholders[row][col][index];
                }
            }
            else {
                this.placeholder[row][col] = tempPlaceholders[row][col];
            }
        }
    }

    console.log("RETURN TRUE:");
    return true;
};

/*****************************************************************************
 * UTILITY: CHECK ADJACENT
 *  Used for autorouting to see if adjacent cells containing wires are valid
 *  paths
 *
 *  curr   - current node
 *  d      - direction we're looking to travel in
 *  target - the goal we're trying to get to 
 ****************************************************************************/
Digsim.prototype.checkAdj = function(curr, d, target) {
    var r = curr.r; 
    var c = curr.c;
    var t;
    if (digsim.placeholder[r][c] instanceof Array &&
        typeof digsim.placeholder[r][c][d] !== 'undefined') {
        return false;
    }
    switch (d)
    {
        case 0: // moving up
            t =    (typeof digsim.placeholder[r-1][c][0] === 'undefined') &&
                   (typeof digsim.placeholder[r-1][c][1] !== 'undefined') &&
                   (typeof digsim.placeholder[r-1][c][2] === 'undefined') &&
                   (typeof digsim.placeholder[r-1][c][3] !== 'undefined');
                   // console.log("("+c+","+(r-1)+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return ((r - 1) === target.r && c === target.c) ? true : t;
            break;
        case 1: // moving right
            t =    (typeof digsim.placeholder[r][c+1][0] !== 'undefined') &&
                   (typeof digsim.placeholder[r][c+1][1] === 'undefined') &&
                   (typeof digsim.placeholder[r][c+1][2] !== 'undefined') &&
                   (typeof digsim.placeholder[r][c+1][3] === 'undefined');
                   // console.log("("+(c+1)+","+r+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return (r === target.r && (c + 1) === target.c) ? true : t;
            break; 
        case 2: // moving down
            t =    (typeof digsim.placeholder[r+1][c][0] === 'undefined') &&
                   (typeof digsim.placeholder[r+1][c][1] !== 'undefined') &&
                   (typeof digsim.placeholder[r+1][c][2] === 'undefined') &&
                   (typeof digsim.placeholder[r+1][c][3] !== 'undefined');
                   // console.log("("+c+","+(r+1)+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return ((r + 1) === target.r && c === target.c) ? true : t;
            break;
        default: // moving left
            t =    (typeof digsim.placeholder[r][c-1][0] !== 'undefined') &&
                   (typeof digsim.placeholder[r][c-1][1] === 'undefined') &&
                   (typeof digsim.placeholder[r][c-1][2] !== 'undefined') &&
                   (typeof digsim.placeholder[r][c-1][3] === 'undefined');
                   // console.log("("+(c-1)+","+r+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return (r === target.r && (c - 1) === target.c) ? true : t;
    }
};

/*****************************************************************************
 * UTILITY: ROTATION MATH
 *  To get rid of redundant code, this will take care of all the rotation math
 *  that must be computed.
 *
 *  obj - the object we need to calculate the rotation stuff for
 *  con - we need to look at either previous connections or next connection
 *  i   - often, this function is called within a loop that loops through
 *        multiple connections. This variable takes care of that
 *  cnt - related to i
 ****************************************************************************/
Digsim.prototype.rotationMath = function(obj, con, i, cnt) {
    
    var conCol, conRow, factor = 1;
    if (obj.type < 0) {
        factor = Math.floor(obj.numInputs / 2) || 1;
        if (obj.type === digsim.NOT) {
            factor = 0;
        }
    }
    else if (obj.type === digsim.SWITCH || obj.type === digsim.CLOCK) {
        factor = 0;
    }

    var index, rot = obj.rotation; // rotation variables
    
    if (con === this.PREV) {
        // Previous
        switch (rot / 90)
        {
            case 0:
                conCol = obj.col - 1;
                index = 1;
                conRow = obj.row;
                break;
            case 1:
                conCol = obj.col;
                conRow = obj.row - 1;
                index = 2;
                break;
            case 2:
                conRow = obj.row;
                conCol = obj.dimension.col + obj.col;
                index = 3;
                break;
            default:
                conCol = obj.col;
                conRow = obj.dimension.row + obj.row;
                index = 0;
                break;
        }

        if (obj.type !== digsim.NOT) {
            if (i % 2) {
                if (rot === 0 || rot === 180) {
                    conRow = obj.row + (factor * 2) - cnt++;
                }
                else {
                    conCol = obj.col + (factor * 2) - cnt++;
                }
            }
            else {
                if (rot === 0 || rot === 180) {
                    conRow = obj.row + cnt;
                }
                else {
                    conCol = obj.col + cnt;
                }
            }
        }
    }
    
    else {
        // Next
        if (obj.type === digsim.LED) {
            switch (rot / 90)
            {
                case 0:
                    conCol = obj.col;
                    conRow = obj.row + 2;
                    index = 0;
                    break;
                case 1:
                    index = 1;
                    conCol = obj.col - 1;
                    conRow = obj.row;
                    break;
                case 2:
                    index = 2;
                    conCol = obj.col;
                    conRow = obj.row - 1;
                    break;
                default:
                    index = 3;
                    conCol = obj.col + 2;
                    conRow = obj.row;
            }
        }
        else {

            switch (rot / 90)
            {
                case 0:
                    conCol = obj.col + obj.dimension.col;
                    conRow = obj.row + factor;
                    index = 3;
                    console.log("case 0");
                    break;
                case 1:
                    index = 0;
                    conCol = obj.col + factor;
                    conRow = obj.row + obj.dimension.row;
                    console.log("case 1");
                    break;
                case 2:
                    index = 1;
                    conCol = obj.col  - 1;
                    conRow = obj.row + factor;
                    console.log("case 2");
                    break;
                default:
                    index = 2;
                    conCol = obj.col + factor;
                    conRow = obj.row - 1;
                    console.log("case default");
            }
        }
        console.log("ROW: " + conRow);
    }
    return {'conRow': conRow, 'conCol': conCol, 'cnt': cnt, 'index': index};
};

/*****************************************************************************
 * SET WIRE PLACEHOLDER
 *  Given a wire object, add it to the placeholder data array with unique
 *  identifier. 
 *
 * wire    - the wire object
 * dx      - indicates a horizontal wire
 * dy      - indicates a vertical wire
 * nocheck - autorouting already does placeholder checking, so we can skip 
 *           this step in some instances
 ****************************************************************************/
Digsim.prototype.setWirePlaceholders = function(wire, dx, dy, nocheck) {
    //console.log("row: " + row + "\ncol: " + col);
    
    console.log(wire);
    var endRow = wire.path[0].y + wire.row; 
    var endCol = wire.path[0].x + wire.col; // Current ending pos
    
    var floorEndRow = Math.floor(endRow);
    var floorEndCol = Math.floor(endCol);
       
    console.log("wire.col: " + wire.col + " wire.row: " + wire.row);
    
    var initial = Math.floor(dx ? Math.floor(wire.col): (dy ? Math.floor(wire.row) : 0));
    var endBool = (dx ? floorEndCol + dx : (dy ? floorEndRow + dy : 0));
    var inc = dx ? dx : (dy ? dy : 0);
    var row, col, end, begin, j, thisPH;
    console.log("DX: " + dx + "  DY: " + dy);
    console.log("I: " + initial + "  ENDBOOL " + endBool);
    console.log("INC: " + inc);

    if (!nocheck) { // Here we will check for collisions
        if (dx) {
            console.log("CHECKING FOR COLLISION(DX)");
            end = Math.max(wire.col, endCol);   // take care of left to right or right to left wires
            begin = Math.min(wire.col, endCol);
            j = Math.floor(begin);
            while (j < end) {
                console.log("J: " + j + "  END: " + (end) + "  INC/2: " + inc/2)
                console.log("J%1: " + (j % 1));
                thisPH = this.placeholder[floorEndRow][Math.floor(j)];

                if (thisPH instanceof Array) {
                    if (j >= begin) {
                        
                        if (j % 1) { // we're looking at index 1 and 3 (left and right)
                            console.log("placed at index " + 1);
                            if (thisPH[1]) {
                                console.error("wire collision error!");
                                digsim.addMessage(digsim.WARNING, "[10]Collision detected! Unable to place wire.");
                                return false;
                            }
                        }
                        else if (thisPH[3]) {
                            console.error("wire collision error!");
                            digsim.addMessage(digsim.WARNING, "[11]Collision detected! Unable to place wire.");
                            return false;
                        }
                    }
                    j += 0.5;
                }
                else if (thisPH) { // There's something in this placeholder
                    console.error("COLLISION! ERROR!");
                    digsim.addMessage(digsim.WARNING, "[12]Collision detected! Unable to place wire.");
                    return false;
                }
                else {
                    ++j;
                }
                console.log("");
            }
        }
        else if (dy) { // Vertical wires
            console.log("CHECKING FOR COLLISION(DY)");
            end = Math.max(wire.row, endRow);   // Take care of wires placed up and down
            begin = Math.min(wire.row, endRow); // or down and up
            j = Math.floor(begin);
            while (j < end) {
                console.log("J: " + j + "  END: " + (end) + "  INC/2: " + inc/2)
                console.log("J%1: " + (j % 1));
                thisPH = this.placeholder[Math.floor(j)][floorEndCol];
                if (thisPH instanceof Array) {  // There are wires already placed - we must make sure that there are none
                    if (j >= begin) {           // placed in indexes 0 or 2
                        
                        if (j % 1) {
                            console.log("placed at index " + 1);
                            if (thisPH[2]) {
                                console.error("wire collision error!");
                                digsim.addMessage(digsim.WARNING, "[13]Collision detected! Unable to place wire.");
                                return false;
                            }
                        }
                        else if (thisPH[0]) {
                            console.error("wire collision error!");
                            digsim.addMessage(digsim.WARNING, "[14]Collision detected! Unable to place wire.");
                            return false;
                        }
                    }
                    j += 0.5;
                }
                else if (thisPH) {  // There's another component in the way
                    console.error("COLLISION! ERROR!");
                    digsim.addMessage(digsim.WARNING, "[15]Collision detected! Unable to place wire.");
                    return false;
                }
                else {
                    ++j;
                }
                console.log("");
            }
        }
    }

    console.log("NO COLLISION DETECTED");
    placeholder = new Placeholder(wire.id, 0, 0, 1);

    if (dx) {
        console.log("DX: " + dx);
        var end = Math.max(wire.col, endCol);
        for (var j = Math.min(wire.col, endCol); j !== end; j += 0.5) {
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
        var endCol = obj.col + obj.path[0].x;
        var floorEndRow = Math.floor(endRow);
        var floorEndCol = Math.floor(endCol);
        var row, col;
        console.log("endRow: " + endRow);
        console.log("endCol: " + endCol);
        console.log("floorEndRow: " + floorEndRow);
        console.log("floorEndCol: " + floorEndCol);
        // return;
        if (obj.dx) {
            var end = Math.max(obj.col, endCol);
            for (var j = Math.min(obj.col, endCol); j !== end; j += 0.5) {
                console.log("J%1: " + (j % 1));
                col = Math.floor(j);
                console.log("col: " + col);
                console.log(this.placeholder[floorEndRow][col]);
                if (j % 1) {
                    console.log("placed at index " + 1);
                    delete this.placeholder[floorEndRow][col][1]; // = undefined;
                }
                else {
                    console.log("placed at index " + 3);
                    delete this.placeholder[floorEndRow][col][3]; // = undefined;
                }
                var noneFound = true;
                for (var k = 0; k < 4; ++k) {
                    if (k != index && this.placeholder[floorEndRow][col][k]) {
                        noneFound = false;
                    }
                }
                if (noneFound) {
                    delete this.placeholder[floorEndRow][col]; // = undefined;
                }
                console.log("");
            }
        }
        else if (obj.dy) {
            var end = Math.max(obj.row, endRow);
            for (var j = Math.min(obj.row, endRow); j !== end; j += 0.5) {
                console.log("J: "+j);
                console.log("J%1: " + (j % 1));
                row = Math.floor(j);
                if (j % 1) {
                    console.log(this.placeholder[row][floorEndCol]);
                    //console.log("row: " + row + ", floorEndCol: " + floorEndCol);
                    delete this.placeholder[row][floorEndCol][2]; // = undefined;
                }
                else {
                    delete this.placeholder[row][floorEndCol][0]; // = undefined;
                }
                var noneFound = true;
                for (var k = 0; k < 4; ++k) {
                    if (k != index && this.placeholder[row][floorEndCol][k]) {
                        noneFound = false;
                    }
                }
                if (noneFound) {
                    delete this.placeholder[row][floorEndCol]; // = undefined;
                }
            }
        }
        this.drawComponents();
        return;
    }
    
    // Remove the component from the array
    for (var row = 0; row < obj.dimension.row; ++row) {
        for (var col = 0; col < obj.dimension.col; ++col) {
            delete digsim.placeholder[obj.row + row][obj.col + col]; // = undefined;
        }
    }
    
    var row, col, cnt, conCol, conRow, index;
    var factor = Math.floor(obj.numInputs / 2) || 1;

    if (obj.type < 0) { // gate
        cnt = 0;

        if (obj.type === digsim.NOT) {
            var col = obj.col, row = obj.row, index;
            console.log("{row, col} = {" + obj.dimension.row + ", " + obj.dimension.col + "}; max: " + len);
            if (obj.rotation === 180) {
                col++;
            }
            else if (obj.rotation === 270) {
                row++;
            }
            for (var y = 0; y < 2; ++y) {
                if (((obj.rotation) / 90) % 2) {
                    if (y) {
                        col = obj.col + obj.dimension.col;
                        index = 3;
                    }
                    else {
                        index = 1;
                        col = obj.col - 1;    
                    }
                }
                else {
                    if (y) {
                        row = obj.row + obj.dimension.row;
                        index = 0;
                    }
                    else {
                        index = 2;
                        row = obj.row - 1;
                    }
                }
                // Place connection placeholders
                var noneFound = true;
                for (var j = 0; j < 4; ++j) {
                    if (j != index && this.placeholder[row][col][j]) {
                        noneFound = false;
                    }
                }
                if (noneFound) {
                    delete this.placeholder[row][col]; // = undefined;
                }
                else {
                    delete this.placeholder[row][col][index]; // = undefined;
                }
            }
        }

        // Previous
        for (var i = 0; i < obj.numInputs; ++i) {            
            utilMath = this.rotationMath(obj, this.PREV, i, cnt);
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
                delete this.placeholder[conRow][conCol]; // = undefined;
            }
            else {
                delete this.placeholder[conRow][conCol][index]; // = undefined;
            }
        }

        // Next
        utilMath = this.rotationMath(obj, this.NEXT, i, cnt);
        conRow = utilMath.conRow;
        conCol = utilMath.conCol;
        cnt = utilMath.cnt;
        index = utilMath.index;
        
        var noneFound = true;
        for (var j = 0; j < 4; ++j) {
            if (j != index && this.placeholder[conRow][conCol][j]) {
                noneFound = false;
            }
        }
        if (noneFound) {
            delete this.placeholder[conRow][conCol]; // = undefined;
        }
        else {
            delete this.placeholder[conRow][conCol][index]; // = undefined;
        }
    }
    else {

         if (obj.type !== digsim.LED) {
            var col = obj.col, row = obj.row, index;
            for (var x = 0, len = Math.max(obj.dimension.row, obj.dimension.col); x < len; ++x) {
                for (var y = 0; y < 2; ++y) {
                    if (((obj.rotation) / 90) % 2) {
                        if (y) {
                            col = obj.col + obj.dimension.col;
                            index = 3;
                        }
                        else {
                            index = 1;
                            col = obj.col - 1;    
                        }
                    }
                    else {
                        if (y) {
                            row = obj.row + obj.dimension.row;
                            index = 0;
                        }
                        else {
                            index = 2;
                            row = obj.row - 1;
                        }
                    }
                    var noneFound = true;
                    for (var j = 0; j < 4; ++j) {
                        if (j != index && this.placeholder[row][col][j]) {
                            noneFound = false;
                        }
                    }
                    console.log("NONEFOUND: " + noneFound + " AT {" + row + "," + col + "}");
                    if (noneFound) {
                        delete this.placeholder[row][col]; // = undefined;
                    }
                    else {
                        delete this.placeholder[row][col][index]; // = undefined;
                    }
                }
                if (((obj.rotation) / 90) % 2) { 
                    ++row;
                }
                else {
                    ++col;
                }
            }
        }

        // Next
        utilMath = this.rotationMath(obj, this.NEXT, 0, 0);
        conRow = utilMath.conRow;
        conCol = utilMath.conCol;
        cnt = utilMath.cnt;
        index = utilMath.index;

        for (var j = 0; j < 4; ++j) {
            if (j != index && this.placeholder[conRow][conCol][j]) {
                noneFound = false;
            }
        }
        if (noneFound) {
            delete this.placeholder[conRow][conCol]; // = undefined;
        }
        else {
            delete this.placeholder[conRow][conCol][index];// = undefined;
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

    var prev_mode = this.mode;
    this.mode = this.DEFAULT_MODE;

    this.dragging = false;
    this.draggingComponent = {};
    this.clearCanvas(this.movingContext, this.gridWidth, this.gridHeight);

    // Reset all states and redraw canvas if application was in run mode
    if (id == "Run" || prev_mode === this.SIM_MODE) {
        console.log("done running");
        for (var i in this.components) {
                this.components[i].state = 0;
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

    // Don't do anything if the button is disabled
    if ($(this).hasClass('disabled')) {
        return;
    }

    // Activate butotn
    if (!$(this).hasClass('active')) {
        // Remove the active class from all buttons that have it
        digsim.deactivate($('ul:not(.num-inputs) .active').attr('id'));
        digsim.deactivate($('ul:not(.Auto-route) .active').attr('id'));
        $(this).addClass('active');

        if (id == "Wire") {
            $("canvas").css('cursor','crosshair');
            digsim.mode = digsim.WIRE_MODE;
        }
        else if (id == "Run") {
            if (digsim.drivers.length === 0) {
                digsim.addMessage(digsim.ERROR, "[16]Error: No drivers in schematic!");
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
        else if(id == "Auto-route") {
            digsim.autoroute = !digsim.autoroute;
        }
        else {
            $("canvas").css('cursor','default');
            digsim.mode = digsim.PLACE_MODE;
            digsim.enableButton('Rotate_CW');
            digsim.enableButton('Rotate_CCW');

            // Use reflection to dynamically create gate based on id :)
            digsim.rotation = 0;
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
            digsim.draggingComponent = gate;
            digsim.draggingComponent.draw(digsim.movingContext);
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
    // Not sure why this is here... but this was a while ago....
    /*
    if (digsim.selectedComponent) {
        console.log("RETARD HERE");
        digsim.selectedComponent.draw(digsim.staticContext);
    } */

    var mouseX = event.offsetX || event.layerX || event.clientX - $(".canvases").position().left;
    var mouseY = event.offsetY || event.layerY || event.clientY - $(".canvases").position().top;
    var row = Math.floor(mouseY / digsim.GRID_SIZE);
    var col = Math.floor(mouseX / digsim.GRID_SIZE);

    if (digsim.mode === digsim.WIRE_MODE) {
        event.preventDefault();

        var x, y, dx = 0, dy = 0;
        
        if (!digsim.dragging) {
            // Prevent wires from starting ontop of placeholders
            if (!(typeof digsim.placeholder[row][col] === 'undefined' || (digsim.placeholder[row][col] instanceof Array))) { 
                return; 
            }    
            if (digsim.placeholder[row][col] instanceof Array) {
                var full = true;
                for (var i = 0; i < 4; ++i) {
                    if (typeof digsim.placeholder[row][col][i] === 'undefined') {
                        full = false;
                        break;
                    }
                }
                if (full) {
                    return;
                }
            }
            digsim.dragging = true;
            digsim.wirePos.startX = col + 0.5;
            digsim.wirePos.startY = row + 0.5;
            digsim.lockH = digsim.lockV = 0;
            animateWire();
        }
        else {
            if (digsim.autoroute) {
                var start = {'r': Math.floor(digsim.wirePos.startY), 'c': Math.floor(digsim.wirePos.startX)};
                var target = {'r': row, 'c': col};

                digsim.route(start, target);
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
                    
                    var validPlacement = digsim.setWirePlaceholders(wire, dx, dy);
                    
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
        }
    }
};                     

/*****************************************************************************
 * ROUTE
 *  Route a path from start to target and adds placeholders too.
 *  Dijkstra pathfinding algorithm - www.zsheffield.net/dijkstra-pathfinding
 ****************************************************************************/
Digsim.prototype.route = function(start, target, returnPath) {
    // If click is in the same spot, we're done placing the wire.
    if (start.r === target.r && start.c === target.c) {
        digsim.dragging = false;
        return;
    }
    if (typeof digsim.placeholder[target.r][target.c] !== 'undefined') {
        digsim.endRoute = true;
    }
    else {
        digsim.endRoute = false;
    }
    // console.log("START: r:" + start.r + " c:" + start.c);
    // console.log("TARGET: r:" + target.r + " c:" + target.c);

    var neighbors = [];
    var BIGNUM = ~(1 << 31) - 10;
    var u;
    var pathfound = false;
    var alt;
    var index = 0;
    function node(r, c, p) {
        this.r = r || 0; 
        this.c = c || 0; 
        this.p = p || undefined;
    };
    var dist = [];
    var Q = [];
    var prev = [];
    prev.push(new node(start.r, start.c));

    // Initialize all arrays
    for (var r = 0; r < digsim.NUM_ROWS; ++r) {
        dist[r] = [];
        Q[r] = [];
        for (var c = 0; c < digsim.NUM_COLS; ++c) {
            dist[r][c] = BIGNUM;
            Q[r][c] = digsim.placeholder[r][c]; // placeholders go here
        }
    }
    
    dist[start.r][start.c] = 0;
    while (!pathfound)
    {
        if (index === prev.length) {
            break;
        }
        u = prev[index];
        // u now contains the coordinate in Q with the
        // smallest distance in dist[]
        
        // If we've reached our target, then we're done
        Q[u.r][u.c] = undefined;
        if (u.r === target.r && u.c === target.c) {
            pathfound = true;
            break;
        }

        if (dist[u.r][u.c] === BIGNUM) { // Nowhere to go
            digsim.addMessage(digsim.WARNING, "[17]Unable to find valid path for autoroute");
            pathfound = false;
            break;
        }
        
        // FIND NEIGHBORS
        // Neighbor above
        if ((u.r - 1) >= 0) {
            if (typeof Q[u.r - 1][u.c] === 'undefined' &&
                !(digsim.placeholder[u.r - 1][u.c] instanceof Array) &&
                typeof digsim.placeholder[u.r - 1][u.c] === 'undefined') {
                neighbors.push( {'r': u.r - 1, 'c': u.c} );
            }
            else if (digsim.placeholder[u.r - 1][u.c] instanceof Array) {
                if (digsim.checkAdj(u, 0, target)) {
                    neighbors.push( {'r': u.r - 1, 'c': u.c} );
                }
            }
        }
        // Neighbor right
        if ((u.c + 1) < (digsim.NUM_COLS - 1)) {
            if (typeof Q[u.r][u.c + 1] === 'undefined' &&
                !(digsim.placeholder[u.r][u.c + 1] instanceof Array) && 
                 typeof digsim.placeholder[u.r][u.c + 1] === 'undefined') {
                neighbors.push( {'r': u.r, 'c': u.c + 1} );
            }
            else if (digsim.placeholder[u.r][u.c + 1] instanceof Array) {
                if (digsim.checkAdj(u, 1, target)) {
                    neighbors.push( {'r': u.r, 'c': u.c + 1} );
                }
            }
        }
        // Neighbor below
        if ((u.r + 1) <= (digsim.NUM_ROWS - 1)) {
            if ((typeof Q[u.r + 1][u.c] === 'undefined') &&
                !(digsim.placeholder[u.r + 1][u.c] instanceof Array) && 
                (typeof digsim.placeholder[u.r + 1][u.c] === 'undefined')) {
                    neighbors.push( {'r': u.r + 1, 'c': u.c} );
            }
            else if (digsim.placeholder[u.r + 1][u.c] instanceof Array) {
                if (digsim.checkAdj(u, 2, target)) {
                    neighbors.push( {'r': u.r + 1, 'c': u.c} );
                }
            }
        }
        // Neighbor left
        if ((u.c - 1) >= 0) {
            if (typeof Q[u.r][u.c - 1] === 'undefined' &&
                !(digsim.placeholder[u.r][u.c - 1] instanceof Array) && 
                typeof digsim.placeholder[u.r][u.c - 1] === 'undefined') {
                    neighbors.push( {'r': u.r, 'c': u.c - 1} );
            }
            else if (digsim.placeholder[u.r][u.c - 1] instanceof Array) {
                if (digsim.checkAdj(u, 3, target)) {
                    neighbors.push( {'r': u.r, 'c': u.c - 1} );
                }
            }
        }
        
        // Add the right neighbor to the path
        for (var i = 0; i < neighbors.length; ++i) {
            alt = dist[u.r][u.c] + 1;
            if (alt < dist[ neighbors[i].r ][ neighbors[i].c ]) {
                dist[ neighbors[i].r ][ neighbors[i].c ] = alt;
                prev.push(new node(neighbors[i].r, neighbors[i].c, u));
                if (target.r === neighbors[i].r && target.c === neighbors[i].c) {
                    pathfound = true;
                    break;
                }
            }
        }
        neighbors = [];
        ++index;
    }
    u = prev[prev.length - 1]; // This is the target
    if (u.r === start.r && u.c === start.c) { // no path
        digsim.addMessage(digsim.WARNING, "[18]Unable to find valid path for autoroute");
        return;
    }
    var S = [];
    while (u != undefined) {
        S.unshift( {'r': u.r, 'c': u.c} );
        u = u.p;
    }

    // Now to actually make the wires
    // First, create the separate paths 
    // console.log("Starting wire placement for autoroute");
    var path = [];
    var currBranch = {'r':0,'c':0};
    var currStart = start;
    var validPlacement;
    prevDy = S[1].r - S[0].r;
    prevDx = S[1].c - S[0].c;
    currBranch.r += prevDy;
    currBranch.c += prevDx;
    for (var i = 1, len = S.length - 1; i < len; ++i) {
        dx = S[i + 1].c - S[i].c;
        dy = S[i + 1].r - S[i].r;
        if (dx !== prevDx && dy !== prevDy) {
            if (returnPath) {
                path.push( {'x':(currBranch.c + currStart.c),'y':(currBranch.r + currStart.r)} );
            }
            else {
                var wire = new Wire();
                wire.init(currStart.c + 0.5, currStart.r + 0.5, 0, digsim.iComp);
                wire.dx = prevDx;
                wire.dy = prevDy;
                wire.path.push( {'x':(currBranch.c ),'y':(currBranch.r )} );

                var validPlacement = digsim.setWirePlaceholders(wire, prevDx, prevDy, true);
                if (validPlacement) {
                    digsim.components[digsim.iComp++] = wire;

                    // Draws the wire on static context.
                    wire.checkConnect();
                    wire.draw(digsim.staticContext);
                }
                else {
                    // DO NOT PLACE WIRE, there's something in the way.
                    wire.path.pop();
                    digsim.dragging = true;
                }
            }
            currStart.r += currBranch.r;
            currStart.c += currBranch.c;
            currBranch = {'r':0,'c':0};
            prevDx = dx;
            prevDy = dy;
            --i;
        }
        else {
            currBranch.r += prevDy;
            currBranch.c += prevDx;
            prevDx = dx;
            prevDy = dy;
        }
    }
    if (returnPath) {
        path.push( {'x':(currBranch.c ),'y':(currBranch.r )} );
        return path;
    }
    else {
        var wire = new Wire();
        wire.init(currStart.c + 0.5, currStart.r + 0.5, 0, digsim.iComp);
        wire.dx = prevDx;
        wire.dy = prevDy;
        wire.path.push( {'x':(currBranch.c ),'y':(currBranch.r )} );
        var validPlacement = digsim.setWirePlaceholders(wire, prevDx, prevDy, true);
        if (validPlacement) {
            digsim.components[digsim.iComp++] = wire;
            // Draws the wire on static context.
            wire.checkConnect();
            wire.draw(digsim.staticContext);
        }
        else {
            // DO NOT PLACE WIRE, there's something in the way.
            wire.path.pop();
            digsim.dragging = true;
        }
        if (digsim.endRoute) {
            // If we attach to something at the end, don't start another wire
            digsim.dragging = false;
        }
        else { 
            // If we cannot attach to something at the end point, 
            // We will start a new wire where we ended the last one
            digsim.wirePos.startX = target.c + 0.5;
            digsim.wirePos.startY = target.r + 0.5;
            digsim.dragging = true;
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
        
        // If the onMouseUp event didn't get triggered, trigger it here
        if (digsim.dragging) {
            $("canvas").mouseup();
            return;
        }
        digsim.dragging = false;
        
        // Here's where the magic happens
        console.log("ROW: " + row + ", COL: " + col);
        if (digsim.placeholder[row][col] instanceof Array) { // wire 
            
            digsim.dragging = true;
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
                var ref = digsim.placeholder[row][col][index].ref;                
                digsim.selectedComponent = digsim.components[ref];
                digsim.draggingComponent = digsim.components[ref];
                digsim.draggingComponent.drawStatic = false;
                digsim.deletePlaceholder(digsim.selectedComponent);
                for (con in digsim.selectedComponent.connections) {
                    if (digsim.selectedComponent.connections[con].type === digsim.WIRE) {
                        digsim.deletePlaceholder(digsim.selectedComponent.connections[con]);
                    }
                }
                animateWire();
            }
        }
        else if (digsim.placeholder[row][col]) {
            
            digsim.dragging = true;
            
            console.log("digsim.placeholder[row][col]: ");
            console.log(digsim.placeholder[row][col]);
            console.log("");
            var ref = digsim.placeholder[row][col].ref;
            console.log("REF: " + ref + "\n");
            digsim.draggingComponent = digsim.components[ref];
            digsim.draggingComponent.drawStatic = false;
            digsim.offsetRow = digsim.placeholder[row][col].posY;
            digsim.offsetCol = digsim.placeholder[row][col].posX;
            digsim.deleteConnections(digsim.draggingComponent);
            digsim.deletePlaceholder(digsim.draggingComponent);
            
            digsim.draggingComponent.draw(digsim.movingContext);
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

            var obj;
            if (digsim.placeholder[row][col] instanceof Array) {
                // Wire selected

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
                    obj = digsim.components[ digsim.placeholder[row][col][index].ref ];
                }
            }
            else {
                obj = digsim.components[ digsim.placeholder[row][col].ref ];
            }

            // Set rise time propogation delay - give the program some time to propogate the 
            // state through the circuit, and the flip flops will be affected only by rising clock 
            // edges
            console.log("digsim.RISING_EDGE set to true");
            digsim.RISING_EDGE = true;
            setTimeout("digsim.stopRisingEdge()", 20);

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

Digsim.prototype.stopRisingEdge = function() {
    console.log("digsim.RISING_EDGE set to false")
    digsim.RISING_EDGE = false;
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
            if (digsim.draggingComponent.type === digsim.WIRE) {
                var validPlacement = digsim.setWirePlaceholders(digsim.draggingComponent, digsim.draggingComponent.dx, digsim.draggingComponent.dy);
                if (validPlacement) {
                    console.log("valid placement");
                    digsim.components[digsim.draggingComponent.id] = digsim.draggingComponent;
                    digsim.draggingComponent.drawStatic = true;
                    digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
                    digsim.draggingComponent.checkConnect();
                    digsim.draggingComponent.draw(digsim.staticContext);

                    digsim.dragging = false;
                }
                else {
                    digsim.dragging = true;
                    console.log("object in the way!");
                    // DO NOT PLACE COMPONENT, there's something in the way. 
                }
            }
            else {
                var validPlacement = digsim.setPlaceholders(digsim.draggingComponent);
                if (validPlacement) {
                    console.log("valid placement");
                    digsim.components[digsim.draggingComponent.id] = digsim.draggingComponent;
                    digsim.draggingComponent.drawStatic = true;
                    digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
                    digsim.draggingComponent.checkConnect();
                    digsim.draggingComponent.draw(digsim.staticContext);

                    digsim.dragging = false;
                }
                else {
                    digsim.dragging = true;
                    // DO NOT PLACE COMPONENT, there's something in the way. 
                }
            }
        }
        
    }
    else if (digsim.mode === digsim.PLACE_MODE) {
        var validPlacement = digsim.setPlaceholders(digsim.draggingComponent);
        if (validPlacement) {

             // Create new gate for next place
            if($('.gates a').hasClass('active') || $('.io a').hasClass('active')) {
                var id = digsim.prevGate;
                if (id === "Switch" || id === "Clock") {
                    digsim.drivers.push(digsim.iComp);
                }

                digsim.components[digsim.draggingComponent.id] = digsim.draggingComponent;
                digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
                digsim.draggingComponent.checkConnect();
                digsim.draggingComponent.draw(digsim.staticContext);   
           
                var Class = window[id];
                var gate = new Class(digsim.numGateInputs); 
                var row = Math.floor(digsim.mousePos.y / digsim.GRID_SIZE) || 2;
                var col = Math.floor(digsim.mousePos.x / digsim.GRID_SIZE) || 2;
                console.log("ROTATION: " + digsim.rotation);
                gate.init(col, row, digsim.rotation, ++digsim.iComp);
                digsim.draggingComponent = gate;
                digsim.draggingComponent.draw(digsim.movingContext);
                digsim.dragging = true;
            }
            // A pasted gate
            else {
                var id = digsim.draggingComponent.name;
                if (id === "Switch" || id === "Clock") {
                    digsim.drivers.push(digsim.iComp);
                }

                digsim.components[digsim.iComp++] = digsim.draggingComponent;
                digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
                digsim.draggingComponent.checkConnect();
                digsim.draggingComponent.draw(digsim.staticContext);

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

            var relX = mouseX % digsim.GRID_SIZE;
            var relY = mouseY % digsim.GRID_SIZE;
            var leftVert = topHor = Math.ceil(digsim.GRID_SIZE * (1 - digsim.HIT_RADIUS) / 2);
            var rightVert = bottomHor = digsim.GRID_SIZE - topHor;
            var diagSep = digsim.GRID_SIZE - relX;
            var vert = (relX >= topHor) && (relX <= bottomHor);
            var hor = (relY >= leftVert) && (relY <= rightVert);
            var index = -1;
            var array = digsim.placeholder[row][col];

            if (vert && hor && (array[0] || array[2]) && (array[1] || array[3])) {
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
                if (relX <= digsim.GRID_SIZE / 2) {
                    index = 3;
                }
                else {
                    index = 1;
                }
            }
            else if (vert && relX >= leftVert && relX <= rightVert) {
                if (relY <= digsim.GRID_SIZE / 2) {
                    index = 0;
                }
                else {
                    index = 2;
                }
            }

            if (index != -1 && digsim.placeholder[row][col][index]) {
                if (digsim.components[ digsim.placeholder[row][col][index].ref ].dx !== 0) {
                    $("canvas").css('cursor','row-resize');
                }
                else {
                    $("canvas").css('cursor','col-resize');
                }
            }
            else {
                $("canvas").css('cursor','default');
            }
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
        var store = digsim.numGateInputs;
        digsim.numGateInputs = $(this).data('inputs');
        if (digsim.draggingComponent) {
            var type = digsim.draggingComponent.type;
            if (type !== digsim.NOT && (type < 0 || digsim.draggingComponent.name == "MUX") && !digsim.selectedComponent) {
                digsim.draggingComponent.numInputs = digsim.numGateInputs;
                if (digsim.draggingComponent.name == "MUX" && digsim.numGateInputs == 3) {
                    digsim.draggingComponent.numInputs = digsim.numGateInputs = store;
                }
                digsim.draggingComponent.changeSize();
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
        digsim.draggingComponent = gate;
        digsim.draggingComponent.draw(digsim.movingContext);
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
        var obj = digsim.selectedComponent || digsim.draggingComponent;
        
        if (!digsim.dragging) {
            digsim.deletePlaceholder(obj);
            console.log("THIS SHOULD DELETE");
        }
        
        obj.rotation = digsim.rotation = (obj.rotation + event.data.dir) % 360;
        
        // Swap row/col
        obj.dimension.row = obj.dimension.row ^ obj.dimension.col;
        obj.dimension.col = obj.dimension.row ^ obj.dimension.col;
        obj.dimension.row = obj.dimension.row ^ obj.dimension.col;
        
        digsim.drawComponents();
        
        if (digsim.dragging) {
            obj.draw(digsim.movingContext, 'red');
        }
        else {

                console.log("SETTING PLACEHOLDRS");
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
        // Resize placeholder array when changing the grid size
        if (digsim.placeholder.length < digsim.NUM_ROWS) {
            for (var i = digsim.placeholder.length - 1; i < digsim.NUM_ROWS; ++i) {
                digsim.placeholder[i] = [];
            }
        }
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
    's9': 'Rotate_CCW',
    70: 'DFF',
    's70': 'JKFF'
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
    'Rotate_CCW': 'shift+Tab',
    'DFF': 'F',
    'JKFF': 'shift+F'
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
        digsim.draggingComponent.col = col - digsim.offsetCol;
        digsim.draggingComponent.row = row - digsim.offsetRow;
        digsim.draggingComponent.draw(digsim.movingContext, 'red');
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

    var obj = digsim.selectedComponent;
    if (digsim.dragging) {
        requestAnimFrame(animateWire);
        if (obj) {
            //console.log("test");
            if (obj.dx) {
                obj.row = row + 0.5;
            }
            else {
                obj.col = col + 0.5;
            }
            // Draw wire
            context.beginPath();
            context.lineWidth = 2;
            context.strokeStyle = 'red';
            context.lineCap = 'round';
            context.moveTo(obj.col * digsim.GRID_SIZE, obj.row * digsim.GRID_SIZE);
            context.lineTo((obj.col + obj.path[0].x) * digsim.GRID_SIZE, (obj.row + obj.path[0].y) * digsim.GRID_SIZE);
            context.stroke();

            var start, target, path, wire;
            context.strokeStyle = '#3399FF';
            for (var i = 0, len = obj.startConnections.length; i < len; ++i) {
                wire = digsim.components[obj.startConnections[i]];
                // console.log(wire);
                start = { 'r': Math.floor(obj.row), 'c': Math.floor(obj.col) };
                if (($.inArray(obj.id, wire.startConnections) !== -1)) {
                    target = { 'r': Math.floor(wire.row+wire.path[0].y), 'c': Math.floor(wire.col + wire.path[0].x) };
                }
                else {
                    target = {'r': Math.floor(wire.row), 'c': Math.floor(wire.col) };
                }
                path = digsim.route(start, target, true);
                console.log(path);
                // Draw wire
                for (var j = 0, len2 = path.length; j < len2; ++j) {
                    context.beginPath();
                    context.moveTo((start.c + 0.5) * digsim.GRID_SIZE, (start.r + 0.5) * digsim.GRID_SIZE);
                    context.lineTo((start.c + path[j].x + 0.5) * digsim.GRID_SIZE, (start.r + path[j].y + 0.5) * digsim.GRID_SIZE);
                }
                context.stroke();

            }
            for (var i = 0, len = obj.endConnections.length; i < len; ++i) {
                wire = digsim.components[obj.endConnections[i]];
                start = { 'r': Math.floor(obj.row), 'c': Math.floor(obj.col) };
                if (($.inArray(obj.id, wire.startConnections) !== -1)) {
                    target = { 'r': Math.floor(wire.row+wire.path[0].y), 'c': Math.floor(wire.col + wire.path[0].x) };
                }
                else {
                    target = {'r': Math.floor(wire.row), 'c': Math.floor(wire.col) };
                }
                path = digsim.route(start, target, true);
                 // Draw wire
                context.beginPath();
                context.moveTo((start.c + 0.5) * digsim.GRID_SIZE, (start.r + 0.5) * digsim.GRID_SIZE);
                    
                for (var j = 0, len2 = path.length; j < len2; ++j) {
                    context.lineTo((path[j].c + 0.5) * digsim.GRID_SIZE, (path[j].r + 0.5) * digsim.GRID_SIZE);
                }

                context.stroke();
            }
            return;
        }
        else {
        // else if (digsim.dragging) {
            
            // requestAnimFrame(animateWire);
            
            // Draw wire
            context.beginPath();
            context.fillStyle = '#3399FF';
            context.lineWidth = 2;
            context.strokeStyle = '#3399FF';
            context.lineCap = 'round';
            context.arc(digsim.wirePos.startX * digsim.GRID_SIZE, digsim.wirePos.startY * digsim.GRID_SIZE, 2, 0, 2 * Math.PI);
            context.fill();
            context.moveTo(digsim.wirePos.startX * digsim.GRID_SIZE, digsim.wirePos.startY * digsim.GRID_SIZE);

            if (digsim.autoroute){
                x = (col + 0.5) * digsim.GRID_SIZE;
                y = (row + 0.5) * digsim.GRID_SIZE;
            }
            else {
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
            }
            context.lineTo(x, y); 
            context.stroke();
        }
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
        $("#messages").scrollTop($("#messages")[0].scrollHeight);
        digsim.deactivate();
    }
    else if (type === digsim.WARNING) {
        $('#messages').append("<span class='warning'>" + msg + "</span><br>");
        $("#messages").scrollTop($("#messages")[0].scrollHeight);
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




