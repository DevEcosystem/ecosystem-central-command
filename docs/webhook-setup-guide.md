# 🔗 Webhook設定ガイド

新リポジトリ作成時に自動でecosystemを更新するための設定手順です。

## 📋 各Organizationでの設定手順

### 1. Organization Webhook設定

各Organization（DevBusinessHub、DevPersonalHub、DevAcademicHub、DevEcosystem）で以下を設定：

1. **Organization Settings → Webhooks → Add webhook**

2. **Webhook設定**:
   ```
   Payload URL: https://api.github.com/repos/DevEcosystem/ecosystem-central-command/dispatches
   Content type: application/json
   Secret: (空欄でOK)
   ```

3. **イベント選択**:
   - ✅ Repositories (repository created, deleted, archived, unarchived, publicized, privatized)
   - ✅ Pushes (optional - for immediate updates)

4. **Active**: ✅ チェック

### 2. GitHub App/Actionを使用した自動トリガー

より簡単な方法として、GitHub ActionsのWorkflow APIを使用：

```bash
# 新リポジトリ作成後に手動で実行
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_PAT" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/DevEcosystem/ecosystem-central-command/dispatches \
  -d '{"event_type":"repository-created","client_payload":{"repository":"new-repo-name"}}'
```

### 3. 代替案：GitHub Actionsトリガー拡張

ecosystem-central-commandのワークフローに追加のトリガーを設定済み：
- `repository_dispatch` イベントタイプ：
  - `ecosystem-sync`
  - `repository-created`
  - `repository-deleted`

## 🚀 即座に反映させる方法

### 方法1: 手動ワークフロー実行（最も簡単）
1. https://github.com/DevEcosystem/ecosystem-central-command/actions
2. "🔄 Ecosystem Auto-Sync" → "Run workflow"

### 方法2: APIでトリガー
```bash
# PERSONAL_GITHUB_TOKENを使用
curl -X POST \
  -H "Authorization: token ghp_YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/DevEcosystem/ecosystem-central-command/actions/workflows/ecosystem-auto-sync.yml/dispatches \
  -d '{"ref":"main"}'
```

### 方法3: ローカルWebhookサーバー
```bash
# Webhookサーバーを起動
npm run ecosystem:webhook

# 別のOrganization webhookから、このサーバーへ転送
```

## 📝 現在の自動実行タイミング

1. **定期実行**: 毎日午前6時（UTC）
2. **手動実行**: GitHub Actions UI から
3. **設定変更時**: automation/* ファイル更新時
4. **Webhook経由**: Organization webhook設定後（要設定）

## ⚡ 推奨設定

最もシンプルな運用：
1. 新リポジトリ作成後、GitHub Actions UIから手動実行
2. または、毎日の自動実行を待つ
3. 頻繁に新リポジトリを作成する場合のみWebhook設定

---

詳細な技術情報は `/docs/ecosystem-complete-automation.md` を参照してください。