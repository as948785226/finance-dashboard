# 🚀 尬酒馆财务看板 - 云端部署指南

## 方案一：部署到 Railway（推荐，最简单）

### 第一步：上传代码到 GitHub

1. 登录 GitHub (github.com)
2. 点击右上角 **+** → **New repository**
3. 仓库名称：`finance-dashboard`
4. 选择 **Private**（私有仓库）
5. 点击 **Create repository**

6. 在本地执行以下命令（需要先安装 Git）：
```bash
cd /workspace/projects/workspace/finance-dashboard
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/finance-dashboard.git
git push -u origin main
```

### 第二步：部署到 Railway

1. 访问 [railway.app](https://railway.app)
2. 用 GitHub 账号登录
3. 点击 **New Project** → **Deploy from GitHub repo**
4. 选择 `finance-dashboard` 仓库
5. Railway 会自动检测 Node.js 项目并部署

### 第三步：配置环境变量

1. 在 Railway 项目中找到 **Settings** → **Variables**
2. 添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `PORT` | `3000` |
| `FEISHU_BOT_TOKEN` | `你的飞书Bot Token` |
| `BITABLE_TOKEN` | `EprMb1HjqafiQ0sNVAlc7UJ7nrb` |

3. 点击 **Deploy** 重新部署

### 第四步：获取永久链接

部署完成后，Railway 会提供一个 `*.railway.app` 链接，这就是你的永久访问地址！

---

## 方案二：使用 Render（稳定可靠）

### 第一步：同样上传代码到 GitHub

### 第二步：部署到 Render

1. 访问 [render.com](https://render.com)
2. 用 GitHub 账号登录
3. 点击 **New** → **Web Service**
4. 连接你的 GitHub 仓库
5. 设置以下配置：
   - **Name**: `finance-dashboard`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

6. 在 **Environment** 中添加环境变量：
   - `FEISHU_BOT_TOKEN`
   - `BITABLE_TOKEN`

7. 点击 **Create Web Service**

### 第三步：获取永久链接

Render 会提供 `*.onrender.com` 链接。

---

## 获取飞书 Bot Token

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 获取 **App ID** 和 **App Secret**
4. 调用获取 token 接口：
```bash
curl -X POST "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json" \
  -d '{"app_id":"cli_xxxxx","app_secret":"xxxxx"}'
```
5. 复制返回的 `tenant_access_token` 作为 `FEISHU_BOT_TOKEN`

---

## ⚠️ 注意事项

1. **飞书应用权限**：确保应用已开通「多维表格」相关权限
2. **数据安全**：建议设置简单的访问密码或 IP 白名单
3. **费用**：Railway/Render 免费额度足够个人/小团队使用

---

## 如需帮助

如果部署过程中遇到问题，请告诉我：
1. 你想使用哪个平台（Railway / Render）
2. 遇到的具体错误信息
3. 截图或详细描述
