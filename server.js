// 尬酒馆财务看板 - Express 服务器
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 提供静态页面
app.use(express.static(path.join(__dirname, 'public')));

// API代理路由 - 获取多维表格数据
app.get('/api/records', async (req, res) => {
  try {
    const BITABLE_TOKEN = process.env.BITABLE_TOKEN || 'EprMb1HjqafiQ0sNVAlc7UJ7nrb';
    
    // 获取所有表格
    const tablesResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables`, {
      headers: {
        'Authorization': `Bearer ${process.env.FEISHU_BOT_TOKEN}`
      }
    });
    
    const tablesData = await tablesResponse.json();
    const tables = {};
    
    if (tablesData.data && tablesData.data.items) {
      for (const table of tablesData.data.items) {
        // 获取每月收支表的数据
        if (table.name.includes('收支') && !table.name.includes('汇总')) {
          const recordsResponse = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${table.table_id}/records?page_size=500`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.FEISHU_BOT_TOKEN}`
              }
            }
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
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// 获取汇总数据
app.get('/api/summary', async (req, res) => {
  try {
    const BITABLE_TOKEN = process.env.BITABLE_TOKEN || 'EprMb1HjqafiQ0sNVAlc7UJ7nrb';
    
    const tablesResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables`, {
      headers: {
        'Authorization': `Bearer ${process.env.FEISHU_BOT_TOKEN}`
      }
    });
    
    const tablesData = await tablesResponse.json();
    let summary = {};
    
    if (tablesData.data && tablesData.data.items) {
      for (const table of tablesData.data.items) {
        if (table.name === '月度汇总' || table.name === '基础设置') {
          const recordsResponse = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${table.table_id}/records`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.FEISHU_BOT_TOKEN}`
              }
            }
          );
          
          const recordsData = await recordsResponse.json();
          if (recordsData.data && recordsData.data.items) {
            summary[table.name] = recordsData.data.items;
          }
        }
      }
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

app.listen(PORT, () => {
  console.log(`财务看板服务运行在 http://localhost:${PORT}`);
});
