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

sensdash_services.factory('XMPP', ['Graph', function (Graph) {
    var BOSH_SERVICE = 'http://likepro.co/http-bind/';
    var PUBSUB_SERVER = 'pubsub.likepro.co';
    var PUBSUB_NODE = 'pubsub.sensors';
    var xmpp = {
        connection: {connected: false},
        received_message_ids: [],
        connect: function (jid, pwd, callback) {
            xmpp.connection = new Strophe.Connection(BOSH_SERVICE);
            xmpp.connection.connect(jid, pwd, callback);

        },
        subscribe: function (node_id, on_subscribe) {
            xmpp.connection.pubsub.subscribe(
                xmpp.connection.jid,
                PUBSUB_SERVER,
                PUBSUB_NODE + '.' + node_id,
                [],
                xmpp.handle_incoming,
                on_subscribe);
            console.log("Subscription request sent,", node_id);
        },
        unsubscribe: function (node_id, on_unsubscribe) {
            xmpp.connection.pubsub.unsubscribe(
                PUBSUB_NODE + '.' + node_id);
            on_unsubscribe();
        },
        handle_incoming: function (message) {
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
            user.subscriptions = [];
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
                        for (var i = 0; i < user.subscriptions.length; i++) {
                            xmpp.subscribe(user.subscriptions[i]);
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
        subscribe: function (node, callback) {
            if (!user.check_subscribe(node.id)) {
                xmpp.subscribe(node.id, function () {
                    user.subscriptions.push(node.id);
                    user.save('subscriptions');
                    callback();
                });
            }
        },
        check_subscribe: function (x) {
            return (user.subscriptions.indexOf(x) != -1);
        },

        unsubscribe: function (node, callback) {
            if (user.check_subscribe(node.id)) {
                xmpp.unsubscribe(node.id, function () {
                    user.subscriptions.splice(user.subscriptions.indexOf(node.id), 1);
                    user.save('subscriptions');
                    callback();
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