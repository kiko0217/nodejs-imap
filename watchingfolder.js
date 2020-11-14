const chokidar = require('chokidar');

// One-liner for current directory
chokidar.watch('./dt').on('add', (event, path) => {
//   console.log(event, path);
    console.log(event)
});