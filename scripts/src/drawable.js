function Drawable(col, row, rot) {
    this.id = 0;
    this.column = 0;
    this.row = 0;
    this.type = -1;
    this.rotation = 0;
    this.numInputs = 2;
    this.next = [];
    this.prev = [];
    this.state = 0;
    this.drawStatic = true;
};

Drawable.prototype.init = function (col, row, rot) {
    this.column = col;
    this.row = row;
    this.rotation = rot;
};

Drawable.prototype.passState = function(pState) {
    if (this.type === digsim.WIRE || 
        this.type === digsim.SWITCH || 
        this.type === digsim.LED) {
        this.state = pState;
        // To do: change color 
        for (iWire in this.next) {
            this.next[iWire].passState(pState);
        }
    }
    else { // always a gate
        this.computeLogic();
        this.next[0].passState(this.state);
    }
};

// Called when an object is dragged into place and connected with another
// object. 
Drawable.prototype.setNext = function(obj) {
    this.next.push(obj);
    obj.prev.push(this);
};

// Same here. Doubly linked list
Drawable.prototype.setPrev = function(obj) {
    this.prev.push(obj);
    obj.next.push(this);
};