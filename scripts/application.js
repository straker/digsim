// Zack was here 27 Sep 2012 5:20 pm :)

// Main application
function Digsim() {
	// Create constants
	this.GRID_SIZE = 10;
	this.NUM_COLS = 60;
	this.NUM_ROWS = 30;
	
	// Grid variables
	this.gridWidth = this.NUM_COLS * this.GRID_SIZE;
	this.gridHeight = this.NUM_ROWS * this.GRID_SIZE;
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

// Create namespace for the application. If namespace already exisists, don't override it, otherwise create an empty object.
var digsim = digsim || new Digsim();

// Draws a generic gate... just a start.
Digsim.drawGate = function(numInputs, posX, posY) {
    this.staticContext.translate(
    this.staticContext.beginPath();
    this.staticContext.moveTo(posX, posY);
    
    // Draw vertial line on gate (something else for an OR gate
    switch (numInputs)
    {
            // 2 or 3 inputs will require a length of 40px 
        case 2: 
        case 3: 
            this.staticContext.lineTo(posX, posY + 40);
            this.staticContext.moveTo(posX, posY);
            
            
            
            break;
            // 4 input gates require a length of 50px
        case 4:
            this.staticContext.lineTo(posX, posY + 50);
            break;
    }
    
    
    switch (numInputs)
    {
        case 2: 
        case 3:
    }
    
    
}