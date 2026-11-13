class Verification {

    /**
     * Gets the YouTube video id given a link.
     * 
     * @return The YouTube video id, and undefined if not valid.
     */
    public getYouTubeVideoId(link: string): string {
        let youtubeURLIdentifier = `v=`;
        let index = link.indexOf(youtubeURLIdentifier);
        let YouTubeVideoIDLength = 11;

        if (index >= 0) {
            // Return the YouTube video id.
            return link.slice(index + youtubeURLIdentifier.length, index + youtubeURLIdentifier.length + YouTubeVideoIDLength);
        } else {
            // Doesn't look like a YouTube video.
            return undefined;
        }
    }

    /**
     * Turns a YouTube video id into a link.
     * 
     * @return The YouTube video link, if the videoId isn't defined return undefined;
     */
    public youtubeVideoIdToLink(videoId: string): string {

        if (!videoId) {
            return undefined;
        }

        let youtubeURL = `https://www.youtube.com/watch?v=`;

        return youtubeURL + videoId;
    }

    /**
     * Get YouTube video title.
     * 
     * @return A promise that resolves the title.
     */
    public getYouTubeVideoTitle(videoId: string): Promise<any> {
        return new Promise((resolve, reject) => {

            // The YouTube Data API key is gone, so use YouTube's public oEmbed
            // endpoint (no key needed) to restore getting the title.
            $.ajax({
                dataType: "json",
                error: function (jqXHR: any, textStatus: any, errorThrown: any) {
                    reject(`Could not get title.`);
                },
                success: function (data: any) {
                    if (data && data.title) {
                        resolve(data.title);
                    } else {
                        reject(`Could not get title.`);
                    }
                },
                url: "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + videoId),
            });
        });

    }

    /**
     * Gets the Deezer track id given a link.
     * 
     * @return The Deezer track id, and undefined if not valid.
     */
    public getDeezerTrackId(link: string): string {
        let deezerURLIdentifier = `deezer.com/track/`;
        let index = link.indexOf(deezerURLIdentifier);

        // While the next value in the id isn't a number
        let deezerTrackIdLength = 0;
        // tslint:disable-next-line
        for (let i = (index + deezerURLIdentifier.length), character: any; character = link[i]; i = i + 1) {
            if (!isNaN(character)) {
                deezerTrackIdLength = deezerTrackIdLength + 1;
            } else {
                break;
            }
        }

        if (index >= 0) {
            // Return the Deezer track id.
            return link.slice(index + deezerURLIdentifier.length, index + deezerURLIdentifier.length + deezerTrackIdLength);
        } else {
            // Doesn't look like a Deezer track.
            return undefined;
        }
    }

    /**
     * Turns a Deezer track id into a link.
     * 
     * @return The Deezer track link, if the trackId isn't defined return undefined;
     */
    public deezerTrackIdToLink(trackId: string): string {

        if (!trackId) {
            return undefined;
        }

        let deezerURL = `http://www.deezer.com/track/`;

        return deezerURL + trackId;

    }

    /**
     * Get Deezer track object.
     * 
     * @return A promise that resolves the track object.
     */
    public getDeezerTrackObject(trackId: string): Promise<any> {
        return new Promise((resolve, reject) => {

            $.ajax({
                dataType: "jsonp",
                error: function (jqXHR: any, textStatus: any, errorThrown: any) {
                    reject(`Could not get track object.`);
                },
                success: function (data: any) {
                    resolve(data);
                },
                url: "https://api.deezer.com/track/" + trackId + "?output=jsonp",
            });
        });

    }

    /**
     * Gets the SoundCloud track object given a link.
     * 
     * @return The SoundCloud track object, and undefined if not valid.
     */
    public getSoundCloudObject(link: string): Promise<any> {
        return new Promise((resolve, reject) => {
            SC.resolve(link).then((object) => {
                if (object.kind === "track") {
                    resolve(object);
                } else {
                    reject();
                }
            }).catch(() => {
                reject();
            });
        });
    }

    /**
     * Turns a SoundCloud track path into a link.
     * 
     * @return The SoundCloud track link, if the track path isn't defined return undefined;
     */
    public soundcloudTrackPathToLink(trackPath: string): Promise<any> {
        return new Promise((resolve, reject) => {

            if (!trackPath) {
                reject();
            } else {
                SC.resolve(`https://api.soundcloud.com${trackPath}`).then((object) => {
                    if (object) {
                        resolve(object.permalink_url);
                    } else {
                        reject();
                    }
                }).catch(() => {
                    reject();
                });

            }

        });

    }

}
