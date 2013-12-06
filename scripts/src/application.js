/*****************************************************************************
 * Program:
 *  application.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  A fully functional digital circuit simulation program.
 ****************************************************************************/

/*****************************************************************************
 * DIGSIM
 *  Holds all the constants, animation, and data variables for the program
 * @constructor
 ****************************************************************************/
function Digsim() {
    /* Constants */
    this.GRID_ZOOM         = 5;                     // Added or subtracted to gridSize when zooming
    this.MAX_GRID_SIZE     = 40;                    // Max zoom level
    this.MIN_GRID_SIZE     = 10;                    // Min zoom level
    this.HIT_RADIUS        = 0.733;                 // The size (as a percent) around a wire that will respond to a click
    this.NUM_COLS          = 200;                   // Number of columns in the application
    this.NUM_ROWS          = 200;                   // Number of rows in the application

    // Type identifiers
    this.AND               = 1;
    this.NAND              = 2;
    this.OR                = 3;
    this.NOR               = 4;
    this.XOR               = 5;
    this.NOT               = 6;
    this.DFF               = 7;
    this.JKFF              = 8;
    this.MUX               = 9;
    this.PROM              = 10;
    this.CLOCK             = 11;
    this.WIRE              = 12;
    this.SWITCH            = 13;
    this.LED               = 14;
    this.ASCIIDISPLAY      = 15;

    this.DEFAULT_MODE      = 0;                     // Default application mode
    this.WIRE_MODE         = 1;                     // Placing wires
    this.SIM_MODE          = 2;                     // Simulation
    this.PLACE_MODE        = 3;                     // Placing Components
    this.EDIT_MODE         = 4;                     // Editing Component properties

    this.WARNING           = 0;                     // Orange(ish) warning messages - simulation will still run
    this.ERROR             = 1;                     // Red error messages - will not simulate

    this.TL                = 0;                     // Top, bottom, left, right selection of wires in grids
    this.TR                = 1;
    this.BR                = 2;
    this.BL                = 3;

    /* Animation variables */
    this.dragging          = false;                 // Know when a component is being dragged
    this.clkCnt            = 0;                     // Will count to digsim.CLK_FREQ before it resets and changes states
    this.rotation          = 0;                     // Rotation of the currently selected Component (in degrees)
    /* Grid variables */
    this.gridSize          = 20;                    // The size (in pixels) of a grid square
    this.gridWidth         = window.innerWidth - $('.canvases').position().left;
    this.gridHeight        = window.innerHeight - $('.canvases').position().top;
    this.mousePos          = { x: -1, y: -1 };      // Current position of the mouse on the Canvas
    this.dragStart         = {'row': 0, 'col': 0};  // Keep track of the row/col of a click to know when we should drag
    this.dragOffset        = {'row': 0, 'col': 0};  // Keep track of how far from the top-left corner the a click is for dragging
    this.wireStart         = {'row': 0, 'col': 0};  // Keep track of where a wire starts for wire placement
    this.gridToggle        = 0;                     // Toggles the grid (tri-state)

    // Gate identifier
    this.iComp             = 0;                     // Gives each component a unique identifier
    this.numGateInputs     = 2;                     // Number of inputs - attached to the user interface selection

    // Misc
    this.clipboard         = undefined;             // Used for cut/copy/paste
    this.selectedComponent = undefined;             // The currently selected Component
    this.mode              = 0;                     // The current mode
    this.connectionStarts  = {};                    // Absolute row/col of a connection for wire routing
    this.connectionTargets = {};                    // Relative row/col of the Component for wire routing
    this.maxSchematicLoop  = 0;                     // Prevent infinite loops (such as NOT gate looped back on itself)
    this.passCounter       = 0;                     // Counter used to prevent infinite loops
    this.endRoute          = false;                 // Know when to stop wire routing
    this.mouseDown         = false;                 // Know if the mouse is currently held down for dragging
    this.readFile          = false;                 // Know when a file was opened to read it's contents from the iframe

    // Data arrays
    this.components        = new ComponentList();   // Holds all placed Components
    this.drivers           = [];                    // Holds the id of the logic drivers
    this.placeholders      = [];                    // Holds Component positions on grid
    for (var i = 0; i < this.NUM_COLS; ++i) {
        this.placeholders[i] = [];                  // Set placeholder to a 2D array
    }

    // Key codes and hot keys
    this.KEY_CODES          = {                     // Key code to button HTML ID dictionary.
        27    : 'esc',                              // 's' and 'c' refer to a 'shift' and 'ctrl' respectively.
        's65' : 'NAND',
        's82' : 'NOR',
        65    : 'AND',
        69    : 'LED',
        84    : 'NOT',
        82    : 'OR',
        83    : 'Switch',
        85    : 'Run',
        87    : 'Wire',
        88    : 'XOR',
        71    : 'Toggle_Grid',
        90    : 'Zoom_In',
        's90' : 'Zoom_Out',
        46    : 'Delete',
        8     : 'Delete',
        'c88' : 'Cut',
        'c67' : 'Copy',
        'c86' : 'Paste',
        50    : '2-input',
        51    : '3-input',
        52    : '4-input',
        67    : 'Clock',
        9     : 'Rotate_CW',
        's9'  : 'Rotate_CCW',
        68    : 'DFF',
        77    : 'MUX'

    };
    this.HOT_KEYS           = {                     // The hot key text to show for each button (by button HTML ID)
        'AND'         : 'A',
        'OR'          : 'R',
        'NOT'         : 'T',
        'NAND'        : 'shift+A',
        'NOR'         : 'shift+R',
        'XOR'         : 'X',
        'Switch'      : 'S',
        'LED'         : 'E',
        'Wire'        : 'W',
        'Run'         : 'U',
        'Toggle_Grid' : 'G',
        'Zoom_In'     : 'Z',
        'Zoom_Out'    : 'shift+Z',
        'Delete'      : 'del',
        'Cut'         : 'ctrl+X',
        'Copy'        : 'ctrl+C',
        'Paste'       : 'ctrl+V',
        '2-input'     : '2',
        '3-input'     : '3',
        '4-input'     : '4',
        'Clock'       : 'C',
        'Rotate_CW'   : 'Tab',
        'Rotate_CCW'  : 'shift+Tab',
        'DFF'         : 'D',
        'MUX'         : 'M'
    };
}

/*****************************************************************************
 * INIT
 *  Tests to see if the canvas is supported, returning true if it is.
 ****************************************************************************/
Digsim.prototype.init = function() {
    // Get the canvas element
    this.gridCanvas              = document.getElementById('grid');
    this.staticCanvas            = document.getElementById('static');
    this.movingCanvas            = document.getElementById('moving');

    // Test to see if canvas is supported
    if (this.gridCanvas.getContext) {

        // Canvas variables
        var canvasWidth          = this.gridSize * this.NUM_COLS;
        var canvasHeight         = this.gridSize * this.NUM_ROWS;

        this.gridContext         = this.gridCanvas.getContext('2d');
        this.staticContext       = this.staticCanvas.getContext('2d');
        this.movingContext       = this.movingCanvas.getContext('2d');

        this.gridCanvas.width    = canvasWidth;
        this.gridCanvas.height   = canvasHeight;
        this.staticCanvas.width  = canvasWidth;
        this.staticCanvas.height = canvasHeight;
        this.movingCanvas.width  = canvasWidth;
        this.movingCanvas.height = canvasHeight;

        $('.canvases').width(this.gridWidth-2);
        $('.canvases').height(this.gridHeight-2);

        return true;
    }

    return false;
};

/*****************************************************************************
 * RUN
 *  Runs the application on window.onload.
 ****************************************************************************/
Digsim.prototype.run = function() {
    if(this.init()) {
        // Assign functions to events
        $("canvas"       ).on( "mousedown",              this.onMouseDown);
        $("canvas"       ).on( "mouseup",                this.onMouseUp);
        $("canvas"       ).on( "click",                  this.onClick);
        $("canvas"       ).on( "dblclick",               this.onDoubleClick);
        $("canvas"       ).on( "mousemove",              this.onMouseMove);
        $("canvas"       ).on( "mouseout",               function() { digsim.mouseDown = false; });
        $("canvas"       ).on( "touchstart",             this.onMouseDown);
        $("canvas"       ).on( "touchmove",              this.onMouseMove);
        $("canvas"       ).on( "touchend",               this.onMouseUp);
        $("#New"         ).on( "click",                  this.newFile);
        $('#Save'        ).on( "click",                  this.saveFile);
        $('#uploadFile'  ).on( "change",                 this.submitFile);
        $('#fileContents').on( "load",                   this.readFileContents);
        $("#Toggle_Grid" ).on( "click",                  this.toggleGrid);
        $("#Zoom_In"     ).on( "click", {dir:  1},       this.zoom);
        $("#Zoom_Out"    ).on( "click", {dir: -1},       this.zoom);
        $('#Delete'      ).on( "click",                  this.delete);
        $('#Rotate_CCW'  ).on( "click", {dir: 270},      this.rotate);
        $('#Rotate_CW'   ).on( "click", {dir: 90},       this.rotate);
        $('#Cut'         ).on( "click",                  this.cut);
        $('#Copy'        ).on( "click",                  this.copy);
        $('#Paste'       ).on( "click",                  this.paste);
        $(".gates > ul a, .io a, .modes a").on("click",  this.onButtonClicked);
        $('#2-input, #3-input, #4-input').on("click",    this.changeNumInputs);

        // Component menu events
        $('.component-menu').draggable();
        $('#component-save').on(  "click",               this.onSaveComponentEdit);
        $('#component-cancel').on("click",               this.hideComponentMenu);

        // Set hotkey info on buttons
        var curr, hotkey;
        $("li a").each(function() {
            curr = $(this);
            hotkey = digsim.HOT_KEYS[curr.attr('id')];
            if (hotkey) {
                curr.attr('title', curr.attr('title') + " (" + hotkey + ")");
            }
        });

        // Disable buttons on start
        this.disableButton("Submit");
        this.disableButton("Empty");
        this.disableButton("Paste");
        this.disableControlButtons();

        this.drawGrid(this.gridContext);
        $('.messages').css('height', this.gridHeight - 37);
    }
};

/*****************************************************************************
 * CLEAR CANVAS
 *  Clears the given canvas.
 * @param {CanvasRenderingContext2D} context    - Context to clear.
 * @param {boolean}                  clearDirty - Clear only the parts that have changed.
 ****************************************************************************/
Digsim.prototype.clearCanvas = function(context, clearDirty) {
    context.save();

    // Use the identity matrix while clearing the canvas
    context.setTransform(1, 0, 0, 1, 0, 0);
    if (clearDirty) {
        var mousePos = digsim.getMousePos();
        var max = Math.max(this.gridWidth, this.gridHeight);
        var half = max / 2 | 0;

        context.clearRect(mousePos.x - half, mousePos.y - half, max, max);
    }
    else {
        context.clearRect(0, 0, context.canvas.width, context.canvas.width);
    }

    context.restore();
};

/*****************************************************************************
 * DRAW GRID
 *  Draws the underlying blue grid on the gridContext.
 ****************************************************************************/
Digsim.prototype.drawGrid = function() {
    // clear the canvas
    var context = this.gridContext;
    this.clearCanvas(context);

  var row, col;

    // Grid grid
    if (this.gridToggle % 3 === 0) {
        context.strokeStyle = '#8DCFF4';
        context.lineWidth = 1;
        context.save();
        context.translate(0.5, 0.5);
        context.beginPath();

        // Draw the columns
        for (col = 1; col < this.NUM_COLS; col++) {
            context.moveTo(col * this.gridSize, 0);
            context.lineTo(col * this.gridSize, this.NUM_COLS * this.gridSize);
        }
        // Draw the rows
        for (row = 1; row < this.NUM_ROWS; row++) {
            context.moveTo(0, row * this.gridSize);
            context.lineTo(this.NUM_ROWS * this.gridSize, row * this.gridSize);
        }
        context.stroke();
        context.restore();
    }

    // Dotted Grid
    else if (this.gridToggle % 3 === 1) {
        context.fillStyle = '#0d91db';
        context.lineWidth = 1;
        context.save();
        context.translate(digsim.gridSize / 2 - 0.5,digsim.gridSize / 2 - 0.5);
        context.beginPath();

        for (col = 0; col < this.NUM_COLS; ++col) {
            for (row = 0; row < this.NUM_ROWS; ++row) {
                context.fillRect(col * digsim.gridSize, row * digsim.gridSize, 1.5, 1.5);
            }
        }
        context.stroke();
        context.restore();
    }
};

/**************************************************************************************************************
 *      /$$$$$$                                                                              /$$
 *     /$$__  $$                                                                            | $$
 *    | $$  \__/  /$$$$$$  /$$$$$$/$$$$   /$$$$$$   /$$$$$$  /$$$$$$$   /$$$$$$  /$$$$$$$  /$$$$$$    /$$$$$$$
 *    | $$       /$$__  $$| $$_  $$_  $$ /$$__  $$ /$$__  $$| $$__  $$ /$$__  $$| $$__  $$|_  $$_/   /$$_____/
 *    | $$      | $$  \ $$| $$ \ $$ \ $$| $$  \ $$| $$  \ $$| $$  \ $$| $$$$$$$$| $$  \ $$  | $$    |  $$$$$$
 *    | $$    $$| $$  | $$| $$ | $$ | $$| $$  | $$| $$  | $$| $$  | $$| $$_____/| $$  | $$  | $$ /$$ \____  $$
 *    |  $$$$$$/|  $$$$$$/| $$ | $$ | $$| $$$$$$$/|  $$$$$$/| $$  | $$|  $$$$$$$| $$  | $$  |  $$$$/ /$$$$$$$/
 *     \______/  \______/ |__/ |__/ |__/| $$____/  \______/ |__/  |__/ \_______/|__/  |__/   \___/  |_______/
 *                                      | $$
 *                                      | $$
 *                                      |__/
 *                               /$$
 *                              | $$
 *      /$$$$$$  /$$$$$$$   /$$$$$$$
 *     |____  $$| $$__  $$ /$$__  $$
 *      /$$$$$$$| $$  \ $$| $$  | $$
 *     /$$__  $$| $$  | $$| $$  | $$
 *    |  $$$$$$$| $$  | $$|  $$$$$$$
 *     \_______/|__/  |__/ \_______/
 *
 *
 *
 *     /$$$$$$$  /$$                               /$$                 /$$       /$$
 *    | $$__  $$| $$                              | $$                | $$      | $$
 *    | $$  \ $$| $$  /$$$$$$   /$$$$$$$  /$$$$$$ | $$$$$$$   /$$$$$$ | $$  /$$$$$$$  /$$$$$$   /$$$$$$   /$$$$$$$
 *    | $$$$$$$/| $$ |____  $$ /$$_____/ /$$__  $$| $$__  $$ /$$__  $$| $$ /$$__  $$ /$$__  $$ /$$__  $$ /$$_____/
 *    | $$____/ | $$  /$$$$$$$| $$      | $$$$$$$$| $$  \ $$| $$  \ $$| $$| $$  | $$| $$$$$$$$| $$  \__/|  $$$$$$
 *    | $$      | $$ /$$__  $$| $$      | $$_____/| $$  | $$| $$  | $$| $$| $$  | $$| $$_____/| $$       \____  $$
 *    | $$      | $$|  $$$$$$$|  $$$$$$$|  $$$$$$$| $$  | $$|  $$$$$$/| $$|  $$$$$$$|  $$$$$$$| $$       /$$$$$$$/
 *    |__/      |__/ \_______/ \_______/ \_______/|__/  |__/ \______/ |__/ \_______/ \_______/|__/      |_______/
 *
 *
 *
 *****************************************************************************************************************/

/*****************************************************************************
 * DRAW ALL COMPONENTS
 *  Draw all the components on the static canvas.
 ****************************************************************************/
Digsim.prototype.drawAllComponents = function() {
    this.clearCanvas(this.staticContext);

    var comps = this.components.get();
    for (var i = 0, len = comps.length; i < len; i++) {
        var component = comps[i];

        if (component.drawStatic)
            component.draw(this.staticContext);
    }

};

/*****************************************************************************
 * DRAW COMPONENT
 *  Draw a component to a context.
 * @param {Component}                comp    - Component to draw.
 * @param {CanvasRenderingContext2D} context - Context to draw on.
 * @param {string}                   color   - Color to use to draw the object @default 'black'.
 ****************************************************************************/
Digsim.prototype.drawComponent = function(comp, context, color) {
    if (!context)
        throw new Error("Must call function 'drawComponent' with a context.");

    comp.draw(context, color);
};

/*****************************************************************************
 * GET COMPONENT
 *  Return the Component at the mouse position.
 * @return {Component}
 ****************************************************************************/
Digsim.prototype.getComponent = function() {
    var ph = digsim.placeholders[digsim.getMouseRow()][digsim.getMouseCol()];
    var index, comp;

    // Get the Component
    if (ph instanceof Array) {
        index = digsim.getWireIndex();
        if (index != -1 && ph[index])
            comp = digsim.components.getComponent(ph[index].ref);
    }
    else if (ph) {
        comp = digsim.components.getComponent(ph.ref);
    }

    return comp;
};

/*****************************************************************************
 * DELETE COMPONENT
 *  Remove a component from the components array, delete it from all of its
 *  connections, then delete its placeholders.
 * @param {Component} comp - Component to delete.
 ****************************************************************************/
Digsim.prototype.deleteComponent = function(comp) {
    // If it's a driver, remove it from the drivers array
    if (comp.type === this.SWITCH || comp.type === this.CLOCK) {
        this.drivers.splice(this.drivers.indexOf(comp.id), 1);
    }
    this.disableControlButtons();
    this.components.remove(comp, false);
    comp.deleteConnections();
    this.deletePlaceholder(comp);
};

/*****************************************************************************
 * SET PLACEHOLDERS
 *  Add component to the placeholders array with a unique identifier.
 * @param {Component} comp    - Component to create placeholders.
 * @param {boolean}   nocheck - Set to true to skip collision detection.
 * @return {boolean} True if all placeholders were successfully placed.
 ****************************************************************************/
Digsim.prototype.setPlaceholders = function(comp, nocheck) {
    var space = comp.getComponentSpace();
    var i, ph;

    // Check the component space for collision
    if (!nocheck) {
        for (i = 0; i < space.length; i++) {
            if (typeof space[i].index !== 'undefined') {
                // If grid space is not an array and already contains a placeholder
                if (!(this.placeholders[space[i].row][space[i].col] instanceof Array) &&
                    this.placeholders[space[i].row][space[i].col]) {
                    digsim.addMessage(digsim.WARNING, "[1]Collision detected! Unable to place component.");
                    return false;
                }
                // If grid space is an array and already contains a placeholder
                else if ((this.placeholders[space[i].row][space[i].col] instanceof Array) &&
                        this.placeholders[space[i].row][space[i].col][space[i].index]) {
                    digsim.addMessage(digsim.WARNING, "[2]Collision detected! Unable to place component.");
                    return false;
                }
            }
            else {
                // If gird space already contains a placeholder
                if (this.placeholders[space[i].row][space[i].col]) {
                    digsim.addMessage(digsim.WARNING, "[3]Collision detected! Unable to place component. ");
                    return false;
                }
            }
        }
    }

    // Set the placeholders
    for (i = 0; i < space.length; i++) {
        /*****************************************************************************
         * Placeholder
         * @param {number}  ref         - Unique id of the component whose placeholder this is.
         * @param {boolean} connectable - If the placeholder can be used for determining connections.
         * @param {number}  name        - Name of the connection (DFF)
         ****************************************************************************/
        ph = {
            'ref'         : comp.id,
            'connectable' : space[i].con,
            'name'        : space[i].name
        };

        if (typeof space[i].index !== 'undefined') {
            // If it's not a 3D array, make it a 3D array
            if (!(this.placeholders[space[i].row][space[i].col] instanceof Array)) {
                this.placeholders[space[i].row][space[i].col] = [];
            }
            this.placeholders[space[i].row][space[i].col][space[i].index] = ph;
        }
        else {
            this.placeholders[space[i].row][space[i].col] = ph;
        }

    }

    return true;
};

/*****************************************************************************
 * DELETE PLACEHOLDER
 *  Delete component placeholders
 * @param {Component} comp - Component whose placeholders to delete.
 ****************************************************************************/
Digsim.prototype.deletePlaceholder = function(comp) {

    var spaces = comp.getComponentSpace();
    var space;

    for (var i = 0; i < spaces.length; i++) {
        space = spaces[i];

        // Delete an array index
        if (typeof space.index !== 'undefined') {
            delete this.placeholders[space.row][space.col][space.index];

            // Delete empty placeholder arrays
            if (Object.keys(this.placeholders[space.row][space.col] || {}).length === 0)
                delete this.placeholders[space.row][space.col];
        }
        else {
            delete this.placeholders[space.row][space.col];
        }
    }

    // Visually remove the component from static canvas.
    this.drawAllComponents();
};


/**************************************************************************************************************
 *     /$$$$$$$                      /$$
 *    | $$__  $$                    |__/
 *    | $$  \ $$  /$$$$$$   /$$$$$$$ /$$ /$$$$$$$$  /$$$$$$
 *    | $$$$$$$/ /$$__  $$ /$$_____/| $$|____ /$$/ /$$__  $$
 *    | $$__  $$| $$$$$$$$|  $$$$$$ | $$   /$$$$/ | $$$$$$$$
 *    | $$  \ $$| $$_____/ \____  $$| $$  /$$__/  | $$_____/
 *    | $$  | $$|  $$$$$$$ /$$$$$$$/| $$ /$$$$$$$$|  $$$$$$$
 *    |__/  |__/ \_______/|_______/ |__/|________/ \_______/
 *
 *
 *
 *     /$$$$$$$$                                  /$$
 *    | $$_____/                                 | $$
 *    | $$       /$$    /$$  /$$$$$$  /$$$$$$$  /$$$$$$
 *    | $$$$$   |  $$  /$$/ /$$__  $$| $$__  $$|_  $$_/
 *    | $$__/    \  $$/$$/ | $$$$$$$$| $$  \ $$  | $$
 *    | $$        \  $$$/  | $$_____/| $$  | $$  | $$ /$$
 *    | $$$$$$$$   \  $/   |  $$$$$$$| $$  | $$  |  $$$$/
 *    |________/    \_/     \_______/|__/  |__/   \___/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * WINDOW RESIZE
 *  Change the width and height of the canvas to match the browser size.
 ****************************************************************************/
$(window).resize(function() {
    // Resize grid width and height
    digsim.gridWidth = window.innerWidth - $('.canvases').position().left;
    digsim.gridHeight = window.innerHeight - $('.canvases').position().top;

    digsim.drawGrid(digsim.gridContext);
    digsim.drawAllComponents();

    // Resize GUI elements
    $('.canvases').width(digsim.gridWidth-2).height(digsim.gridHeight-2);
    $('.messages').css('height', digsim.gridHeight - 37);
});

/**************************************************************************************************************
 *     /$$   /$$                     /$$                                           /$$
 *    | $$  /$$/                    | $$                                          | $$
 *    | $$ /$$/   /$$$$$$  /$$   /$$| $$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$$
 *    | $$$$$/   /$$__  $$| $$  | $$| $$__  $$ /$$__  $$ |____  $$ /$$__  $$ /$$__  $$
 *    | $$  $$  | $$$$$$$$| $$  | $$| $$  \ $$| $$  \ $$  /$$$$$$$| $$  \__/| $$  | $$
 *    | $$\  $$ | $$_____/| $$  | $$| $$  | $$| $$  | $$ /$$__  $$| $$      | $$  | $$
 *    | $$ \  $$|  $$$$$$$|  $$$$$$$| $$$$$$$/|  $$$$$$/|  $$$$$$$| $$      |  $$$$$$$
 *    |__/  \__/ \_______/ \____  $$|_______/  \______/  \_______/|__/       \_______/
 *                         /$$  | $$
 *                        |  $$$$$$/
 *                         \______/
 *     /$$$$$$$$                                  /$$
 *    | $$_____/                                 | $$
 *    | $$       /$$    /$$  /$$$$$$  /$$$$$$$  /$$$$$$
 *    | $$$$$   |  $$  /$$/ /$$__  $$| $$__  $$|_  $$_/
 *    | $$__/    \  $$/$$/ | $$$$$$$$| $$  \ $$  | $$
 *    | $$        \  $$$/  | $$_____/| $$  | $$  | $$ /$$
 *    | $$$$$$$$   \  $/   |  $$$$$$$| $$  | $$  |  $$$$/
 *    |________/    \_/     \_______/|__/  |__/   \___/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * KEY EVENTS
 *  Activate a button based on keyCode dictionary.
 * @param {Event} event - Key down event.
 ****************************************************************************/
document.onkeydown = function(event) {
    // Get which key was pressed.
    var keyCode = (event.keyCode ? event.keyCode : event.charCode); // Firefox and Opera use charCode instead of keyCode
    var id;

    // Don't enable hot keys if the edit menu is open
    if (digsim.mode !== digsim.EDIT_MODE) {

        // Prevent tabbing of buttons
        if (keyCode === 9) {
            event.preventDefault();
        }

        // Make the delete key on MAC delete a Component
        if (keyCode === 8) {
            keyCode = 46; // Switch the keyCode to the delete button
            event.preventDefault();
        }

        // Enter key opens the edit menu if a Component is selected
        if (keyCode === 13 && digsim.selectedComponent && digsim.selectedComponent.type !== digsim.WIRE) {
            digsim.showComponentMenu();
        }

        // Don't do anything when MAC user refreshes (shift+R is the hot key for NOR gate)
        if (!(keyCode === 82 && event.metaKey)) {

            // Add the 's' for shift key combinations
            if(event.shiftKey) {
                id = digsim.KEY_CODES['s'+keyCode];
            }
            // Add the 'c' for ctrl key combinations
            else if (event.ctrlKey) {
                id = digsim.KEY_CODES['c'+keyCode];
            }
            else {
                id = digsim.KEY_CODES[keyCode];
            }

            // Esc key
            if (id === 'esc') {
                digsim.deactivateButtons();
            }
            else if (id) {
                // Only click active buttons
                if(!$('#'+id).hasClass('disabled')) {
                    $("#" + id).click();
                }
            }
        }
    }
    else {
        // Esc key closes menu
        if (keyCode === 27) {
            digsim.hideComponentMenu();
        }
        // Enter key saves edit as long as there is focus on an input box
        if (keyCode === 13 && $('.component-menu input').is(":focus")) {
            digsim.onSaveComponentEdit();
        }
    }
};

/**************************************************************************************************************
 *     /$$      /$$
 *    | $$$    /$$$
 *    | $$$$  /$$$$  /$$$$$$  /$$   /$$  /$$$$$$$  /$$$$$$
 *    | $$ $$/$$ $$ /$$__  $$| $$  | $$ /$$_____/ /$$__  $$
 *    | $$  $$$| $$| $$  \ $$| $$  | $$|  $$$$$$ | $$$$$$$$
 *    | $$\  $ | $$| $$  | $$| $$  | $$ \____  $$| $$_____/
 *    | $$ \/  | $$|  $$$$$$/|  $$$$$$/ /$$$$$$$/|  $$$$$$$
 *    |__/     |__/ \______/  \______/ |_______/  \_______/
 *
 *
 *
 *     /$$$$$$$$                                  /$$
 *    | $$_____/                                 | $$
 *    | $$       /$$    /$$  /$$$$$$  /$$$$$$$  /$$$$$$    /$$$$$$$
 *    | $$$$$   |  $$  /$$/ /$$__  $$| $$__  $$|_  $$_/   /$$_____/
 *    | $$__/    \  $$/$$/ | $$$$$$$$| $$  \ $$  | $$    |  $$$$$$
 *    | $$        \  $$$/  | $$_____/| $$  | $$  | $$ /$$ \____  $$
 *    | $$$$$$$$   \  $/   |  $$$$$$$| $$  | $$  |  $$$$/ /$$$$$$$/
 *    |________/    \_/     \_______/|__/  |__/   \___/  |_______/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * ON MOUSE MOVE
 *  Set the mouse position and change the cursor based on the mode. Also detects
 *  when a Component is being moved.
 * @param {Event} event - Mouse move event.
 ****************************************************************************/
Digsim.prototype.onMouseMove = function(event) {
    var mouseX = event.offsetX || event.layerX || event.clientX - $(".canvases").position().left;
    var mouseY = event.offsetY || event.layerY || event.clientY - $(".canvases").position().top;
    digsim.mousePos = { x: mouseX, y: mouseY };

    var comp = digsim.getComponent();

    // Show movable Components
    if (digsim.mode === digsim.DEFAULT_MODE && comp && !digsim.dragging) {
        if (comp.type === digsim.WIRE) {
            if (comp.dx)
                $("canvas").css('cursor','row-resize');
            else
                $("canvas").css('cursor','col-resize');
        }
        else
            $("canvas").css('cursor','move');
    }
    else if (digsim.mode === digsim.EDIT_MODE) {
        $("canvas").css('cursor','default');
    }
    // Show clickable Components
    else if (digsim.mode === digsim.SIM_MODE && comp && comp.type === digsim.SWITCH) {
        $("canvas").css('cursor','pointer');
    }
    else if (digsim.mode === digsim.WIRE_MODE) {
        $("canvas").css('cursor','crosshair');
    }
    // Don't change the last cursor if dragging
    else if (!digsim.dragging) {
        $("canvas").css('cursor','default');
    }

    // Set dragging if the selectedComponent has moved
    if ( digsim.mouseDown && digsim.selectedComponent && !digsim.dragging &&
        (digsim.getMouseRow() !== digsim.dragStart.row ||
         digsim.getMouseCol() !== digsim.dragStart.col) ) {
        digsim.dragging = true;
        digsim.prepDragging();
        animate();
    }
};

/*****************************************************************************
 * ON MOUSE DOWN
 *  Select a Component.
 * @param {Event} event - Mouse down event.
 ****************************************************************************/
Digsim.prototype.onMouseDown = function(event) {
    event.preventDefault();
    digsim.mouseDown = true;

    // Only handle left click events in DEFAULT_MODE
    if (event.button !== 0 || digsim.mode !== digsim.DEFAULT_MODE) {
        return;
    }

    // If there is a dragging Component we need to place it instead of move it
    // This only happens when the user moves the mouse off the canvas while still holding down the mouse button and releases
    if (digsim.dragging) {
        $("canvas").mouseup();
        return;
    }

    // Redraw Components if there is already a selected Component
    if (digsim.selectedComponent)
        digsim.drawAllComponents();

    // Select a Component
    var comp = digsim.getComponent();
    if (comp) {
        digsim.selectedComponent = comp;
        digsim.dragStart = {'row': digsim.getMouseRow(), 'col': digsim.getMouseCol()};
        digsim.dragOffset = {'row': digsim.getMouseRow() - comp.row, 'col': digsim.getMouseCol() - comp.col};
        digsim.drawComponent(comp, digsim.staticContext, 'red');

        // Show Control options
        if (comp.type !== digsim.WIRE) {
            digsim.enableButton('Cut');
            digsim.enableButton('Copy');
            digsim.enableButton('Delete');
            digsim.enableButton('Rotate_CCW');
            digsim.enableButton('Rotate_CW');
        }
        else {
            digsim.disableButton('Cut');
            digsim.disableButton('Copy');
            digsim.disableButton('Rotate_CCW');
            digsim.disableButton('Rotate_CW');
            digsim.enableButton('Delete');
        }
    }
    // Empty square
    else {
        digsim.dragStart = {'row': 0, 'col': 0};
        digsim.dragOffset = {'row': 0, 'col': 0};
        digsim.dragging = false;
        digsim.disableControlButtons();
    }
};

/*****************************************************************************
 * ON MOUSE UP
 *  Place a dragging Component.
 * @param {Event} event - Mouse up event.
 ****************************************************************************/
Digsim.prototype.onMouseUp = function(event) {
    event.preventDefault();
    digsim.mouseDown = false;

    // Only handle left click events in DEFAULT_MODE or PLACE_MODE
    if (event.button !== 0 || digsim.mode === digsim.WIRE_MODE || digsim.mode === digsim.SIM_MODE ||
        digsim.mode === digsim.EDIT_MODE || !digsim.dragging) {
        return;
    }

    var comp = digsim.selectedComponent;
    var validPlacement = digsim.setPlaceholders(comp);
    var Class;

    // Place a dragging Component
    if (digsim.mode === digsim.DEFAULT_MODE && validPlacement) {
        digsim.dragging = false;
        comp.drawStatic = true;
        digsim.clearCanvas(digsim.movingContext);

        // Keep Components connected by creating wires between them
        var start, target, path, connectedComp;
        for (var i in digsim.connectionStarts) {
            connectedComp = digsim.components.getComponent(i);
            start = digsim.connectionStarts[i];
            target = digsim.connectionTargets[i];

            target = {'r': comp.row + target.r, 'c': comp.col + target.c};

            // Update an existing Wire
            if (start.r >= 0 && target.r >= 0 && connectedComp && connectedComp.type === digsim.WIRE) {
                digsim.route(start, target, false, connectedComp);

                // Wire was merged out
                if (connectedComp.path.x === 0 && connectedComp.path.y === 0) {
                    digsim.components.remove(connectedComp);
                }
                else {
                    connectedComp.drawStatic = true;
                    connectedComp.deleteConnections();
                    connectedComp.checkConnections();
                }
            }
            // Create a new Wire
            else if (start.r >= 0 && target.r >= 0) {
                digsim.route(start, target);

                connectedComp.deleteConnections();
                connectedComp.checkConnections();
            }
        }

        digsim.connectionStarts = {};
        digsim.connectionTargets = {};

        comp.deleteConnections();
        comp.checkConnections();
        digsim.drawAllComponents();
        digsim.drawComponent(comp, digsim.staticContext, 'red');
    }
    // Place a new Component
    else if (digsim.mode === digsim.PLACE_MODE && validPlacement) {
        // Keep track of all drivers
        if (comp.isADriver()) {
            digsim.drivers.push(comp.id);
        }

        // Place the Component
        digsim.clearCanvas(digsim.movingContext);
        digsim.components.add(comp);
        digsim.iComp++;
        comp.checkConnections();
        digsim.drawComponent(comp, digsim.staticContext);

        // Button is active so create another Component to place
        if($('.gates > ul a').hasClass('active') || $('.io a').hasClass('active')) {
            // JavaScript Reflection
            Class = window[comp.name];
            comp = new Class(digsim.numGateInputs);
            comp.init(digsim.selectedComponent.row, digsim.selectedComponent.col, digsim.rotation, digsim.iComp);

            digsim.dragging = true;
            digsim.selectedComponent = comp;
            digsim.drawComponent(digsim.selectedComponent, digsim.movingContext);
            animate();
        }
        else {
            digsim.dragging = false;
            digsim.mode = digsim.DEFAULT_MODE;
            digsim.disableControlButtons();
        }
    }
};

/*****************************************************************************
 * ON GRID CLICK
 *  Place wires in WIRE_MODE, change states of Switches in SIM_MODE, and close
 *  the Component edit menu in EDIT_MODE.
 * @param {Event} event - Mouse click event.
 ****************************************************************************/
Digsim.prototype.onClick = function(event) {
    event.preventDefault();
    digsim.mouseDown = false;

    // Only handle left click events in WIRE_MODE, SIM_MODE, or EDIT_MODE
    if (event.button !== 0 || digsim.mode === digsim.DEFAULT_MODE || digsim.mode === digsim.PLACE_MODE) {
        return;
    }

    var row = digsim.getMouseRow();
    var col = digsim.getMouseCol();
    var comp, start, target;

    // Close the edit menu
    if (digsim.mode === digsim.EDIT_MODE) {
        digsim.hideComponentMenu();
    }
    // Place a wire
    else if (digsim.mode === digsim.WIRE_MODE) {

        // Start the placement of a Wire
        if (!digsim.dragging) {
            // Prevent wires from starting on top of placeholders
            if (!(typeof digsim.placeholders[row][col] === 'undefined' || digsim.placeholders[row][col] instanceof Array) ||
                Object.keys(digsim.placeholders[row][col] || {}).length === 4) {
                return;
            }

            digsim.dragging = true;
            digsim.wireStart.col = col + 0.5;
            digsim.wireStart.row = row + 0.5;
            animateWire();
        }
        // End the placement of a Wire
        else {
            start  = {'r': Math.floor(digsim.wireStart.row), 'c': Math.floor(digsim.wireStart.col)};
            target = {'r': row, 'c': col};

            digsim.route(start, target);
            digsim.clearCanvas(digsim.movingContext);
        }
    }
    // Change the state of a Switch
    else if (digsim.mode === digsim.SIM_MODE) {
        comp = digsim.getComponent();

        if (comp && comp.type === digsim.SWITCH) {
            digsim.passCounter = 0;
            comp.passState(!comp.state);
            digsim.drawAllComponents();
        }
    }
};

/*****************************************************************************
 * ON GRID DOUBLE CLICK
 *  Open the component edit menu if a component is selected.
 * @param {Event} event - Mouse dblclick event.
 ****************************************************************************/
Digsim.prototype.onDoubleClick = function(event) {
    event.preventDefault();
    digsim.mouseDown = false;

    // Only handle left click events in DEFAULT_MODE
    if (event.button !== 0 || digsim.mode !== digsim.DEFAULT_MODE) {
        return;
    }

    var comp = digsim.getComponent();

    if (comp && digsim.selectedComponent == comp && comp.type !== digsim.WIRE) {
        digsim.showComponentMenu();
    }
};

/**************************************************************************************************************
 *     /$$$$$$$              /$$       /$$
 *    | $$__  $$            | $$      | $$
 *    | $$  \ $$ /$$   /$$ /$$$$$$   /$$$$$$    /$$$$$$  /$$$$$$$
 *    | $$$$$$$ | $$  | $$|_  $$_/  |_  $$_/   /$$__  $$| $$__  $$
 *    | $$__  $$| $$  | $$  | $$      | $$    | $$  \ $$| $$  \ $$
 *    | $$  \ $$| $$  | $$  | $$ /$$  | $$ /$$| $$  | $$| $$  | $$
 *    | $$$$$$$/|  $$$$$$/  |  $$$$/  |  $$$$/|  $$$$$$/| $$  | $$
 *    |_______/  \______/    \___/     \___/   \______/ |__/  |__/
 *
 *
 *
 *     /$$$$$$$$                                  /$$
 *    | $$_____/                                 | $$
 *    | $$       /$$    /$$  /$$$$$$  /$$$$$$$  /$$$$$$    /$$$$$$$
 *    | $$$$$   |  $$  /$$/ /$$__  $$| $$__  $$|_  $$_/   /$$_____/
 *    | $$__/    \  $$/$$/ | $$$$$$$$| $$  \ $$  | $$    |  $$$$$$
 *    | $$        \  $$$/  | $$_____/| $$  | $$  | $$ /$$ \____  $$
 *    | $$$$$$$$   \  $/   |  $$$$$$$| $$  | $$  |  $$$$/ /$$$$$$$/
 *    |________/    \_/     \_______/|__/  |__/   \___/  |_______/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * ON BUTTON CLICKED
 *  Handle GUI Gates, I/O, and Modes button clicks.
 * @param {Event} event - Button click event.
 ****************************************************************************/
Digsim.prototype.onButtonClicked = function(event) {
    event.preventDefault();

    // Don't do anything if the button is disabled
    if ($(this).hasClass('disabled')) {
        return;
    }

    var id = $(this).attr("id");
    var comps, comp, i, j, Class, row, col, len;

    // Activate button
    if (!$(this).hasClass('active')) {
        // Remove the active class from all buttons that have it
        digsim.deactivateButtons($('ul:not(.num-inputs) .active').attr('id'));
        $(this).addClass('active');

        // Wire mode
        if (id == "Wire") {
            digsim.mode = digsim.WIRE_MODE;
        }
        // Simulate Mode
        else if (id == "Run") {
            // Error if there are no drivers in the schematic
            if (digsim.drivers.length === 0) {
                digsim.addMessage(digsim.ERROR, "[16]Error: No drivers in schematic!");
                return;
            }

            digsim.mode = digsim.SIM_MODE;

            // Clear messages every new Run
            digsim.clearMessages();

            // Count the number of connections, inputs, and outputs of the schematic
            digsim.maxSchematicLoop = 0;
            comps = digsim.components.get();
            for (j = 0, len = comps.length; j < len; ++j) {
                comp = comps[j];

                if (typeof comp !== 'undefined') {
                    // Reset the state of all Components
                    if (comp.type === digsim.DFF) {
                        comp.state = {'Q': false, 'Qnot': false};
                    }
                    else if (comp.type === digsim.ASCIIDISPLAY) {
                        comp.text = "";
                    }
                    else {
                        comp.state = -1;
                    }

                    // Count the number of connections the schematic has
                    if (comp.type === digsim.WIRE) {
                        digsim.maxSchematicLoop += comp.connections.length();

                        // Reset input/output connections for a Wire
                        comp.inputs.clear(false);
                        comp.outputs.clear(false);
                    }
                    else
                        digsim.maxSchematicLoop += comp.numInputs + comp.numOutputs;
                }
            }
            // Define a safety buffer to pass through
            digsim.maxSchematicLoop *= 3;

            // Loop through each driver and pass state
            for (i = 0, len = digsim.drivers.length; i < len; ++i) {
                comp = digsim.components.getComponent(digsim.drivers[i]);

                // Pass state if successfully traversed
                if (comp.traverseConnections()) {
                    digsim.passCounter = 0;
                    comp.passState(0);
                }
                // There was an error so exit
                else
                    return;
            }

            cycleClock();
            digsim.drawAllComponents();
        }
        // Button to place a Component
        else {
            digsim.mode = digsim.PLACE_MODE;
            digsim.enableButton('Rotate_CW');
            digsim.enableButton('Rotate_CCW');

            // Use reflection to dynamically create gate based on id
            Class = window[id];
            comp = new Class(digsim.numGateInputs);
            digsim.rotation = 0;

            // Initialize the new object at the mouse position
            row = digsim.getMouseRow();
            col = digsim.getMouseCol();
            comp.init(row, col, digsim.rotation, digsim.iComp);

            digsim.dragging = true;
            digsim.dragOffset = {'row': 0, 'col': 0};
            digsim.selectedComponent = comp;
            digsim.drawComponent(digsim.selectedComponent, digsim.movingContext);
            animate();
        }
    }
    // Deactivate button
    else {
        digsim.deactivateButtons(id);
    }
};

/**************************************************************************************************************
 *     /$$$$$$$$ /$$ /$$
 *    | $$_____/|__/| $$
 *    | $$       /$$| $$  /$$$$$$
 *    | $$$$$   | $$| $$ /$$__  $$
 *    | $$__/   | $$| $$| $$$$$$$$
 *    | $$      | $$| $$| $$_____/
 *    | $$      | $$| $$|  $$$$$$$
 *    |__/      |__/|__/ \_______/
 *
 *
 *
 *     /$$$$$$$              /$$       /$$
 *    | $$__  $$            | $$      | $$
 *    | $$  \ $$ /$$   /$$ /$$$$$$   /$$$$$$    /$$$$$$  /$$$$$$$   /$$$$$$$
 *    | $$$$$$$ | $$  | $$|_  $$_/  |_  $$_/   /$$__  $$| $$__  $$ /$$_____/
 *    | $$__  $$| $$  | $$  | $$      | $$    | $$  \ $$| $$  \ $$|  $$$$$$
 *    | $$  \ $$| $$  | $$  | $$ /$$  | $$ /$$| $$  | $$| $$  | $$ \____  $$
 *    | $$$$$$$/|  $$$$$$/  |  $$$$/  |  $$$$/|  $$$$$$/| $$  | $$ /$$$$$$$/
 *    |_______/  \______/    \___/     \___/   \______/ |__/  |__/|_______/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * NEW FILE
 *  Create a new file
 ****************************************************************************/
Digsim.prototype.newFile = function() {
    // Reset information
    digsim.iComp = 0;
    digsim.components.clear();
    digsim.drivers = [];
    digsim.placeholders = [];
    for (var i = 0; i < digsim.NUM_COLS; ++i) {
        digsim.placeholders[i] = [];
    }
    $('#messages').html('');

    digsim.clearCanvas(digsim.staticContext);
    digsim.deactivateButtons();
};

/*****************************************************************************
 * SUBMIT FILE
 *  Submits the hidden file upload form to the server.
 ****************************************************************************/
Digsim.prototype.submitFile = function() {
    digsim.readFile = true;

    $('#uploadForm').submit();
};

/*****************************************************************************
 * READ FILE CONTENTS
 *  Reads the contents of the hidden iframe after the file has been submitted.
 ****************************************************************************/
Digsim.prototype.readFileContents = function() {
    // Only read file contents after a file has been submitted. Prevents error messages from the server
    // firing the onchance event of the iframe and then reading the iframe contents.
    if (!digsim.readFile)
        return;

    digsim.readFile = false;

    var contents = $('#fileContents').contents().find('body').text();

    // Clear the form when finished
    // Prevents pop up in IE because of the method="post" of the form when refreshing the page.
    if (contents !== "") {
        document.getElementById("uploadForm").reset();
        document.getElementById('fileContents').src = "about:blank";
    }

    // Display error messages
    if (contents === "file") {
        digsim.addMessage(digsim.ERROR, "Error parsing file: Incorrect file type. File must be of type '.json'.");
    }
    else if (contents === "size") {
        digsim.addMessage(digsim.ERROR, "Error parsing file: File is too large.");
    }
    else if (contents !== "") {
        digsim.openFile(contents);
    }
};

/*****************************************************************************
 * OPEN FILE
 *  Open a schematic into the program.
 * @param {string} contents - JSONH string of the file contents.
 ****************************************************************************/
Digsim.prototype.openFile = function(contents) {
    // Don't do anything if the button is disabled
    if ($('#Open').hasClass('disabled')) {
        return;
    }

    var comps = [];
    var components, c, comp, i, j, name, Class, connectedComp, id = 0;

    // Parse the JSONH string and validate contents
    try {
       components = $.parseJSON(contents);
       digsim.validateFile(components);
    }
    catch (e) {
        digsim.addMessage(digsim.ERROR, "Error parsing file: Data missing or incomplete.");
        return;
    }

    // Use reflection to dynamically create Component based on name
    for (i = 0; i < components.length; i++) {
        c = components[i];

        name = c.name;
        Class = window[name];
        comp = new Class(c.numInputs);
        comp.init(c.row, c.col, c.rotation, c.id);

        // Copy all properties of the Component
        $.extend(comp, c);

        // Set Wire direction
        if (comp.type === digsim.WIRE) {
            comp.dx = (comp.path.x ? 1 : 0);
            comp.dy = (comp.path.y ? 1 : 0);
        }

        // Find the highest id so we can start iComp there
        if (comp.id > id)
            id = comp.id;

        comps[i] = comp;
    }

    // Reset current file
    digsim.newFile();

    // Set up schematic
    for (i = 0; i < comps.length; i++) {
        comp = comps[i];
        digsim.components.add(comp);

        digsim.setPlaceholders(comp);

        if (comp.type === digsim.SWITCH || comp.type === digsim.CLOCK) {
            digsim.drivers.push(comp.id);
        }

        comp.checkConnections();
    }

    digsim.iComp = id + 1;
    digsim.drawAllComponents();
};

/*****************************************************************************
 * VALIDATE FILE
 *  Validate that the contents of a file are correct.
 * @param {Array} components - Array of parsed JSON objects.
 ****************************************************************************/
Digsim.prototype.validateFile = function(components) {
    var comp;

    // Ensure the object is an array
    if (!$.isArray(components)) {
        throw "array";
    }

    // Check that each component has the proper data
    for (var i = 0; i < components.length; i++) {
        comp = components[i];

        try {
            digsim.validateComponent(comp);
        }
        catch (e) {
            throw e;
        }
    }
};

/*****************************************************************************
 * VALIDATE COMPONENT
 *  Validate that the a Component has all needed properties for a save or load.
 * @param {Components} comp - Component whose properties to validate.
 * @throws An error if a property is missing.
 ****************************************************************************/
Digsim.prototype.validateComponent = function(comp) {
    if (typeof comp.type === 'undefined')
        throw "type";
    if (typeof comp.id === 'undefined')
        throw "id";
    if (typeof comp.name === 'undefined')
        throw "name";
    if (typeof comp.numInputs === 'undefined')
        throw "numInputs";
    if (typeof comp.row === 'undefined')
        throw "row";
    if (typeof comp.col === 'undefined')
        throw "col";
    if (typeof comp.rotation === 'undefined')
        throw "rotation";
    if (typeof comp.label === 'undefined')
        throw "label";

    // Wire
    if (comp.type === digsim.WIRE) {
        if (typeof comp.path === 'undefined')
            throw "path";
        if (typeof comp.path.x === 'undefined' || typeof comp.path.y === 'undefined')
            throw "path.x || path.y";
    }

    // Clock
    if (comp.type === digsim.CLOCK) {
        if (typeof comp.frequency === 'undefined')
            throw "frequency";
    }

    // PROM
    if (comp.type === digsim.PROM) {
        if (typeof comp.addresses === 'undefined')
            throw "addresses";
    }
}

/*****************************************************************************
 * SAVE FILE
 *  Save the schematic to a JSON object then call a PHP script to let the user
 *  download it to their computer.
 ****************************************************************************/
Digsim.prototype.saveFile = function() {
    // Don't do anything if the button is disabled
    if ($('#Save').hasClass('disabled')) {
        return;
    }

    var components = [];
    var comps, comp, i, j, inputs, outputs, cons, prop;

    // Create a new array that will be turned into the JSON object
    // Copy so we don't modify any of the existing Components
    comps = digsim.components.get();
    for (i = 0; i < comps.length; i++)  {
        components[i] = $.extend(true, {}, comps[i]);
    }

    // Remove unneeded properties to reduce JSON string length
    for (i = 0; i < components.length; i++) {
        comp = components[i];

        delete comp.numOutputs;
        delete comp.dimension;
        delete comp.drawStatic;
        delete comp.inputs;
        delete comp.outputs;
        delete comp.zeroDimension;
        delete comp.state;
        if (comp.type === digsim.WIRE) {
            delete comp.connections;
            delete comp.dx;
            delete comp.dy;
        }

        // Ensure we have all needed information being saved to the file
        try {
            digsim.validateComponent(comp);
        }
        catch (e) {
            digsim.addMessage(digsim.ERROR, "Error saving file: Schematic data corrupted.");
            return;
        }
    }

    // Stringify the array
    digsim.saveJson = JSON.stringify(components);

    // JavaScript does not allow files to be downloaded to the users machine (FileReader API is not supported enough to use)
    // PHP can download files to the users machine, but the user HAS to navigate to the page (can't just use an AJAX request)
    // To get around this problem, we can create an iFrame with the src set to the php script

    // POST the data to the script to be able to send large strings to the server (GET sends the data as part of the URL string)
    $.ajax({
        url: 'scripts/src/saveFile.php',
        type: 'POST',
        data: { data: digsim.saveJson },
        success: function(result) {
            // Set the iFrame src to allow the user to download the schematic via PHP
            var ifrm = document.getElementById('fileContents');
            ifrm.setAttribute("src", "scripts/src/saveFile.php");
        }
    });
};

/*****************************************************************************
 * TOGGLE GRID
 *  Toggle the gird between drawing grid lines, wire dots, or no grid at all.
 ****************************************************************************/
Digsim.prototype.toggleGrid = function() {
    digsim.gridToggle = ++digsim.gridToggle % 3;
    digsim.drawGrid(digsim.gridContext);
};

/*****************************************************************************
 * ZOOM
 *  Zoom in/out on the canvas.
 * @param {Event} event - Button click event with data attribute of dir of
 *                        1 (in) or -1 (out).
 ****************************************************************************/
Digsim.prototype.zoom = function(event) {
    var dir = event.data.dir;
    digsim.gridSize += digsim.GRID_ZOOM * dir;

    // Bound the zoom
    if (digsim.gridSize > digsim.MAX_GRID_SIZE) {
        digsim.gridSize = digsim.MAX_GRID_SIZE;
    }
    else if (digsim.gridSize < digsim.MIN_GRID_SIZE) {
        digsim.gridSize = digsim.MIN_GRID_SIZE;
    }
    else {
        // Enable the buttons for the opposite zoom
        if (dir === 1 && $('#Zoom_Out').hasClass('disabled')) {
            digsim.enableButton('Zoom_Out');
        }
        if (dir === -1 && $('#Zoom_In').hasClass('disabled')) {
            digsim.enableButton('Zoom_In');
        }

        digsim.init();
        digsim.changeHitRadius();
        digsim.drawGrid(digsim.gridContext);
        digsim.drawAllComponents();

        // Disable buttons when at the min and max levels
        if (digsim.gridSize === digsim.MAX_GRID_SIZE) {
            digsim.disableButton('Zoom_In');
        }
        if (digsim.gridSize === digsim.MIN_GRID_SIZE) {
            digsim.disableButton('Zoom_Out');
        }
    }
};

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs for a gate.
 * @param {Event} event - Button click event.
 ****************************************************************************/
Digsim.prototype.changeNumInputs = function() {
    // Don't do anything if the button is already active
    if ($(this).hasClass('active')) {
        return;
    }

    // Remove the active class from all buttons that have it
    $('.num-inputs .active').removeClass('active');
    $(this).addClass('active');

    digsim.numGateInputs = $(this).data('inputs');

    if (digsim.selectedComponent && digsim.selectedComponent.changeNumInputs) {
        digsim.selectedComponent.changeNumInputs(digsim.numGateInputs);
    }
};

/**************************************************************************************************************
 *      /$$$$$$                        /$$                         /$$
 *     /$$__  $$                      | $$                        | $$
 *    | $$  \__/  /$$$$$$  /$$$$$$$  /$$$$$$    /$$$$$$   /$$$$$$ | $$
 *    | $$       /$$__  $$| $$__  $$|_  $$_/   /$$__  $$ /$$__  $$| $$
 *    | $$      | $$  \ $$| $$  \ $$  | $$    | $$  \__/| $$  \ $$| $$
 *    | $$    $$| $$  | $$| $$  | $$  | $$ /$$| $$      | $$  | $$| $$
 *    |  $$$$$$/|  $$$$$$/| $$  | $$  |  $$$$/| $$      |  $$$$$$/| $$
 *     \______/  \______/ |__/  |__/   \___/  |__/       \______/ |__/
 *
 *
 *
 *     /$$$$$$$              /$$       /$$
 *    | $$__  $$            | $$      | $$
 *    | $$  \ $$ /$$   /$$ /$$$$$$   /$$$$$$    /$$$$$$  /$$$$$$$   /$$$$$$$
 *    | $$$$$$$ | $$  | $$|_  $$_/  |_  $$_/   /$$__  $$| $$__  $$ /$$_____/
 *    | $$__  $$| $$  | $$  | $$      | $$    | $$  \ $$| $$  \ $$|  $$$$$$
 *    | $$  \ $$| $$  | $$  | $$ /$$  | $$ /$$| $$  | $$| $$  | $$ \____  $$
 *    | $$$$$$$/|  $$$$$$/  |  $$$$/  |  $$$$/|  $$$$$$/| $$  | $$ /$$$$$$$/
 *    |_______/  \______/    \___/     \___/   \______/ |__/  |__/|_______/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * DELETE
 *  Delete a component.
 ****************************************************************************/
Digsim.prototype.delete = function() {
    // Don't do anything if the button is disabled
    if ($('#Delete').hasClass('disabled')) {
        return;
    }

    digsim.deleteComponent(digsim.selectedComponent);
};

/*****************************************************************************
 * ROTATE
 *  Rotate a Component clockwise or counter-clockwise.
 * @param {Event} event - Button click event with data attribute of dir of
 *                        90 (CW) or 270 (CCW).
 ****************************************************************************/
Digsim.prototype.rotate = function(event) {
    // Don't do anything if rotation is disabled (both are always enabled or always disabled)
    if ($('#Rotate_CW').hasClass('disabled')) {
        return;
    }

    var comp = digsim.selectedComponent;

    // Delete placed Component placeholders
    if (!digsim.dragging) {
        digsim.deletePlaceholder(comp);
        comp.deleteConnections();
    }

    digsim.rotation = (comp.rotation + event.data.dir) % 360;
    comp.rotation = digsim.rotation;

    // Swap Component dimensions
    comp.dimension.row = comp.dimension.row ^ comp.dimension.col;
    comp.dimension.col = comp.dimension.row ^ comp.dimension.col;
    comp.dimension.row = comp.dimension.row ^ comp.dimension.col;

    digsim.drawAllComponents();

    if (!digsim.dragging && digsim.setPlaceholders(comp)) {
        digsim.drawComponent(comp, digsim.staticContext, 'red');
        comp.checkConnections();
    }
    else {
        digsim.drawComponent(comp, digsim.movingContext, 'red');
    }
};

/*****************************************************************************
 * CUT
 *  Cut a component to the clipboard.
 ****************************************************************************/
Digsim.prototype.cut = function() {
    // Don't do anything if the button is disabled
    if ($('#Cut').hasClass('disabled')) {
        return;
    }

    digsim.clipboard = digsim.selectedComponent;
    digsim.deleteComponent(digsim.selectedComponent);

    // Activate the paste button
    if ($('#Paste').hasClass('disabled')) {
        digsim.enableButton('Paste');
    }
};


/*****************************************************************************
 * COPY
 *  Copy a component to the clipboard.
 ****************************************************************************/
Digsim.prototype.copy = function() {
    // Don't do anything if the button is disabled
    if ($('#Copy').hasClass('disabled')) {
        return;
    }

    digsim.clipboard = digsim.selectedComponent;

    // Activate the paste button
    if ($('#Paste').hasClass('disabled')) {
        digsim.enableButton('Paste');
    }
 };

/*****************************************************************************
 * PASTE
 *  Paste a component from the clipboard to the canvas.
 ****************************************************************************/
Digsim.prototype.paste = function() {
    // Don't do anything if the button is disabled
    if ($('#Paste').hasClass('disabled')) {
        return;
    }

    digsim.mode = digsim.PLACE_MODE;

    // Use reflection to dynamically create gate based on name
    var name  = digsim.clipboard.name;
    var Class = window[name];
    var comp  = new Class(digsim.clipboard.numInputs);

    // Copy all properties of the Component but keep the new id
    $.extend(true, comp, digsim.clipboard, {id: digsim.iComp});

    // Initialize the new Component at the mouse position
    comp.row = digsim.getMouseRow();
    comp.col = digsim.getMouseCol();

    digsim.dragging = true;
    digsim.dragOffset = {'row': 0, 'col': 0};
    digsim.selectedComponent = comp;
    digsim.drawComponent(digsim.selectedComponent, digsim.movingContext);
    animate();
};

/**************************************************************************************************************
 *     /$$   /$$           /$$
 *    | $$  | $$          | $$
 *    | $$  | $$  /$$$$$$ | $$  /$$$$$$   /$$$$$$   /$$$$$$
 *    | $$$$$$$$ /$$__  $$| $$ /$$__  $$ /$$__  $$ /$$__  $$
 *    | $$__  $$| $$$$$$$$| $$| $$  \ $$| $$$$$$$$| $$  \__/
 *    | $$  | $$| $$_____/| $$| $$  | $$| $$_____/| $$
 *    | $$  | $$|  $$$$$$$| $$| $$$$$$$/|  $$$$$$$| $$
 *    |__/  |__/ \_______/|__/| $$____/  \_______/|__/
 *                            | $$
 *                            | $$
 *                            |__/
 *     /$$$$$$$$                                 /$$     /$$
 *    | $$_____/                                | $$    |__/
 *    | $$       /$$   /$$ /$$$$$$$   /$$$$$$$ /$$$$$$   /$$  /$$$$$$  /$$$$$$$   /$$$$$$$
 *    | $$$$$   | $$  | $$| $$__  $$ /$$_____/|_  $$_/  | $$ /$$__  $$| $$__  $$ /$$_____/
 *    | $$__/   | $$  | $$| $$  \ $$| $$        | $$    | $$| $$  \ $$| $$  \ $$|  $$$$$$
 *    | $$      | $$  | $$| $$  | $$| $$        | $$ /$$| $$| $$  | $$| $$  | $$ \____  $$
 *    | $$      |  $$$$$$/| $$  | $$|  $$$$$$$  |  $$$$/| $$|  $$$$$$/| $$  | $$ /$$$$$$$/
 *    |__/       \______/ |__/  |__/ \_______/   \___/  |__/ \______/ |__/  |__/|_______/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * DECIMAL TO HEX
 *  Converts a decimal value to a hex value.
 * @param {number} dec - Decimal to convert.
 * @return {string} Hex value.
 ****************************************************************************/
Digsim.prototype.dec2hex = function(dec) {
    return Number(dec).toString(16).toUpperCase();
};

/*****************************************************************************
 * DECIMAL TO BINARY
 *  Converts a decimal value to a binary value.
 * @param {number} dec - Decimal to convert.
 * @param {string} Binary value.
 ****************************************************************************/
Digsim.prototype.dec2bin = function(dec) {
    return Number(dec).toString(2);
};

/*****************************************************************************
 * PAD
 *  Pad a value with leading values.
 * @param {number}        value   - Value to pad.
 * @param {number}        length  - Length of the
 * @param {number/string} padding - Value to pad with @default '0'. If the length
 *                                  is greater than 1, will just use the first character.
 ****************************************************************************/
Digsim.prototype.pad = function(value, length, padding) {
    if (typeof padding === 'undefined')
        padding = '0';
    else
        padding + '';

    // Can only pad with single characters
    if (padding.length > 1)
        padding = padding[0];

    value = value + '';

    return new Array(length - value.length + 1).join(padding) + value
};

/*****************************************************************************
 * GET MOUSE POS
 *  Return the position of the mouse.
 * @return {Object} - {x, y}.
 ****************************************************************************/
Digsim.prototype.getMousePos = function() {
    return {x: digsim.mousePos.x, y: digsim.mousePos.y};
};

/*****************************************************************************
 * GET ROW
 *  Return the y position as a row.
 * @param {number} y
 * @return {number}
 ****************************************************************************/
Digsim.prototype.getRow = function(y) {
    return Math.floor(y / digsim.gridSize);
};

/*****************************************************************************
 * GET COL
 *  Return the x position as a col.
 * @param {number} x
 * @return {number}
 ****************************************************************************/
Digsim.prototype.getCol = function(x) {
    return Math.floor(x / digsim.gridSize);
};

/*****************************************************************************
 * GET MOUSE ROW
 *  Return the grid row of the current mouse position.
 * @return {number}
 ****************************************************************************/
Digsim.prototype.getMouseRow = function() {
    return digsim.getRow(digsim.mousePos.y);
};

/*****************************************************************************
 * GET MOUSE COL
 *  Return the grid col of the current mouse position.
 * @return {number}
 ****************************************************************************/
Digsim.prototype.getMouseCol = function() {
    return digsim.getCol(digsim.mousePos.x);
};

/*****************************************************************************
 * GET WIRE INDEX
 *  Returns the index of the where the user clicks inside a wire array
 *  placeholder cell.
 ****************************************************************************/
Digsim.prototype.getWireIndex = function() {
    var mousePos  = this.getMousePos();
    var row       = this.getMouseRow();
    var col       = this.getMouseCol();
    var relX      = mousePos.x % digsim.gridSize;
    var relY      = mousePos.y % digsim.gridSize;

    var leftVert  = topHor = Math.ceil(digsim.gridSize * (1 - digsim.HIT_RADIUS) / 2);
    var rightVert = bottomHor = digsim.gridSize - topHor;
    var diagSep   = digsim.gridSize - relX;
    var vert      = (relX >= topHor) && (relX <= bottomHor);
    var hor       = (relY >= leftVert) && (relY <= rightVert);
    var index     = -1;
    var array     = digsim.placeholders[row][col];

    if (vert && hor && (array[0] || array[2]) && (array[1] || array[3])) {
        // mid click and multiple wires
        // Determine grid snap for wires not connecting to other wires.
        if (relY < relX) {  // top
            if (relY < diagSep) {  // top-left
                index = digsim.TL;
            }
            else { // top-right
                index = digsim.TR;
            }
        }
        else { // bottom
            if (relY < diagSep) { // bottom-left
                index = digsim.BL;
            }
            else { // bottom-right
                index = digsim.BR;
            }
        }
    }
    else if (hor && (array[1] || array[3]) && relY >= topHor && relY <= bottomHor) {
        if (relX <= digsim.gridSize / 2) {
            index = 3;
        }
        else {
            index = 1;
        }
    }
    else if (vert && relX >= leftVert && relX <= rightVert) {
        if (relY <= digsim.gridSize / 2) {
            index = 0;
        }
        else {
            index = 2;
        }
    }

    return index;
};

/*****************************************************************************
 * PREP DRAGGING
 *  Prepare a Component for dragging.
 ****************************************************************************/
Digsim.prototype.prepDragging = function() {
    var comp = digsim.selectedComponent;
    var inputs, outputs, connections, cons, con, comps, connectedComp, index, space;

    // Get connected Components
    if (comp.type === digsim.WIRE) {
        connections = comp.connections.get();
        cons = ['connections'];
    }
    else {
        inputs = comp.inputs.get();
        outputs = comp.outputs.get();
        cons = ['inputs','outputs'];
    }

    // Loop through each connection
    for (k = 0; k < cons.length; k++) {
        con = cons[k];
        comps = (con === 'inputs' ? inputs : con === 'outputs' ? outputs : connections);

        // Loop through each Component
        for (j = 0; j < comps.length; j++) {
            connectedComp = comps[j];

            // Connection start space
            if (connectedComp.type === digsim.WIRE) {
                index = connectedComp.connections.getConnectionIndex(comp);

                // Get Wire Component space
                if (index === 'input')
                    space = connectedComp.getComponentOutputSpace()[0];
                else
                    space = connectedComp.getComponentInputSpace()[0];

                connectedComp.drawStatic = false;
                digsim.deletePlaceholder(connectedComp);
            }
            else {
                // Get Component space for a connection
                if (connectedComp.inputs.contains(comp)) {
                    index = connectedComp.inputs.getConnectionIndex(comp);
                    space = connectedComp.getInputRotation(index);
                }
                else {
                    index = connectedComp.outputs.getConnectionIndex(comp);
                    space = connectedComp.getOutputRotation(index);
                }
            }
            digsim.connectionStarts[connectedComp.id] = {'r': space.row, 'c': space.col};

            // Connection target space
            index = comp[con].getConnectionIndex(connectedComp);
            if (con === 'inputs')
                space = comp.getInputRotation(index);
            else if (con === 'outputs')
                space = comp.getOutputRotation(index);
            else {
                index = comp.connections.getConnectionIndex(connectedComp);

                if (index === 'input')
                    space = comp.getComponentInputSpace()[0];
                else
                    space = comp.getComponentOutputSpace()[0];
            }
            digsim.connectionTargets[connectedComp.id] = {'r': space.row - comp.row, 'c': space.col - comp.col};
        }
    }

    comp.drawStatic = false;
    digsim.deletePlaceholder(comp);

    digsim.drawAllComponents();
};

/*****************************************************************************
 * CHANGE HIT RADIUS
 *  Changes the hit radius so that wires will be easier to select.
 ****************************************************************************/
Digsim.prototype.changeHitRadius = function() {
    this.HIT_RADIUS = 0.80 / (digsim.MIN_GRID_SIZE - digsim.MAX_GRID_SIZE) *
                      (digsim.gridSize - digsim.MIN_GRID_SIZE) + 1;
};

/*****************************************************************************
 * DISABLE BUTTON
 *  Disable a button.
 * @param {number} id - The HTML id of the button to disable.
 ****************************************************************************/
Digsim.prototype.disableButton = function(id) {
    $('#' + id).addClass('disabled');
    $('#' + id).removeAttr('href');
    $('#' + id).removeAttr('title');
};

/*****************************************************************************
 * ENABLE BUTTON
 *  Enable a button.
 * @param {number} id - The HTML id of the button to enable.
 ****************************************************************************/
Digsim.prototype.enableButton = function(id) {
    // Button title's should not contain underscores
    var title = id.replace("_", " ");
    var hotkey = digsim.HOT_KEYS[id];

    $('#' + id).removeClass('disabled');
    $('#' + id).attr('href', '#');

    // Set the title of the button to the format of '[name] ([hot key])';
    $('#' + id).attr('title', title + (hotkey ? " (" + digsim.HOT_KEYS[id] + ")" : ""));
};

/*****************************************************************************
 * DEACTIVATE BUTTONS
 *  Removes the 'active' class from all buttons, resets states of all Components
 *  after SIM_MODE, and changes mode back to DEFAULT_MODE.
 ****************************************************************************/
 Digsim.prototype.deactivateButtons = function(id) {
    $("canvas").css('cursor','default');
    $('ul:not(.num-inputs) .active').removeClass('active');
    this.disableControlButtons();

    // Reset all states and redraw canvas if application was in RUN_MODE
    var comps, comp;
    if (id === "Run" || this.mode === this.SIM_MODE) {
        comps = this.components.get();
        for (var i = 0, len = comps.length; i < len; i++) {
            // Reset the state of all Components
            comp = comps[i];
            if (comp.type === digsim.DFF) {
                comp.state = {'Q': false, 'Qnot': false};
            }
            else if (comp.type === digsim.ASCIIDISPLAY) {
                comp.text = "";
            }
            else {
                comp.state = 0;
            }
        }
    }

    this.mode = this.DEFAULT_MODE;
    this.dragging = false;
    this.selectedComponent = undefined;

    this.clearCanvas(this.movingContext);
    this.drawAllComponents();
};

/*****************************************************************************
 * DISABLE CONTROL BUTTONS
 *  Disable all Control buttons.
 ****************************************************************************/
Digsim.prototype.disableControlButtons = function() {
    digsim.disableButton('Cut');
    digsim.disableButton('Copy');
    digsim.disableButton('Delete');
    digsim.disableButton('Rotate_CCW');
    digsim.disableButton('Rotate_CW');

    // Disable the paste button if nothing has been copied
    if (!digsim.clipboard) {
        digsim.disableButton('Paste');
    }

    // Draw the selected component before reseting
    if (digsim.selectedComponent) {
        digsim.drawAllComponents();
    }
    this.selectedComponent = undefined;
};

/*****************************************************************************
 * SHOW COMPONENT MENUS
 *  Shows a menu that allows the user to change information about a Component.
 ****************************************************************************/
Digsim.prototype.showComponentMenu = function() {
    this.mode = this.EDIT_MODE;
    var comp = digsim.selectedComponent;

    // Name the Edit screen with the number of inputs of a gate
    var name = comp.name;
    if (comp.isAGate() && comp.numInputs >= 2) {
        name = comp.numInputs + "-input " + name;
    }

    // Show clock frequency
    if (comp.type === digsim.CLOCK) {
        $('#clock-freq').val(comp.frequency);
        $('.clock-freq').show();
    }
    else {
        $('.clock-freq').hide();
    }

    // Show prom addresses
    if (comp.type === digsim.PROM) {
        var table = document.getElementById('prom-addresses');
        table.innerHTML = '';

        var docfrag = document.createDocumentFragment();
        var tr, td, label, input, num;

        tr = document.createElement("tr");

        // Headers
        th = document.createElement("th");
        th.textContent = "Address";
        tr.appendChild(th);

        th = document.createElement("th");
        th.textContent = "Hex";
        tr.appendChild(th);

        docfrag.appendChild(tr);

        for (var address in comp.addresses) {
            tr = document.createElement("tr");
            tr.id = "row-" + address;

            // Address
            num = digsim.pad(digsim.dec2bin(address), comp.numInputs - 1);

            td = document.createElement("td");
            label = document.createElement("label");

            label.setAttribute("for","hex-" + address);
            label.id = "address-" + address;
            label.className = "address-value";
            label.innerHTML = num;

            td.appendChild(label);
            tr.appendChild(td);

            // Hex
            num = digsim.pad(digsim.dec2hex(comp.addresses[address]), 2);

            td = document.createElement("td");
            input = document.createElement("input");

            input.type = "text";
            input.setAttribute('maxlength', 2);
            input.id = "hex-" + address;
            input.className = "hex-value";
            input.value = num;

            td.appendChild(input);
            tr.appendChild(td);

            docfrag.appendChild(tr);
        }
        table.appendChild(docfrag);

        $('.prom-addresses').scrollTop(0)
        $('.prom-addresses').show();
    }
    else {
        $('.prom-addresses').hide();
    }

    // Set the edit menu information
    $('#component-name').html(name);
    $('#component-label').val(comp.label);
    $('.component-menu').show();
    $('#component-label').blur();
};

/*****************************************************************************
 * HIDE COMPONENT MENU
 *  Closes the component edit menu.
 ****************************************************************************/
Digsim.prototype.hideComponentMenu = function() {
    digsim.mode = digsim.DEFAULT_MODE;
    $('.component-menu').hide();
    $('canvas').focus();
};

/*****************************************************************************
 * ON SAVE COMPONENT EDIT
 *  Save changes to the component from the edit menu.
 ****************************************************************************/
Digsim.prototype.onSaveComponentEdit = function() {
    var comp = digsim.selectedComponent;
    var error = false;

    comp.label = $('#component-label').val();

    // Save the clock frequency. Default frequency is 2
    if (comp.type === digsim.CLOCK) {
        comp.frequency = parseInt($('#clock-freq').val(), 10) || 2;
    }

    // Save the prom addresses
    if (comp.type === digsim.PROM) {
        digsim.clearMessages();

        for (var address in comp.addresses) {
            var hex = $('#hex-' + address).val();

            // Validate hex
            if (/^[0-9A-F]+$/i.test(hex)) {
                hex = parseInt(hex, 16);
                comp.addresses[address] = hex;
                $('#row-' + address).removeClass('hex-error');
            }
            else {
                $('#row-' + address).addClass('hex-error');
                var num = Number(address).toString(2);                             // Convert address to binary
                num = new Array(comp.numInputs - num.length).join('0') + num;      // Pad the number with leading zeros
                digsim.addMessage(digsim.ERROR, 'Invalid hex value for address ' + num, false);
                error = true;
            }
        }
    }

    if (error)
        return;

    digsim.hideComponentMenu();
    digsim.drawAllComponents();
    digsim.drawComponent(comp, digsim.staticContext, 'red');
};

/*****************************************************************************
 * ADD MESSAGE
 *  Adds error and warning messages to the message window.
 * @param {number}  type       - Type of message.
 * @param {string}  msg        - Message to display.
 * @param {boolean} deactivate - Deactivate buttons @default true.
 ****************************************************************************/
Digsim.prototype.addMessage = function(type, msg, deactivate) {
    if (type === digsim.ERROR) {
        $('#messages').append("<span class='error'>" + msg + "</span><br>");
        $("#messages").scrollTop($("#messages")[0].scrollHeight);

        if (typeof deactivate === 'undefined' || deactivate)
            digsim.deactivateButtons();
    }
    else if (type === digsim.WARNING) {
        $('#messages').append("<span class='warning'>" + msg + "</span><br>");
        $("#messages").scrollTop($("#messages")[0].scrollHeight);
    }
};

/*****************************************************************************
 * CLEAR MESSAGES
 *  Clears the message window.
 ****************************************************************************/
Digsim.prototype.clearMessages = function() {
    $('#messages').html('');
}

/**************************************************************************************************************
 *     /$$      /$$ /$$
 *    | $$  /$ | $$|__/
 *    | $$ /$$$| $$ /$$  /$$$$$$   /$$$$$$
 *    | $$/$$ $$ $$| $$ /$$__  $$ /$$__  $$
 *    | $$$$_  $$$$| $$| $$  \__/| $$$$$$$$
 *    | $$$/ \  $$$| $$| $$      | $$_____/
 *    | $$/   \  $$| $$| $$      |  $$$$$$$
 *    |__/     \__/|__/|__/       \_______/
 *
 *
 *
 *     /$$$$$$$                        /$$     /$$
 *    | $$__  $$                      | $$    |__/
 *    | $$  \ $$  /$$$$$$  /$$   /$$ /$$$$$$   /$$ /$$$$$$$   /$$$$$$
 *    | $$$$$$$/ /$$__  $$| $$  | $$|_  $$_/  | $$| $$__  $$ /$$__  $$
 *    | $$__  $$| $$  \ $$| $$  | $$  | $$    | $$| $$  \ $$| $$  \ $$
 *    | $$  \ $$| $$  | $$| $$  | $$  | $$ /$$| $$| $$  | $$| $$  | $$
 *    | $$  | $$|  $$$$$$/|  $$$$$$/  |  $$$$/| $$| $$  | $$|  $$$$$$$
 *    |__/  |__/ \______/  \______/    \___/  |__/|__/  |__/ \____  $$
 *                                                           /$$  \ $$
 *                                                          |  $$$$$$/
 *                                                           \______/
 ***************************************************************************************************************/

/*****************************************************************************
 * ROUTE
 *  Route a path from start to target and adds placeholders too.
 *  Dijkstra pathfinding algorithm - www.zsheffield.net/dijkstra-pathfinding
 * @param {Object}  startRef   - Staring {row, col}.
 * @param {Object}  targetRef  - Ending {row, col}.
 * @param {boolean} returnPath - Return the path array.
 * @param {Wire}    obj        - Wire to update path (instead of creating a new one).
 ****************************************************************************/
Digsim.prototype.route = function(startRef, targetRef, returnPath, obj) {
    var start = {'c': startRef.c, 'r': startRef.r};     // JSON objects are pass by reference, and we don't want
    var target = {'c': targetRef.c, 'r': targetRef.r};  // to change the original data - so here, we make a copy...

    // If click is in the same spot, we're done placing the wire.
    if (start.r === target.r && start.c === target.c) {
        if (!returnPath) {
            digsim.dragging = false;
            // Update existing wire
            if (obj && obj.type === digsim.WIRE) {
                obj.path.x = 0;
                obj.path.y = 0;
            }
        }
        return;
    }
    if (typeof digsim.placeholders[target.r][target.c] !== 'undefined' || digsim.mode === digsim.DEFAULT_MODE) {
        digsim.endRoute = true;
    }
    else {
        digsim.endRoute = false;
    }
    // console.log("START: r:" + start.r + " c:" + start.c);
    // console.log("TARGET: r:" + target.r + " c:" + target.c);

    /**
     * Node object
     */
    function node(r, c, p) {
        this.r = r || 0;
        this.c = c || 0;
        this.p = p || undefined;
    };

    var neighbors = [];
    var u;
    var pathfound = false;
    var alt;
    var index = 0;
    var dist = [];
    var Q = [];
    var prev = [];
    prev.push(new node(start.r, start.c));

    // Initialize all arrays
    for (var r = 0; r < digsim.NUM_ROWS; ++r) {
        dist[r] = [];
        Q[r] = [];
        for (var c = 0; c < digsim.NUM_COLS; ++c) {
            dist[r][c] = Infinity;
            Q[r][c] = digsim.placeholders[r][c]; // placeholders go here
        }
    }

    dist[start.r][start.c] = 0;
    while (!pathfound)
    {
        if (index === prev.length) {
            break;
        }
        u = prev[index];
        // u now contains the coordinate in Q with the
        // smallest distance in dist[]

        // If we've reached our target, then we're done
        Q[u.r][u.c] = undefined;
        if (u.r === target.r && u.c === target.c) {
            pathfound = true;
            break;
        }

        if (dist[u.r][u.c] === Infinity) { // Nowhere to go
            digsim.addMessage(digsim.WARNING, "[17]Unable to find valid path for autoroute");
            pathfound = false;
            break;
        }

        // FIND NEIGHBORS
        // Neighbor above
        if ((u.r - 1) >= 0) {
            if (typeof Q[u.r - 1][u.c] === 'undefined' &&
                !(digsim.placeholders[u.r - 1][u.c] instanceof Array) &&
                typeof digsim.placeholders[u.r - 1][u.c] === 'undefined') {
                neighbors.push( {'r': u.r - 1, 'c': u.c} );
            }
            else if (digsim.placeholders[u.r - 1][u.c] instanceof Array) {
                if (digsim.checkAdj(u, 0, target)) {
                    neighbors.push( {'r': u.r - 1, 'c': u.c} );
                }
            }
        }
        // Neighbor right
        if ((u.c + 1) < (digsim.NUM_COLS - 1)) {
            if (typeof Q[u.r][u.c + 1] === 'undefined' &&
                !(digsim.placeholders[u.r][u.c + 1] instanceof Array) &&
                 typeof digsim.placeholders[u.r][u.c + 1] === 'undefined') {
                neighbors.push( {'r': u.r, 'c': u.c + 1} );
            }
            else if (digsim.placeholders[u.r][u.c + 1] instanceof Array) {
                if (digsim.checkAdj(u, 1, target)) {
                    neighbors.push( {'r': u.r, 'c': u.c + 1} );
                }
            }
        }
        // Neighbor below
        if ((u.r + 1) <= (digsim.NUM_ROWS - 1)) {
            if ((typeof Q[u.r + 1][u.c] === 'undefined') &&
                !(digsim.placeholders[u.r + 1][u.c] instanceof Array) &&
                (typeof digsim.placeholders[u.r + 1][u.c] === 'undefined')) {
                    neighbors.push( {'r': u.r + 1, 'c': u.c} );
            }
            else if (digsim.placeholders[u.r + 1][u.c] instanceof Array) {
                if (digsim.checkAdj(u, 2, target)) {
                    neighbors.push( {'r': u.r + 1, 'c': u.c} );
                }
            }
        }
        // Neighbor left
        if ((u.c - 1) >= 0) {
            if (typeof Q[u.r][u.c - 1] === 'undefined' &&
                !(digsim.placeholders[u.r][u.c - 1] instanceof Array) &&
                typeof digsim.placeholders[u.r][u.c - 1] === 'undefined') {
                    neighbors.push( {'r': u.r, 'c': u.c - 1} );
            }
            else if (digsim.placeholders[u.r][u.c - 1] instanceof Array) {
                if (digsim.checkAdj(u, 3, target)) {
                    neighbors.push( {'r': u.r, 'c': u.c - 1} );
                }
            }
        }

        // Add the right neighbor to the path
        for (var i = 0; i < neighbors.length; ++i) {
            alt = dist[u.r][u.c] + 1;
            if (alt < dist[ neighbors[i].r ][ neighbors[i].c ]) {
                dist[ neighbors[i].r ][ neighbors[i].c ] = alt;
                prev.push(new node(neighbors[i].r, neighbors[i].c, u));
                if (target.r === neighbors[i].r && target.c === neighbors[i].c) {
                    pathfound = true;
                    break;
                }
            }
        }
        neighbors = [];
        ++index;
    }
    u = prev[prev.length - 1]; // This is the target
    if (u.r !== target.r || u.c !== target.c) { // no path
        digsim.addMessage(digsim.WARNING, "[18]Unable to find valid path for autoroute");
        return;
    }
    var S = [];
    while (u !== undefined) {
        S.unshift( {'r': u.r, 'c': u.c} );
        u = u.p;
    }

    // Now to actually make the wires
    // First, create the separate paths
    // console.log("Starting wire placement for autoroute");
    var path = [];
    var currBranch = {'r':0,'c':0};
    var currStart = start;
    var validPlacement;
    prevDy = S[1].r - S[0].r;
    prevDx = S[1].c - S[0].c;
    currBranch.r += prevDy;
    currBranch.c += prevDx;
    for (var i = 1, len = S.length - 1; i < len; ++i) {
        dx = S[i + 1].c - S[i].c;
        dy = S[i + 1].r - S[i].r;
        if (dx !== prevDx && dy !== prevDy) {
            if (returnPath) {
                path.push( {'x':Math.abs(currBranch.c + currStart.c),'y':Math.abs(currBranch.r + currStart.r)} );
            }
            else {
                var wire = new Wire();
                if (prevDx === -1 || prevDy === -1) {
                    wire.init(currStart.r + 0.5 + currBranch.r, currStart.c + 0.5 + currBranch.c, 0, digsim.iComp);
                }
                else {
                    wire.init(currStart.r + 0.5, currStart.c + 0.5, 0, digsim.iComp);
                }
                wire.dx = Math.abs(prevDx);
                wire.dy = Math.abs(prevDy);
                wire.path = { 'x':Math.abs(currBranch.c),'y':Math.abs(currBranch.r ) };

                var validPlacement = digsim.setPlaceholders(wire, true);
                if (validPlacement) {
                    digsim.components.add(wire);
                    digsim.iComp++;

                    // Draws the wire on static context.
                    wire.checkConnections();
                    digsim.drawComponent(wire, digsim.staticContext);
                }
                else {
                    // DO NOT PLACE WIRE, there's something in the way.
                    wire.path.pop();
                    digsim.dragging = true;
                }
            }
            currStart.r += currBranch.r;
            currStart.c += currBranch.c;
            currBranch = {'r':0,'c':0};
            prevDx = dx;
            prevDy = dy;
            --i;
        }
        else {
            currBranch.r += prevDy;
            currBranch.c += prevDx;
            prevDx = dx;
            prevDy = dy;
        }
    }

    // Update an existing wire
    if (digsim.mode === digsim.DEFAULT_MODE && !returnPath && obj && obj.type === digsim.WIRE) {
        // Get the two points
        var point1, point2;
        if (path.length) {
            point1 = {'x': path[path.length - 1].x, 'y': path[path.length - 1].y};
        }
        else {
            point1 = {'x': currStart.c, 'y': currStart.r};
        }
        point2 = {'x': (currBranch.c + currStart.c), 'y': (currBranch.r + currStart.r)};

        // Update wire coordinates
        obj.row = Math.min(point1.y, point2.y) + 0.5;
        obj.col = Math.min(point1.x, point2.x) + 0.5;
        obj.path = {'x': Math.abs(point1.x - point2.x), 'y': Math.abs(point1.y - point2.y)};

        // Set the dx and dy of the new wire
        obj.dx = (obj.path.x ? 1 : 0);
        obj.dy = (obj.path.y ? 1 : 0);

        var validPlacement = digsim.setPlaceholders(obj, true);
        obj.drawStatic = true;
    }
    else if (returnPath) {
        path.push( {'x':Math.abs(currBranch.c + currStart.c),'y':Math.abs(currBranch.r + currStart.r)} );
        return path;
    }
    // Place a new wire
    else {
        var wire = new Wire();
        if (prevDx === -1 || prevDy === -1) {
            wire.init(currStart.r + 0.5 + currBranch.r, currStart.c + 0.5 + currBranch.c, 0, digsim.iComp);
        }
        else {
            wire.init(currStart.r + 0.5, currStart.c + 0.5, 0, digsim.iComp);
        }
        wire.dx = Math.abs(prevDx);
        wire.dy = Math.abs(prevDy);
        wire.path = { 'x':Math.abs(currBranch.c),'y':Math.abs(currBranch.r ) };

        var validPlacement = digsim.setPlaceholders(wire, true);
        if (validPlacement) {
            digsim.components.add(wire);
            digsim.iComp++;
            // Draws the wire on static context.
            wire.checkConnections();
            digsim.drawComponent(wire, digsim.staticContext);
        }
        else {
            // DO NOT PLACE WIRE, there's something in the way.
            wire.path.pop();
            digsim.dragging = true;
        }

        if (digsim.endRoute) {
            // If we attach to something at the end, don't start another wire
            digsim.dragging = false;
        }
        else {
            // If we cannot attach to something at the end point,
            // We will start a new wire where we ended the last one
            digsim.wireStart.col = target.c + 0.5;
            digsim.wireStart.row = target.r + 0.5;
            digsim.dragging = true;
        }
    }
};

/*****************************************************************************
 * CHECK ADJACENT
 *  Used for autorouting to see if adjacent cells containing wires are valid
 *  paths.
 * @param {Node}   curr   - Current node.
 * @param {number} d      - Direction to travel.
 * @param {Node}   target - Goal node.
 ****************************************************************************/
Digsim.prototype.checkAdj = function(curr, d, target) {
    var r = curr.r;
    var c = curr.c;
    var t, array;
    if (digsim.placeholders[r][c] instanceof Array &&
        typeof digsim.placeholders[r][c][d] !== 'undefined') {
        return false;
    }
    switch (d)
    {
        case 0: // moving up
            array = digsim.placeholders[r-1][c];
            t =    (typeof array[0] === 'undefined') &&
                   (typeof array[1] !== 'undefined' && digsim.components.getComponent(array[1].ref).type === digsim.WIRE) &&
                   (typeof array[2] === 'undefined') &&
                   (typeof array[3] !== 'undefined' && digsim.components.getComponent(array[3].ref).type === digsim.WIRE);
                   // console.log("("+c+","+(r-1)+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return ((r - 1) === target.r && c === target.c) ? true : t;
            break;
        case 1: // moving right
            array = digsim.placeholders[r][c+1];
            t =    (typeof array[0] !== 'undefined' && digsim.components.getComponent(array[0].ref).type === digsim.WIRE) &&
                   (typeof array[1] === 'undefined') &&
                   (typeof array[2] !== 'undefined' && digsim.components.getComponent(array[2].ref).type === digsim.WIRE) &&
                   (typeof array[3] === 'undefined');
                   // console.log("("+(c+1)+","+r+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return (r === target.r && (c + 1) === target.c) ? true : t;
                break;
        case 2: // moving down
            array = digsim.placeholders[r+1][c];
            t =    (typeof array[0] === 'undefined') &&
                   (typeof array[1] !== 'undefined' && digsim.components.getComponent(array[1].ref).type === digsim.WIRE) &&
                   (typeof array[2] === 'undefined') &&
                   (typeof array[3] !== 'undefined' && digsim.components.getComponent(array[3].ref).type === digsim.WIRE);
                   // console.log("("+c+","+(r+1)+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return ((r + 1) === target.r && c === target.c) ? true : t;
            break;
        default: // moving left
            array = digsim.placeholders[r][c-1];
            t =    (typeof array[0] !== 'undefined' && digsim.components.getComponent(array[0].ref).type === digsim.WIRE) &&
                   (typeof array[1] === 'undefined') &&
                   (typeof array[2] !== 'undefined' && digsim.components.getComponent(array[2].ref).type === digsim.WIRE) &&
                   (typeof array[3] === 'undefined');
                   // console.log("("+(c-1)+","+r+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return (r === target.r && (c - 1) === target.c) ? true : t;
    }
};

/**************************************************************************************************************
 *      /$$$$$$            /$$                           /$$     /$$
 *     /$$__  $$          |__/                          | $$    |__/
 *    | $$  \ $$ /$$$$$$$  /$$ /$$$$$$/$$$$   /$$$$$$  /$$$$$$   /$$  /$$$$$$  /$$$$$$$
 *    | $$$$$$$$| $$__  $$| $$| $$_  $$_  $$ |____  $$|_  $$_/  | $$ /$$__  $$| $$__  $$
 *    | $$__  $$| $$  \ $$| $$| $$ \ $$ \ $$  /$$$$$$$  | $$    | $$| $$  \ $$| $$  \ $$
 *    | $$  | $$| $$  | $$| $$| $$ | $$ | $$ /$$__  $$  | $$ /$$| $$| $$  | $$| $$  | $$
 *    | $$  | $$| $$  | $$| $$| $$ | $$ | $$|  $$$$$$$  |  $$$$/| $$|  $$$$$$/| $$  | $$
 *    |__/  |__/|__/  |__/|__/|__/ |__/ |__/ \_______/   \___/  |__/ \______/ |__/  |__/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * ANIMATE
 *  Draw the selected Component onto the Moving canvas.
 ****************************************************************************/
function animate() {
    // Only animate if dragging a Component
    if (!digsim.dragging) {
        return;
    }

    requestAnimFrame(animate);

    var context = digsim.movingContext;
    digsim.clearCanvas(context, true);

    // Keep the Component where the user clicked on it
    var row = digsim.getMouseRow();
    var col = digsim.getMouseCol();
    var comp = digsim.selectedComponent;

    // Only allow Wires to move either horizontal or vertical
    if (comp.type === digsim.WIRE && comp.dy)
        comp.col = col - digsim.dragOffset.col;
    else if (comp.type === digsim.WIRE && comp.dx)
        comp.row = row - digsim.dragOffset.row;
    else {
        comp.col = col - digsim.dragOffset.col;
        comp.row = row - digsim.dragOffset.row;
    }

    comp.draw(context, 'red');

    // Keep Components connected by drawing Wires between them
    var start, target, path;
    for (var i in digsim.connectionStarts) {
        start = digsim.connectionStarts[i];
        target = digsim.connectionTargets[i];

        target = {'r': comp.row + target.r, 'c': comp.col + target.c};

        if (start.r >= 0 && target.r >= 0)
            path = digsim.route(start, target, true);

        // Draw wire
        if (path) {
            context.beginPath();
            context.moveTo((start.c + 0.5) * digsim.gridSize, (start.r + 0.5) * digsim.gridSize);

            for (var i = 0, len2 = path.length; i < len2; ++i) {
                context.lineTo((path[i].x + 0.5) * digsim.gridSize, (path[i].y + 0.5) * digsim.gridSize);
            }
            context.stroke();
        }
    }
};

/*****************************************************************************
 * ANIMATE WIRE
 *  Draw a Wire being placed onto the Moving canvas.
 ****************************************************************************/
function animateWire() {
    // Only animate if dragging a Wire
    if (!digsim.dragging || digsim.mode !== digsim.WIRE_MODE) {
        return;
    }

    requestAnimFrame(animateWire);

    var context = digsim.movingContext;
    digsim.clearCanvas(context);

    var row = digsim.getMouseRow();
    var col = digsim.getMouseCol();

    // Draw wire
    context.fillStyle   = '#3399FF';
    context.strokeStyle = '#3399FF';
    context.lineWidth   = 2;
    context.lineCap     = 'round';

    context.beginPath();
    context.arc(digsim.wireStart.col * digsim.gridSize, digsim.wireStart.row * digsim.gridSize, 2, 0, 2 * Math.PI);
    context.fill();
    context.moveTo(digsim.wireStart.col * digsim.gridSize, digsim.wireStart.row * digsim.gridSize);

    x = (col + 0.5) * digsim.gridSize;
    y = (row + 0.5) * digsim.gridSize;

    context.lineTo(x, y);
    context.stroke();
};

/*****************************************************************************
 * CLOCK CYCLE
 *  Animate function for the Clock Component.
 ****************************************************************************/
function cycleClock() {
    // Only animate when in SIM_MODE
    if (digsim.mode !== digsim.SIM_MODE) {
        return;
    }

    requestAnimFrame(cycleClock);
    ++digsim.clkCnt;

    for (var i = 0, len = digsim.drivers.length; i < len; ++i) {
        var driver = digsim.components.getComponent(digsim.drivers[i]);

        if (driver.type === digsim.CLOCK && !(digsim.clkCnt % (60 / driver.frequency))) { // FPS is approximately 60 Hz
            digsim.passCounter = 0;
            driver.passState(!driver.state);
            digsim.drawAllComponents();
        }
    }

    // Reset counter to prevent number overflow
    digsim.clkCnt %= 60;
};

/*****************************************************************************
 * REQUEST ANIMATION FRAME
 *  Optimizes the 60 fps animation frame rate relative to the browser.
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



/**************************************************************************************************************
 *     /$$$$$$$            /$$
 *    | $$__  $$          | $$
 *    | $$  \ $$  /$$$$$$ | $$$$$$$  /$$   /$$  /$$$$$$
 *    | $$  | $$ /$$__  $$| $$__  $$| $$  | $$ /$$__  $$
 *    | $$  | $$| $$$$$$$$| $$  \ $$| $$  | $$| $$  \ $$
 *    | $$  | $$| $$_____/| $$  | $$| $$  | $$| $$  | $$
 *    | $$$$$$$/|  $$$$$$$| $$$$$$$/|  $$$$$$/|  $$$$$$$
 *    |_______/  \_______/|_______/  \______/  \____  $$
 *                                             /$$  \ $$
 *                                            |  $$$$$$/
 *                                             \______/
 *     /$$$$$$$$                                 /$$     /$$
 *    | $$_____/                                | $$    |__/
 *    | $$       /$$   /$$ /$$$$$$$   /$$$$$$$ /$$$$$$   /$$  /$$$$$$  /$$$$$$$   /$$$$$$$
 *    | $$$$$   | $$  | $$| $$__  $$ /$$_____/|_  $$_/  | $$ /$$__  $$| $$__  $$ /$$_____/
 *    | $$__/   | $$  | $$| $$  \ $$| $$        | $$    | $$| $$  \ $$| $$  \ $$|  $$$$$$
 *    | $$      | $$  | $$| $$  | $$| $$        | $$ /$$| $$| $$  | $$| $$  | $$ \____  $$
 *    | $$      |  $$$$$$/| $$  | $$|  $$$$$$$  |  $$$$/| $$|  $$$$$$/| $$  | $$ /$$$$$$$/
 *    |__/       \______/ |__/  |__/ \_______/   \___/  |__/ \______/ |__/  |__/|_______/
 *
 *
 *
 **************************************************************************************************************/
Digsim.prototype.debug = {
    /*****************************************************************************
     * VALIDATE SCHEMATIC
     *  Validate a schematic based on a truth table.
     * @param {string} truthTable -
     ****************************************************************************/
    validateSchematic: function(truthTable) {
        var comps = digsim.components.get();
        var labels = {};
        var array = [];
        var component = {};
        var i, j, comp, rows, headers, cols;

        digsim.mode = digsim.SIM_MODE;

        // Count the number of connections, inputs, and outputs of the schematic
        digsim.maxSchematicLoop = 0;
        for (j = 0, len = comps.length; j < len; ++j) {
            comp = comps[j];

            if (comp.type === digsim.DFF) {
                comp.state = {'Q': false, 'Qnot': false};
            }
            else {
                comp.state = -1;
            }

            // Count the number of possible pass through the current schematic could have
            if (comp.type === digsim.WIRE) {
                digsim.maxSchematicLoop += comp.connections.length();

                // Reset input/output connections for a Wire
                comp.inputs.clear(false);
                comp.outputs.clear(false);
            }
            else
                digsim.maxSchematicLoop += comp.numInputs + comp.numOutputs;

            labels[comp.label] = comp.id;
        }
        // Define a safety buffer to pass through
        digsim.maxSchematicLoop *= 3;

        rows = truthTable.split(/\r?\n/);
        headers = rows[0].split(' ');

        // Get the Component associated with the header label
        for (i = 0; i < headers.length; i++) {
            component = digsim.components.getComponent(labels[headers[i]]);

            if (component) {
                array.push(component);

                if (component.isADriver()) {
                    component.traverseConnections();
                }
            }
        }

        // If we don't have all the components, through an error
        if (headers.length !== array.length) {
            // Find each header that is missing
            var found;
            for (i = 0; i < headers.length; i++) {
                found = false;
                for (j = 0; j < array.length; j++) {
                    if (headers[i] === array[j].label) {
                        found = true;
                    }
                }

                if (!found)
                    console.warn("Cannot validate schematic; No Component labeled " + headers[i]);
            }

            digsim.mode = digsim.DEFAULT_MODE;
            return;
        }

        // Loop through each row of the truth table
        for (i = 1; i < rows.length; i++) {
            cols = rows[i].split(' ');

            // Reset all switches
            for (j = 0; j < array.length; j++) {
                if (array[j] && array[j].isADriver()) {
                    array[j].passState(0);
                }
            }

            // Pass state of each column
            for (j = 0; j < cols.length; j++) {
                component = array[j];
                digsim.passCounter = 0;

                if (component && component.isADriver()) {
                    component.passState(parseInt(cols[j], 10));
                }
                else if (component && component.type === digsim.LED) {
                    console.warn("ROW " + i + ": " + (component.state == parseInt(cols[j], 10)) );
                }
            }
        }

        digsim.mode = digsim.DEFAULT_MODE;
    },

    /*****************************************************************************
     * SHOW PLACEHOLDERS
     *  Debug method used to see placeholder objects visually on the grid.
     ****************************************************************************/
    showPlaceholders: function() {
        digsim.clearCanvas(digsim.gridContext);
        digsim.drawGrid(digsim.gridContext);

        var row = 0; col = 0;
        var r, c;

        digsim.gridContext.fillStyle = 'black';
        digsim.gridContext.font = "10pt Calibri";

        // Output row numbers
        for (r = 0; r < digsim.NUM_ROWS; r++) {
            row = r;
            digsim.gridContext.fillText(row, digsim.gridSize / 2 - 10, row * digsim.gridSize + digsim.gridSize / 2 + 10);
        }
        // Output col numbers
        for (c = 0; c < digsim.NUM_COLS; c++) {
            col = c;
            digsim.gridContext.fillText(col, col * digsim.gridSize + digsim.gridSize / 2 - 10, digsim.gridSize / 2 + 10);
        }

        // Loop through placeholders array looking for placeholders to draw
        for (r = 0; r < digsim.NUM_ROWS; r++) {
            for (c = 0; c < digsim.NUM_COLS; c++) {
                row = r;
                col = c;

                // Draw Wire placeholders
                if (digsim.placeholders[row] && digsim.placeholders[row][col] instanceof Array) {
                    for (var z = 0; z < 4; z++) {
                        if (digsim.placeholders[row][col][z]) {
                            digsim.gridContext.save();
                            digsim.gridContext.translate(col * digsim.gridSize, row * digsim.gridSize);

                            // Rotate to the proper index
                            digsim.gridContext.translate(digsim.gridSize / 2, digsim.gridSize / 2);
                            digsim.gridContext.rotate((90 * z) * Math.PI / 180);
                            digsim.gridContext.translate(-digsim.gridSize / 2, -digsim.gridSize / 2);

                            // Draw a triangle
                            digsim.gridContext.fillStyle = 'orange';
                            digsim.gridContext.beginPath();
                            digsim.gridContext.moveTo(0,0);
                            digsim.gridContext.lineTo(digsim.gridSize, 0);
                            digsim.gridContext.lineTo(digsim.gridSize / 2, digsim.gridSize / 2);
                            digsim.gridContext.closePath();
                            digsim.gridContext.stroke();
                            digsim.gridContext.fill();
                            digsim.gridContext.restore();

                            // Display placeholder ref
                            digsim.gridContext.font = "10pt Calibri";
                            digsim.gridContext.fillStyle = 'black';
                            digsim.gridContext.fillText(digsim.placeholders[row][col][z].ref,
                                                        col * digsim.gridSize + digsim.gridSize / 2 - (z % 2 * 10),
                                                        row * digsim.gridSize + digsim.gridSize / 2 + (z % 2 * 10));
                        }
                    }
                }
                // Draw Component placeholder
                else if (digsim.placeholders[row] && digsim.placeholders[row][col]) {
                    // Draw a rectangle
                    digsim.gridContext.fillStyle = 'orange';
                    digsim.gridContext.fillRect(col * digsim.gridSize + 1,
                                                row * digsim.gridSize + 1,
                                                digsim.gridSize - 1, digsim.gridSize - 1);

                    // Display placeholder ref
                    digsim.gridContext.font = "18pt Calibri";
                    digsim.gridContext.fillStyle = 'black';
                    digsim.gridContext.fillText(digsim.placeholders[row][col].ref,
                                                col * digsim.gridSize + digsim.gridSize / 2 - 10,
                                                row * digsim.gridSize + digsim.gridSize / 2 + 10);
                }
            }
        }
    },

    /*****************************************************************************
     * OUTPUT NET LIST
     *  Debug method used to output the connections of Components.
     ****************************************************************************/
    outputNetList: function() {
        var comps = digsim.components.get();
        var comp;
        for (var i = 0, len = comps.length; i < len; i++) {
            comp = comps[i];
            console.log("ID: " + comp.id + "   TYPE: " + comp.name);

            // Output Wire connections
            if (comp.connections) {
                console.log("CONNECTIONS");
                console.log(comp.connections.get());
            }

            console.log("===INPUTS===");
            console.log(comp.inputs.get());
            console.log("===OUTPUTS===");
            console.log(comp.outputs.get());
            console.log("");
        }
    }
};

/*****************************************************************************
 * NAMESPACE
 *  Create namespace for the application. If namespace already exists, don't
 *  override it
 ****************************************************************************/
var digsim = digsim || new Digsim();