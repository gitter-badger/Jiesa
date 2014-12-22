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

##ON

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

**Examples**

```javascript 

// delegated events
Jiesa.on(element, 'click', '#test', handler);

// Several event types
Jiesa.on(element, ["focus", "blur"], handler);

Jiesa.on(element, "click", "span", ["currentTarget"], function(div) {
// <div> is the element was clicked
});

// add  events using object literal

Jiesa.on(element, { click: clickHandler, keyup: keyupHandler })

// add  events using object literal and exposed events

 var literal = {
  click: function(div) { 
  // <div> is the element was clicked 
  },
  mouseenter: function(div) { 
  // <div> is the element that was hovered over
  }

  Jiesa.on(element, literal, ['currentTarget'])

```

##ONCE

**Arguments**

*Jiesa.once()* is an alias for *Jiesa.on()* except that the handler will fire once before being removed.

* element / object (*DOM Element or Object*) - an HTML DOM element
* type(s) (*String|Array*) - an event (or multiple events, space separated) to listen to with optional selector
* selector (*optional*) - a CSS DOM Element selector for matching the given selector
* args (*Array*) - an optional array of handler arguments to pass to the callback function 
* callback (*Function*)	- the callback function

**Example**

```javascript 

// event get removed after first click
Jiesa.once(element, 'click', handler);

```

##OFF

**Arguments**

*Jiesa.off()* unbind an event from the element. This is how you get rid of handlers once you no longer want them active. 

* element / object (*DOM Element or Object*) - an HTML DOM element
* type(s) (*String*) - an event (or multiple events, space separated) to remove
* selector (*optional*) - optional CSS DOM Element selector
* callback (*Function*)	- optional callback function to remove

**Examples**

```javascript 

// remove a single event handlers

Jiesa.off(element, 'click', handler);

// remove multiple events
Jiesa.off(element, 'mousedown mouseup');

// remove a click handler for a particular selector
Jiesa.off(element, 'click', '#test', handler);

// remove all click handlers
Jiesa.off(element, 'click');

// remove handlers for events using object literal
Jiesa.off(element, { click: clickHandler, keyup: keyupHandler })

```

##Fire

Triggers an event of specific type with optional extra arguments

**Arguments**

*Jiesa.off()* unbind an event from the element. This is how you get rid of handlers once you no longer want them active. 

* element / object (*DOM Element or Object*) - an HTML DOM element
* type (*String*) - an event (or multiple events, space separated) to trigger
* arg (*Objectl*) - optional repeatable extra arguments to pass into each event handler

**Example**

```javascript 

// fire click event

Jiesa.fire(element, 'click');


```

#Browser support

All browsers, included **Internet Explorer 8**
