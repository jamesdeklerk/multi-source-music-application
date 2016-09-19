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

}
