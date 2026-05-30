#!/bin/bash
# UTF-8 Encoding
echo "==================================================="
echo "  AI+信息素养大赛：检索式智慧生成与速查平台"
echo "  macOS & Linux 桌面一键快速部署安装神器"
echo "==================================================="
echo ""

# 检测 Node.js 环境
NODE_FOUND=0
if command -v node &> /dev/null; then
    NODE_FOUND=1
fi

if [ $NODE_FOUND -eq 0 ]; then
    echo "【系统提示】未能在您的 macOS / Linux 系统中探测到 Node.js 运行驱动。"
    echo "正在尝试帮您进行一键式快捷自动安装..."
    echo ""
    
    # 检查是否安装了 macOS 的 Homebrew 包管理器
    if command -v brew &> /dev/null; then
        echo "[*] 检测到您具有 Homebrew 系统工具，正在调取 brew 安装 Node.js 框架..."
        brew install node
    else
        echo "---------------------------------------------------------------"
        echo "[提示] 未检测到 Apple 系统的 Homebrew 包管理环境。"
        echo "现在已经为您在浏览器中打开 Node.js 官方专属 macOS 下载页面，"
        echo "请下载并安装 macOS Installer (.pkg) 文件，完成后重新打开此脚本即可！"
        echo "---------------------------------------------------------------"
        open "https://nodejs.org/en/download/" || xdg-open "https://nodejs.org/en/download/"
        exit 1
    fi
fi

echo "[OK] 系统已经就绪，Node.js 运行版本为: $(node -v)"

# 配置环境变量文件
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "[*] 正在帮您复制生成本地运行所需的 .env 环境参数文件..."
        cp .env.example .env
    fi
fi

echo "[*] 正在拉取和补全平台依赖代码包 (npm install)..."
npm install

echo ""
echo "[OK] 本地所有应用程序与算法配置装载完毕！"
echo "[*] 正在唤醒系统默认浏览器，并在本地独立端口打开精美页面 (Port: 3000)..."
open http://localhost:3000 || xdg-open http://localhost:3000

npm run dev
