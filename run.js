import { spawn } from "child_process";

const services = [
  {
    name: "client",
    command: "pnpm",
    args: ["dev"],
  },
  {
    name: "server",
    command: "pnpm",
    args: ["dev"],
  },
];

const childProcesses = [];

services.forEach((service) => {
  try {
    // 根据操作系统选择适当的 shell
    const shell = process.platform === "win32";
    
    const child = spawn(service.command, service.args, {
      cwd: `packages/${service.name}`,
      shell,
      stdio: ["inherit", "pipe", "pipe"], // 自定义标准输出和错误输出
    });
    
    childProcesses.push(child);

    // 正确处理标准输出和错误输出的编码
    child.stdout?.on("data", (data) => {
      console.log(`[${service.name}] ${data.toString("utf8")}`);
    });

    child.stderr?.on("data", (data) => {
      console.error(`[${service.name}] ${data.toString("utf8")}`);
    });

    child.on("close", (code) => {
      console.log(`[${service.name}] 进程已退出，退出码 ${code}`);
    });
  } catch (error) {
    console.error(`服务 ${service.name} 启动失败`);
    console.error(error);
  }
});

// 在收到第一次 SIGINT 信号(通常对应于 Ctrl+C)时，优雅地关闭所有子进程
let isFirstSIGINT = true;
process.on("SIGINT", () => {
  if (isFirstSIGINT) {
    isFirstSIGINT = false;
    console.log("正在关闭所有服务...");
    
    childProcesses.forEach((child) => {
      child.kill("SIGINT");
    });
    
    Promise.all(
      childProcesses.map(
        (child) => new Promise((resolve) => child.on("exit", resolve))
      )
    ).then(() => {
      console.log("所有子进程已终止，主进程退出。");
      process.exit();
    });
  }
});