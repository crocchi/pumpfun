
import fs from 'fs';
import path from 'path';
//fix __dirname in ES module
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fileName = 'logger.txt';
import { getDateTime } from './utility/time.js'; // Adjust the path as necessary


/**
 * Appends a given string to a .txt file on the server.
 * If the file does not exist, it will be created.
 * @param {string} fileName - The name of the file (without extension).
 * @param {string} content - The string content to append into the file.
 */
export function appendToFile(content, object=false) {
if(object){
    content += ' \n\n [' + getDateTime() +`] [${object[0]?.name || object.info}]` + JSON.stringify(object);
}

    const filePath = path.join('/cro', fileName);

    fs.appendFile(filePath, content + '\n', (err) => {
        if (err) {
            console.error('Error appending to file:', err);
        } else {
            console.log(`Content appended to "${fileName}" at ${filePath}`);
        }
    });
}

// Example usage
//appendToFile('example', 'This is a new line of content.');