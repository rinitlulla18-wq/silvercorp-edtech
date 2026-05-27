# Cloud Run ↔ Cloud SQL Connection Details

## Instance Info
| Key | Value |
|-----|-------|
| **Cloud SQL Instance** | `silvercorp-db` |
| **Connection Name** | `project-77fd4913-ebb5-4487-9d2:asia-south1:silvercorp-db` |
| **Database** | `silvercorp_leads` |
| **Table** | `leads` |
| **Cloud Run SA** | `silvercorp-cloudrun-sa@project-77fd4913-ebb5-4487-9d2.iam.gserviceaccount.com` |

---

## 🚀 Deploy Cloud Run with Cloud SQL (gcloud command)
```bash
gcloud run deploy YOUR_SERVICE_NAME \
  --image=YOUR_CONTAINER_IMAGE \
  --region=asia-south1 \
  --project=project-77fd4913-ebb5-4487-9d2 \
  --service-account=silvercorp-cloudrun-sa@project-77fd4913-ebb5-4487-9d2.iam.gserviceaccount.com \
  --add-cloudsql-instances=project-77fd4913-ebb5-4487-9d2:asia-south1:silvercorp-db \
  --set-env-vars="DB_NAME=silvercorp_leads,INSTANCE_CONNECTION_NAME=project-77fd4913-ebb5-4487-9d2:asia-south1:silvercorp-db,DB_USER=root"
```

---

## 🐍 Python — Connect from Cloud Run (via Unix socket)
```python
import pymysql
import os

connection = pymysql.connect(
    unix_socket=f"/cloudsql/{os.environ['INSTANCE_CONNECTION_NAME']}",
    user=os.environ.get("DB_USER", "root"),
    password=os.environ.get("DB_PASS", ""),
    db=os.environ.get("DB_NAME", "silvercorp_leads"),
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor
)
```

## 🌐 Node.js — Connect from Cloud Run
```javascript
const mysql = require('mysql2/promise');

const conn = await mysql.createConnection({
  socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'silvercorp_leads',
});
```

---

## 🔐 Env Vars to Set in Cloud Run
```
INSTANCE_CONNECTION_NAME = project-77fd4913-ebb5-4487-9d2:asia-south1:silvercorp-db
DB_NAME                  = silvercorp_leads
DB_USER                  = root
DB_PASS                  = <your-db-password>
```

---

## 📋 Useful Queries
```sql
-- All leads
SELECT * FROM silvercorp_leads.leads;

-- By assignee
SELECT assigned_to, COUNT(*) FROM leads GROUP BY assigned_to;

-- Hot leads only
SELECT student_name, phone_number, long_remark FROM leads WHERE lead_type = 'Hot';

-- Cold leads
SELECT student_name, phone_number FROM leads WHERE lead_type = 'Cold';
```
