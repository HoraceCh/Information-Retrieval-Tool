#!/usr/bin/env bash
# UTF-8 Encoding
echo "==================================================="
echo "  AI+信息素养大赛：检索式智慧生成与速查平台"
echo "  macOS & Linux 桌面一键快速部署安装神器"
echo "==================================================="
echo ""

# 检测 Node.js 环境
NODE_FOUND=0
if command -v node >/dev/null 2>&1; then
    NODE_FOUND=1
fi

if [ $NODE_FOUND -eq 0 ]; then
    echo "【系统提示】未能在您的 macOS / Linux 系统中探测到 Node.js 运行驱动。"
    echo "正在尝试帮您进行一键式快捷自动安装..."
    echo ""
    
    # 检查是否安装了 macOS 的 Homebrew 包管理器
    if command -v brew >/dev/null 2>&1; then
        echo "[*] 检测到您具有 Homebrew 系统工具，正在调取 brew 安装 Node.js 框架..."
        brew install node
    else
        echo "---------------------------------------------------------------"
        echo "[提示] 未检测到 Apple 系统的 Homebrew 包管理环境。"
        echo "现在已经为您在浏览器中打开 Node.js 官方专属 macOS 下载页面，"
        echo "请下载并安装 macOS Installer (.pkg) 文件，完成后重新打开此脚本即可！"
        echo "---------------------------------------------------------------"
        if command -v open >/dev/null 2>&1; then
            open "https://nodejs.org/en/download/"
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open "https://nodejs.org/en/download/"
        else
            echo "请访问以下网址下载安装 Node.js:"
            echo "https://nodejs.org/en/download/"
        fi
        exit 1
    fi
fi

# 再次检查 Node.js是否可用
if ! command -v node >/dev/null 2>&1; then
    echo "【错误】Node.js 安装过程已被中断或未生效，请手动安装后重试！"
    exit 1
fi

echo "[OK] 系统已经就绪，Node.js 运行版本为: $(node -v)"

# 配置环境变量文件
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "[*] 正在帮您复制生成本地运行所需的 .env 环境参数文件..."
        cp .env.example .env
    fi
fi

# 优化依赖安装，加入淘宝镜像（npmmirror）国内极速下载支持
echo "[*] 正在拉取和补全平台依赖代码包 (npm install)..."
echo "[*] 尝试从备用高速镜像源进行依赖补全，防卡死、防网络波动..."

if npm install --registry=https://registry.npmmirror.com --no-audit --no-fund; then
    echo "[OK] 依赖成功补全！"
else
    echo "[WARN] 独立镜像源出错，尝试使用默认官方源进行安装..."
    npm install --no-audit --no-fund
fi

echo ""
echo "[OK] 本地所有应用程序与算法配置装载完毕！"
echo "[*] 正在唤醒系统默认浏览器，并在本地独立端口打开网页 (Port: 3000)..."

if command -v open >/dev/null 2>&1; then
    open http://localhost:3000
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:3000
else
    echo "请在您的浏览器中访问: http://localhost:3000"
fi

npm run dev
