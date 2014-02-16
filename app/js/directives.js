'use strict';

var sensdash_directives = angular.module('sensdash.directives', []);

sensdash_directives.directive('favorite', function (User) {
    return {
        restrict: 'A',
        templateUrl: 'partials/blocks/favorite_button_block.html',
        link: function ($scope, element, attrs) {
            $scope.user = User;
            $scope.add_to_favorite = function (sensor) {
                if($scope.user.favorites.indexOf(sensor.id) == -1){
                    $scope.user.favorites.push(sensor.id);
                    $scope.user.save('favorites');
                    console.log($scope.user.favorites);
                }
            };
            $scope.delete_from_favorite = function (sensor) {
                if($scope.user.favorites.indexOf(sensor.id) != -1){
                    $scope.user.favorites.splice($scope.user.favorites.indexOf(sensor.id),1);
                    $scope.user.save('favorites');
                    console.log($scope.user.favorites);
                }
            };
            $scope.check_favorite = function (x) {
                return ($scope.user.favorites.indexOf(x) != -1);
            };
        }
    };
});

sensdash_directives.directive('chart', function () {
    return {
        restrict: 'A',
        template: '',
        link: function ($scope, element, attrs) {
            element.highcharts($scope.sensor.template);
        }
    };
});

sensdash_directives.directive('navbar', function ($location, $timeout, XMPP, User) {
    return {
        restrict: 'A',
        templateUrl: 'partials/nav_bar.html',
        link: function ($scope, element, attrs) {
            $scope.user = User;
            $scope.xmpp = XMPP;
            $scope.process = "";
            $scope.user = {
                'jid': 'brunnhilde@likepro.co',
                'pass': 'testpass',
                'name': '',
                'signedIn': false
            }
            $scope.isActive = function (x) {
                var result = (x == $location.path());
                return result;
            }
            $scope.login = function () {
                $scope.xmpp.connect($scope.user.jid, $scope.user.pass, update_connection);
                $scope.process = "connecting...";
                $timeout(update_connection, 1000);
            }
            var update_connection = function (status) {
                if (status == Strophe.Status.CONNECTING) {
                    console.log('connecting.');
                } else if (status == Strophe.Status.CONNFAIL) {
                    console.log('XMPP failed to connect.');
                    $scope.process = "connection failed";
                } else if (status == Strophe.Status.DISCONNECTING) {
                    console.log('XMPP is disconnecting.');
                } else if (status == Strophe.Status.DISCONNECTED) {
                    console.log('XMPP disconnected.');
                } else if (status == Strophe.Status.CONNECTED) {
                    console.log('XMPP connection established.');
                    $scope.xmpp.connection.send($pres().tree());
                    $scope.process = "";
                    User.load();
                }
            }

        }
    };
});