# NPM 發佈設定指南

本文件說明如何將 Kiro Doc Sync 發佈到 NPM。

## 前置準備

### 1. NPM 帳戶

如果還沒有 NPM 帳戶，請先註冊：
- 訪問 https://www.npmjs.com/signup
- 完成註冊流程

### 2. 本地 NPM 登入

```bash
npm login
```

輸入你的 NPM 帳戶認證資訊。

### 3. GitHub 設定

#### 建立 NPM Token

1. 登入 NPM 帳戶
2. 進入 Account Settings → Tokens
3. 建立新的 Automation token（用於 CI/CD）
4. 複製 token

#### 設定 GitHub Secrets

1. 進入 GitHub 倉庫 → Settings → Secrets and variables → Actions
2. 建立新的 secret：
   - Name: `NPM_TOKEN`
   - Value: 貼上你的 NPM token

## 發佈流程

### 方式 1：自動發佈（推薦）

使用 GitHub Actions 自動發佈：

1. 更新 `package.json` 中的版本號
2. 更新 `CHANGELOG.md`
3. 提交更改：
   ```bash
   git add .
   git commit -m "chore: bump version to x.y.z"
   git push
   ```

4. 建立 Git tag：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

5. GitHub Actions 會自動執行發佈流程

### 方式 2：手動發佈

如果不使用 GitHub Actions：

1. 確保程式碼已編譯：
   ```bash
   npm run build
   ```

2. 發佈到 NPM：
   ```bash
   npm publish
   ```

## 版本管理

遵循 [Semantic Versioning](https://semver.org/)：

- **MAJOR** (x.0.0): 不相容的 API 變更
- **MINOR** (0.x.0): 新增功能（向後相容）
- **PATCH** (0.0.x): 錯誤修復

更新版本：

```bash
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0
```

## 發佈前檢查清單

- [ ] 所有測試通過
- [ ] 程式碼已編譯（`npm run build`）
- [ ] `package.json` 版本已更新
- [ ] `CHANGELOG.md` 已更新
- [ ] `README.md` 已更新（如需要）
- [ ] Git tag 已建立
- [ ] NPM token 已設定在 GitHub Secrets

## 驗證發佈

發佈後驗證：

```bash
# 檢查 NPM 上的套件
npm view kiro-doc-sync

# 安裝最新版本
npm install -g kiro-doc-sync

# 驗證命令可用
kiro-doc-sync --version
```

## 常見問題

### 發佈失敗：403 Forbidden

- 檢查 NPM token 是否有效
- 確認 GitHub Secrets 中的 `NPM_TOKEN` 已正確設定
- 檢查套件名稱是否已被佔用

### 發佈失敗：401 Unauthorized

- 重新登入 NPM：`npm login`
- 檢查 NPM token 是否過期

### 如何撤回已發佈的版本

```bash
npm unpublish kiro-doc-sync@1.0.0
```

注意：只能撤回 24 小時內發佈的版本。

## 更新已發佈的套件

1. 修改程式碼
2. 更新版本號：`npm version patch`
3. 提交並推送：`git push && git push --tags`
4. GitHub Actions 會自動發佈新版本

## 相關資源

- [NPM 官方文件](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions 文件](https://docs.github.com/en/actions)
