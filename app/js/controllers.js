'use strict';

/* Controllers */

var sensdash_controllers = angular.module('sensdash.controllers', []);

sensdash_controllers.controller('RegistryCtrl', ['$scope', 'Sensor', 'User',
    function ($scope, Sensor, User) {
        $scope.sensors = Sensor.query();
        $scope.user = User;
    }]);

sensdash_controllers.controller('StreamCtrl', ['$scope', 'Sensor', 'User', 'XMPP',
    function ($scope, Sensor, User, XMPP) {
        $scope.sensors = [];
        var registry_sensors = Sensor.query();
        registry_sensors.$promise.then(function (registry_sensors) {
            for (var i = 0; i < registry_sensors.length; i++) {
                if (User.check_subscribe(registry_sensors[i].id)) {
                    $scope.sensors.push(registry_sensors[i]);
                }
            }
        });
        for (var key in User.subscriptions) {
            var ep = User.subscriptions[key];
            XMPP.subscribe(ep, function () {
                console.log("Rooms joined");
            });
        }
        $scope.$on('$destroy', function(){
            for (var key in User.subscriptions) {
                var ep = User.subscriptions[key];
                XMPP.unsubscribe(ep, function () {
                    console.log("Rooms left");
                });
            }
        });
    }
]);

sensdash_controllers.controller('FavoritesCtrl', ['$scope', '$routeParams', 'Sensor', 'User', 'XMPP',
    function ($scope, $routeParams, Sensor, User, XMPP) {
        var all_sensors = Sensor.query();
        var user_favorites = User.favorites;
        $scope.result_favorites = [];
        all_sensors.$promise.then(function (all_sensors) {
            for (var i = 0; i < all_sensors.length; i++) {
                if (user_favorites.indexOf(all_sensors[i].id) != -1) {
                    $scope.result_favorites.push(all_sensors[i]);
                }
            }
        });
        for (var key in User.subscriptions) {
            var ep = User.subscriptions[key];
            XMPP.subscribe(ep, function () {
                console.log("Rooms joined");
            });
        }
        $scope.$on('$destroy', function(){
            for (var key in User.subscriptions) {
                var ep = User.subscriptions[key];
                XMPP.unsubscribe(ep, function () {
                    console.log("Rooms left");
                });
            }
        });
    }
]);

sensdash_controllers.controller('SettingsCtrl', ['$scope', 'User', function ($scope, User) {
    $scope.user = User;

    $scope.registryAdd = function () {
        if ($scope.user.registries.indexOf($scope.inputRegistryURL) == -1) {
            $scope.user.registries.push($scope.inputRegistryURL);
            $scope.user.save('registries');
            console.log($scope.user.registries);
            $scope.inputRegistryURL = '';
        }
    };
    $scope.registryDelete = function (x) {
        var r = $scope.user.registries;
        r.splice(r.indexOf(x), 1);
        $scope.user.save('registries');
    }
}
]);

sensdash_controllers.controller('ReferencesCtrl', ['$scope',
    function ($scope) {
    }]);

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
        }, function () {
            console.log("Modal closed");
        });
    };
};

var SensorModalInstanceCtrl = function ($scope, $modalInstance, sensor, User) {
    $scope.user = User;
    $scope.sensor = sensor;
    $scope.accept_sla = false;

    $scope.subscribe = function () {
        User.subscribe($scope.sensor);
        $modalInstance.close();
    };

    $scope.unsubscribe = function () {
        User.unsubscribe($scope.sensor, function () {
            console.log("user unsubscribed from sensor", $scope.sensor.id);
        });
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };
};

//Modal for registry view in Settings Tab
function RegistryModalCtrl($scope, $modal, User) {
    $scope.open = function () {

        var modalInstance = $modal.open({
            templateUrl: 'partials/blocks/registry_details_modal.html',
            controller: RegistryModalInstanceCtrl,
            resolve: {
                sensor: function () {
                    return $scope.sensor;
                }
            }
        });
        modalInstance.result.then(function () {
        }, function () {
            console.log("Modal closed");
        });
    };
};
var RegistryModalInstanceCtrl = function ($scope, $modalInstance, sensor, User) {
    $scope.user = User;
    $scope.sensor = sensor;

    $scope.viewRegistry = function () {
        User.viewRegistry($scope.sensor, function () {
            console.log("User saw JSON file", $scope.sensor.id);
        });
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};