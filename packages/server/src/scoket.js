import expressWs from 'express-ws';
import { spawn } from 'child_process';
import { formatCmdOutput } from './exec.js';

export function startWs(app) {
  expressWs(app);

  app.ws('/terminal', (ws) => {
    // 创建一个子进程，运行 shell (bash 或 cmd)
    const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash';
    const shellProcess = spawn(shell);

    // 监听子进程输出 (stdout)
    shellProcess.stdout.on('data', (data) => {
      ws.send(formatCmdOutput(data));
    });

    // 监听子进程错误输出 (stderr)
    shellProcess.stderr.on('data', (data) => {
      ws.send(formatCmdOutput(data));
    });

    // 当子进程关闭时，通知客户端
    shellProcess.on('close', (code) => {
      ws.send(`Process exited with code ${code}`);
    });

    // 接收客户端消息并发送到子进程
    ws.on('message', (msg) => {
      shellProcess.stdin.write(msg + '\n');
    });

    // 关闭连接时，终止子进程
    ws.on('close', () => {
      console.log('WebSocket disconnected');
      shellProcess.kill();
    });
  });
}
