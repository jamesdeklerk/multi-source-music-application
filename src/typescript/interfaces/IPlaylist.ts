interface IPlaylist {
    owner: string;
    name: string;
    tracks: ITrack[];
    uuid: string;
    uuidInUsersPlaylists: string;
}
