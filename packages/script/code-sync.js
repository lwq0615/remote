import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { program } from 'commander';

// 定义选项：-m/--mode，描述为 "指定模式"，必填
program.option('-m, --message <value>', '提交消息');
// 解析参数
program.parse(process.argv);
const cmdOptions = program.opts();

const serverUrl = 'https://55c9160f.r9.cpolar.cn/api/code/sync'

let projectPath = process.cwd();
if (projectPath.endsWith('iass-web')) {
  projectPath = path.resolve(projectPath, '../');
}

console.log(projectPath);

/**
 * 获取指定文件夹下 Git 未 commit 的文件列表
 * @param {string} folderPath - 目标文件夹路径（绝对路径或相对路径）
 * @returns {Array<string>} 未 commit 的文件绝对路径列表
 */
function getUncommittedFiles(folderPath) {
  // 转换为绝对路径，避免命令执行目录问题
  const absoluteFolder = path.resolve(folderPath);

  try {
    // 执行 Git 命令：--porcelain 输出简洁格式，--untracked-files=all 显示所有未跟踪文件
    const gitOutput = execSync(
      'git status --porcelain --untracked-files=all',
      { cwd: absoluteFolder, encoding: 'utf8' } // cwd 指定命令执行目录（目标文件夹）
    );

    // 解析输出：按行分割，过滤空行，提取文件路径并转为绝对路径
    return gitOutput
      .split('\n')
      .filter((line) => line.trim() !== '') // 去除空行
      .map((line) => {
        // 每行格式："状态符  文件路径"（注意状态符后有1个或2个空格）
        const filePath = line.slice(3).trim(); // 截取状态符后的文件路径
        return filePath;
      });
  } catch (error) {
    // 处理异常（如目标文件夹不是 Git 仓库、Git 未安装等）
    console.error('获取未 commit 文件失败：', error.message);
    return [];
  }
}

const uncommittedFiles = getUncommittedFiles(projectPath);
console.log('需同步文件列表：', uncommittedFiles);

/**
 * 同步读取文件列表内容（阻塞式）
 * @param {string[]} uncommittedFiles - 文件路径列表
 * @param {BufferEncoding} [encoding='utf8'] - 文件编码
 * @returns {{file: string, code: string}[]} 格式化结果
 */
function readFilesToCodeArraySync(uncommittedFiles, encoding = 'utf8') {
  const result = [];

  for (const filePath of uncommittedFiles) {
    const absolutePath = path.join(projectPath, filePath);
    const code = fs.readFileSync(absolutePath, encoding);
    result.push({ file: filePath, code });
  }

  return result;
}

const codeList = readFilesToCodeArraySync(uncommittedFiles);
const params = {
  project: projectPath.split(/[\\/]/).pop(),
  codeList,
  message: cmdOptions.message || 'feat'
}

await fetch(serverUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(params),
})
  .then((response) => response.json())
  .then((data) => console.log('成功:', data))
  .catch((error) => console.error('错误:', error));
