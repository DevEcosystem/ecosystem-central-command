# 🚀 Solo Entrepreneur Branch Strategy Guide

## 🎯 概要

起業を前提とした、一人でも企業レベルの品質を維持できるブランチ戦略とテンプレート集。

## 🏢 Organization別戦略

### 1. **DevBusinessHub** (顧客向けプロダクト)
**目的**: 顧客に提供するSaaS、アプリケーション  
**品質要件**: 最高レベル  
**ブランチ戦略**: Production-Grade

```
main (production) ← 本番環境デプロイ
├── staging ← ステージング環境テスト
├── develop ← 開発統合ブランチ
└── feature/TICKET-123-feature-name ← 機能開発
```

**自動化**:
- feature → develop: 自動テスト通過後マージ可能
- develop → staging: 自動デプロイ + E2Eテスト
- staging → main: 手動承認 + 自動本番デプロイ

### 2. **DevPersonalHub** (実験・学習)
**目的**: 技術検証、学習プロジェクト  
**品質要件**: 中程度  
**ブランチ戦略**: Safe Experimentation

```
main (stable) ← 安定版
├── develop/ai-integration ← AI実験
├── develop/ui-experiment ← UI実験
└── develop/performance-test ← パフォーマンス実験
```

**自動化**:
- develop/* → main: 基本テスト通過で自動マージ
- 実験別の分離デプロイ
- 自動フォーマット・リント修正
- 失敗実験の自動クリーンアップ

### 3. **DevAcademicHub** (研究・論文)
**目的**: 学術研究、論文、ドキュメント  
**品質要件**: トレーサビリティ重視  
**ブランチ戦略**: Academic Research

```
main (published) ← 公開版
├── develop/machine-learning ← ML研究開発
├── develop/data-analysis ← データ分析開発
├── draft ← 査読前準備
└── research/deep-learning ← 純粋研究
```

**自動化**:
- develop/* → draft: 自動テスト・プレビュー生成
- draft → main: 査読後の手動マージ
- 研究トピック別の分離開発
- 自動プレビュー生成
- バージョン管理
- GitHub Pages自動公開

### 4. **DevEcosystem** (インフラ・ツール)
**目的**: 開発ツール、自動化スクリプト  
**品質要件**: 高い安定性  
**ブランチ戦略**: Infrastructure-Safe

```
main (stable) ← 安定版
├── staging ← 検証環境
├── develop ← 開発統合ブランチ
└── feature/automation-improvement ← 改善ブランチ
```

**自動化**:
- feature → develop: 自動テスト通過後マージ
- develop → staging: 統合テスト + 影響範囲分析
- staging → main: 手動承認 + 段階的デプロイ
- ロールバック機能
- インフラ影響度評価

## 📋 Repository種別とテンプレート

### 🛡️ Production Repository Template

**用途**: 顧客向けSaaS、重要なアプリケーション  
**ファイル**: `templates/branch-strategy/production-workflow.yml`

**特徴**:
- 3段階デプロイ (dev → staging → production)
- 必須コードレビュー
- 自動セキュリティスキャン
- 包括的テストスイート

**セットアップコマンド**:
```bash
./templates/branch-strategy/repository-setup-script.sh production my-saas-app DevBusinessHub
```

### ⚡ Rapid Development Template

**用途**: 実験、MVP、個人プロジェクト  
**ファイル**: `templates/branch-strategy/rapid-development-workflow.yml`

**特徴**:
- 軽量な品質チェック
- 自動フォーマット・修正
- 即座デプロイ
- 警告許容（エラーは阻止）

**セットアップコマンド**:
```bash
./templates/branch-strategy/repository-setup-script.sh rapid experiment-app DevPersonalHub
```

### 📚 Documentation Template

**用途**: 研究、論文、ドキュメント  
**特徴**:
- 自動プレビュー
- GitHub Pages統合
- バージョン管理
- 査読ワークフロー

**セットアップコマンド**:
```bash
./templates/branch-strategy/repository-setup-script.sh documentation research-paper DevAcademicHub
```

## 🔧 ワンクリックセットアップ

### 新しいリポジトリの作成

```bash
# 1. リポジトリ作成（GitHub CLI使用）
gh repo create DevBusinessHub/my-new-saas --private

# 2. クローン
git clone https://github.com/DevBusinessHub/my-new-saas.git
cd my-new-saas

# 3. ブランチ戦略セットアップ
../ecosystem-central-command/templates/branch-strategy/repository-setup-script.sh production my-new-saas DevBusinessHub

# 4. 完了！
```

### 既存リポジトリへの適用

```bash
# 既存リポジトリディレクトリで実行
./path/to/repository-setup-script.sh production existing-repo DevBusinessHub
```

## 🛡️ ブランチ保護設定

### GitHub UIでの手動設定手順

#### 1. **基本手順**
1. GitHub → **Repository** Settings → Rulesets
2. **New ruleset** → **New branch ruleset**
3. Ruleset name: Organization別推奨名
4. Enforcement status: **Enabled** (有効化)

#### 2. **推奨Ruleset名（Repository Level）**
```
• DevBusinessHub: "Production-Grade Protection"
• DevEcosystem: "Infrastructure Protection"
• DevPersonalHub: "Individual Development Protection"  
• DevAcademicHub: "Individual Development Protection"

※ 全てRepository Level設定（無料アカウント対応）
```

#### 3. **Targets設定** ⚠️重要
```
Branch targeting criteria:
1. 個別に指定（推奨）:
   - main
   - staging  
   - develop

❌ 避けるべき設定:
   - "All branches" → 不要なブランチも保護される
```
※ 必要なブランチのみ個別指定（効率的）
※ これを設定しないとルールが適用されません
※ feature/* や test/* は保護対象外にする

#### 4. **Repository Level vs Organization Level**
```
⚠️ 重要: Organization Level Rulesetsの制限

Organization Level Rulesetsは有料プラン(GitHub Team)が必要です。
無料アカウントでは利用できません。

現在の設定方針:
✅ 全Organization: Repository Level設定
  - 各リポジトリで個別にRuleset設定
  - 無料で利用可能
  - リポジトリ固有のカスタマイズ可能
```

#### 5. **Rules設定**

##### **Production Level (DevBusinessHub, DevEcosystem)**
```
✅ Require a pull request before merging
  - Required approvals: 1
  - Dismiss stale reviews: Yes

❌ Require status checks to pass (初期は無効)
  - 後でCI/CD実行後に quality-check を追加

✅ Block force pushes
✅ Restrict deletions
```

##### **Individual Development Level (DevPersonalHub, DevAcademicHub)**
```
Repository Level設定:

✅ Require a pull request before merging
  - Required approvals: 0 (効率重視)
  - DevAcademicHub: 査読が必要な場合のみ1に変更

❌ Require status checks to pass (初期は無効)
  - 後でCI/CD実行後に追加:
    • DevPersonalHub: quick-check
    • DevAcademicHub: quick-check

✅ Block force pushes
✅ Restrict deletions

Target branches:
  - main, develop/*, draft (DevAcademicHub)
  - main, develop/* (DevPersonalHub)
```

### 6. **Status Checks追加 (CI/CD実行後)**

ワークフローが一度実行された後に追加：
```json
{
  "DevBusinessHub": ["quality-check"],
  "DevEcosystem": ["quality-check"], 
  "DevPersonalHub": ["quick-check"],
  "DevAcademicHub": ["quick-check"]
}
```

### 7. **段階的展開戦略**

#### **Phase 1: Repository Level統一 (無料アカウント対応)**
```
全Organization: Repository Level設定
• DevBusinessHub各リポジトリ → "Production-Grade Protection"
• DevEcosystem各リポジトリ → "Infrastructure Protection"
• DevPersonalHub各リポジトリ → "Individual Development Protection"
• DevAcademicHub各リポジトリ → "Individual Development Protection"
```

#### **Phase 2: 標準化**
```
成功パターンの横展開:
• 同一Organization内での設定統一
• 新規リポジトリの自動適用
• テンプレート化とドキュメント整備
```

#### **Phase 3: 最適化 (将来)**
```
運用データに基づく改善:
• 保護レベルの調整
• ワークフロー効率化
• チーム拡大時の組織再編対応
```

### 8. **一人チームでの推奨設定**

#### **最小限（効率重視）**
- ✅ Pull request required
- ❌ Required approvals: 0
- ✅ Force push禁止
- ✅ Delete禁止

#### **企業レベル（将来性重視）**
- ✅ Pull request required
- ✅ Required approvals: 1（自己レビュー習慣化）
- ✅ Status checks (CI/CD通過必須)
- ✅ Force push禁止
- ✅ Delete禁止

### ⚠️ よくある問題と解決法

**Q: "Required status checks cannot be empty"エラー**
```
A: 初期はStatus checksを無効にして、CI/CD実行後に追加
```

**Q: "This ruleset does not target any resources"警告**
```
A: Targetsセクションでブランチ名（main）を必ず設定
```

**Q: "All branches"を選択すると問題ある？**
```
A: 削除済みブランチや一時的なブランチも保護対象になる
   必要なブランチのみ個別指定を推奨
```

**Q: 一人なのにApproval必要？**
```
A: 自己レビュー習慣化のため推奨。効率重視なら0でもOK
```

## 🚀 自動化レベル

### Level 1: Basic (全Repository)
- ✅ 自動テスト実行
- ✅ コードフォーマット
- ✅ 基本的なリント

### Level 2: Advanced (Production)
- ✅ セキュリティスキャン
- ✅ パフォーマンステスト
- ✅ E2Eテスト
- ✅ 自動デプロイ

### Level 3: Enterprise (Critical Production)
- ✅ 複数環境デプロイ
- ✅ 自動ロールバック
- ✅ 監視・アラート
- ✅ コンプライアンスチェック

## 📊 運用メトリクス

### 追跡指標
- **デプロイ頻度**: 週次/日次
- **変更失敗率**: <5%
- **復旧時間**: <1時間
- **テストカバレッジ**: >80%

### 品質ゲート
- **Production**: 全テスト通過必須
- **Rapid**: 警告OK、エラーNG
- **Documentation**: プレビュー生成成功

## 🔄 ワークフロー例

### 新機能開発 (Production)
```bash
# 1. 機能ブランチ作成
git checkout develop
git checkout -b feature/USER-123-authentication

# 2. 開発・テスト
npm run dev
npm run test

# 3. コミット・プッシュ
git add .
git commit -m "feat: add user authentication"
git push origin feature/USER-123-authentication

# 4. PR作成（自動テスト実行）
gh pr create --base develop --title "feat: add user authentication"

# 5. マージ後、自動でstaging環境にデプロイ

# 6. staging検証後、main にマージで本番デプロイ
```

### 個人学習開発 (Safe Experimentation)
```bash
# 1. 実験専用ブランチ作成
git checkout -b develop/ai-integration

# 2. 開発・即座テスト
npm run dev

# 3. コミット・プッシュ（分離デプロイ）
git add .
git commit -m "experiment: AI integration prototype"
git push origin develop/ai-integration

# 4. 成功時はmainにPR、失敗時はブランチ削除
gh pr create --base main --title "feat: AI integration"
```

## 🎯 ベストプラクティス

### 1. **コミットメッセージ規約**
```
feat: 新機能
fix: バグ修正
docs: ドキュメント
refactor: リファクタリング
test: テスト
chore: その他
```

### 2. **ブランチ命名規約**
```
feature/TICKET-123-short-description ← 本格機能開発
hotfix/CRITICAL-456-security-fix ← 緊急修正
develop/idea-name ← 実験・学習開発
research/topic-name ← 純粋研究
```

### 3. **PR/MRテンプレート**
- 変更内容の説明
- テスト方法
- 破壊的変更の有無
- スクリーンショット（UI変更時）

## 🔧 トラブルシューティング

### よくある問題

**Q: GitHub Actionsが失敗する**
```bash
# ログ確認
gh run list
gh run view [run-id]

# ローカルでのテスト
npm run test
npm run lint
```

**Q: ブランチ保護を設定したい**
```bash
# GitHub CLI での設定
gh api repos/:owner/:repo/branches/main/protection --method PUT --input protection-config.json
```

**Q: 自動デプロイが動かない**
- シークレット変数の確認
- デプロイ環境の権限確認
- ワークフローファイルの構文確認

## 🚀 次のステップ

1. **既存リポジトリへの適用**
2. **カスタムワークフローの作成**
3. **チーム拡大時の準備**
4. **監視・メトリクス強化**

---

**このガイドにより、一人でも企業レベルの開発プロセスを実現できます！**