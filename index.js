var React = require('react');
var createReactClass = require('create-react-class');
var ReactDOM = require('react-dom');
var loadScript = require('./loadScript');
var ZeroClipboard, client;

// callbacks waiting for ZeroClipboard to load
var waitingForScriptToLoad = [];

// these are the active elements using ZeroClipboardComponent
// each item in the array should be a [element, callback] pair
var eventHandlers = {
    copy: [],
    afterCopy: [],
    error: [],
    ready: []
};

var ZERO_CLIPBOARD_SOURCE = '//cdnjs.cloudflare.com/ajax/libs/zeroclipboard/2.2.0/ZeroClipboard';
var globalConfig = {
    swfPath: '//cdnjs.cloudflare.com/ajax/libs/zeroclipboard/2.2.0/ZeroClipboard.swf',
    // load zeroclipboard from CDN
    // in production we want the minified version
    jsPath: process.env.NODE_ENV === 'production' ? ZERO_CLIPBOARD_SOURCE + '.min.js' : ZERO_CLIPBOARD_SOURCE + '.js'
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
    onError: 'error',
    onReady: 'ready'
};

var readyEventHasHappened = false;

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

    ZeroClipboard.config({
        swfPath: globalConfig.swfPath
    });

    client = new ZeroClipboard();

    var handleEvent = function(eventName){
        client.on(eventName, function(event){
            // ready has no active element
            if (eventName === 'ready') {
                eventHandlers[eventName].forEach(function(xs){
                    xs[1](event);
                });

                readyEventHasHappened = true;
                return;
            }

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

    client.on("ready", function() {
        // call the callbacks when ZeroClipboard is ready
        // these are set in ReactZeroClipboard::componentDidMount
        waitingForScriptToLoad.forEach(function(callback){
            callback();
        });
    });
};

var findOrLoadWasCalled = false;
function findOrLoadZeroClipboard(){
    if (findOrLoadWasCalled) return;
    findOrLoadWasCalled = true;

    if (global.ZeroClipboard) {
        handleZeroClipLoad(null);
    }
    else {
        loadScript(globalConfig.jsPath, handleZeroClipLoad);
    }
}

function setUserDefinedSwfPath(path){
  globalConfig = Object.assign(globalConfig, {swfPath: path})
}

// <ReactZeroClipboard
//   text="text to copy"
//   html="<b>html to copy</b>"
//   richText="{\\rtf1\\ansi\n{\\b rich text to copy}}"
//   swfPath="http://user_defined_cdn_path/ZeroClipboard.swf"
//   getText={(Void -> String)}
//   getHtml={(Void -> String)}
//   getRichText={(Void -> String)}
//
//   onCopy={(Event -> Void)}
//   onAfterCopy={(Event -> Void)}
//   onErrorCopy={(Error -> Void)}
//
//   onReady={(Event -> Void)}
// />
var ReactZeroClipboard = createReactClass({
    ready: function(cb){
        if (null != this.props.swfPath) {
          setUserDefinedSwfPath(this.props.swfPath);
        }

        findOrLoadZeroClipboard();

        if (client) {
            // nextTick guarentees asynchronus execution
            if (typeof process !== 'undefined' && process.nextTick) {
              process.nextTick(cb.bind(this));
            } else if (typeof setImmediate === 'function') {
              setImmediate(cb.bind(this));
            } else {
              setTimeout(cb.bind(this), 0);
            }
        }
        else {
            waitingForScriptToLoad.push(cb.bind(this));
        }
    },
    componentWillMount: function(){
        if (readyEventHasHappened && this.props.onReady) {
            this.props.onReady();
        }
    },
    componentDidMount: function(){
        // wait for ZeroClipboard to be ready, and then bind it to our element
        this.eventRemovers = [];
        this.ready(function(){
            if (!this.isMounted()) return;
            var el = ReactDOM.findDOMNode(this);
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
            client.unclip(ReactDOM.findDOMNode(this));
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
        return React.Children.only(this.props.children);
    }
});

ReactZeroClipboard.globalConfig = globalConfig;

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
