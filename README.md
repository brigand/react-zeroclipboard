
## react-zeroclipboard

This is a wrapper around ZeroClipboard for use with React.  ZeroClipboard has a difficult to work with api
which is being abstracted from you.  This library...

*   asynchronusly loads zeroclipboard from cdnjs
*   handles mounting/unmounting of components
*   figures out which element was clicked
*   allows you to declare text/html/rtf, or pass a function which returns it dynamically

## Warning!

zero-clipboard uses flash which is being phased out across many browsers, and is sometimes buggy in the browsers that do support it. There have been reports of the plugin randomly not working, despite no significant changes to the plugin, and keeping the same zero-clipboard version.

If you're interested in solving this, your help is very much appreciated, and this section will be replaced with a big "thank you" for your work. Until then, using this plugin isn't recommended.

### Install

This is only available through npm, it should work with browserify or webpack.  It's compatible with react 0.13 and up.

```sh
npm install --save react-zeroclipboard
```

Or for react 0.11 and 0.12

```sh
npm install --save react-zeroclipboard@0.4
```

Also install react if you haven't already (of course).

### Usage

Here's a simple example:

```js
render: function(){
   return (
      <div>
         <p>Click the button to copy some text</p>
            <ReactZeroClipboard text="Hello, world!">
               <button>Copy</button>
            </ReactZeroClipboard>
      </div>
   )
}
```

The full api offers more flexibility.  If you provide e.g. html and text, they'll both be set and
the application you're pasting into decides which one to use.  Methods have higher priority than
the literal strings, if for some reason you pass both.

```js
<ReactZeroClipboard 
   text="text to copy"
   html="<b>html to copy</b>"
   richText="{\\rtf1\\ansi\n{\\b rich text to copy}}"
   getText={(Void -> String)}
   getHtml={(Void -> String)}
   getRichText={(Void -> String)}

   onCopy={(Event -> Void)}
   onAfterCopy={(Event -> Void)}
   onErrorCopy={(Error -> Void)}

   onReady={(Event -> Void)}

   // optional
   swfPath="http://user_defined_cdn_path/ZeroClipboard.swf"
/>
```

Here's an example where we copy the current url to the clipboard, both in plain text and a html anchor

If the user pastes this in their address bar they get the url, and if they paste it in gmail they get a nice link.

```js
render: function(){
   return (
      <div>
         <p>Copy a link to this page</p>
            <ReactZeroClipboard 
               getText={function(){ return location.href; }}
               getHtml={function(){ return '<a href="' + location.href + '">My Page</a>'; }}>
                  <button>Copy</button>
            </ReactZeroClipboard>
      </div>
   )
}
```

## I'm getting weird ZeroClipboard errors

Usually this is caused by flash weirdness and/or cdnjs where we pull ZeroClipboard from. You can work around this
by hosting ZeroClipboard and the swf yourself. Make sure the page and the two assets are either both http, or both
https. There's a copy of the swf in the assets directory of this repo.

To access it with webpack, configure a loader for swf files:

```js
{
  test: /\.swf$/g,
  loader: 'file-loader'
}
```

And then import the swf from this package.

```jsx
<ReactZeroClipboard swfPath={ require('react-zeroclipboard/assets/ZeroClipboard.swf') }>
```
