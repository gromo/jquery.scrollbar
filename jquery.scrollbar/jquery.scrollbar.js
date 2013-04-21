/**
 * jQuery Custom Scrollbar plugin
 *
 * Copyright 2013, Yuriy Khabarov
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * If you found bug, please contact me via email <13real008@gmail.com>
 *
 * @author Yuriy Khabarov aka Gromo
 * @version 1.2
 * @url https://github.com/gromo/dslib/tree/master/jquery.scrollbar
 *
 * TODO:
 *  - refactor scroll emulate on scrollbar mousewheel
 *  - fix content scrolling on text selection in webkit-based browser
 */
;
(function($, doc, win){

    // INIT FLAGS & VARIABLES
    var browser = {
        "mobile": /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent),
        "webkit": win.WebKitPoint ? true : false,

        "log": function(data, toString){
            var output = data;
            if(toString && typeof data != "string"){
                output = [];
                $.each(data, function(i, v){
                    output.push('"' + i + '": ' + v);
                });
                output = output.join(", ");
            }
            if(win.console && win.console.log){
                win.console.log(output);
            }
        },
        "scroll": null
    };
    var debug = false;
    var px = "px";
    var scrolls = [];


    var defaults = {
        "autoScrollSize": true,     // automatically calculate scrollsize
        "duration": 200,            // scroll animate duration in ms
        "ignoreMobile": true,       // ignore mobile devices
        "scrollStep": 30,           // scroll step for scrollbar arrows
        "showArrows": true,         // add class to show arrows
        "type":"advanced",          // [advanced|simple] scroll html type

        "scrollx": null,            // horizontal scroll element
        "scrolly": null,            // vertical scroll element

        "onInit": null,             // callback function on init/resize
        "onDestroy": null           // callback function on destroy
    };


    var customScrollbar = function(container, options){

        if(!browser.scroll){
            browser.scroll = getBrowserScrollSize();
            browser.log("Custom Scrollbar v1.2");
        }

        this.container = container;
        this.options = $.extend({}, defaults);
        this.scrollx = {};
        this.scrolly = {};

        if(!(browser.mobile && this.options.ignoreMobile))
            this.init(options);
    }

    customScrollbar.prototype = {

        destroy: function(){

            if(!this.wrapper){
                return;
            }

            // INIT VARIABLES
            var scrollLeft = this.container.scrollLeft();
            var scrollTop  = this.container.scrollTop();

            this.container.insertBefore(this.wrapper).css({
                "height":"",
                "margin":""
            })
            .removeClass("scroll-content")
            .removeClass("scroll-scrollx_show")
            .removeClass("scroll-scrolly_show")
            .off(".scrollbar")
            .scrollLeft(scrollLeft)
            .scrollTop(scrollTop);

            this.scrollx.scrollbar.hide().find("div").andSelf().off(".scrollbar");
            this.scrolly.scrollbar.hide().find("div").andSelf().off(".scrollbar");

            this.wrapper.remove();

            $(doc).add("body").off(".scrollbar");

            if($.isFunction(this.options.onDestroy))
                this.options.onDestroy.apply(this, [this.container]);
        },



        getScrollbar: function(d){

            var scrollbar = this.options["scroll" + d];
            var html = {
                "advanced":
                '<div class="scroll-arrow scroll-arrow_less"></div>' +
                '<div class="scroll-arrow scroll-arrow_more"></div>' +
                '<div class="scroll-element_outer">' +
                '    <div class="scroll-element_size"></div>' + // required! used for scrollbar size calculation !
                '    <div class="scroll-element_inner-wrapper">' +
                '        <div class="scroll-element_inner">'  + // used for handling scrollbar click
                '            <div class="scroll-element_inner-bottom"></div>' +
                '        </div>' +
                '    </div>' +
                '    <div class="scroll-bar">' +
                '        <div class="scroll-bar_body">' +
                '            <div class="scroll-bar_body-inner"></div>' +
                '        </div>' +
                '        <div class="scroll-bar_bottom"></div>' +
                '        <div class="scroll-bar_center"></div>' +
                '    </div>' +
                '</div>',

                "simple":
                '<div class="scroll-element_outer">' +
            '    <div class="scroll-element_size"></div>'  + // required! used for scrollbar size calculation !
            '    <div class="scroll-element_inner"></div>' + // used for handling scrollbar click
            '    <div class="scroll-bar">' +
            '    </div>' +
            '</div>'
            };
            var type = html[this.options.type] ? this.options.type : "advanced";

            if(scrollbar){
                if(typeof(scrollbar) == "string"){
                    scrollbar = $(scrollbar).appendTo(this.wrapper);
                } else {
                    scrollbar = $(scrollbar);
                }
            } else {
                scrollbar = $("<div>").addClass("scroll-element").html(html[type]).appendTo(this.wrapper);
            }

            if(this.options.showArrows){
                scrollbar.addClass("scroll-element_show-arrows");
            }

            return scrollbar.addClass("scroll-" + d);
        },



        init: function(options){

            // INIT VARIABLES
            var S = this;

            var c = this.container;
            var o = $.extend(this.options, options);
            var s = {
                "x": this.scrollx,
                "y": this.scrolly
            };
            var w = this.wrapper;

            var initScroll = {
                "scrollLeft": c.scrollLeft(),
                "scrollTop": c.scrollTop()
            };

            // INIT SCROLL CONTAINER
            if(!w){
                this.wrapper = w = c.wrap($("<div>").css({
                    "position": (c.css("position") == "absolute") ? "absolute" : "relative"
                }).addClass("scroll-wrapper").addClass(c.attr("class"))).parent();

                c.addClass("scroll-content").css({
                    "height":"auto",
                    "margin-bottom": browser.scroll.height * -1 + px,
                    "margin-right":  browser.scroll.width  * -1 + px

                }).on("scroll.scrollbar", function(){
                    s.x.isVisible && s.x.scroller.css("left", c.scrollLeft() * s.x.kx + px);
                    s.y.isVisible && s.y.scroller.css("top",  c.scrollTop()  * s.y.kx + px);
                });
            } else {
                c.css({
                    "height":"auto"
                });
            }

            // INIT SCROLLBARS & RECALCULATE SIZES
            $.each(s, function(d, scrollx){

                var scrollCallback = null;
                var scrollOffset = (d == "x") ? "scrollLeft" : "scrollTop";
                var scrollStep = o.scrollStep;
                var scrollTo = function(){
                    var currentOffset = c[scrollOffset]();
                    c[scrollOffset](currentOffset + scrollStep);
                    if(c[scrollOffset]() == currentOffset && scrollCallback){
                        scrollCallback();
                    }
                }

                if(!scrollx.scrollbar){

                    scrollx.scrollbar = S.getScrollbar(d);
                    scrollx.scroller = scrollx.scrollbar.find(".scroll-bar");

                    var onmousewheel = function(event){
                        var delta = event.originalEvent.wheelDelta || event.originalEvent.detail * -20;
                        c[scrollOffset](c[scrollOffset]() - delta).scroll();
                        event.preventDefault();
                    };
                    if(d == 'y')
                        scrollx.scrollbar.on({
                            "DOMMouseScroll.scrollbar": onmousewheel,
                            "mousewheel.scrollbar": onmousewheel
                        });

                    // HANDLE ARROWS & SCROLLBAR MOUSEDOWN EVENT
                    scrollx.scrollbar.find(".scroll-arrow, .scroll-element_inner")
                    .on("mousedown.scrollbar", function(event){

                        var isForward = true;

                        if($(this).hasClass('scroll-arrow')){
                            isForward = $(this).hasClass("scroll-arrow_more");
                            scrollStep = isForward ? o.scrollStep : o.scrollStep * -1;
                        } else {
                            isForward = event[(d == "x") ? "pageX" : "pageY"] >
                                scrollx.scroller.offset()[(d == "x") ? "left" : "top"];
                            scrollStep = isForward ? scrollx.visible : scrollx.visible * -1;
                        }

                        var timeout = 0, timer = 0;
                        scrollCallback = function(){
                            clearInterval(timer);
                            clearTimeout(timeout);
                            timeout = 0;
                            timer = 0;
                        };

                        timeout = setTimeout(function(){
                            timer = setInterval(scrollTo, 40);
                        }, o.duration + 100);

                        var animateTo = {};
                        animateTo[scrollOffset] = c[scrollOffset]() + scrollStep;
                        c.animate(animateTo, o.duration);

                        return handleMouseDown(scrollCallback, event);
                    });

                    // HANDLE SCROLLBAR DRAG & DROP
                    scrollx.scroller.on("mousedown.scrollbar", function(event){

                        var eventPosition = event[(d == "x")? "pageX" : "pageY"];
                        var initOffset = c[scrollOffset]();

                        scrollx.scrollbar.addClass("scroll-draggable");

                        $(doc).on("mousemove.scrollbar", function(event){
                            var diff = parseInt((event[(d == "x")? "pageX" : "pageY"] - eventPosition) / scrollx.kx, 10);
                            c[scrollOffset](initOffset + (diff));
                        });

                        return handleMouseDown(function(){
                            scrollx.scrollbar.removeClass("scroll-draggable");
                        }, event);
                    });
                }
            });

            // remove classes & reset applied styles
            $.each(s, function(d, scrollx){
                var scrollClass = "scroll-scroll" + d + "_show";
                var scrolly = (d == "x") ? s.y : s.x;

                scrollx.scrollbar.hide();
                scrolly.scrollbar.removeClass(scrollClass);
                c.removeClass(scrollClass);
            });

            // calculate init sizes
            $.each(s, function(d, scrollx){
                $.extend(scrollx, (d == "x") ? {
                    "offset": parseInt(c.css("left"), 10) || 0,
                    "size": c.prop("scrollWidth"),
                    "visible": w.width()
                } : {
                    "offset": parseInt(c.css("top"), 10) || 0,
                    "size": c.prop("scrollHeight"),
                    "visible": w.height()
                });
            });


            function updateScroll(d, scrollx){

                var scrollClass = "scroll-scroll" + d + "_show";
                var scrolly = (d == "x") ? s.y : s.x;
                var offset = parseInt(c.css((d == "x") ? "left" : "top"), 10) || 0;

                var AreaSize = scrollx.size;
                var AreaVisible = scrollx.visible + offset;

                scrollx.isVisible = AreaSize > AreaVisible;
                if(scrollx.isVisible){
                    scrollx.scrollbar.show();
                    scrolly.scrollbar.addClass(scrollClass);
                    c.addClass(scrollClass);
                } else {
                    scrollx.scrollbar.hide();
                    scrolly.scrollbar.removeClass(scrollClass);
                    c.removeClass(scrollClass);
                }

                if(d == "y"){
                    c.css("height", scrollx.isVisible ? (AreaVisible + browser.scroll.height) + px : "auto");
                }

                if(s.x.size != c.prop("scrollWidth")
                    || s.y.size != c.prop("scrollHeight")
                    || s.x.visible != w.width()
                    || s.y.visible != w.height()
                    || s.x.offset  != (parseInt(c.css("left"), 10) || 0)
                    || s.y.offset  != (parseInt(c.css("top"), 10) || 0)
                    ){
                    $.each(s, function(d, scrollx){
                        $.extend(scrollx, (d == "x") ? {
                            "offset": parseInt(c.css("left"), 10) || 0,
                            "size": c.prop("scrollWidth"),
                            "visible": w.width()
                        } : {
                            "offset": parseInt(c.css("top"), 10) || 0,
                            "size": c.prop("scrollHeight"),
                            "visible": w.height()
                        });
                    });
                    updateScroll(d == "x" ? "y" : "x", scrolly);
                }
            }
            $.each(s, updateScroll);


            // calculate scroll size
            $.each(s, function(d, scrollx){

                var cssOffset = (d == "x") ? "left" : "top";
                var cssSize = (d == "x") ? "width" : "height";
                var offset = parseInt(c.css(cssOffset), 10) || 0;

                var AreaSize = scrollx.size;
                var AreaVisible = scrollx.visible + offset;

                // set scroll size to wrapper height/width
                scrollx.scrollbar.css(cssSize, scrollx.visible + px);

                var scrollSize = scrollx.scrollbar.find(".scroll-element_size");
                scrollSize = scrollSize[cssSize]() + parseInt(scrollSize.css(cssOffset) || 0, 10);

                if(o.autoScrollSize){
                    scrollx.scrollbarSize = parseInt(scrollSize * AreaVisible / AreaSize, 10);
                    scrollx.scroller.css(cssSize, scrollx.scrollbarSize + px);
                }

                scrollx.scrollbarSize = parseInt(scrollx.scroller.css(cssSize), 10);
                scrollx.kx = ((scrollSize - scrollx.scrollbarSize) / (AreaSize - AreaVisible)) || 1;
            });

            if($.isFunction(o.onInit))
                o.onInit.apply(this, [c]);

            c.scrollLeft(initScroll.scrollLeft).scrollTop(initScroll.scrollTop).trigger("scroll");
        }
    };

    /*
     * Extend jQuery as plugin
     * @param {object|string} options or command to execute
     * @param {object|array} additional arguments as array []
     */
    $.fn.scrollbar = function(options, args){

        var toReturn = this;

        if(options == "get")
            toReturn = null;

        this.each(function() {

            var container = $(this);

            if(container.hasClass("scroll-wrapper")
                || container.get(0).nodeName == "body"){
                return;
            }

            var instance = container.data("scrollbar");
            if(instance){
                if(options === "get"){
                    toReturn = instance;
                    return false;
                }

                options = (typeof options == "string" && instance[options]) ? options : "init";
                instance[options].apply(instance, $.isArray(args) ? args : []);

                if(options == "destroy"){
                    container.removeData("scrollbar");
                    while($.inArray(instance, scrolls) >= 0)
                        scrolls.splice($.inArray(instance, scrolls), 1);
                }
            } else {
                if(typeof options != "string"){
                    instance = new customScrollbar(container, options);
                    container.data("scrollbar", instance);
                    scrolls.push(instance);
                }
            }
        });

        return toReturn;
    };

    /* CHECK IF SCROLL CONTENT IS UPDATED */
    var timerCounter = 0;
    var timer = setInterval(function(){
        var i, c, s, w, x, y;
        for(i=0; i<scrolls.length; i++){
            s = scrolls[i];
            c = s.container;
            w = s.wrapper;
            x = s.scrollx;
            y = s.scrolly;
            if(w.is(":visible") &&
                (c.prop("scrollWidth") != x.size
                    || c.prop("scrollHeight") != y.size
                    || w.width()  != x.visible
                    || w.height() != y.visible
                    )){
                s.init();

                if(debug){
                    browser.log({
                        "scrollHeight": c.prop("scrollHeight") + ":" + s.scrolly.size,
                        "scrollWidth": c.prop("scrollWidth") + ":" + s.scrollx.size,
                        "visibleHeight": w.height() + ":" + s.scrolly.visible,
                        "visibleWidth": w.width() + ":" + s.scrollx.visible
                    }, true);

                    if(timerCounter++ > 100){
                        browser.log("Scroll udpates exceed 100");
                        clearInterval(timer);
                    }
                }
            }
        }
    }, 300);


    /* ADDITIONAL FUNCTIONS */
    function getBrowserScrollSize(){

        var css = {
            "border":"none",
            "height":"100px",
            "margin":"0",
            "padding":"0",
            "width":"100px"
        };

        var inner = $("<div>").css($.extend({}, css));
        var outer = $("<div>").css($.extend({
            "background":"#F00",
            "left":"-200px",
            "overflow":"scroll",
            "position":"absolute",
            "top":"-200px"
        }, css)).append(inner).appendTo("body")
        .scrollLeft(inner.width())
        .scrollTop(inner.height());

        var scrollSize = {
            "height": (outer.offset().top - inner.offset().top) || 0,
            "width": (outer.offset().left - inner.offset().left) || 0
        };

        if(browser.webkit){
            scrollSize.height = 0;
            scrollSize.width = 0;
        }

        outer.remove();
        return scrollSize;
    }

    function handleMouseDown(callback, event){
        $(doc).on({
            "blur.scrollbar": function(){
                $(doc).add('body').off('.scrollbar');
                callback();
            },
            "dragstart.scrollbar": function(event){
                event.preventDefault();
                return false;
            },
            "mouseup.scrollbar": function(){
                $(doc).add('body').off('.scrollbar');
                callback();
            }
        });
        $("body").on({
            "selectstart.scrollbar": function(event){
                event.preventDefault();
                return false;
            }
        });
        event && event.preventDefault();
        return false;
    }

})(jQuery, document, window);