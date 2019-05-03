const express = require('express');
const app = express();
const http = require('http').Server(app);
const path = require('path');
const router = express.Router();
const io = require('socket.io')(http);
const fs = require('fs');
const url = require('url');
const $ = require("jquery");

app.use(express.static(__dirname + '/client'));
app.use(express.static(__dirname + '/images'));
app.use(express.static(__dirname + '/share'));
app.use(express.static(__dirname));

let rooms = {};
let roomName;
let text = [];
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
    console.log(rooms);
    res.redirect(`/share/${roomName}`);
});

app.get(`/share/:roomName`, function(req, res){
    roomName = req.params.roomName;
    // roomName = this.roomName;
    // console.log(roomName);
    res.sendFile(`${__dirname}/share.html`);
});

io.on('connection', function(socket){

    socket.on('disconnect', function(socket){
        // console.log(`User is disconneted ${socket.id}`);
        // var index = rooms[data].indexOf(socket.id);
        // if (index !== -1) array.splice(index, 1);
        console.log('user disconnected' + rooms[roomName].users[socket.id]);
    });
    // console.log(`User is connected: ${socket.id}`);
    // socket.on('getData', function(data){
    //     socket.to(data.room).emit('pushData', 'hello world');
    // });

    socket.emit('refresh', rooms[roomName].editor.content);

    socket.on('refresh', function (body_) {
        rooms[roomName].editor.content = body_;
        console.log(body_);
        console.log(rooms);
    });

    socket.on('join', function (data) {
        socket.join(data.room);
        console.log('user is joined: ' + data.users);
        rooms[data.room].users.push(data.users);
        console.log(rooms);
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
        // console.log('disable');
        socket.to(data.room).emit('editorDisable');
    });

    socket.on('enableEditor', function(data){
        socket.to(data.room).emit('editorEnable');
    });

});

http.listen(3000, function(){
    // console.log('Listening at port 4444');
});


