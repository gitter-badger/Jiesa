(function(window, undefined) {

    // events.js
    var _uid = 1,
        docElem = document.documentElement,
        registry = {},
        customEventType = 'dataavailable',

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

    function selectormatcher(selector, context) {

        if (typeof selector !== 'string') {
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
    };

    function retrieveUid(obj, uid) {
        return (obj._uid = obj._uid || uid || _uid++);
    }

    function retrieveEvents(element) {
        var uid = retrieveUid(element);
        return (registry[uid] = registry[uid] || {});
    }

    function fixEvents(name, e, type, node, target, currentTarget) {

        if (typeof name === 'number') {
            var args = e['[[__node__]]'];
            return args ? args[name] : void 0;
        }

        // Support: IE8
        if (msie === 8) {
            var docEl = node.ownerDocument.documentElement;

            if (name === 'which') {
                return e.keyCode;
            }

            if (name === 'button') {
                var button = e.button;
                // click: 1 === left; 2 === middle; 3 === right
                return button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0));
            }

            if (name === 'pageX') {
                return e.clientX + docEl.scrollLeft - docEl.clientLeft;
            }

            if (name === 'pageY') {
                return e.clientY + docEl.scrollTop - docEl.clientTop;
            }

            if (name === 'preventDefault') {
                return function() {
                    return e.returnValue = false;
                };
            }

            if (name === 'stopPropagation') {
                return function() {
                    return e.cancelBubble = true;
                };
            }
        }
        if (name === 'type') {
            return type;
        }
        if (name === 'defaultPrevented') {
            return 'defaultPrevented' in e ?
                e.defaultPrevented :
                // Support: IE < 9, Android < 4.0
                e.returnValue === false;
        }
        if (name === 'target') {
            return target;
        }
        if (name === 'currentTarget') {
            return currentTarget;
        }
        if (name === 'relatedTarget') {
            return e.relatedTarget || e[(e.toElement === node ? 'from' : 'to') + 'Element'];
        }

        var value = e[name];

        if (typeof value === 'function') {
            return function() {
                return value.apply(e, arguments);
            };
        }

        return value;
    }
                
        // The guard function for buang. It let you
        // call various functions safely with a context and arguments 

        function magicGuard(context, fn, arg1, arg2) {
            if (typeof fn === 'string') {
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

    function createEventHandler(type, selector, callback, props, node, once) {

        var
            hook = eventHooks[type],
            matcher = selectormatcher(selector, node),

         handler = function(e) {

            e = e || window.event;
            // early stop in case of default action

            if (createEventHandler.skip === type) {
                return;
            }

            if (handler._type === customEventType && e.srcUrn !== type) {
                return; // handle custom events in legacy IE
            }
            // srcElement can be null in legacy IE when target is document
            var target = e.target || e.srcElement || node.ownerDocument.documentElement,
                currentTarget = matcher ? matcher(target) : node,
                args = props || [];

            // early stop for late binding or when target doesn't match selector
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
                        name, e, type, node, target, currentTarget);
                });
            } else {
                args = Array.prototype.slice(e['[[__node__]]'] || [0], 1);
            }

            // prevent default if handler returns false
            if (callback.apply(node, args) === false) {
                if (msie === 8) {
                    e.returnValue = false;
                } else {
                    e.preventDefault();
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

    function _on(el, type, selector, args, callback, once) {
        var events = retrieveEvents(el),
            handlers = events[type] || (events[type] = {});
        if (!handlers) {
            handlers = events[type] = {};
            if (el['on' + type]) {
                handlers[0] = el['on' + type];
            }
        }
        // alert(type)
        if (typeof type === 'string') {

            if (typeof args === 'function') {

                callback = args;

                if (typeof selector === 'string') {
                    args = null;
                } else {
                    args = selector;
                    selector = null;
                }
            }

            if (typeof selector === 'function') {
                callback = selector;
                selector = null;
                args = null;
            }

            if (typeof callback !== 'function') {
                return false;
            }

            var uid = retrieveUid(callback, type);

            if (handlers[uid]) {
                return el; //don't add same handler twice
            }

            var fn = createEventHandler(type, selector, callback, args, el, once);

            if (fn) {
                if (msie === 8) {
                    el.attachEvent('on' + (fn._type || type), fn);
                } else {
                    el.addEventListener(fn._type || type, fn, !!fn.capturing);
                }
            }

            handlers[uid] = fn;
            fn._uid = uid;
            return el;


        } else if (typeof type === 'object') {
            if (isArray(type)) {
                type.forEach(function(name) {
                    if (once) {
                        _once(el, name, selector, args, callback);
                    } else {
                        _on(el, name, selector, args, callback);
                    }
                });
            } else {
                Object.keys(type).forEach(function(name) {
                    if (once) {
                        _once(el, name, type[name]);
                    } else {
                        _on(el, name, type[name]);
                    }
                });
            }
        }
    }

    function _once(el, type, selector, args, callback) {
        return _on(el, type, selector, args, callback, true);
    }

    function _off(node, type, selector, callback) {

        var events = retrieveEvents(node);
        if (!events || !events[type]) {
            return node;
        }

        if (typeof type !== 'string') {
            return false;
        }

        if (callback === void 0) {
            callback = selector;
            selector = void 0;
        }

        var handler = events[type][callback._uid],
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

    function _trigger(node, type) {

        var e, eventType, canContinue;

        if (typeof type === 'string') {

            var

                hook = eventHooks[type],
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

            node.fireEvent("on" + eventType, e);

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
            trigger: _trigger,
            noConflict: function() {
                if (window.Jiesa === Jiesa) {
                    window.Jiesa = _Jiesa;
                }

                return Jiesa;
            }
        };

    window.Jiesa = Jiesa;

}(window));