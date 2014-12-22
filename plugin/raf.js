// raf.js
// Jiesa.js plugin

   var  docElem = document.documentElement,

    // requestAnimationFrame with polyfill for Internet Explorer 8 (rAF)
    //______
    
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

   Jiesa.requestFrame = function(callback) {
        raf(callback);
    };

   Jiesa.cancelFrame = function(frameId) {
        raf(frameId);
    };

   // EventHandler hooks

    ['scroll', 'mousemove'].forEach(function(name) {
        Jiesa.eventHooks[name] = function(handler) {
            var isRunning = true;
            return function(e) { alert(e)
                if (isRunning) {
                    isRunning = raf(function() {
                        isRunning = !handler(e);
                    });
                }
            };
        };
    });

