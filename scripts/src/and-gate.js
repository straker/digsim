
function AND() {};
AND.prototype = new Drawable();

// Draws a generic gate... just a start.
Drawable.prototype.draw = function(numInputs, posX, posY) {
    digsim.staticContext.save();
    digsim.staticContext.translate(this.column * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    digsim.staticContext.beginPath();
    digsim.staticContext.fillStyle = '#FFFFFF';
    digsim.staticContext.lineWidth = 2;
    
    // Draw vertial line on gate (something else for an OR gate
    switch (numInputs)
    {
            // 2 or 3 inputs will require a length of 40px 
        case 2: 
        case 3: 
            digsim.staticContext.moveTo(0, 0);
            digsim.staticContext.strokeStyle = '#000000';
            digsim.staticContext.lineTo(digsim.GRID_SIZE * 2,  0);            
            digsim.staticContext.arc(digsim.GRID_SIZE * 2, digsim.GRID_SIZE * 2, digsim.GRID_SIZE * 2, -Math.PI/2, Math.PI/2);
            digsim.staticContext.lineTo(0,  digsim.GRID_SIZE * 4);            
            break;
            // 4 input gates require a length of 50px
        case 4:
            digsim.staticContext.moveTo(0, 0);
            digsim.staticContext.strokeStyle = '#000000';
            digsim.staticContext.lineTo(digsim.GRID_SIZE * 2,  0);            
            digsim.staticContext.arc(digsim.GRID_SIZE * 2.5, digsim.GRID_SIZE * 2.5, digsim.GRID_SIZE * 2.5, -Math.PI/2, Math.PI/2);
            digsim.staticContext.lineTo(0,  digsim.GRID_SIZE * 5);            

            //digsim.staticContext.lineTo(posX, posY + 50);
            break;
    }
    
    digsim.staticContext.closePath();
    digsim.staticContext.stroke();
    digsim.staticContext.fill();
    
    switch (numInputs)
    {
        case 2: 
        case 3:
    }
    digsim.staticContext.restore();
};

