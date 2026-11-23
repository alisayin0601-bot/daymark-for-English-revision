# 把 Daymark 变成公用网址

Daymark 是 **Node.js + SQLite** 的完整网站：页面、登录、API 都在同一个进程里。
所以它不能像纯静态网页那样直接扔到 GitHub Pages，需要一个「能跑 Node 的服务器」。

你有三种可行路线，从快到稳定排列。

---

## 路线 A：先临时给别人看看（5 分钟，免费，不推荐长期用）

用隧道工具把本机 4173 端口临时暴露到公网。要求你的电脑一直开着。

1. 先把 `.env` 改成监听所有网卡（Windows 上只写 127.0.0.1 时隧道可能连不上）：

   ```ini
   HOST=0.0.0.0
   ```

2. 启动网站：

   ```powershell
   node server.js
   ```

3. 另开一个终端，用 Cloudflare 隧道（免费、不用注册即可临时用）：

   ```powershell
   winget install --id Cloudflare.cloudflared
   cloudflared tunnel --url http://127.0.0.1:4173
   ```

   命令会打印一个 `https://xxxx.trycloudflare.com` 地址，把它发人即可访问。

   > 这个地址每次重启都会变，你的电脑关机就没人能访问。只适合演示。

4. 用完把 `HOST` 改回 `127.0.0.1`，避免同一网络里的其他人直接访问。

---

## 路线 B：Render（推荐给非技术用户，免费额度够用）

Render 支持 Node 服务、自动 HTTPS、环境变量。缺点：免费实例会休眠，SQLite 文件在免费实例重启后**可能丢失**，所以免费版只适合试用。

1. 把项目推到 GitHub（**不要**提交 `.env`，它已经被 `.gitignore` 排除）。
2. 打开 <https://render.com> → New → **Web Service** → 连接这个仓库。
3. 填写：
   - Runtime：`Node`
   - Build Command：留空（没有依赖）
   - Start Command：`node server.js`
   - Health Check Path：`/api/status`
4. 在 **Environment** 里加变量（注意：值用你自己的 key，不要写进仓库）：

   ```ini
   HOST=0.0.0.0
   APP_TIMEZONE=Asia/Shanghai
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=你的key
   OPENROUTER_MODEL=qwen/qwen3.8-flash
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   ```

5. 要长期保存数据，升级到付费实例并挂 **Disk**（例如挂载到 `/var/data`），再加：

   ```ini
   DAYMARK_DB_PATH=/var/data/daymark.db
   ```

6. 部署完会给你 `https://daymark.onrender.com` 这种地址，可以直接分享。

注意：Render 会给服务注入 `PORT`，Daymark 会自动读取，不用手动设。

---

## 路线 C：任意 VPS（长期用最稳，有域名更好）

适合阿里云、腾讯云、Hetzner 等。带持久磁盘，也能自己绑域名和 HTTPS。

1. 服务器装 Node 24：

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. 上传项目（不含 `.env`、`data/`），在服务器上创建 `.env`：

   ```ini
   HOST=0.0.0.0
   PORT=4173
   APP_TIMEZONE=Asia/Shanghai
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=你的key
   OPENROUTER_MODEL=qwen/qwen3.8-flash
   ```

3. 用 pm2 常驻：

   ```bash
   sudo npm i -g pm2
   pm2 start server.js --name daymark
   pm2 save && pm2 startup
   ```

4. 用 Caddy 反代并自动申请 HTTPS（把 `daymark.example.com` 换成你的域名）：

   ```
   daymark.example.com {
       reverse_proxy 127.0.0.1:4173
   }
   ```

   另外在云服务器安全组里只开放 80/443，**不要**对公网开放 4173。

5. 绑域名：在 DNS 加一条 A 记录指向服务器 IP，等生效即可访问 `https://daymark.example.com`。

登录 Cookie 会自动识别 `X-Forwarded-Proto: https` 并加上 `Secure`，反代后能正常登录。

---

## 路线 D：Docker（任何支持容器的平台）

仓库里已经带了 `Dockerfile` 和 `.dockerignore`。

```bash
docker build -t daymark .
docker run -d --name daymark -p 8080:8080 \
  -e AI_PROVIDER=openrouter \
  -e OPENROUTER_API_KEY=你的key \
  -v daymark-data:/app/storage \
  daymark
```

然后在平台控制台里绑域名、开 HTTPS 即可。

---

## 上线前必须检查

- **密钥只在服务器环境变量里**：`.env` 已进 `.gitignore`。如果 key 曾经提交过 GitHub，立刻去 OpenRouter 后台重置。
- **数据库备份**：SQLite 是单文件，定期复制 `data/daymark.db`（WAL 模式下连同 `-wal`、`-shm`）到别处。
- **注册开放给所有人**：目前任何访问者都能注册账号。要做邀请制，需要在注册接口加白名单。
- **并发**：SQLite 适合中小流量；如果人数变多，需要换 PostgreSQL。
- **AI 花费**：`.env` 里的 `AI_REQUESTS_PER_HOUR` 和 `AI_DAILY_LIMIT` 是限额，公开后建议调低。
- **隐私/条款**：公开网站建议补上隐私政策和用户协议，尤其涉及写作/口语内容会被发送给 AI 服务商。

---

## 常见问题

**能不能直接传 GitHub Pages？**
不能。Pages 只能托管静态文件，没有登录、没有数据库、没有 `/api`。真要这么用，需要另外写一个后端，再把 key 放在后端——但 key 不能放前端。

**为什么必须加 `HOST=0.0.0.0`？**
默认 `127.0.0.1` 只允许本机访问，外部请求会被拒绝。托管平台或隧道通常要求监听所有网卡。

**免费平台靠谱吗？**
适合演示和小范围试用。长期使用建议路线 C 或 D，付费空间通常就几元到几十元一个月。
