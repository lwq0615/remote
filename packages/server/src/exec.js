import child_process from "child_process";
import iconv from "iconv-lite";
const encoding = "cp936";
const binaryEncoding = "binary";

export default function exec(command) {
  return new Promise((resolve, reject) => {
    child_process.exec(command, { encoding: binaryEncoding }, (error, stdout, stderr) => {
      if (error) {
        error.message = iconv.decode(new Buffer(error.message, binaryEncoding), encoding);
        reject(error);
      } else if (stderr) {
        resolve(iconv.decode(new Buffer(stderr, binaryEncoding), encoding));
      } else {
        resolve(iconv.decode(new Buffer(stdout, binaryEncoding), encoding));
      }
    });
  });
}
