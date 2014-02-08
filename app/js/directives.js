'use strict';

var sensdash_directives = angular.module('sensdash.directives', []);

sensdash_directives.directive('favorite', function () {
    return {
        restrict: 'A',
        templateUrl: 'partials/blocks/favorite_button_block.html',
        link: function ($scope, element, attrs) {
            $scope.favorite = false;
            $scope.toggle_favorite = function () {
                $scope.favorite = !$scope.favorite;
                console.log("favorite: " + $scope.favorite);
            }
        }
    };
});

sensdash_directives.directive('navbar', function ($location) {
    return {
        restrict: 'A',
        templateUrl: 'partials/nav_bar.html',
        link: function ($scope, element, attrs) {
            $scope.connection = {'connected':false};
            $scope.user = {
                'jid': 'brunnhilde@likepro.co',
                'pass': 'testpass',
                'signedIn': false
            }
            $scope.isActive = function(x){
                var result = (x == $location.path());
                return result;
            }
            $scope.login = function() {
                var BOSH_SERVICE = 'http://likepro.co/http-bind/';
                $scope.connection = new Strophe.Connection(BOSH_SERVICE);
                $scope.connection.connect($scope.user.jid, $scope.user.pass, onConnect);
                $scope.user.signedIn = true;
            }
        }
    };
});