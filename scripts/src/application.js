/*****************************************************************************
 * Program: 
 *  application.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  A (soon-to-be) fully functional circuit simulation program. 
 ****************************************************************************/

var file = $('.file').outerWidth();
var gates = $('.gates').outerWidth();
var io = $('.io').outerWidth();
var modes = $('.modes').outerWidth();
var controls = $('.controls').outerWidth();

$('.end').css('width', (window.innerWidth - file - gates - io - modes - controls) - 6);

/*****************************************************************************
 * DIGSIM
 *  Holds all the constants, animation, and data variables for the program
 ****************************************************************************/
function Digsim() {
	// Constants
	this.GRID_SIZE = 20;
    this.GRID_ZOOM = 5;
    this.MAX_GRID_SIZE = 100;
    this.MIN_GRID_SIZE = 5;
	this.NUM_COLS = Math.floor((window.innerWidth - $('.canvases').position().left) / this.GRID_SIZE);
	this.NUM_ROWS = Math.floor((window.innerHeight - $('.canvases').position().top) / this.GRID_SIZE);
    
    // Type identifiers
    this.AND = -1;  // Gates are negative because they have a special
    this.NAND = -2; // quality for simulation mode. Making them all
    this.OR = -3;   // negative will catch all gates
    this.NOR = -4;
    this.XOR = -5;
    this.NOT = -6;
    
    this.WIRE = 6;
    this.SWITCH = 7;
    this.LED = 8;
    this.DEFAULT_MODE = 0;
	this.WIRE_MODE = 1;
    this.SIM_MODE = 2;
    this.DELETE_MODE = 3;
    
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
    
	// Grid variables
	this.gridWidth = this.NUM_COLS * this.GRID_SIZE;
	this.gridHeight = this.NUM_ROWS * this.GRID_SIZE;
    this.mousePos = { x: -1, y: -1 };
    this.offsetCol = 0;
    this.offsetRow = 0;
    this.toggleGrid = 1;
    
    // Gate identifier
    this.iComp = 0;
    this.mode = 0;
    
    // Data arrays
    this.components = [];   // Holds all of the objects by their unique ID 
    this.switches = [];     // Holds the place of the logic drivers in components[].
    this.placeholder = [];  // Holds component positions on grid
    for (var i = 0; i < this.NUM_COLS; ++i) {
        this.placeholder[i] = [];
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
	context.strokeRect(0, 0, this.gridWidth, this.gridHeight);
	
    if (this.toggleGrid) {
    	context.strokeStyle = '#8DCFF4';
        context.lineWidth = 1;
        context.save();
    	context.translate(0.5, 0.5);
    	context.beginPath();
    	
    	// Draw the columns
    	for (var col = 1; col < this.NUM_COLS; col++) {
    		context.moveTo(col * this.GRID_SIZE, 1);
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
};

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
 * SET PLACEHOLDERS
 *  Given a gate object, adds it to the placeholder data array with unique
 *  identifier. 
 ****************************************************************************/
Digsim.prototype.setPlaceholders = function(obj) {

    var row, col, cnt = 0, conCol, conRow;
    var factor = Math.floor(obj.numInputs / 2) || 1; 
    // Place wire placeholders
    if (obj.type < 0) { //gate
        conCol = obj.column - 1;
        // Previii
        for (var i = 0; i < obj.numInputs; ++i) {            
            if (obj.type === digsim.NOT) {
                conRow = obj.row + 1;
            }
            else {
                if (i % 2) { 
                    conRow = obj.row + (factor * 2) - cnt++;
                }
                else {
                    conRow = obj.row + cnt;
                }
            }
            if (!(this.placeholder[conRow][conCol] instanceof Array)) {
                this.placeholder[conRow][conCol] = [];
            }
            var placeholder = new Placeholder(obj.id, obj.column + 1, obj.row + 1, obj.dimension.col, obj.dimension.row);
            this.placeholder[conRow][conCol][1] = placeholder;
        }
        // Nexts
        conCol = obj.column + factor * 2 + obj.outPt;
        conRow = obj.row + factor;
        if (!(this.placeholder[conRow][conCol] instanceof Array)) {
            this.placeholder[conRow][conCol] = [];
        }
        var placeholder = new Placeholder(obj.id, obj.column + 1, obj.row + 1, obj.dimension.col, obj.dimension.row);
        this.placeholder[conRow][conCol][3] = placeholder;
    }
    if (obj.type === digsim.SWITCH) {
        if (!(this.placeholder[obj.row + 1][obj.column + 1] instanceof Array)) {
            console.log(obj);
            this.placeholder[obj.row + 1][obj.column + 1] = [];
        }
        var placeholder = new Placeholder(obj.id, obj.column + 1, obj.row + 1, obj.dimension.col, obj.dimension.row);
        this.placeholder[obj.row + 1][obj.column + 1][3] = placeholder;
    }
    else if (obj.type === digsim.LED) {
        if (!(this.placeholder[obj.row + 2][obj.column] instanceof Array)) {   
            console.log(obj);
            this.placeholder[obj.row + 2][obj.column] = [];
        }
        var placeholder = new Placeholder(obj.id, obj.column, obj.row + 2, obj.dimension.col, obj.dimension.row);
        this.placeholder[obj.row + 2][obj.column][0] = placeholder;
    }
    // Places the placeholder for the object
    for (row = 0; row < obj.dimension.row; ++row) {
        for (col = 0; col < obj.dimension.col; ++col) {
            var placeholder = new Placeholder(obj.id, col, row, obj.dimension.col, obj.dimension.row);
            this.placeholder[obj.row + row][obj.column + col] = placeholder;
        }
    }

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
                            console.log("wire collision error!");
                            return false;
                        }
                    }
                    else if (thisPH[3]) {
                        console.log("wire collision error!");
                        return false;
                    }
                }
                j += 0.5;
            }
            else if (thisPH) {
                console.log("COLLISION! ERROR!");
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
                            console.log("wire collision error!");
                            return false;
                        }
                    }
                    else if (thisPH[0]) {
                        console.log("wire collision error!");
                        return false;
                    }
                }
                j += 0.5;
            }
            else if (thisPH) {
                console.log("COLLISION! ERROR!");
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
            this.placeholder[row][floorEndCol];
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
 * RUN
 *  Starts doing stuff (window.onload)
 ****************************************************************************/
Digsim.prototype.run = function() {
    if(this.init()) {
        // onClick events
        $("canvas").mousedown(digsim.onGridMouseDown);
        $("canvas").mouseup(digsim.onGridMouseUp);
        $("li a").click(digsim.onButtonClicked);
        $("canvas").click(digsim.onGridClicked);

        this.drawGrid(this.gridContext);
    }
};

/*****************************************************************************
 * ON BUTTON CLICKED
 *  When a button is clicked, do this. Creates a gate when button is clicked. 
 *  This only works because of id on the html matches the name of the gate. 
 *  "AND", "OR", etc...
 ****************************************************************************/
Digsim.prototype.onButtonClicked = function (event) {
    var id = $(this).attr("id");
    console.log("CLICKED");
    // Use reflection to dynamically create gate based on id :) 
    var MyClass = window;
    MyClass = MyClass[id];

    // Activate butotn
    if (!$(this).hasClass('active')) {
        // Remove the active class from all buttons that have it
        digsim.deactivate($('.active').attr('id'));
        $(this).addClass('active');

        if (id == "Wire") {
            $("canvas").css('cursor','crosshair');
            digsim.mode = digsim.WIRE_MODE;
        }
        else if (id == "Run") {
            $("canvas").css('cursor','pointer');
            for (var i = 0; i < digsim.switches.length; ++i) {
                var obj = digsim.components[ digsim.switches[i] ];
                for (var j = 0; j < digsim.components.length; ++j) {
                    digsim.components[j].visited = 0;
                }
                if (obj.traverse()) {
                    obj.state = 0;
                    console.log("********************BEGIN PASS STATE!********************");
                    obj.passState(obj.state);
                }
            }
            digsim.mode = digsim.SIM_MODE;
            digsim.drawComponents();
        }
        else if (id == "D_Mode") {
            $("canvas").css('cursor','no-drop');
            digsim.mode = digsim.DELETE_MODE;
        }
        else if (id === "Zoom_In") {
            digsim.zoomIn();
            $('.active').removeClass('active');
        }
        else if (id === "Zoom_Out") {
            digsim.zoomOut();
            $('.active').removeClass('active');
        }
        else {
            $("canvas").css('cursor','default');
            if (id == "Switch") {
                digsim.switches.push(digsim.iComp);
            }
            digsim.mode = digsim.DEFAULT_MODE;
            
            
            if (id === "AND" || id === "NAND" || id === "OR" || id === "NOR" || id === "XOR")
                var numInputs = prompt("Enter numInputs", "");
            else
                numInputs = 0;
            
            var gate = new MyClass(numInputs); 
            gate.init(2, 2, 0, digsim.iComp);
            digsim.components[digsim.iComp++] = gate;
            digsim.setPlaceholders(gate);
            gate.checkConnect();
            gate.draw(digsim.staticContext);
        }
    }
    // Deactivate button
    else {
        digsim.deactivate(id);
    }
};

/*****************************************************************************
 * DEACTIVATE
 *  Removes the active class from any button, and redraws the components if
 *  the active button was Run.
 ****************************************************************************/
 Digsim.prototype.deactivate = function(id) {
    $("canvas").css('cursor','default');
    $('.active').removeClass('active');
    digsim.mode = digsim.DEFAULT_MODE;

    if (id == "Run") {
        console.log("done running");
        digsim.drawComponents();
    }
};

/*****************************************************************************
 * ON GRID CLICKED
 *  Called when wire mode is on - for dragging wires. 
 ****************************************************************************/
Digsim.prototype.onGridClicked = function(event) {

    if (digsim.mode === digsim.WIRE_MODE) {
        event.preventDefault();
        
        var mouseX = event.offsetX || event.layerX || event.clientX - $(".canvases").position().left;
        var mouseY = event.offsetY || event.layerY || event.clientY - $(".canvases").position().top;;
        var row = Math.floor(mouseY / digsim.GRID_SIZE);
        var col = Math.floor(mouseX / digsim.GRID_SIZE);
        var x, y, dx = 0, dy = 0;
                
        // Tells us where on the grid the click is
        var relX = mouseX % digsim.GRID_SIZE;
        var relY = mouseY % digsim.GRID_SIZE;
        var diagSep = digsim.GRID_SIZE - relX;
        var wirePos = 0;
        
        if (!digsim.dragging) {
            digsim.dragging = true;
            digsim.wirePos.startX = col + 0.5;
            digsim.wirePos.startY = row + 0.5;
            digsim.lockH = digsim.lockV = 0;
            animateWire();
        }
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
                    wire.updatePos();
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
};                     

/*****************************************************************************
 * ON GRID MOUSE DOWN
 *  Click and drag gates. Only called in default mode. 
 ****************************************************************************/
Digsim.prototype.onGridMouseDown = function(event) {
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
        }
        digsim.dragging = false;
        
        // Here's where the magic happens
        console.log("ROW: " + row + ", COL: " + col);
        if (digsim.placeholder[row][col] instanceof Array) {
            // Deal with this later. 
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
            
            digsim.deletePlaceholder(row, col);
            /*
            // Remove the component from the array
            var placeholder = digsim.placeholder[row][col];
            var posX = placeholder.posX;
            var posY = placeholder.posY;
            var height = placeholder.height;
            var width = placeholder.width;
            digsim.offsetRow = posY;
            digsim.offsetCol = posX;
            for (var y = 0, iRow = row - posY; y < height; ++y) {
                for (var x = 0, iCol = col - posX; x < width; ++x) {
                    digsim.placeholder[iRow + y][iCol + x] = undefined;
                }
            }
            
            // Clean up wire placehoders on gates
            if (digsim.draggingGate.type < 0) { 
                if (digsim.draggingGate.type === digsim.NOT) {
                    digsim.placeholder[digsim.draggingGate.row + 1][digsim.draggingGate.column - 1] = undefined;
                    digsim.placeholder[digsim.draggingGate.row + 1][digsim.draggingGate.column + 2] = undefined;
                }
                else {
                    var factor = Math.floor(digsim.draggingGate.numInputs / 2); 
                    var cnt = 0;
                    for (var i = 0; i < digsim.draggingGate.numInputs; ++i) {
                        if (i % 2) {
                            digsim.placeholder[digsim.draggingGate.row + (factor * 2) - cnt++][digsim.draggingGate.column - 1] = undefined;
                        }
                        else {
                            //console.log("(" + digsim.draggingGate.row + ", " + (digsim.draggingGate.column - 1) + ")");
                            digsim.placeholder[digsim.draggingGate.row + cnt][digsim.draggingGate.column - 1] = undefined;
                        }
                    }
                    digsim.placeholder[digsim.draggingGate.row + factor][digsim.draggingGate.column + digsim.draggingGate.dimension.col] = undefined;
                }
            }
            else if (digsim.draggingGate.type == digsim.SWITCH) {
                digsim.placeholder[digsim.draggingGate.row + 1][digsim.draggingGate.column + 1] = undefined;
            }
            else if (digsim.draggingGate.type == digsim.LED) {
                digsim.placeholder[digsim.draggingGate.row + 2][digsim.draggingGate.column ] = undefined;
            }
            */

            // Visually remove component from static canvas. 
            digsim.drawComponents();
            
            digsim.draggingGate.draw(digsim.movingContext);
            animate();
            
        }
        else {
            // There's nothing where you clicked, dude. 
            console.log("empty");
        }
    }
    else if (digsim.mode === digsim.SIM_MODE) {        
        if (digsim.placeholder[row][col]) {
            var obj = digsim.components[ digsim.placeholder[row][col].ref ];
            if (obj.type === digsim.SWITCH) {
                for (var j = 0; j < digsim.components.length; ++j) {
                    digsim.components[j].visited = 0;
                }
                console.log("********************BEGIN PASS STATE!********************");
                obj.passState(!obj.state);
                digsim.drawComponents();
            }
        }
    }
    else if (digsim.mode === digsim.DELETE_MODE) {
        digsim.deleteComponent(row, col);
    }
};

/*****************************************************************************
 * DELETE PLACEHOLDER
 *  duh.
 ****************************************************************************/
Digsim.prototype.deletePlaceholder = function(row, col) {
    // Remove the component from the array
    var placeholder = digsim.placeholder[row][col];
    var posX = placeholder.posX;
    var posY = placeholder.posY;
    var height = placeholder.height;
    var width = placeholder.width;
    digsim.offsetRow = posY;
    digsim.offsetCol = posX;
    for (var y = 0, iRow = row - posY; y < height; ++y) {
        for (var x = 0, iCol = col - posX; x < width; ++x) {
            digsim.placeholder[iRow + y][iCol + x] = undefined;
        }
    }
    
    // Clean up wire placehoders on gates
    if (digsim.draggingGate.type < 0) { 
        if (digsim.draggingGate.type === digsim.NOT) {
            digsim.placeholder[digsim.draggingGate.row + 1][digsim.draggingGate.column - 1] = undefined;
            digsim.placeholder[digsim.draggingGate.row + 1][digsim.draggingGate.column + 2] = undefined;
        }
        else {
            var factor = Math.floor(digsim.draggingGate.numInputs / 2); 
            var cnt = 0;
            for (var i = 0; i < digsim.draggingGate.numInputs; ++i) {
                if (i % 2) {
                    digsim.placeholder[digsim.draggingGate.row + (factor * 2) - cnt++][digsim.draggingGate.column - 1] = undefined;
                }
                else {
                    //console.log("(" + digsim.draggingGate.row + ", " + (digsim.draggingGate.column - 1) + ")");
                    digsim.placeholder[digsim.draggingGate.row + cnt][digsim.draggingGate.column - 1] = undefined;
                }
            }
            digsim.placeholder[digsim.draggingGate.row + factor][digsim.draggingGate.column + digsim.draggingGate.dimension.col] = undefined;
        }
    }
    else if (digsim.draggingGate.type == digsim.SWITCH) {
        digsim.placeholder[digsim.draggingGate.row + 1][digsim.draggingGate.column + 1] = undefined;
    }
    else if (digsim.draggingGate.type == digsim.LED) {
        digsim.placeholder[digsim.draggingGate.row + 2][digsim.draggingGate.column ] = undefined;
    }

    // Visually remove component from static canvas. 
    digsim.drawComponents();
}

/*****************************************************************************
 * DELETE COMPONENT
 *  duh.
 ****************************************************************************/
Digsim.prototype.deleteComponent = function(row, col) {
    // Remove the component from the array
    var placeholder = digsim.placeholder[row][col];
    var comp = digsim.components[placeholder.ref];

    if (comp.type < 0) {
        for (var i = 1; i <= comp.numInputs; ++i) {
            digsim.components[placeholder.ref - i - 1] = undefined;
        }
        digsim.components[placeholder.ref - 1] = undefined;
        digsim.components[placeholder.ref] = undefined;
    }
    digsim.deletePlaceholder(row, col);

}

/*****************************************************************************
 * ON GRID MOUSE UP
 *  When the mouse is realeased while on the canvas, this will take care of all
 *  the things that change after stuff being dragged around. 
 ****************************************************************************/
Digsim.prototype.onGridMouseUp = function(event) {
    if (digsim.mode !== digsim.WIRE_MODE) {
        if (digsim.dragging) {
            digsim.components[digsim.draggingGate.id] = digsim.draggingGate;
            digsim.draggingGate.drawStatic = true;
            digsim.setPlaceholders(digsim.draggingGate);
            digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
            digsim.draggingGate.updatePos();
            digsim.draggingGate.checkConnect();
            digsim.draggingGate.draw(digsim.staticContext);
        }
        digsim.dragging = false;
    }
};

/*****************************************************************************
 * MOUSE MOVE
 *  Gets the position of the mouse on the canvas. 
 ****************************************************************************/
$("canvas").mousemove(function(event) {
    var mouseX = event.offsetX || event.layerX || event.clientX - $(".canvases").position().left;
    var mouseY = event.offsetY || event.layerY || event.clientY - $(".canvases").position().top;;
    digsim.mousePos = { x: mouseX, y: mouseY };
});

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
        
        // This will lock either horizontal or vertical wire placement
        if (!digsim.lockH && !digsim.lockV) {
            if (Math.abs(digsim.wirePos.startX * digsim.GRID_SIZE - digsim.mousePos.x) > digsim.GRID_SIZE / 2) {
                digsim.lockH = 1;
            }
            else if (Math.abs(digsim.wirePos.startY * digsim.GRID_SIZE - digsim.mousePos.y) > digsim.GRID_SIZE / 2) {
                digsim.lockV = 1;
            }
        }   
        
        // Draw wire
        context.beginPath();
        context.fillStyle = '#000000';
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.arc(digsim.wirePos.startX * digsim.GRID_SIZE, digsim.wirePos.startY * digsim.GRID_SIZE, 2, 0, 2 * Math.PI);
        context.moveTo(digsim.wirePos.startX * digsim.GRID_SIZE, digsim.wirePos.startY * digsim.GRID_SIZE);
        var x, y;
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
        digsim.draggingGate.draw(digsim.movingContext);
    }
};

/*****************************************************************************
 * SHOW PLACEHOLDERS
 *  Debug method used to see placeholder objects visually on the grid.
 ****************************************************************************/
Digsim.prototype.showPlaceholders = function() {
    this.clearCanvas(this.gridContext, this.gridWidth, this.gridHeight);
    this.drawGrid(this.gridContext);

    var row = 0; col = 0;
    for (row = 0; row < this.gridWidth; row++) {
        for (col = 0; col < this.gridHeight; col++) {
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

                        //this.gridContext.fillStyle = 'white';
                        //this.gridContext.font = "10pt Calibri";
                        //this.gridContext.fillText(this.placeholder[row][col][z].ref, 0 + this.GRID_SIZE / 2 - 10, 0 + this.GRID_SIZE / 2 - 10);
                        
                        this.gridContext.restore();
                        //break;
                    }
                }
            }
            else if (this.placeholder[row][col]) {
                this.gridContext.fillStyle = 'orange';
                this.gridContext.fillRect(col * this.GRID_SIZE + 1, row * this.GRID_SIZE + 1, this.GRID_SIZE -2, this.GRID_SIZE - 2);
                this.gridContext.fillStyle = 'white';
                this.gridContext.font = "20pt Calibri";
                this.gridContext.fillText(this.placeholder[row][col].ref, col * this.GRID_SIZE + this.GRID_SIZE / 2 - 10, row * this.GRID_SIZE + this.GRID_SIZE / 2 + 10);
            }
        }
    }
};

/*****************************************************************************
 * WINDOW RESIZE
 *  Handles resizing of the browser window and sets all needed variables to 
 *  set canvas size
 ****************************************************************************/
$(window).resize(function() {
    digsim.NUM_COLS = Math.floor((window.innerWidth - $('.canvases').position().left) / digsim.GRID_SIZE);
    digsim.NUM_ROWS = Math.floor((window.innerHeight - $('.canvases').position().top) / digsim.GRID_SIZE);
    $('.end').css('width', (window.innerWidth - file - gates - io - modes - controls) - 6);
    digsim.gridWidth = digsim.NUM_COLS * digsim.GRID_SIZE;
    digsim.gridHeight = digsim.NUM_ROWS * digsim.GRID_SIZE;
    $('canvas').width(digsim.gridWidth);
    $('canvas').height(digsim.gridHeight);
    digsim.init();
    digsim.drawGrid(digsim.gridContext);
    digsim.drawComponents();
});

/*****************************************************************************
 * ZOOM IN
 *  Zoom in on the canvas
 ****************************************************************************/
Digsim.prototype.zoomIn = function() {
    this.GRID_SIZE += this.GRID_ZOOM;
    if (this.GRID_SIZE > this.MAX_GRID_SIZE) {
        this.GRID_SIZE = this.MAX_GRID_SIZE;
        /*$('#Zoom_In').addClass('disabled');
        $('#Zoom_In').off('click');
        $('#Zoom_In').removeAttr('href');
        $('#Zoom_In').removeAttr('title');*/
    }
    else {
        this.NUM_COLS = (window.innerWidth - $('.canvases').position().left) / this.GRID_SIZE;
        this.NUM_ROWS = (window.innerHeight - $('.canvases').position().top) / this.GRID_SIZE;
        this.init();
        this.drawGrid(this.gridContext);
        this.drawComponents();
    }
};

/*****************************************************************************
 * ZOOM OUT
 *  Zoom out on the canvas
 ****************************************************************************/
Digsim.prototype.zoomOut = function() {
    this.GRID_SIZE -= this.GRID_ZOOM;
    if (this.GRID_SIZE < this.MIN_GRID_SIZE) {
        this.GRID_SIZE = this.MIN_GRID_SIZE;
    }
    else {
        this.NUM_COLS = (window.innerWidth - $('.canvases').position().left) / this.GRID_SIZE;
        this.NUM_ROWS = (window.innerHeight - $('.canvases').position().top) / this.GRID_SIZE;
        this.init();
        this.drawGrid(this.gridContext);
        this.drawComponents();
    }
};

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
  78: 'NOT',
  82: 'OR',
  83: 'Switch',
  85: 'Run',
  87: 'Wire',
  88: 'XOR'
}

document.onkeydown = function(e) {
    // Firefox and opera use charCode instead of keyCode to
    // return which key was pressed.
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;

    console.log('Pressed: ' + keyCode);
    console.log(e);

    if (KEY_CODES[keyCode]) {
        var id;
        if(e.shiftKey) {
            id = KEY_CODES['s'+keyCode];
        }
        else {
            id = KEY_CODES[keyCode];
        }
        console.log("ID: " + id);
        $("#" + id).click();
    }
}

/*****************************************************************************
 * NAMESPACE
 *  Create namespace for the application. If namespace already exisists, don't
 *  override it, otherwise create an empty object.
 ****************************************************************************/
var digsim = digsim || new Digsim();