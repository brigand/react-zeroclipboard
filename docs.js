/** @jsx React.DOM */
var React = require('react');
var ReactZeroClipboard = require('./');

var npmInstallCommand = "npm install react-zeroclipboard";
npmInstallLink = React.createClass({
    render: function(){
        return (
        <div className="input-group">
            <input className="form-control input-lg" value={npmInstallCommand} />      
            <ReactZeroClipboard text={npmInstallCommand} className="input-group-addon">
                Copy
            </ReactZeroClipboard>
        </div>
        );
    }
});
React.renderComponent(npmInstallLink(), document.getElementById("npm-install-link-target"));



var list = [
    "apples", "oranges", "bananas"
];

var multiTypeDemo = React.createClass({
    getText: function(){
        return list.map(function(x){ return "- " + x }).join("\n");
    },
    getHtml: function(){
        var items = list.map(function(x, i){
            if (i % 2) {
                return "<li>" + x + "</li>" ;    
            }
            else {
                return "<li class='even'>" + x + "</li>" ;
            }
            
        });
        return "<ul>" + items.join('\n') + "<ul>";
    },
    render: function(){
        return (
        <div>
            <ReactZeroClipboard getText={this.getText} getHtml={this.getHtml}>
                <div className="btn">Copy List</div>
            </ReactZeroClipboard>
            <div className="row">
                <div className="col-xs-6">
                    <textarea defaultValue="" placeholder="this is a textarea" />
                </div>
                <div className="col-xs-6">
                    <div contentEditable />
                </div>
            </div>
        </div>
        );
    }
});



React.renderComponent(multiTypeDemo(), document.getElementById("list-demo-target"));

var eventsDemo = React.createClass({
    getInitialState: function(){
        return {
            logs: [],
        };
    },
    getLogger: function(eventName){
        return function(event){
            var logs = this.state.logs.concat([{name: eventName, event: event}]);
            this.setState({logs: logs});
        }.bind(this);
    },
    render: function(){
        var styl = {
            padding: "10px", 
            border: "1px solid #eee",
            borderRadius: "7px"
        };
        
        return (
        <div>
            <div><ReactZeroClipboard text="example text" 
                onCopy={this.getLogger("copy")}
                onAfterCopy={this.getLogger("afterCopy")}
                onError={this.getLogger("error")}
                onReady={this.getLogger("ready")}
                >Click To Copy</ReactZeroClipboard></div>
            <div style={styl}><ol>{this.state.logs.map(function(log, i){
                var out = {};
                
                for (var key in log.event) {
                    if (log.event[key] instanceof window.Element) {
                        out[key] = String(log.event[key]);
                    }
                    else {
                        out[key] = log.event[key];
                    }
                }


                return <li key={i}>{log.name}: <pre>{JSON.stringify(out, null, 4)}</pre></li>
            })}</ol></div>
        </div>
        );
    }
});

React.renderComponent(eventsDemo(), document.getElementById("events-demo-target"));
