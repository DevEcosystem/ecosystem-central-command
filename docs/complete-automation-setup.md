# 🤖 完全自動化セットアップガイド

このガイドでは、新リポジトリ作成時に**完全自動**でecosystemが更新される仕組みを設定します。

## 🚀 クイックセットアップ（推奨）

### 1. 自動Webhook設定の実行

```bash
# GitHub Tokenが設定されていることを確認
export GITHUB_TOKEN=ghp_your_personal_access_token

# 自動設定を実行
npm run ecosystem:webhook-setup-auto
```

これにより：
- ✅ 全Organization（DevBusinessHub、DevPersonalHub等）にWebhookを自動設定
- ✅ 新リポジトリ作成時に自動でecosystem更新がトリガー
- ✅ 手動操作は一切不要

### 2. 設定確認

```bash
cat docs/webhook-config.json
```

## 📋 手動セットアップ（必要な場合）

自動設定で権限エラーが出た場合：

### 各Organizationで手動設定

1. **Organization Settings → Webhooks → Add webhook**

2. **設定内容**：
   ```
   Payload URL: https://ecosystem-webhook-proxy.vercel.app/webhook/[ORG_NAME]
   Content type: application/json
   Secret: [webhook-config.jsonのwebhook_secretを使用]
   ```

3. **イベント選択**：
   - ✅ Repositories
   - ✅ Pushes

## 🔄 動作フロー

```
新リポジトリ作成
    ↓
Organization Webhook発火
    ↓
Webhook Proxy受信
    ↓
GitHub Actions Workflow Dispatch
    ↓
ecosystem-auto-sync実行
    ↓
README自動更新・プッシュ
```

## 🧪 動作テスト

### 1. Webhook設定の確認
```bash
# 設定されたWebhookを確認
cat docs/webhook-config.json
```

### 2. 手動トリガーテスト
```bash
node automation/webhook-auto-setup.js --trigger-test
```

### 3. 実際のテスト
1. 任意のOrganizationで新リポジトリを作成
2. GitHub Actions → ecosystem-auto-syncワークフローを確認
3. 自動的に実行されることを確認

## 🔧 トラブルシューティング

### Webhook設定エラー
```
Error: Not Found
```
→ Organization管理者権限が必要です

### Workflow実行されない
1. Personal Access Tokenの権限確認：
   - `repo` スコープ
   - `workflow` スコープ
   - `admin:org` スコープ（webhook設定用）

2. Repository Secretsの確認：
   ```
   Settings → Secrets → Actions
   PERSONAL_GITHUB_TOKEN が設定されているか
   ```

### Webhook Proxyエラー
Vercelにデプロイが必要：
```bash
cd webhook-proxy
npm install -g vercel
vercel --prod
```

## ✅ 完全自動化の確認ポイント

1. **Webhook設定**: 各Organizationに設定済み
2. **GitHub Actions**: PERSONAL_GITHUB_TOKEN設定済み
3. **Workflow Triggers**: repository_dispatch対応済み
4. **Proxy Service**: Webhook転送サービス稼働中

## 🎉 完成！

これで以下が実現されます：
- 新リポジトリ作成 → **即座に自動検出**
- 統計更新 → **自動実行**
- README更新 → **自動コミット・プッシュ**
- **手動操作ゼロ**の完全自動化

---

詳細な技術仕様は `/docs/ecosystem-complete-automation.md` を参照してください。