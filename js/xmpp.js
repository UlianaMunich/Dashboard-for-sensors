var BOSH_SERVICE = 'http://likepro.co/http-bind/';
var connection = null;
var temp_chart;
var temp_chart_settings = {
    "subtitle": {
        "text": "Real-time updated"
    },
    "yAxis": {
        "title": {
            "text": "Temperature, C"
        }
    },
    "series": [
        {
            "data": [[1390225800697, 0],[1390225874691, 1], [1390225886827, 0]],
            "name": "Temperature in Dresden"
        }
    ],
    "title": {
        "text": "German weather"
    },
    "chart": {
        "type": "spline",
	"renderTo": "graph_placeholder"
    },
    "xAxis": {
        "labels": {
            "rotation": -45
        },
        "type": "datetime"
    }
}

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
    
    // we must return true to keep the handler alive.  
    // returning false would remove it after it finishes.
    return true;
}

$(document).ready(function () {
    $('#connect').click(function(){
	var button = $('#connect').get(0);
	connection.connect($('#jid').get(0).value,
			   $('#pass').get(0).value,
                           onConnect);
    });
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });
    temp_chart = new Highcharts.Chart(temp_chart_settings);
    connection = new Strophe.Connection(BOSH_SERVICE);
});
