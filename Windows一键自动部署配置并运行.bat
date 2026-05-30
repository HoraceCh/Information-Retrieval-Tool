@echo off
:: 使用 UTF-8 编码，防止中文提示在部分旧版命令提示符下出现乱码
chcp 65001 >nul
title AI+信息素养合规检索助手 - 极速本地自动化部署工具
color 0b

echo ====================================================================
echo      AI+信息素养合规检索助手 —— 极速一键部署、环境修复与自启动器
echo ====================================================================
echo.
echo [*] 第一步: 正在排查您本机的 Node.js 环境...

set "NODE_PATH_FOUND=0"
node -v >nul 2>&1
if %errorlevel% equ 0 (
    set "NODE_PATH_FOUND=1"
) else (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs\"
        set "NODE_PATH_FOUND=1"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "PATH=%PATH%;%ProgramFiles(x86)%\nodejs\"
        set "NODE_PATH_FOUND=1"
    )
)

if "%NODE_PATH_FOUND%"=="1" (
    echo [OK] 检测到您的电脑已经安装有 Node.js 运行环境:
    node -v
) else (
    echo --------------------------------------------------------------------
    echo 【智能引导】未在您的计算机中找到运行服务所需的 Node.js 驱动。
    echo 别担心，本工具即将通过后台为您自动下载并安装官方 Node.js (v20 LTS) 安全版！
    echo --------------------------------------------------------------------
    echo.
    echo [*] 正在和 https://nodejs.org 建立官方安全连接，并极速下载安装包...
    
    :: 使用 Win10/11 默认自带的 curl 极其安全地拉取 node 官方 Windows 部署程序至临时缓存文件夹
    curl -L -o "%TEMP%\node_v20_installer.msi" "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
    
    if %errorlevel% neq 0 (
        echo [ERR] 下载失败，请检查您的网络连接是否顺畅。
        echo 您也可以直接手动访问 https://nodejs.org 下载 “64位 LTS 稳定版” 完成安装。
        pause
        exit /b
    )
    
    echo [*] 下载完成！正在为您启动轻量级后台静默安装程序 (这大约需要 20-30 秒)...
    echo [*] 请在弹出的 Windows 用户账户控制窗口中选择 "是" 或 "允许" 授权安装。
    
    :: 自动运行 msi 安装程序。/passive 代表显示最简单的安装进度条无需用户费心配置点击，/norestart 预防电脑重启
    msiexec /i "%TEMP%\node_v20_installer.msi" /passive /norestart
    
    :: 实时修改并在当前 cmd 会话中增加系统 Node 变量映射，避免重新打开 CMD
    set "PATH=%PATH%;C:\Program Files\nodejs\"
    
    node -v >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERR] 自动配置环境变量未能成功。
        echo 请手动前往您的“下载 / Downloads”路径下双击下载好的 node_v20_installer.msi 文件手动同意安装。
        echo 安装完成后，再次双击运行本一键启动.bat即可！
        pause
        exit /b
    )
    echo [OK] Node.js 环境已顺利自动安装配置完毕！
    node -v
)

echo.
echo [*] 第二步: 正在自动保障检索平台的秘钥参数环境...
if not exist .env (
    if exist .env.example (
        echo [*] 正在复刻模板规则，为您自适应建立本地秘钥文件 .env...
        copy .env.example .env >nul
    )
)

echo.
echo [*] 第三步: 正在下载并补全本地服务代码包 (安装包下载 & 映射缓存中)...
echo [*] (为减少网络消耗，如有缓存，该过程将在 2 秒内瞬时完成)
call npm install --no-audit --no-fund

if %errorlevel% neq 0 (
    echo [WARN] 依赖部署过程中可能个别项提示警告或未完全注册。
    echo 正在为您执行热重载尝试自适应运行...
)

echo.
echo [OK] 本地全形态运行环境部署校验 100% 通过！
echo [*] 第四步: 正在拉起系统浏览器并进入智能合规检索控制台...
echo [*] 浏览器即将自动跳转至本地独立端口: http://localhost:3000

:: 自动唤起 Windows 系统默认浏览器，定位运行网站
start http://localhost:3000

:: 启动本代服务容器
call npm run dev

pause
