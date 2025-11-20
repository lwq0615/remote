import child_process from 'child_process';
import dayjs from 'dayjs';
import iconv from 'iconv-lite';
const encoding = 'cp936';
const binaryEncoding = 'binary';

export function formatCmdOutput(str) {
  // return iconv.decode(new Buffer(str, binaryEncoding), encoding);
  return str;
}

const listenList = [];

export default function exec(command) {
  listenList.forEach((item) => {
    item.push(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ` + command);
  });
  try {
    const output = child_process.execSync(command, {
      encoding: 'utf8',
    });
    listenList.forEach((item) => {
      item.push(output);
    });
    return output;
  } catch (err) {
    listenList.forEach((item) => {
      item.push(err.toString());
    });
  }
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
