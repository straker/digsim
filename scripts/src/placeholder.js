/*****************************************************************************
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
 ****************************************************************************/
function Placeholder(id, col, row, endCol, endRow, connect, name) {
    this.ref = id;
    this.posX = col;
    this.posY = row;
    this.width = endCol;
    this.height = endRow;
    this.connectable = (typeof connect === 'undefined' ? true : connect);
    this.name = name;  // Special property for keeping track of where connections occur for DFF, JKFF, and MUX
};