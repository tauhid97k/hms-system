# ⚡ SSE Scaling Quick Reference Card

**Quick guide for hospital IT teams to scale SSE capacity**

---

## 🎯 Quick Decision Matrix

| Daily Patients | Set This in `.env`                       | Server Specs             | Monthly Cost |
| -------------- | ---------------------------------------- | ------------------------ | ------------ |
| **500-1K**     | `SSE_MAX_CONNECTIONS_PER_RESOURCE="50"`  | 2 cores, 2GB RAM         | $20-30       |
| **1K-5K**      | `SSE_MAX_CONNECTIONS_PER_RESOURCE="100"` | 4 cores, 4GB RAM         | $40-60       |
| **5K-10K**     | `SSE_MAX_CONNECTIONS_PER_RESOURCE="200"` | 8 cores, 8GB RAM         | $80-120      |
| **10K-20K**    | `SSE_MAX_CONNECTIONS_PER_RESOURCE="300"` | 16 cores, 16GB RAM       | $150-250     |
| **20K-50K**    | `SSE_MAX_CONNECTIONS_PER_RESOURCE="500"` | 32 cores, 32GB RAM       | $300-500     |
| **50K+**       | **Use Multi-Server**                     | Multiple servers + Redis | $500+        |

---

## 🔧 How to Scale (3 Steps)

### **Step 1: Edit `.env` file**

```bash
# Open your .env file
nano .env

# Change this line:
SSE_MAX_CONNECTIONS_PER_RESOURCE="200"  # Increase as needed

# Save and exit
```

### **Step 2: Restart application**

```bash
# If using PM2:
pm2 restart hms-app

# If using Docker:
docker-compose restart

# If using npm:
npm run dev
```

### **Step 3: Verify in logs**

```bash
# You should see:
🔧 SSE Configuration: 200 connections per resource, 30 min timeout
```

**Done! That's it!** ✅

---

## 📊 Capacity Calculator

```
Total SSE Capacity = SSE_MAX_CONNECTIONS_PER_RESOURCE × Active Resources

Example:
- Setting: SSE_MAX_CONNECTIONS_PER_RESOURCE=100
- Active doctors: 20
- Total capacity: 100 × 20 = 2,000 concurrent connections
```

---

## 🚨 When to Scale Up

### **Check Your Logs:**

```bash
# If you see this:
⚠️ Connection limit reached for resource: doctor-123 (100/100)

# Action: Increase the limit
SSE_MAX_CONNECTIONS_PER_RESOURCE="200"
```

### **Check System Stats:**

```bash
# Call this endpoint:
curl http://localhost:3000/api/sse/stats

# If utilization > 70%, scale up:
{
  "totalConnections": 1400,
  "maxConnectionsPerResource": 100,
  "resourceCount": 20
}

# Utilization: 1400 / (100 × 20) = 70%
# Action: Increase to 150 or 200
```

---

## 💰 Cost Optimization

### **Start Small, Scale as Needed:**

```
Month 1: SSE_MAX_CONNECTIONS_PER_RESOURCE="50"  ($20/month)
         ↓ (when utilization > 70%)
Month 3: SSE_MAX_CONNECTIONS_PER_RESOURCE="100" ($40/month)
         ↓ (when utilization > 70%)
Month 6: SSE_MAX_CONNECTIONS_PER_RESOURCE="200" ($80/month)
```

**Don't over-provision!** Only scale when needed.

---

## 🎯 Recommended Settings by Hospital Size

### **Small Clinic**

```bash
SSE_MAX_CONNECTIONS_PER_RESOURCE="50"
SSE_CONNECTION_TIMEOUT_MINUTES="30"
```

### **Medium Hospital (Your Current Setup)**

```bash
SSE_MAX_CONNECTIONS_PER_RESOURCE="100"
SSE_CONNECTION_TIMEOUT_MINUTES="30"
```

### **Large Hospital**

```bash
SSE_MAX_CONNECTIONS_PER_RESOURCE="300"
SSE_CONNECTION_TIMEOUT_MINUTES="30"
```

### **Hospital Network**

```bash
# Consider multi-server setup instead
# See: docs/REDIS_PUBSUB_IMPLEMENTATION.md
```

---

## 📱 Emergency Scaling (Quick Fix)

**If your system is overloaded RIGHT NOW:**

```bash
# 1. Quick increase (takes 30 seconds)
echo 'SSE_MAX_CONNECTIONS_PER_RESOURCE="500"' >> .env
pm2 restart hms-app

# 2. Monitor
pm2 logs hms-app

# 3. Plan proper upgrade later
```

---

## ✅ Health Check Commands

```bash
# Check SSE stats
curl http://localhost:3000/api/sse/stats

# Check system resources
htop  # or top

# Check memory
free -h

# Check logs
pm2 logs hms-app --lines 50
```

---

## 🔍 Common Issues

### **Issue: "Connection limit reached"**

```bash
# Fix: Increase limit
SSE_MAX_CONNECTIONS_PER_RESOURCE="200"
pm2 restart hms-app
```

### **Issue: High memory usage**

```bash
# Fix: Reduce timeout
SSE_CONNECTION_TIMEOUT_MINUTES="15"
pm2 restart hms-app
```

### **Issue: Slow performance**

```bash
# Fix: Upgrade server CPU/RAM
# Or enable Redis caching
```

---

## 📞 Need Help?

1. **Check logs:** `pm2 logs hms-app`
2. **Check stats:** `curl http://localhost:3000/api/sse/stats`
3. **Read full guide:** `docs/VERTICAL_SCALING_GUIDE.md`
4. **Multi-server setup:** `docs/REDIS_PUBSUB_IMPLEMENTATION.md`

---

## 🎉 Summary

**To scale SSE capacity:**

1. Edit `.env` → Change `SSE_MAX_CONNECTIONS_PER_RESOURCE`
2. Restart app → `pm2 restart hms-app`
3. Verify logs → Look for "SSE Configuration" message

**That's it! No code changes needed!** 🚀
