const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const router = express.Router();
const fs = require('fs');
const url = require('url');
const $ = require("jquery");

app.use(express.static(__dirname + '/client'));
app.use(express.static(__dirname + '/images'));
app.use(express.static(__dirname + '/stylesheets'));
app.use(express.static(__dirname));

let roomName;
let rooms = {};

function createRoom(roomName){
    if(!rooms[roomName]){
        rooms[roomName] = {
            "users": [],
            "editor": {
                "content": ""
            }
        };
    }
}


function getUserByRoom(roomName) {
    return Object.values(rooms[roomName].users);
}
app.get('/', function(req, res){
    res.sendFile(`${__dirname}/index.html`);
});

app.get('/new', function(req, res){
    roomName = String(Date.now());
    createRoom(roomName);
    res.redirect(`/share/${roomName}`);
});

app.get(`/share/:roomName`, function(req, res){
    roomName = req.params.roomName;
    res.sendFile(`${__dirname}/share.html`);
});

io.on('connection', function(socket){

    socket.on('disconnect', function(socket){        
        console.log('user disconnected');
    });

    socket.emit('refresh', rooms[roomName].editor.content);

    socket.on('refresh', function (body_) {
        rooms[roomName].editor.content = body_;
    });

    socket.on('join', function (data) {
        socket.join(data.room);
        rooms[data.room].users.push(data.users);
        io.in(data.room).emit('pushData', rooms[data.room].editor.content);
        io.in(data.room).emit('users', rooms[data.room].users);
    });
    
    socket.on('change', function(op){
        if (op.content.origin == '+input' || op.content.origin == 'paste' || op.content.origin == '+delete') {
            socket.to(roomName).emit('change', op.content);
            rooms[roomName].editor.content = op.content;
        }
    });
    
    socket.on('disableEditor', function(data){
        socket.to(data.room).emit('editorDisable');
    });

    socket.on('enableEditor', function(data){
        socket.to(data.room).emit('editorEnable');
    });

});

http.listen(3000, function(){
    console.log('Listening at port: 3000');
});


