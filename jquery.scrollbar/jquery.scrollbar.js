/**
 * jQuery Custom Scrollbar plugin
 *
 * @author Yuriy Khabarov
 * @author Timur Yerzin
 *
 * @version 0.0.2
 */
;
(function($){

    var browserScroll = null;
    var scrolls = [];
    var px = 'px';

    var defaults = {
        "duration": 200,        // scroll animate duration
        "onDestroy": null,      // callback function called before destroy
        "onInit": null,         // callback function called after init
        "scrollSize": "auto",   // [auto|fixed] scroll size
        "showArrows": false,    // [true|false] show scroll arrows
        "wrapperClass": null    // css class to apply to wrapper to set height/width/position values
    };

    function customScrollbar(container, options){

        if(!browserScroll){
            browserScroll = getBrowserScrollSize();
        }

        this.container = container;
        this.options = $.extend({}, defaults);
        this.scrollx = {};
        this.scrolly = {};

        this.init(options);
    }

    customScrollbar.prototype = {

        destroy: function(){

            // INIT VARIABLES
            var c = this.container;

            var scrollLeft = c.scrollLeft();
            var scrollTop  = c.scrollTop();

            c.parent().find('.scroll-container').remove();
            c.unwrap().css({
                "left":"",
                "padding":"",
                "top":""
            })
            .removeClass('scroll-content')
            .unbind('.scrollbar')
            .scrollLeft(scrollLeft)
            .scrollTop(scrollTop);

            $(document).add('body').unbind('.scrollbar');

            if($.isFunction(this.options.onDestroy))
                this.options.onDestroy.apply(this, [c]);
        },



        getScrollElement: function(c){

            var scrollElement = $('<div>').addClass('scroll-container').addClass(c);

            scrollElement.html(
                '<div class="scroll-container_outer">' +
                '    <div class="scroll-container_outer-offset"></div>' +   // used for scrollbar size calculation !
                '    <div class="scroll-container_inner-wrapper">' +
                '        <div class="scroll-container_inner">' +            // used for scrollbar click event
                '            <div class="scroll-container_inner-bottom"></div>' +
                '        </div>' +
                '    </div>' +
                '    <div class="scroll-bar">' +
                '        <div class="scroll-bar_body">' +
                '            <div class="scroll-bar_body-inner"></div>' +
                '        </div>' +
                '        <div class="scroll-bar_bottom"></div>' +
                '        <div class="scroll-bar_center"></div>' +
                '    </div>' +
                '</div>');

            if(this.options.showArrows){
                $('<div>').addClass('scroll-arrow scroll-arrow_less').appendTo(scrollElement);
                $('<div>').addClass('scroll-arrow scroll-arrow_more').appendTo(scrollElement);
                scrollElement.addClass('show-arrows');
            }

            return scrollElement;
        },



        init: function(options){

            // INIT VARIABLES
            var c = this.container;
            var o = $.extend(this.options, options);
            var s = {
                "x": "width",
                "y": "height"
            };

            if(!this.wrapper){
                var initScroll = {
                    "scrollLeft": c.scrollLeft(),
                    "scrollTop": c.scrollTop()
                };

                this.wrapper = c.wrap($('<div>').addClass('scroll-wrapper')
                    .addClass(o.wrapperClass || c.attr('class'))).parent();

                c.addClass('scroll-content').css({
                    "overflow":"auto",
                    "padding": 0
                })
                .scrollLeft(initScroll.scrollLeft)
                .scrollTop(initScroll.scrollTop);
            } else {
                c.css({
                    "padding": 0
                });
            }

            $.each(s, this.proxy(function(i, v){

                var scrollx = this["scroll" + i];

                if(!scrollx.scrollbar){

                    scrollx.scrollbar = this.getScrollElement('scroll-' + i);
                    scrollx.scroller = scrollx.scrollbar.find('.scroll-bar');

                    scrollx.scrollbar.find('.scroll-arrow').click(function(){
                        var offset = $(this).hasClass('scroll-arrow_more') ? 30 : -30;
                        var direction = (i=='x') ? 'scrollLeft' : 'scrollTop';
                        var animateTo = {};
                        animateTo[direction] = c[direction]() + offset;
                        c.animate(animateTo, o.duration);
                    });

                    scrollx.scrollbar.find('.scroll-container_inner').click(function(event){
                        var direction = (i=='x') ? 'scrollLeft' : 'scrollTop';
                        var kx = event[(i=='x') ? 'pageX' : 'pageY'] <
                        scrollx.scroller.offset()[(i=='x') ? 'left' : 'top'] ? -1 : 1;

                        var animateTo = {};
                        animateTo[direction] = c[direction]() + (scrollx.visible * kx);
                        c.animate(animateTo, o.duration);
                    });

                    scrollx.scroller.bind('mousedown', function(event){

                        var direction = (i=='x') ? 'scrollLeft' : 'scrollTop';
                        var eventPosition = event[i=='x'?'pageX':'pageY'];
                        var initOffset = c[direction]();
                        scrollx.scrollbar.addClass('scroll-draggable');

                        var removeDragHandlers = function(){
                            $(document).add('body').unbind('.scrollbar');
                            scrollx.scrollbar.removeClass('scroll-draggable');
                        };

                        $(document).bind({
                            "dragstart.scrollbar": function(event){
                                event.preventDefault();
                                return false;
                            },
                            "mousemove.scrollbar": function(event){
                                var diff = parseInt((event[i=='x'?'pageX':'pageY'] - eventPosition) / scrollx.kx);
                                c[direction](initOffset + (diff));
                            },
                            "mouseup.scrollbar": removeDragHandlers
                        });
                        $('body').bind('selectstart.scrollbar', function(){
                            return false;
                        }).bind('mouseleave.scrollbar', removeDragHandlers);

                        event.preventDefault();
                        return false;
                    });
                }
                $.extend(scrollx, (i == 'x') ? {
                    "size": c.get(0).scrollWidth,
                    "visible": c.width()
                } : {
                    "size": c.get(0).scrollHeight,
                    "visible": c.height()
                });
            }));

            $.each(s, this.proxy(function(i, v){

                var scrollx = this["scroll" + i];
                var scrolly = this[(i == 'x') ? "scrolly" : "scrollx"];

                if(scrollx.size > scrollx.visible){
                    scrollx.isVisible = true;
                    scrollx.scrollbar.appendTo(this.wrapper).hide().show(); // .hide().show() - IE7 hack to recalculate size
                    scrolly.scrollbar.addClass('show-' + i);
                    c.css((i == 'x') ? 'padding-bottom' : 'padding-right', browserScroll[v] + px);
                } else {
                    scrollx.scrollbar.remove();
                    scrolly.scrollbar.removeClass('show-' + i);
                }
            }));

            $.each(s, this.proxy(function(i, v){

                var scrollx = this["scroll" + i];
                var scroller = scrollx.scrollbar.find('.scroll-container_outer-offset');
                var scrollerSize = scrollx.visible + parseInt(scroller.css(i=='x' ? 'left' : 'top') || 0);

                if(o.scrollSize == "auto"){
                    scrollx.scrollsize = parseInt(scrollx.visible * scrollerSize / scrollx.size);
                    scrollx.scroller.css(v, scrollx.scrollsize + px);
                }

                scrollx.scrollsize = parseInt(scrollx.scroller.css(v));
                scrollx.kx = ((scrollerSize - scrollx.scrollsize) / (scrollx.size - scrollx.visible)) || 1;
            }));



            c.bind('scroll.scrollbar', this.proxy(function(){
                $.each(s, this.proxy(function(i, v){
                    var offset  = (i=='x') ? c.scrollLeft() : c.scrollTop();
                    var scrollx = this["scroll" + i];
                    if(scrollx.isVisible){
                        scrollx.scroller.css((i=='x') ? 'left' : 'top', offset * scrollx.kx + px);
                    }
                }));
            })).trigger('scroll');

            if($.isFunction(o.onInit))
                o.onInit.apply(this, [c]);

        },



        /**
         * Proxy to call function in context of current object
         * @param {mixed} function or string
         * @param {array} function arguments; use null to define incoming arguments
         * @param {object} context
         */
        proxy: function(func, args, context){
            context = context || this;
            args = args || [];
            if(typeof func == 'string')
                func = context[func];
            return function(){
                var a = args.slice();
                for(var i=0; i<arguments.length; i++)
                    if(typeof a[i]=='undefined' || a[i]===null)
                        a[i] = arguments[i];
                return func.apply(context, a);
            };
        }
    };

    /*
     * Extend jQuery as plugin
     * @param {object|string} options or command to execute
     * @param {object|array} additional arguments as array []
     */
    $.fn.scrollbar = function(options, args){

        var toReturn = this;

        if(options == 'get')
            toReturn = null;

        this.each(function() {

            var container = $(this);

            if(container.hasClass('scroll-wrapper')
                || container.get(0).nodeName == 'body'){
                return;
            }

            var instance = container.data('scrollbar');
            if(instance){
                if(options === 'get'){
                    toReturn = instance;
                    return false;
                }

                options = (typeof options == "string" && instance[options]) ? options : 'init';
                instance[options].apply(instance, $.isArray(args) ? args : []);

                if(options == 'destroy'){
                    container.removeData('scrollbar');
                }
            } else {
                if(typeof options != 'string'){
                    instance = new customScrollbar(container, options);
                    container.data('scrollbar', instance);
                    scrolls.push(instance)
                }
            }
        });

        return toReturn;
    };

    /* CHECK IF SCROLL CONTENT IS UPDATED */
    var timer = setInterval(function(){
        var i, c, s, x, y;
        for(i=0; i<scrolls.length; i++){
            s = scrolls[i];
            c = s.container;
            x = s.scrolly.isVisible ? s.scrollx.size + browserScroll['width']  : s.scrollx.size;
            y = s.scrollx.isVisible ? s.scrolly.size + browserScroll['height'] : s.scrolly.size;
            if(c.is(':visible') && (c.get(0).scrollWidth != x
                || c.get(0).scrollHeight != y
                || c.width()  != s.scrollx.visible
                || c.height() != s.scrolly.visible
                )){
                $('#debug').append('<p>reinit</p>');
                s.init();
            }
        }
    }, 300);

    $(document).ready(function(){
        $('#debug').append('<p>SCROLLBAR v0.0.2</p>');
    });


    /* ADDITIONAL FUNCTIONS */
    function getBrowserScrollSize(){

        var inner = $('<div>').css({
            "height":"100px",
            "width":"100px"
        });
        var outer = $('<div>').css({
            "height":"100px",
            "left":"-200px",
            "overflow":"scroll",
            "position":"absolute",
            "top":"-200px",
            "width":"100px"
        }).append(inner).appendTo('body')
        .scrollLeft(inner.width())
        .scrollTop(inner.height());

        var size = {
            "height": (outer.offset().top - inner.offset().top) || 0,
            "width": (outer.offset().left - inner.offset().left) || 0
        };

        outer.remove();
        return size;
    }

})(jQuery);

