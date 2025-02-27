# 🚀 Token Management Service

## 📖 Overview

This is a scalable **Token Management Service** built with **NestJS** and **Redis**, designed to efficiently generate, assign, unblock, and manage unique tokens with auto-expiry mechanisms.

### 🎯 **Key Features**

✅ Assigns unique tokens dynamically with **O(1) operations**  
✅ Supports **multi-instance deployments** using **Redis Pub/Sub**  
✅ Implements **event-driven token unblocking after 2 minutes**  
✅ Ensures **scalability and consistency** across multiple application pods  
✅ Deployable in **Docker & Kubernetes** environments  

---

## 🛠️ **Tech Stack**

| Component       | Technology    |
|----------------|--------------|
| **Backend**    | NestJS (TypeScript) |
| **Database**   | Redis (Atomic Operations, Pub/Sub) |
| **Event Bus**  | Redis Pub/Sub (Token Expiry) |
| **Containerization** | Docker & Kubernetes |
| **Monitoring** | Prometheus & Grafana |
| **Load Balancer** | NGINX / Kubernetes Service |

---

## 🏗️ **System Architecture**

```
        ┌────────────────────────────────┐
        │      API Gateway (NestJS)      │
        ├────────────────────────────────┤
        │      Token Service (NestJS)    │
        │  ┌─────────────────────────┐   │
        │  │     Redis Database      │   │
        │  │  - Token Storage        │   │
        │  │  - Auto-Expiry Handling │   │
        │  │  - Pub/Sub Notifications│   │
        │  └─────────────────────────┘   │
        ├────────────────────────────────┤
        │        Other Services          │
        │  (Auth, Logging, Monitoring)   │
        └────────────────────────────────┘
```

---

## 🚀 **Setup & Installation**

### **1️⃣ Clone the Repository**

```sh
git clone https://github.com/your-repo/token-management-service.git
cd token-management-service
```

### **2️⃣ Install Dependencies**

```sh
yarn install
```

### **3️⃣ Set Up Environment Variables**

Create a `.env` file in the root directory:

```ini
PORT=3000
REDIS_URL=redis://localhost:6379
TOKEN_LIFETIME=60    # Tokens expire after 60s
KEEP_ALIVE_LIMIT=300  # Keep-alive max timeout in seconds
```

### **4️⃣ Start Redis Locally**

Ensure Redis is running locally:

```sh
docker run -d --name redis -p 6379:6379 redis
```

### **5️⃣ Run the Application**

```sh
yarn start:dev
```

---

## 🔥 **API Endpoints**

### **1️⃣ Generate Tokens**

```http
POST /tokens/generate
```

**Request Body:**

```json
{
  "count": 10
}
```

**Response:**

```json
{
  "tokens": ["abc123", "def456"]
}
```

### **2️⃣ Assign a Token**

```http
POST /tokens/assign
```

**Response:**

```json
{
  "token": "abc123"
}
```

### **3️⃣ Unblock a Token (Available after 2 minutes)**

```http
POST /tokens/unblock
```

**Request Body:**

```json
{
  "token": "abc123"
}
```

### **4️⃣ Delete a Token**

```http
DELETE /tokens/delete
```

**Request Body:**

```json
{
  "token": "abc123"
}
```

### **5️⃣ Keep Token Alive (Prevent Expiry)**

```http
POST /tokens/keep-alive
```

**Request Body:**

```json
{
  "token": "abc123"
}
```

---

## ⚙ **Deployment**

### **🚀 Deploy with Docker**

```sh
docker build -t token-service .
docker run -p 3000:3000 --env-file .env token-service
```

### **🚀 Deploy on Kubernetes**

1️⃣ **Create Deployment YAML (`deployment.yaml`)**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: token-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: token-service
  template:
    metadata:
      labels:
        app: token-service
    spec:
      containers:
      - name: token-service
        image: token-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: REDIS_URL
          value: "redis://redis-cluster:6379"
```

2️⃣ **Apply the Kubernetes Deployment**

```sh
kubectl apply -f deployment.yaml
```

3️⃣ **Expose the Service**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: token-service
spec:
  type: LoadBalancer
  selector:
    app: token-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

```sh
kubectl apply -f service.yaml
```

---

## 🎯 **Scaling Strategy**

✅ **Redis Atomic Operations** → Prevents race conditions  
✅ **Redis Pub/Sub** → Ensures event-driven consistency  
✅ **Kubernetes Auto-Scaling** → Deploys multiple instances as needed  

---

## 🎯 **Future Enhancements**

✅ Implement **Rate Limiting** using API Gateway  
✅ Support **JWT Authentication** for secured access  
✅ Add **Kafka or RabbitMQ** for distributed messaging  
✅ Improve monitoring using **Prometheus & Grafana**  
✅ Configure Redis to run in **cluster mode** for better scalability and fault tolerance  

---

## 🎯 **Contributing**

1. Fork the repository  
2. Create a feature branch  
3. Commit changes  
4. Open a pull request  

---

## 📄 **License**

This project is licensed under **MIT License**.
