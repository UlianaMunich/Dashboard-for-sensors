'use strict';

var sensdash_services = angular.module('sensdash.services', ['ngResource']);

sensdash_services.factory('Sensor', ['$resource',
    function ($resource) {
        return $resource('api/sensors/:sensorId', {}, {
            query: {method: 'GET', params: {sensorId: ''}, isArray: true}
        });
    }]);

sensdash_services.factory('XMPP', function () {
    var xmpp = {
        connection: {connected: false}
    };
    return xmpp
})

sensdash_services.factory('User', ['XMPP', function(xmpp) {
    var user = {
        favorites: {},
        profile: {},
        save: function() {
            xmpp.connection.private.set("profile", "profile:ns", user.profile, function(data){ console.log("Data saved: ", data)}, console.log)
        },
        load: function() {
            xmpp.connection.private.get("profile", "profile:ns", function(data){ user.profile = data}, console.log)
        }
    };
    if (xmpp.connection.connected) {
        user.load();
    }
    return user
}]);