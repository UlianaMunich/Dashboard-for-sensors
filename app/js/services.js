'use strict';

var sensdash_services = angular.module('sensdash.services', ['ngResource']);

sensdash_services.factory('Sensor', ['$resource',
    function ($resource) {
        return $resource('api/sensors/:sensorId', {}, {
            query: {method: 'GET', params: {sensorId: 'all'}, isArray: true}
        });
    }]);

sensdash_services.factory('Graph', function () {
    var graph = {
        charts: {},
        addChart: function (node_id, chart_obj) {
            graph.charts[node_id] = chart_obj;
        },
        update: function (json_obj, node_id) {
            if(node_id in graph.charts){
            graph.charts[node_id].series[0].addPoint(json_obj);
            console.log("Chart updated:", node_id, json_obj);
            }return true;
        }
    };
    return graph;
});

sensdash_services.factory('XMPP', ['$location', 'Graph', function ($location, Graph) {
    if (typeof Config === 'undefined') {
        console.log("Config is missing or broken, redirecting to setup reference page");
        $location.path("/reference");
    }
    var BOSH_SERVICE = Config.BOSH_SERVER;
    var PUBSUB_SERVER = Config.PUBSUB_SERVER;
    var PUBSUB_NODE = Config.PUBSUB_NODE;
    var xmpp = {
        connection: {connected: false},
        received_message_ids: [],
        // logging IO for debug
           //raw_input: function (data) {
           //    console.log('RECV: ' + data);
           //  },
           // logging IO for debug
           // raw_output: function (data) {
           //     console.log('SENT: ' + data);
           // },
        connect: function (jid, pwd, callback) {
            xmpp.connection = new Strophe.Connection(BOSH_SERVICE);
            xmpp.connection.connect(jid, pwd, callback);
           //xmpp.connection.rawInput = xmpp.raw_input;
           // xmpp.connection.rawOutput = xmpp.raw_output;
        },
        subscribe: function (end_points, on_subscribe) {
            var end_point = end_points[0];
            var jid = xmpp.connection.jid;
            if (end_point.type == "pubsub") {
                xmpp.connection.pubsub.subscribe(
                    jid,
                    PUBSUB_SERVER,
                    PUBSUB_NODE + '.' + sensor_map,
                    [],
                    xmpp.handle_incoming_pubsub,
                    on_subscribe);
                console.log("Subscription request sent,", end_point);
            } else if (end_point.type == "muc") {
                xmpp.connection.muc.join(end_point.name, jid.split("@")[0], xmpp.handle_incoming_muc);
                on_subscribe();
            } else {
                console.log("End point protocol not supported");
            }
        },
        unsubscribe: function (end_points, on_unsubscribe) {
            var end_point = end_points[0];
            var jid = xmpp.connection.jid;
            if (end_point.type == "pubsub") {
                xmpp.connection.pubsub.unsubscribe(
                    PUBSUB_NODE + '.' + end_points);
                on_unsubscribe();
            } else if (end_point.type == "muc") {
                xmpp.connection.muc.leave(end_point.name, jid.split("@")[0]);
                on_unsubscribe();
            }
        },
        handle_incoming_muc: function (message) {
            var text = Strophe.getText(message.getElementsByTagName('body')[0]);
            try{
                text = text.replace(/&quot;/g,'"');
                var msg_object = JSON.parse(text);
                console.log("JSON message parsed: ", msg_object);
            }catch(e){
                console.log("message is not valid JSON", text);
                return true;
            }
            if (Array.isArray(msg_object)){
            Graph.update(msg_object, '1');
            }
            return true;
        },
        handle_incoming_pubsub: function (message) {
            //console.log(message);
            if (!xmpp.connection.connected) {
                return true;
            }
            var server = "^" + Client.pubsub_server.replace(/\./g, "\\.");
            var re = new RegExp(server);
            if ($(message).attr('from').match(re) && (xmpp.received_message_ids.indexOf(message.getAttribute('id')) == -1)) {
                xmpp.received_message_ids.push(message.getAttribute('id'));
                var _data = $(message).children('event')
                    .children('items')
                    .children('item')
                    .children('entry').text();
                var _node = $(message).children('event').children('items').first().attr('node');
                var node_id = _node.replace(PUBSUB_NODE + '.', '');

                if (_data) {
                    // Data is a tag, try to extract JSON from inner text
                    console.log("Data received", _data);
                    var json_obj = JSON.parse($(_data).text());
                    Graph.update(json_obj, node_id);
                }
            }
            return true;
        }
    };
    return xmpp;
}]);

sensdash_services.factory('User', ['XMPP', '$rootScope', function (xmpp, $rootScope) {
    var user = {
        init: function () {
            user.registries = [];
            user.favorites = [];
            user.subscriptions = {};
            user.profile = {};
        },
        save: function (property) {
            xmpp.connection.private.set(property, property + ":ns", user[property], function (data) {
                    console.log(property + " saved: ", data);
                },
                console.log);
        },
        load: function (property) {
            xmpp.connection.private.get(property, property + ":ns", function (data) {
                    user[property] = data != undefined ? data : [];
                    $rootScope.$apply();
                },
                console.log);
        },
        reload: function () {
            console.log("Loading user data");
            user.load('profile');
            user.load('subscriptions');
            user.load('favorites');
            user.load('registries');
        },
        subscribe: function (sensor) {
            if (!user.check_subscribe(sensor.id)) {
                    user.subscriptions[sensor.id] = sensor.end_points;
                    user.save('subscriptions');
            }
        },
        check_subscribe: function (sensor_id) {
            for (var key in user.subscriptions) {
                if (key == sensor_id) {
                    return true;
                }
            }
            return false;
        },

        unsubscribe: function (sensor, callback) {
            if (user.check_subscribe(sensor.id)) {
                xmpp.unsubscribe(sensor.end_points, function () {
                    delete user.subscriptions[sensor.id];
                    user.save('subscriptions');
                    callback();
                    console.log("user unsubscribed from sensor id = " + sensor.id);
                });
            }
        }
    };
    user.init();
    if (xmpp.connection.connected) {
        user.reload();
    }
    return user;
}]);