/*****************************************************************************
 * Program:
 *  placeholder.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  Outline of a placeholder object used to keep track of which grids have
 *  components in them
 * @deprecated
 ****************************************************************************/

/*****************************************************************************
 * Placeholder
 * @constructor
 * @param {number}  id     - Unique id of the component whose placeholder this is.
 * @param {boolean} con    - If the placeholder can be used for determining connections.
 * @param {number}  name   - Name of the connection (DFF)
 ****************************************************************************/
function Placeholder(ref, connectable, name) {
    this.ref         = ref;
    this.connectable = (typeof connectable === 'undefined' ? true : connectable);
    this.name        = name;
}