/*****************************************************************************
 * Program:
 *  wire.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  Wires only go in only one direction. Changing directions will create a new Wire.
 ****************************************************************************/

/*****************************************************************************
 * WIRE
 * @constructor
 * @extends Component
 ****************************************************************************/
function Wire() {
    this.type             = digsim.WIRE;
    this.name             = 'Wire';

    this.path             = {'x': 0, 'y': 0};
    this.dimension        = {'row': 0, 'col': 0};  // Height and width of component

    // Direction is determined by getting the sign of the end of the wire subtracted by the start of the wire
    this.dy               = 0;   // Direction of the wire in the y direction (1,0)
    this.dx               = 0;   // Direction of the wire in the x direction (1,0)
}
Wire.prototype = new Component();

/******************************************************************************
 * GET COMPONENT SPACE
 *  Return every {row, col, con, index, name} that the component fills. Helpful for setting
 *  and deleting placeholders.
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Wire.prototype.getComponentSpace = function() {
    var space = [];

    // Wires row and col are always in the middle of a grid space
    var row = Math.floor(this.row);
    var col = Math.floor(this.col);

    var endRow = this.path.y + this.row;
    var endCol = this.path.x + this.col;
    var i;

    // Wire going horizontally
    if (this.dx) {
        for (i = this.col; i !== endCol; i += 0.5) {
            col = Math.floor(i);

            space.push({
                'row'  : row,
                'col'  : col,
                'con'  : true,
                'index': (i % 1 ? 1 : 3)
            });
         }
    }
    // Wire going vertically
    else {
        for (i = this.row; i !== endRow; i += 0.5) {
            row = Math.floor(i);

            space.push({
                'row'  : row,
                'col'  : col,
                'con'  : true,
                'index': (i % 1 ? 2 : 0)
            });
        }
    }

    return space;
};

/******************************************************************************
 * GET COMPONENT INPUT SPACE
 *  Return every {row, col, con, index} that the component input fills. For a
 *  Wire, the input space is the beginning of the Wire.
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Wire.prototype.getComponentInputSpace = function() {
    var space = [];

    // Wires row and col are always in the middle of a grid space
    var row = Math.floor(this.row);
    var col = Math.floor(this.col);

    var index;
    if (this.dx === 1)
        index = 1;
    else
        index = 2;

    space.push({
        'row'      : row,
        'col'      : col,
        'con'      : true,
        'index'    : index,
        'conIndex' : 'input'
    });

    return space;
};

/******************************************************************************
 * GET COMPONENT OUTPUT SPACE
 *  Return every {row, col, con, index} that the component output fills. For a
 *  Wire, the output space is the end of the Wire.
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Wire.prototype.getComponentOutputSpace = function() {
    var space = [];

    // Wires row and col are always in the middle of a grid space
    var row = Math.floor(this.path.y + this.row);
    var col = Math.floor(this.path.x + this.col);

    var index;
    if (this.dx === 1)
        index = 3;
    else
        index = 0;

    space.push({
        'row'      : row,
        'col'      : col,
        'con'      : true,
        'index'    : index,
        'conIndex' : 'output'
    });

    return space;
};

/*****************************************************************************
 * CHECK CONNECTION
 *  Checks adjacent spaces for other component to connect to.
 ****************************************************************************/
Wire.prototype.checkConnections = function() {
    // Check for wire merging and splitting
    var i, j, space, comp, grid, index;
    var spaces = this.getComponentInputSpace();
    spaces = spaces.concat(this.getComponentOutputSpace());

    // Loop through both input and output spaces
    for (j = 0; j < spaces.length; j++) {
        space = spaces[j];

        // Loop through all 4 indices of the space
        for (i = 0; i < 4; i++) {
            grid = digsim.placeholders[space.row][space.col] || {};
            comp = (typeof grid[i] !== 'undefined' ? digsim.components.getComponent(grid[i].ref) : 0);
            index = space.index;

            // Merge wires only if they both go in the same direction and there are no other wires in the same grid space
            if (i != index && comp && comp.type === digsim.WIRE && this.dx === comp.dx && this.dy === comp.dy &&
                typeof grid[(index+1)%4] === 'undefined' && typeof grid[ (index-1) < 0 ? 3 : (index-1) ] === 'undefined') {
                 this.mergeWires(comp);

                // This wire no longer exists so exit the function
                return;
            }

            // Split wires only if it ends or starts in the middle of another wire
            if (i != index && comp && comp.type === digsim.WIRE && grid[(i+2)%4] && comp.id === grid[(i+2)%4].ref) {
                comp.splitWire(space.row, space.col);
            }
        }
    }

    // Call parent implementation
    Component.prototype.checkConnections.call(this);
};

/*****************************************************************************
 * DELETE CONNECTIONS
 *  Remove all connections of the component.
 ****************************************************************************/
Wire.prototype.deleteConnections = function() {
    this.connections.clear();
    Component.prototype.deleteConnections.call(this);
};

/*****************************************************************************
 * MERGE WIRES
 *  Merges two separate wires into one wire.
 * @param {Wire} wire - Wire to merge with.
 ****************************************************************************/
Wire.prototype.mergeWires = function(wire) {
    // Get the four points of both wires
    var point1, point2, point3, point4, endpoint;
    point1 = {'x': this.col, 'y': this.row};
    point2 = {'x': wire.col, 'y': wire.row};
    point3 = {'x': this.col + this.path.x, 'y': this.row + this.path.y};
    point4 = {'x': wire.col + wire.path.x, 'y': wire.row + wire.path.y};

    // Update wire coordinates
    this.row = Math.min(point1.y, point2.y);
    this.col = Math.min(point1.x, point2.x);
    endpoint = {'x': Math.max(point3.x, point4.x), 'y': Math.max(point3.y, point4.y)};
    this.path = {'x': Math.abs(endpoint.x - this.col), 'y': Math.abs(endpoint.y - this.row)};

    // Update wire connections
    digsim.deletePlaceholder(this);
    wire.deleteConnections();
    this.deleteConnections();
    digsim.setPlaceholders(this, true);
    this.checkConnections();

    // Remove new wire
    digsim.components.remove(wire, false);
};

/*****************************************************************************
 * SPLIT WIRES
 *  Splits the wire into two separate wires at the coordinate.
 * @param {number} row - Row to split the wire.
 * @param {number} col - Col to split the wire.
 ****************************************************************************/
Wire.prototype.splitWire = function(row, col) {
    var newPath = {'x': Math.floor(this.col + this.path.x - col), 'y': Math.floor(this.row + this.path.y - row)};

    // Update wire
    digsim.deletePlaceholder(this);
    this.deleteConnections();
    this.path = {'x': Math.floor(col - this.col + 0.5), 'y': Math.floor(row - this.row + 0.5)};
    digsim.setPlaceholders(this, true);

    // Create new wire
    var wire = new Wire();
    wire.init(row + 0.5, col + 0.5, 0, digsim.iComp);
    wire.dx = this.dx;
    wire.dy = this.dy;
    wire.path = newPath;

    digsim.components.add(wire);
    digsim.iComp++;
    digsim.setPlaceholders(wire, true);

    // Check connections
    this.checkConnections();
    wire.checkConnections();
};

/******************************************************************************
 * DRAW CONNECTION DOTS
 *  Draws connection dots
 * @param {CanvasRenderingContext2D} context    - Context to draw to.
 *****************************************************************************/
Wire.prototype.drawConnectionDots = function(context) {
    context.beginPath();
    context.strokeStyle = '#000000';
    context.fillStyle   = '#000000';

    var inputs  = this.connections.getConnectionComponents('input');
    var outputs = this.connections.getConnectionComponents('output');
    var draw    = false;
    var i;

    for (i = 0; i < inputs.length; i++) {
        if (inputs[i].type !== digsim.WIRE) {
            draw = true;
            break;
        }
    }

    if (draw || inputs.length >= 2) {
        space = this.getComponentInputSpace()[0];

        x = (space.col - this.col + 0.5) * digsim.gridSize;
        y = (space.row - this.row + 0.5) * digsim.gridSize;
        context.moveTo(x, y);
        context.arc(x, y, digsim.gridSize / 10, 0, 2 * Math.PI);
    }

    draw = false;
    for (i = 0; i < outputs.length; i++) {
        if (outputs[i].type !== digsim.WIRE) {
            draw = true;
            break;
        }
    }

    if (draw || outputs.length >= 2) {
        space = this.getComponentOutputSpace()[0];

        x = (space.col - this.col + 0.5) * digsim.gridSize;
        y = (space.row - this.row + 0.5) * digsim.gridSize;
        context.moveTo(x, y);
        context.arc(x, y, digsim.gridSize / 10, 0, 2 * Math.PI);
    }

    context.fill();
    context.stroke();

    context.restore();
};

/*****************************************************************************
 * DRAW
 *  Draw the Wire to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
Wire.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.strokeStyle = lineColor || 'black';
    context.fillStyle   = '#000000';
    context.lineWidth   = 2;
    context.lineCap     = 'round';

    // Color the wire based on state if simulating
    if (digsim.mode === digsim.SIM_MODE) {
        if (this.state === 1) {
            context.strokeStyle = '#FF0000';
        }
        else {
            context.strokeStyle = '#0000FF';
        }
    }

    context.moveTo(0, 0);
    context.lineTo(this.path.x * digsim.gridSize, this.path.y * digsim.gridSize);
    context.stroke();

    this.drawConnectionDots(context);

    context.restore();
};