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

/*****************************************************************************
 * DIGSIM
 *  Holds all the constants, animation, and data variables for the program
 ****************************************************************************/
function Digsim() {
	// Constants
	this.GRID_SIZE = 30;
	this.NUM_COLS = 100;
	this.NUM_ROWS = 100;
    
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
        // onClick events
        $("canvas").mousedown(digsim.onGridMouseDown);
        $("canvas").mouseup(digsim.onGridMouseUp);
        $("button").click(digsim.onButtonClicked);
        $("canvas").click(digsim.onGridClicked);

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
	context.strokeRect(0, 0, this.gridWidth, this.gridHeight);
	
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
};

/*****************************************************************************
 * DRAW COMPONENTS
 *  Redraws all the components on the static canvas, after everything has been
 *  dragged and dropped
 ****************************************************************************/
Digsim.prototype.drawComponents = function() {
    this.clearCanvas(this.staticContext, this.gridWidth, this.gridHeight);
    for (index in this.components) {
        if(this.components[index].drawStatic) {
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
    var row, col;
    
    // Place wire placehodlers
    if (obj.type < 0) { //gate
        for (var i = 0; i < obj.numInputs; ++i) {
            var wire = obj.prev[i];
            this.setWirePlaceholder(wire.id, Math.floor(wire.column) - 1, Math.floor(wire.row));
            //console.log(wire);
        }
        var wire = obj.next[0];
        this.setWirePlaceholder(wire.id, Math.floor(wire.column), Math.floor(wire.row));

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
    var col = Math.floor(wire.path[0].x + wire.column); // Current ending pos
    var row = Math.floor(wire.path[0].y + wire.row); 
    
    console.log("wire.column: " + wire.column + " wire.row: " + wire.row);
    
    var i = Math.floor(dx ? Math.floor(wire.column): (dy ? Math.floor(wire.row) : 0));
    var endBool = (dx ? col : (dy ? row : 0)) + (dx ? dx : (dy ? dy : 0));
    var inc = dx ? dx : (dy ? dy : 0);
    var x, y;
    console.log("DX: " + dx + "  DY: " + dy);
    console.log("I: " + i + "  ENDBOOL " + endBool);
    console.log("INC: " + inc);
    
    for ( ; i !== endBool; i += inc) {
        x = dy ? i : row;
        y = dx ? i : col;
        
        console.log("CHECKED (" + x + ", " + y + ")");
        if (typeof this.placeholder[x][y] === 'array') {
            if (dx) {
                for (var j = wire.column; j < col + 0.5; j += dx/2) {
                    if (dx % 1) {
                        if (this.placeholder[row][Math.floor(j)][(dx === 1 ? 1 : 3)]) {
                            console.log("wire collision error!");
                            return false;
                        }
                    }
                    else {
                        if (this.placeholder[row][Math.floor(j)][(dx === 1 ? 3 : 1)]) {
                            console.log("wire collision error!");
                            return false;
                        }
                    }
                }
                
            }
            else if (dy) {
                for (var j = wire.row; j < row + 0.5; j += dy/2) {
                    if (dy % 1) {
                        if (this.placeholder[Math.floor(j)][col][(dy === 1 ? 2 : 0)]) {
                            console.log("wire collision error!");
                            return false;
                        }
                    }
                    else {
                        if (this.placeholder[Math.floor(j)][col][(dy === 1 ? 0 : 2)]) {
                            console.log("wire collision error!");
                            return false;
                        }
                    }
                }
                
            }
        }
        else if (this.placeholder[x][y]) {
            console.log("ERROR! COMPONENT " + this.placeholder[x][y].ref + " DETECTED IN PATH");
            return false;
        }
    }

    placeholder = new Placeholder(wire.id, 0, 0, 1);
    for (i = Math.floor(dx ? Math.floor(wire.column): (dy ? Math.floor(wire.row) : 0)); i !== endBool; i += inc) {
        x = dy ? i : row;
        y = dx ? i : col;
        if (typeof this.placeholder[x][y] == 'undefined') {
            this.placeholder[x][y] = [];
        }
        this.placeholder[x][y] = placeholder;
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
    
    // Use reflection to dynamically create gate based on id :) 
    var MyClass = window;
    MyClass = MyClass[id];
    if (id == "Wire") {
        $("canvas").css('cursor','crosshair');

        digsim.mode = digsim.WIRE_MODE;
    }
    else if (id == "Simulate") {
        $("canvas").css('cursor','pointer');
        for (var i = 0; i < digsim.switches.length; ++i) {
            var obj = digsim.components[ digsim.switches[i] ];
            for (var j = 0; j < digsim.components.length; ++j) {
                digsim.components[j].visited = 0;
            }
            if (obj.traverse()) {
                obj.state = 0;
                obj.passState(obj.state);
            }
        }
        digsim.mode = digsim.SIM_MODE;
        digsim.drawComponents();
    }
    else if (id == "D_Mode") {
        $("canvas").css('cursor','default');
        digsim.mode = digsim.DEFAULT_MODE;
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
        gate.draw(digsim.staticContext);
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
        var x, y;
                
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
            var dy = (row < Math.floor(digsim.wirePos.startY)) ? -1 : ((row === Math.floor(digsim.wirePos.startY)) ? 0 : 1);
            var dx = (col < Math.floor(digsim.wirePos.startX)) ? -1 : ((col === Math.floor(digsim.wirePos.startX)) ? 0 : 1);
            
            if (dx == 0 && dy == 0) {
                return;
            }
            
            var wire = new Wire(); 
            wire.init(digsim.wirePos.startX, digsim.wirePos.startY, 0, digsim.iComp);
            if (digsim.lockH) {
                //console.log(Math.floor(mouseX / digsim.GRID_SIZE) - digsim.wirePos.startX);
                
                wire.path.push( {'x': col + 0.5 - digsim.wirePos.startX, 
                               'y': 0 } );
                
                /*
                // Set placeholders
                for ( ; i !== endBool; i += inc/2) {
                    y = digsim.lockH ? Math.floor(i) : col;
                    x = digsim.lockV ? Math.floor(i) : row;
                    if (typeof placeholder[x][y] === 'undefined') {
                        placeholder[x][y] = [];
                    }
                    placeholder[x][y][dx === 1 ? 1 : 3] = new Placeholder;
                }
                */
            }
            else if (digsim.lockV) {
                //console.log(Math.floor(mouseY / digsim.GRID_SIZE) - digsim.wirePos.startY);
                
                wire.path.push( {'x': 0, 
                               'y': row + 0.5 - digsim.wirePos.startY } );
                
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
                wire.draw(digsim.staticContext);
                wire.updatePos();
                wire.checkConnect();
            }
            else {
                wire.path.pop();
                digsim.dragging = true;
                // DO NOT PLACE WIRE, there's something in the way. 
            }
        }

        
        /*
        // Check clicked grid for wire
        var objClicked;
        if (objClicked = digsim.placeholder[row][col]) { // It exists
            if (digsim.components[objClicked.ref].type === digsim.WIRE) {
                x = col + 0.5;
                y = row + 0.5;
                wirePos = digsim.MID;
            }
        }
        
        // Determine grid snap for wires not connecting to other wires. 
        else if (relY < relX) {  // top
            if (relY < diagSep) {  // top-left
                x = col + 0.5;
                y = row;
                wirePos = digsim.TL;
            }
            else { // top-right
                x = col + 1;
                y = row + 0.5;
                wirePos = digsim.TR;
            }
        }
        else { // bottom
            if (relY < diagSep) { // bottom-left
                x = col;
                y = row + 0.5;
                wirePos = digsim.BL;
            }
            else { // bottom-right
                x = col + 0.5;
                y = row + 1;
                wirePos = digsim.BR;
            }
        }
        
        // Smart wire logic
        if (digsim.dragging) {
            // TO DO:
            // avoiding component collisions.... in a long time

            digsim.dragging = false;
            
            // Determine which logic set to use based on where the user started and ended their click
            var position = [];  
            position[0] = ((digsim.wirePos.startPos === digsim.TL || 
                           digsim.wirePos.startPos === digsim.BR) && 
                           (wirePos === digsim.TL || wirePos === digsim.BR));
            
            position[1] = ((digsim.wirePos.startPos === digsim.TL || 
                           digsim.wirePos.startPos === digsim.BR) && 
                           (wirePos === digsim.BL || wirePos === digsim.TR));

            position[2] = ((digsim.wirePos.startPos === digsim.TR || 
                            digsim.wirePos.startPos === digsim.BL) && 
                           (wirePos === digsim.BL || wirePos === digsim.TR));

            position[3] = ((digsim.wirePos.startPos === digsim.TR || 
                            digsim.wirePos.startPos === digsim.BL) && 
                           (wirePos === digsim.BR || wirePos === digsim.TL));
            position[4] = (digsim.wirePos.startPos === digsim.MID);

            // Going up/down and left/right?
            var changeY = (y < digsim.wirePos.startY) ? -1 : ((y === digsim.wirePos.startY) ? 0 : 1);
            var changeX = (x < digsim.wirePos.startX) ? -1 : ((x === digsim.wirePos.startX) ? 0 : 1);
            
            // You bozo... you clicked in the same spot.
            if (!changeY && !changeX)
                return;
            
            var wire = new Wire(); 
            wire.init(digsim.wirePos.startX, digsim.wirePos.startY, 0, digsim.iComp);
            digsim.components[digsim.iComp++] = wire;
            
            wire.dx = changeX;
            wire.dy = changeY;
            wire.startPos = digsim.wirePos.startPos;
            wire.endPos = wirePos;

            var startCol, startRow, endCol, endRow;
            relY = 0, relX = 0;

            // Wire started on TL or BR
            if (position[0] || position[1]) {
                
                // Determine starting and ending grids
                startCol = Math.floor(digsim.wirePos.startX);
                startRow = digsim.wirePos.startY + (changeY === -1 ? changeY : 0);
                if (position[0]) {
                    endCol = Math.floor(x);
                    endRow = y + (changeY === 1 ? -1 : 0);
                }
                else {                                            
                    endCol = x + (changeX === 1 ? -1 : 0);
                    endRow = Math.floor(y);                    
                }

                // Go towards y
                for(var i = startRow; i != endRow; i += changeY) {
                    digsim.setWirePlaceholder(wire.id, startCol, i);
                    relY += changeY;
                }
                
                wire.path.push( {'x': 0, 'y': (!changeY ? 0.5 : relY + 0.5 * changeY)} );
   
                // Go towards X
                for(var i = startCol; i != endCol; i += changeX) {
                    digsim.setWirePlaceholder(wire.id, i, startRow + relY);
                    relX += changeX;
                }
                
                digsim.setWirePlaceholder(wire.id, startCol + relX, startRow + relY);

                // Finish the line
                if (position[0]) {
                    wire.path.push( {'x': relX, 'y': relY + 0.5 * ((changeY) ? changeY : 1)} );
                    wire.path.push( {'x': relX, 'y': relY + changeY} );
                }
                else {
                    wire.path.push( {'x': relX + 0.5 * changeX, 'y': relY + 0.5 * changeY} );
                }
            }
            // Wire started on TR or BL
            else if (position[2] || position[3]) {

                // Determine starting and endoing grids
                startCol = digsim.wirePos.startX + (changeX === -1 ? changeX : 0);
                startRow = Math.floor(digsim.wirePos.startY);
                if (position[2]) {
                    endCol = x + (changeX === 1 ? -1 : 0);
                    endRow = Math.floor(y);
                }
                else {
                    endCol = Math.floor(x);
                    endRow = y + (changeY === 1 ? -1 : 0);
                }
                
                // Go towards x
                for(var i = startCol; i != endCol; i += changeX) {
                    digsim.setWirePlaceholder(wire.id, i, startRow + relY);
                    relX += changeX;
                }
                
                wire.path.push( {'x':  (!changeX ? 0.5 : relX + 0.5 * changeX), 'y': 0} );
                
                // Go towards y
                for(var i = startRow; i != endRow; i += changeY) {
                    digsim.setWirePlaceholder(wire.id, startCol + relX, i);
                    relY += changeY;
                }   
                
                digsim.setWirePlaceholder(wire.id, startCol + relX, startRow + relY);

                // Finish the line
                if (position[2]) {
                    wire.path.push( {'x': relX + 0.5 * ((changeX) ? changeX : 1), 'y': relY} );
                    wire.path.push( {'x': relX + changeX, 'y': relY} );
                }
                else {
                    wire.path.push( {'x': relX + 0.5 * changeX, 'y': relY + 0.5 * changeY} );
                }
            }
            else { // wire started in middle 
                
                // Determine starting and ending grids
                
            }                
            
            wire.draw(digsim.staticContext);
            wire.updatePos();
            wire.checkConnect();
        }
        else if (x && y){
            console.log("(" + x + ", " + y + ")");
            digsim.dragging = true;
            digsim.wirePos.startX = x;
            digsim.wirePos.startY = y;
            digsim.wirePos.startPos = wirePos;
            animateWire();
        }
         */
    }
};                     

/*****************************************************************************
 * ON GRID MOUSE DOWN
 *  Click and drag gates. Only called in default mode. 
 ****************************************************************************/
Digsim.prototype.onGridMouseDown = function(event) {
    if (digsim.mode === digsim.DEFAULT_MODE) {
        event.preventDefault();
        
        // If the onMosueUp event didn't get triggered, trigger it here
        if (digsim.dragging) {
            $("canvas").mouseup();
        }
        digsim.dragging = false;
        
        // Gets mouse position on canvas
        var mouseX = event.offsetX || event.layerX || event.clientX - $(".canvases").position().left;
        var mouseY = event.offsetY || event.layerY || event.clientY - $(".canvases").position().top;;
        
        // Tells us where on the grid (we've created) the click is
        var col = Math.floor(mouseX / digsim.GRID_SIZE);
        var row = Math.floor(mouseY / digsim.GRID_SIZE);
        
        // Here's where the magic happens
        if (digsim.placeholder[row][col]) {
            digsim.dragging = true;
            
            var ref = digsim.placeholder[row][col].ref;
            digsim.draggingGate = digsim.components[ref];
            digsim.draggingGate.drawStatic = false;
            
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
        // Gets mouse position on canvas
        var mouseX = event.offsetX || event.layerX || event.clientX - $(".canvases").position().left;
        var mouseY = event.offsetY || event.layerY || event.clientY - $(".canvases").position().top;;
        
        // Tells us where on the grid (we've created) the click is
        var col = Math.floor(mouseX / digsim.GRID_SIZE);
        var row = Math.floor(mouseY / digsim.GRID_SIZE);
        
        if (digsim.placeholder[row][col]) {
            var obj = digsim.components[ digsim.placeholder[row][col].ref ];
            if (obj.type === digsim.SWITCH) {
                for (var j = 0; j < digsim.components.length; ++j) {
                    digsim.components[j].visited = 0;
                }
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
    if (digsim.mode !== digsim.WIRE_MODE) {
        if (digsim.dragging) {
            digsim.components[digsim.draggingGate.id] = digsim.draggingGate;
            digsim.draggingGate.drawStatic = true;
            digsim.setPlaceholders(digsim.draggingGate);
            digsim.draggingGate.draw(digsim.staticContext);
            digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
            digsim.draggingGate.updatePos();
            digsim.draggingGate.checkConnect();
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
 * NAMESPACE THINGY
 *  Create namespace for the application. If namespace already exisists, don't
 *  override it, otherwise create an empty object.
 ****************************************************************************/
var digsim = digsim || new Digsim();


Digsim.prototype.showPlaceholders = function() {
    this.clearCanvas(this.gridContext, this.gridWidth, this.gridHeight);
    this.drawGrid(this.gridContext);

    var row = 0; col = 0;
    for (row = 0; row < this.gridWidth; row++) {
        for (col = 0; col < this.gridHeight; col++) {
            if (this.placeholder[row][col]) {
                this.gridContext.fillStyle = 'orange';
                this.gridContext.fillRect(col * this.GRID_SIZE + 1, row * this.GRID_SIZE + 1, this.GRID_SIZE -2, this.GRID_SIZE - 2);
                this.gridContext.fillStyle = 'white';
                this.gridContext.font = "20pt Calibri";
                this.gridContext.fillText(this.placeholder[row][col].ref, col * this.GRID_SIZE + this.GRID_SIZE / 2 - 10, row * this.GRID_SIZE + this.GRID_SIZE / 2 + 10)
            }
        }
    }
};