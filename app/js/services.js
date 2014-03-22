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
            for (var i = 0; i < all_registries.length; i++) {
                requests.push($http.get(all_registries[i]));
            }
            var q = $q.all(requests);
            var flat_list = q.then(function (result) {
                var list = [];
                for (var i = 0; i < result.length; i++) {
                    list = list.concat(result[i].data);
                }
                return list;
            });
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
                var shift = (graph.charts[node_id].series[0].data.length > 10);
                graph.charts[node_id].series[0].addPoint(json_obj, true, shift);
               // console.log("Chart updated:", node_id, json_obj);
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
            if (messages.length > 20) {
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
        endpoints_to_handler_map: {},
        received_message_ids: [],
        // logging IO for debug
        raw_input: function (data) {
            console.log("RECV: " + data);
          },
        // logging IO for debug
         raw_output: function (data) {
             console.log("SENT: " + data);
         },
        connect: function (jid, pwd, callback) {
            xmpp.connection = new Strophe.Connection(BOSH_SERVICE);
            xmpp.connection.connect(jid, pwd, callback);
        //    xmpp.connection.rawInput = xmpp.raw_input;
        //    xmpp.connection.rawOutput = xmpp.raw_output;
        },
        subscribe: function (end_point, on_subscribe) {
            xmpp.endpoints_to_handler_map[end_point.name] = end_point;
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
                var nickname = jid.split("@")[0];
                var room = end_point.name.replace("xmpp://",'');
                xmpp.connection.muc.join(room, nickname, xmpp.handle_incoming_muc);
                on_subscribe();
            } else {
                console.log("End point protocol not supported");
            }
        },
        unsubscribe: function (end_point, on_unsubscribe) {
            var jid = xmpp.connection.jid;
            if (end_point.type == "pubsub") {
                xmpp.connection.pubsub.unsubscribe(PUBSUB_NODE + "." + end_points);
                on_unsubscribe();
            } else if (end_point.type == "muc") {
                var room = end_point.name.replace("xmpp://",'');
                xmpp.connection.muc.leave(room, jid.split("@")[0]);
                on_unsubscribe();
            }
        },
        find_sensor: function (message) {
            var endpoint_name = message.getAttribute('from');
            //to get to the end_points.name and add "xmpp://"
            endpoint_name = "xmpp://" + endpoint_name.replace(/\/\w+/g, '');
            if (endpoint_name in xmpp.endpoints_to_handler_map) {
                var handler_id = xmpp.endpoints_to_handler_map[endpoint_name].handler_id;
                var handler_type = xmpp.endpoints_to_handler_map[endpoint_name].handler_type;
                return {"id": handler_id, "type": handler_type};
            } else {
                // endpoint not found in subscriptions map
                return false;
            }
        },
        handle_incoming_muc: function (message) {
            var sensor = xmpp.find_sensor(message);
            if (!(sensor)) {
                // sensor not found
                return true;
            }
            var text = Strophe.getText(message.getElementsByTagName("body")[0]);
            if (sensor.type == 'text') {
              if (typeof text == "string") {
                  var text = text.substring(0,text.indexOf("- http://"));
                   Text.updateTextBlock(text, sensor["id"]);
                    //find an URL in the text
                  var source = (text || '').toString();
                  var urlArray = [];
                  var matchArray;
                  // Regular expression to find FTP, HTTP(S) and email URLs.
                  var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;

                  // Iterate through any URLs in the text.
                  while( (matchArray = regexToken.exec( source )) !== null )
                  {
                      var token = matchArray[0];
                      urlArray.push( token );
                    //  console.log(urlArray);
                  }
                  return urlArray;
               } else {
                  console.log("Message is not a Text");
               }
            } else if (sensor.type == 'chart') {
                try {
                    text = text.replace(/&quot;/g, '"');
                    var msg_object = JSON.parse(text);
                    var data_array = [];
                    //console.log("JSON message parsed: ", msg_object);
                    //creating a new array from received map for Graph.update in format [timestamp, value], e.g. [1390225874697, 23]
                    if ('sensorevent' in msg_object) {
                        var time_UTC = msg_object.sensorevent.timestamp;
                        var time_UNIX = new Date(time_UTC).getTime();
                        data_array[0] = time_UNIX;
                        data_array[1] = msg_object.sensorevent.values[0];
                    } else {
                        data_array = msg_object;
                    }
                } catch (e) {
                  //  console.log("message is not valid JSON", text);
                    return true;
                }
                if (Array.isArray(data_array)) {
                    Graph.update(data_array, sensor.id);
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
            user.load("registries");
            user.load("profile");
            user.load("subscriptions");
            user.load("favorites");
        },
        subscribe: function (sensor) {
            if (!user.check_subscribe(sensor.id)) {
                var end_points = sensor.end_points;
                // annotate end-points with extra information from sensor
                for (var i = 0; i < end_points.length; i++) {
                    end_points[i].handler_type = sensor.type;
                    end_points[i].handler_id = sensor.id;
                    end_points[i].sla_last_update = sensor.sla_last_update;
                }
                user.subscriptions[sensor.id] = end_points;
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
        check_sla: function (sensor) {
            var sla_current_timestamp = sensor.sla_last_update;
            var newArray = user.subscriptions[sensor.id];
            for (var i =0; i < newArray.length; i++) {
                if (newArray[i].sla_last_update !== sla_current_timestamp) {
                    console.log("Last SLA updates are differ from your SLA");
                    delete user.subscriptions[sensor.id];
                    delete user.favorites.indexOf(sensor.id);
                    user.save("subscriptions");
                    user.save("favorites");
                    alert("SLA for sensor '" + sensor.title + "' was changed. If you want to use it you need to accept new SLA. Thank you!");
                }else{
                    console.log("No new SLA updates");
                }
            }
            return false;
        },
        unsubscribe: function (sensor, callback) {
            if (user.check_subscribe(sensor.id)) {
                delete user.subscriptions[sensor.id];
                user.save("subscriptions");
                callback();
                console.log("user unsubscribed from sensor id = " + sensor.id);
            }
        }
    };
    if (xmpp.connection.connected) {
        user.reload();
    }
    user.init();

    return user;
}]);