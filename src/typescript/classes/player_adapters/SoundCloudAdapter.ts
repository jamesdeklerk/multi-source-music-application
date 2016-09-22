// tslint:disable-next-line
interface Window {
    SC: any;
}

class SoundCloudAdapter implements IPlayerAdapter {

    public name = `SoundCloud`;
    private CLIENT_ID = `557c90822ab6395bc8da3b9f62d86ab8`;
    // Because of the way SoundCloud works (creating a new player instance per track)
    // this is a hashmap of player objects where the key is the track id.
    private players: any = {};
    private currentPlayer: any;

    public initialize(): Promise<any> {

        return new Promise((resolve, reject) => {

            window.SC.initialize({
                client_id: this.CLIENT_ID,
                redirect_uri: window.location.origin,
            });

            // Assume it is instantly initialized
            resolve();

        });

    }

    public unload(): void {
        this.pause();

        // Clear the currentPlayer
        if (this.currentPlayer) {
            this.currentPlayer = undefined;
        }
    }

    public load(track: ITrack): Promise<{}> {
        return new Promise((resolve, reject) => {

            let trackPath: string;
            if (track.services[this.name]) {
                trackPath = track.services[this.name].trackPath;
            }

            if (trackPath) {

                // Check if there's an existing player object attatched to that
                // trackPath, if there is, user it, else create one for that trackPath.

                if (this.players[trackPath]) {

                    // Set the current player.
                    this.currentPlayer = this.players[trackPath];

                    // Restart the song, because SoundCloud resumes it by default
                    this.seekToPercentage(0);

                    this.currentPlayer.play();

                    resolve();

                } else {

                    window.SC.stream(trackPath).then((streamPlayer: any) => {

                        // Locally cache the player.
                        this.players[trackPath] = streamPlayer;

                        // Set the current player.
                        this.currentPlayer = this.players[trackPath];

                        this.currentPlayer.play();

                        resolve();

                    }).catch(function (error: any) {

                        // Unload the current player just in case.
                        this.unload();

                        reject();
                    });
                }

            } else {
                reject();
            }

        });
    }

    public play(): void {
        if (this.currentPlayer) {
            this.currentPlayer.play();
        }
    }

    public pause(): void {
        if (this.currentPlayer) {
            this.currentPlayer.pause();
        }
    }

    public getPaused(): boolean {
        if (this.currentPlayer) {
            return this.currentPlayer.isPaused();
        } else {
            return true;
        }
    }

    public setVolume(volume: number): void {
        if (this.currentPlayer) {
            this.currentPlayer.setVolume(volume);
        }
    }

    public seekToPercentage(percentage: number): void {
        if (this.currentPlayer) {
            this.currentPlayer.seek(this.getDuration() * percentage);
        }
    }

    public getCurrentTime(): number {
        if (this.currentPlayer) {
            return this.currentPlayer.currentTime();
        } else {
            return 0;
        }
    }

    public getDuration(): number {
        if (this.currentPlayer) {
            if (this.currentPlayer.streamInfo) {
                return this.currentPlayer.streamInfo.duration;
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    }

    public getPercentageLoaded(): number {
        if (this.currentPlayer) {
            return (this.currentPlayer.buffered() / this.getDuration()) || 0;
        } else {
            return 0;
        }
    }

}
