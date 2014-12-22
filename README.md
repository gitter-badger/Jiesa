# Jiesa

Jiesa is a lightning fast event manager using the newest technology. It's designed for desktop, mobile, and touch-based browsers. 

Documentation will follow soon, but as a start,- it works like this:

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

#Browser support

All browsers, included **Internet Explorer 8**
