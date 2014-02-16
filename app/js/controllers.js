'use strict';

/* Controllers */

var sensdash_controllers = angular.module('sensdash.controllers', []);

sensdash_controllers.controller('RegistryCtrl', ['$scope', 'Sensor', 'User',
    function ($scope, Sensor, User) {
        $scope.sensors = Sensor.query();
        $scope.user = User;
    }]);

sensdash_controllers.controller('StreamCtrl', ['$scope', 'Sensor', 'User',
    function ($scope, Sensor, User) {
        $scope.sensors = [];
        var registry_sensors = Sensor.query();
        registry_sensors.$promise.then(function (registry_sensors) {
            for (var i = 0; i < registry_sensors.length; i++) {
                if (User.subscriptions.indexOf(registry_sensors[i].id) >= 0) {
                    $scope.sensors.push(registry_sensors[i]);
                }
            }
        });
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
            User.subscribe($scope.sensor, function () {
                console.log("user subscribed to sensor", $scope.sensor.id);
            });
        }, function () {
            console.log("User cancelled");
        });
    };
};

var SensorModalInstanceCtrl = function ($scope, $modalInstance, sensor, User) {
    $scope.user = User;
    $scope.sensor = sensor;
    $scope.accept_sla = false;

    $scope.subscribe = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};
