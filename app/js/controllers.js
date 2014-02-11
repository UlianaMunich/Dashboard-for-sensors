'use strict';

/* Controllers */

var sensdash_controllers = angular.module('sensdash.controllers', []);

sensdash_controllers.controller('RegistryCtrl', ['$scope', 'Sensor', 'XMPP',
    function ($scope, Sensor, XMPP) {
        $scope.sensors = Sensor.query();
        $scope.xmpp = XMPP;
    }]);

sensdash_controllers.controller('StreamCtrl', ['$scope', 'Sensor',
    function ($scope, Sensor) {
        $scope.sensors = Sensor.query();
    }
]);
sensdash_controllers.controller('SettingsCtrl', ['$scope', '$routeParams',
    function ($scope, $routeParams) {
        $scope.test = "Hello World";
    }
]);
sensdash_controllers.controller('preview_slideshow', ['$scope', '$routeParams',
    function ($scope, $routeParams) {
        $scope.test = "Hello World";
    }
]);

//Modal window controllers, check definition syntax
function SensorModalCtrl($scope, $modal) {
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
        modalInstance.result.then(function (accepted) {
            console.log("User started subscription");
            $scope.sensor.subscribed = true; // try to use '= accepted' here
        }, function () {
            console.log("User cancelled");
        });
    };
};

var SensorModalInstanceCtrl = function ($scope, $modalInstance, sensor) {

    $scope.sensor = sensor;
    $scope.accept_sla = false;

    $scope.subscribe = function () {
        $modalInstance.close($scope.accept_sla);  // why is accept_sla always false here?
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};
function CarouselDemoCtrl($scope) {
    $scope.myInterval = 5000;
    var slides = $scope.slides = [];
    $scope.addSlide = function() {
        var newWidth = 600 + slides.length;
        slides.push({
            image: 'http://placekitten.com/' + newWidth + '/300',
            text: ''
        });
    };
    for (var i=0; i<4; i++) {
        $scope.addSlide();
    }
}