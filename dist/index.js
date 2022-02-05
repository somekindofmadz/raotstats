"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const fs = require("fs");
const mongo = require("mongodb");
const path = require("path");
const mongodb = mongo.MongoClient;
const socket_io_1 = require("socket.io");
const db = new mongodb("mongodb://localhost:27017/");
const VERSION = '0136a';
const server = http.createServer((req, res) => {
    var filePath = '.' + req.url;
    if (filePath == './') {
        filePath = './index.html';
    }
    var extname = String(path.extname(filePath)).toLowerCase();
    var mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.svg': 'application/image/svg+xml'
    };
    var contentType = mimeTypes[extname] || 'application/octet-stream';
    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', function (error, content) {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                });
            }
            else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                res.end();
            }
        }
        else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});
const io = new socket_io_1.Server(server);
io.on('connection', (socket) => {
    socket.join('update');
    console.log(`Connection established ${socket.id}`);
    let array = [];
    db.connect((e, client) => __awaiter(void 0, void 0, void 0, function* () {
        let db = client.db('raotstattest');
        let collection = db.collection('players');
        const forms = yield collection.find().sort({ kills: -1 }).limit(4);
        yield forms.forEach((f) => {
            array.push({ id: f.id, name: f.name, kills: f.kills, deaths: f.deaths });
        });
        console.log(array);
        socket.emit('connected', array);
        if (e) {
            console.log(e);
        }
        array = [];
        client.close();
    }));
    socket.on('queryFilter', (data) => {
        /* var regex = '';
        for(let i = 0; i < data.length; i++){
          regex += `${i === 0 ? `/` : ''}(${data.charAt(i)})?${i === data.length - 1 ? `/` : ''}`;
        }
        console.log(regex as unknown as RegExp); */
        var regex = new RegExp(`` + data + ``, 'i');
        db.connect((e, client) => __awaiter(void 0, void 0, void 0, function* () {
            let array = [];
            let db = client.db('raotstattest');
            let collection = db.collection('players');
            const form = yield collection.find({ "name": { $regex: regex } }).sort({ kills: -1 }).limit(4);
            yield form.forEach((f) => {
                array.push({ id: f.id, name: f.name, kills: f.kills, deaths: f.deaths });
            });
            socket.emit('finishQuery', array);
            if (e) {
                console.log(e);
            }
            array = [];
            client.close();
        }));
    });
    socket.on('refreshFilter', () => {
        db.connect((e, client) => __awaiter(void 0, void 0, void 0, function* () {
            let db = client.db('raotstattest');
            let collection = db.collection('players');
            const forms = yield collection.find().sort({ kills: -1 }).limit(4);
            yield forms.forEach((f) => {
                array.push({ id: f.id, name: f.name, kills: f.kills, deaths: f.deaths });
            });
            console.log(array);
            socket.emit('finishRefresh', array);
            if (e) {
                console.log(e);
            }
            array = [];
            client.close();
        }));
    });
    socket.on('getPage', (data) => {
        db.connect((e, client) => __awaiter(void 0, void 0, void 0, function* () {
            let db = client.db('raotstattest');
            let collection = db.collection('players');
            console.log(data.query);
            const forms = (yield data.query) === undefined ? collection.find().sort({ kills: -1 }).limit(4).skip(data.toSkip) : collection.find({ "name": { $regex: new RegExp(`` + data.query + ``, 'i') } }).sort({ kills: -1 }).limit(4).skip(data.toSkip);
            yield forms.forEach((f) => {
                array.push({ id: f.id, name: f.name, kills: f.kills, deaths: f.deaths });
            });
            console.log(array);
            socket.emit('receiveNewPage', array);
            if (e) {
                console.log(e);
            }
            array = [];
            client.close();
        }));
    });
});
server.on('request', (req, res) => {
    if (req.method === 'POST') {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => __awaiter(void 0, void 0, void 0, function* () {
            const objects = JSON.parse(data);
            if (objects[0] === undefined || objects[0].version !== VERSION) {
                return;
            }
            console.log(objects);
            db.connect((e, client) => __awaiter(void 0, void 0, void 0, function* () {
                let db = client.db('raotstattest');
                let collection = db.collection('players');
                for (const object of objects) {
                    const form = yield collection.findOne({ "id": object.id });
                    //console.log(form.kills);
                    if (!form) {
                        yield collection.insertOne({ "id": object.id, "name": object.name, "kills": object.kills, "deaths": object.deaths }); //TODO: ADD NAME ALIASES FIELD AS AN ARRAY
                    }
                    else {
                        if (form.name !== object.name) {
                            yield collection.updateOne(form, { $set: { "name": object.name } });
                        }
                        yield collection.updateOne(form, { $set: { "kills": form.kills + object.kills, "deaths": form.deaths + object.deaths } });
                        console.log(form.kills);
                    }
                }
                if (e) {
                    console.log(e);
                }
                client.close();
            }));
        }));
        res.end();
    }
});
server.listen(8080);
server.on('listening', () => {
    console.log('Started');
});
//# sourceMappingURL=index.js.map