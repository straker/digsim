/*******************************************************************************
 * Program: 
 *  placehoder.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  Outline of a placeholder object used to keep track of which grids have
 *  components in them 
 ******************************************************************************/
function Placeholder(id, col, row, size) {
    this.ref = id;
    this.posX = col;
    this.posY = row;
    this.size = size;
};