var react = require('react');
var loadScript = require('./loadScript');
var ZeroClipboard, client;

// callbacks waiting for ZeroClipboard to load
var waitingForScriptToLoad = [];

// these are the active elements using ZeroClipboardComponent
// each item in the array should be a [element, callback] pair
var copyEventHandlers = [];

// asynchronusly load ZeroClipboard from cdnjs
// it should automatically discover the SWF location using some clever hacks :-)
loadScript('//cdnjs.cloudflare.com/ajax/libs/zeroclipboard/2.1.5/ZeroClipboard.js', function(error){
    if (error) {
        console.error("Couldn't load zeroclipboard from CDNJS.  Copy will not work.  "
            + "Check your Content-Security-Policy.");
        console.error(error);
    }

    // grab it and free up the global
    ZeroClipboard = global.ZeroClipboard;
    delete global.ZeroClipboard;

    client = new ZeroClipboard();
    client.on('copy', function(){
        var activeElement = ZeroClipboard.activeElement();

        // find an event handler for this element
        // we use some so we don't continue looking after a match is found
        copyEventHandlers.some(function(xs){
            var element = xs[0], callback = xs[1];
            if (element === activeElement) {
                callback();
                return true;
            }
        });
    });

    // call the callbacks when ZeroClipboard is ready
    waitingForScriptToLoad.forEach(function(callback){
        callback();
    });
});

// <ReactZeroClipboard 
//   text="text to copy"
//   html="<b>html to copy</b>"
//   richText="{\\rtf1\\ansi\n{\\b rich text to copy}}"
//   getText={(Void -> String)}
//   getHtml={(Void -> String)}
//   getRichText={(Void -> String)}
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
        this.ready(function(){
            var el = this.getDOMNode();
            client.clip(el);

            // save our handler object so we can do a === check upon removal
            this.copyEventHandlerObject = [el, this.handleCopy];
            copyEventHandlers.push(this.copyEventHandlerObject);
        });
    },
    componentWillUnmount: function(){
        if (client) {
            client.unclip(this.getDOMNode());
        }

        // remove our event listener from the array
        for (var i=0; i<copyEventHandlers.length; i++) {
            if (copyEventHandlers[i] === this.copyEventHandlerObject) {
                copyEventHandlers.splice(i, 1);
                return;
            }
        }
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
        return react.DOM.div({className: this.props.className || ''}, this.props.children);
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
