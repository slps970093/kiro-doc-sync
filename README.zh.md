# Kiro Doc Sync

一個跨平台的 CLI 工具，用於將遠端 Git 倉庫中的 Kiro 文件同步到本地專案的 `.kiro/steering/` 目錄。

## 功能特性

- ✓ 跨平台支援（Windows、macOS、Linux）
- ✓ 稀疏檢出（Sparse Checkout）以提高同步效率
- ✓ 基於模式的文件選擇
- ✓ 互動模式用於文件衝突解決
- ✓ 可配置的文件覆蓋行為
- ✓ 自動建立目錄
- ✓ 完整的錯誤處理
- ✓ 臨時文件自動清理

## 安裝

```bash
npm install
npm run build
```

## 快速開始

1. 在專案根目錄建立 `kiro-doc-sync.cfg.json` 配置文件：

```json
{
  "general": {
    "files": {
      "sync_override": true
    }
  },
  "docs": [
    {
      "git": "https://github.com/user/repo.git",
      "steering": [
        "api/*.global.md",
        "php/di.md"
      ]
    }
  ]
}
```

2. 執行同步：

```bash
npm start
```

## 使用方法

### 基本命令

```bash
kiro-doc-sync
```

根據當前目錄中的預設 `kiro-doc-sync.cfg.json` 同步文件。

### 命令選項

```bash
kiro-doc-sync [options]
```

| 選項 | 簡寫 | 說明 |
|------|------|------|
| `--config <path>` | `-c` | 配置文件路徑（預設：`kiro-doc-sync.cfg.json`） |
| `--project <path>` | `-p` | 專案根目錄（預設：當前目錄） |
| `--interactive` | `-i` | 當文件已存在時詢問確認 |
| `--help` | `-h` | 顯示幫助信息 |
| `--version` | `-v` | 顯示版本 |

### 使用範例

```bash
# 使用預設配置
kiro-doc-sync

# 使用自定義配置文件
kiro-doc-sync --config ./config/sync.json

# 使用自定義專案目錄
kiro-doc-sync --project /path/to/project

# 組合選項
kiro-doc-sync -c config.json -p /home/user/proj

# 互動模式（覆蓋前詢問）
kiro-doc-sync --interactive

# 互動模式搭配自定義配置
kiro-doc-sync -i -c ./sync.cfg.json
```

## 配置

### 配置文件格式

在專案根目錄建立 `kiro-doc-sync.cfg.json`：

```json
{
  "general": {
    "files": {
      "sync_override": boolean
    }
  },
  "docs": [
    {
      "git": "string (Git 倉庫 URL)",
      "steering": [
        "string (相對於倉庫根目錄的文件模式)"
      ]
    }
  ]
}
```

### 配置選項說明

#### `general.files.sync_override`

- **型別**: `boolean`
- **預設值**: `true`
- **說明**: 控制文件覆蓋行為
  - `true`: 總是覆蓋已存在的文件
  - `false`: 跳過已存在的文件（除非使用 `--interactive` 模式）

#### `docs[].git`

- **型別**: `string`
- **必需**: 是
- **說明**: 要同步的 Git 倉庫 URL

#### `docs[].steering`

- **型別**: `string[]`
- **必需**: 是
- **說明**: 要同步的文件模式陣列（相對於倉庫根目錄）

#### `docs[].branch`

- **型別**: `string`
- **必需**: 否
- **說明**: 要同步的 Git 分支（預設：預設分支）

#### `docs[].tag`

- **型別**: `string`
- **必需**: 否
- **說明**: 要同步的 Git 標籤（優先於分支）

### 配置範例

**簡單的單一倉庫配置：**

```json
{
  "general": {
    "files": {
      "sync_override": true
    }
  },
  "docs": [
    {
      "git": "https://github.com/myorg/docs.git",
      "steering": ["api/reference.md", "guides/*.md"]
    }
  ]
}
```

**多個倉庫配置：**

```json
{
  "general": {
    "files": {
      "sync_override": false
    }
  },
  "docs": [
    {
      "git": "https://github.com/myorg/api-docs.git",
      "steering": ["api/*.md"],
      "branch": "develop"
    },
    {
      "git": "https://github.com/myorg/guides.git",
      "steering": ["php/di.md", "patterns/*.md"],
      "tag": "v1.0.0"
    }
  ]
}
```

## 工作原理

1. **解析配置**: 讀取並驗證 `kiro-doc-sync.cfg.json` 設定
2. **建立目錄**: 如果不存在則建立 `.kiro/steering/` 目錄
3. **稀疏檢出**: 對於每個 Git 倉庫：
   - 使用 `--depth 1` 進行淺層克隆
   - 使用 Git 稀疏檢出只下載指定的文件
   - 將文件複製到 `.kiro/steering/`
4. **處理衝突**: 
   - 若 `sync_override: true`，覆蓋已存在的文件
   - 若 `sync_override: false`：
     - 非互動模式：跳過已存在的文件
     - 互動模式（`-i`）：逐個詢問使用者
5. **清理**: 刪除臨時克隆的倉庫

## 輸出範例

工具在執行過程中提供清晰的反饋：

```
Project root: /path/to/project
Config file: kiro-doc-sync.cfg.json
Found 2 doc source(s)

Loading configuration...
Cloning https://github.com/user/repo.git with sparse-checkout...
✓ Synced: api/reference.md
⊘ Skipped (exists): guides/intro.md

==================================================
Sync completed. 1 files synced, 1 errors
Synced files:
  • api/reference.md
Errors:
  • File not found in repo: docs/missing.md
==================================================
```

## 系統需求

- Node.js 14+
- Git 已安裝且在 PATH 中可用
- 對指定 Git 倉庫的讀取權限
  - HTTPS：使用者名稱/密碼或個人存取令牌
  - SSH：SSH 金鑰已配置且 SSH agent 正在運行

### SSH 設定（可選）

如果使用 SSH URLs（例如 `git@github.com:user/repo.git`）：

**macOS/Linux：**
```bash
# 生成 SSH 金鑰（如果不存在）
ssh-keygen -t ed25519 -C "your-email@example.com"

# 將金鑰添加到 SSH agent
ssh-add ~/.ssh/id_ed25519

# 將公鑰添加到 GitHub/GitLab
cat ~/.ssh/id_ed25519.pub
```

**Windows：**
```bash
# 生成 SSH 金鑰
ssh-keygen -t ed25519 -C "your-email@example.com"

# 啟動 SSH agent
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent

# 將金鑰添加到 SSH agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519

# 將公鑰添加到 GitHub/GitLab
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

## 開發

```bash
# 安裝依賴
npm install

# 編譯 TypeScript
npm run build

# 開發模式執行
npm run dev

# 執行編譯後的版本
npm start
```

## 故障排除

### Git 未找到

確保 Git 已安裝且在系統 PATH 中可用。

### 倉庫存取被拒絕

檢查是否有讀取指定 Git 倉庫的權限。對於私有倉庫，確保 Git 認證已正確配置。

對於 SSH 倉庫，驗證：
- SSH 金鑰已生成並添加到 SSH agent
- 公鑰已添加到你的 Git 託管服務（GitHub、GitLab 等）
- SSH agent 正在運行

### 倉庫中找不到文件

驗證 `steering` 陣列中的文件模式是否與倉庫中的實際文件路徑相符（相對於倉庫根目錄）。

### `.kiro/steering/` 權限被拒絕

確保對專案目錄有寫入權限。

## 授權

MIT
