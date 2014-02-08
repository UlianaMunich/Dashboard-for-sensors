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
})
;