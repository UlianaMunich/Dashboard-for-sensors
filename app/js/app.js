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
        $routeProvider.when('/subscriptions', {templateUrl: 'partials/subscriptions.html', controller: 'StreamCtrl'});
        $routeProvider.when('/settings', {templateUrl: 'partials/settings.html', controller: 'SettingsCtrl'});
        $routeProvider.otherwise({redirectTo: '/registry'});
    }]);