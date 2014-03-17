"use strict";

var sensdash_services = angular.module("sensdash.services", ["ngResource"]);

sensdash_services.factory("Sensor", ["$resource",
    function ($resource) {
        return $resource("api/sensors/:sensorId", {}, {
            query: {method: "GET", params: {sensorId: "all"}, isArray: true}
        });
    }]);

sensdash_services.factory("Registry", ["$http", "$q", "User", function ($http, $q, User) {
    var registry = {
        load: function () {
            var requests = [];
            var all_registries = User.registries.concat(Config.REGISTRIES);
            for(var i=0; i<all_registries.length; i++) {
                requests.push($http.get(all_registries[i]));
            }
            var q = $q.all(requests);
            var flat_list = q.then(function(result){
                var list = [];
                for(var i=0; i<result.length; i++) {
                    list = list.concat(result[i].data);
                }
                return list;
            })
            return flat_list;
        }
    }
    return registry;
}])

sensdash_services.factory("Graph", function () {
    var graph = {
        charts: {},
        addChart: function (node_id, chart_obj) {
            graph.charts[node_id] = chart_obj;
        },
        update: function (json_obj, node_id) {
            if (node_id in graph.charts) {
                var shift = (graph.charts[1].series[0].data.length > 10);
                graph.charts[node_id].series[0].addPoint(json_obj, true, shift);
                console.log("Chart updated:", node_id, json_obj);
            }
            return true;
        }
    };
    return graph;
});
sensdash_services.factory("Text", function () {
    var text = {
        text_blocks_map: {},
        updateTextBlock: function (new_text, sensor_id) {
            var element_for_text = text.text_blocks_map[sensor_id];
            var messages = element_for_text.children("p");
            if (messages.length > 10) {
                messages[0].remove();
            }
            element_for_text.append("<p>" + new_text + "</p>");
        }
    };
    return text;
});

sensdash_services.factory("XMPP", ["$location", "Graph", "Text", function ($location, Graph, Text) {
    if (typeof Config === "undefined") {
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
        //    console.log("RECV: " + data);
        //  },
        // logging IO for debug
        // raw_output: function (data) {
        //     console.log("SENT: " + data);
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
                    PUBSUB_NODE + "." + sensor_map,
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
                    PUBSUB_NODE + "." + end_points);
                on_unsubscribe();
            } else if (end_point.type == "muc") {
                xmpp.connection.muc.leave(end_point.name, jid.split("@")[0]);
                on_unsubscribe();
            }
        },
        find_sensor: function (message) {
            return {"id": 1, "type": "chart"};
        },
        handle_incoming_muc: function (message) {
            var sensor = xmpp.find_sensor(message);
            var text = Strophe.getText(message.getElementsByTagName("body")[0]);
            if (sensor.type == 'text') {
                if (typeof text == "string"){
                    Text.updateTextBlock(text, sensor["id"]);
                } else {
                    console.log("Message is not a Text");
                }
            } else if (sensor.type == 'chart') {
                try {
                    var text = text.replace(/&quot;/g, '"');
                    var msg_object = JSON.parse(text);
                    console.log("JSON message parsed: ", msg_object);
                    //creating a new array from received map for Graph.update in format [timestamp, value], e.g. [1390225874697, 23]
                    if ('sensorevent' in msg_object) {
                        var time_UTC = msg_object.sensorevent.timestamp;
                        var time_UNIX = (new Date(time_UTC.split(".").join("-")).getTime())/1000;
                        var data_array = new Array();
                        data_array[0] = time_UNIX;
                        data_array[1] = msg_object.sensorevent.values[0];
                    } else {
                        var data_array = msg_object;
                    }
                    console.log(data_array);
                } catch (e) {
                    console.log("message is not valid JSON", text);
                    return true;
                }
                if (Array.isArray(data_array)) {
                    Graph.update(data_array, "1");
                }
            }
            return true;
        },
        handle_incoming_pubsub: function (message) {
            if (!xmpp.connection.connected) {
                return true;
            }
            var server = "^" + Client.pubsub_server.replace(/\./g, "\\.");
            var re = new RegExp(server);
            if ($(message).attr("from").match(re) && (xmpp.received_message_ids.indexOf(message.getAttribute("id")) == -1)) {
                xmpp.received_message_ids.push(message.getAttribute("id"));
                var _data = $(message).children("event")
                    .children("items")
                    .children("item")
                    .children("entry").text();
                var _node = $(message).children("event").children("items").first().attr("node");
                var node_id = _node.replace(PUBSUB_NODE + ".", "");

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

sensdash_services.factory("User", ["XMPP", "$rootScope", function (xmpp, $rootScope) {
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
            user.load("profile");
            user.load("subscriptions");
            user.load("favorites");
            user.load("registries");
        },
        subscribe: function (sensor) {
            if (!user.check_subscribe(sensor.id)) {
                user.subscriptions[sensor.id] = sensor.end_points;
                user.save("subscriptions");
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
                    user.save("subscriptions");
                    callback();
                    console.log("user unsubscribed from sensor id = " + sensor.id);
                });
            }
        },
        check_sla_updates:function(sensor,callback){
            var last_update = sensor.sla_last_update;
            var current_sla_date = user.subscriptions;
        }
    };
    user.init();
    if (xmpp.connection.connected) {
        user.reload();
    }
    return user;
}]);