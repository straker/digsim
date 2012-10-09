
/*
 WIRE PLACEMENT GRID DIMENSIONS: 2n - 3
 
 WIRE CLICK-FIND ALGORITHM
 - check if closer to vert or horiz girdline and use as reference to search for wire
 disX = mouseX % gridsize; // pixels away from grid line
 disY = mouseY % gridsize;
 if (disX < disY)
    search array for vert wire
    if no find
        search array for horiz wire
 else
    search array for horiz wire
    if no find
        search array for vert wire 
 
 */




// Main application
function Digsim() {
	// Create constants
	this.GRID_SIZE = 20;
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
    this.SIM_MODE = 3;
    this.LR = 0;    // Left-right orientation
    this.UD = 1;    // Up-down orientation
    
    // Animation variables
    this.wirePos = {startX: -1, startY: -1, endX: -1, endY: -1};
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
    
    this.wires = [];      
    for (var r = 0; r < this.NUM_ROWS - 1; ++r) {
        this.wires[r] = [];
        for (var c = 0; c < this.NUM_COLS - 1; ++c) {
             this.wires[r][c] = [];
        }
    }
             
};

// Tests to see if the canvas is supported, returning true if it is
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

// Clear a canvas element
Digsim.prototype.clearCanvas = function(context, width, height) {
	// Store the current transformation matrix
	context.save();
    
	// Use the identity matrix while clearing the canvas
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, width, height);
    
	// Restore the transform
	context.restore();
};

// Draw the grid
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

Digsim.prototype.run = function() {
	if(this.init()) {
		this.drawGrid(this.gridContext);
	}
};

Digsim.prototype.setPlaceholders = function(gate) {
    var factor = 2 * (Math.floor(gate.numInputs / 2) + 1);
    var row, col;
    for (row = 0; row < factor; ++row) {
        for (col = 0; col < factor; ++col) {
            var placeholder = new Placeholder(gate.id, col, row, factor);
            this.placeholder[gate.row + row][gate.column + col] = placeholder;
        }
    }
};

// Create a gate when button is clicked. This only works because id on html 
// matches the name of the gate. ("AND", "OR", etc...).
Digsim.prototype.onButtonClicked = function (event) {
    var id = $(this).attr("id");
    
    // Use reflection to dynamically create gate based on id :) 
    var MyClass = window;
    MyClass = MyClass[id];
    if (id == "Wire") {
        console.log("Wire Clicked!");
        $("canvas").css('cursor','crosshair');
        digsim.mode = digsim.WIRE_MODE;
    }
    else {
        $("canvas").css('cursor','default');
        digsim.mode = digsim.DEFAULT_MODE;
        var gate = new MyClass(2); 
        gate.init(2, 2, 0, digsim.iComp);
        digsim.components[digsim.iComp++] = gate;
        digsim.setPlaceholders(gate);
        gate.draw(digsim.staticContext);
    }
};

// Called when wire mode is on - for dragging wires. 
Digsim.prototype.onGridClicked = function(event) {
    if (digsim.mode === digsim.WIRE_MODE) {
                 
        var mouseX = event.offsetX || event.layerX;
        var mouseY = event.offsetY || event.layerY;
        var x, y;
        
        // Tells us where on the grid (we've created) the click is
        var horizOffset = mouseX % digsim.GRID_SIZE;
        var vertOffset = mouseY % digsim.GRID_SIZE;
        
        // Snap starting point to grid...
        // Determine grid snap for wires. 
        if (horizOffset > (digsim.GRID_SIZE / 2)) { // right
            x = Math.floor(mouseX / digsim.GRID_SIZE) + 1;
        }
        else { // left
            x = Math.floor(mouseX / digsim.GRID_SIZE);
        }
        if (vertOffset > (digsim.GRID_SIZE / 2)) { // bottom
            y = Math.floor(mouseY / digsim.GRID_SIZE) + 1;
        }
        else { // top
            y = Math.floor(mouseY / digsim.GRID_SIZE);
        }
        
        console.log(digsim.dragging);
        // Start/end wire
        if (digsim.dragging) {
            // TODO:
            // Snap end point to grid
            // Create wires in wire array
            // redraw on static Canvas
            // connect wire to compnents
            // vertical/horizontal drawing
            // avoiding component collisions.... in a long time
            
            digsim.wirePos.endX = x;
            digsim.wirePos.endY = y;
            digsim.dragging = false;
            
            /* DRAWS A STRAIGHT LINE FROM BEGIN TO END - COULD BE OBLIQUE */
            digsim.staticContext.beginPath();
            digsim.staticContext.fillStyle = '#000000';
            digsim.staticContext.lineWidth = 2;
            digsim.staticContext.moveTo(digsim.wirePos.startX * digsim.GRID_SIZE, digsim.wirePos.startY * digsim.GRID_SIZE);
            
            // Draw the wire /////////
            // HORIZONTAL - VERTICAL - HORIZONTAL
            var diffX = Math.floor((digsim.wirePos.endX + digsim.wirePos.startX) / 2);
            digsim.staticContext.lineTo(diffX * digsim.GRID_SIZE, digsim.wirePos.startY * digsim.GRID_SIZE);
            digsim.staticContext.lineTo(diffX * digsim.GRID_SIZE, digsim.wirePos.endY * digsim.GRID_SIZE);
            digsim.staticContext.lineTo(digsim.wirePos.endX * digsim.GRID_SIZE, digsim.wirePos.endY * digsim.GRID_SIZE); 
            digsim.staticContext.stroke();
             
            
            // VERTICAL - HORIZONTAL - VERTICAL
            /*
            var diffY = Math.floor((digsim.wirePos.endY + digsim.wirePos.startY) / 2);
            digsim.staticContext.lineTo(digsim.wirePos.startX * digsim.GRID_SIZE, diffY * digsim.GRID_SIZE);
            digsim.staticContext.lineTo(digsim.wirePos.endX * digsim.GRID_SIZE, diffY * digsim.GRID_SIZE);
            digsim.staticContext.lineTo(digsim.wirePos.endX * digsim.GRID_SIZE, digsim.wirePos.endY * digsim.GRID_SIZE); 
            digsim.staticContext.stroke();
             */
             
        }
        else {
            digsim.dragging = true;
            digsim.wirePos.startX = x;
            digsim.wirePos.startY = y;
            animateWire();
        }
    }
};

// Click and drag gates only called in default mode
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
        console.log("empty");
    }
    }
};

Digsim.prototype.drawComponents = function() {
    this.clearCanvas(this.staticContext, this.gridWidth, this.gridHeight);
    for (index in this.components) {
        if(this.components[index].drawStatic) {
            this.components[index].draw(this.staticContext);
        }
    }
};

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

$("canvas").mousemove(function(event) {
    var mouseX = event.offsetX || event.layerX;
    var mouseY = event.offsetY || event.layerY;
    digsim.mousePos = { x: mouseX, y: mouseY };
});

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

// Create namespace for the application. If namespace already exisists, don't override it, otherwise create an empty object.
var digsim = digsim || new Digsim();



