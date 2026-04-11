// 尬酒馆财务看板 - Express 服务器 (自动刷新Token版)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ============ 飞书Token自动刷新配置 ============
const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const BITABLE_TOKEN = process.env.BITABLE_TOKEN || 'EprMb1HjqafiQ0sNVAlc7UJ7nrb';

// Token缓存
let tokenCache = {
  token: null,
  expireTime: null
};

// 自动刷新Token函数
async function refreshToken() {
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    console.log('⚠️ 未配置 FEISHU_APP_ID 和 FEISHU_APP_SECRET，无法自动刷新Token');
    return null;
  }

  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: FEISHU_APP_ID,
        app_secret: FEISHU_APP_SECRET
      })
    });

    const data = await response.json();
    
    if (data.code === 0 && data.tenant_access_token) {
      // Token默认2小时过期，提前5分钟刷新
      tokenCache.token = data.tenant_access_token;
      tokenCache.expireTime = Date.now() + (data.expire - 300) * 1000;
      
      console.log(`✅ Token刷新成功，有效期至: ${new Date(tokenCache.expireTime).toLocaleString('zh-CN')}`);
      return tokenCache.token;
    } else {
      console.error('❌ Token获取失败:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('❌ Token刷新异常:', error.message);
    return null;
  }
}

// 获取有效Token（自动判断是否需要刷新）
async function getValidToken() {
  // 如果没有Token或即将过期，先刷新
  if (!tokenCache.token || !tokenCache.expireTime || Date.now() >= tokenCache.expireTime) {
    await refreshToken();
  }
  return tokenCache.token;
}

// 启动时先获取一次Token
if (FEISHU_APP_ID && FEISHU_APP_SECRET) {
  console.log('🚀 启动自动Token管理...');
  refreshToken();
  
  // 每小时检查一次Token状态
  setInterval(async () => {
    if (tokenCache.expireTime && Date.now() >= tokenCache.expireTime - 60000) {
      console.log('⏰ Token即将过期，正在刷新...');
      await refreshToken();
    }
  }, 60 * 60 * 1000); // 每小时检查
} else {
  console.log('⚠️ 使用旧版配置（环境变量中的FEISHU_BOT_TOKEN）');
  console.log('💡 建议改为配置 FEISHU_APP_ID 和 FEISHU_APP_SECRET 实现自动刷新');
}

// HTML页面内容
const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>尬酒馆 - 财务看板</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; color: #fff; }
    .header { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); padding: 20px; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .header .subtitle { font-size: 14px; color: rgba(255,255,255,0.6); }
    .balance-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 25px; margin: 20px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3); }
    .balance-label { font-size: 14px; opacity: 0.9; margin-bottom: 5px; }
    .balance-amount { font-size: 42px; font-weight: bold; }
    .balance-amount.positive { color: #4ade80; }
    .balance-amount.negative { color: #f87171; }
    .stats-row { display: flex; gap: 15px; margin-top: 20px; }
    .stat-box { flex: 1; background: rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; text-align: center; }
    .stat-label { font-size: 12px; opacity: 0.8; margin-bottom: 5px; }
    .stat-value { font-size: 20px; font-weight: bold; }
    .stat-value.income { color: #4ade80; }
    .stat-value.expense { color: #f87171; }
    .month-tabs { display: flex; gap: 10px; padding: 15px 20px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .month-tab { padding: 10px 20px; background: rgba(255,255,255,0.1); border-radius: 20px; font-size: 14px; cursor: pointer; white-space: nowrap; transition: all 0.3s; }
    .month-tab.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .records-list { padding: 0 20px 20px; }
    .record-item { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .record-left { display: flex; flex-direction: column; gap: 5px; }
    .record-desc { font-size: 15px; }
    .record-date { font-size: 12px; color: rgba(255,255,255,0.5); }
    .record-right { text-align: right; }
    .record-amount { font-size: 18px; font-weight: bold; }
    .record-amount.income { color: #4ade80; }
    .record-amount.expense { color: #f87171; }
    .record-balance { font-size: 12px; color: rgba(255,255,255,0.6); }
    .loading, .error, .empty { text-align: center; padding: 50px; color: rgba(255,255,255,0.6); }
    .error { color: #f87171; }
    .refresh-btn { position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white; font-size: 20px; cursor: pointer; box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4); transition: transform 0.3s; }
    .refresh-btn:active { transform: scale(0.95); }
    .refresh-btn.loading { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .month-summary { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin: 0 20px 15px; display: flex; justify-content: space-between; }
    .summary-item { text-align: center; }
    .summary-label { font-size: 12px; color: rgba(255,255,255,0.6); }
    .summary-value { font-size: 16px; font-weight: bold; margin-top: 5px; }
    .footer { text-align: center; padding: 30px; color: rgba(255,255,255,0.4); font-size: 12px; }
    .token-status { font-size: 11px; margin-top: 5px; }
    .token-status.ok { color: #4ade80; }
    .token-status.expired { color: #f87171; }
    @media (max-width: 480px) { .balance-amount { font-size: 36px; } .balance-card { margin: 15px; padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍺 尬酒馆财务看板</h1>
    <div class="subtitle">实时收支动态 <span id="tokenStatus" class="token-status ok">● 正常</span></div>
  </div>
  <div class="balance-card">
    <div class="balance-label">当前账户余额</div>
    <div class="balance-amount" id="currentBalance">加载中...</div>
    <div class="stats-row">
      <div class="stat-box"><div class="stat-label">本月收入</div><div class="stat-value income" id="monthIncome">-</div></div>
      <div class="stat-box"><div class="stat-label">本月支出</div><div class="stat-value expense" id="monthExpense">-</div></div>
      <div class="stat-box"><div class="stat-label">本月笔数</div><div class="stat-value" id="monthCount">-</div></div>
    </div>
  </div>
  <div class="month-tabs" id="monthTabs">
    <div class="month-tab active" data-month="4月收支">4月</div>
    <div class="month-tab" data-month="3月收支">3月</div>
    <div class="month-tab" data-month="2月收支">2月</div>
    <div class="month-tab" data-month="1月收支">1月</div>
    <div class="month-tab" data-month="12月收支">12月</div>
    <div class="month-tab" data-month="11月收支">11月</div>
  </div>
  <div class="month-summary" id="monthSummary" style="display: none;">
    <div class="summary-item"><div class="summary-label">收入</div><div class="summary-value income" id="summaryIncome">-</div></div>
    <div class="summary-item"><div class="summary-label">支出</div><div class="summary-value expense" id="summaryExpense">-</div></div>
    <div class="summary-item"><div class="summary-label">净额</div><div class="summary-value" id="summaryNet">-</div></div>
  </div>
  <div class="records-list" id="recordsList"><div class="loading">正在加载数据...</div></div>
  <div class="footer">数据来源：飞书多维表格 | 更新时间：<span id="lastUpdate">-</span></div>
  <button class="refresh-btn" id="refreshBtn" onclick="loadData()">↻</button>
  <script>
    let allData = {};
    let currentMonth = '4月收支';
    const mockData = {'4月收支': [{fields: {'类型': '收入', '金额': 12691.88, '备注': '本月总收入', '账户余额': -251.65}}]};
    async function loadData() {
      const btn = document.getElementById('refreshBtn');
      const tokenStatus = document.getElementById('tokenStatus');
      btn.classList.add('loading');
      try {
        const response = await fetch('/api/records');
        if (response.ok) {
          const data = await response.json();
          if (data && data.error) {
            tokenStatus.textContent = '● Token过期';
            tokenStatus.className = 'token-status expired';
            allData = mockData;
          } else if (Object.keys(data || {}).length > 0) {
            tokenStatus.textContent = '● 正常';
            tokenStatus.className = 'token-status ok';
            allData = data;
          } else {
            tokenStatus.textContent = '● 无数据';
            tokenStatus.className = 'token-status expired';
            allData = mockData;
          }
        } else {
          tokenStatus.textContent = '● 连接失败';
          tokenStatus.className = 'token-status expired';
          allData = mockData;
        }
      } catch (error) {
        tokenStatus.textContent = '● 异常';
        tokenStatus.className = 'token-status expired';
        allData = mockData;
      }
      renderRecords(); updateStats();
      document.getElementById('lastUpdate').textContent = new Date().toLocaleString('zh-CN');
      btn.classList.remove('loading');
    }
    function renderRecords() {
      const container = document.getElementById('recordsList');
      const records = allData[currentMonth] || [];
      if (records.length === 0) { container.innerHTML = '<div class="empty">暂无记录</div>'; document.getElementById('monthSummary').style.display = 'none'; return; }
      let totalIncome = 0, totalExpense = 0;
      records.forEach(r => { if (r.fields['类型'] === '收入') totalIncome += Number(r.fields['金额'] || 0); else totalExpense += Number(r.fields['金额'] || 0); });
      document.getElementById('summaryIncome').textContent = '¥' + totalIncome.toFixed(2);
      document.getElementById('summaryExpense').textContent = '¥' + totalExpense.toFixed(2);
      const net = totalIncome - totalExpense;
      const netEl = document.getElementById('summaryNet');
      netEl.textContent = (net >= 0 ? '+' : '') + '¥' + net.toFixed(2);
      netEl.style.color = net >= 0 ? '#4ade80' : '#f87171';
      document.getElementById('monthSummary').style.display = 'flex';
      const html = records.reverse().map(r => {
        const type = r.fields['类型'] || '支出';
        const amount = Number(r.fields['金额'] || 0);
        const desc = r.fields['备注'] || '';
        const balance = Number(r.fields['账户余额'] || 0);
        return '<div class="record-item"><div class="record-left"><div class="record-desc">' + desc + '</div><div class="record-date">' + currentMonth + '</div></div><div class="record-right"><div class="record-amount ' + (type === '收入' ? 'income' : 'expense') + '">' + (type === '收入' ? '+' : '-') + '¥' + amount.toFixed(2) + '</div><div class="record-balance">余额 ¥' + balance.toFixed(2) + '</div></div></div>';
      }).join('');
      container.innerHTML = html;
    }
    function updateStats() {
      const records = allData[currentMonth] || [];
      let totalIncome = 0, totalExpense = 0;
      records.forEach(r => { if (r.fields['类型'] === '收入') totalIncome += Number(r.fields['金额'] || 0); else totalExpense += Number(r.fields['金额'] || 0); });
      document.getElementById('monthIncome').textContent = '¥' + totalIncome.toFixed(2);
      document.getElementById('monthExpense').textContent = '¥' + totalExpense.toFixed(2);
      document.getElementById('monthCount').textContent = records.length + '笔';
      if (records.length > 0) {
        const lastBalance = Number(records[records.length - 1].fields['账户余额'] || 0);
        const balanceEl = document.getElementById('currentBalance');
        balanceEl.textContent = '¥' + lastBalance.toFixed(2);
        balanceEl.className = 'balance-amount ' + (lastBalance >= 0 ? 'positive' : 'negative');
      }
    }
    document.getElementById('monthTabs').addEventListener('click', (e) => {
      if (e.target.classList.contains('month-tab')) {
        document.querySelectorAll('.month-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentMonth = e.target.dataset.month;
        renderRecords(); updateStats();
      }
    });
    loadData();
    setInterval(loadData, 5 * 60 * 1000);
  </script>
</body>
</html>`;

// 强制使用HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') === 'http') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

// 返回HTML页面
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(htmlContent);
});

// API代理路由
app.get('/api/records', async (req, res) => {
  console.log('📊 收到API请求');
  
  // 获取有效Token
  const token = await getValidToken();
  
  if (!token) {
    console.log('❌ 无可用Token');
    res.json({ error: 'Token无效' });
    return;
  }
  
  try {
    // 获取表格列表
    const tablesResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 如果Token过期，尝试刷新
    if (tablesResponse.status === 401) {
      console.log('🔄 Token已过期，尝试刷新...');
      await refreshToken();
      const newToken = await getValidToken();
      if (!newToken) {
        res.json({ error: 'Token刷新失败' });
        return;
      }
      // 使用新Token重试
      return fetchRecordsWithToken(newToken, res);
    }
    
    const tablesData = await tablesResponse.json();
    
    if (tablesData.code !== 0) {
      console.log('❌ 获取表格列表失败:', tablesData.msg);
      res.json({ error: tablesData.msg });
      return;
    }
    
    const tables = {};
    
    if (tablesData.data && tablesData.data.items) {
      for (const table of tablesData.data.items) {
        // 只获取收支相关的表（排除汇总表）
        if (table.name.includes('收支') && !table.name.includes('汇总')) {
          const recordsResponse = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${table.table_id}/records?page_size=500`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          const recordsData = await recordsResponse.json();
          if (recordsData.data && recordsData.data.items) {
            tables[table.name] = recordsData.data.items;
          }
        }
      }
    }
    
    console.log(`✅ 获取到 ${Object.keys(tables).length} 个表格的数据`);
    res.json(tables);
    
  } catch (error) {
    console.error('❌ API错误:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 使用指定Token获取记录的辅助函数
async function fetchRecordsWithToken(token, res) {
  try {
    const tablesResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tablesData = await tablesResponse.json();
    
    const tables = {};
    if (tablesData.data && tablesData.data.items) {
      for (const table of tablesData.data.items) {
        if (table.name.includes('收支') && !table.name.includes('汇总')) {
          const recordsResponse = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${table.table_id}/records?page_size=500`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          const recordsData = await recordsResponse.json();
          if (recordsData.data && recordsData.data.items) {
            tables[table.name] = recordsData.data.items;
          }
        }
      }
    }
    
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 手动刷新Token的API
app.get('/api/refresh-token', async (req, res) => {
  console.log('🔄 手动刷新Token...');
  await refreshToken();
  if (tokenCache.token) {
    res.json({ success: true, expireTime: new Date(tokenCache.expireTime).toLocaleString('zh-CN') });
  } else {
    res.json({ success: false, message: '刷新失败，请检查APP_ID和APP_SECRET配置' });
  }
});

app.listen(PORT, () => {
  console.log('===========================================');
  console.log('🍺 尬酒馆财务看板服务已启动');
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log('===========================================');
  console.log('');
  console.log('📋 环境变量配置:');
  console.log('   • FEISHU_APP_ID      - 飞书应用ID（推荐，用于自动刷新Token）');
  console.log('   • FEISHU_APP_SECRET  - 飞书应用Secret（推荐，用于自动刷新Token）');
  console.log('   • FEISHU_BOT_TOKEN   - 旧版Token（兼容，已废弃）');
  console.log('   • BITABLE_TOKEN      - 多维表格Token');
  console.log('');
  console.log('💡 提示: 使用FEISHU_APP_ID+FEISHU_APP_SECRET可自动刷新Token');
  console.log('   访问 /api/refresh-token 可手动刷新Token');
  console.log('');
});
