/*!
 * Jiesa events api library v 0.0.7a
 *
 * Copyright 2014, 2015 K.F and other contributors
 * Released under the MIT license
 *
 */
(function(window, undefined) {

    var
        win = window,
        addEvent = 'addEventListener',
        attachEvent = 'attachEvent',
        removeEvent = 'removeEventListener',
        detachEvent = 'detachEvent',
        doc = document || {},
        docElem = doc.documentElement || {},
        W3C_MODEL = docElem[addEvent],
        customEventType = 'ie8Custom',
        NODE = '[[__node__]]',
        EVENT = '[[__event__]]',
        rnative = /^[^{]+\{\s*\[native \w/,

        isString = function(value) {
            return typeof value === 'string';
        },
        isFunction = function(value) {
            return typeof value === 'function';
        },
        isObject = function(value) {
            return value !== null && typeof value === 'object';
        },
        isArray = Array.isArray || function(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        },

        // A container 'hook' for special event types

        eventHooks = {},

        // Detects XML nodes

        isXML = function(node) {
            var documentElement = node && (node.ownerDocument || node).documentElement;
            return documentElement ? documentElement.nodeName !== 'HTML' : false;
        },

        // Marker for native QSA

        usaQSA = true,

        // selector engine for delegated events, use querySelectorAll if it exists

        selectorEngine,

        setSelectorEngine = function(e) {
            if (!arguments.length) {
                selectorEngine = doc.querySelectorAll ? function(s, r) {
                    return r.querySelectorAll(s);
                } : function() {
                    throw new Error('Jiesa: No selector engine installed');
                }
            } else {
                // Mark that we are no longer QSA
                usaQSA = false;
                // Set another selector engine
                selectorEngine = e;
            }
        },

        // matchesSelector

        matchesSelector = docElem.matches ||
        docElem.webkitMatchesSelector ||
        docElem.mozMatchesSelector ||
        docElem.oMatchesSelector ||
        docElem.msMatchesSelector,

        // Check if matchesSelector are supported by the browser

        supportMatchesSelector = rnative.test(matchesSelector),

        // Support: IE9 - disconnected nodes

        disconnectedNodes = (function() {
            var div = document.createElement('div'),
                ret = !!matchesSelector.call(div, 'div');
            // Avoid memory leaks in IE
            div = null;
            return ret;
        }()),

        // matchesSelector for delegated events. It's using matchesSelector if it exists
        // with fallback to querySelectorAll for older browsers (e.g. IE8, Opera 12.x) 

        JiesaMatches = function(selector, context) {

            if (!isString(selector)) return null;

            return function(node) {

                var n, res, found, index, length;

                if (!supportMatchesSelector || (supportMatchesSelector && isXML(doc))) {
                    // querySelectorAll are not supported on XML documents
                    if (usaQSA && isXML(doc)) {
                        throw new Error('Jiesa: XML documents are not supported by this selector engine');
                    }
                    found = selectorEngine(selector, (context || node.ownerDocument));
                }

                for (; node && node.nodeType === 1; node = node.parentNode) {
                    if (supportMatchesSelector && disconnectedNodes) {
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
        },

        // clean up buggy and fix event properties to comply with W3C standards, before returning those 
        // events who are requested by the end-developer by taking the actual DOM event object 
        // and filter by user request.

        fixEvents = function(name, evt, type, node, target, currentTarget) {

            if (typeof name === 'number') {
                var args = evt[NODE];
                return args ? args[name] : void 0;
            }

            // Support: IE8
            if (!W3C_MODEL) {
                var docEl = node.ownerDocument.documentElement;

                if (name === 'rightClick') {
                    return evt.keyCode === 3 || evt.button === 2;
                }

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
                // stop event propagation
                if (name === 'stopPropagation') {
                    return function() {
                        return evt.cancelBubble = true;
                    };
                }
            }
            if (name === 'type') {
                return type;
            }
            // prevent default action
            if (name === 'defaultPrevented') {
                return 'defaultPrevented' in evt ?
                    evt.defaultPrevented :
                    // Support: IE < 9, Android < 4.0
                    evt.returnValue === false;
            }
            // fired element (triggering the event)
            if (name === 'target') {
                return target;
            }
            // bound element (listening the event)
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
        },

        // The guard function for Jiesa. It let you
        // call various functions safely with a context and arguments 

        magicGuard = function(context, fn, arg1, arg2) {
            if (isString(fn)) {
                fn = context[fn];
            }

            try {
                return fn.call(context, arg1, arg2);
            } catch (err) {
                win.setTimeout(function() {
                    throw err;
                }, 1);

                return false;
            }
        },
        /**
         * Create event handler
         */

        createEventHandler = function(type, selector, callback, props, node, once) {

            var matcher = JiesaMatches(selector, node),
                hook = eventHooks[type],
                handler = function(evt) {

                    // Support: IE8 +

                    evt = evt || ((node.ownerDocument || node.document || node).parentWindow || win).event;

                    // early stop in case of default action

                    if (createEventHandler.skip === type) {
                        return;
                    }

                    if (handler._type === customEventType && evt.srcUrn !== type) {
                        return;
                    }
                    // srcElement can be null in IE8 when target is document
                    var target = evt.target || evt.srcElement || node.ownerDocument.documentElement,
                        currentTarget = matcher && target.nodeType === 1 &&
                        // Don't process clicks on disabled elements
                        (target.disabled !== true || event.type !== 'click') ? matcher(target) : node,
                        args = props || [];

                    // return if the target doesn't match selector
                    if (!currentTarget) {
                        return;
                    }
                    // off callback even if it throws an exception later
                    if (once === 1) {
                        removeListener(node, type, callback);
                    }

                    if (props) {
                        args = args.map(function(name) {
                            return fixEvents(
                                name, evt, type, node, target, currentTarget);
                        });
                    } else {
                        args = Array.prototype.slice.call(evt[NODE] || [0], 1);
                    }

                    if (!type) return;

                    // prevent default if handler returns false
                    if (callback.apply(node, args) === false) {
                        if (W3C_MODEL) {
                            evt.preventDefault();
                        } else {
                            evt.returnValue = false;
                        }
                    }
                };

            if (hook) {
                handler = hook(handler, type) || handler;
            }
            if (!W3C_MODEL && !('on' + (handler._type || type) in node)) {
                // handle custom events for IE8
                handler._type = customEventType;
            }

            handler.type = type;
            handler.callback = callback;
            handler.selector = selector;

            return handler;
        },

        /**
         * Add event to element.
         * Using addEventListener or attachEvent (IE8)
         */

        add = function(node, type, selector, args, callback, once) {

            // Don't attach events to noData or text/comment nodes (allow plain objects tho)
            if (node.nodeType === 3 || node.nodeType === 8 || !type) {
                return;
            }

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
                    if (W3C_MODEL) {
                        node[addEvent](handler._type || type, handler, !!handler.capture);
                    } else {
                        node[attachEvent]('on' + (handler._type || type), handler);
                    }
                }

                node[EVENT].push(handler);

                // TODO: Mouseenter are not working here. FIX IT!

            } else if (isObject(type)) {

                if (isArray(type)) {
                    type.forEach(function(name) {
                        if (once) {
                            temp(node, name, selector, args, callback, true);
                        } else {
                            add(node, name, selector, args, callback);
                        }
                    });
                } else {

                    if (args === undefined && isArray(selector)) {
                        args = selector;
                        selector = void 0;
                    }
                    Object.keys(type).forEach(function(name) {
                        if (once) {
                            temp(node, name, selector, args, type[name], true);
                        } else {
                            add(node, name, selector, args, type[name]);
                        }
                    });
                }
            }
        },

        // Helper function for Jiesa.once()

        temp = function(node, type, selector, args, callback) {
            return add(node, type, selector, args, callback, 1);
        },

        // Add and remove listeners to DOM elements

        removeListener = function(node, type, selector, callback) {

            if (node === undefined || !node[EVENT] || !isString(type)) {
                return;
            }
            if (callback === void 0 && selector !== void 0) {
                callback = selector;
                selector = void 0;
            }

            node[EVENT].filter(function(handler) {

                var skip = type !== handler.type;

                skip = skip || selector && selector !== handler.selector;
                skip = skip || callback && callback !== handler.callback;

                if (skip) {
                    return true;
                }

                type = handler._type || handler.type;
                if (W3C_MODEL) {
                    node[removeEvent](type, handler, !!handler.capture);
                } else {
                    node[detachEvent]('on' + type, handler);
                }
            });
            return this;
        },

        /**
         * Trigger specific event for element collection
         */

        trigger = function(node, type, detail) {

            // Don't do events on text and comment nodes
            if (node && (node.nodeType === 3 ||
                    node.nodeType === 8)) {
                return;
            }

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
            if (W3C_MODEL) {
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
            } else {
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
            }

            // call native function to trigger default behavior
            if (canContinue && node[type]) {

                // prevent re-triggering of the current event
                createEventHandler.skip = type;

                magicGuard(node, type);

                createEventHandler.skip = null;
            }

            return canContinue;
        };

    // EventHandler hooks

    if ('onfocusin' in docElem) {
        eventHooks.focus = function(handler) {
            handler._type = 'focusin';
        };
        eventHooks.blur = function(handler) {
            handler._type = 'focusout';
        };
    } else {
        // firefox doesn't support focusin/focusout events
        eventHooks.focus = eventHooks.blur = function(handler) {
            handler.capture = true;
        };
    }
    if (doc.createElement('input').validity) {
        eventHooks.invalid = function(handler) {
            handler.capture = true;
        };
    }

    var _Jiesa = win.Jiesa,
        Jiesa = {
            'on': function(node, type, selector, args, callback, once) {
                node = node.length ? node : [node];
                node.forEach(function(node) {
                    add(node, type, selector, args, callback, once);

                });
            },
            'once': function(node, type, selector, args, callback) {
                return this.on(node, type, selector, args, callback, 1);
            },

            'off': function(node, type, selector, callback) {
                node = node.length ? node : [node];
                node.forEach(function(node) {
                    removeListener(node, type, selector, callback);

                });
            },
            'fire': function(node, type, detail) {
                node = node.length ? node[0] : node;
                return trigger(node, type, detail);

            },
            'setSelectorEngine': setSelectorEngine,
            'eventHooks': eventHooks,
            'noConflict': function() {
                if (win.Jiesa === Jiesa) {
                    win.Jiesa = _Jiesa;
                }

                return Jiesa;
            }
        };
    // initialize selector engine to internal default (qSA or throw Error)
    setSelectorEngine();

    win.Jiesa = Jiesa;

}(window));