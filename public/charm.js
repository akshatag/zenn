(function() {
  console.log(window.parent)
  window.parent.postMessage('WHATS UP', '*')

  var style = document.createElement('style');
  style.innerHTML = '.charm-data-highlighted { border: 1px solid magenta; }';
  document.getElementsByTagName('head')[0].appendChild(style);

  window.onmouseover = function(event) {
    console.log('mouseenter')
    if(event.target.innerText != '') {
      event.target.classList.add('charm-data-highlighted')
    }
  }

  window.onmouseout = function(event) {
    console.log('mouseleaves')
    event.target.classList.remove('charm-data-highlighted')
  }

  window.onclick = function(event) {
    // var e = new CustomEvent('myevent', {data: event})
    // window.parent.document.dispatchEvent(e)
    console.log(event)

    console.log(event.target.getBoundingClientRect())

    window.parent.postMessage({
      type: event.type,
      x: event.x,
      y: event.y
    }, '*')
  }
})();