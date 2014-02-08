'use strict';

angular.module('sensdash', [
        'ngRoute',
        'sensdash.filters',
        'sensdash.controllers',
        'sensdash.services',
        'sensdash.directives',
        'ui.bootstrap',
        'wu.masonry'
    ]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/registry', {templateUrl: 'partials/registry.html', controller: 'RegistryCtrl'});
        $routeProvider.when('/stream', {templateUrl: 'partials/stream.html', controller: 'StreamCtrl'});
        $routeProvider.when('/profile', {templateUrl: 'partials/profile.html', controller: 'ProfileCtrl'});
        $routeProvider.otherwise({redirectTo: '/registry'});
    }]);