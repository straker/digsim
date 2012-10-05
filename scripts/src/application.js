
// Main application
function Digsim() {
	// Create constants
	this.GRID_SIZE = 10;
	this.NUM_COLS = 115;
	this.NUM_ROWS = 45;
    
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
    this.dragging = false;
    this.mousePos = { x: -1, y: -1 };
    this.offsetCol = 0;
    this.offsetRow = 0;
    
    // Gate identifier
    this.iComp = 0;
    this.draggingGate;
    
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
	this.staticCanvas = document.getElementById('static');
	this.movingCanvas = document.getElementById('moving');
	
	// Test to see if canvas is supported
	if (this.gridCanvas.getContext) {
        // onClick events
        $("canvas").mousedown(digsim.onGridClicked);
        $("button").click(digsim.onButtonClicked);

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
    var gate = new MyClass(2); 
    gate.init(2, 2, 0, digsim.iComp);
    digsim.components[digsim.iComp++] = gate;
    digsim.setPlaceholders(gate);
    gate.draw(digsim.staticContext);
};

// Click and drag gates
Digsim.prototype.onGridClicked = function(event) {
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
    if (digsim.dragging) {
        digsim.components[digsim.draggingGate.id] = digsim.draggingGate;
        digsim.draggingGate.drawStatic = true;
        digsim.setPlaceholders(digsim.draggingGate);
        digsim.draggingGate.draw(digsim.staticContext);
        digsim.clearCanvas(digsim.movingContext, digsim.gridWidth, digsim.gridHeight);
    }
    digsim.dragging = false;
});

// Create namespace for the application. If namespace already exisists, don't override it, otherwise create an empty object.
var digsim = digsim || new Digsim();



