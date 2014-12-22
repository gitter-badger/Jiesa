# Jiesa

Jiesa is a lightning fast event manager using the newest technology. It's designed for desktop, mobile, and touch-based browsers. 

As a start,- it works like this:

```javascript

// default

Jiesa.on(element, 'click', function () {
  console.log('hello');
});

// event delegated events

Jiesa.on(element, 'click', '#test', function () {
  console.log('hello');
});

```

#API

* Jiesa.on()
* Jiesa.one()
* Jiesa.off()
* Jiesa.fire()

#ON

Attach event listeners to both elements and objects:

```javascript 
Jiesa.on() 
```
**Arguments**

* element / object (*DOM Element or Object*) - an HTML DOM element
* type(s) (*String|Array*) - an event (or multiple events, space separated) to listen to with optional selector
* selector (*optional*) - a CSS DOM Element selector for matching the given selector
* args (*Array*) - an optional array of handler arguments to pass to the callback function 
* callback (*Function*)	- the callback function

#ONCE

**Arguments**

*Jiesa.once()* is an alias for *Jiesa.on()* except that the handler will fire once before being removed.

* element / object (*DOM Element or Object*) - an HTML DOM element
* type(s) (*String|Array*) - an event (or multiple events, space separated) to listen to with optional selector
* selector (*optional*) - a CSS DOM Element selector for matching the given selector
* args (*Array*) - an optional array of handler arguments to pass to the callback function 
* callback (*Function*)	- the callback function

#OFF

**Arguments**

*Jiesa.off()* unbind an event from the element. This is how you get rid of handlers once you no longer want them active. 

* element / object (*DOM Element or Object*) - an HTML DOM element
* type(s) (*String*) - an event (or multiple events, space separated) to remove
* selector (*optional*) - optional CSS DOM Element selector
* callback (*Function*)	- optional callback function to remove


#Browser support

All browsers, included **Internet Explorer 8**
