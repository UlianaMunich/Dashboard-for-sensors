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
            graph.charts[node_id].series[0].addPoint(json_obj);
            console.log("Chart updated:", node_id, json_obj);
            return true;
        }
    };
    return graph;
})

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
        raw_input: function (data) {
            console.log('RECV: ' + data);
        },
        // logging IO for debug
        raw_output: function (data) {
            console.log('SENT: ' + data);
        },
        connect: function (jid, pwd, callback) {
            xmpp.connection = new Strophe.Connection(BOSH_SERVICE);
            xmpp.connection.connect(jid, pwd, callback);
            xmpp.connection.rawInput = xmpp.raw_input;
            xmpp.connection.rawOutput = xmpp.raw_output;
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
                    xmpp.handle_incoming,
                    on_subscribe);
                console.log("Subscription request sent,", end_point);
            } else if (end_point.type == "muc") {
                xmpp.connection.muc.join(end_point.name, jid.split("@")[0], xmpp.get_message);
                on_subscribe();
            } else {
                console.log("End point protocol not supported");
            }
        },
        get_message: function(x, y){
            console.log("our function");
            console.log(x, y);
        },
        unsubscribe: function (end_points, on_unsubscribe) {
            var end_point = end_points[0];
            var jid = xmpp.connection.jid;
            if (end_point.type == "pubsub") {
                xmpp.connection.pubsub.unsubscribe(
                    PUBSUB_NODE + '.' + end_points);
                on_unsubscribe();
            } else if (end_point.type == "muc") {
                xmpp.connection.muc.leave(end_point.name, jid.split("@")[0], on_unsubscribe);
            }
        },
        handle_incoming: function (message) {
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
                    if (property == 'subscriptions') {
                        for (var key in user.subscriptions) {
                            xmpp.subscribe(user.subscriptions[key]);
                        }
                    }
                    $rootScope.$apply();
                },
                console.log);
        },
        reload: function () {
            user.load('profile');
            user.load('subscriptions');
            user.load('favorites');
            user.load('registries');
        },
        subscribe: function (sensor, callback) {
            if (!user.check_subscribe(sensor.id)) {
                xmpp.subscribe(sensor.end_points, function () {
                    user.subscriptions[sensor.id] = sensor.end_points;
                    user.save('subscriptions');
                    callback();
                });
            }
        },
        check_subscribe: function (id) {
            for (var key in user.subscriptions) {
                if (key == id) {
                    return true;
                }
            }
            return false;
        },

        unsubscribe: function (sensor, callback) {
            if (user.check_subscribe(sensor.id)) {
                xmpp.unsubscribe(sensor.end_points, function () {
                    for (var key in user.subscriptions) {
                        if (key == sensor.id) {
                            delete user.subscriptions[key];
                            user.save('subscriptions');
                            callback();
                        }
                    }
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