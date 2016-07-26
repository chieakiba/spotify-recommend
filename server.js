var unirest = require('unirest');
var express = require('express');
var events = require('events');
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
    //    unirest.get('http://api.spotify.com/v1/' + endpoint + '/related-artists')
    //        .qs(args)
    //        .end(function (response) {
    //            if (response.ok) {
    //                emitter.emit('end', response.body);
    //            } else {
    //                emitter.emit('error', response.code);
    //            }
    //        });
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
        console.log("SEEING artist", artist);
        var relatedArtist = getFromApi('artists/' + artist.id + "/related-artists");
        relatedArtist.on('end', function (relatedItem) {
            console.log('relatedItem', relatedItem);
            artist.related = relatedItem.artists;
            res.json(artist);
        })
        relatedArtist.on('error', function (code) {
            res.sendStatus(code);
        });
        //        console.log('item', item);
        //        console.log('artist', artist);
        //        e.g. 20 artists
        //        each of them, needs to be given a `related` property
        //        artist.related = "tah other api call"

    })

    searchReq.on('error', function (code) {
        res.sendStatus(code);
    });
});

app.listen(8080);
