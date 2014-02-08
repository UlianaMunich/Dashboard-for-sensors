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