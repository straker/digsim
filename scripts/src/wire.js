function Wire() {
    this.type = digsim.WIRE;
    this.next = [];
    this.prev = [];
    this.state = 0;
};

Wire.prototype = new Drawable();

// Draw a wire, 1 grid at a time
Wire.prototype.draw = function(context) {
    context.save();
    context.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    context.beginPath();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    
    context.moveTo(0, 0);
    context.lineTo(digsim.GRID_SIZE, 0);
    context.stroke();
    context.restore();
};