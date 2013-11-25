 /******************************************************************************
 * Program:
 *  component.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  Base class for all Component objects.
 * @abstract
 *****************************************************************************/

/*****************************************************************************
 * Component
 * @constructor
 ****************************************************************************/
function Component() {
    this.row        = 0;      // Row of the top left corner of the Component
    this.col        = 0;      // Col of the top left corner of the Component
    this.id         = 0;      // Unique id
    this.numInputs  = 0;      // Number of input connections
    this.numOutputs = 0;      // Number of output connections
    this.rotation   = 0;      // Rotation of Component in 90deg intervals
    this.state      = -1;     // State (0 or 1) of the Component; -1 means that Component has not been traversed
    this.type       = 0;      // Unique id for the type of Component
    this.name       = "";     // Unique name of Component; Must match the name of the class
    this.label      = "";     // Label displayed for the Component
    this.drawStatic = true;   // If the Component should be drawn on the static context
}

/******************************************************************************
 * INIT
 *  Initiates a Component at a given row, col, and rotation.
 * @param {number} row - Initial row position.
 * @param {number} col - Initial col position.
 * @param {number} rot - Rotation of the Component in 90deg increments.
 * @param {number} id  - Unique id for the Component.
 *****************************************************************************/
Component.prototype.init = function (row, col, rot, id) {
    this.row        = row;
    this.col        = col;
    this.drawStatic = true;
    this.rotation   = rot;
    this.id         = id;
    this.label      = this.name + id;

    // Wires have no designated input/output, so we just have to keep track of their connections unit we traverse connections
    if (this.type === digsim.WIRE) {
        this.connections = new ComponentList(id);  // Wire connections
    }
    this.inputs  = new ComponentList(id);          // Component input connections
    this.outputs = new ComponentList(id);          // Component output connections

    // Save rotation 0 dimensions for wire drawing
    this.zeroDimension = {'row': this.dimension.row, 'col': this.dimension.col};

    // Swap row/col
    if (rot === 90 || rot === 270) {
        this.dimension.row = this.dimension.row ^ this.dimension.col;
        this.dimension.col = this.dimension.row ^ this.dimension.col;
        this.dimension.row = this.dimension.row ^ this.dimension.col;
    }
};

/******************************************************************************
 * IS A GATE
 *  Return true if the Component is a gate.
 * @return {boolean}
 *****************************************************************************/
Component.prototype.isAGate = function() {
    return false;
};

/******************************************************************************
 * IS A DRIVER
 *  Return true if the Component is a driver.
 * @return {boolean}
 *****************************************************************************/
Component.prototype.isADriver = function() {
    return false;
};

/******************************************************************************
 * GET INPUT ROTATION
 *  Return the row, col, and index of the input based on rotation and input index.
 * @param {number} inputIndex - Index of input.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
Component.prototype.getInputRotation = function(inputIndex) {
    // Skip a row/col for even input Components
    var skip = (this.numInputs % 2 === 0 && inputIndex >= this.numInputs / 2 ? 1 : 0);
    var row, col, index;

    // Get the row and col of the first wire (0), then modify by inputIndex
    switch(this.rotation / 90) {
        case 0:
            row = this.row + inputIndex + skip;
            col = this.col - 1;
            index = 1;
            break;
        case 1:
            row = this.row - 1;
            col = this.col + this.dimension.col - 1 - inputIndex - skip;
            index = 2;
            break;
        case 2:
            row = this.row + this.dimension.row - 1 - inputIndex - skip;
            col = this.col + this.dimension.col;
            index = 3;
            break;
        case 3:
            row = this.row + this.dimension.row;
            col = this.col + inputIndex + skip;
            index = 0;
            break;
    }

    return {row: row, col: col, index: index};
};

/******************************************************************************
 * GET OUTPUT ROTATION
 *  Return the row, col, and index of the output based on rotation and output index.
 * @param {number} outputIndex - Index of output.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
Component.prototype.getOutputRotation = function(outputIndex) {
    var row, col, index;

    // Get the row and col of the wire
    switch (this.rotation / 90) {
        case 0:
            row = this.row + Math.floor(this.dimension.row / 2);
            col = this.col + this.dimension.col;
            index = 3;
            break;
        case 1:
            row = this.row + this.dimension.row;
            col = this.col + Math.floor(this.dimension.col / 2);
            index = 0;
            break;
        case 2:
            row = this.row + Math.floor(this.dimension.row / 2);
            col = this.col  - 1;
            index = 1;
            break;
        case 3:
            row = this.row - 1;
            col = this.col + Math.floor(this.dimension.col / 2);
            index = 2;

    }

    return {row: row, col: col, index: index};
};

/******************************************************************************
 * GET COMPONENT SPACE
 *  Return every {row, col, con, index, name} that the Component fills. Helpful for setting
 *  and deleting placeholders.
 * @return {Array} array of objects of {row, col, con, index, name}. Index is
 *                 only present if space is a wire. Name is only present if space
 *                 is used for MUX or DFF.
 *****************************************************************************/
Component.prototype.getComponentSpace = function() {
    var space = [];

    // Component space
    for (var r = 0; r < this.dimension.row; r++) {
        for (var c = 0; c < this.dimension.col; c++) {
            /*****************************************************************************
             * Space
             * @param {number} row      - Row of the space
             * @param {number} col      - Column of the space
             * @param {number} index    - Index of the space if it only fills a part of a grid.
             *                            top = 0, right = 1, bottom = 2, left = 3.
             * @param {number} con      - If the space can be used for determining connections.
             * @param {number} conIndex - Which input or output wire the connection is.
             *****************************************************************************/
            space.push({
                'row': this.row + r,
                'col': this.col + c,
                'con': false
            });
        }
    }

    // Combine the input and output space arrays
    space = space.concat(this.getComponentInputSpace()).concat(this.getComponentOutputSpace());

    return space;
};

/******************************************************************************
 * GET COMPONENT INPUT SPACE
 *  Return every {row, col, con, index} that the Component input fills.
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Component.prototype.getComponentInputSpace = function() {
    var space = [];
    var input;

    // Input space
    for (var i = 0; i < this.numInputs; ++i) {
        // Calculate positions of connections based on rotation
        input = this.getInputRotation(i);

        space.push({
            'row'     : input.row,
            'col'     : input.col,
            'index'   : input.index,
            'con'     : true,
            'conIndex': i
        });
    }

    return space;
};

/******************************************************************************
 * GET COMPONENT OUTPUT SPACE
 *  Return every {row, col, con, index} that the Component output fills.
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Component.prototype.getComponentOutputSpace = function() {
    var space = [];
    var output;

    // Output space
    cnt = 0;
    for (var i = 0; i < this.numOutputs; ++i) {
        // Calculate positions of connections based on rotation
        output = this.getOutputRotation(i);

        space.push({
            'row'     : output.row,
            'col'     : output.col,
            'index'   : output.index,
            'con'     : true,
            'conIndex': i
        });
    }

    return space;
};

/******************************************************************************
 * GET EXTRA COMPONENT SPACE
 *  Return the space {row, col, con, index} above and below the Component.
 * @param {number} length - How many spaces to return (top & bottom or left & right count as 1).
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Component.prototype.getExtraComponentSpace = function(length) {
    var space = [];
    var col = this.col, row = this.row;
    var index;

    for (var i = 0; i < length; i++) {
        // Get space based on rotations
        for (var y = 0; y < 2; ++y) {
            // Component is rotated on it's side (90 or 270)
            if (((this.rotation) / 90) % 2) {
                // Right
                if (y) {
                    col = this.col + this.dimension.col;
                    index = 3;
                }
                // Left
                else {
                    index = 1;
                    col = this.col - 1;
                }
            }
            // Component is rotated normally (0 or 180)
            else {
                // Below
                if (y) {
                    row = this.row + this.dimension.row;
                    index = 0;
                }
                // Above
                else {
                    index = 2;
                    row = this.row - 1;
                }
            }

            space.push({
                'row'  : row,
                'col'  : col,
                'con'  : false,
                'index': index
            });
        }

        if (this.rotation === 90 || this.rotation === 270) {
            ++row;
        }
        else {
            ++col;
        }
    }

    return space;
};

/*****************************************************************************
 * CHECK CONNECTIONS
 *  Checks input and output spaces for other Components to connect to.
 ****************************************************************************/
Component.prototype.checkConnections = function() {

    var inputSpace = this.getComponentInputSpace();
    var outputSpace = this.getComponentOutputSpace();
    var cons, con, spaces, space, grid, ph, comp, i, j, k;

    // Check input and output space for connections
    cons = ['inputs','outputs'];
    for (k = 0; k < cons.length; k++) {
        con = cons[k];
        spaces = (con === 'inputs' ? inputSpace : outputSpace);

        // Loop through each space
        for (j = 0; j < spaces.length; j++) {
            space = spaces[j];

            // Check every index of the space for a connection
            for (i = 0; i < 4; i++) {
                grid = digsim.placeholders[space.row][space.col];
                ph   = grid[i];

                // There is a Component to connect to and it is not already connected
                if (i !== space.index && ph && ph.connectable && !this[con].contains(digsim.components.getComponent(ph.ref))) {
                    comp = digsim.components.getComponent(ph.ref);

                    if (this.type === digsim.WIRE) {
                        this.connections.add(comp, space.conIndex, true);
                    }
                    else {
                        this[con].add(comp, space.conIndex, true);
                    }

                    // Save connection to namedConnections
                    if (space.name) {
                        this.namedConnections[space.name] = comp;
                    }
                    if (ph.name) {
                        comp.namedConnections[ph.name] = this;
                    }

                    // Split a Wire
                    if (comp.type === digsim.WIRE && grid[(i+2)%4] && comp.id === grid[(i+2)%4].ref)
                        comp.splitWire(space.row, space.col);
                }
            }
        }
    }
};

/*****************************************************************************
 * DELETE CONNECTIONS
 *  Remove all connections of the Component.
 ****************************************************************************/
Component.prototype.deleteConnections = function() {
    this.inputs.clear();
    this.outputs.clear();
};

/******************************************************************************
 * DRAW LABEL
 *  Draws the label for the Component.
 * @param {CanvasRenderingContext2D} context - Context to draw to.
 * @param {string}                   color   - Font color.
 *****************************************************************************/
Component.prototype.drawLabel = function(context, color) {
    context.save();

    context.font      = "10pt Calibri";
    context.fillStyle = color || 'black';
    context.textAlign = 'center';

    var x = (this.dimension.col / 2) * digsim.gridSize;
    var y = -0.25 * digsim.gridSize;

    if (this.type === digsim.SWITCH || this.type === digsim.CLOCK) {
        context.textAlign = 'right';
        x = -0.25 * digsim.gridSize;
        y = 0.5 * digsim.gridSize;
    }

    context.fillText(this.label, x, y);
    context.restore();
};

/******************************************************************************
 * DRAW WIRES
 *  Draws Component input and output wires
 * @param {CanvasRenderingContext2D} context    - Context to draw to.
 * @param {string}                   lineColor  - Color of the wire.
 * @param {number}                   wireLength - Length of the wires.
 *****************************************************************************/
Component.prototype.drawWires = function(context, lineColor, wireLength) {
    context.save();

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;

    // Set rotation and dimension back to a rotation at 0 for easy drawing
    var oldRot      = this.rotation;
    var oldDim      = this.dimension;
    this.rotation   = 0;
    this.dimension  = this.zeroDimension;

    var inputSpace  = this.getComponentInputSpace();
    var outputSpace = this.getComponentOutputSpace();
    var wireLength  = wireLength || 1;
    var space, i, x, y;

    // Draw input wires
    for (i = 0; i < inputSpace.length; i++) {
        space = inputSpace[i];
        x = (space.col - this.col + 0.5) * digsim.gridSize;
        y = (space.row - this.row + 0.5) * digsim.gridSize;

        context.moveTo(x, y);
        context.lineTo(x + digsim.gridSize * wireLength, y);
    }

    // Draw output wires
    for (i = 0; i < outputSpace.length; i++) {
        space = outputSpace[i];
        x = (space.col - this.col + 0.5) * digsim.gridSize;
        y = (space.row - this.row + 0.5) * digsim.gridSize;

        context.moveTo(x, y);
        context.lineTo(x - digsim.gridSize * wireLength, y);
    }

    // Reset rotation and dimension
    this.rotation = oldRot;
    this.dimension = oldDim;

    context.stroke();
    context.restore();
};

/******************************************************************************
 * PASS STATE
 *  Passes the state of the current Component to the next Component (be it a wire,
 *  gate, LED, etc).
 * @param {number} pState - State to pass to this Component.
 *****************************************************************************/
Component.prototype.passState = function(pState) {
    if (!this.isADriver())
        throw new Error("Cannot call function 'passState' on non-driver Component.");

    var compQueue = [];  // List of non-traversed Components
    var i, len, comp, outs, input, output;

    // Ensure that pState is an number and not anything else
    pState = pState ? 1 : 0;
    this.state = pState;

    // Add all output Components to the queue
    outs = this.outputs.get();
    for (i = 0, len = outs.length; i < len; ++i) {
        compQueue.push(outs[i]);
    }

    // Traverse the circuit path
    while (compQueue.length) {
        comp = compQueue[0];

        // Set state
        if (comp.isAGate()) {
            comp.computeLogic();
        }
        else {
            input = comp.inputs.get()[0];  // Component can only have 1 input

            // Special output for DFF
            if (input.namedConnections) {
                if (comp === input.namedConnections.Q)
                    comp.state = input.state.Q;
                else if (comp === input.namedConnections.Qnot)
                    comp.state = input.state.Qnot;
            }
            else {
                comp.state = input.state;
            }
        }

        // Prevent infinite loops in schematics
        if (digsim.passCounter >= digsim.maxSchematicLoop) {
            digsim.addMessage(digsim.ERROR, "ERROR: Schematic contains an infinite loop caused by an unstable state.");
            return;
        }
        digsim.passCounter++;

        // Add Component outputs to the queue if their state has changed
        outs = comp.outputs.get();
        for (i = 0, len = outs.length; i < len; i++) {
            output = outs[i];
            // Always add a gate to the queue to check if any of it's inputs have changed
            if (output.isAGate()) {
                compQueue.push(output);
            }
            // Special output for DFF
            else if (comp.namedConnections) {
                if (output === comp.namedConnections.Q && output.state !== comp.state.Q)
                    compQueue.push(output);
                else if (output === comp.namedConnections.Qnot && output.state !== comp.state.Qnot)
                    compQueue.push(output);
            }
            else if (output.state !== comp.state)
                compQueue.push(output);
        }

        // Remove the Component from the queue
        compQueue.shift();
    }
};

/******************************************************************************
 * TRAVERSE CONNECTIONS
 *  Called on a driver Component (Switch or Clock). Traverses the Component's
 *  connections arrays and sets any Wires connections to input and outputs. Called
 *  every time before SIM_MODE.
 * @return {boolean} True if the entire input chain was traversed without errors.
 *****************************************************************************/
Component.prototype.traverseConnections = function() {

    if (!this.isADriver())
        throw new Error("Cannot call function 'traverseConnections' on non-driver Component.");

    var traversedComps = new ComponentList();   // List of traversed Components
    var compQueue = [];                         // Array of non-traversed Components
    var i, len, comp, cons, con, outs, output, input;

    // Add all output Components to the queue and set their input to the driver
    outs = this.outputs.get();
    for (i = 0, len = outs.length; i < len; ++i) {
        compQueue.push(outs[i]);
        outs[i].inputs.add(this);
    }

    // Traverse the connection queue
    while (compQueue.length) {
        comp = compQueue[0];

        // Set outputs and inputs of a Wire
        if (comp.type === digsim.WIRE) {
            cons = comp.connections.get();
            input = comp.inputs.get()[0];   // Wire can only have 1 input

            for (i = 0, len = cons.length; i < len; i++) {
                con = cons[i];

                // Only add to output if the connection isn't the input Component or any output of the input Component
                if (con !== input && !input.outputs.contains(con)) {
                    comp.outputs.add(con);
                    con.inputs.add(comp);
                }
            }
        }
        // Error if we traverse into a driver
        else if (comp.isADriver()) {
            digsim.addMessage(digsim.ERROR, "[16]Error: Switches '" + this.label + "' and '" + comp.label + "' are driving one wire.");
            return false;
        }
        // Error if we traverse into the output of a gate
        else if (comp.isAGate()) {
            outs = comp.outputs.get();

            for (i = 0, len = outs.length; i < len; i++) {
                // If the output is also in the inputs we have an error
                if (comp.inputs.contains(outs[i])) {
                    digsim.addMessage(digsim.ERROR, "[17]Error: Switch '" + this.label + "' connected to the output of Gate '" + comp.label + ".");
                    return false;
                }

                comp.outputs.add(outs[i]);
                outs[i].inputs.add(comp);
            }
        }

        traversedComps.add(comp);

        // Add only non-traversed connections to the queue
        outs = comp.outputs.get();
        for (i = 0, len = outs.length; i < len; i++) {
            output = outs[i];

            if (!traversedComps.contains(output)) {
                compQueue.push(output);
            }
        }

        // Remove the Component from the queue
        compQueue.shift();
    }

    return true;
};