angular.module('music-app', ['ngRoute'])

.config(function($routeProvider) {
  var resolveProjects = {
    projects: function () {
      return "";
    }
  };
 
  $routeProvider
    .when('/', {
      controller:'ProjectListController as projectList',
      templateUrl:'src/html/pages/list.html',
      resolve: resolveProjects
    })
    .when('/edit/:projectId/', {
      controller:'EditProjectController as editProject',
      templateUrl:'src/html/pages/detail.html',
      resolve: resolveProjects
    })
    .when('/new', {
      controller:'NewProjectController as editProject',
      templateUrl:'src/html/pages/detail.html',
      resolve: resolveProjects
    })
    .otherwise({
      redirectTo:'/'
    });
})
 
.controller('ProjectListController', function(projects) {
  this.controller = "ProjectListController";
})
 
.controller('NewProjectController', function(projects) {
  this.controller = "NewProjectController";
})
 
.controller('EditProjectController', function(projects, $routeParams) {
  this.controller = "EditProjectController";
  this.projectId = $routeParams.projectId;
  this.search = $routeParams.search;
  this.other = $routeParams.other;
});

