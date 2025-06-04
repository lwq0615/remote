<template>
  <div class="terminal-container" ref="terminalContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit'; //终端自适应父元素大小插件
import 'xterm/css/xterm.css';

const terminalContainer = ref(null); // 终端容器 DOM 引用
let terminal = null; // xterm 实例
let websocket = null; // WebSocket 实例
const currentLine = ref('');

const strWidth = (str) => {
  if (!str) return 0;
  let strLen = 0;
  for (let i = 0; i < str.length; i++) {
    if (/^[\u4e00-\u9fa5]/.test(str[i])) {
      strLen = strLen + 2;
    } else {
      strLen++;
    }
  }
  return strLen;
};

function backspace() {
  if (currentLine.value.length > 0) {
    //如果已输入内容不为空，则可以执行删除操作
    const charWidth = strWidth(currentLine.value.slice(-1)); //计算占据终端的宽度
    const cursorX = terminal.buffer.active.cursorX; //获取光标在终端上的X坐标
    if (cursorX === 0) {
      //为零代表光标在行首，需要回到上一行再进行删除
      //回退到上一行的行尾
      terminal.write('\x1B\x5B\x41'); //光标回到上一行行首
      terminal.write('\x1B\x5B\x43'.repeat(terminal.cols)); //光标移动到行尾
      terminal.write(' '); //写入一个空格
      //如果字符宽度等于1，那么写入一个空格后光标位置（该行最末尾）将变为空，且光标仍保持在行尾，
      //无需更多操作。
      //如果字符宽度大于1，那么写入一个空格后还需要二次处理。
      if (charWidth > 1) {
        //首先计算已输入内容末尾字符在终端上的的X坐标
        let width = 1; //因为自定义了一个宽为1的输入提示符'>'，所以初始化为1
        for (let i = 0; i < currentLine.value.length; i++) {
          //逐字符计算
          width += strWidth(currentLine.value[i]);
          if (width === terminal.cols) {
            //刚好满一行就重置为0
            width = 0;
          } else if (width > terminal.cols) {
            //超过一行的宽度就重置为2（终端剩余宽度不足字符宽度时自动换行）
            width = 2;
          }
        }
        // 情况1：如果最终X坐标为0，说明原字符串刚好可以占满终端的整行
        //       填充一个空格后2宽的字符都变为空，光标需要再退一格
        if (width === 0) {
          terminal.write('\b');
        }
        // 情况2：否则最终X坐标为(终端宽度-1)，差一位才占满整行(原因是下一位字符宽度为2触发了自动换行)
        //       填充的空格没能覆盖到需要删除的字符，需要退格填充空格一次覆盖覆盖字符，再退格2次移动光标
        else {
          terminal.write('\b \b\b');
        }
      }
    } else {
      //光标不在行首，则直接写入字符宽度同等次数的'\b \b'，覆盖原字符即可
      terminal.write('\b \b'.repeat(charWidth));
    }
    //删去已输入内容的末尾一位
    currentLine.value = currentLine.value.slice(0, currentLine.value.length - 1);
  }
}

onMounted(() => {
  // 初始化终端
  terminal = new Terminal({
    cursorBlink: true, // 光标闪烁
  });
  //终端自适应父元素大小
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(terminalContainer.value);
  fitAddon.fit();

  // 初始化 WebSocket
  websocket = new WebSocket('ws://localhost:8899/terminal');

  // WebSocket 接收消息
  websocket.onmessage = (event) => {
    terminal.write(event.data); // 将后端输出写入终端
  };

  // 监听终端用户输入
  terminal.onData((data) => {
    switch (data) {
      case '\x7F': //backspace
        //如果什么已输入内容为空，则什么也不做
        backspace()
        break;
      case '\r':
      case '\n':
        //回车，发送
        if (currentLine.value.trim().length > 0) {
          websocket.send(currentLine.value); //发送
          let len = currentLine.value.length
          for (let i = 0; i < len; i++) {
            backspace();
          }
          currentLine.value = ''; // 清空输入缓存
        }
        break;
      default:
        //否则将数据添加到记录已输入内容的变量中，并显示在终端上
        currentLine.value += data;
        terminal.write(data);
    }
  });

  // 监听 WebSocket 关闭
  websocket.onclose = () => {
    terminal.write('\r\nConnection closed.');
  };
});

onUnmounted(() => {
  // 清理资源
  if (websocket) websocket.close();
  if (terminal) terminal.dispose();
});
</script>

<style>
.terminal-container {
  width: 100%;
  height: 100%;
  background-color: #000;
  font-family: monospace;
}
</style>
