# 🚀 GitHub Actions自動化システム セットアップガイド

*GitHub Ecosystem一元管理のための完全なGitHub Actions設定手順*

## 📋 概要

このガイドでは、GitHub Actionsを使用して多組織リポジトリの自動化システムを構築する方法を説明します。

### 実現される機能
- **日次自動更新**: 毎日6:00 AM UTCに統合ダッシュボード更新
- **リアルタイム同期**: コード変更時の自動トリガー
- **メトリクス収集**: 全組織からのデータ統合
- **外部統合**: 外部リポジトリの追跡・分析
- **健康監視**: システム状況の自動チェック

---

## 🛠️ 前提条件

### 必要な要素
- [ ] **GitHub Organization**: 統合管理対象の組織
- [ ] **Central Repository**: 自動化スクリプトを配置するメインリポジトリ
- [ ] **Node.js Scripts**: メトリクス収集・ポートフォリオ生成スクリプト
- [ ] **package.json + package-lock.json**: npm依存関係管理

### 権限要件
- [ ] **Repository Admin**: ワークフロー作成・設定変更権限
- [ ] **Organization Member**: 統合対象組織へのアクセス権
- [ ] **Personal Access Token**: 外部API統合用（オプション）

---

## 🏗️ Phase 1: リポジトリ権限設定

### Step 1: Workflow Permissions設定
```bash
# GitHubリポジトリのSettings > Actions > General
1. リポジトリのSettingsタブにアクセス
2. 左サイドバー: Actions > General
3. Workflow permissions:
   ✅ Read and write permissions を選択
   ✅ Allow GitHub Actions to create and approve pull requests にチェック
4. Save ボタンをクリック
```

**重要**: この設定なしでは `exit code 128` エラーが発生します。

### Step 2: Actions有効化確認
```bash
# リポジトリでActionsが有効化されているか確認
Settings > Actions > General > Actions permissions:
✅ Allow all actions and reusable workflows
```

---

## 📁 Phase 2: 必要ファイルの準備

### Step 1: package.json作成
```json
{
  "name": "ecosystem-central-command",
  "version": "1.0.0",
  "description": "Central command dashboard for development ecosystem",
  "scripts": {
    "generate-portfolio": "node automation/portfolio-generator.js",
    "collect-metrics": "node automation/metrics-collector.js",
    "update-external": "node automation/github-api-integration.js",
    "update-ecosystem": "node automation/ecosystem-unified-automation.js"
  },
  "dependencies": {},
  "devDependencies": {},
  "keywords": ["ecosystem", "portfolio", "automation", "analytics"],
  "author": "Dev Ecosystem",
  "license": "MIT"
}
```

### Step 2: package-lock.json作成
```json
{
  "name": "ecosystem-central-command",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "ecosystem-central-command",
      "version": "1.0.0",
      "license": "MIT"
    }
  }
}
```

**重要**: package-lock.jsonがないと npm cache エラーが発生します。

### Step 3: 自動化スクリプト配置
```bash
automation/
├── metrics-collector.js           # メトリクス収集
├── portfolio-generator.js         # ダッシュボード生成
├── github-api-integration.js      # 外部統合
└── ecosystem-unified-automation.js # 統合実行
```

---

## ⚙️ Phase 3: GitHub Actionsワークフロー作成

### Step 1: ワークフローファイル作成
```bash
# ディレクトリ作成
.github/workflows/portfolio-update.yml
```

### Step 2: 基本ワークフロー構成
```yaml
name: Portfolio Auto-Update

on:
  # 自動実行トリガー
  push:
    branches: [main]
    paths:
      - 'organizations/**'
      - 'analytics/**'
      - 'career/**'
  
  # スケジュール実行（毎日6:00 AM UTC）
  schedule:
    - cron: '0 6 * * *'
  
  # 手動実行
  workflow_dispatch:

# 🔑 重要: 権限設定
permissions:
  contents: write
  actions: read

jobs:
  update-portfolio:
    runs-on: ubuntu-latest
```

### Step 3: チェックアウト設定
```yaml
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}
        persist-credentials: true  # 🔑 重要: git push権限
```

### Step 4: Node.js環境セットアップ
```yaml
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'  # package-lock.json必須

    - name: Install dependencies
      run: |
        if [ -f package.json ]; then
          npm ci
        else
          npm install --save-dev fs path
        fi
```

### Step 5: 自動化スクリプト実行
```yaml
    - name: Collect metrics
      run: |
        echo "📊 Collecting ecosystem metrics..."
        node automation/metrics-collector.js

    - name: Update external integrations
      run: |
        echo "🔗 Updating external repository integrations..."
        node automation/github-api-integration.js

    - name: Generate portfolio
      run: |
        echo "🚀 Generating updated portfolio..."
        node automation/portfolio-generator.js

    - name: Run unified automation
      run: |
        echo "🤖 Running complete ecosystem automation..."
        node automation/ecosystem-unified-automation.js
```

### Step 6: 変更検知・コミット
```yaml
    - name: Check for changes
      id: verify-changed-files
      run: |
        if git diff --quiet; then
          echo "No changes detected"
          echo "changed=false" >> $GITHUB_OUTPUT
        else
          echo "Changes detected"
          echo "changed=true" >> $GITHUB_OUTPUT
        fi

    - name: Commit and push changes
      if: steps.verify-changed-files.outputs.changed == 'true'
      run: |
        git config --global user.email "action@github.com"
        git config --global user.name "GitHub Action"
        
        git add README.md || true
        git add AUTOMATION_SUMMARY.md || true
        git add analytics/ || true
        git add organizations/ || true
        
        TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
        git commit -m "🤖 Auto-update ecosystem portfolio - $TIMESTAMP" || exit 0
        git push origin HEAD:main
```

### Step 7: 実行サマリー生成
```yaml
    - name: Create deployment summary
      if: steps.verify-changed-files.outputs.changed == 'true'
      uses: actions/github-script@v7
      with:
        script: |
          const timestamp = new Date().toISOString();
          
          const summary = `## 🤖 Ecosystem Automation Summary
          
          **Execution Time**: ${timestamp}
          **Status**: ✅ Successfully Completed
          **Updated Components**: 
          - 📊 Metrics collection from all organizations
          - 🔗 External repository integration refresh
          - 🎨 Unified portfolio dashboard generation
          - 🏥 Ecosystem health monitoring update
          
          **Next Scheduled Run**: Tomorrow at 6:00 AM UTC
          **Manual Trigger**: Available via Actions tab
          
          ---
          *Automated by GitHub Actions Ecosystem Management*`;
          
          core.summary.addRaw(summary);
          await core.summary.write();
```

---

## 🏥 Phase 4: ヘルスチェック機能

### 健康監視ジョブ
```yaml
  # ヘルスチェックジョブ
  ecosystem-health-check:
    runs-on: ubuntu-latest
    needs: update-portfolio
    if: always()
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Validate ecosystem structure
      run: |
        echo "🔍 Validating ecosystem structure..."
        
        REQUIRED_FILES=(
          "README.md"
          "AUTOMATION_SUMMARY.md"
          "package.json"
          "organizations/business-hub-overview.md"
          "organizations/personal-lab-showcase.md"
          "organizations/academic-hub-achievements.md"
          "organizations/external-collaborations.md"
        )
        
        for file in "${REQUIRED_FILES[@]}"; do
          if [ -f "$file" ]; then
            echo "✅ $file exists"
          else
            echo "❌ $file missing"
            exit 1
          fi
        done

    - name: Check automation health
      run: |
        echo "🏥 Checking automation system health..."
        
        AUTOMATION_SCRIPTS=(
          "automation/metrics-collector.js"
          "automation/portfolio-generator.js"
          "automation/github-api-integration.js"
          "automation/ecosystem-unified-automation.js"
        )
        
        for script in "${AUTOMATION_SCRIPTS[@]}"; do
          if [ -f "$script" ]; then
            echo "✅ $script available"
          else
            echo "❌ $script missing"
            exit 1
          fi
        done
```

---

## 🚀 Phase 5: デプロイメント・テスト

### Step 1: 初回手動実行
```bash
1. GitHub リポジトリのActionsタブにアクセス
2. Portfolio Auto-Update ワークフローを選択
3. Run workflow ボタンをクリック
4. 実行結果を確認
```

### Step 2: 実行結果確認項目
```bash
✅ Status: Success
✅ Total duration: 20-30秒程度
✅ update-portfolio: ✓
✅ ecosystem-health-check: ✓
✅ Job summary: 自動化サマリー表示
```

### Step 3: 自動実行確認
```bash
# 次回実行確認方法
1. Actionsタブで実行履歴確認
2. 毎日6:00 AM UTCに自動実行
3. コード変更時の自動トリガー確認
```

---

## 🐛 トラブルシューティング

### よくあるエラーと解決法

#### 1. Exit Code 128 (Git Push失敗)
```bash
問題: push権限不足
解決: 
- Settings > Actions > General > Workflow permissions
- "Read and write permissions" を選択
- workflow.ymlにpermissions: contents: write を追加
```

#### 2. NPM Cache Error
```bash
問題: package-lock.json不足
解決:
- package-lock.jsonファイルを作成
- npm ci コマンドが正常実行されるよう設定
```

#### 3. Script Execution Failed
```bash
問題: 自動化スクリプトエラー
解決:
- automation/ディレクトリ内のスクリプト確認
- Node.js構文エラー修正
- ファイルパス設定確認
```

#### 4. Permission Denied
```bash
問題: Organization アクセス権限不足
解決:
- Personal Access Token のスコープ確認
- Organization membership 確認
- Repository access 権限確認
```

### デバッグ手順
```bash
1. Actions タブでログ詳細確認
2. 個別ステップのエラーメッセージ分析
3. ローカルでスクリプト動作テスト
4. 段階的にワークフロー修正・テスト
```

---

## 🔧 カスタマイズ・拡張

### スケジュール変更
```yaml
# 実行頻度変更例
schedule:
  - cron: '0 */6 * * *'  # 6時間毎
  - cron: '0 9 * * 1'    # 毎週月曜9:00 AM
  - cron: '0 6 1 * *'    # 毎月1日6:00 AM
```

### トリガー条件拡張
```yaml
on:
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - 'docs/**'
      - 'config/**'
  pull_request:
    branches: [main]
```

### 通知設定追加
```yaml
    - name: Notify completion
      if: always()
      uses: actions/github-script@v7
      with:
        script: |
          // Slack, Discord, Email通知など
          console.log('Automation completed');
```

---

## 📊 成功指標・監視

### 自動化成功の確認項目
- [ ] **実行成功率**: 95%以上
- [ ] **実行時間**: 30秒以内
- [ ] **生成ファイル**: README.md, AUTOMATION_SUMMARY.md更新
- [ ] **スケジュール実行**: 毎日定時実行
- [ ] **エラー監視**: ヘルスチェック通過

### 長期運用監視
```bash
# 定期確認項目
1. 月次実行履歴レビュー
2. エラー発生パターン分析
3. 実行時間トレンド監視
4. 生成コンテンツ品質確認
5. システム依存関係更新
```

---

## 🔐 セキュリティ・ベストプラクティス

### 権限管理
```yaml
# 最小権限の原則
permissions:
  contents: write        # ファイル更新に必要最小権限
  actions: read         # ワークフロー実行に必要
  # その他の権限は付与しない
```

### シークレット管理
```bash
# Personal Access Token の管理
1. Repository Settings > Secrets and variables > Actions
2. 有効期限設定（90日推奨）
3. 最小スコープ設定
4. 定期的なローテーション
```

### コード品質
```bash
# 自動化スクリプトの品質管理
1. エラーハンドリング実装
2. ログ出力の充実
3. テストカバレッジ確保
4. 依存関係の定期更新
```

---

## 📚 参考資料・関連リンク

### 公式ドキュメント
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)

### 実装例
- [DevEcosystem/ecosystem-central-command](https://github.com/DevEcosystem/ecosystem-central-command) - 完全実装例
- [Actions実行履歴](https://github.com/DevEcosystem/ecosystem-central-command/actions) - 実際の動作確認

### コミュニティリソース
- [GitHub Actions Community](https://github.community/c/github-actions)
- [Awesome GitHub Actions](https://github.com/sdras/awesome-actions)

---

## 🎯 チェックリスト

### 初期セットアップ
- [ ] Repository権限設定完了
- [ ] package.json + package-lock.json作成
- [ ] 自動化スクリプト配置
- [ ] ワークフローファイル作成
- [ ] 初回手動実行成功

### 運用開始
- [ ] スケジュール実行確認
- [ ] 自動トリガー動作確認
- [ ] ヘルスチェック通過
- [ ] 生成ファイル品質確認
- [ ] エラー監視体制確立

### 長期運用
- [ ] 月次実行レビュー実施
- [ ] 依存関係更新管理
- [ ] セキュリティ監査実施
- [ ] パフォーマンス最適化
- [ ] ドキュメント更新継続

---

*作成日: 2025-07-12*  
*対象システム: GitHub Ecosystem一元管理*  
*成功実績: 4組織・9リポジトリ統合自動化*  
*次回レビュー: 1ヶ月後（機能拡張・改善検討）*