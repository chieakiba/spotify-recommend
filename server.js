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

var getTopTracks = function (artist, callback) {
    unirest.get('http://api.spotify.com/v1/artists/' + artist.id + '/top-tracks?country=US')
        .end(function (response) {
            //            console.log('RESPONSE', response.body);
            if (response.ok) {
                artist.tracks = response.body.tracks;
                callback();
            } else {
                callback(response.error);
            }
        })
}

app.use(express.static('public'));

app.get('/search/:name', function (req, res) {
    // GET from "your backend"
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

        //        console.log(artist, 'ARTIST');
        // getting from "other people's APIs"
        unirest.get('http://api.spotify.com/v1/artists/' + artist.id + '/related-artists')
            .end(function (response) {
                //                console.log(response.body, "RESPONSE");
                if (response.ok) {
                    //                    artist = {}//                    artist.related = "alkjsfa";
                    //                    artist -> {related: 'lsdlfs"'}
                    artist.related = response.body.artists;
                    var total = artist.related.length;
                    var completed = 0;
                    //                    console.log(artist.related, "Related Artist");

                    function checkCompleted() {
                        if (completed == total) {
                            res.json(artist);
                        }
                    }

                    for (var i = 0; i < artist.related.length; i++) {
                        getTopTracks(artist.related[i], function (err) {
                                if (err) {
                                    res.sendStatus(404);
                                }
                                completed++;
                                checkCompleted();
                            }


                        )
                    }
                } else {
                    res.sendStatus(404);
                }
            })
            //
            //        var relatedArtist = getFromApi('artists/' + artist.id + '/related-artists');
            //
            //        relatedArtist.on('end', function (relatedItem) {
            //            // related artists > 1
            //
            //            artist.related = relatedItem.artists;
            //            var relatedArtists = artist.related;
            //            var completed = 0;
            //            //            function checkComplete() {}
            //            //            // or
            //            //            var checkComplete = function(){}
            //            //            // one way of executing
            //            //            checkComplete();
            //            function checkComplete() {
            //                if (completed === artist.related.length) {
            //                    res.json(artist);
            //                }
            //            }
            //            // Don't use For loop...
            //            // Takes a lot of time :-)
            //            var artistTopTrack = getFromApi('artists/' + relatedArtists.id + '/top-tracks', {
            //                country: 'US'
            //            });
            //            artistTopTrack.on('end', function (topTrack) {
            //                artist.tracks = topTrack.artists;
            //                console.log("TOP TRACKS", topTrack.artists);
            //                completed++;
            //                checkComplete();
            //                //                res.json(relatedArtists);
            //                //                                async.map(artist.related, function (artistTopTrack) {
            //                //                 item ->  object representing an artist
            //                //                 item.tracks =
            //                //
            //                //                                });
            //            });
            //            artistTopTrack.on('error', function (code) {
            //                res.sendStatus(code);
            //            });

        //        });
        //
        //        relatedArtist.on('error', function (code) {
        //            res.sendStatus(code);
        //        });

    });

    searchReq.on('error', function (code) {
        res.sendStatus(code);
    });
});

app.listen(8080);
