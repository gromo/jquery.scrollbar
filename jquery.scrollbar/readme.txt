jQuery Custom Scrollbar plugin

Cross-browser fully CSS customizable scrollbar realization.

This plugin is the wrapper for standard scroll mechanism. It means that it supports all native scroll events.

Features:
    - All native scroll events supported
    - Fully CSS customizable
    - Browser support: IE7+, FF, Opera, Chrome, Safari
    - Scroll size auto calculation or fixed with CSS
    - Auto update scrolls if content changed or resized
    - Scrolls can be located in any place inside or outside of container
    - Custom scrollbar HTML/CSS support
    - Ignore scrollbar initialization on mobile devices
    - Same behaviour in all supported browsers







Please, note that original element is wrapped with scroll wrapper.

Limits & Recommendations:
    - scrollable element should not have paddings, margins, left/top values:
        if you need external space, wrap element into another element with padding
        if you need internal space, insert another element with padding inside your element
    - do not use max-height in IE8 - it crashes browser renderer (official bug)
 

 
 Versions updates:
 
 1.3
  - improved scroll simulation when mouse is over scrollbar
  - fix bug with WebKit-based (Chrome, Safari) browsers text selection