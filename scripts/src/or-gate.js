function drawEllipse(centerX, centerY, width, height) {
	
    context.beginPath();
    
    context.moveTo(centerX, centerY - height/2); // A1
    
    context.bezierCurveTo(
                          centerX + width/2, centerY - height/2, // C1
                          centerX + width/2, centerY + height/2, // C2
                          centerX, centerY + height/2); // A2
    
    context.bezierCurveTo(
                          centerX - width/2, centerY + height/2, // C3
                          centerX - width/2, centerY - height/2, // C4
                          centerX, centerY - height/2); // A1
    
    context.fillStyle = "red";
    context.fill();
    context.closePath();	
}