
import fs from 'fs';
import path from 'path';
const fileName = 'logger.txt';

/**
 * Appends a given string to a .txt file on the server.
 * If the file does not exist, it will be created.
 * @param {string} fileName - The name of the file (without extension).
 * @param {string} content - The string content to append into the file.
 */
export function appendToFile(content, object=false) {
if(object){
    content += ' \n' + JSON.stringify(object);
}

    const filePath = path.join(__dirname, fileName);

    fs.appendFile(filePath, content + '\n', (err) => {
        if (err) {
            console.error('Error appending to file:', err);
        } else {
            console.log(`Content appended to "${fileName}.txt" at ${filePath}`);
        }
    });
}

// Example usage
//appendToFile('example', 'This is a new line of content.');