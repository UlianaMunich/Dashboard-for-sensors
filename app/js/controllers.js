"use strict";

var sensdash_controllers = angular.module("sensdash.controllers", []);

sensdash_controllers.controller("RegistryCtrl", ["$scope", "Registry", "User",
    function ($scope, Registry, User) {
        Registry.load().then(function (sensors) {
            $scope.sensors = sensors;
        });
        $scope.user = User;
    }]);

sensdash_controllers.controller("StreamCtrl", ["$scope", "Registry", "User", "XMPP",
    function ($scope, Registry, User, XMPP) {
        $scope.sensors = [];
        $scope.subscrip = Object.keys(User.subscriptions);
        Registry.load().then(function (registry_sensors) {
            for (var i = 0; i < registry_sensors.length; i++) {
                if (User.check_subscribe(registry_sensors[i].id)) {
                    $scope.sensors.push(registry_sensors[i]);
                    User.check_sla(registry_sensors[i]);
                }
            }
        });
        for (var key in User.subscriptions) {
            var ep = User.subscriptions[key];
            XMPP.subscribe(ep);
        }
        $scope.$on("$destroy", XMPP.unsubscribe_all_endpoints);
    }
]);

sensdash_controllers.controller("FavoritesCtrl", ["$scope", "Registry", "User", "XMPP",
    function ($scope, $routeParams, Registry, User, XMPP) {
        var user_favorites = User.favorites;
        $scope.result_favorites = [];
        Registry.load().then(function (all_sensors) {
            for (var i = 0; i < all_sensors.length; i++) {
                if (user_favorites.indexOf(all_sensors[i].id) != -1) {
                    $scope.result_favorites.push(all_sensors[i]);
                    User.check_sla(all_sensors[i]);
                }
            }
        });
        for (var key in User.subscriptions) {
            var ep = User.subscriptions[key];
            XMPP.subscribe(ep, function () {
                console.log("Room joined");
            });
        }
        $scope.$on("$destroy", function () {
            for (var key in User.subscriptions) {
                var ep = User.subscriptions[key];
                XMPP.unsubscribe(ep[0], function () {
                    console.log("Room was left");
                });
            }
        });
    }
]);

sensdash_controllers.controller("SettingsCtrl", ["$scope", "User", function ($scope, User) {
    $scope.user = User;
    $scope.preinstalled_registries = Config.REGISTRIES;

    $scope.registryAdd = function () {
        if ($scope.user.registries.indexOf($scope.inputRegistryURL) == -1) {
            $scope.user.registries.push($scope.inputRegistryURL);
            $scope.user.save("registries");
            console.log($scope.user.registries);
            $scope.inputRegistryURL = "";
        }
    };
    $scope.registryDelete = function (x) {
        var r = $scope.user.registries;
        r.splice(r.indexOf(x), 1);
        $scope.user.save("registries");
    }
}
]);

sensdash_controllers.controller("ReferencesCtrl", ["$scope",
    function ($scope) {
    }]);

//Modal window controllers, check definition syntax
function SensorModalCtrl($scope, $modal, User) {
    $scope.open = function () {

        var modalInstance = $modal.open({
            templateUrl: "partials/blocks/sensor_details_modal.html",
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
            console.log("user unsubscribed from sensor: " + $scope.sensor.id);
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
            templateUrl: "partials/blocks/registry_details_modal.html",
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
        $modalInstance.dismiss("cancel");
    };
};