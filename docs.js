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

