/*
 *
 *
 * TOP
 */
AND.prototype = new Drawable();

function AND(numInputs) {
    this.type = digsim.AND;
    this.next = [];
    this.prev = [];
    this.state = 0;
    this.numInputs = numInputs || 2;

    for (var i = 0; i < this.numInputs; ++i) {
        var wire = new Wire();
        this.setPrev(wire);
    }
    var wire = new Wire();
    this.setNext(wire);
};

// Draws a generic gate... just a start.
AND.prototype.draw = function() {
        
    digsim.staticContext.save();
    digsim.staticContext.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    digsim.staticContext.beginPath();
    digsim.staticContext.fillStyle = '#FFFFFF';
    digsim.staticContext.lineWidth = 2;
    
    // Draw gate
    var factor = Math.floor(this.numInputs / 2) + 1;
    console.log(factor);
    digsim.staticContext.moveTo(0, 0);
    digsim.staticContext.strokeStyle = '#000000';
    digsim.staticContext.lineTo(digsim.GRID_SIZE * 2,  0);            
    digsim.staticContext.arc(digsim.GRID_SIZE * factor, digsim.GRID_SIZE * factor, digsim.GRID_SIZE * factor, -Math.PI/2, Math.PI/2);
    digsim.staticContext.lineTo(0,  digsim.GRID_SIZE * factor * 2);  

    digsim.staticContext.closePath();
    digsim.staticContext.stroke();
    digsim.staticContext.fill();
    digsim.staticContext.restore();
    
    // Draw wires
    var cnt = 1;
    for (var i = 0; i < this.numInputs; ++i) {
        switch (i % 2) 
        {
            case 0:
                this.prev[i].init(this.column - 1, this.row + cnt, this.rotation);
                break;
                
            case 1:
                this.prev[i].init(this.column - 1, this.row + (factor * 2) - cnt++, this.rotation);
                break;
            default:
                        }
        this.prev[i].draw();
    }
    this.next[0].init(this.column + (factor * 2), this.row + factor, this.rotation);
    this.next[0].draw();
};

// Infallable logic function
AND.prototype.computeLogic = function() {
    var computedState = this.prev[0].state; 
    
    for (var i = 1; i < this.numInputs; ++i) {
        computedState = computedState && this.prev[i].state;
    }
    this.state = computedState;
};


AND.prototype.init = function (col, row, rot, id) {
    this.column = col;
    this.row = row;
    this.rotation = rot;
    this.id = id;
};

