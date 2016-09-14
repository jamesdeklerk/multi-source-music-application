// =======================================================
// The main class starts the application
// =======================================================
class Main {

    private app: angular.IModule;
    private appLoaded = false;
    private player = new Player();

    constructor() {

        // Attatch to the window object.
        window.AP = this.player;

        // this.testTracks();

        // =======================================================
        // Setting up AngularJS
        // =======================================================

        this.setupAngularApp();
        this.setupAngularRouting();
        this.setupAngularFactories();
        this.setupAngularControllers();

        // -------------------------------------------------------

    }

    /**
     * Creating the Angular module.
     */
    private setupAngularApp(): void {

        this.app = angular.module(`music-application`, [`ngMaterial`, `ngRoute`, `firebase`])
            .config(function ($mdThemingProvider: any) {

                $mdThemingProvider.theme(`default`)
                    .primaryPalette(`red`)
                    .accentPalette(`deep-orange`);

                // Making the URL on mobile devices the same color as the theme.
                $mdThemingProvider.enableBrowserColor(`default`);

            });

    }

    /**
     * Run the sign in check.
     */
    private signInCheck($location: any, user: any) {

        let userUid: string;
        if (user) {
            userUid = user.uid;
        }

        if (!this.appLoaded) {

            $location.path(`/loading`);

        } else if (this.appLoaded && $location.path() === `/loading`) {

            $location.path(`/`);

        } else if ($location.path() === `/sign-up` || $location.path() === `/sign-in`) {

            // Check if they're already signed in.
            if (userUid) {
                // If they are, redirect them to their library.
                $location.path(`/`);
            }

        } else {

            if (!userUid) {
                // If a user doesn't exist, redirect to the sign in pages.
                $location.path(`/sign-in`);
            }

        }
    }

    /**
     * Setting up routing for the SPA.
     */
    private setupAngularRouting(): void {

        this.app.config(($routeProvider: any) => {

            let viewsDirectory = `src/html/views/`;
            let resolve = {
                database: () => {
                    return firebase.database().ref();
                },
                user: (auth: any, $location: any) => {

                    let user = auth.getUser();
                    this.signInCheck($location, user);
                    return user;

                },
            };

            // Actual routes.
            $routeProvider
                .when(`/`, {
                    controller: `library`,
                    resolve: resolve,
                    templateUrl: viewsDirectory + `library.html`,
                })
                .when(`/loading`, {
                    controller: `loading`,
                    resolve: resolve,
                    templateUrl: viewsDirectory + `loading.html`,
                })
                .when(`/sign-up`, {
                    controller: `signUp`,
                    resolve: resolve,
                    templateUrl: viewsDirectory + `sign-up.html`,
                })
                .when(`/sign-in`, {
                    controller: `signIn`,
                    resolve: resolve,
                    templateUrl: viewsDirectory + `sign-in.html`,
                })
                .otherwise({
                    redirectTo: `/`,
                });

        });

    }

    /**
     * Setting up the AngularJS factories.
     */
    private setupAngularFactories(): void {

        /**
         * Authentication factory.
         */
        this.app.factory(`auth`, ($firebaseObject: any, $location: any, $rootScope: any) => {

            let usersRef = firebase.database().ref().child(`users`);
            let user: any;

            // If the auth state changes, update the user.
            firebase.auth().onAuthStateChanged((result: any) => {
                this.appLoaded = true;
                user = result;
                this.signInCheck($location, user);
                $rootScope.$apply();
            });

            return {
                signUp: (email: string, password: string) => {

                    return new Promise((resolve, reject) => {
                        firebase.auth().createUserWithEmailAndPassword(email, password).then((data: any) => {

                            usersRef.child(data.uid).set({
                                details: {
                                    email: data.email,
                                },
                            }).then(() => {
                                // Add the new user.
                                resolve(`User ${data.uid} successfully created.`);
                            }).catch((error: any) => {
                                reject(error);
                            });

                        }).catch((error: any) => {

                            reject(error.message);

                        });
                    });

                },
                signIn: (email: string, password: string) => {

                    console.log(firebase.auth());

                    return new Promise((resolve, reject) => {

                        firebase.auth().signInWithEmailAndPassword(email, password).then((data: any) => {

                            console.log(`Sign in:`);
                            console.log(data);
                            resolve(data);

                        }).catch((error: any) => {

                            reject(error.message);

                        });

                    });

                },
                signOut: () => {

                    return new Promise((resolve, reject) => {

                        firebase.auth().signOut().then((data: any) => {

                            console.log(`Sign out:`);
                            console.log(data);
                            resolve(data);

                        }).catch((error: any) => {

                            reject(error.message);

                        });

                    });

                },
                getUserUid: function () {
                    if (user) {
                        return user.uid;
                    } else {
                        return;
                    }
                },
                getUser: () => {
                    return user;
                },
            };
        });

        /**
         * Data manager factory
         */
        this.app.factory(`dataManager`, (auth: any, $firebaseObject: any, $firebaseArray: any) => {

            // User:        users/uid
            // Track:       tracks/uid
            // Library:     playlists/uid
            // Playlist:    playlists/uid

            let trackExample: ITrack = {
                album: `uid`,
                artist: `uid`,
                duration: 3 * 60 * 1000,
                services: {},
                title: `title`,
                uuid: `uid`,
            };

            let playlistExample: IPlaylist = {
                name: `Playlist Name`,
                owner: `uid`,
                tracks: [],
                uuid: `uid`,
            };

            // The users library is just another playlist.
            // Deleting a song from a playlist doesn't delete it from
            // the users library and vice versa,
            // Adding a song to a playlist does however add it to the users library.
            let playlistsTracks: any = {};
            let playlistsDetails: any = {};

            // Local copy of the references
            let tracks: any = {};

            let USERS_REF = firebase.database().ref().child(`users`);
            let TRACKS_REF = firebase.database().ref().child(`tracks`);
            let PLAYLISTS_DETAILS_REF = firebase.database().ref().child(`playlists-details`);
            let PLAYLISTS_TRACKS_REF = firebase.database().ref().child(`playlists-tracks`);


            function createTrack(track: ITrack): Promise<any> {
                return new Promise((resolve, reject) => {
                    TRACKS_REF.push(track).then((data: any) => {
                        resolve(data);
                    }).catch((error: any) => {
                        reject(error);
                    });
                });
            }

            function deleteTrack(trackUid: string): Promise<any> {
                return new Promise((resolve, reject) => {
                    TRACKS_REF.child(trackUid).remove().then(() => {
                        resolve(`Track removed.`);
                    }).catch(() => {
                        reject(`Failed to remove track.`);
                    });
                });
            }

            function getTrack(trackUid: string): Promise<any> {
                return new Promise((resolve, reject) => {
                    // If we don't have a local copy of it, make one.
                    if (!tracks[trackUid]) {
                        TRACKS_REF.child(trackUid).then((snapshot: any) => {
                            tracks[trackUid] = snapshot.val();
                            resolve(tracks[trackUid]);
                        }).catch(() => {
                            reject(undefined);
                        });
                    } else {
                        resolve(tracks[trackUid]);
                    }
                });
            }

            function createPlaylist(playlist: IPlaylist): Promise<any> {
                return new Promise((resolve, reject) => {

                    // Set it so that the current user is the owner.
                    playlist.owner = auth.getUserUid();

                    PLAYLISTS_DETAILS_REF.push(playlist).then((data: any) => {
                        let playlistUid = data.key;
                        // Created the new playlist, now add it to the users playlists.
                        USERS_REF.child(playlist.owner).child(`playlists`).push(playlistUid).then(() => {
                            resolve(`Successfully created playlist.`);
                        }).catch(() => {
                            reject(`Failed to create playlist.`);
                        });
                    }).catch(() => {
                        reject(`Failed to create playlist.`);
                    });
                });
            }

            function addTrackToPlaylist(playlistUid: string, trackUid: string): Promise<any> {
                return new Promise((resolve, reject) => {

                    let getDetails = getPlaylistDetails(playlistUid);
                    let getTracks = getPlaylistTracks(playlistUid);

                    Promise.all([getDetails, getTracks]).then((values: any) => {
                        let userUid = auth.getUserUid();
                        let ownerUid = values[0].owner;

                        // Check that they own the playlist.
                        if (ownerUid === userUid) {
                            values[1].$add(trackUid).then((data: any) => {
                                resolve(`Track added to playlist.`);
                            }).catch((error: any) => {
                                reject(error);
                            });
                        } else {
                            reject(`Can't add track, you aren't the owner.`);
                        }
                    }).catch(() => {
                        reject(`Something went wrong, adding failed.`);
                    });

                });
            }

            function getPlaylistDetails(playlistUid: string): Promise<any> {

                return new Promise((resolve, reject) => {
                    // If we don't have a local reference to it, make one.
                    if (!playlistsDetails[playlistUid]) {
                        $firebaseObject(PLAYLISTS_DETAILS_REF.child(playlistUid)).$loaded().then((playlistDetails: any) => {
                            playlistsDetails[playlistUid] = playlistDetails;
                            resolve(playlistsDetails[playlistUid]);
                        }).catch(() => {
                            reject();
                        });
                    } else {
                        resolve(playlistsDetails[playlistUid]);
                    }
                });
            }

            /**
             * Just the ids of the tracks.
             */
            function getPlaylistTracks(playlistUid: string): Promise<any> {

                return new Promise((resolve, reject) => {
                    // If we don't have a local reference to it, make one.
                    if (!playlistsTracks[playlistUid]) {
                        $firebaseArray(PLAYLISTS_TRACKS_REF.child(playlistUid)).$loaded().then((data: any) => {
                            playlistsTracks[playlistUid] = data;
                            resolve(playlistsTracks[playlistUid]);
                        }).catch(() => {
                            reject();
                        });
                    } else {
                        resolve(playlistsTracks[playlistUid]);
                    }
                });
            }



            return {
                addTrackToPlaylist: addTrackToPlaylist,
                createPlaylist: createPlaylist,
                createTrack: createTrack,
                getPlaylistDetails: getPlaylistDetails,
                getPlaylistTracks: getPlaylistTracks,
                getTrack: getTrack,
            };
        });

    }

    /**
     * Setting up AngularJS controllers.
     */
    private setupAngularControllers(): void {

        /**
         * Master Page
         */
        this.app.controller(`master`, ($scope: any, $mdSidenav: any) => {
            let controller = $scope;

            // Hide or show the menu
            controller.toggleMenu = () => {
                $mdSidenav(`left`).toggle();
            };

        });

        /**
         * Player
         */
        this.app.controller(`player`, ($scope: any, $interval: angular.IIntervalService) => {
            let controller = $scope;

            // Setting up defaults.
            let UPDATE_SEEKBAR_FREQUENCY = 300;
            controller.loadingTrack = false;
            controller.paused = this.player.getPaused();
            controller.volume = this.player.getVolume() * 100;
            controller.repeatOne = this.player.getRepeat() === this.player.REPEAT_STATES.ONE;
            controller.repeatOff = this.player.getRepeat() === this.player.REPEAT_STATES.OFF;
            controller.shuffle = this.player.getShuffle();
            controller.musicService = this.player.musicServices[this.player.getCurrentMusicServiceIndex()].name;
            controller.volumeOff = false;
            controller.seek = {
                percentage: 0,
                percentageLoaded: 0,
            };

            // Player buttons
            controller.previous = () => {
                controller.bob = `previous`;
                this.player.previous();
            };

            controller.playPause = () => {
                if (this.player.getPaused()) {
                    controller.paused = true;
                } else {
                    controller.paused = false;
                }
                this.player.playPause();
            };

            controller.next = () => {
                controller.bob = `next`;
                this.player.next();
            };

            controller.setVolume = (volume: number) => {
                if (volume <= 0) {
                    controller.volumeOff = true;
                } else {
                    controller.volumeOff = false;
                }
                this.player.setVolume(volume / 100);
            };

            controller.toggleRepeat = () => {
                this.player.cycleRepeat();
                controller.repeatOne = this.player.getRepeat() === this.player.REPEAT_STATES.ONE;
                controller.repeatOff = this.player.getRepeat() === this.player.REPEAT_STATES.OFF;
            };

            controller.toggleShuffle = () => {
                this.player.toggleShuffle();
                controller.shuffle = this.player.getShuffle();
            };

            controller.dynamicallyChangeMusicService = (musicService: string) => {
                this.player.dynamicallyChangeMusicService(musicService);
            };

            // Dealing with the seek bar
            let seekbar = <HTMLInputElement>document.getElementById(`seek-bar`);
            let userMovingSeekBar = false;

            seekbar.addEventListener(`mousedown`, () => {
                userMovingSeekBar = true;
            });

            seekbar.addEventListener(`touchstart`, () => {
                userMovingSeekBar = true;
            });

            seekbar.addEventListener(`change`, () => {
                userMovingSeekBar = false;
                this.player.seekToPercentage(parseFloat(seekbar.value));
            });

            // Update the player UI.
            $interval(() => {
                controller.paused = this.player.getPaused();
                controller.musicService = this.player.musicServices[this.player.getCurrentMusicServiceIndex()].name;
                controller.seek.percentage = this.player.getCurrentPercentage() * 100;
                controller.seek.percentageLoaded = this.player.getPercentageLoaded() * 100;
                if (!userMovingSeekBar) {
                    seekbar.value = (controller.seek.percentage / 100).toString();
                }
                controller.$digest();
            }, 300, 0, false);

        });

        /**
         * Library
         */
        this.app.controller(`library`, ($scope: any, user: any, database: any, dataManager: any, $mdToast: any) => {
            let controller = $scope;

            controller.userEmail = user.email;
            controller.trackUid = `-KRdV8p1jCr0Lmt-8KGo`;
            controller.track = {};
            controller.playlistUid = `-KRdbqiRr6CzgrecE912`;
            controller.playlist = {
                name: ``,
                owner: ``,
                uuid: `not important`,
            };
            controller.playlistTracks = [];

            controller.createTrack = () => {
                let newTrack: ITrack = {
                    duration: 12369,
                    services: {
                        "Deezer": 1,
                        "SoundCloud": 3,
                        "YouTube": 2,
                    },
                    title: controller.track.title,
                    uuid: `something`,
                };
                dataManager.createTrack(newTrack).then((data: any) => {
                    console.log(data);
                });
            };

            controller.getTrack = () => {
                console.log(`controller.track`);
                controller.track = dataManager.getTrack(controller.trackUid);
                console.log(controller.track);
            };

            controller.createPlaylist = () => {
                let newPlaylist = {
                    name: controller.playlist.name,
                    owner: controller.playlist.owner,
                    uuid: `Playlist uuid? No need...`,
                };
                dataManager.createPlaylist(newPlaylist).then((data: any) => {
                    console.log(data);
                });
            };

            controller.addTrackToPlaylist = () => {
                dataManager.addTrackToPlaylist(controller.playlistUid, controller.trackUid).then((message: string) => {
                    controller.showToast(message);
                }).catch((message: string) => {
                    controller.showToast(message);
                });
            };

            controller.getPlaylistDetails = () => {
                console.log(`getPlaylistDetails start`);
                dataManager.getPlaylistDetails(controller.playlistUid).then((data: any) => {
                    console.log(`getPlaylistDetails finish`);
                    controller.playlist = data;
                    console.log(data);
                });
            };

            controller.getPlaylistTracks = () => {
                controller.playlistTracks = dataManager.getPlaylistTracks(controller.playlistUid);
            };

            controller.showToast = function (message: string) {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(message)
                        .position(`bottom right`)
                        .hideDelay(1500)
                );
            };

        });

        /**
         * Playlist
         */
        this.app.controller(`playlist`, ($scope: any) => {
            let controller = $scope;


        });

        /**
         * Loading
         */
        this.app.controller(`loading`, () => { });

        /**
         * Sign up
         */
        this.app.controller(`signUp`, ($scope: any, auth: any, $location: angular.ILocationService) => {
            let controller = $scope;

            controller.user = {};

            controller.signUp = () => {

                if (controller.user.email && controller.user.email.trim() === ``) {
                    console.log(`Invalid email.`);
                } else if (controller.user.password && (controller.user.password.trim() === `` || controller.user.password.length < 6)) {
                    console.log(`Invalid password (must be at least 6 characters).`);
                } else {
                    auth.signUp(controller.user.email, controller.user.password).then(() => {
                        // Go to the users library.
                        $location.path(`/`);
                        controller.$apply();
                    }).catch((error: any) => {
                        console.log(error);
                    });
                }

            };

        });

        /**
         * Sign in
         */
        this.app.controller(`signIn`, ($scope: any, auth: any, $location: angular.ILocationService) => {
            let controller = $scope;
            controller.loading = false;

            controller.user = {};

            controller.signIn = () => {

                if (controller.user.email && controller.user.email.trim() === ``) {
                    console.log(`Invalid email.`);
                } else if (controller.user.password && (controller.user.password.trim() === `` || controller.user.password.length < 6)) {
                    console.log(`Invalid password (must be at least 6 characters).`);
                } else {
                    controller.loading = true;
                    auth.signIn(controller.user.email, controller.user.password).then(() => {
                        // Go to the users library.
                        $location.path(`/`);
                        controller.$apply();
                    }).catch((error: any) => {
                        controller.loading = false;
                        console.log(error);
                    });
                }

            };

        });

    }

    private oldSetupAngular(): void {

        angular.module("music-application", ["ngRoute", "firebase"])

            .config(function ($routeProvider: any) {
                let resolveProjects = {
                    projects: function () {
                        return "";
                    }
                };

                $routeProvider
                    .when('/', {
                        controller: 'ProjectListController as projectList',
                        templateUrl: 'src/html/pages/library.html',
                        resolve: resolveProjects
                    })
                    .when('/edit/:projectId/', {
                        controller: 'EditProjectController as editProject',
                        templateUrl: 'src/html/pages/detail.html',
                        resolve: resolveProjects
                    })
                    .when('/new', {
                        controller: 'NewProjectController as editProject',
                        templateUrl: 'src/html/pages/detail.html',
                        resolve: resolveProjects
                    })
                    .when('/sign-up', {
                        controller: 'SignUpController as SignUpController',
                        templateUrl: 'src/html/pages/old-sign-up.html',
                        resolve: resolveProjects
                    })
                    .otherwise({
                        redirectTo: '/'
                    });
            })

            .controller('ProjectListController', function (projects: any) {
                this.controller = "ProjectListController";
            })

            .controller('SignUpController', function ($scope: any, projects: any, $firebaseObject: any, $firebaseArray: any) {

                let controller = $scope;
                let ref = firebase.database().ref().child("data");

                // Download the data into a local object.
                let syncObject = $firebaseObject(ref);

                // Synchronize the object with a three-way data binding.
                syncObject.$bindTo($scope, "data");

                ref = firebase.database().ref().child("array-test");

                // create a synchronized array
                $scope.messages = $firebaseArray(ref);

                // add new items to the array
                $scope.addMessage = function () {
                    $scope.messages.$add({
                        text: $scope.newMessageText,
                    });
                };

                controller.user = {};

                // controller.user = {};
                // controller.emailError = "";
                // controller.usernameError = "";
                // controller.passwordError = "";
                // controller.password2Error = "";

                controller.bob = "sign up! now!";

                controller.signUper = function (a) {
                    console.log(a);

                    if (!controller.user.email || !controller.user.password) {
                        return;
                    }

                    firebase.auth().createUserWithEmailAndPassword(controller.user.email, controller.user.password).then((noice: any) => {
                        console.log("yay, were signed up!");
                        console.log(noice.email);
                        console.log(noice.uid);
                    }).catch(function (error: any) {
                        // Handle Errors here.
                        var errorCode = error.code;
                        var errorMessage = error.message;
                        // ...
                        console.log(errorMessage);
                    });
                };

                controller.signUper();

            })

            .controller('NewProjectController', function (projects: any) {
                this.controller = "NewProjectController";
            })

            .controller('EditProjectController', function (projects: any, $routeParams: any) {
                this.controller = "EditProjectController";
                this.projectId = $routeParams.projectId;
                this.search = $routeParams.search;
                this.other = $routeParams.other;
            });

    }

    private testTracks(): void {

        // Create some tracks.
        let track0: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `FJt7gNi3Nr4`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `0. No Church In The Wild`,
            uuid: `0`,
        };
        let track1: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `R594fw8I2a4`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `1. Get Low`,
            uuid: `1`,
        };
        let track2: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 113524324,
                },
                "YouTube": {
                    videoId: `GZSsOEqgm0c`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `2. Be Together feat. Wild Belle`,
            uuid: `2`,
        };
        let track3: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 126534877,
                },
                "YouTube": {
                    videoId: `KVAoKBfFkwg`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `3. The Longest Wave (only available on Deezer)`,
            uuid: `3`,
        };
        let track4: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `1ekZEVeXwek`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `4. Into You`,
            uuid: `4`,
        };
        let track5: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 890897887898798,
                },
                "YouTube": {
                    videoId: `KVAoKBfFkwg`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `5. THIS TRACK ISN'T AVAILABLE ANYWHERE`,
            uuid: `5`,
        };
        let track6: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `viimfQi_pUw`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `6. Ocean Eyes`,
            uuid: `6`,
        };
        let track7: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `4pflhw9QItc`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `7. Hypnotize`,
            uuid: `7`,
        };
        let track8: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `Bm5iA4Zupek`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `8. Runaway (Video Version) ft. Pusha T`,
            uuid: `8`,
        };

        // Queue multiple tracks.
        this.player.queue([
            track0,
            track1,
            track2,
            track3, // Not available on YouTube
            track4,
            track5, // Not available on YouTube or Deezer
            track6,
            track7,
            track8,
        ]);

        // After this the queue should look like this [track3, track1, track3, track4]
        console.log(this.player.getQueue());

        // Set repeat to false (for testing cycling through all tracks causes an infinite loop).
        this.player.setRepeat(this.player.REPEAT_STATES.OFF);

        // Play the 2nd track in the queue, this should play track1. 
        //abstractPlayer.load(0);

        window.displayTracks = function (tracks: ITrack[]) {
            for (let track of tracks) {
                console.log(track.title);
            }
        };

        // Logging track status.
        publisher.subscribe(this.player.EVENTS.ON_TRACK_LOADING, function (track: ITrack, musicServiceName: string) {
            console.log(`LOADING (${musicServiceName}) - ${track.title}.`);
        });
        publisher.subscribe(this.player.EVENTS.ON_TRACK_LOADED, function (track: ITrack, musicServiceName: string) {
            console.log(`SUCCESS (${musicServiceName}) - ${track.title}.`);
        });
        publisher.subscribe(this.player.EVENTS.ON_TRACK_LOAD_FAILED, function (track: ITrack, musicServiceName: string) {
            console.log(`FAILED (${musicServiceName}) - ${track.title}.`);
        });

        // Buffering events
        publisher.subscribe(this.player.EVENTS.ON_TRACK_BUFFERING, function () {
            console.log(`BUFFERING`);
        });
        publisher.subscribe(this.player.EVENTS.ON_TRACK_FINISHED_BUFFERING, function () {
            console.log(`FINISHED BUFFERING`);
        });


    }

}

// tslint:disable-next-line
let main = new Main();
