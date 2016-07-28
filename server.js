var unirest = require('unirest');
var express = require('express');
var events = require('events');
var async = require('async');
var app = express();

var getFromApi = function (endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('http://api.spotify.com/v1/' + endpoint)
        .qs(args)
        .end(function (response) {
            if (response.ok) {
                emitter.emit('end', response.body);
            } else {
                emitter.emit('error', response.code);
            }
        });
    return emitter;
};

app.use(express.static('public'));

app.get('/search/:name', function (req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });
    //    var result = function (artist) {
    //        artist
    //        console.log('Did everything work as planned?');
    //    };
    searchReq.on('end', function (item) {
        var artist = item.artists.items[0];
        var relatedArtist = getFromApi('artists/' + artist.id + '/related-artists');

        relatedArtist.on('end', function (relatedItem) {
            // related artists > 1

            artist.related = relatedItem.artists;
            var relatedArtists = artist.related;
            // Don't use For loop...
            // Takes a lot of time :-)

            async.map(artist.related, function (relatedArtist, result) {
                var artistTopTrack = getFromApi('artists/' + relatedArtists.id + '/top-tracks', {
                    country: 'US'
                });
                artistTopTrack.on('end', function (topTrack) {
                    artist.related = item.tracks
                    console.log('TRACKS', item.tracks);
                    res.json(artist);
                });
                // item ->  object representing an artist
                // item.tracks =

            });

        });

        relatedArtist.on('error', function (code) {
            res.sendStatus(code);
        });

    });

    searchReq.on('error', function (code) {
        res.sendStatus(code);
    });
});

app.listen(8080);
