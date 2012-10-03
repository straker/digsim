function Wire() {
    this.type = digsim.WIRE;
    this.next = [];
    this.prev = [];
    this.state = 0;
};

Wire.prototype = new Drawable();

// Draw a wire, 1 grid at a time
Wire.prototype.draw = function() {
    digsim.staticContext.save();
    digsim.staticContext.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    digsim.staticContext.beginPath();
    digsim.staticContext.strokeStyle = '#000000';
    digsim.staticContext.lineWidth = 2;
    
    digsim.staticContext.moveTo(0, 0);
    digsim.staticContext.lineTo(digsim.GRID_SIZE, 0);
    digsim.staticContext.stroke();
    digsim.staticContext.restore();
};