var fs = require('fs'),
    path = require('path'),    
    filePath = path.join(__dirname, 'setup.js'),
    directoryPath = path.join(__dirname, 'dt');
// var base64  = require('base64-stream');
const simpleParser = require('mailparser').simpleParser;
const _ = require('lodash');

fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        console.log(file);
        filePath = path.join(directoryPath, file)
        fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
            if (!err) {
                console.log('received data: ' + data);
                // var all = _.find(data.parts, { "which": "" })
                // var id = data.attributes.uid;
                // var idHeader = "Imap-Id: "+id+"\r\n";
                simpleParser(data, (err, mail) => {
                    // access to the whole mail object
                    if(err) {
                        console.log(err)
                        throw err
                    }
                    const fileName = `msg-${file}-body.txt`;
                    const fullFilePath = path.join(__dirname, fileName);
                    const emailEnvolope = {};
                    emailEnvolope.from = mail.from.text;
                    emailEnvolope.date = mail.date;
                    emailEnvolope.to = mail.to.text;
                    emailEnvolope.subject = mail.subject;
                    emailEnvolope.text = mail.text;
                    emailEnvolope.attachments = [];
                    // write attachments
                    for (let i = 0; i < mail.attachments.length; i += 1) {
                        const attachment = mail.attachments[i];
                        const { filename } = attachment;
                        emailEnvolope.attachments.push(filename);
                        fs.writeFileSync(path.join(__dirname, filename), attachment.content, 'base64'); // take encoding from attachment ?
                    }
                    const contents = JSON.stringify(emailEnvolope);
                    fs.writeFileSync(fullFilePath, contents);
                    console.log('processing mail done….');
                });
            } else {
                console.log(err);
            }
        });
    });
});

