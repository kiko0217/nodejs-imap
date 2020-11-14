var fs = require('fs'),
    base64 = require('base64-stream'), 
    path = require('path'),
    simpleParser = require('mailparser').simpleParser,
    Imap = require('imap');

// host gmail

var imap = new Imap({
    user: 'mygmailname@gmail.com',
    password: 'mygmailpassword',
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  });

console.log('Starting read mail …..');
//Once the mail box is read to open

imap.once('ready', () => {
    imap.openBox('INBOX', false, (err, box) => {
        if (err) {
            console.log(err);
        }
        // Search unseen emails having "hello world" in their Subject headers
        imap.search(['UNSEEN', ['HEADER', 'SUBJECT',"test oke"]], (err1, results) => {
            if (err1) {
                console.log(err1);
            }
            try {
                // const f = imap.fetch(results, { bodies: 'TEXT' });
                const f = imap.fetch(results, {
                    bodies: '', // "[\'HEADER.FIELDS (FROM TO SUBJECT DATE)\', '']",
                    struct: true,
                });
                f.on('message', (msg, seqno) => {
                    const prefix = `(#${seqno}) `;
                    msg.on('body', (stream, info) => {
                        simpleParser(stream, (err2, mail) => {
                            if (err2) {
                                console.log('Read mail executor error …..', err2);
                                // this.emit(EXECUTOR_EVENTS.STOPPED, { reason: END_REASON.ERROR, error: err2 });
                            }
                            const fileName = `msg-${seqno}-body.txt`;
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
                    });
                    msg.once('attributes', (attrs) => {
                        // Mark the above mails as read
                        const { uid } = attrs;
                        imap.addFlags(uid, ['\\Seen'], (err2) => {
                            if (err2) {
                                console.log(err2);
                            } else {
                                console.log('Marked as read!');
                            }
                        });
                    });
                });
                f.once('end', () => {
                    imap.end();
                });
            } catch (errorWhileFetching) {
                console.log(errorWhileFetching.message);
                if (errorWhileFetching.message === 'Nothing to fetch') {
                    console.log('no mails fetched, temp directory not created');
                    console.log('Read mail executor finished …..');
                    // this.emit(EXECUTOR_EVENTS.STOPPED, { reason: END_REASON.COMPLETE });
                    imap.end();
                }
                imap.end();
                // this.emit(EXECUTOR_EVENTS.STOPPED, { reason: END_REASON.ERROR });
            }
        });
    }); // close open mailbox
}); // close ready
// if error occurs in connection making
imap.once('error', (err) => {
    console.log(err);
    console.log('Read mail executor error …..');
    // this.emit(EXECUTOR_EVENTS.STOPPED, { reason: END_REASON.ERROR });
});
// Once it ends
imap.once('end', () => {
    console.log('Read mail executor finished …..');
    // this.emit(EXECUTOR_EVENTS.STOPPED, { reason: END_REASON.COMPLETE });
});
// initiating connection
imap.connect();