const net = require('net');
const fs = require('fs');
const crypto = require('crypto');
const port = 3002;

let seed = 0;

const server = net.createServer(function (client) {
    client.on('error', function (err) {
        console.error(err);
    });
    client.on('end', function () {
        console.log(`Client ${client.id} disconnected`);
    });
    client.on('data', createDialogWithClient);
    client.on('data', DialogWithClient);

    function createDialogWithClient(data) {
        if (data.toString() ===  "REMOTE") {
            client.id = getUniqId();
            console.log('Client ' + client.id + " connected");
            client.write('ACK');
        }
    }

    function DialogWithClient(data) {
        if (data.toString() !== "REMOTE") {
            let messagePart = data.toString().split('|');
            let Type = messagePart[0];
            let Name = messagePart[1];
            let newFileName = messagePart[2];
            let key = messagePart[3];

            if (Type === "COPY") {
                createFileWithStream(Name, newFileName);
            }
            else if (Type === "ENCODE") {
                createFileWithStream(Name, newFileName, crypto.createCipher("aes192", key));
            }
            else if (Type === "DECODE") {
                createFileWithStream(Name, newFileName, crypto.createDecipher("aes192", key));
            }
        }
    }
});

server.listen(port, 'localhost', function () {
    console.log(`Server listening on localhost:${port}`);
});

function createFileWithStream(fileName, newFileName, transformStream) {
    fs.stat(fileName, (err) => {
        if (!err) {
            const rd = fs.createReadStream(fileName);
            const ws = fs.createWriteStream(newFileName);
            if (transformStream) {
                rd.pipe(transformStream).pipe(ws);
            } else {
                rd.pipe(ws);
            }

        } else {
            console.error("stat error " + err);
        }
    });
}

function getUniqId() {
    return Date.now() + seed++;
}