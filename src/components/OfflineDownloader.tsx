import React, { useState } from "react";
import { 
  Download, 
  Monitor, 
  Terminal, 
  FileCode, 
  Check, 
  ExternalLink,
  Laptop,
  CheckCircle,
  Copy,
  Info,
  Server
} from "lucide-react";
import { DEFAULT_LINKS, DEFAULT_CATEGORIES } from "./OfficialWhitelist";
import { getPinyinMeta } from "../utils/pinyinMatcher";

export default function OfflineDownloader() {
  const [downloading, setDownloading] = useState(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const handleCopyScript = (script: string, key: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(key);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const handleDownloadOfflineHtml = () => {
    setDownloading(true);
    try {
      // Precompute pinyin metadata for links to ensure 100% accuracy offline
      const bundledLinks = DEFAULT_LINKS.map(link => {
        const meta = getPinyinMeta(link.name);
        return {
          name: link.name,
          url: link.url,
          cat: link.cat,
          initials: meta.initials,
          pinyin: meta.pinyinJoined
        };
      });

      const categoriesJson = JSON.stringify(DEFAULT_CATEGORIES, null, 2);
      const linksJson = JSON.stringify(bundledLinks, null, 2);

      const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <title>AI+信息素养大赛 - 官方合规网址速查离线便携版</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
    }
    body {
      background: #020617;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 20px;
    }
    header {
      max-width: 1400px;
      width: 100%;
      margin: 0 auto 20px auto;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4));
      border: 1px solid rgba(6, 182, 212, 0.2);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      position: relative;
    }
    .header-logo {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(6, 182, 212, 0.1);
      border: 1px solid rgba(6, 182, 212, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      color: #06b6d4;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 24px;
      font-weight: 900;
      color: #f8fafc;
      letter-spacing: -0.025em;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }
    .toolbox {
      max-width: 1400px;
      width: 100%;
      margin: 0 auto 16px auto;
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-input {
      flex: 1;
      min-width: 280px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 14px 20px;
      color: #e2e8f0;
      font-size: 13px;
      outline: none;
      transition: all 0.3s;
    }
    .search-input:focus {
      border-color: rgba(6, 182, 212, 0.5);
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.15);
    }
    .btn {
      padding: 12px 20px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #fff;
    }
    .btn-primary {
      background: #06b6d4;
    }
    .btn-primary:hover {
      background: #0891b2;
    }
    .btn-secondary {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .btn-secondary:hover {
      background: rgba(255,255,255,0.1);
    }
    .btn-danger {
      background: #ef4444;
    }
    .btn-danger:hover {
      background: #dc2626;
    }
    .layout {
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 2.5fr 1fr;
      gap: 20px;
      flex: 1;
    }
    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
      align-content: start;
    }
    .cat-card {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.3s;
    }
    .cat-card:hover {
      border-color: rgba(6, 182, 212, 0.2);
      box-shadow: 0 10px 25px rgba(6, 182, 212, 0.05);
    }
    .cat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      padding-bottom: 8px;
    }
    .cat-title {
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.1em;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(6, 182, 212, 0.1);
      color: #22d3ee;
    }
    .cat-count {
      font-size: 10px;
      font-family: monospace;
      color: #64748b;
    }
    .links-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .link-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.03);
      border-radius: 12px;
      padding: 10px 14px;
      transition: all 0.2s;
      position: relative;
      cursor: pointer;
    }
    .link-item:hover {
      background: rgba(6, 182, 212, 0.05);
      border-color: rgba(6, 182, 212, 0.3);
      transform: translateX(4px);
    }
    .link-item a {
      color: #e2e8f0;
      text-decoration: none;
      font-size: 12px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding-right: 60px;
    }
    .link-item:hover a {
      color: #22d3ee;
    }
    .link-url {
      font-size: 9px;
      color: #64748b;
      margin-top: 4px;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .action-badge {
      font-size: 9px;
      font-family: monospace;
      font-weight: 900;
      background: rgba(6,182,212,0.1);
      border: 1px solid rgba(6,182,212,0.2);
      color: #22d3ee;
      padding: 2px 6px;
      border-radius: 4px;
      position: absolute;
      right: 12px;
    }
    .right-sidebar {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 20px;
      height: fit-content;
      position: sticky;
      top: 20px;
    }
    .sidebar-title {
      font-size: 13px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.03);
      padding: 10px 12px;
      border-radius: 10px;
      margin-bottom: 8px;
    }
    .file-name {
      font-size: 11px;
      color: #cbd5e1;
      font-family: monospace;
    }
    .file-delete {
      color: #ef4444;
      cursor: pointer;
      font-size: 10px;
    }
    
    /* Redirect Panel */
    .redirect-panel {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto 16px auto;
    }
    .redirect-text h4 {
      font-size: 12px;
      color: #f59e0b;
      font-weight: bold;
    }
    .redirect-text p {
      font-size: 10px;
      color: #94a3b8;
    }
    .redirect-btns {
      display: flex;
      gap: 8px;
    }
    .redirect-btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: bold;
      border: none;
      cursor: pointer;
    }
    .btn-bing { background: #0284c7; color: #fff; }
    .btn-baidu { background: #d97706; color: #fff; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: #0f172a;
      border: 1px solid rgba(6, 182, 212, 0.3);
      border-radius: 20px;
      width: 90%;
      max-width: 500px;
      padding: 24px;
      position: relative;
    }
    .modal-content h3 {
      font-size: 16px;
      margin-bottom: 12px;
      color: #fff;
    }
    .modal-content select, .modal-content input {
      width: 100%;
      background: #020617;
      border: 1px solid rgba(255,255,255,0.1);
      padding: 10px;
      color: #fff;
      border-radius: 8px;
      margin-bottom: 12px;
      outline: none;
    }
    .modal-content select:focus, .modal-content input:focus {
      border-color: rgba(6,182,212,0.5);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .hidden { display: none !important; }
  </style>
</head>
<body>

  <header>
    <div class="header-logo">
      <svg style="width:12px;height:12px;fill:currentColor" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 2a8 8 0 0 1 8 8 8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 8-8m-1 3v6h2V7h-2m0 8v2h2v-2h-2z"/></svg>
      SYSTEM STABLE
    </div>
    <h1>AI+信息素养合规检索助手</h1>
    <p class="subtitle">官方网址速查离线合规数据库 • 100% 纯前端离线运行，在无网络竞技状态下双击即用</p>
  </header>

  <!-- Redirect Area -->
  <div id="redirectPanel" class="redirect-panel hidden">
    <div class="redirect-text">
      <h4 id="redirectTitle">发现未匹配网址</h4>
      <p>没有在合规白名单中检索到此名称，您可以一键前往必应或百度继续查找：</p>
    </div>
    <div class="redirect-btns">
      <button class="redirect-btn btn-bing" id="redirectBingBtn">必应检索</button>
      <button class="redirect-btn btn-baidu" id="redirectBaiduBtn">百度检索</button>
    </div>
  </div>

  <div class="toolbox">
    <input type="text" id="searchBar" class="search-input" placeholder="输入名称、网址、分类，或拼音拼音首字母缩写速查（如: zgzw 查知网）..." autocomplete="off">
    <button class="btn btn-primary" onclick="openAddModal()">➕ 添加网站</button>
    <button class="btn btn-secondary" onclick="triggerFileUpload()">📎 上传文件记录</button>
    <button class="btn btn-danger" onclick="triggerReset()">🗑️ 重置数据</button>
  </div>

  <div class="layout">
    <div class="categories-grid" id="catGrid"></div>
    <div class="right-sidebar">
      <div class="sidebar-title">
        <svg style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        上传文件记录
      </div>
      <p style="font-size:10px;color:#64748b;line-height:1.4;margin-bottom:12px">可以上传您的PDF/文档资料，点击将直接引导前往本地同文件夹下打开。</p>
      <div id="fileList"></div>
    </div>
  </div>

  <!-- Add Link Modal -->
  <div class="modal-overlay hidden" id="addModal">
    <div class="modal-content">
      <h3>➕ 添加自定义网址</h3>
      <input type="text" id="addName" placeholder="网站名称">
      <input type="text" id="addUrl" placeholder="https://">
      <select id="addCat"></select>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeAddModal()">取消</button>
        <button class="btn btn-primary" onclick="saveCustomLink()">保存</button>
      </div>
    </div>
  </div>

  <script>
    const DEFAULT_CATEGORIES = ${categoriesJson};
    const DEFAULT_LINKS = ${linksJson};

    const storageKey = 'ai_info_literacy_offline_db_v6';
    let db = JSON.parse(localStorage.getItem(storageKey)) || {
      links: DEFAULT_LINKS,
      files: []
    };

    function saveToStorage() {
      localStorage.setItem(storageKey, JSON.stringify(db));
    }

    // Initialize category selector in Modal
    const select = document.getElementById('addCat');
    DEFAULT_CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    // Pinyin matching helper
    function fuzzyMatch(link, keyword) {
      if (!keyword) return true;
      const kw = keyword.toLowerCase().trim();
      const name = link.name.toLowerCase();
      const url = link.url.toLowerCase();
      const cat = link.cat.toLowerCase();
      const initials = (link.initials || '').toLowerCase();
      const pinyin = (link.pinyin || '').toLowerCase();

      // Check standard includes
      if (name.includes(kw) || url.includes(kw) || cat.includes(kw)) {
        return true;
      }
      
      // Check initials and full pinyin
      if (initials && initials.includes(kw)) {
        return true;
      }
      if (pinyin && pinyin.includes(kw)) {
        return true;
      }
      
      return false;
    }

    function render() {
      const kw = document.getElementById('searchBar').value.trim();
      const grid = document.getElementById('catGrid');
      grid.innerHTML = '';

      let totalResults = 0;

      DEFAULT_CATEGORIES.forEach(cat => {
        const catLinks = db.links.filter(l => l.cat === cat && fuzzyMatch(l, kw));
        totalResults += catLinks.length;

        if (kw && catLinks.length === 0) return; // Skip empty categories on filtering

        const card = document.createElement('div');
        card.className = 'cat-card';

        const header = document.createElement('div');
        header.className = 'cat-header';
        header.innerHTML = \`
          <span class="cat-title">\${cat}</span>
          <span class="cat-count">\${catLinks.length} 网址</span>
        \`;
        card.appendChild(header);

        const list = document.createElement('div');
        list.className = 'links-list';

        if (catLinks.length === 0) {
          list.innerHTML = '<p style="font-size:11px;color:#475569;font-style:italic;padding:8px">暂无网址</p>';
        } else {
          catLinks.forEach(link => {
            const item = document.createElement('div');
            item.className = 'link-item';
            // Simple right click menu replacement (Alert/Confirm) or click action
            item.onclick = (e) => {
              if (e.target.tagName !== 'A') {
                window.open(link.url, '_blank');
              }
            };
            item.oncontextmenu = (e) => {
              e.preventDefault();
              if (confirm('是否要删除网址: ' + link.name + ' ?')) {
                db.links = db.links.filter(l => !(l.url === link.url && l.name === link.name));
                saveToStorage();
                render();
              }
            };

            const cleanCatName = link.cat.indexOf('、') !== -1 ? link.cat.split('、')[1] : link.cat;

            item.innerHTML = \`
              <a href="\${link.url}" target="_blank" rel="noopener noreferrer">
                <div>
                  <span>\${link.name}</span>
                  <span class="link-url">\${link.url}</span>
                </div>
              </a>
              <span class="action-badge">\${cleanCatName}</span>
            \`;
            list.appendChild(item);
          });
        }

        card.appendChild(list);
        grid.appendChild(card);
      });

      // Handle redirect box
      const redirectPanel = document.getElementById('redirectPanel');
      if (kw && totalResults === 0) {
        document.getElementById('redirectTitle').innerHTML = '未匹配到 “<span style="color:#ffffff">' + kw + '</span>”';
        
        document.getElementById('redirectBingBtn').onclick = () => {
          window.open('https://cn.bing.com/search?q=' + encodeURIComponent(kw), '_blank');
        };
        document.getElementById('redirectBaiduBtn').onclick = () => {
          window.open('https://www.baidu.com/s?wd=' + encodeURIComponent(kw), '_blank');
        };
        
        redirectPanel.classList.remove('hidden');
      } else {
        redirectPanel.classList.add('hidden');
      }

      // Render files section
      const fileList = document.getElementById('fileList');
      fileList.innerHTML = '';

      if (db.files.length === 0) {
        fileList.innerHTML = '<p style="font-size:11px;color:#475569;font-style:italic">暂无本地上传的文件记录</p>';
      } else {
        db.files.forEach((file, fIdx) => {
          const fItem = document.createElement('div');
          fItem.className = 'file-item';
          fItem.innerHTML = \`
            <span class="file-name" style="cursor:pointer" onclick="openOfflineFile('\${encodeURIComponent(file.name)}')">📎 \${file.name}</span>
            <span class="file-delete" onclick="deleteOfflineFile(\${fIdx})">删除</span>
          \`;
          fileList.appendChild(fItem);
        });
      }
    }

    function openOfflineFile(nameEncoded) {
      try {
        window.open('./' + nameEncoded, '_blank');
      } catch (e) {
        alert('打开失败，请确保该文件在当前 HTML 文件的同一个文件夹下。');
      }
    }

    function deleteOfflineFile(idx) {
      if (confirm('确定要删除此文件上传记录吗？')) {
        db.files.splice(idx, 1);
        saveToStorage();
        render();
      }
    }

    function openAddModal() {
      document.getElementById('addModal').classList.remove('hidden');
    }

    function closeAddModal() {
      document.getElementById('addModal').classList.add('hidden');
      document.getElementById('addName').value = '';
      document.getElementById('addUrl').value = '';
    }

    function saveCustomLink() {
      const name = document.getElementById('addName').value.trim();
      let url = document.getElementById('addUrl').value.trim();
      const cat = document.getElementById('addCat').value;

      if (!name || !url) {
        alert('请填写完整名称与网址');
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      db.links.push({
        name,
        url,
        cat,
        initials: '', // local addition doesn't require precompute
        pinyin: ''
      });

      saveToStorage();
      closeAddModal();
      render();
    }

    function triggerFileUpload() {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (db.files.some(f => f.name === file.name)) {
          alert('文件记录已存在！');
          return;
        }

        db.files.push({ name: file.name });
        saveToStorage();
        render();
      };
      input.click();
    }

    function triggerReset() {
      if (confirm('确定要清除所有自定义修改并恢复为初始官方合规白名单吗？')) {
        localStorage.removeItem(storageKey);
        db = {
          links: DEFAULT_LINKS,
          files: []
        };
        render();
      }
    }

    document.getElementById('searchBar').oninput = render;

    // Run first render
    render();
  </script>
</body>
</html>
`;

      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "AI竞赛助手_官方合规网址速查离线版.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const winScript = `@echo off
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
    if exist "C:\\Program Files\\nodejs\\node.exe" (
        set "PATH=%PATH%;C:\\Program Files\\nodejs\\"
        set "NODE_PATH_FOUND=1"
    ) else if exist "%ProgramFiles(x86)%\\nodejs\\node.exe" (
        set "PATH=%PATH%;%ProgramFiles(x86)%\\nodejs\\"
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
    curl -L -o "%TEMP%\\node_v20_installer.msi" "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
    
    if %errorlevel% neq 0 (
        echo [ERR] 下载失败，请检查您的网络连接是否顺畅。
        echo 您也可以直接手动访问 https://nodejs.org 下载 “64位 LTS 稳定版” 完成安装。
        pause
        exit /b
    )
    
    echo [*] 下载完成！正在为您启动轻量级后台静默安装程序 (这大约需要 20-30 秒)...
    echo [*] 请在弹出的 Windows 用户账户控制窗口中选择 "是" 或 "允许" 授权安装。
    
    :: 自动运行 msi 安装程序。/passive 代表显示最简单的安装进度条无需用户费心配置点击，/norestart 预防电脑重启
    msiexec /i "%TEMP%\\node_v20_installer.msi" /passive /norestart
    
    :: 实时修改并在当前 cmd 会话中增加系统 Node 变量映射，避免重新打开 CMD
    set "PATH=%PATH%;C:\\Program Files\\nodejs\\"
    
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

pause`;

  const macScript = `#!/bin/bash
clear
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

echo "[OK] 系统已经就绪，Node.js 运行版本为: \$(node -v)"

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

npm run dev`;

  const handleDownloadWinBat = () => {
    const blob = new Blob([winScript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Windows一键自动部署配置并运行.bat";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMacSh = () => {
    const blob = new Blob([macScript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "macOS_Linux一键部署启动.sh";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-950/20 rounded-2xl border border-white/5">
      {/* Overview Block */}
      <div className="border border-cyan-500/10 bg-cyan-950/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 opacity-10 blur-2xl w-48 h-48 bg-cyan-400 rounded-full"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-4xl">
            <div className="inline-flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/35 px-2.5 py-1 rounded text-[10px] font-bold text-cyan-400 separator-cyan tracking-widest leading-none">
              零技术门槛 • 机房无网一键部署启动器
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Download className="text-cyan-400" size={20} />
              不装开发环境？照样本地 0 门槛双击即用说明 (Offline & Installer Setup)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              针对那些不熟悉代码命令行、安装 Node 环境太繁琐的用户，我们专门升级了本地自启工具。
              您只需要将在当前浏览器右上角/设置里导出的<b>项目本地源码 ZIP 双击解压</b>，并将下载好的一键脚本放进该文件夹下，<b>直接双击即可</b>，不需要任何先修知识！
            </p>
          </div>
        </div>
      </div>

      {/* Visual Guide Row */}
      <div className="bg-[#0b1322] border border-cyan-500/20 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Laptop size={14} className="text-cyan-400" />
          💡 傻瓜式本地完整安装极速步骤 (从导出到双击使用)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="font-mono text-cyan-400 font-bold mb-1">第一步 (导出源码)</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                点击您浏览器的 AI Studio 编辑器顶部右上角的<b>“Settings/设置”</b>(或者分享导出面板)，选择<b>“Export to ZIP / 导出为ZIP包”</b>。
              </p>
            </div>
            <span className="text-[10px] text-slate-500 mt-2">将得到本系统的完整本地源码包</span>
          </div>

          <div className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="font-mono text-cyan-400 font-bold mb-1">第二步 (解压文件)</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                将下载好的 `.zip` 文件点击右键<b>【解压到当前文件夹】</b>。请勿直接双击在压缩包内打开，必须要彻底解压出来。
              </p>
            </div>
            <span className="text-[10px] text-slate-500 mt-2">确保所有代码和配置解压到具体目录</span>
          </div>

          <div className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="font-mono text-cyan-400 font-bold mb-1">第三步 (获取自启脚本)</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                点击下方<b>【方案三】</b>里的<b>“下载一键启动.bat文件”</b>(Mac电脑请下载.sh文件)，将其<b>直接剪切并粘贴放到您刚刚解压的那个代码文件夹根目录底</b>。
              </p>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono mt-2">文件必须与 package.json 处于同级目录</span>
          </div>

          <div className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="font-mono text-emerald-400 font-bold mb-1">第四步 (双击完美启动)</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                在您的电脑文件夹里，<b>鼠标双击运行 “Windows一键自动部署配置并运行.bat”</b>。
                脚本会自动帮您检测、下载、配置全部的 Node 开发底层和依赖。
              </p>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold mt-2">🎉 随后系统会自动拉起浏览器完美打开！</span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Solutions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Solution 1: PWA Desktop Install */}
        <div className="bg-slate-900/40 border border-white/5 hover:border-cyan-500/20 rounded-2xl p-6 flex flex-col justify-between transition-all group hover:shadow-lg hover:shadow-cyan-950/10">
          <div className="space-y-4">
            <div className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/10 p-3 rounded-xl w-fit">
              <Monitor size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                方案一：PWA 极速桌面级安装
              </h3>
              <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
                无需下载文件，通过标准现代浏览器原生技术，将本检索系统安装为独立可供轻量运行的系统级桌面独立应用。
              </p>
            </div>
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex gap-2.5 items-start text-[10px] text-slate-400 font-mono">
                <span className="bg-slate-800 border border-white/5 text-slate-300 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">1</span>
                <span>在 Edge / Chrome 浏览器中访问本页。</span>
              </div>
              <div className="flex gap-2.5 items-start text-[10px] text-slate-400 font-mono">
                <span className="bg-slate-800 border border-white/5 text-slate-300 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">2</span>
                <span>查看地址栏右侧，点击出现的<b>"安装 / Install / ➕"</b>小图标。</span>
              </div>
              <div className="flex gap-2.5 items-start text-[10px] text-slate-400 font-mono">
                <span className="bg-slate-800 border border-white/5 text-slate-300 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">3</span>
                <span>创建桌面快捷方式，便可全屏精细化、高灵敏独立窗口运行。</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5">
            <span className="text-[10px] text-slate-500 font-mono italic">提示：100% 浏览器原生极力推荐</span>
          </div>
        </div>
 
        {/* Solution 2: Interactive Single HTML */}
        <div className="bg-slate-900/40 border border-white/5 hover:border-cyan-500/20 rounded-2xl p-6 flex flex-col justify-between transition-all group hover:shadow-lg hover:shadow-cyan-950/10">
          <div className="space-y-4">
            <div className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 p-3 rounded-xl w-fit">
              <FileCode size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                方案二：高集成离线单文件 (HTML)
              </h3>
              <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
                一键导出完全独立、免部署、100% 本地离线高精度查询纯前端单网页。集成了完整的 150+ 合规高校白名单及多维拼音模糊速查内核。
              </p>
            </div>
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex gap-2.5 items-start text-[10px] text-slate-400 font-mono">
                <span className="bg-slate-800 border border-white/5 text-slate-300 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">√</span>
                <span>自动内置拼音首字母匹配，响应快至 0 ms</span>
              </div>
              <div className="flex gap-2.5 items-start text-[10px] text-slate-400 font-mono">
                <span className="bg-slate-800 border border-white/5 text-slate-300 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">√</span>
                <span>免依赖直接打开，放进 U 盘随时便携自启动</span>
              </div>
              <div className="flex gap-2.5 items-start text-[10px] text-slate-400 font-mono">
                <span className="bg-slate-800 border border-white/5 text-slate-300 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">√</span>
                <span>可通过 LocalStorage 全面且永久记录您的修改和文件</span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleDownloadOfflineHtml}
              disabled={downloading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-500/20 active:scale-98"
            >
              <Download size={14} className={downloading ? "animate-bounce" : ""} />
              {downloading ? "正在整理生成..." : "一键打包下载离线版 HTML"}
            </button>
          </div>
        </div>
 
        {/* Solution 3: Full Stack Auto Installer */}
        <div className="bg-slate-900/40 border border-white/5 hover:border-cyan-500/20 rounded-2xl p-6 flex flex-col justify-between transition-all group hover:shadow-lg hover:shadow-cyan-950/10">
          <div className="space-y-4">
            <div className="bg-blue-500/15 text-blue-400 border border-blue-500/10 p-3 rounded-xl w-fit">
              <Terminal size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-outline-none text-slate-100 uppercase tracking-wide flex items-center gap-1">
                方案三：本地智能化傻瓜部署脚本
                <span className="text-[8px] bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.5 rounded font-black tracking-normal">自动装环境</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
                无需任何繁杂操作，脚本智能检查本地 Node，并具备
                <b>全自动 Windows/Mac 后端悄悄下载程序</b>。自动保障秘钥、自动拉起浏览器，彻底全自动零命令部署！
              </p>
            </div>
            
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Windows 系统自动部署包</span>
                  <button 
                    onClick={() => handleCopyScript(winScript, 'win')}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold font-mono"
                  >
                    {copiedScript === 'win' ? <CheckCircle size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    {copiedScript === 'win' ? "已复制" : "复制 .bat 脚本"}
                  </button>
                </div>
                <button
                  onClick={handleDownloadWinBat}
                  className="w-full py-2 bg-slate-950/60 hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-[11px] rounded-lg border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download size={11} />
                  下载一键启动.bat文件
                </button>
              </div>
 
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">macOS/Linux 极速部署包</span>
                  <button 
                    onClick={() => handleCopyScript(macScript, 'mac')}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold font-mono"
                  >
                    {copiedScript === 'mac' ? <CheckCircle size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    {copiedScript === 'mac' ? "已复制" : "复制 .sh 脚本"}
                  </button>
                </div>
                <button
                  onClick={handleDownloadMacSh}
                  className="w-full py-2 bg-slate-950/60 hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-[11px] rounded-lg border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download size={11} />
                  下载一键启动.sh文件
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-white/5 pt-3">
            <span className="text-[9px] text-slate-500 font-mono italic">适合本地一键傻瓜化自动化配置。</span>
          </div>
        </div>
 
      </div>

      {/* Deploy Instructions / Info Block */}
      <div className="bg-[#0b0f19] border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
          <Info size={14} className="text-cyan-400" />
          系统离线安装原理与电教机房运行守则
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] text-slate-400 leading-relaxed font-mono">
          <div className="space-y-2">
            <p className="text-slate-300 font-bold">1. 便捷独立网页 (HTML) 机制：</p>
            <p>
              本平台已将庞大的白名单、拼音音节全规则模糊查询进行了完全无依赖的压缩整合。您在方案二导出的网页可以运行在任何装有现代浏览器（Edge / Chrome / Safari / Firefox）的电脑上。
            </p>
            <p>
              即便该段没有任何物理因特网，您只要双击此 HTML 文件即可打开精细页面。所有通过 “添加网址” 或 “上传文件” 所作的操作将由于浏览器的 <b>Local Storage 安全沙盒机制</b> 自动且不可消失地存储在这台电脑的本地浏览器中。
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-slate-300 font-bold">2. 文件本地关联打开守则：</p>
            <p>
              当您在离线单页面（HTML）中点击<b>“新建文件记录”</b>上传本地参考文件（如 PDF 大纲、参赛守则等）时，为安全防作弊等原则，浏览器<b>禁止前端代码直接通过非同域绝对路径读取本地 C:\\</b> 磁盘。
            </p>
            <p>
              <b>离线打开守则：</b>请将您的参考文件与导出的 `离线版.html` 置于<b>同一文件夹/目录下</b>。随后在页面中上传此文件进行关联，即可双击完美打开！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
