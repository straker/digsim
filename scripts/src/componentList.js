/******************************************************************************
 * Program:
 *  componentList.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *
 *****************************************************************************/

/*****************************************************************************
 * ComponentList
 *  Object for handling the storing of Components and connections between them.
 * @constructor
 * @param {number} id - Id of the Component that owns this list.
 ****************************************************************************/
function ComponentList(id) {
    // Private dictionary of Components indexed by their id. Also stores at what connection index a Component is connected.
    // Objects are just pointers so storing an object is only storing a pointer of 4 bytes
    // http://stackoverflow.com/questions/4740593/how-is-memory-handled-with-javascript-objects
    var components = {};

    /*****************************************************************************
     * ADD
     *  Add a Component to the dictionary.
     * @param {Component} comp     - Component to add.
     * @param {number}    conIndex - Connection index.
     * @param {boolean}   addBack  - Add this id to the Component.
     ****************************************************************************/
    this.add = function(comp, conIndex, addBack) {
        if (typeof comp === 'object' && !components[comp.id]) {
            components[comp.id] = comp;

            if (typeof conIndex !== 'undefined')
                components['connection_'+comp.id] = conIndex;

            // Add the Component to comp
            if (addBack)
                comp.checkConnections();
        }
    };

    /*****************************************************************************
     * REMOVE
     *  Remove a Component from the dictionary.
     * @param {Component} comp       - Component to remove.
     * @param {boolean}   removeBack - Remove this id from the Component. @default false
     ****************************************************************************/
    this.remove = function(comp, removeBack) {
        if (typeof comp === 'object' && components[comp.id]) {
            delete components[comp.id];

            if (components['connection_'+comp.id])
                delete components['connection_'+comp.id];

            // Remove this Component from the passed Component as well
            if (removeBack) {
                if (comp.inputs)
                    comp.inputs.removeId(id);
                if (comp.outputs)
                    comp.outputs.removeId(id);
                if (comp.connections)
                    comp.connections.removeId(id);
            }
        }
    };

    /*****************************************************************************
     * REMOVE ID
     *  Remove a Component from the dictionary by Component id.
     * @param {number}  compId     - Id of the Component to remove.
     * @param {boolean} removeBack - Remove this id from the Component. @default false
     ****************************************************************************/
    this.removeId = function(compId, removeBack) {
        if ((typeof compId === 'number' || typeof compId === 'string') && components[compId]) {
            var comp = components[compId];
            delete components[compId];

            if (components['connection_'+compId])
                delete components['connection_'+compId];

            // Remove this Component from the passed Component as well
            if (removeBack) {
                if (comp.inputs)
                    comp.inputs.removeId(id);
                if (comp.outputs)
                    comp.outputs.removeId(id);
                if (comp.connections)
                    comp.connections.removeId(id);
            }
        }
    };

    /*****************************************************************************
     * GET
     *  Returns an array of Components that are in the components dictionary.
     * @return {Array} Array of Components.
     ****************************************************************************/
    this.get = function() {
        var comps = [];

        for (var compId in components) {
            // Only return components and not their connection index
            if (components.hasOwnProperty(compId) && compId[0] !== 'c') {
                comps.push(components[compId]);
            }
        }

        return comps;
    };

    /*****************************************************************************
     * GET COMPONENT
     *  Return the Component that matches the id.
     * @param {number} compId - Id of the Component to get.
     * @return {Components} Found Component or undefined if not in dictionary.
     ****************************************************************************/
    this.getComponent = function(compId) {
        if ((typeof compId === 'number' || typeof compId === 'string') && components[compId])
            return components[compId];
        else
            return undefined;
    };

    /*****************************************************************************
     * GET CONNECTION INDEX
     *  Return the Component index for the component.
     * @param {number} comp - Component to get the connection index for.
     * @return {number} Connection index.
     ****************************************************************************/
    this.getConnectionIndex = function(comp) {
        if (typeof comp === 'object' && typeof components['connection_'+comp.id] !== 'undefined')
            return components['connection_'+comp.id];
        else
            return undefined;
    };

    /*****************************************************************************
     * GET CONNECTION COMPONENT
     *  Return the Components of the connection index.
     * @param {number} index - Connection index.
     * @return {Array} Array of Components that match the connection index.
     ****************************************************************************/
    this.getConnectionComponents = function(index) {
        var comps = [];

        if (typeof index === 'number' || typeof index === 'string') {
            for (var i in components) {
                if (components.hasOwnProperty(i)) {
                    if (components[i] === index)
                        comps.push(components[ i.substr(i.indexOf("_") + 1) ]);
                }
            }
        }

        return comps;
    };

    /*****************************************************************************
     * CONTAINS
     *  Returns True if the Component is in the components dictionary.
     * @param {Component} comp - Component to look for.
     * @return {boolean}
     ****************************************************************************/
    this.contains = function(comp) {
        if (typeof comp === 'object' && components[comp.id])
            return true;
        else
            return false;
    };

    /*****************************************************************************
     * LENGTH
     *  Returns the length of the components dictionary.
     * @return {number} Number of items in the components dictionary.
     ****************************************************************************/
    this.length = function() {
       return Object.keys(components).length;
    };

    /*****************************************************************************
     * CLEAR
     *  Clears the dictionary and removes all components to the Component.
     * @param {boolean} removeBack - Remove this id from the Component. @default true
     ****************************************************************************/
    this.clear = function(removeBack) {
        removeBack = (typeof removeBack === 'undefined' ? true : removeBack);

        for (var compId in components) {
            if (components.hasOwnProperty(compId)) {
                this.removeId(compId, removeBack);
            }
        }
    };
}