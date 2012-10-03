
// Main application
function Digsim() {
	// Create constants
	this.GRID_SIZE = 10;
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
	
	// Grid variables
	this.gridWidth = this.NUM_COLS * this.GRID_SIZE;
	this.gridHeight = this.NUM_ROWS * this.GRID_SIZE;
    
    // Gate identifiers
    this.iComp = 0;
    
    // Data arrays
    this.components = [];   // Holds all of the objects by their unique ID 
    
    this.placeholder = [];  // Holds component positions on grid
    for (var i = 0; i < this.NUM_COLS; ++i) {
        this.placeholder[i] = [];
    }
    
    this.wires = [];        // AHH! Holds [row][col][index] (index is present 
                            // because there can be a node of more than just 1 
                            // wire. 
};

// Tests to see if the canvas is supported, returning true if it is
Digsim.prototype.init = function() {
	// Get the canvas element
	this.gridCanvas = document.getElementById('grid');
	this.staticCanvas = document.getElementById('grid');
	this.movingCanvas = document.getElementById('grid');
	
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

// Create namespace for the application. If namespace already exisists, don't override it, otherwise create an empty object.
var digsim = digsim || new Digsim();
