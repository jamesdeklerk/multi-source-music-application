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

        this.registerEvents();

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
     * Registering events.
     */
    private registerEvents(): void {

        publisher.register(`user-ready`, []);
        publisher.register(`library-created`, []);
        publisher.register(`playlist-created`, []);
        publisher.register(`playlist-updated`, []);
        publisher.register(`playlist-deleted`, []);

    }

    /**
     * Creating the Angular module.
     */
    private setupAngularApp(): void {

        this.app = angular.module(`music-application`, [`ngMaterial`, `ngRoute`, `firebase`, `ngAnimate`])
            .config(function ($mdThemingProvider: any) {

                $mdThemingProvider.theme(`default`)
                    .primaryPalette(`red`)
                    .accentPalette(`deep-orange`);

                // Making the URL on mobile devices the same color as the theme.
                $mdThemingProvider.enableBrowserColor(`default`);

            });

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
                user: (auth: any, stateCorrector: any) => {

                    stateCorrector.correctState(auth.getUserUid());
                    return auth.getUser();

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
                .when(`/playlist/:playlistUUID`, {
                    controller: `playlist`,
                    resolve: resolve,
                    templateUrl: viewsDirectory + `playlist.html`,
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
         * State corrector - corrects the current route.
         */
        this.app.factory(`stateCorrector`, ($location: any) => {

            /**
             * Specifies if it's the first time loading the page.
             */
            let firstPageLoad = true;

            /**
             * Specifies if the original route has been restored.
             */
            let routeRestored = false;

            let pathsNotAllowedForRestore = [`/loading`, `/sign-in`, `/sign-up`];
            let defaultRoute = `/`;

            // The route waiting to be restored.
            // Can't be loading, sign-in or sign-up.
            let route = defaultRoute;

            function isValidRestorePath(path: string): boolean {
                // Checks if the given path is found in the list of paths
                // not allowed for restoring.
                return (pathsNotAllowedForRestore.indexOf(path) === -1);
            }

            function restoreRoute() {
                if (!routeRestored) {

                    routeRestored = true;

                    // If it isn't on the correct route,
                    // restore it to the correct route.
                    if ($location.path() !== route) {
                        $location.path(route);
                    }
                }
            }

            /**
             * @return True if finished signing in, else false.
             */
            let correctState = (userUUID: any) => {

                // If it's the first time loading the page, store the route
                // to be restored.
                if (firstPageLoad) {
                    route = $location.path();

                    // If it's not an allowed restore route,
                    // just set the restore route to the default.
                    if (!isValidRestorePath(route)) {
                        route = defaultRoute;
                        console.log(`NOT AN ALLOWED RESTORE ROUTE!`);
                    }

                    firstPageLoad = false;
                }

                if (!this.appLoaded) {

                    $location.path(`/loading`);

                } else if ($location.path() === `/loading`) {

                    // Check if they're already signed in.
                    if (userUUID) {

                        if (routeRestored) {
                            $location.path(defaultRoute);
                        } else {
                            restoreRoute();
                        }

                    } else {
                        // If a user doesn't exist, redirect to the sign in page.
                        $location.path(`/sign-in`);
                    }

                } else if (($location.path() === `/sign-in`) || ($location.path() === `/sign-up`)) {

                    // If we're on the sign-in or sign-up page,
                    // make sure the user isn't already signed in.
                    if (userUUID) {
                        if (routeRestored) {
                            $location.path(defaultRoute);
                        } else {
                            restoreRoute();
                        }
                    }

                } else {

                    if (!userUUID) {
                        // If a user doesn't exist, redirect to the sign in page.
                        $location.path(`/sign-in`);
                    } else {
                        restoreRoute();
                    }

                }
            };

            return {
                correctState: correctState,
            };

        });

        /**
         * Authentication factory.
         */
        this.app.factory(`auth`, ($firebaseObject: any, $location: any, $rootScope: any, stateCorrector: any) => {

            let USERS_REF = firebase.database().ref().child(`users`);
            let PLAYLISTS_DETAILS_REF = firebase.database().ref().child(`playlists-details`);

            let user: any;

            // If the auth state changes, update the user.
            firebase.auth().onAuthStateChanged((result: any) => {
                this.appLoaded = true;
                user = result;
                if (user) {
                    stateCorrector.correctState(user.uid);
                    publisher.publish(`user-ready`);
                } else {
                    stateCorrector.correctState(undefined);
                    publisher.publish(`user-ready`);
                }
                $rootScope.$apply();
            });

            // Creates a playlist and adds it to /user/library
            function createLibrary(owner: string): Promise<any> {
                return new Promise((resolve, reject) => {

                    // Now that the user has been added, create them a library.
                    let library: IPlaylist = {
                        name: `Library`,
                        owner: owner,
                        tracks: [],
                        uuid: `This will be autogenerated.`,
                    };

                    PLAYLISTS_DETAILS_REF.push(library).then((data: any) => {
                        let libraryUUID = data.key;

                        // The new library (i.e. playlist) was successfully created,
                        // now update its uuid.
                        PLAYLISTS_DETAILS_REF.child(libraryUUID).update({ uuid: libraryUUID }).then(() => {

                            // The new library (i.e. playlist) uuid was successfully updated,
                            // now set it as this users library.
                            USERS_REF.child(owner).child(`library`).set(libraryUUID).then(() => {
                                resolve(`Library created successfully.`);
                            }).catch(() => {
                                reject(`Failed to create library.`);
                            });

                        }).catch(() => {
                            reject(`Failed to create library.`);
                        });

                    }).catch(() => {
                        reject(`Failed to create library.`);
                    });
                });
            }

            return {
                getUser: () => {
                    return user;
                },
                getUserUid: function () {
                    if (user) {
                        return user.uid;
                    } else {
                        return;
                    }
                },
                signIn: (email: string, password: string) => {

                    return new Promise((resolve, reject) => {

                        firebase.auth().signInWithEmailAndPassword(email, password).then((data: any) => {
                            resolve(data.uid);
                        }).catch((error: any) => {
                            reject(error.message);
                        });

                    });

                },
                signOut: () => {

                    return new Promise((resolve, reject) => {

                        firebase.auth().signOut().then(() => {

                            // Stop the player.
                            this.player.dequeueAll();

                            resolve(`Signed out.`);

                        }).catch((error: any) => {

                            reject(error.message);

                        });

                    });

                },
                signUp: (email: string, password: string) => {

                    return new Promise((resolve, reject) => {
                        firebase.auth().createUserWithEmailAndPassword(email, password).then((data: any) => {

                            // Add the new user.
                            USERS_REF.child(data.uid).set({
                                details: {
                                    email: data.email,
                                },
                            }).then(() => {

                                // Create the library (a library is just another playlist)
                                createLibrary(data.uid).then(() => {
                                    publisher.publish(`library-created`);
                                    resolve(data.uid);
                                }).catch(() => {
                                    reject(`Failed to sign up.`);
                                });

                            }).catch(() => {
                                reject(`Failed to sign up.`);
                            });

                        }).catch((error: any) => {

                            reject(error.message);

                        });
                    });

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

            // playlistsTracks = {
            //     "playlistUUID1": [{ trackUUID: string, uuidInPlaylist: string }],
            //     "playlistUUID2": [{ trackUUID: string, uuidInPlaylist: string }],
            // }
            let playlistsTracks: any = {};
            let playlistsDetails: any = {};
            let playlists: any = {};

            // Local copy of the references
            let tracks: any = {};

            /**
             * The playlist UUID of the current user.
             */
            let usersLibraryUUID: string;
            /**
             * Only used for getting the correct users library.
             */
            let currentUserUUID: string;

            /**
             * An array of the users playlists (details only).
             * i.e. [{ name: string, owner: string, uuid: string }]
             */
            let usersPlaylists: any;


            let USERS_REF = firebase.database().ref().child(`users`);
            let TRACKS_REF = firebase.database().ref().child(`tracks`);
            let PLAYLISTS_DETAILS_REF = firebase.database().ref().child(`playlists-details`);
            let PLAYLISTS_TRACKS_REF = firebase.database().ref().child(`playlists-tracks`);

            function clone(object: any): any {
                return JSON.parse(JSON.stringify(object));
            }

            function getUsersDetails(userUUID: string): Promise<any> {
                return new Promise((resolve, reject) => {
                    USERS_REF.child(userUUID).child(`details`).once(`value`).then((snapshot: any) => {
                        resolve(snapshot.val());
                    }).catch(() => {
                        reject(undefined);
                    });
                });
            }

            function createTrack(track: ITrack): Promise<any> {
                return new Promise((resolve, reject) => {
                    TRACKS_REF.push(track).then((data: any) => {

                        let clonedTrack = clone(track);

                        clonedTrack.uuid = data.key;
                        clonedTrack.owner = auth.getUserUid();

                        TRACKS_REF.child(clonedTrack.uuid).update({ owner: clonedTrack.owner, uuid: clonedTrack.uuid }).then(() => {

                            // Update local copy.
                            tracks[clonedTrack.uuid] = clonedTrack;

                            resolve(`Track created.`);
                        }).catch(() => {
                            reject(`Failed to create track.`);
                        });

                    }).catch(() => {
                        reject(`Failed to create track.`);
                    });
                });
            }

            // function updateTrack(trackUUID: string, infoToUpdate: any): Promise<any> {
            //     return new Promise((resolve, reject) => {
            //         TRACKS_REF.child(trackUUID).update(infoToUpdate).then((data: any) => {

            //             // check if this is the updated track.
            //             console.log(data);

            //             // Update local copy.
            //             if (infoToUpdate.title)............
            //             tracks[trackUUID] = track;

            //             resolve(`Track updated.`);
            //         }).catch(() => {
            //             reject(`Failed to update track.`);
            //         });
            //     });
            // }

            function deleteTrack(trackUUID: string): Promise<any> {
                return new Promise((resolve, reject) => {
                    TRACKS_REF.child(trackUUID).remove().then(() => {
                        resolve(`Track removed.`);
                    }).catch(() => {
                        reject(`Failed to remove track.`);
                    });
                });
            }

            function getTrack(trackUUID: string, uuidInPlaylist?: string): Promise<any> {
                return new Promise((resolve, reject) => {
                    // If we don't have a local copy of it, make one.
                    if (!tracks[trackUUID]) {
                        TRACKS_REF.child(trackUUID).once(`value`).then((snapshot: any) => {
                            // Update the local copy of the track.
                            tracks[trackUUID] = snapshot.val();

                            if (!tracks[trackUUID]) {
                                reject(undefined);
                            } else if (uuidInPlaylist) {
                                // If there is a uuidInPlaylist, that means it is a track
                                // for a specific playlist, so we must clone the track
                                // and append its uuidInPlaylist.
                                let clonedTrack = clone(tracks[trackUUID]);
                                clonedTrack.uuidInPlaylist = uuidInPlaylist;
                                resolve(clonedTrack);
                            } else {
                                resolve(tracks[trackUUID]);
                            }
                        }).catch(() => {
                            reject(undefined);
                        });
                    } else {
                        console.log(`Got the local copy of the track.`);
                        // If there is a uuidInPlaylist, that means it is a track
                        // for a specific playlist, so we must clone the track
                        // and append its uuidInPlaylist.
                        if (uuidInPlaylist) {
                            let clonedTrack = clone(tracks[trackUUID]);
                            clonedTrack.uuidInPlaylist = uuidInPlaylist;
                            resolve(clonedTrack);
                        } else {
                            resolve(tracks[trackUUID]);
                        }
                    }
                });
            }

            function createPlaylist(playlist: IPlaylist): Promise<any> {
                return new Promise((resolve, reject) => {

                    // Set it so that the current user is the owner.
                    playlist.owner = auth.getUserUid();

                    PLAYLISTS_DETAILS_REF.push(playlist).then((data: any) => {
                        let playlistUUID = data.key;

                        // The new playlist was successfully created,
                        // now update its uuid.
                        PLAYLISTS_DETAILS_REF.child(playlistUUID).update({ uuid: playlistUUID }).then(() => {

                            // The new playlist uuid was successfully updated,
                            // now add it to the users playlists.
                            USERS_REF.child(playlist.owner).child(`playlists`).push(playlistUUID).then(() => {

                                // Make sure we have the latest version of the users playlists.
                                getUsersPlaylists().then(() => {

                                    // Update the local copys.
                                    playlist.uuid = playlistUUID;
                                    playlists[playlistUUID] = playlist;
                                    usersPlaylists.push(playlist);

                                    // Pass throught the playlist UUID.
                                    publisher.publish(`playlist-created`);
                                    resolve(playlistUUID);

                                }).catch(() => {
                                    reject(`Failed to create playlist.`);
                                });

                            }).catch(() => {
                                reject(`Failed to create playlist.`);
                            });

                        }).catch(() => {
                            reject(`Failed to create playlist.`);
                        });

                    }).catch(() => {
                        reject(`Failed to create playlist.`);
                    });
                });
            }

            function isTrackInPlaylist(playlistUUID: string, trackUUID: string): Promise<any> {
                return new Promise((resolve, reject) => {

                    // Make sure we have the latest list of track uuids for the given playlist.
                    getPlaylistTracksUUIDs(playlistUUID).then((playlistsTracksUUIDsResolved) => {

                        let foundTrack = false;

                        // The uuids of all the tracks.
                        // tslint:disable-next-line
                        for (let i = 0, resolvedTrack: any; resolvedTrack = playlistsTracksUUIDsResolved[i]; i = i + 1) {
                            if (resolvedTrack.trackUUID === trackUUID) {
                                foundTrack = true;
                                break;
                            }
                        }

                        resolve(foundTrack);

                    }).catch(() => {
                        // Just assume it isn't if we fail.
                        resolve(false);
                    });

                });
            }

            function addTrackToPlaylist(playlistUUID: string, trackUUID: string): Promise<any> {
                return new Promise((resolve, reject) => {

                    let userUid = auth.getUserUid();

                    let promisePlaylist = getPlaylist(playlistUUID);
                    let promiseTrack = getTrack(trackUUID);

                    Promise.all([promisePlaylist, promiseTrack]).then((values) => {
                        let playlist: IPlaylist = values[0];
                        let track: ITrack = values[1];

                        // Check that they own the playlist.
                        if (playlist.owner === userUid) {
                            // Add track.
                            PLAYLISTS_TRACKS_REF.child(playlistUUID).push(trackUUID).then((data: any) => {
                                console.log(`addTrackToPlaylist - PLAYLISTS_TRACKS_REF.child`);

                                let clonedTrack = clone(track);
                                // Only cloned tracks have a reference to where they
                                // are in the playlist, i.e. a uuidInPlaylist
                                clonedTrack.uuidInPlaylist = data.key;

                                // Maintain the local playlists
                                // Have to clone track for ng-repeat
                                playlists[playlistUUID].tracks.push(clonedTrack);
                                if (playlistsTracks[playlistUUID] === undefined) {
                                    playlistsTracks[playlistUUID] = [];
                                }
                                playlistsTracks[playlistUUID].push({
                                    trackUUID: trackUUID,
                                    uuidInPlaylist: data.key,
                                });

                                // Add the track to the users library.
                                getUsersLibraryUUID().then((libraryUUID) => {
                                    // We managed to get the users libraryUUID.
                                    // Only if we are not currently on the users library
                                    // should we consider add it to their library.
                                    if (playlistUUID !== libraryUUID) {
                                        // But before we add it, we must make sure it isn't already added.
                                        isTrackInPlaylist(libraryUUID, trackUUID).then((itIs) => {
                                            // If it isn't in the playlist, add it.
                                            if (!itIs) {
                                                addTrackToPlaylist(libraryUUID, trackUUID);
                                            }

                                            resolve(`Track added to playlist.`);
                                        }).catch(() => {
                                            resolve(`Track added to playlist. But failed to add to library.`);
                                        });

                                    } else {
                                        resolve(`Track added to library.`);
                                    }

                                }).catch(() => {
                                    resolve(`Track added to playlist.`);
                                });

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

            function deleteTrackFromPlaylist(playlistUUID: string, uuidInPlaylist: string): Promise<any> {
                return new Promise((resolve, reject) => {
                    PLAYLISTS_TRACKS_REF.child(playlistUUID).child(uuidInPlaylist).remove().then(() => {

                        // Remove it from the local copy of the playlist.
                        // If there is a playlist
                        if (playlists[playlistUUID]) {
                            // And if that playlist has tracks
                            if (playlists[playlistUUID].tracks) {
                                // tslint:disable-next-line
                                for (let i = 0, track: any; track = playlists[playlistUUID].tracks[i]; i = i + 1) {
                                    // If we've found the track, remove it.
                                    if (track.uuidInPlaylist === uuidInPlaylist) {
                                        playlists[playlistUUID].tracks.splice(i, 1);
                                        break;
                                    }
                                }
                            }
                        }

                        // Do the same for playlistsTracks
                        if (playlistsTracks[playlistUUID]) {
                            // tslint:disable-next-line
                            for (let i = 0, track: any; track = playlistsTracks[playlistUUID][i]; i = i + 1) {
                                // If we've found the track, remove it.
                                if (track.uuidInPlaylist === uuidInPlaylist) {
                                    playlistsTracks[playlistUUID].splice(i, 1);
                                    break;
                                }
                            }
                        }

                        resolve(`Track removed from playlist.`);
                    }).catch(() => {
                        reject(`Failed to remove track from playlist.`);
                    });
                });
            }

            function getPlaylistDetails(playlistUUID: string, uuidInUsersPlaylists?: string): Promise<any> {

                return new Promise((resolve, reject) => {
                    // If we don't have a local reference to it, make one.
                    if (!playlistsDetails[playlistUUID]) {
                        PLAYLISTS_DETAILS_REF.child(playlistUUID).once(`value`).then((snapshot: any) => {
                            playlistsDetails[playlistUUID] = snapshot.val();

                            // If there is a uuidInUsersPlaylists, that means it is a playlist
                            // for a specific user, so we must clone the playlist
                            // and append its uuidInUsersPlaylists.
                            if (uuidInUsersPlaylists) {
                                let clonedPlaylistDetails = clone(playlistsDetails[playlistUUID]);
                                clonedPlaylistDetails.uuidInUsersPlaylists = uuidInUsersPlaylists;
                                resolve(clonedPlaylistDetails);
                            } else {
                                resolve(playlistsDetails[playlistUUID]);
                            }
                        }).catch(() => {
                            reject(undefined);
                        });
                    } else {
                        console.log(`Got the local copy of the playlists details.`);
                        // If there is a uuidInUsersPlaylists, that means it is a playlist
                        // for a specific user, so we must clone the playlist
                        // and append its uuidInUsersPlaylists.
                        if (uuidInUsersPlaylists) {
                            let clonedPlaylistDetails = clone(playlistsDetails[playlistUUID]);
                            clonedPlaylistDetails.uuidInUsersPlaylists = uuidInUsersPlaylists;
                            resolve(clonedPlaylistDetails);
                        } else {
                            resolve(playlistsDetails[playlistUUID]);
                        }
                    }
                });
            }

            /**
             * Just the ids of the tracks.
             */
            function getPlaylistTracksUUIDs(playlistUUID: string): Promise<any> {

                return new Promise((resolve, reject) => {
                    // If we don't have a local reference to it, make one.
                    if (!playlistsTracks[playlistUUID]) {
                        PLAYLISTS_TRACKS_REF.child(playlistUUID).once(`value`).then((snapshot: any) => {
                            let playlistTracksUUIDs = snapshot.val();
                            let arrayOfTrackUUIDs: any = [];

                            if (playlistTracksUUIDs) {

                                // Make the object into an array.
                                for (let uuidInPlaylist in playlistTracksUUIDs) {
                                    if (playlistTracksUUIDs.hasOwnProperty(uuidInPlaylist)) {
                                        arrayOfTrackUUIDs.push({
                                            trackUUID: playlistTracksUUIDs[uuidInPlaylist],
                                            uuidInPlaylist: uuidInPlaylist,
                                        });
                                    }
                                }

                            }

                            // Create a local reference to the array.
                            playlistsTracks[playlistUUID] = arrayOfTrackUUIDs;

                            resolve(playlistsTracks[playlistUUID]);
                        }).catch(() => {
                            reject(undefined);
                        });
                    } else {
                        console.log(`Got the local copy of the playlists tracks.`);
                        resolve(playlistsTracks[playlistUUID]);
                    }
                });
            }

            function getPlaylist(playlistUUID: string): Promise<any> {
                return new Promise((resolve, reject) => {

                    // If there isn't a local copy, create one.
                    if (!playlists[playlistUUID]) {
                        let promiseDetails = getPlaylistDetails(playlistUUID);
                        let promiseListOftrackUUIDs = getPlaylistTracksUUIDs(playlistUUID);

                        // Get the playlist details and the list of track ids.
                        Promise.all([promiseDetails, promiseListOftrackUUIDs]).then((values) => {
                            let details = values[0];
                            let arrayOfTrackUUIDs = values[1];

                            // Create an array of promises
                            let promiseTracks: Promise<any>[] = [];
                            // tslint:disable-next-line
                            for (let i = 0, track: any; track = arrayOfTrackUUIDs[i]; i = i + 1) {
                                // Getting the tracks like this means it'll create a clone of the local copy of the track,
                                // and append the uuidInPlaylist to that clone.
                                // You have to clone the track otherwise angular isn't happy when using ng-repeat
                                promiseTracks.push(getTrack(track.trackUUID, track.uuidInPlaylist));
                            }

                            // Get each of the tracks.
                            Promise.all(promiseTracks).then((tracksValues) => {

                                let playlist: IPlaylist = {
                                    name: details.name,
                                    owner: details.owner,
                                    tracks: [],
                                    uuid: details.uuid,
                                };

                                // Push each track onto the playlist.
                                // tslint:disable-next-line
                                for (let i = 0, track: any; track = tracksValues[i]; i = i + 1) {
                                    playlist.tracks.push(track);
                                }

                                // Create the local copy of the playlist.
                                playlists[playlistUUID] = playlist;

                                resolve(playlists[playlistUUID]);

                            }).catch(() => {
                                reject(`Failed to get playlist.`);
                            });

                        }).catch(() => {
                            reject(`Failed to get playlist.`);
                        });
                    } else {
                        console.log(`Got the local copy of the playlist.`);
                        resolve(playlists[playlistUUID]);
                    }

                });
            }

            function getUsersPlaylists(): Promise<any> {
                return new Promise((resolve, reject) => {

                    let userUUID = auth.getUserUid();

                    if (usersPlaylists === undefined) {

                        // Get the users playlist UUIDs
                        USERS_REF.child(userUUID).child(`playlists`).once(`value`).then((snapshot: any) => {

                            let retrievedPlaylists = snapshot.val();
                            let promisePlaylistDetails: Promise<any>[] = [];

                            // Create an array of promises that will get playlist details.
                            for (let key in retrievedPlaylists) {
                                if (retrievedPlaylists.hasOwnProperty(key)) {
                                    promisePlaylistDetails.push(getPlaylistDetails(retrievedPlaylists[key], key));
                                }
                            }

                            Promise.all(promisePlaylistDetails).then((playlistsWithDetials) => {

                                // Create an empty array of playlists.
                                usersPlaylists = [];

                                // Add each playlist to the list.
                                // tslint:disable-next-line
                                for (let i = 0, playlist: any; playlist = playlistsWithDetials[i]; i = i + 1) {
                                    usersPlaylists.push(playlist);
                                }

                                resolve(usersPlaylists);

                            }).catch(() => {
                                reject(`Failed to get users playlists.`);
                            });

                        }).catch(() => {
                            reject(`Failed to get users playlists.`);
                        });

                    } else {
                        console.log(`Got the local copy of the users playlists.`);
                        resolve(usersPlaylists);
                    }

                });
            }

            function deletePlaylist(playlistUUID: string, uuidInUsersPlaylists: string): Promise<any> {

                let userUUID = auth.getUserUid();

                // Delete playlist from users playlists.
                // If this completes successfully, then it is considered as completed.
                return new Promise((resolve, reject) => {
                    USERS_REF.child(userUUID).child(`playlists`).child(uuidInUsersPlaylists).remove().then(() => {

                        // Delete the actual playlist details.
                        PLAYLISTS_DETAILS_REF.child(playlistUUID).remove();

                        // Delete the actual playlist tracks.
                        PLAYLISTS_TRACKS_REF.child(playlistUUID).remove();

                        resolve(`Playlist removed.`);
                    }).catch(() => {
                        reject(`Failed to remove playlist.`);
                    });
                });
            }

            function getUsersLibraryUUID(): Promise<any> {
                // usersLibrary
                return new Promise((resolve, reject) => {

                    let userUUID = auth.getUserUid();

                    let correctUsersLibraryCached = true;
                    if (currentUserUUID !== userUUID) {
                        correctUsersLibraryCached = false;
                    }

                    if (!usersLibraryUUID || !correctUsersLibraryCached) {
                        USERS_REF.child(userUUID).child(`library`).once(`value`).then((snapshot: any) => {
                            let libraryUUID = snapshot.val();

                            if (libraryUUID) {
                                // Update the current users UUID.
                                currentUserUUID = userUUID;
                                usersLibraryUUID = libraryUUID;
                                resolve(usersLibraryUUID);
                            } else {
                                reject(`Error: The user doesn't have a library.`);
                            }

                        }).catch(() => {
                            reject(`Failed to find the users library.`);
                        });
                    } else {
                        console.log(`Cached usersLibraryUUID`);
                        resolve(usersLibraryUUID);
                    }

                });
            }



            return {
                addTrackToPlaylist: addTrackToPlaylist,
                createPlaylist: createPlaylist,
                createTrack: createTrack,
                deletePlaylist: deletePlaylist,
                deleteTrackFromPlaylist: deleteTrackFromPlaylist,
                getPlaylist: getPlaylist,
                getPlaylistDetails: getPlaylistDetails,
                getPlaylistTracksUUIDs: getPlaylistTracksUUIDs,
                getTrack: getTrack,
                getUsersDetails: getUsersDetails,
                getUsersLibraryUUID: getUsersLibraryUUID,
                getUsersPlaylists: getUsersPlaylists,
                isTrackInPlaylist: isTrackInPlaylist,
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
        this.app.controller(`master`, ($scope: any, $mdSidenav: any, auth: any, dataManager: any) => {
            let controller = $scope;
            controller.master = {};

            // Hide or show the menu
            controller.toggleMenu = () => {
                $mdSidenav(`left`).toggle();
            };

            // Incase it's the user has just been created, we need to listen
            // for the library created event.
            publisher.subscribe(`library-created`, () => {
                // Update the users library.
                dataManager.getUsersLibraryUUID().then((libraryUUID: string) => {

                    // Now that we have the users library UUID,
                    // we can get its details.
                    dataManager.getPlaylistDetails(libraryUUID).then((libraryDetails: any) => {
                        controller.library = libraryDetails;
                        controller.$digest();
                    });

                });
            });

            // Watch for playlists being 

            publisher.subscribe(`user-ready`, () => {
                controller.user = auth.getUser();

                // Only if there is a new user should we try do stuff
                // with that users information.
                if (controller.user) {

                    // Update the users library.
                    dataManager.getUsersLibraryUUID().then((libraryUUID: string) => {

                        // Now that we have the users library UUID,
                        // we can get its details.
                        dataManager.getPlaylistDetails(libraryUUID).then((libraryDetails: any) => {
                            controller.library = libraryDetails;
                            controller.$digest();
                        });

                    }).catch(() => {
                        // The library isn't finished being created. 
                    });

                    // Update the users playlists
                    dataManager.getUsersPlaylists().then((playlists: any) => {
                        controller.playlists = playlists;
                        controller.$digest();
                    });

                }

            });

            controller.signOut = () => {
                auth.signOut();
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

            controller.showToast = function (message: string) {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(message)
                        .position(`bottom right`)
                        .hideDelay(1500)
                );
            };

            controller.userEmail = user.email;
            controller.trackUUID = `-KRhQqbs0G8ra1c4xjJ5`;
            controller.track = {};
            controller.playlist = {
                name: ``,
                owner: ``,
                tracks: [],
                uuid: `-KRnsMRMEy09mH2d5rC5`,
            };

            controller.createTrack = () => {
                let newTrack: ITrack = {
                    dateAdded: Date.now(),
                    duration: 12369,
                    owner: `this is autogenerated`,
                    services: {
                        "Deezer": 1,
                        "SoundCloud": 3,
                        "YouTube": 2,
                    },
                    title: controller.track.title,
                    uuid: `this is autogenerated`,
                };
                dataManager.createTrack(newTrack).then((data: any) => {
                    console.log(data);
                });
            };

            controller.getTrack = () => {
                dataManager.getTrack(controller.trackUUID).then((track: any) => {
                    // IF YOU DON'T CLONE YOU WILL BE EDITING THE LOCAL COPY!!!!!!!!!!
                    controller.track = JSON.parse(JSON.stringify(track));
                    console.log(track);
                    controller.$digest();
                });
            };

            controller.createPlaylist = () => {
                let newPlaylist: IPlaylist = {
                    name: controller.playlist.name,
                    owner: `This will be autogenerated.`,
                    tracks: [],
                    uuid: `This will be autogenerated.`,
                };
                dataManager.createPlaylist(newPlaylist).then((message: string) => {
                    console.log(message);
                });
            };

            controller.addTrackToPlaylist = () => {
                dataManager.addTrackToPlaylist(controller.playlist.uuid, controller.trackUUID).then((message: string) => {
                    controller.showToast(message);
                }).catch((message: string) => {
                    controller.showToast(message);
                });
            };

            controller.getPlaylistDetails = () => {
                dataManager.getPlaylistDetails(controller.playlist.uuid).then((playlist: IPlaylist) => {
                    controller.playlist = playlist;
                    console.log(playlist);
                });
            };

            controller.getPlaylistTracksUUIDs = () => {
                dataManager.getPlaylistTracksUUIDs(controller.playlist.uuid).then((tracksUUIDS: any) => {
                    console.log(tracksUUIDS);
                });
            };

            controller.getPlaylist = () => {
                dataManager.getPlaylist(controller.playlist.uuid).then((playlist: any) => {
                    controller.playlist = playlist;
                    controller.playlist.name = playlist.name;
                    controller.$digest();
                    console.log(playlist);
                });
            };

            controller.getUsersPlaylists = () => {
                dataManager.getUsersPlaylists().then((usersPlaylists: any) => {
                    console.log(usersPlaylists);
                });
            };

            controller.getUsersLibraryUUID = () => {
                dataManager.getUsersLibraryUUID().then((libraryUUID: any) => {
                    console.log(libraryUUID);
                });
            };

            controller.isTrackInPlaylist = () => {
                dataManager.isTrackInPlaylist(controller.playlist.uuid, controller.trackUUID).then((isIt: boolean) => {
                    controller.showToast(isIt);
                });
            };

            controller.deleteTrackFromPlaylist = () => {
                dataManager.deleteTrackFromPlaylist(controller.playlist.uuid, controller.uuidInPlaylist).then((message: string) => {
                    console.log(message);
                    controller.showToast(message);
                }).catch((message: string) => {
                    console.log(message);
                    controller.showToast(message);
                });
            };

            controller.deletePlaylist = () => {
                dataManager.deletePlaylist(controller.playlist.uuid, controller.playlist.uuidInUsersPlaylists).then((message: string) => {
                    controller.showToast(message);
                }).catch((message: string) => {
                    controller.showToast(message);
                });
            };

        });

        /**
         * Playlist
         */
        this.app.controller(`playlist`, ($scope: any, $location: any, $routeParams: any, dataManager: any, $mdToast: any, $mdDialog: any, user: any) => {
            let controller = $scope;

            // Start off loading.
            controller.loading = true;

            // Setup defaults.
            controller.thisUsersPlaylist = true;

            // Setup toasts
            controller.showToast = function (message: string) {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(message)
                        .position(`bottom right`)
                        .hideDelay(1500)
                );
            };

            controller.showPrompt = function (ev) {
                // Appending dialog to document.body to cover sidenav in docs app
                var confirm = $mdDialog.prompt()
                    .title('What would you name your dog?')
                    .textContent('Bowser is a common name.')
                    .placeholder('Dog name')
                    .ariaLabel('Dog name')
                    .initialValue('Buddy')
                    .targetEvent(ev)
                    .ok('Okay!')
                    .cancel('I\'m a cat person');

                $mdDialog.show(confirm).then(function (result) {
                    $scope.status = 'You decided to name your dog ' + result + '.';
                }, function () {
                    $scope.status = 'You didn\'t name your dog.';
                });
            };

            // Get the current playlist.
            controller.playlistUUID = $routeParams.playlistUUID;

            // Get the current playlist.
            dataManager.getPlaylist(controller.playlistUUID).then((playlist) => {
                controller.playlist = playlist;
                controller.loading = false;

                // Check if the current user is the owner of the playlist.
                if (playlist.owner === user.uid) {
                    controller.thisUsersPlaylist = true;
                } else {
                    controller.thisUsersPlaylist = false;
                    // Get the owners details.
                    dataManager.getUsersDetails(playlist.owner).then((owner) => {
                        controller.owner = owner.email;
                        controller.$digest();
                    });
                }

                controller.$digest();
            }).catch((message) => {
                controller.showToast(message);
                $location.path(`/`);
            });

        });

        /**
         * Loading
         */
        this.app.controller(`loading`, () => { });

        /**
         * Sign up
         */
        this.app.controller(`signUp`, ($scope: any, auth: any, $location: angular.ILocationService, stateCorrector: any, $mdToast: any) => {
            let controller = $scope;
            controller.loading = false;

            // Setup toasts
            controller.showToast = function (message: string) {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(message)
                        .position(`bottom right`)
                        .hideDelay(1500)
                );
            };

            controller.user = {};

            controller.signUp = () => {

                if (!(controller.user.email) || controller.user.email.trim() === ``) {
                    controller.showToast(`Invalid email.`);
                } else if (!(controller.user.password) || (controller.user.password.trim() === `` || controller.user.password.length < 6)) {
                    controller.showToast(`Invalid password (must be at least 6 characters).`);
                } else {
                    controller.loading = true;
                    auth.signUp(controller.user.email, controller.user.password).then((userUUID: string) => {
                        // Restore state.
                        stateCorrector.correctState(userUUID);
                        controller.$apply();
                    }).catch((error: any) => {
                        controller.loading = false;
                        controller.showToast(error);
                    });
                }

            };

        });

        /**
         * Sign in
         */
        this.app.controller(`signIn`, ($scope: any, auth: any, $location: angular.ILocationService, stateCorrector: any, $mdToast: any) => {
            let controller = $scope;
            controller.loading = false;

            // Setup toasts
            controller.showToast = function (message: string) {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(message)
                        .position(`bottom right`)
                        .hideDelay(1500)
                );
            };

            controller.user = {};

            controller.signIn = () => {

                if (!(controller.user.email) || controller.user.email.trim() === ``) {
                    controller.showToast(`Invalid email.`);
                } else if (!(controller.user.password) || (controller.user.password.trim() === `` || controller.user.password.length < 6)) {
                    controller.showToast(`Invalid password (must be at least 6 characters).`);
                } else {
                    controller.loading = true;
                    auth.signIn(controller.user.email, controller.user.password).then((userUUID: string) => {
                        // Restore state.
                        stateCorrector.correctState(userUUID);
                        controller.$apply();
                    }).catch((error: any) => {
                        controller.loading = false;
                        controller.showToast(error);
                    });
                }

            };

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
