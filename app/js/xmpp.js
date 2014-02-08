var connection = null;
var BOSH_SERVICE = 'http://likepro.co/http-bind/';

function draw_graph(data) {
    console.log("New data: " + data);
    var series = temp_chart.series[0];
    var shift = series.data.length > 20; // shift if the series is longer than 20
    // add the point
    temp_chart.series[0].addPoint(data, true, shift);
}

function onConnect(status)
{
    if (status == Strophe.Status.CONNECTING) {
	console.log('connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
	console.log('XMPP connection is failed to connect.');
	$('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.DISCONNECTING) {
	console.log('XMPP is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
	console.log('XMPP is disconnected.');
	$('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.CONNECTED) {
	console.log('XMPP connection is established.');

	connection.addHandler(onMessage, null, 'message', null, null,  null); 
	connection.send($pres().tree());
    }
}

function onMessage(msg) {
    // for example, send me [{"name": "Test Graph","data": [[1,3],[2,5],[3,4],[4,5]]}]
    var to = msg.getAttribute('to');
    var from = msg.getAttribute('from');
    var type = msg.getAttribute('type');
    var elems = msg.getElementsByTagName('body');

    if (type == "chat" && elems.length > 0) {
        var body = elems[0];
        var data = $.parseJSON(body.textContent)

	console.log('message from ' + from + ' received: ' + data);
	// Create a graph with received data
	draw_graph(data);
    }
    return true;
}

function connect_xmpp(jid, pass) {
    connection = new Strophe.Connection(BOSH_SERVICE);
    connection.connect(jid, pass, onConnect);
}