/*!
 * Jiesa events api library v 0.0.8b
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
        collectionCbRegEx = /callback\.call\(([^)]+)\)/g,

        isString = function(value) {
            return typeof value === 'string';
        },
        isFunction = function(value) {
            return typeof value === 'function';
        },
        isNumber = function(value) {
            return typeof value === 'number';
        },
        isObject = function(value) {
            return value !== null && typeof value === 'object';
        },
        isArray = Array.isArray || function(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        },

        // For better performance, let us create our own collection methods

        cbDefaults = {
            BEFORE: '',
            COUNT: 'a ? a.length : 0',
            BODY: '',
            AFTER: ''
        },

        makeCollection = (function() {
            return function(options) {
                var code = '%BEFORE%\nvar i=0,n=%COUNT%;for(;i<n;++i){%BODY%}%AFTER%',
                    key;

                for (key in cbDefaults) {
                    code = code.replace('%' + key + '%', options[key] || cbDefaults[key]);
                }

                code = code.replace(collectionCbRegEx, function(expr, args) {
                    return '(that?' + expr + ':callback(' + args.split(',').slice(1).join() + '))';
                });

                return Function('a', 'callback', 'that', 'undefined', code);
            };
        })(),

        each = makeCollection({
            BODY: 'callback.call(that, a[i], i, a)',
            AFTER: 'return a'
        }),
        filter = makeCollection({
            BEFORE: 'var arr = []',
            BODY: 'if (callback.call(that, a[i], i, a)) arr.push(a[i])',
            AFTER: 'return arr'
        }),
        map = makeCollection({
            BEFORE: 'var arr = Array(a && a.length || 0)',
            BODY: 'arr[i] = callback.call(that, a[i], i, a)',
            AFTER: 'return arr'
        }),

        // A container 'hook' for special event types

        eventHooks = {
            // Normalize mousewheel for older Firefox 
            'mousewheel': function(handler) {
                handler._type = typeof InstallTrigger !== void 0 ? 'DOMMouseScroll' : 'mousewheel';
            }
        },

        // Detects XML nodes

        isXML = function(node) {
            var documentElement = node && (node.ownerDocument || node).documentElement;
            return documentElement ? documentElement.nodeName !== 'HTML' : false;
        },

        // Check for querySelectorAll browser support

        supportQSA = rnative.test(docElem.querySelectorAll),

        // Check for querySelectorAll browser bugs
        qsaBugs = (function() {

            var buggy = [],
                id = 'jiesa_unique',
                whitespace = "[\\x20\\t\\r\\n\\f]",
                booleans = 'checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped',
                div = document.createElement('div');

            docElem.appendChild(div).innerHTML = "<a id='" + id + "'></a>" +
                "<select id='" + id + "-\f]' msallowcapture=''>" +
                "<option selected=''></option></select>";

            // Support: IE8, Opera 11-12.16
            if (div.querySelectorAll("[msallowcapture^='']").length) {
                buggy.push("[*^$]=" + whitespace + "*(?:''|\"\")");
            }

            // Support: IE8
            if (!div.querySelectorAll("[selected]").length) {
                buggy.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
            }

            // Webkit/Opera - :checked should return selected option elements
            // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
            // IE8 throws error here and will not see later tests
            if (!div.querySelectorAll(":checked").length) {
                buggy.push(":checked");
            }

            // Support: Chrome<29, Android<4.2+, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.7+
            if (!div.querySelectorAll("[id~=" + id + "-]").length) {
                buggy.push("~=");
            }
            // Support: Safari 8+, iOS 8+
            if (!div.querySelectorAll("a#" + id + "+*").length) {
                buggy.push(".#.+[+~]");
            }
            // release memory in IE
            div = null;

            return buggy.length && new RegExp(buggy.join("|"));

        }()),

        // Marker for native QSA

        useQSA = true,

        // selector engine for delegated events, use querySelectorAll if it exists

        selectorEngine,

        setSelectorEngine = function(e) {
            if (!arguments.length) {
                selectorEngine = supportQSA && doc.querySelectorAll ? function(selector, context) {
                    return context.querySelectorAll(selector);
                } : function() {
                    throw new Error('Jiesa: No selector engine installed');
                };
            } else {
                // Mark that we are no longer using QSA as the
                // default fallback selector engine
                useQSA = false;
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
        // I'm well aware that that matchesSelector have bugs regarding 
        // a few CSS2/CSS3 pseudo selectors, but should we check for it or not??

        supportMatchesSelector = rnative.test(matchesSelector),

        // Support: IE9 - disconnected nodes

        disconnectedNodes = (function() {
            var div = document.createElement('div'),
                ret = !!matchesSelector.call(div, 'div');
            // Avoid memory leaks in IE
            div = null;
            return ret;
        }()),

        // Jiesa matchesSelector for delegated events. It's using matchesSelector if it exists
        // with fallback to querySelectorAll for older browsers (e.g. IE8, Opera 12.x) OR end-devs
        // selector engine if installed (it will overwrte native QSA fallback)

        JiesaMatches = function(selector, context) {

            if (!isString(selector)) {
                return null;
            }

            return function(node) {

                var n, res, found, index, length;

                if (!supportMatchesSelector || (supportMatchesSelector && isXML(doc))) {

                    // QSA are not supported on XML documents, so let Jiesa throw if XML doc,
                    // or QSA are buggy

                    if (useQSA && (qsaBugs.test(selector) || isXML(doc))) {
                        throw new Error('Jiesa: This version of querySelectorAll (QSA) are not supported.');
                    }
                    found = selectorEngine(selector, (context || node.ownerDocument));
                }

                // Disconnected nodes are said to be in a document
                // fragment in IE 9, so we avoid it if we make sure the 
                // node always have a nodeType of value 1

                for (; node && node.nodeType === 1; node = node.parentNode) {

                    if (supportMatchesSelector &&
                        // IE 9's matchesSelector returns false on disconnected nodes
                        disconnectedNodes) {
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

        // fix event properties to comply with W3C standards, before returning those 
        // events who are requested by the end-developer by taking the actual DOM event object 
        // and filter by request.

        fixEvents = function(node, name, evt, type, target, currentTarget) {

            if (isNumber(name)) {
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

        // Create event handler

        wrappedHandler = function(node, type, selector, callback, props, once) {

            var matcher = JiesaMatches(selector, node),
                hook = eventHooks[type],
                handler = function(evt) {

                    // Support: IE8 +

                    evt = evt || ((node.ownerDocument || node.document || node).parentWindow || win).event;

                    // early stop in case of default action

                    if (wrappedHandler.skip === type) {
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
                        args = map(args, function(name) {
                            return fixEvents(node, name, evt, type, target, currentTarget);
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
            if (isString(type)) {

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

                var handler = wrappedHandler(node, type, selector, callback, args, once);

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
                    each(type, function(name) {
                        if (once) {
                            temp(node, name, selector, args, callback, true);
                        } else {
                            add(node, name, selector, args, callback);
                        }
                    });
                } else {

                    if (args === void 0 && isArray(selector)) {
                        args = selector;
                        selector = void 0;
                    }
                    each(Object.keys(type), function(name) {
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

            if (node === void 0 || !node[EVENT] || !isString(type)) {
                return;
            }

            if (callback === void 0 && selector !== void 0) {
                callback = selector;
                selector = void 0;
            }

            filter(node[EVENT], function(handler) {

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
                wrappedHandler.skip = type;

                magicGuard(node, type);

                wrappedHandler.skip = null;
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

    // NON-W3C support

    if (!W3C_MODEL) {

        var msie = document.documentMode,
            ie9 = msie === 9,
            ie8 = msie === 8,
            FormButton = RegExp('^(reset|submit)$'),
            FormTextbox = RegExp('^(textarea|text|password|file)$');

        // onkeydown on form elements

        document.attachEvent('onkeydown', function() {
            var evt = window.event,
                target = evt.srcElement,
                type = target.type;
            if (FormTextbox.test(type) &&
                target.form &&
                evt.keyCode === 13 &&
                evt.returnValue !== false) {
                trigger(target.form, 'submit');
                return false;
            }
        });

        document.attachEvent('onclick', function() {
            var target = window.event.srcElement,
                type = target.type;
            // html form elements only
            if (FormButton.test(type) && target.form) {
                trigger(target.form, type);
            }
        });
        var inputEventHandler = function() {
                if (srcNode && srcNode.value !== srcNodeValue) {
                    srcNodeValue = srcNode.value;
                    // trigger custom event that bubbles
                    trigger(srcNode, 'input');
                }
            },
            clickEventHandler = function() {
                if (srcNode && srcNode.checked !== srcNodeValue) {
                    srcNodeValue = srcNode.checked;
                    trigger(srcNode, 'change');
                }
            },
            changeEventHandler = function() {
                trigger(srcNode, 'change');
            },
            srcNode, srcNodeValue;

        if (ie9) {
            document.attachEvent('onselectionchange', inputEventHandler);
        }

        // input event fix via propertychange
        document.attachEvent('onfocusin', function() {
            if (srcNode && ie8) {
                srcNode.detachEvent('onclick', clickEventHandler);
                srcNode.detachEvent('onchange', changeEventHandler);
                srcNode.detachEvent('onpropertychange', inputEventHandler);
            }

            srcNode = window.event.srcElement;
            srcNodeValue = srcNode.value;

            if (ie8) {
                var type = srcNode.type;

                if (type === 'checkbox' || type === 'radio') {
                    srcNode.attachEvent('onclick', clickEventHandler);
                    srcNodeValue = srcNode.checked;
                } else if (srcNode.nodeType === 1) {
                    srcNode.attachEvent('onchange', changeEventHandler);

                    if (type === 'text' ||
                        type === 'password' ||
                        type === 'textarea') {
                        srcNode.attachEvent('onpropertychange', inputEventHandler);
                    }
                }
            }
        });
    }

    var _Jiesa = win.Jiesa,
        Jiesa = {
            'on': function(node, type, selector, args, callback, once) {
                node = node.length ? node : [node];
                each(node, function(node) {
                    add(node, type, selector, args, callback, once);

                });
            },
            'once': function(node, type, selector, args, callback) {
                return this.on(node, type, selector, args, callback, 1);
            },

            'off': function(node, type, selector, callback) {
                node = node.length ? node : [node];
                each(node, function(node) {
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