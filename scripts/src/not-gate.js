/*****************************************************************************
 * Program: 
 *  not-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

function NOT() {
    this.type = digsim.NOT;
    this.next = [];
    this.prev = [];
    this.connections = [];
    this.state = 0;
    this.numInputs = 1;
    this.connectPoint = {'x': -1, 'y': -1};
    this.dimension = {'row': 3, 'col': 2};
        
    var wire = new Wire();
    this.setPrev(wire);
    wire.init(0, 0, 0, digsim.iComp);
    digsim.components[digsim.iComp++] = wire;
    wire.connections.push(this);

    // Reset input wire path
    wire.path = [];
    wire.path.push({'x': -1, 'y': 0});
    wire.startPos = 1;
    wire.endPos = 1;
    wire.dx = -1;
    
    var wire = new Wire();
    this.setNext(wire);
    this.connections[0] = wire;
    wire.init(0, 0, 0, digsim.iComp);
    digsim.components[digsim.iComp++] = wire;
    
    // Reset output wire path
    wire.path = [];
    wire.path.push({'x': 1, 'y': 0});
    wire.startPos = 1;
    wire.endPos = 1;
    wire.dx = 1;
    
};

NOT.prototype = new Drawable();

/******************************************************************************
 * INIT
 *  Initiates a drawable object at a given column, row, and rotation
 *****************************************************************************/
NOT.prototype.init = function (col, row, rot, id) {
    this.column = col;
    this.row = row;
    this.rotation = rot;
    this.id = id;
    this.drawStatic = true;
    this.updatePos(); 

    this.prev[0].init(this.column, this.row + 1.5, rot, this.prev[0].id);  
    this.prev[0].drawStatic = false;
    this.next[0].init(this.column + 2, this.row + 1.5, rot, this.next[0].id);
    this.next[0].drawStatic = false;
};

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
NOT.prototype.draw = function(context) {
    
    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.lineWidth = 2;
    
    // Draw gate  
    context.moveTo(0, digsim.GRID_SIZE * 2 / 3);
    context.lineTo(digsim.GRID_SIZE * 1.625, digsim.GRID_SIZE * 1.5);
    context.lineTo(0, digsim.GRID_SIZE * 7 / 3);
    context.closePath();
    context.fill();
    context.stroke();
    
    context.moveTo(digsim.GRID_SIZE * 1.75, digsim.GRID_SIZE * 1.5);
    context.beginPath();
    context.arc(digsim.GRID_SIZE * 1.8125, digsim.GRID_SIZE * 1.5, digsim.GRID_SIZE * 3 / 16, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
    context.restore();

    // Draw wires
    this.prev[0].column = this.column;
    this.prev[0].row = this.row + 1.5;
    this.prev[0].drawStatic = false;
    this.next[0].column = this.column + 2;
    this.next[0].row = this.row + 1.5;

    this.next[0].drawStatic = false;
    this.prev[0].draw(context);
    this.prev[0].updatePos();
    
    this.next[0].draw(context);
    this.next[0].updatePos();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  NOTs all the input wires together to set the current state of the gate. 
 ****************************************************************************/
NOT.prototype.computeLogic = function() {
    this.state = !this.prev[0].state;
    console.log("PREVIOUS: " + this.prev[0].state);
};




