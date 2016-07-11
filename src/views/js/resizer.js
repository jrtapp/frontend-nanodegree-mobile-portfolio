this.onmessage = function(e)
{
	var containers = e.data.containers;
	var newwidth = e.data.newwidth;

    for (var i = 0; i < containers.length; i++) {
      containers[i].style.width = newwidth;
    }

    postMessage(containers);
}
