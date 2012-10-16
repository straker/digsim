/*******************************************************************************
 * Program: 
 *  application.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  A (soon-to-be) fully functional circuit simulation program. 
 ******************************************************************************/

/*******************************************************************************
 * DIGSIM
 *  Holds all the constants, animation, and data variables for the program
 ******************************************************************************/
function Digsim() {
	// Create constants
	this.GRID_SIZE = 41;
	this.NUM_COLS = 60;
	this.NUM_ROWS = 30;
    
    // Type identifiers
    this.AND = 0;
    this.NAND = 1;
    this.OR = 2;
    this.NOR = 3;
    this.XOR = 4;
    this.NOT = 5;
    this.WIRE = 6;
    this.SWITCH = 7;
    this.LED = 8;
    this.DEFAULT_MODE = 0;
	this.WIRE_MODE = 1;
    this.SIM_MODE = 2;
    this.LR = 0;    // Left-right orientation
    this.UD = 90;   // Up-down orientation
    this.RL = 180;  // right-left orientation
    this.DU = 270;  // down-up orientation;
    this.TL = 0;    // top-left
    this.TR = 1;    // top-right
    this.BL = 2;    // bottom-left
    this.BR = 3;    // bottom-right
    
    // Animation variables
    this.wirePos = {
        startX: -1, 
        startY: -1, 
        endX: -1, 
        endY: -1, 
        startPos: -1, 
        endPos: -1
    };
    this.dragging = false;
    this.draggingGate;
    
	// Grid variables
	this.gridWidth = this.NUM_COLS * this.GRID_SIZE;
	this.gridHeight = this.NUM_ROWS * this.GRID_SIZE;
    this.oGridWidth = this.gridWidth - this.GRID_SIZE;
    this.oGridHeight = this.gridHeight - this.GRID_SIZE;
    this.mousePos = { x: -1, y: -1 };
    this.offsetCol = 0;
    this.offsetRow = 0;
    
    // Gate identifier
    this.iComp = 0;
    this.mode = 0;
    
    // Data arrays
    this.components = [];   // Holds all of the objects by their unique ID 
    
    this.placeholder = [];  // Holds component positions on grid
    for (var i = 0; i < this.NUM_COLS; ++i) {
        this.placeholder[i] = [];
    }
};

/*******************************************************************************
 * INIT
 *  Tests to see if the canvas is supported, returning true if it is
 ******************************************************************************/
Digsim.prototype.init = function() {
	// Get the canvas element
	this.gridCanvas = document.getElementById('grid');
	this.staticCanvas = document.getElementById('static');
	this.movingCanvas = document.getElementById('moving');
	
	// Test to see if canvas is supported
	if (this.gridCanvas.getContext) {
        // onClick events
        $("canvas").mousedown(digsim.onGridMouseDown);
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

/*******************************************************************************
 * CLEAR CANVAS
 *  Clears the given canvas. 
 ******************************************************************************/
Digsim.prototype.clearCanvas = function(context, width, height) {
	// Store the current transformation matrix
	context.save();
    
	// Use the identity matrix while clearing the canvas
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, width, height);
    
	// Restore the transform
	context.restore();
};

/*******************************************************************************
 * DRAW GRID
 *  Draws the underlying blue grid on the screen
 ******************************************************************************/
Digsim.prototype.drawGrid = function(context) {
	// Outline the canvas	
	context.strokeRect(0, 0, this.gridWidth, this.gridHeight);
	
	context.strokeStyle = '#8DCFF4';
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
};

/*******************************************************************************
 * RUN
 *  Starts doing stuff (window.onload)
 ******************************************************************************/
Digsim.prototype.run = function() {
	if(this.init()) {
		this.drawGrid(this.gridContext);
	}
};

/*******************************************************************************
 * SET PLACEHOLDERS
 *  Given a gate object, adds it to the placeholder data array with unique
 *  identifier. 
 ******************************************************************************/
Digsim.prototype.setPlaceholders = function(gate) {
    var factor = (2 * (Math.floor(gate.numInputs / 2))) + 1;
    var row, col;
    for (row = 0; row < factor; ++row) {
        for (col = 0; col < factor; ++col) {
            var placeholder = new Placeholder(gate.id, col, row, factor);
            this.placeholder[gate.row + row][gate.column + col] = placeholder;
        }
    }
};

/*******************************************************************************
 * SET PLACEHOLDERS
 *  Given a wire object, adds it to the placeholder data array with unique
 *  identifier. 
 ******************************************************************************/
Digsim.prototype.setWirePlaceholder = function(wire) {
    var placeX = Math.floor(wire.column), placeY = Math.floor(wire.row);
    placeholder = new Placeholder(wire.id, placeX, placeY, 1);
    this.placeholder[placeX][placeY] = placeholder;
};

/*******************************************************************************
 * ON BUTTON CLICKED
 *  When a button is clicked, do this. Creates a gate when button is clicked. 
 *  This only works because of id on the html matches the name of the gate. 
 *  "AND", "OR", etc...
 ******************************************************************************/
Digsim.prototype.onButtonClicked = function (event) {
    var id = $(this).attr("id");
    
    // Use reflection to dynamically create gate based on id :) 
    var MyClass = window;
    MyClass = MyClass[id];
    if (id == "Wire") {
        $("canvas").css('cursor','crosshair');

        digsim.mode = digsim.WIRE_MODE;
    }
    else {
        $("canvas").css('cursor','default');
        digsim.mode = digsim.DEFAULT_MODE;
        var gate = new MyClass(3); 
        gate.init(2, 2, 0, digsim.iComp);
        digsim.components[digsim.iComp++] = gate;
        digsim.setPlaceholders(gate);
        gate.draw(digsim.staticContext);
    }
};

/*******************************************************************************
 * ON GRID CLICKED
 *  Called when wire mode is on - for dragging wires. 
 ******************************************************************************/
Digsim.prototype.onGridClicked = function(event) {
    if (digsim.mode === digsim.WIRE_MODE) {
                 
        var mouseX = event.offsetX || event.layerX;
        var mouseY = event.offsetY || event.layerY;
        var x, y;
                
        // Tells us where on the grid (we've created) the click is
        var relX = mouseX % digsim.GRID_SIZE;
        var relY = mouseY % digsim.GRID_SIZE;
        var diagSep = digsim.GRID_SIZE - relX;
        var wirePos = 0;
        
        // Snap starting point to grid...
        // Determine grid snap for wires. 
        if (relY < relX) {  // top
            if (relY < diagSep) {  // top-left
                x = Math.floor(mouseX / digsim.GRID_SIZE) + 0.5;
                y = Math.floor(mouseY / digsim.GRID_SIZE);
                wirePos = digsim.TL;
            }
            else { // top-right
                x = Math.floor(mouseX / digsim.GRID_SIZE) + 1;
                y = Math.floor(mouseY / digsim.GRID_SIZE) + 0.5;
                wirePos = digsim.TR;
            }
        }
        else { // bottom
            if (relY < diagSep) { // bottom-left
                x = Math.floor(mouseX / digsim.GRID_SIZE);
                y = Math.floor(mouseY / digsim.GRID_SIZE) + 0.5;
                wirePos = digsim.BL;
            }
            else { // bottom-right
                x = Math.floor(mouseX / digsim.GRID_SIZE) + 0.5;
                y = Math.floor(mouseY / digsim.GRID_SIZE) + 1;
                wirePos = digsim.BR;
            }
        }
        
        // Start/end wire
        if (digsim.dragging) {
            // TO DO:
            // wire logic
            // Snap end point to grid
            // Create wires in component array
            // Create placeholders for wires in placeholder array
            // redraw on static Canvas
            // connect wire to components
            // avoiding component collisions.... in a long time
            
            digsim.wirePos.endX = x;
            digsim.wirePos.endY = y;
            digsim.dragging = false;
            // digsim.wirePos.endPos = wirePos; may or may not need this.
            
            // Wire Drawing Logic, block by block
            x = digsim.wirePos.startX;
            y = digsim.wirePos.startY;
            var position = [], placeX, placeY, placeholder; 

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

            // Garbage collecting to be done later... clean up this code!

            /****** PROBLEM: We draw only 1 wire (which was nice), but if you draw the wires, and then move a gate, the
                    redrawing of the static grid only draws the 1 wire (in the 1 grid), not the entire line! I guess we'll
                    have to go back to 1 wire per grid so that we can redraw it properly when we move a gate around ******/
            var wire = new Wire(); 
            wire.init(x, y, digsim.UD, digsim.iComp);
            digsim.components[digsim.iComp++] = wire;

            //while (x != digsim.wirePos.endX && y != digsim.wirePos.endY) {
                // Case 1:  top-left to top-left &
                //          top-left to bottom-right
                if (position[0]) {
                    // First, go towards y
                    var changeY = (y > digsim.wirePos.endY) ? -1 : 1;
                    var changeX = (x > digsim.wirePos.endX) ? -1 : 1;
                    while (y + changeY != digsim.wirePos.endY) {
                        
                        // To-do: Collision detect
                        
                        // Create placeholder
                        digsim.setWirePlaceholder(wire);

                        // Draw and update wire
                        wire.draw(digsim.staticContext);
                        wire.row = (y = y + changeY);
                    }
                    
                    // Draw twoards x if needed
                    console.log("X: " + x + "   ENDX: " + digsim.wirePos.endX);
                    if (x !== digsim.wirePos.endX) {
                        // Draw the remaining half a wire for the corner (implement in Wire function named drawCorner())
                        wire.halfDraw(digsim.staticContext);
                        wire.row += changeY / 2;

                        // Rotate wire towards x                     
                        if (x > digsim.wirePos.endX) 
                            wire.rotation = digsim.RL;
                        else
                            wire.rotation = digsim.LR;
                        
                        digsim.setWirePlaceholder(wire);
                        wire.halfDraw(digsim.staticContext);

                        wire.column = (x += x > digsim.wirePos.endX ? -.5 : .5);
                        console.log("X: " + x + "   ENDX: " + digsim.wirePos.endX);
                        while (x + (x > digsim.wirePos.endX ? -.5 : .5) !== digsim.wirePos.endX) {
                            // To-do: Collision detect
                            
                            // Create placeholder
                            digsim.setWirePlaceholder(wire);

                            // Draw and update wire
                            wire.draw(digsim.staticContext);
                            wire.column = (x = x + changeX);
                            console.log("X: " + x + "   ENDX: " + digsim.wirePos.endX);
                        }
                    }
                }
            
                
            //}
        }
        else {
            digsim.dragging = true;
            digsim.wirePos.startX = x;
            digsim.wirePos.startY = y;
            digsim.wirePos.startPos = wirePos;
            animateWire();
        }
    }
};

/*******************************************************************************
 * ON GRID MOUSE DOWN
 *  Click and drag gates. Only called in default mode. 
 ******************************************************************************/
Digsim.prototype.onGridMouseDown = function(event) {
    if (digsim.mode === digsim.DEFAULT_MODE) {
    // Useless comment
    event.preventDefault();
    
    if (digsim.dragging) {
        
    }
    digsim.dragging = false;
    
    // Gets mouse position on canvas
    var mouseX = event.offsetX || event.layerX;
    var mouseY = event.offsetY || event.layerY;
    
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
        var size = placeholder.size;
        digsim.offsetRow = posY;
        digsim.offsetCol = posX;
        for (var y = 0, iRow = row - posY; y < size; ++y) {
            for (var x = 0, iCol = col - posX; x < size; ++x) {
                digsim.placeholder[iRow + y][iCol + x] = undefined;
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
};

/*******************************************************************************
 * DRAW COMPONENTS
 *  Redraws all the components on the static canvas, after everything has been
 *  dragged and dropped
 ******************************************************************************/
Digsim.prototype.drawComponents = function() {
    this.clearCanvas(this.staticContext, this.gridWidth, this.gridHeight);
    for (index in this.components) {
        if(this.components[index].drawStatic) {
            this.components[index].draw(this.staticContext);
        }
    }
};

/*******************************************************************************
 * REQUEST ANIMATION FRAME
 *  Optimizes the 60 frames/sec animation frame rate relative to the browser
 ******************************************************************************/
{
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
}

/*******************************************************************************
 * ANIMATE WIRE
 *  While a wire is being placed, keep a line drawn from starting point to 
 *  mouse position
 ******************************************************************************/
function animateWire() {
    var context = digsim.movingContext;
    digsim.clearCanvas(context, digsim.gridWidth, digsim.gridHeight);
    
    var col = Math.floor(digsim.mousePos.x / digsim.GRID_SIZE);
    var row = Math.floor(digsim.mousePos.y / digsim.GRID_SIZE);
    
    if (digsim.dragging) {
        
        requestAnimFrame(animateWire);
        
        // Draw Wire
        context.beginPath();
        context.fillStyle = '#000000';
        context.lineWidth = 2;
        context.moveTo(digsim.wirePos.startX * digsim.GRID_SIZE, digsim.wirePos.startY * digsim.GRID_SIZE);
        context.lineTo(digsim.mousePos.x, digsim.mousePos.y); 
        context.stroke();
    }
};

/*******************************************************************************
 * ANIMATE
 *  Anything that is being moved will be drawn with this function on the 
 *  movingContext canvas. 
 ******************************************************************************/
function animate() {
    if (digsim.dragging) {
        digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
        
        requestAnimFrame(animate);
        
        var col = Math.floor(digsim.mousePos.x / digsim.GRID_SIZE);
        var row = Math.floor(digsim.mousePos.y / digsim.GRID_SIZE);
        digsim.draggingGate.column = col - digsim.offsetCol;
        digsim.draggingGate.row = row - digsim.offsetRow;
        digsim.draggingGate.draw(digsim.movingContext);
    }
};

/*******************************************************************************
 * MOUSE MOVE
 *  Gets the position of the mouse on the canvas. 
 ******************************************************************************/
{
$("canvas").mousemove(function(event) {
    var mouseX = event.offsetX || event.layerX;
    var mouseY = event.offsetY || event.layerY;
    digsim.mousePos = { x: mouseX, y: mouseY };
});
}

/*******************************************************************************
 * MOUSE UP
 *  When the mouse is realeased while on the canvas, this will take care of all
 *  the things that change after stuff being dragged around. 
 ******************************************************************************/
{
$("canvas").mouseup(function(event) {
                    if (digsim.mode !== digsim.WIRE_MODE) {
    if (digsim.dragging) {
        digsim.components[digsim.draggingGate.id] = digsim.draggingGate;
        digsim.draggingGate.drawStatic = true;
        digsim.setPlaceholders(digsim.draggingGate);
        digsim.draggingGate.draw(digsim.staticContext);
        digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
    }
    digsim.dragging = false;
                    }
});
}

/*******************************************************************************
 * NAMESPACE THINGY
 *  Create namespace for the application. If namespace already exisists, don't
 *  override it, otherwise create an empty object.
 ******************************************************************************/
var digsim = digsim || new Digsim();



