import child_process from 'child_process';
import dayjs from 'dayjs';
import iconv from 'iconv-lite';
const encoding = 'cp936';
const binaryEncoding = 'binary';

export function formatCmdOutput(str) {
  return iconv.decode(new Buffer(str, binaryEncoding), encoding);
}

const listenList = [];

export default function exec(command) {
  return new Promise((resolve, reject) => {
    listenList.forEach((item) => {
      item.push(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ` + command);
    });
    child_process.exec(command, { encoding: binaryEncoding }, (error, stdout, stderr) => {
      if (error) {
        error.message = formatCmdOutput(error.message)
        listenList.forEach((item) => {
          item.push(error.toString());
        });
        reject(error);
      } else if (stderr) {
        const output = formatCmdOutput(stderr)
        listenList.forEach((item) => {
          item.push(output.trim());
        });
        resolve(output);
      } else {
        const output = formatCmdOutput(stdout)
        listenList.forEach((item) => {
          item.push(output.trim());
        });
        resolve(output);
      }
    });
  });
}

export function getExecContext() {
  const listen = [];
  return {
    exec: exec,
    startListen() {
      listenList.push(listen);
    },
    endListen() {
      return listenList.splice(listenList.indexOf(listen), 1)[0];
    },
  };
}
