/*
    Node.JS WebGL Inclinometer
    Copyright (C) 2015	Lucas Teske

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

var io = require('socket.io').listen(82);
var clientsocket;
var angledata = [0,0,0];
var incldevice = "iio:device2";	//	The IIO Device. Basically the folder /sys/bus/iio/devices/{DEVICE}/ must have in_incli* files
var active = false;

var Promise = require('promise');
var fs = require('fs');
var Q = require('q');

io.sockets.on('connection', function (socket) {
	socket.emit('onconnect', {});
	clientsocket = socket;
});


function readScale(data) {
	var def = Q.defer();
	fs.readFile('/sys/bus/iio/devices/'+incldevice+'/in_incli_scale', 'utf8', function (err, res) {	//	Reads value to angle scale
		data.scale = parseFloat(res);
		if (err) def.reject(err)
		else def.resolve(data);
	});
	return def.promise;
}

function readX(data) {
	var def = Q.defer();
	fs.readFile('/sys/bus/iio/devices/'+incldevice+'/in_incli_x_raw', 'utf8', function (err, res) { // Reads X value
		data.x = parseFloat(res);
		if (err) def.reject(err)
		else def.resolve(data);
	});
	return def.promise;
}

function readY(data)	{
	var def = Q.defer();
	fs.readFile('/sys/bus/iio/devices/'+incldevice+'/in_incli_y_raw', 'utf8', function (err, res) { // Reads Y value
		data.y = parseFloat(res);
		if (err) def.reject(err)
		else def.resolve(data);
	});
	return def.promise;
}

function readZ(data)	{
	var def = Q.defer();
	fs.readFile('/sys/bus/iio/devices/'+incldevice+'/in_incli_z_raw', 'utf8', function (err, res) { // Reads Z value
		data.z = parseFloat(res);
		if (err) def.reject(err)
		else def.resolve(data);
	});
	return def.promise;
}

function sendData(data)	{
	data.x *= data.scale;	//	Scales all data
	data.y *= data.scale;
	data.z *= data.scale;
	if(clientsocket)	
		clientsocket.emit('updatepos', {'x':data.x,'y':data.y,'z':data.z}); // Send scaled data for client
	console.log("P: ",data);
}

function schedule()	{
	setTimeout(updateData, 1);
}

function updateData()	{
	readScale({}).then(readX).then(readY).then(readZ).then(sendData).then(schedule);	//	All our flow, isn't that beautiful using promisses? :D
}

updateData();
