import express from 'express';
import exec from './exec.js';
const app = express();
const port = 8899;

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
const workspace = 'cd D:\\projects';

function getWorkspace(project) {
  return `${workspace}\\${project}`;
}

// 检查 VPN 是否已连接
async function checkVPNStatus(vpn) {
  const vpnName = vpnConfig[vpn].name;
  try {
    const stdout = await exec('rasdial');
    return stdout.includes(vpnName);
  } catch (error) {
    console.error('检查 VPN 状态时出错:', error);
    throw {
      message: '检查 VPN 状态时出错',
      error: error,
    };
  }
}

// 连接 VPN
async function connectVPN(vpn) {
  const { name, username, password } = vpnConfig[vpn];
  try {
    const connectCommand = `rasdial "${name}" "${username}" "${password}"`;
    const stdout = await exec(connectCommand);
    if (stdout.includes('已连接')) {
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

// 执行 Git 命令
async function executeGitCommands(project, branch) {
  const commands = [
    `${getWorkspace(project)} && git pull origin2 master`,
    `${getWorkspace(project)} && git push origin ${branch}`,
  ];

  for (const command of commands) {
    try {
      const stdout = await exec(command);
      console.log(`命令执行成功: ${command} 输出:`, stdout);
    } catch (error) {
      console.error(`命令执行失败: ${command} 错误:`, error);
      throw {
        message: `命令 ${command} 执行失败`,
        error: error,
      };
    }
  }
}

async function pushCode(vpn, project, branch) {
  const isConnected = await checkVPNStatus(vpn);
  if (!isConnected) {
    console.log('VPN 未连接，开始连接...');
    await connectVPN(vpn);
  } else {
    console.log('VPN 已连接');
  }

  console.log('开始执行 Git 命令...');
  await executeGitCommands(project, branch);
}

// 主接口
app.post('/git/push', async (req, res) => {
  const { vpn = 1, project = 'ql-new-cloud', branch = 'feature_v1.1.0' } = JSON.parse(req.query.params);
  pushCode(vpn, project, branch)
    .then(() => {
      res.status(200).json({ message: '操作成功' });
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

app.get('/git/push', async (req, res) => {
  const { vpn = 1, project = 'ql-new-cloud', branch = 'master' } = req.query;
  pushCode(vpn, project, branch)
    .then(() => {
      res.status(200).json({ message: '操作成功' });
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

// 启动服务
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
