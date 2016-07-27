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

    searchReq.on('end', function (item) {
        var artist = item.artists.items[0];
        var relatedArtist = getFromApi('artists/' + artist.id + '/related-artists');

        relatedArtist.on('end', function (relatedItem) {
            // related artists > 1
            // loop
            var relatedArtists = relatedItem.artists;
            //            console.log(relatedItem, "RELATED!!!!");
            // Don't use For loop...
            // Takes a lot of time :-)
            for (var i = 0; i < relatedArtists.length; i++) {

                //                console.log("Reached here");
                var artistTopTrack = getFromApi('artists/' + relatedArtists[i].id + '/top-tracks', {
                    country: 'US'
                });
                //            console.log('Artist top track:', artistTopTrack);

                artistTopTrack.on('end', function (topTrack) {
                    console.log(topTrack, "TOP Track");
                    artist = item.tracks;
                    //                    console.log('artist', artist);
                    // THIS is the end
                    res.json(artist);
                });
            }

            artist.related = relatedItem.artists;
            //            res.json(artist);
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
