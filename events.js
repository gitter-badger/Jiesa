/*!
 * Jiesa events api library v 0.0.4a
 *
 * Copyright 2014, 2015 K.F and other contributors
 * Released under the MIT license
 *
 */
(function(window, undefined) {

    var
        docElem = document.documentElement,
        customEventType = 'ie8',

        /**
         * Short-hands
         */

        NODE = '[[__node__]]',
        EVENT = '[[__event__]]',

        /**
         * @param {*} obj
         * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments, String ...)
         */

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

        // matchesSelector

        matchesSelector = docElem.matches ||
        docElem.webkitMatchesSelector ||
        docElem.mozMatchesSelector ||
        docElem.oMatchesSelector ||
        docElem.msMatchesSelector,

        rnative = /^[^{]+\{\s*\[native \w/,

        // Check if matchesSelector are supported by the browser

        supportMatchesSelector = rnative.test(matchesSelector);

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

    function fixEvents(name, evt, type, node, target, currentTarget) {

            if (typeof name === 'number') {
                var args = evt[NODE];
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
                    return;
                }
                // srcElement can be null in IE8 when target is document
                var target = evt.target || evt.srcElement || node.ownerDocument.documentElement,
                    currentTarget = matcher ? matcher(target) : node,

                    // Expose a few default events

                    args = props || [selector ? 'currentTarget' : 'target', 'defaultPrevented'];

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

        if (!node[EVENT]) {
            node[EVENT] = [];
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

            var handler = createEventHandler(type, selector, callback, args, node, once);

            if (handler) {
                if (msie === 8) {
                    node.attachEvent('on' + (handler._type || type), handler);
                } else {
                    node.addEventListener(handler._type || type, handler, !!handler.bubbling);
                }
            }

            node[EVENT].push(handler)

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

    function _off(node, type, selector, callback) {

        if (callback === void 0 && selector !== void 0) {
            callback = selector;
            selector = void 0;
        }

        node[EVENT].forEach(function(handler, index, events) {

            var skip = type !== handler.type;

            if (!callback) {
                callback = handler.callback;
            }
            skip = skip || selector && selector !== handler.selector;
            skip = skip || callback && callback !== handler.callback;

            if (skip) {
                return true;
            }

            type = handler._type || handler.type;
            if (msie === 8) {
                node.detachEvent('on' + type, handler);
            } else {
                node.removeEventListener(type, handler, !!handler.bubbling);
            }
        });
        return this;
    }

    /**
     * Fire specific event for element collection
     */

    function _fire(node, type, detail) {

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
            e[NODE] = arguments;
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
            if (~type.indexOf(':')) {
                e = new CustomEvent(eventType, {
                    detail: detail,
                    bubbles: true
                });
                e[NODE] = arguments;
            } else {
                e = node.ownerDocument.createEvent('HTMLEvents');
                e[NODE] = arguments;
                e.initEvent(eventType, true, true);
            }

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
            handler.bubbling = true;
        };
    }
    if (document.createElement('input').validity) {
        eventHooks.invalid = function(handler) {
            handler.bubbling = true;
        };
    }

    var _Jiesa = window.Jiesa,
        Jiesa = {
            on: _on,
            once: _once,
            off: _off,
            fire: _fire,
            eventHooks: eventHooks,
            noConflict: function() {
                if (window.Jiesa === Jiesa) {
                    window.Jiesa = _Jiesa;
                }

                return Jiesa;
            }
        };

    window.Jiesa = Jiesa;

}(window));