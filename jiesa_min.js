// Jiesa v 0.0.5a
(function(p,w){function n(a){return"string"===typeof a}function t(a){return"function"===typeof a}function B(a,b){return n(a)?function(e){var c,d,g,f,l;for(x||(g=(b||e.ownerDocument).querySelectorAll(a));e&&1===e.nodeType;e=e.parentNode){if(x)d=y.call(e,a);else for(f=0,l=g.length;f<l;)if(c=g[f++],c===e)return c;if(d||!b||e===b)break}return d&&e}:null}function C(a,b,e,c,d,g){if("number"===typeof a)return(e=b["[[__node__]]"])?e[a]:void 0;if(8===q){var f=c.ownerDocument.documentElement;if("which"===a)return b.keyCode;
if("button"===a)return a=b.button,a&1?1:a&2?3:a&4?2:0;if("pageX"===a)return b.clientX+f.scrollLeft-f.clientLeft;if("pageY"===a)return b.clientY+f.scrollTop-f.clientTop;if("preventDefault"===a)return function(){return b.returnValue=!1};if("stopPropagation"===a)return function(){return b.cancelBubble=!0}}if("type"===a)return e;if("defaultPrevented"===a)return"defaultPrevented"in b?b.defaultPrevented:!1===b.returnValue;if("target"===a)return d;if("currentTarget"===a)return g;if("relatedTarget"===a)return b.relatedTarget||
b[(b.toElement===c?"from":"to")+"Element"];var l=b[a];return t(l)?function(){return l.apply(b,arguments)}:l}function D(a,b,e,c){n(b)&&(b=a[b]);try{return b.call(a,e,c)}catch(d){return p.setTimeout(function(){throw d;},1),!1}}function u(a,b,e,c,d,g){var f=h[a],l=B(b,d),k=function(f){f=f||p.event;if(u.skip!==a&&("ie8"!==k._type||f.srcUrn===a)){var h=f.target||f.srcElement||d.ownerDocument.documentElement,n=!l||1!==h.nodeType||!0===h.disabled&&"click"===event.type?d:l(h),m=c||[b?"currentTarget":"target",
"defaultPrevented"];n&&(1===g&&z(d,a,e),c&&(m=m.map(function(b){return C(b,f,a,d,h,n)})),!1===e.apply(d,m)&&(8===q?f.returnValue=!1:f.preventDefault()))}};f&&(k=f(k,a)||k);8!==q||"on"+(k._type||a)in d||(k._type="ie8");k.type=a;k.callback=e;k.selector=b;return k}function m(a,b,e,c,d,g){if(3!==a.nodeType&&8!==a.nodeType&&b)if(a["[[__event__]]"]||(a["[[__event__]]"]=[]),"string"===typeof b){t(c)&&(d=c,n(e)?c=null:(c=e,e=null));t(e)&&(d=e,c=e=null);if(!t(d))return!1;var f=u(b,e,d,c,a,g);f&&(8===q?a.attachEvent("on"+
(f._type||b),f):a.addEventListener(f._type||b,f,!!f.capture));a["[[__event__]]"].push(f)}else null!==b&&"object"===typeof b&&(A(b)?b.forEach(function(b){g?m(a,b,e,c,d,1):m(a,b,e,c,d)}):(c===w&&A(e)&&(c=e,e=void 0),Object.keys(b).forEach(function(d){g?m(a,d,e,c,b[d],1):m(a,d,e,c,b[d])})))}function z(a,b,e,c){if(a!==w&&a["[[__event__]]"]&&n(b))return void 0===c&&void 0!==e&&(c=e,e=void 0),a["[[__event__]]"].filter(function(d){var g=b!==d.type;if(g=(g=g||e&&e!==d.selector)||c&&c!==d.callback)return!0;
b=d._type||d.type;8===q?a.detachEvent("on"+b,d):a.removeEventListener(b,d,!!d.capture)}),this}function E(a,b,e){if(!a||3!==a.nodeType&&8!==a.nodeType){var c,d;if(n(b))c=h[b],d={},c&&(d=c(d)||d),d=d._type||b;else return!1;8===q?(c=a.ownerDocument.createEventObject(),c["[[__node__]]"]=arguments,"on"+d in a||(d="ie8"),"ie8"===d&&(c.srcUrn=b),a.fireEvent("on"+d,c),c=!1!==c.returnValue):(~b.indexOf(":")?(c=new CustomEvent(d,{detail:e,bubbles:!0}),c["[[__node__]]"]=arguments):(c=a.ownerDocument.createEvent("HTMLEvents"),
c["[[__node__]]"]=arguments,c.initEvent(d,!0,!0)),c=a.dispatchEvent(c));c&&a[b]&&(u.skip=b,D(a,b),u.skip=null);return c}}var r=document.documentElement,A=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)},q=document.documentMode,h={},y=r.matches||r.webkitMatchesSelector||r.mozMatchesSelector||r.oMatchesSelector||r.msMatchesSelector,x=/^[^{]+\{\s*\[native \w/.test(y);"onfocusin"in document.documentElement?(h.focus=function(a){a._type="focusin"},h.blur=function(a){a._type=
"focusout"}):h.focus=h.blur=function(a){a.capture=!0};document.createElement("input").validity&&(h.invalid=function(a){a.capture=!0});var F=p.Jiesa,v={on:function(a,b,e,c,d,g){a=a.length?a:[a];a.forEach(function(a){m(a,b,e,c,d,g)})},once:function(a,b,e,c,d){return this.on(a,b,e,c,d,1)},off:function(a,b,e,c){a=a.length?a:[a];a.forEach(function(a){z(a,b,e,c)})},fire:function(a,b,e){a=a.length?a[0]:a;return E(a,b,e)},eventHooks:h,noConflict:function(){p.Jiesa===v&&(p.Jiesa=F);return v}};p.Jiesa=v})(window);