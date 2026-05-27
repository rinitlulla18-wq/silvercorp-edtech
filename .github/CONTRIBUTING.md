# Contributing Guide

## ⚠️ Branch Rules

| Branch | Purpose | Who can push |
|--------|---------|-------------|
| `main` | Production — live on Cloud Run | **Only @rinitlulla18-wq via PR approval** |
| `development` | Active development | All team members |

## 🔄 Workflow — Har change ke liye

```
development  ──►  PR to main  ──►  Rinit approves  ──►  main (auto-deploy)
```

### Step-by-step

1. **`development` branch pe kaam karo**
   ```bash
   git checkout development
   git pull origin development
   # ... apna code likho ...
   git add .
   git commit -m "feat: tumhara feature"
   git push origin development
   ```

2. **PR raise karo GitHub pe**
   - GitHub → **Pull requests** → **New pull request**
   - Base: `main` ← Compare: `development`
   - Title aur description likho
   - **Create Pull Request**

3. **Wait for approval**
   - @rinitlulla18-wq review karega
   - Changes maange toh fix karo aur push karo
   - Approval milne ke baad **sirf Rinit merge karega**

4. **Auto-deploy**
   - Merge hote hi GitHub Actions automatically Cloud Run pe deploy kar dega 🚀

## ❌ Seedha `main` pe push mat karo

```bash
# ✅ Sahi tarika
git push origin development

# ❌ Galat — block ho jayega
git push origin main
```
