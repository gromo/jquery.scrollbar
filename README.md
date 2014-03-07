<h1>jQuery Scrollbar</h1>

        Cross-browser CSS customizable scrollbar with advanced features:
        <ul>
            <li>Easy to use</li>
            <li>No fixed height or width</li>
            <li>Responsive design support</li>
            <li>CSS customizable</li>
            <li>Standard scroll behavior</li>
            <li>Vertical, horizontal or both scrollbars</li>
            <li>Automatically reinitialize scrollbar</li>
            <li>External scrollbars support</li>
            <li>Browser support: IE7+, Firefox, Opera, Chrome, Safari</li>
        </ul>

<h2>Demo</h2>
<a href="demo/simple.html">Simple</a><br/>
<a href="demo/advanced.html">Advanced</a><br/>







Please, note that original element is wrapped with scroll wrapper.

Limits & Recommendations:
    - scrollable element should not have paddings, margins, left/top values:
        if you need external space, wrap element into another element with padding
        if you need internal space, insert another element with padding inside your element
    - do not use max-height in IE8 - it crashes browser renderer (official bug)
 

 
 Versions updates:

 1.6
  - Fixed bug with 1px shift in >=IE9

 1.5
  - 

 1.4
  - 

 1.3
  - improved scroll simulation when mouse is over scrollbar
  - fix bug with WebKit-based (Chrome, Safari) browsers text selection