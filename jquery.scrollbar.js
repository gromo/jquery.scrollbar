/**
 * jQuery CSS Customizable Scrollbar
 *
 * Copyright 2015, Yuriy Khabarov
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * If you found bug, please contact me via email <13real008@gmail.com>
 *
 * @author Yuriy Khabarov aka Gromo
 * @version 0.3.0 beta
 * @url https://github.com/gromo/jquery.scrollbar/
 *
 */
;
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(root.jQuery);
    }
}(this, function ($) {
    'use strict';

    var browser = {
        data: {
            index: 0,
            name: 'scrollbar',
            updateTimer: 0
        },
        isWebkit: /WebKit/.test(navigator.userAgent),
        isMac: navigator.platform.toLowerCase().indexOf('mac') !== -1,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent),
        isOverlay: null,
        scroll: null,
        scrolls: []
    };

    browser.scrolls.add = function (instance) {
        this.remove(instance).push(instance);
    };
    browser.scrolls.remove = function (instance) {
        while ($.inArray(instance, this) >= 0) {
            this.splice($.inArray(instance, this), 1);
        }
        return this;
    };
    browser.scrolls.update = function(force){
        for (var i = 0; i < browser.scrolls.length; i++) {
            browser.scrolls[i].update(force);
        }
        clearTimeout(browser.data.updateTimer);
        browser.data.updateTimer = setTimeout(browser.scrolls.update, 300);
    };

    var defaultOptions = {
        autoScrollSize: true,     // automatically calculate scrollsize
        autoUpdate: true,         // update scrollbar if content/container size changed
        debug: false,             // debug mode
        disableBodyScroll: false, // disable body scroll if mouse over container
        duration: 200,            // scroll animate duration in ms
        ignoreMobile: false,      // ignore mobile devices
        ignoreOverlay: false,     // ignore browsers with overlay scrollbars (mobile, MacOS)
        scrollStep: 30,           // scroll step for scrollbar arrows
        showArrows: false,        // add class to show arrows
        stepScrolling: true,      // when scrolling to scrollbar mousedown position

        scrollx: null,            // horizontal scroll element
        scrolly: null,            // vertical scroll element

        onDestroy: null,          // callback function on destroy,
        onInit: null,             // callback function on first initialization
        onScroll: null,           // callback function on content scrolling
        onUpdate: null            // callback function on init/resize (before scrollbar size calculation)
    };


    var BaseScrollbar = function (container) {

        if (!browser.scroll) {
            browser.scroll = this._getBrowserScrollSize();
            browser.isOverlay = (browser.scroll.height === 0 && browser.scroll.width === 0);
            browser.scrolls.update(); // run interval check
        }

        this.container = container;
        this.dimensions = {};
        this.isRtl = container.css('direction') === 'rtl';
        this.namespace = '.scrollbar_' + browser.data.index++;
        this.options = $.extend({}, defaultOptions, window.jQueryScrollbarOptions || {});
        this.scrollTo = null;
        this.scrollx = {};
        this.scrolly = {};

        container.data(browser.data.name, this);
        browser.scrolls.add(this);
    };

    BaseScrollbar.prototype = {

        destroy: function () {

            if (!this.wrapper) {
                return;
            }

            // unregister scroll instance
            this.container.removeData(browser.data.name);
            browser.scrolls.remove(this);

            // init variables
            var currentScroll = {
                "left": this.container.scrollLeft(),
                "top": this.container.scrollTop()
            };

            this.container.insertBefore(this.wrapper).css({
                "height": "",
                "margin": "",
                "max-height": ""
            })
                .removeClass('scroll-content scroll-scrollx_visible scroll-scrolly_visible')
                .off(this.namespace)
                .scrollLeft(currentScroll.left)
                .scrollTop(currentScroll.top);

            this.scrollx.scroll.removeClass('scroll-scrollx_visible').find('div').andSelf().off(this.namespace);
            this.scrolly.scroll.removeClass('scroll-scrolly_visible').find('div').andSelf().off(this.namespace);

            this.wrapper.remove();

            $(document).add('body').off(this.namespace);

            if ($.isFunction(this.options.onDestroy)){
                this.options.onDestroy.apply(this, [this.container]);
            }
        },
        init: function (options) {

            // init variables
            var S = this,
                c = this.container,
                cw = this.containerWrapper || c,
                namespace = this.namespace,
                o = $.extend(this.options, options || {}),
                s = {x: this.scrollx, y: this.scrolly},
                w = this.wrapper;

            var initScroll = {
                "scrollLeft": c.scrollLeft(),
                "scrollTop": c.scrollTop()
            };

            // do not init if in ignorable browser
            if ((browser.isMobile && o.ignoreMobile)
                || (browser.isOverlay && o.ignoreOverlay)
                || (browser.isMac && !browser.isWebkit) // still required to ignore nonWebKit browsers on Mac
                ) {
                return false;
            }

            // init scroll container
            if (!w) {
                this.wrapper = w = $('<div>').addClass('scroll-wrapper').addClass(c.attr('class'))
                    .css('position', c.css('position') == 'absolute' ? 'absolute' : 'relative')
                    .insertBefore(c).append(c);

                if (c.is('textarea')) {
                    this.containerWrapper = cw = $('<div>').insertBefore(c).append(c);
                    w.addClass('scroll-textarea');
                }

                cw.addClass('scroll-content');

                c.on('scroll' + namespace, $.proxy(function () {
                    if ($.isFunction(this.options.onScroll)) {
                        this.options.onScroll.call(this, {
                            scroll: this.container.scrollTop(),
                            size: this.dimensions.scrollHeight,
                            visible: this.dimensions.visibleHeight
                        }, {
                            scroll: this.container.scrollLeft(),
                            size: this.dimensions.scrollWidth,
                            visible: this.dimensions.visibleWidth
                        });
                    }
                    this.scrollx.isVisible && this.scrollx.scroll.bar.css('left', c.scrollLeft() * this.scrollx.kx + 'px');
                    this.scrolly.isVisible && this.scrolly.scroll.bar.css('top', c.scrollTop() * this.scrolly.kx + 'px');
                }, this));

                /* prevent native scrollbars to be visible on #anchor click */
                w.on('scroll' + namespace, function () {
                    w.scrollTop(0).scrollLeft(0);
                });

                if (o.disableBodyScroll) {
                    var handleMouseScroll = function (event) {
                        isVerticalScroll(event) ?
                            s.y.isVisible && s.y.mousewheel(event) :
                            s.x.isVisible && s.x.mousewheel(event);
                    };
                    w.on('MozMousePixelScroll' + namespace, handleMouseScroll);
                    w.on('mousewheel' + namespace, handleMouseScroll);

                    if (browser.isMobile) {
                        w.on('touchstart' + namespace, function (event) {
                            var touch = event.originalEvent.touches && event.originalEvent.touches[0] || event;
                            var originalTouch = {
                                pageX: touch.pageX,
                                pageY: touch.pageY
                            };
                            var originalScroll = {
                                "left": c.scrollLeft(),
                                "top": c.scrollTop()
                            };
                            $(document).on('touchmove' + namespace, function (event) {
                                var touch = event.originalEvent.targetTouches && event.originalEvent.targetTouches[0] || event;
                                c.scrollLeft(originalScroll.left + originalTouch.pageX - touch.pageX);
                                c.scrollTop(originalScroll.top + originalTouch.pageY - touch.pageY);
                                event.preventDefault();
                            });
                            $(document).on('touchend' + namespace, function () {
                                $(document).off(namespace);
                            });
                        });
                    }
                }
                if ($.isFunction(o.onInit)){
                    o.onInit.apply(this, [c]);
                }
            }

            cw.css({
                "height": "auto",
                "margin-bottom": browser.scroll.height * -1 + 'px',
                "margin-right": browser.scroll.width * -1 + 'px',
                "max-height": ""
            });

            // init scrollbars & recalculate sizes
            $.each(s, function (d, scrollx) {

                var scrollCallback = null;
                var scrollForward = 1;
                var scrollOffset = (d === 'x') ? 'scrollLeft' : 'scrollTop';
                var scrollStep = o.scrollStep;
                var scrollTo = function () {
                    var currentOffset = c[scrollOffset]();
                    c[scrollOffset](currentOffset + scrollStep);
                    if (scrollForward == 1 && (currentOffset + scrollStep) >= scrollToValue)
                        currentOffset = c[scrollOffset]();
                    if (scrollForward == -1 && (currentOffset + scrollStep) <= scrollToValue)
                        currentOffset = c[scrollOffset]();
                    if (c[scrollOffset]() == currentOffset && scrollCallback) {
                        scrollCallback();
                    }
                }
                var scrollToValue = 0;

                if (!scrollx.scroll) {

                    scrollx.scroll = S._getScroll(o['scroll' + d]).addClass('scroll-' + d);

                    if(o.showArrows){
                        scrollx.scroll.addClass('scroll-element_arrows_visible');
                    }

                    scrollx.mousewheel = function (event) {

                        if (!scrollx.isVisible || (d === 'x' && isVerticalScroll(event))) {
                            return true;
                        }
                        if (d === 'y' && !isVerticalScroll(event)) {
                            s.x.mousewheel(event);
                            return true;
                        }

                        var delta = event.originalEvent.wheelDelta * -1 || event.originalEvent.detail;
                        var maxScrollValue = scrollx.size - scrollx.visible - scrollx.offset;

                        if ((delta > 0 && scrollToValue < maxScrollValue) || (delta < 0 && scrollToValue > 0)) {
                            scrollToValue = scrollToValue + delta;
                            if (scrollToValue < 0)
                                scrollToValue = 0;
                            if (scrollToValue > maxScrollValue)
                                scrollToValue = maxScrollValue;

                            S.scrollTo = S.scrollTo || {};
                            S.scrollTo[scrollOffset] = scrollToValue;
                            setTimeout(function () {
                                if (S.scrollTo) {
                                    c.stop().animate(S.scrollTo, 240, 'linear', function () {
                                        scrollToValue = c[scrollOffset]();
                                    });
                                    S.scrollTo = null;
                                }
                            }, 1);
                        }

                        event.preventDefault();
                        return false;
                    };

                    scrollx.scroll
                        .on('MozMousePixelScroll' + namespace, scrollx.mousewheel)
                        .on('mousewheel' + namespace, scrollx.mousewheel)
                        .on('mouseenter' + namespace, function () {
                            scrollToValue = c[scrollOffset]();
                        });

                    // handle arrows & scroll inner mousedown event
                    scrollx.scroll.find('.scroll-arrow, .scroll-element_track')
                        .on('mousedown' + namespace, function (event) {

                            if (event.which != 1) // lmb
                                return true;

                            scrollForward = 1;

                            var data = {
                                "eventOffset": event[(d === 'x') ? 'pageX' : 'pageY'],
                                "maxScrollValue": scrollx.size - scrollx.visible - scrollx.offset,
                                "scrollbarOffset": scrollx.scroll.bar.offset()[(d === 'x') ? 'left' : 'top'],
                                "scrollbarSize": scrollx.scroll.bar[(d === 'x') ? 'outerWidth' : 'outerHeight']()
                            };
                            var timeout = 0, timer = 0;

                            if ($(this).hasClass('scroll-arrow')) {
                                scrollForward = $(this).hasClass("scroll-arrow_more") ? 1 : -1;
                                scrollStep = o.scrollStep * scrollForward;
                                scrollToValue = scrollForward > 0 ? data.maxScrollValue : 0;
                            } else {
                                scrollForward = (data.eventOffset > (data.scrollbarOffset + data.scrollbarSize) ? 1
                                    : (data.eventOffset < data.scrollbarOffset ? -1 : 0));
                                scrollStep = Math.round(scrollx.visible * 0.75) * scrollForward;
                                scrollToValue = (data.eventOffset - data.scrollbarOffset -
                                    (o.stepScrolling ? (scrollForward == 1 ? data.scrollbarSize : 0)
                                        : Math.round(data.scrollbarSize / 2)));
                                scrollToValue = c[scrollOffset]() + (scrollToValue / scrollx.kx);
                            }

                            S.scrollTo = S.scrollTo || {};
                            S.scrollTo[scrollOffset] = o.stepScrolling ? c[scrollOffset]() + scrollStep : scrollToValue;

                            if (o.stepScrolling) {
                                scrollCallback = function () {
                                    scrollToValue = c[scrollOffset]();
                                    clearInterval(timer);
                                    clearTimeout(timeout);
                                    timeout = 0;
                                    timer = 0;
                                };
                                timeout = setTimeout(function () {
                                    timer = setInterval(scrollTo, 40);
                                }, o.duration + 100);
                            }

                            setTimeout(function () {
                                if (S.scrollTo) {
                                    c.animate(S.scrollTo, o.duration);
                                    S.scrollTo = null;
                                }
                            }, 1);

                            return S._handleMouseDown(scrollCallback, event);
                        });

                    // handle scrollbar drag'n'drop
                    scrollx.scroll.bar.on('mousedown' + namespace, function (event) {

                        if (event.which != 1) // lmb
                            return true;

                        var eventPosition = event[(d === 'x') ? 'pageX' : 'pageY'];
                        var initOffset = c[scrollOffset]();

                        scrollx.scroll.addClass('scroll-draggable');

                        $(document).on('mousemove' + namespace, function (event) {
                            var diff = parseInt((event[(d === 'x') ? 'pageX' : 'pageY'] - eventPosition) / scrollx.kx, 10);
                            c[scrollOffset](initOffset + diff);
                        });

                        return S._handleMouseDown(function () {
                            scrollx.scroll.removeClass('scroll-draggable');
                            scrollToValue = c[scrollOffset]();
                        }, event);
                    });
                }
            });

            // remove classes & reset applied styles
            cw.add(this.scrollx.scroll).add(this.scrolly.scroll).removeClass('scroll-scrollx_visible scroll-scrolly_visible');

            // calculate init sizes
            this.dimensions = this._getDimensions();

            // update scrollbar visibility/dimensions
            this._updateScroll('x', this.scrollx);
            this._updateScroll('y', this.scrolly);

            if ($.isFunction(o.onUpdate)){
                o.onUpdate.apply(this, [c]);
            }

            // calculate scroll size
            this._updateScrollSize('x', this.scrollx);
            this._updateScrollSize('y', this.scrolly);

            c.scrollLeft(initScroll.scrollLeft).scrollTop(initScroll.scrollTop).trigger('scroll');
        },

        update: function(force){
            if (force || (this.options.autoUpdate && this.wrapper && this.wrapper.is(':visible') && this._isChanged())) {
                this.init();
            }
        },

        /**
         * Calculate browser native scrollbar height/width
         *
         * @returns {Object} {"height", "width"}
         */
        _getBrowserScrollSize: function () {
            if (!browser.data.outer) {
                browser.data.outer = $('<div>').prependTo('body')
                    .attr('style', 'border:none;margin:0;padding:0;height:100px;width:100px;position:absolute;overflow:scroll;left:-1000px;top:-1000px;');
                browser.data.inner = $('<div>').appendTo(browser.data.outer)
                    .attr('style', 'border:none;margin:0;padding:0;height:100%;width:100%;position:absolute;');
            }
            return {
                height: browser.data.outer.height() - browser.data.inner.height(),
                width: browser.data.outer.width() - browser.data.inner.width()
            };
        },

        /**
         * Get element's dimensions: scrollHeight, scrollWidth, visibleHeight, visibleWidth
         *
         * @returns {Object} element dimensions
         */
        _getDimensions: function () {
            var element = this.container,
                wrapper = this.wrapper;
            return {
                scrollHeight: element.prop('scrollHeight'),
                scrollWidth: element.prop('scrollWidth'),
                visibleHeight: wrapper.height() + (parseInt(element.css('top'), 10) || 0),
                visibleWidth: wrapper.width() + (parseInt(element.css('left'), 10) || 0)
            };
        },

        /**
         * Get scrollx/scrolly object
         *
         * @param {Mixed} scroll
         * @returns {jQuery} scroll object
         */
        _getScroll: function (scroll) {
            var types = {
                advanced: [
                    '<div class="scroll-element">',
                    '<div class="scroll-element_corner"></div>',
                    '<div class="scroll-arrow scroll-arrow_less"></div>',
                    '<div class="scroll-arrow scroll-arrow_more"></div>',
                    '<div class="scroll-element_outer">',
                    '<div class="scroll-element_size"></div>', // required! used for scrollbar size calculation !
                    '<div class="scroll-element_inner-wrapper">',
                    '<div class="scroll-element_inner scroll-element_track">', // used for handling scrollbar click
                    '<div class="scroll-element_inner-bottom"></div>',
                    '</div>',
                    '</div>',
                    '<div class="scroll-bar">', // required
                    '<div class="scroll-bar_body">',
                    '<div class="scroll-bar_body-inner"></div>',
                    '</div>',
                    '<div class="scroll-bar_bottom"></div>',
                    '<div class="scroll-bar_center"></div>',
                    '</div>',
                    '</div>',
                    '</div>'
                ].join(''),
                simple: [
                    '<div class="scroll-element">',
                    '<div class="scroll-element_outer">',
                    '<div class="scroll-element_size"></div>', // required! used for scrollbar size calculation !
                    '<div class="scroll-element_track"></div>', // used for handling scrollbar click
                    '<div class="scroll-bar"></div>', // required
                    '</div>',
                    '</div>'
                ].join('')
            };
            if (types[scroll]) {
                scroll = types[scroll];
            }
            if (!scroll) {
                scroll = types['simple'];
            }
            if (typeof (scroll) == 'string') {
                scroll = $(scroll).appendTo(this.wrapper);
            } else {
                scroll = $(scroll);
            }
            $.extend(scroll, {
                bar: scroll.find('.scroll-bar'),
                size: scroll.find('.scroll-element_size'),
                track: scroll.find('.scroll-element_track')
            });
            return scroll;
        },

        _handleMouseDown: function(callback, event) {

            var namespace = this.namespace;

            $(document).on('blur' + namespace, function () {
                $(document).add('body').off(namespace);
                callback && callback();
            });
            $(document).on('dragstart' + namespace, function (event) {
                event.preventDefault();
                return false;
            });
            $(document).on('mouseup' + namespace, function () {
                $(document).add('body').off(namespace);
                callback && callback();
            });
            $('body').on('selectstart' + namespace, function (event) {
                event.preventDefault();
                return false;
            });

            event && event.preventDefault();
            return false;
        },

        /**
         * Check if element dimensions were changed
         *  + update current dimensions
         *
         * @returns {Boolean} is changed
         */
        _isChanged: function () {
            var isChanged = false,
                newDimensions = this._getDimensions(),
                oldDimensions = this.dimensions;
            $.each(newDimensions, function (key, newValue) {
                if (oldDimensions[key] !== newValue) {
                    isChanged = true;
                    return false;
                }
            });
            this.dimensions = newDimensions;

            if (isChanged && this.options.debug) {
                window.console && console.log(this.dimensions);
            }

            return isChanged;
        },

        _updateScroll: function (d, scrollx) {

            var container = this.container,
                containerWrapper = this.containerWrapper || container,
                scrollClass = 'scroll-scroll' + d + '_visible',
                scrolly = (d === 'x') ? this.scrolly : this.scrollx,
                wrapper = this.wrapper;

            var AreaSize = this.dimensions[d === 'x' ? 'scrollWidth' : 'scrollHeight'],
                AreaVisible = this.dimensions[d === 'x' ? 'visibleWidth' : 'visibleHeight'];

            scrollx.isVisible = (AreaSize - AreaVisible) > 1; // bug in IE9/11 with 1px diff
            containerWrapper.add(scrollx.scroll).add(scrolly.scroll)[scrollx.isVisible ? 'addClass' : 'removeClass'](scrollClass);

            if (d === 'y') {
                if(container.is('textarea') || AreaSize < AreaVisible){
                    containerWrapper.css({
                        "height": (AreaVisible + browser.scroll.height) + 'px',
                        "max-height": "none"
                    });
                } else {
                    containerWrapper.css({
                        //"height": "auto", // do not reset height value: issue with height:100%!
                        "max-height": (AreaVisible + browser.scroll.height) + 'px'
                    });
                }
            }

            if(this._isChanged()){
                this._updateScroll(d === 'x' ? 'y' : 'x', scrolly);
            }
        },

        _updateScrollSize: function (d, scrollx) {

            var cssOffset = (d === 'x') ? 'left' : 'top',
                cssFullSize = (d === 'x') ? 'outerWidth' : 'outerHeight',
                cssSize = (d === 'x') ? 'width' : 'height';

            var AreaSize = this.dimensions[d === 'x' ? 'scrollWidth' : 'scrollHeight'],
                AreaVisible = this.dimensions[d === 'x' ? 'visibleWidth' : 'visibleHeight'];

            var scrollSize = scrollx.scroll.size[cssFullSize]() + (parseInt(scrollx.scroll.size.css(cssOffset), 10) || 0);

            if (this.options.autoScrollSize) {
                scrollx.scrollbarSize = parseInt(scrollSize * AreaVisible / AreaSize, 10);
                scrollx.scroll.bar.css(cssSize, scrollx.scrollbarSize + 'px');
            }

            scrollx.scrollbarSize = scrollx.scroll.bar[cssFullSize]();
            scrollx.kx = ((scrollSize - scrollx.scrollbarSize) / (AreaSize - AreaVisible)) || 1;
        }
    };

    var BaseVisibleScrollbar = function(){

        // handle page zoom & scrollbars resizing
        if(!browser.scroll){
            $(window).resize($.proxy(function () {
                var forceUpdate = false;
                if (browser.scroll && !browser.isOverlay) {
                    var scroll = this._getBrowserScrollSize();
                    if (scroll.height !== browser.scroll.height || scroll.width !== browser.scroll.width) {
                        browser.scroll = scroll;
                        forceUpdate = true; // handle page zoom
                    }
                }
                browser.scrolls.update(forceUpdate);
            }, this));
        }

        BaseScrollbar.apply(this, arguments);
    };

    BaseVisibleScrollbar.prototype = $.extend({}, BaseScrollbar.prototype, {

    });

    var FirefoxScrollbar = function () {
        BaseVisibleScrollbar.apply(this, arguments);
    };

    FirefoxScrollbar.prototype = $.extend({}, BaseVisibleScrollbar.prototype, {
    });

    var MsieScrollbar = function () {
        BaseVisibleScrollbar.apply(this, arguments);
    };

    MsieScrollbar.prototype = $.extend({}, BaseVisibleScrollbar.prototype, {
    });

    var WebkitScrollbar = function () {
        BaseScrollbar.apply(this, arguments);
    };

    WebkitScrollbar.prototype = $.extend({}, BaseScrollbar.prototype, {
    });

    var CustomScrollbar = BaseVisibleScrollbar;
    switch (true) {
        case browser.isFF:
            CustomScrollbar = FirefoxScrollbar;
            break;
        case browser.isIE:
            CustomScrollbar = MsieScrollbar;
            break;
        case browser.isWebkit:
            CustomScrollbar = WebkitScrollbar;
            break;
    }

    /*
     * Extend jQuery as plugin
     *
     * @param {Mixed} command to execute or options to init
     * @param {Mixed} arguments as Array
     * @return {jQuery}
     */
    $.fn.scrollbar = function (command, args) {
        if (typeof command !== 'string') {
            args = command;
            command = 'init';
        }
        if (typeof args === 'undefined') {
            args = [];
        }
        if (!$.isArray(args)) {
            args = [args];
        }
        this.not('body, .scroll-wrapper').each(function () {
            var element = $(this),
                instance = element.data(browser.data.name);
            if (instance || command === 'init') {
                if (!instance) {
                    instance = new CustomScrollbar(element);
                }
                if (instance[command]) {
                    instance[command].apply(instance, args);
                }
            }
        });
        return this;
    };

    /**
     * Connect default options to global object
     */
    $.fn.scrollbar.options = defaultOptions;


    /* ADDITIONAL FUNCTIONS */
    function isVerticalScroll(event) {
        var e = event.originalEvent;
        if (e.axis && e.axis === e.HORIZONTAL_AXIS)
            return false;
        if (e.wheelDeltaX)
            return false;
        return true;
    }


    /**
     * Extend AngularJS as UI directive
     * and expose a provider for override default config
     *
     */
    if (window.angular) {
        (function (angular) {
            angular.module('jQueryScrollbar', [])
                .provider('jQueryScrollbar', function () {
                    return {
                        setOptions: function (options) {
                            angular.extend(defaultOptions, options);
                        },
                        $get: function () {
                            return {
                                options: angular.copy(defaultOptions)
                            };
                        }
                    };
                })
                .directive('jqueryScrollbar', function (jQueryScrollbar, $parse) {
                    return {
                        "restrict": "AC",
                        "link": function (scope, element, attrs) {
                            var model = $parse(attrs.jqueryScrollbar),
                                options = model(scope);
                            element.scrollbar(options || jQueryScrollbar.options)
                                .on('$destroy', function () {
                                    element.scrollbar('destroy');
                                });
                        }
                    };
                });
        })(window.angular);
    }
}));