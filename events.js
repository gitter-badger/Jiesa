/*!
 * Jiesa events api library v 0.0.3a
 *
 * Copyright 2014, 2015 K.F and other contributors
 * Released under the MIT license
 *
 */
(function(window, undefined) {

    // events.js
    var __eventId = 1,
        docElem = document.documentElement,
        registry = {},
        customEventType = 'ie8',

        // Support: IE8+

        isArray = Array.isArray || function(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        },

        /**
         * documentMode is an IE-only property
         * http://msdn.microsoft.com/en-us/library/ie/cc196988(v=vs.85).aspx
         */

        msie = document.documentMode,

        // Event hooks
        eventHooks = {},

        matchesSelector = docElem.matches ||
        docElem.webkitMatchesSelector ||
        docElem.mozMatchesSelector ||
        docElem.oMatchesSelector ||
        docElem.msMatchesSelector,

        rnative = /^[^{]+\{\s*\[native \w/,

        supportMatchesSelector = rnative.test(matchesSelector);


    // RAF
    //______

    var
        top,
        raf = window.requestAnimationFrame,
        caf = window.cancelAnimationFrame || window.cancelRequestAnimationFrame;

    // Test if we are within a foreign domain. Use raf from the top if possible.

    try {
        // Accessing .name will throw SecurityError within a foreign domain.
        window.top.name;
        top = window.top;
    } catch (e) {
        top = window;
    }

    if (!raf) {

        // requestAnimationFrame

        raf = top.requestAnimationFrame ||
            top.webkitRequestAnimationFrame ||
            top.mozRequestAnimationFrame ||
            top.msRequestAnimationFrame;

        // cancelAnimationFrame
        caf = top.CancelAnimationFrame ||
            top.webkitCancelAnimationFrame ||
            top.webkitCancelRequestAnimationFrame ||
            top.mozCancelAnimationFrame ||
            top.msCancelAnimationFrame;
    }

    // Some versions of FF have rAF but not cAF
    if (!raf || !caf) {

        var last = 0,
            id = 0,

            queue = [],
            frameDuration = 1000 / 60;

        raf = function(callback) {
            if (queue.length === 0) {
                var i = 0,
                    l, _now = Date.now(),
                    next = Math.max(0, frameDuration - (_now - last));

                last = next + _now;

                setTimeout(function() {
                    var cp = queue.slice(0);
                    // Clear queue here to prevent
                    // callbacks from appending listeners
                    // to the current frame's queue
                    queue.length = 0;
                    l = cp.length;
                    for (; i < l; i++) {
                        if (!cp[i].cancelled) {
                            try {
                                cp[i].callback(last);
                            } catch (e) {
                                setTimeout(function() {
                                    throw e;
                                }, 0);
                            }
                        }
                    }
                }, Math.round(next));
            }
            queue.push({
                handle: ++id,
                callback: callback,
                cancelled: false
            });
            return id;
        };

        caf = function(handle) {
            var i = 0;
            for (; i < queue.length; i++) {
                if (queue[i].handle === handle) {
                    queue[i].cancelled = true;
                }
            }
        };
    }

    var _requestFrame = function(callback) {
        raf(callback);
    };

    var _cancelFrame = function(frameId) {
        raf(frameId);
    };

    /**
     * Determines if a reference is a `String`.
     *
     * @param {*} value Reference to check.
     * @returns {boolean} True if `value` is a `String`.
     */
    function isString(value) {
        return typeof value === 'string';
    }

    /**
     * Determines if a reference is a `Function`.
     *
     * @param {*} value Reference to check.
     * @returns {boolean} True if `value` is a `Function`.
     */

    function isFunction(value) {
        return typeof value === 'function';
    }

    /**
     * Determines if a reference is an `Object`. Unlike `typeof` in JavaScript, `null`s are not
     * considered to be objects. Note that JavaScript arrays are objects.
     *
     * @param {*} value Reference to check.
     * @returns {boolean} True if `value` is an `Object` but not `null`.
     */
    function isObject(value) {
        // http://jsperf.com/isobject4
        return value !== null && typeof value === 'object';
    }


    /**
     *  matchesSelector for matching delegated events
     */
    function selectormatcher(selector, context) {

        if (!isString(selector)) {
            return null;
        }
        return function(node) {

            var n, res, found, index, length;

            if (!supportMatchesSelector) {
                found = (context || node.ownerDocument).querySelectorAll(selector);
            }

            for (; node && node.nodeType === 1; node = node.parentNode) {
                if (supportMatchesSelector) {
                    res = matchesSelector.call(node, selector);
                } else {
                    index = 0;
                    length = found.length;
                    for (; index < length;) {
                        n = (found[index++]);
                        if (n === node) {
                            return n;
                        }
                    }

                    index = length = void 0;
                }

                if (res || !context || node === context) {
                    break;
                }
            }

            return res && node;
        };
    }

    /**
     * Get Jiesa event id
     *
     * @param {Object} node The element to get Jiesa event id from
     *
     * @return {Number}
     */

    function getEventId(node) {
            return node.__eventId || (node.__eventId = __eventId++);
        }
        /**
         * Get Jiesa events
         *
         * @param {Object} node The element to get Jiesa events from
         *
         * @return {Number}
         */
    function getEvents(node) {
        var uid = getEventId(node);
        return (registry[uid] = registry[uid] || {});
    }

    function fixEvents(name, evt, type, node, target, currentTarget) {

            if (typeof name === 'number') {
                var args = evt['[[__node__]]'];
                return args ? args[name] : void 0;
            }

            // Support: IE8
            if (msie === 8) {
                var docEl = node.ownerDocument.documentElement;

                if (name === 'which') {
                    return evt.keyCode;
                }

                if (name === 'button') {
                    var button = evt.button;
                    // click: 1 === left; 2 === middle; 3 === right
                    return button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0));
                }


                if (name === 'pageX') {
                    return evt.clientX + docEl.scrollLeft - docEl.clientLeft;
                }

                if (name === 'pageY') {
                    return evt.clientY + docEl.scrollTop - docEl.clientTop;
                }

                if (name === 'preventDefault') {
                    return function() {
                        return evt.returnValue = false;
                    };
                }

                if (name === 'stopPropagation') {
                    return function() {
                        return evt.cancelBubble = true;
                    };
                }
            }
            if (name === 'type') {
                return type;
            }
            if (name === 'defaultPrevented') {
                return 'defaultPrevented' in evt ?
                    evt.defaultPrevented :
                    // Support: IE < 9, Android < 4.0
                    evt.returnValue === false;
            }
            if (name === 'target') {
                return target;
            }
            if (name === 'currentTarget') {
                return currentTarget;
            }
            if (name === 'relatedTarget') {
                return evt.relatedTarget || evt[(evt.toElement === node ? 'from' : 'to') + 'Element'];
            }

            var value = evt[name];

            if (isFunction(value)) {
                return function() {
                    return value.apply(evt, arguments);
                };
            }

            return value;
        }
        // The guard function for buang. It let you
        // call various functions safely with a context and arguments 

    function magicGuard(context, fn, arg1, arg2) {
            if (isString(fn)) {
                fn = context[fn];
            }

            try {
                return fn.call(context, arg1, arg2);
            } catch (err) {
                window.setTimeout(function() {
                    throw err;
                }, 1);

                return false;
            }
        }
        /**
         * Create event handler
         */

    function createEventHandler(type, selector, callback, props, node, once) {

        var hook = eventHooks[type],
            matcher = selectormatcher(selector, node),
            handler = function(evt) {

                evt = evt || window.event;
                // early stop in case of default action

                if (createEventHandler.skip === type) {
                    return;
                }

                if (handler._type === customEventType && evt.srcUrn !== type) {
                    return; // handle custom events in legacy IE
                }
                // srcElement can be null in legacy IE when target is document
                var target = evt.target || evt.srcElement || node.ownerDocument.documentElement,
                    currentTarget = matcher ? matcher(target) : node,
                    args = props || [];

                // return if the target doesn't match selector
                if (!currentTarget) {
                    return;
                }
                // off callback even if it throws an exception later
                if (once) {
                    _off(node, type, callback);
                }

                if (props) {
                    args = args.map(function(name) {
                        return fixEvents(
                            name, evt, type, node, target, currentTarget);
                    });
                } else {
                    args = Array.prototype.slice(evt['[[__node__]]'] || [0], 1);
                }

                // prevent default if handler returns false
                if (callback.apply(node, args) === false) {
                    if (msie === 8) {
                        evt.returnValue = false;
                    } else {
                        evt.preventDefault();
                    }
                }
            };

        if (hook) {
            handler = hook(handler, type) || handler;
        }
        if (msie === 8 && !('on' + (handler._type || type) in node)) {
            // handle custom events for IE8
            handler._type = customEventType;
        }

        handler.type = type;
        handler.callback = callback;
        handler.selector = selector;

        return handler;
    }

    /**
     * Add event to element.
     * Using addEventListener or attachEvent (IE8)
     */

    function _on(node, type, selector, args, callback, once) {
        var events = getEvents(node),
            handlers = events[type] || (events[type] = {});

        if (!handlers) {
            handlers = events[type] = {};
        }

        if (typeof type === 'string') {

            if (isFunction(args)) {

                callback = args;

                if (isString(selector)) {
                    args = null;
                } else {
                    args = selector;
                    selector = null;
                }
            }

            if (isFunction(selector)) {
                callback = selector;
                selector = null;
                args = null;
            }

            if (!isFunction(callback)) {
                return false;
            }

            var uid = getEventId(callback);

            if (handlers[uid]) {
                return node; //don't add same handler twice
            }

            var fn = createEventHandler(type, selector, callback, args, node, once);

            if (fn) {
                if (msie === 8) {
                    node.attachEvent('on' + (fn._type || type), fn);
                } else {
                    node.addEventListener(fn._type || type, fn, !!fn.capturing);
                }
            }

            handlers[uid] = fn;
            fn.__eventId = uid;
            return node;

            // TODO: Mouseenter are not working here. FIX IT!

        } else if (isObject(type)) {

            if (isArray(type)) {
                type.forEach(function(name) {
                    if (once) {
                        _once(node, name, selector, args, callback);
                    } else {
                        _on(node, name, selector, args, callback);
                    }
                });
            } else {

                if (args === undefined && isArray(selector)) {
                    args = selector;
                    selector = void 0;
                }
                Object.keys(type).forEach(function(name) {
                    if (once) {
                        _once(node, name, selector, args, type[name]);
                    } else {
                        _on(node, name, selector, args, type[name]);
                    }
                });
            }
        }
    }

    function _once(node, type, selector, args, callback) {
        return _on(node, type, selector, args, callback, 1);
    }

    /**
     * Remove event to element.
     * Using removeEventListener or detachEvent (IE8)
     */

    /**
     * Unbind a DOM event from the context
     * @memberOf DOMNode.prototype
     * @param  {String} type event type
     * @param  {DOMNode#eventCallback} [callback]  event handler
     * @return {DOMNode} current context
     */

    function _off(node, type, selector, callback) {

        var events = getEvents(node);

        if (!events || !events[type]) {
            return node;
        }

        if (!isString(type)) {
            return false;
        }

        if (callback === void 0) {
            callback = selector;
            selector = void 0;
        }

        var handler = events[type][callback.__eventId],
            skip = type !== handler.type;

        skip = skip || selector && selector !== handler.selector;
        skip = skip || callback && callback !== handler.callback;

        if (skip) return true;

        type = handler._type || handler.type;
        if (msie === 8) {
            node.detachEvent('on' + type, handler);
        } else {
            node.removeEventListener(type, handler, !!handler.capturing);
        }
        return this;
    }

    /**
     * Fire specific event for element collection
     */

    function _fire(node, type) {

        var e, eventType, canContinue;

        if (isString(type)) {

            var hook = eventHooks[type],
                handler = {};

            if (hook) {
                handler = hook(handler) || handler;
            }

            eventType = handler._type || type;
        } else {
            return false;
        }
        if (msie === 8) {
            e = node.ownerDocument.createEventObject();
            e['[[__node__]]'] = arguments;
            // handle custom events for legacy IE
            if (!('on' + eventType in node)) {
                eventType = customEventType;
            }
            // store original event type
            if (eventType === customEventType) {
                e.srcUrn = type;
            }

            node.fireEvent('on' + eventType, e);

            canContinue = e.returnValue !== false;
        } else {
            e = node.ownerDocument.createEvent('HTMLEvents');
            e['[[__node__]]'] = arguments;
            e.initEvent(eventType, true, true);
            canContinue = node.dispatchEvent(e);
        }

        // call native function to trigger default behavior
        if (canContinue && node[type]) {
            // prevent re-triggering of the current event
            createEventHandler.skip = type;

            magicGuard(node, type);

            createEventHandler.skip = null;
        }

        return canContinue;
    }

    // EventHandler hooks

    ['scroll', 'mousemove'].forEach(function(name) {
        eventHooks[name] = function(handler) {
            var free = true;
            // debounce frequent events
            return function(e) {
                if (free) {
                    free = raf(function() {
                        free = !handler(e);
                    });
                }
            };
        };
    });

    if ('onfocusin' in document.documentElement) {
        eventHooks.focus = function(handler) {
            handler._type = 'focusin';
        };
        eventHooks.blur = function(handler) {
            handler._type = 'focusout';
        };
    } else {
        // firefox doesn't support focusin/focusout events
        eventHooks.focus = eventHooks.blur = function(handler) {
            handler.capturing = true;
        };
    }
    if (document.createElement('input').validity) {
        eventHooks.invalid = function(handler) {
            handler.capturing = true;
        };
    }

    var _Jiesa = window.Jiesa,
        Jiesa = {
            on: _on,
            once: _once,
            off: _off,
            trigger: _fire,
            raf: _requestFrame,
            caf: _cancelFrame,
            noConflict: function() {
                if (window.Jiesa === Jiesa) {
                    window.Jiesa = _Jiesa;
                }

                return Jiesa;
            }
        };

    window.Jiesa = Jiesa;

}(window));