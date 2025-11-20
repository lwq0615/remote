import express from 'express';
import exec, { getExecContext } from './exec.js';
import { startWs } from './scoket.js';
import os from 'os';
export const app = express();
// 解析 JSON body
app.use(express.json());
import fs from 'fs/promises';
import path from 'path';
const port = 8899;
const platform = os.platform();
const isMac = platform === 'darwin';

const vpnConfig = {
  1: {
    name: 'ql-L2TP',
    username: 'liwq-L2TP',
    password: 'Liwq@20230722',
  },
  2: {
    name: 'ql-PPTP',
    username: 'liwq',
    password: 'Liwq@20230722',
  },
};
let cwd = path.resolve(process.cwd(), '../../..');
const workspace = 'cd ' + cwd;

function getWorkspace(project) {
  return `${workspace}/${project}`;
}

// 检查 VPN 是否已连接
async function checkVPNStatus(vpn = 1) {
  try {
    // networksetup -showpppoestatus ql-L2TP
    const vpnName = vpnConfig[vpn].name;
    const stdout = await exec(isMac ? 'networksetup -showpppoestatus ' + vpnName : 'rasdial');
    if (!vpn) {
      return !stdout.includes('没有连接');
    }
    return isMac ? stdout.trim() === 'connected' : stdout.includes(vpnName);
  } catch (error) {
    console.error('检查 VPN 状态时出错:', error);
    throw {
      message: '检查 VPN 状态时出错',
      error: error,
    };
  }
}

// 连接 VPN
async function connectVPN(vpn = 1) {
  const { name, username, password } = vpnConfig[vpn];
  try {
    const connectCommand = isMac
      ? `networksetup -connectpppoeservice ${name}`
      : `rasdial "${name}" "${username}" "${password}"`;
    const stdout = await exec(connectCommand);
    if (isMac || stdout.includes('已连接')) {
      console.log('VPN 连接成功:', stdout);
      return true;
    } else {
      console.error('VPN 连接失败:', stdout);
      throw new Error('VPN 连接失败');
    }
  } catch (error) {
    console.error('VPN 连接失败:', error);
    throw {
      message: 'VPN 连接失败',
      error: error,
    };
  }
}

async function executeGitCommands(project, branch) {
  const commands = [
    `${getWorkspace(project)} && git pull --no-rebase origin2 master`,
    `${getWorkspace(project)} && git pull --no-rebase origin ${branch}`,
    `${getWorkspace(project)} && git push origin2 ${branch}:master`,
    `${getWorkspace(project)} && git push origin ${branch}`,
  ];

  for (const command of commands) {
    await exec(command);
  }
}

async function pushCode(vpn, project, branch) {
  const { startListen, endListen } = getExecContext();
  startListen();
  try {
    const isConnected = await checkVPNStatus(vpn);
    if (!isConnected) {
      console.log('VPN 未连接，开始连接...');
      await connectVPN(vpn);
    } else {
      console.log('VPN 已连接');
    }

    console.log('开始执行 Git 命令...');
    await executeGitCommands(project, branch);
  } finally {
    return endListen();
  }
}

// 主接口
app.post('/git/push', async (req, res) => {
  const { vpn = 1, project = 'ql-new-cloud', branch = 'feature_v1.1.0' } = JSON.parse(req.query.params);
  pushCode(vpn, project, branch)
    .then((data) => {
      res.status(200).json({ message: '操作成功', data });
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

app.get('/git/push', async (req, res) => {
  const { vpn = 1, project = 'ql-new-cloud', branch = 'master' } = req.query;
  pushCode(vpn, project, branch)
    .then((data) => {
      res.status(200).json({ message: '操作成功', data });
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

app.get('/git/branch', async (req, res) => {
  const { project = 'ql-new-cloud' } = req.query;
  const stdout = await exec(`${getWorkspace(project)} && git branch`);
  res.status(200).json(stdout);
});

app.get('/git/checkout', async (req, res) => {
  const { project = 'ql-new-cloud', branch } = req.query;
  if (!branch) {
    res.status(500).json({
      message: '分支名称不能为空',
    });
  }
  const stdout = await exec(`${getWorkspace(project)} && git branch`);
  // 检查分支是否存在
  let exist = stdout.split('\n').some((item) => item.replaceAll('*', '').trim() === branch);
  try {
    await exec(`${getWorkspace(project)} && git checkout ${exist ? '' : '-b '}${branch}`);
    res.status(200).json({
      message: '操作成功',
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
      error: e,
    });
  }
});

app.get('/git/delete', async (req, res) => {
  const { project = 'ql-new-cloud', branch } = req.query;
  if (!branch) {
    res.status(500).json({
      message: '分支名称不能为空',
    });
  }
  const stdout = await exec(`${getWorkspace(project)} && git branch`);
  // 检查分支是否存在
  let exist = stdout.split('\n').some((item) => item.replaceAll('*', '').trim() === branch);
  if (!exist) {
    res.status(500).json({
      message: '分支不存在',
    });
    return;
  }
  try {
    await exec(`${getWorkspace(project)} && git branch -d ${branch}`);
    res.status(200).json({
      message: '操作成功',
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
      error: e,
    });
  }
});

app.post('/code/sync', async (req, res) => {
  const { project = 'ql-new-cloud', codeList } = req.body;
  try {
    if (!project || !Array.isArray(codeList)) {
      return res.status(400).json({ message: '参数格式错误' });
    }
    const workspace = path.resolve(cwd, project);
    for (const item of codeList) {
      const { file, code } = item;
      if (!file || typeof code !== 'string') continue;

      // 目标文件路径
      const filePath = path.join(workspace, file);

      // 创建目录（递归创建所有层级）
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // 写入文件（不存在即创建，存在覆盖）
      await fs.writeFile(filePath, code, 'utf-8');
    }

    const stdout = await exec(`${getWorkspace(project)} && git branch`);
    const branch = stdout
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        if (item.includes('*')) {
          const branchName = item.replace('*', '').trim();
          return {
            value: branchName,
            label: branchName,
            checked: true,
          };
        }
        return {
          value: item,
          label: item,
        };
      })
      .find((item) => item.checked).value;
    const data = await pushCode(null, project, branch);
    res.status(200).json({ message: '操作成功', data });
  } catch (err) {
    console.error('同步失败：', err);
    res.status(500).json({ message: '同步失败', error: err.message });
  }
});

startWs(app, cwd);

// 启动服务
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  // setInterval(() => {
  //   checkVPNStatus().then((isConnected) => {
  //     if (!isConnected) {
  //       console.log('VPN 未连接，尝试重新连接...');
  //       connectVPN(1).catch((error) => {
  //         console.error(error);
  //       });
  //     }
  //   });
  // }, 60 * 1000);
});
