function Drawable() {
    this.column = 2;
    this.row = 2;
    this.type = "";
    this.rotation = 0;
    this.numInputs = 2;
    this.next = [];
    this.prev = [];
    this.state = 0;
};

Drawable.prototype.draw = function() {
};

Drawable.prototype.setNext = function(pState) {
    if (this.type === digsim.WIRE || 
        this.type === digsim.SWITCH || 
        this.type === digsim.LED) {
        // To do: change color 
        for (iWire in this.next) {
            this.next[iWire].setNext(pState);
        }
            
    }
    else { // always a gate
        this.next.setNext(this.computeLogic(pState));
    }
        
    
};