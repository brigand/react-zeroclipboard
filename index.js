var react = require('react');
var loadScript = require('./loadScript');
var ZeroClipboard, client;

// callbacks waiting for ZeroClipboard to load
var waitingForScriptToLoad = [];

// these are the active elements using ZeroClipboardComponent
// each item in the array should be a [element, callback] pair
var eventHandlers = {
    copy: [],
    afterCopy: [],
    error: []
};

// add a listener, and returns a remover
var addZeroListener = function(event, el, fn){
    eventHandlers[event].push([el, fn]);
    return function(){
        var handlers = eventHandlers[event];
        for (var i=0; i<handlers.length; i++) {
            if (handlers[i][0] === el) {
                // mutate the array to remove the listener
                handlers.splice(i, 1);
                return;
            }
        }
    };
};

var propToEvent = {
    onCopy: 'copy',
    onAfterCopy: 'afterCopy',
    onError: 'error'
};

// asynchronusly load ZeroClipboard from cdnjs
// it should automatically discover the SWF location using some clever hacks :-)
var handleZeroClipLoad = function(error){
    if (error) {
        console.error("Couldn't load zeroclipboard from CDNJS.  Copy will not work.  "
            + "Check your Content-Security-Policy.");
        console.error(error);
    }

    // grab it and free up the global
    ZeroClipboard = global.ZeroClipboard;
    delete global.ZeroClipboard;

    client = new ZeroClipboard();

    var handleEvent = function(eventName){
        client.on(eventName, function(event){
            var activeElement = ZeroClipboard.activeElement();

            // find an event handler for this element
            // we use some so we don't continue looking after a match is found
            eventHandlers[eventName].some(function(xs){
                var element = xs[0], callback = xs[1];
                if (element === activeElement) {
                    callback(event);
                    return true;
                }
            });
        });
    };

    for (var eventName in eventHandlers) {
        handleEvent(eventName);
    }

    // call the callbacks when ZeroClipboard is ready
    // these are set in ReactZeroClipboard::componentDidMount
    waitingForScriptToLoad.forEach(function(callback){
        callback();
    });
};

if (global.ZeroClipboard) {
    handleZeroClipLoad(null);
}
else {
    loadScript('//cdnjs.cloudflare.com/ajax/libs/zeroclipboard/2.1.5/ZeroClipboard.js', handleZeroClipLoad);
}

// <ReactZeroClipboard 
//   text="text to copy"
//   html="<b>html to copy</b>"
//   richText="{\\rtf1\\ansi\n{\\b rich text to copy}}"
//   getText={(Void -> String)}
//   getHtml={(Void -> String)}
//   getRichText={(Void -> String)}
//
//   onCopy={(Event -> Void)}
//   onAfterCopy={(Event -> Void)}
//   onErrorCopy={(Error -> Void)}
// />
var ReactZeroClipboard = react.createClass({
    ready: function(cb){
        if (client) {
            // nextTick guarentees asynchronus execution
            process.nextTick(cb.bind(this));
        }
        else {
            waitingForScriptToLoad.push(cb.bind(this));
        }
    },
    componentDidMount: function(){
        // wait for ZeroClipboard to be ready, and then bind it to our element
        this.eventRemovers = [];
        this.ready(function(){
            var el = this.getDOMNode();
            client.clip(el);

            // translate our props to ZeroClipboard events, and add them to
            // our listeners
            for (var prop in this.props) {
                var eventName = propToEvent[prop];

                if (eventName && typeof this.props[prop] === "function") {
                    var remover = addZeroListener(eventName, el, this.props[prop]);
                    this.eventRemovers.push(remover);
                }
            }

            var remover = addZeroListener("copy", el, this.handleCopy);
            this.eventRemovers.push(remover);
        });
    },
    componentWillUnmount: function(){
        if (client) {
            client.unclip(this.getDOMNode());
        }

        // remove our event listener
        this.eventRemovers.forEach(function(fn){ fn(); });
    },
    handleCopy: function(){
        var p = this.props;

        // grab or calculate the different data types
        var text = result(p.getText || p.text);
        var html = result(p.getHtml || p.html);
        var richText = result(p.getRichText || p.richText);
        
        // give ourselves a fresh slate and then set
        // any provided data types
        client.clearData();
        richText != null && client.setRichText(richText);
        html     != null && client.setHtml(html);
        text     != null && client.setText(text);
    },
    render: function(){
        var span = react.createFactory ? react.createFactory('span') : react.DOM.span;
        return span({
            className: this.props.className || '',
            style: {cursor: "pointer"}
        }, this.props.children);
    }
});
module.exports = ReactZeroClipboard;

function result(fnOrValue) {
    if (typeof fnOrValue === "function") {
        // call it if it's a function
        return fnOrValue();
    }
    else {
        // just return it as is
        return fnOrValue;
    }
}
