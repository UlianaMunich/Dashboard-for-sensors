'use strict';

/* Controllers */

var sensdash_controllers = angular.module('sensdash.controllers', []);

sensdash_controllers.controller('RegistryCtrl', ['$scope', 'Sensor', 'XMPP',
    function ($scope, Sensor, XMPP) {
        $scope.sensors = Sensor.query();
        $scope.xmpp = XMPP;
    }]);

sensdash_controllers.controller('StreamCtrl', ['$scope', 'Sensor', 'User',
    function ($scope, Sensor, User) {
        $scope.sensors = Sensor.query();
    }
]);
sensdash_controllers.controller('SettingsCtrl', ['$scope', '$routeParams', 'User',
    function ($scope, $routeParams, User) {
        $scope.user = User;
    }
]);
sensdash_controllers.controller('preview_slideshow', ['$scope', '$routeParams',
    function ($scope, $routeParams) {
        $scope.test = "Hello World";
    }
]);

//Modal window controllers, check definition syntax
function SensorModalCtrl($scope, $modal, User) {
    $scope.open = function () {

        var modalInstance = $modal.open({
            templateUrl: 'partials/blocks/sensor_details_modal.html',
            controller: SensorModalInstanceCtrl,
            resolve: {
                sensor: function () {
                    return $scope.sensor;
                }
            }
        });
        modalInstance.result.then(function () {
            console.log("User started subscription");
            User.subscribe($scope.sensor, function () {
                $scope.sensor.subscribed = true;
            });
        }, function () {
            console.log("User cancelled");
        });
    };
};

var SensorModalInstanceCtrl = function ($scope, $modalInstance, sensor) {

    $scope.sensor = sensor;
    $scope.accept_sla = false;

    $scope.subscribe = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};
