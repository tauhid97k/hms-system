# 🚀 Vertical Scaling Guide for HMS

**Date:** November 16, 2024  
**Topic:** How to Scale Your HMS Vertically (Single Server)  
**Audience:** Hospital IT Teams

---

## 📊 Overview

This guide shows how to **scale vertically** (upgrade server resources) instead of horizontally (add more servers). Most hospitals prefer this approach because it's simpler and doesn't require Redis or load balancers.

---

## 🎯 When to Scale Vertically vs Horizontally

### **Vertical Scaling (Recommended First)**

**Pros:**

- ✅ Simple configuration (just change env variables)
- ✅ No additional infrastructure (Redis, load balancer)
- ✅ Lower operational complexity
- ✅ Easier to manage and monitor
- ✅ Cost-effective for most hospitals

**Cons:**

- ⚠️ Single point of failure
- ⚠️ Hardware limits (can't scale infinitely)
- ⚠️ Requires downtime for upgrades

**Best For:**

- Single hospital/clinic
- Up to 50,000 patients/day
- Budget-conscious deployments
- Small IT teams

---

### **Horizontal Scaling (When Needed)**

**Pros:**

- ✅ No single point of failure (high availability)
- ✅ Can scale infinitely (add more servers)
- ✅ Zero-downtime deployments
- ✅ Geographic distribution

**Cons:**

- ⚠️ Requires Redis for SSE coordination
- ⚠️ Requires load balancer
- ⚠️ More complex to manage
- ⚠️ Higher operational costs

**Best For:**

- Hospital networks (multiple locations)
- 50,000+ patients/day
- Mission-critical 99.99% uptime requirements
- Large IT teams

---

## 🔧 How to Scale Vertically

### **Step 1: Assess Current Load**

Check your current SSE connection usage:

```bash
# Call the stats endpoint
curl http://localhost:3000/api/sse/stats

# Response:
{
  "totalConnections": 85,
  "resourceCount": 15,
  "maxConnectionsPerResource": 100,
  "connectionTimeout": 1800000
}
```

**Calculate Utilization:**

```
Current: 85 connections
Max per resource: 100
Active resources: 15
Total capacity: 100 × 15 = 1,500 connections
Utilization: 85 / 1,500 = 5.7%
```

---

### **Step 2: Determine Target Capacity**

Use this table to plan:

| Daily Patients | Peak Concurrent Conns | Recommended Config                     |
| -------------- | --------------------- | -------------------------------------- |
| 500-1,000      | 20-50                 | `SSE_MAX_CONNECTIONS_PER_RESOURCE=50`  |
| 1,000-5,000    | 50-150                | `SSE_MAX_CONNECTIONS_PER_RESOURCE=100` |
| 5,000-10,000   | 150-300               | `SSE_MAX_CONNECTIONS_PER_RESOURCE=200` |
| 10,000-20,000  | 300-600               | `SSE_MAX_CONNECTIONS_PER_RESOURCE=300` |
| 20,000-50,000  | 600-1,500             | `SSE_MAX_CONNECTIONS_PER_RESOURCE=500` |

**Formula:**

```
Peak Concurrent = (Daily Patients × 0.03) + (Active Doctors × 2)

Example for 10,000 patients/day:
= (10,000 × 0.03) + (30 doctors × 2)
= 300 + 60
= 360 concurrent connections needed
```

---

### **Step 3: Update Environment Variables**

Edit your `.env` file:

```bash
# For 5,000 patients/day (current default)
SSE_MAX_CONNECTIONS_PER_RESOURCE="100"
SSE_CONNECTION_TIMEOUT_MINUTES="30"

# For 10,000 patients/day
SSE_MAX_CONNECTIONS_PER_RESOURCE="200"
SSE_CONNECTION_TIMEOUT_MINUTES="30"

# For 20,000 patients/day
SSE_MAX_CONNECTIONS_PER_RESOURCE="300"
SSE_CONNECTION_TIMEOUT_MINUTES="30"

# For 50,000 patients/day (large hospital)
SSE_MAX_CONNECTIONS_PER_RESOURCE="500"
SSE_CONNECTION_TIMEOUT_MINUTES="30"
```

---

### **Step 4: Upgrade Server Resources**

Match your server specs to your target load:

#### **Small Clinic (500-5K patients/day)**

```yaml
Server Specs:
  CPU: 2-4 cores
  RAM: 2-4 GB
  Storage: 50 GB SSD
  Network: 100 Mbps

SSE Config:
  SSE_MAX_CONNECTIONS_PER_RESOURCE: 100
  Expected Capacity: ~1,000 concurrent connections

Cost: $20-50/month (DigitalOcean, AWS Lightsail)
```

#### **Medium Hospital (5K-10K patients/day)**

```yaml
Server Specs:
  CPU: 4-8 cores
  RAM: 8-16 GB
  Storage: 100 GB SSD
  Network: 1 Gbps

SSE Config:
  SSE_MAX_CONNECTIONS_PER_RESOURCE: 200
  Expected Capacity: ~2,000 concurrent connections

Cost: $80-150/month (DigitalOcean, AWS EC2)
```

#### **Large Hospital (10K-20K patients/day)**

```yaml
Server Specs:
  CPU: 8-16 cores
  RAM: 16-32 GB
  Storage: 200 GB SSD
  Network: 1 Gbps

SSE Config:
  SSE_MAX_CONNECTIONS_PER_RESOURCE: 300
  Expected Capacity: ~5,000 concurrent connections

Cost: $150-300/month (DigitalOcean, AWS EC2)
```

#### **Hospital Network (20K-50K patients/day)**

```yaml
Server Specs:
  CPU: 16-32 cores
  RAM: 32-64 GB
  Storage: 500 GB SSD
  Network: 10 Gbps

SSE Config:
  SSE_MAX_CONNECTIONS_PER_RESOURCE: 500
  Expected Capacity: ~10,000 concurrent connections

Cost: $300-600/month (DigitalOcean, AWS EC2)

Note: At this scale, consider horizontal scaling instead!
```

---

### **Step 5: Optimize System Limits (Linux)**

For high connection counts, increase system limits:

```bash
# 1. Increase file descriptor limit
sudo nano /etc/security/limits.conf

# Add these lines:
* soft nofile 65536
* hard nofile 65536

# 2. Increase Node.js heap size
# Edit your start script or systemd service:
NODE_OPTIONS="--max-old-space-size=4096" npm start

# 3. Optimize PostgreSQL connections
# Edit postgresql.conf:
max_connections = 200
shared_buffers = 2GB
effective_cache_size = 6GB

# 4. Optimize Redis (if using)
# Edit redis.conf:
maxmemory 2gb
maxmemory-policy allkeys-lru

# 5. Restart services
sudo systemctl restart postgresql
sudo systemctl restart redis
sudo systemctl restart your-app
```

---

### **Step 6: Restart Application**

```bash
# Development
npm run dev

# Production (PM2)
pm2 restart hms-app

# Production (Docker)
docker-compose restart

# Production (Systemd)
sudo systemctl restart hms-app
```

**Check logs for confirmation:**

```
🔧 SSE Configuration: 200 connections per resource, 30 min timeout
✅ SSE: Redis not configured, using single-server mode
```

---

## 📊 Monitoring & Optimization

### **Create Monitoring Endpoint**

```typescript
// app/api/admin/system-stats/route.ts
import { NextResponse } from 'next/server';
import { sseConnectionManager } from '@/lib/services/sse-connection.service';
import { cacheService } from '@/lib/services/cache.service';

export async function GET() {
  const sseStats = sseConnectionManager.getStats();
  const cacheStats = cacheService.getStats();

  return NextResponse.json({
    sse: {
      ...sseStats,
      utilizationPercent: (
        (sseStats.totalConnections /
        (sseStats.maxConnectionsPerResource * sseStats.resourceCount)) * 100
      ).toFixed(2),
      capacityRemaining: (
        (sseStats.maxConnectionsPerResource * sseStats.resourceCount) -
        sseStats.totalConnections
      )
    },
    cache: cacheStats,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    },
    config: {
      maxConnectionsPerResource: process.env.SSE_MAX_CONNECTIONS_PER_RESOURCE,
      connectionTimeout: process.env.SSE_CONNECTION_TIMEOUT_MINUTES,
      redisEnabled: !!process.env.REDIS_HOST,
    }
  });
}
```

### **Dashboard Metrics to Track**

```typescript
// Key metrics to monitor:

1. SSE Utilization
   - Current: 85 connections
   - Capacity: 1,500 connections
   - Utilization: 5.7%
   - Status: ✅ Healthy (< 70%)

2. Memory Usage
   - Used: 450 MB
   - Total: 2 GB
   - Utilization: 22%
   - Status: ✅ Healthy (< 80%)

3. CPU Usage
   - Average: 15%
   - Peak: 45%
   - Status: ✅ Healthy (< 70%)

4. Database Connections
   - Active: 12
   - Max: 100
   - Status: ✅ Healthy

5. Response Times
   - P50: 45ms
   - P95: 120ms
   - P99: 250ms
   - Status: ✅ Healthy (< 500ms)
```

---

## 🚨 When to Scale Further

### **Warning Signs You Need More Capacity:**

1. **SSE Utilization > 70%**

   ```
   Current: 1,050 connections
   Capacity: 1,500 connections
   Utilization: 70%
   Action: Increase SSE_MAX_CONNECTIONS_PER_RESOURCE
   ```

2. **Memory Usage > 80%**

   ```
   Used: 6.5 GB
   Total: 8 GB
   Utilization: 81%
   Action: Upgrade server RAM
   ```

3. **CPU Usage > 70% sustained**

   ```
   Average: 75%
   Peak: 95%
   Action: Upgrade server CPU cores
   ```

4. **Connection Limit Warnings in Logs**

   ```
   ⚠️ Connection limit reached for resource: doctor-123 (200/200)
   Action: Increase SSE_MAX_CONNECTIONS_PER_RESOURCE
   ```

5. **Slow Response Times**
   ```
   P95: 800ms (target: < 500ms)
   P99: 2,000ms (target: < 1,000ms)
   Action: Upgrade server or optimize queries
   ```

---

## 🎯 Scaling Roadmap

### **Phase 1: Small Clinic (Current)**

```yaml
Patients/Day: 500-5,000
Server: 2-4 cores, 4 GB RAM
SSE Config: 100 per resource
Cost: $20-50/month
Timeline: Now
```

### **Phase 2: Medium Hospital**

```yaml
Patients/Day: 5,000-10,000
Server: 4-8 cores, 8 GB RAM
SSE Config: 200 per resource
Cost: $80-150/month
Timeline: When utilization > 70%
```

### **Phase 3: Large Hospital**

```yaml
Patients/Day: 10,000-20,000
Server: 8-16 cores, 16 GB RAM
SSE Config: 300 per resource
Cost: $150-300/month
Timeline: When utilization > 70%
```

### **Phase 4: Consider Horizontal Scaling**

```yaml
Patients/Day: 20,000+
Setup: Multiple servers + Redis + Load Balancer
SSE Config: 300-500 per resource per server
Cost: $300-600/month
Timeline: When single server limits reached
```

---

## 📋 Vertical Scaling Checklist

### **Before Scaling:**

- [ ] Monitor current utilization for 1 week
- [ ] Identify peak usage times
- [ ] Calculate target capacity needed
- [ ] Plan maintenance window
- [ ] Backup database
- [ ] Document current configuration

### **During Scaling:**

- [ ] Update `.env` with new SSE limits
- [ ] Upgrade server resources (CPU/RAM)
- [ ] Increase system limits (file descriptors)
- [ ] Optimize database settings
- [ ] Restart application
- [ ] Verify configuration in logs

### **After Scaling:**

- [ ] Monitor for 24-48 hours
- [ ] Check SSE utilization
- [ ] Check memory usage
- [ ] Check CPU usage
- [ ] Verify response times
- [ ] Test peak load scenarios
- [ ] Document new capacity

---

## 💡 Pro Tips

### **1. Gradual Scaling**

```bash
# Don't jump from 100 to 500 immediately
# Scale gradually:
Week 1: SSE_MAX_CONNECTIONS_PER_RESOURCE=100
Week 2: SSE_MAX_CONNECTIONS_PER_RESOURCE=150
Week 3: SSE_MAX_CONNECTIONS_PER_RESOURCE=200
# Monitor at each step
```

### **2. Peak Hour Planning**

```bash
# Plan for 2x peak load:
Normal peak: 200 connections
Plan for: 400 connections
Set: SSE_MAX_CONNECTIONS_PER_RESOURCE=200
# Gives 100% headroom
```

### **3. Memory Optimization**

```bash
# Reduce timeout for memory savings:
# Long timeout (60 min): More memory, better UX
# Short timeout (15 min): Less memory, may disconnect users
SSE_CONNECTION_TIMEOUT_MINUTES="30"  # Balanced
```

### **4. Cost Optimization**

```bash
# Start small, scale as needed:
Month 1-3: $20/month (2 cores, 2GB)
Month 4-6: $50/month (4 cores, 4GB)
Month 7+: $100/month (8 cores, 8GB)
# Only pay for what you need
```

---

## 🔍 Troubleshooting

### **Problem: "Connection limit reached" warnings**

**Solution:**

```bash
# Increase the limit
SSE_MAX_CONNECTIONS_PER_RESOURCE="200"  # Was 100

# Or upgrade server and increase further
SSE_MAX_CONNECTIONS_PER_RESOURCE="500"
```

---

### **Problem: High memory usage**

**Solution:**

```bash
# Reduce connection timeout
SSE_CONNECTION_TIMEOUT_MINUTES="15"  # Was 30

# Or upgrade server RAM
# 4GB → 8GB → 16GB
```

---

### **Problem: Slow response times**

**Solution:**

```bash
# 1. Check database query performance
# 2. Add database indexes
# 3. Optimize N+1 queries
# 4. Upgrade server CPU
# 5. Enable Redis caching
```

---

## ✅ Summary

### **Key Takeaways:**

1. **Start Small**
   - Default config (100 per resource) handles 5K patients/day
   - Only scale when utilization > 70%

2. **Scale Gradually**
   - Increase limits in small increments
   - Monitor after each change
   - Don't over-provision

3. **Monitor Continuously**
   - Track SSE utilization
   - Track memory/CPU usage
   - Set up alerts

4. **Know Your Limits**
   - Single server: Up to 50K patients/day
   - Beyond that: Consider horizontal scaling

5. **Cost-Effective**
   - Vertical scaling is cheaper than horizontal
   - Only upgrade when needed
   - Most hospitals never need multi-server

**Your HMS is designed to scale vertically with zero code changes!** 🚀
