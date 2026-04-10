#!/bin/bash
# 启动财务看板服务

cd /workspace/projects/workspace/finance-dashboard

# 设置飞书 Bot Token (需要替换为实际的token)
export FEISHU_BOT_TOKEN="your_feishu_bot_token_here"
export BITABLE_TOKEN="EprMb1HjqafiQ0sNVAlc7UJ7nrb"
export PORT=3000

# 安装依赖
npm install

# 启动服务
echo "正在启动财务看板服务..."
echo "访问地址: http://localhost:$PORT"
node server.js
