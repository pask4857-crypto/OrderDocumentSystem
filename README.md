# 企業訂單與文件管理系統

使用 **ASP.NET Core Web API、C#、MySQL 與 Vue 3** 開發的全端 Web 專案，提供客戶、商品、訂單管理、角色權限控制及 Word 訂單文件產生功能。

本專案以實際企業訂單管理流程為目標，除了基本的資料新增、查詢、修改與刪除，也實作 JWT 身分驗證、角色授權、庫存管理、資料庫交易與統一錯誤處理。

## 技術架構

### 後端

- C#
- .NET 8 / ASP.NET Core Web API
- Entity Framework Core 8
- MySQL 8
- Pomelo.EntityFrameworkCore.MySql
- JWT Bearer Authentication
- BCrypt 密碼雜湊
- Open XML SDK：產生 Word（`.docx`）文件
- Swagger / OpenAPI：API 測試與文件

### 前端

- Vue 3
- Vite
- Vue Router
- Pinia
- Axios
- JavaScript
- HTML / CSS

## 主要功能

### 1. 身分驗證與角色權限

- 使用者登入與 JWT Token 驗證。
- 使用 BCrypt 雜湊保存密碼。
- 依據 `USER` 與 `ADMIN` 角色限制操作權限。
- 前端依照登入狀態與角色控制頁面導覽及功能顯示。
- API 回應未授權或權限不足時，提供相應的錯誤處理。
- 登入狀態失效時清除本機 Token 與角色資訊，並導回登入頁面。

### 2. 客戶管理

- 查詢客戶資料。
- 新增、編輯及刪除客戶。
- 透過前端表單與後端 API 處理資料。

### 3. 商品管理

- 查詢商品清單與單筆商品。
- 新增、編輯及刪除商品。
- 依照角色限制管理操作。
- 提供輸入驗證與錯誤訊息。

### 4. 訂單管理

- 建立訂單並新增訂單明細。
- 查詢訂單清單與單筆訂單。
- 更新訂單狀態。
- 依照訂單狀態與操作權限限制相關操作。
- 建立訂單時檢查商品庫存。
- 使用資料庫交易確保訂單與庫存異動的一致性。
- 處理庫存不足及交易失敗的情況。
- 取消訂單時依照業務規則恢復商品庫存。

### 5. Word 訂單文件產生

- 依照訂單資料產生 `.docx` 文件。
- 文件包含訂單資訊、客戶資訊、訂單日期、狀態、總金額及商品明細。
- 使用 Open XML SDK 產生 Word 文件，不依賴安裝 Microsoft Word 才能建立文件。

### 6. 錯誤處理

- 使用自訂 Middleware 統一處理後端例外。
- API 依照情況回傳適當的 HTTP 狀態碼與錯誤訊息。
- 前端依照常見 HTTP 錯誤狀態提供使用者提示。
- 處理網路連線失敗、登入失效、權限不足與伺服器錯誤等情況。

## 角色與權限

| 功能                 | USER            | ADMIN           |
| -------------------- | --------------- | --------------- |
| 登入                 | 可              | 可              |
| 查詢客戶             | 依 API 授權規則 | 依 API 授權規則 |
| 查詢商品             | 可              | 可              |
| 新增、修改、刪除商品 | 不可            | 可              |
| 建立與查詢訂單       | 可              | 可              |
| 更新訂單狀態         | 不可            | 可              |
| 管理員專用 API       | 不可            | 可              |

實際權限以後端 API 的授權設定為準，前端的功能顯示僅提供操作介面控制，並非安全性授權的唯一依據。

## 專案結構

```text
web-developer-portfolio/
├── OrderDocumentSystem/
│   ├── Controllers/       # API 控制器
│   ├── Data/              # 資料庫相關程式
│   ├── Migrations/        # EF Core 資料庫遷移
│   ├── Middleware/        # 例外處理等中介軟體
│   ├── Models/            # 資料模型
│   ├── Requests/          # API 請求模型
│   ├── Responses/         # API 回應模型
│   ├── Services/          # 業務邏輯
│   ├── Program.cs
│   └── OrderDocumentSystem.csproj
│
└── order-document-frontend/
    ├── src/
    │   ├── api/           # Axios API 設定
    │   ├── layouts/       # 共用頁面配置
    │   ├── router/        # 路由與導航守衛
    │   ├── stores/        # Pinia 狀態管理
    │   └── views/         # 前端頁面
    ├── package.json
    └── vite.config.js
```

## 環境需求

- .NET SDK 8
- MySQL 8
- Node.js 22.18 以上的相容版本，或符合 `package.json` 所列條件的 Node.js 24.12 以上版本
- npm
- Git

## 本機啟動方式

### 1. 取得專案

```bash
git clone https://github.com/pask4857-crypto/OrderDocumentSystem.git
cd OrderDocumentSystem
```

### 2. 建立資料庫與套用 Migration

請先啟動 MySQL 8，建立本專案使用的資料庫，並確認資料庫帳號具有建置資料表所需的權限。

在 `OrderDocumentSystem/appsettings.Development.json` 設定 `ConnectionStrings:DefaultConnection`，填入正確的 MySQL 連線字串。

接著在後端專案目錄執行：

```bash
dotnet tool install --global dotnet-ef --version 8.*
dotnet ef database update
```

若已安裝相容版本的 `dotnet-ef`，可略過安裝指令，直接執行資料庫更新。

### 3. 設定 JWT

本專案使用 JWT（JSON Web Token）進行使用者身分驗證，並透過環境變數提供簽章金鑰，避免將敏感資訊直接寫入原始碼或提交至 GitHub。

首次建置專案時，請依照以下步驟設定 JWT 金鑰。

#### Windows PowerShell

**（1）產生隨機金鑰**

在 PowerShell 執行：

```powershell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$key = [Convert]::ToBase64String($bytes)
```

這會產生一組隨機金鑰，並暫時儲存在 `$key` 變數中。

**（2）設定使用者環境變數**

```powershell
[Environment]::SetEnvironmentVariable("Jwt__Key", $key, "User")
```

此設定會將金鑰儲存在目前 Windows 使用者的環境變數中。

設定完成後，請重新開啟終端機或 VS Code，讓新的程序讀取更新後的環境變數。

**（3）確認環境變數**

```powershell
$env:Jwt__Key
```

確認目前終端機能讀取到金鑰即可，請勿將金鑰內容公開或提交至版本控制系統。

#### JWT 其他設定

除了 `Jwt__Key`，也請確認 `Jwt:Issuer` 與 `Jwt:Audience` 的值符合後端設定。

ASP.NET Core 環境變數的雙底線 `__` 對應組態中的冒號 `:`，因此 `Jwt__Key` 對應 `Jwt:Key`。

如果專案透過環境變數提供金鑰，就不需要將實際金鑰寫入 `appsettings.json` 或 `appsettings.Development.json`。

在其他裝置上建置專案時，請另外產生並設定該裝置使用的 JWT 金鑰。使用不同金鑰的環境所簽發的 Token，預設不能互相驗證。

請勿將真實 JWT 金鑰、資料庫密碼或其他敏感資訊提交至 GitHub。

### 4. 啟動後端

在 `OrderDocumentSystem` 目錄執行：

```bash
dotnet restore
dotnet run
```

預設 HTTP 開發網址為 `http://localhost:5215`，HTTPS 開發網址為 `https://localhost:7067`。實際網址以啟動時的終端機輸出為準。

在 Development 環境中，可開啟以下網址使用 Swagger UI：

- `http://localhost:5215/swagger`
- `https://localhost:7067/swagger`

### 5. 啟動前端

另開一個終端機，在專案根目錄執行：

```bash
cd order-document-frontend
npm install
npm run dev
```

依照 Vite 終端機顯示的網址開啟前端，預設為 `http://localhost:5173`。

請確認 `src/api/http.js` 中的 Axios `baseURL` 與後端實際使用的 API 網址一致。

## 開發與驗證

### 後端

```bash
cd OrderDocumentSystem
dotnet build
```

### 前端

```bash
cd order-document-frontend
npm run build
```

前端正式環境建置可透過 `npm run build` 執行。

## 開發重點

本專案的實作重點不僅是 CRUD，還包括：

- 使用 JWT 與角色授權保護 API。
- 將控制器、業務邏輯與資料存取相關程式分層。
- 使用資料庫交易處理訂單建立及庫存異動。
- 處理驗證失敗、庫存不足、未授權與伺服器例外。
- 產生可供下載的 Word 訂單文件。
- 使用 Vue Router、Pinia 與 Axios 建立前後端整合的管理介面。

## 注意事項

- 本專案為個人作品集與學習用途。
- 請勿將正式環境密碼、JWT 金鑰或其他敏感資訊提交至版本控制。
- 實際執行前，請先確認 MySQL 資料庫、後端設定及前端 API 網址。

## 示範資料庫建置

本專案提供 SQL 初始化檔案，可用於建立獨立的示範資料庫，無須沿用開發環境中的既有資料。

### 1. 建立資料庫

1. 啟動 MySQL Server。
2. 使用 MySQL Workbench 連線至 MySQL。
3. 開啟 `database/setup_demo.sql`。
4. 執行整份 SQL，建立 `order_document_demo` 資料庫及示範資料。

### 2. 設定後端連線

在 `OrderDocumentSystem/appsettings.Development.json` 設定 MySQL 連線字串，並將資料庫名稱設為 `order_document_demo`。

請依照自己的環境填入 MySQL 帳號、密碼及 JWT 金鑰。請勿將包含真實憑證的設定檔提交至 GitHub。

### 3. 示範登入帳號

| 角色       | 帳號         | 密碼            |
| ---------- | ------------ | --------------- |
| 一般使用者 | `demo_user`  | `DemoUser123!`  |
| 管理員     | `demo_admin` | `DemoAdmin123!` |

以上帳號僅供本機示範與功能測試使用，不適用於正式環境。

### 4. 啟動專案

後端：

```powershell
cd OrderDocumentSystem
dotnet restore
dotnet run
```

前端：

```powershell
cd order-document-frontend
npm install
npm run dev
```

依照 Vite 顯示的網址開啟前端頁面，登入後即可測試客戶、商品、訂單及文件產生功能。
