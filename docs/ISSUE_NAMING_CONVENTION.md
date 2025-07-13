# 📋 統一Issue命名規則ガイド

## 🎯 概要

全ての開発プロジェクトで統一されたIssue命名規則を使用することで、プロジェクト間の一貫性を保ち、効率的な開発を実現します。

## 📝 基本形式

```
[絵文字] [type]: [簡潔な説明]
```

**例**: `🚀 feat: ユーザー認証機能`

## 🎭 絵文字とタイプの完全対応表

| 絵文字 | Type | 説明 | 使用場面 | 例 |
|--------|------|------|----------|-----|
| 🚀 | feat | 新機能追加 | 新しい機能の実装 | `🚀 feat: ユーザー認証機能` |
| 🐛 | fix | バグ修正 | 不具合の修正 | `🐛 fix: ログイン時のエラー` |
| 📚 | docs | ドキュメント更新 | README、API docs等 | `📚 docs: APIドキュメント追加` |
| ⚡ | perf | パフォーマンス改善 | 速度・効率の向上 | `⚡ perf: データベースクエリ最適化` |
| 🔧 | refactor | リファクタリング | コード構造の改善 | `🔧 refactor: 認証モジュール` |
| 🧪 | test | テスト追加・修正 | ユニット・統合テスト | `🧪 test: ユーザー登録テスト` |
| 🔒 | security | セキュリティ修正 | 脆弱性対応 | `🔒 security: XSS脆弱性修正` |
| 🎨 | ui | UI/UX改善 | デザイン・使いやすさ | `🎨 ui: ダッシュボードデザイン` |
| 📱 | mobile | モバイル対応 | レスポンシブ・PWA | `📱 mobile: レスポンシブ対応` |
| 🌐 | i18n | 国際化対応 | 多言語・ローカライゼーション | `🌐 i18n: 日本語ローカライゼーション` |
| 🔥 | hotfix | 緊急修正 | 本番環境の緊急対応 | `🔥 hotfix: 本番環境クリティカルバグ` |
| 💡 | idea | アイデア・提案 | 新しい提案・改善案 | `💡 idea: 新しいワークフロー提案` |
| 🗑️ | cleanup | コードクリーンアップ | 不要コード削除・整理 | `🗑️ cleanup: 未使用コード削除` |
| 📦 | deps | 依存関係更新 | ライブラリ・フレームワーク更新 | `📦 deps: React v18アップグレード` |
| 🚧 | wip | 作業中 | 進行中の作業 | `🚧 wip: ユーザー管理画面開発中` |
| ❓ | question | 質問・相談 | 技術的な質問・相談 | `❓ question: アーキテクチャ相談` |
| 🏗️ | infra | インフラ・CI/CD | 環境構築・デプロイ | `🏗️ infra: Docker環境構築` |
| 📊 | analytics | 分析・メトリクス | データ分析・監視 | `📊 analytics: ユーザー行動分析` |
| 🎯 | config | 設定変更 | 設定ファイル・環境変数 | `🎯 config: 本番環境設定更新` |
| 🔍 | research | 調査・研究 | 技術調査・実験 | `🔍 research: 新技術の調査` |

## 🏢 Organization別の推奨命名パターン

### DevBusinessHub (顧客向けプロダクト)

**特徴**: 企業レベルの品質要件、顧客影響を重視

```bash
# ✅ 推奨例
🚀 feat: [USER-123] 顧客ダッシュボード機能
🐛 fix: [BUG-456] 決済処理時のタイムアウトエラー
🔒 security: [SEC-789] ユーザーデータ暗号化強化
⚡ perf: [PERF-321] APIレスポンス時間改善

# ❌ 避けるべき例
🚀 feat: 何かの機能追加
🐛 fix: バグ修正
```

**ガイドライン**:
- チケット番号を含める（トレーサビリティ）
- ユーザー影響度を明確に
- セキュリティ関連は最優先マーキング

### DevPersonalHub (実験・学習)

**特徴**: 実験的要素、学習目的を重視

```bash
# ✅ 推奨例
💡 idea: AI統合の実験プロトタイプ
🔍 research: React Server Components学習
🧪 test: 新しいテストフレームワーク検証
🚧 wip: 機械学習モデル訓練中

# ✅ 短縮形もOK
💡 idea: AI実験
🔍 research: RSC学習
```

**ガイドライン**:
- 実験的要素を明記
- 学習目的も含める
- 失敗も貴重なデータとして記録

### DevAcademicHub (研究・論文)

**特徴**: 学術的厳密性、トレーサビリティ重視

```bash
# ✅ 推奨例
🔍 research: [ML-2024] 深層学習モデル性能評価
📚 docs: [THESIS] 研究論文第3章執筆
🧪 test: [EXP-001] 実験データ収集・分析
📊 analytics: [DATA] 統計解析結果レビュー

# 科目別パターン
🔍 research: [CS101] アルゴリズム課題実装
📚 docs: [WEB2024] 最終プロジェクト報告書
```

**ガイドライン**:
- 研究テーマ・科目コードを含める
- 実験番号で管理
- 査読・レビューも明記

### DevEcosystem (インフラ・ツール)

**特徴**: 全プロジェクト影響、安定性重視

```bash
# ✅ 推奨例
🏗️ infra: [GLOBAL] CI/CDパイプライン改善
🔧 refactor: [TEMPLATE] 共通テンプレート統一
🎯 config: [ENV] 本番環境設定更新
📦 deps: [SECURITY] 脆弱性対応依存関係更新

# 影響範囲を明記
🚀 feat: [ALL-ORGS] 共通認証ライブラリ追加
```

**ガイドライン**:
- 影響範囲を明記（GLOBAL, ALL-ORGS等）
- 安定性への影響度を考慮
- 段階的展開を前提とした設計

## 🚀 実装・設定方法

### 1. GitHub Issue Templatesの設定

各リポジトリの `.github/ISSUE_TEMPLATE/` ディレクトリに以下のファイルを配置：

```
.github/
└── ISSUE_TEMPLATE/
    ├── config.yml
    ├── feature-request.yml
    ├── bug-report.yml
    ├── documentation.yml
    └── general.yml
```

### 2. 自動セットアップスクリプト

```bash
# ecosystem-central-command から自動設定
./templates/branch-strategy/repository-setup-script.sh production my-repo DevBusinessHub
```

このスクリプトで以下が自動設定されます：
- Issue templates
- Branch protection rules  
- GitHub Actions workflows
- 基本的な設定ファイル

### 3. 既存リポジトリへの適用

```bash
# 手動でテンプレートをコピー
cp -r ecosystem-central-command/.github/ISSUE_TEMPLATE/ .github/

# テンプレートの組織別カスタマイズ
# （必要に応じてファイルを編集）
```

## 🔧 カスタマイズガイド

### Organization固有の追加設定

各Organizationの特性に応じてテンプレートをカスタマイズできます：

#### DevBusinessHub専用追加
```yaml
# feature-request.yml に追加
- type: input
  id: customer_impact
  attributes:
    label: "顧客影響度"
    description: "この機能が顧客に与える影響を評価してください"
```

#### DevAcademicHub専用追加
```yaml
# 研究用フィールド
- type: input
  id: research_topic
  attributes:
    label: "研究テーマ"
    description: "関連する研究テーマやコースを記入してください"
```

### チーム拡大時の設定

将来チームが拡大した際の準備：

```yaml
# 承認者設定
- type: checkboxes
  id: reviewers
  attributes:
    label: "レビュー担当者"
    options:
      - label: "技術リーダー"
      - label: "セキュリティ担当"
      - label: "UI/UX担当"
```

## 📊 運用メトリクス

### 追跡すべき指標

- **Issue種別分布**: どのタイプのIssueが多いか
- **解決時間**: 種別ごとの平均解決時間
- **優先度精度**: 設定した優先度の妥当性
- **Organization別傾向**: 各組織の特徴的パターン

### レビューサイクル

**月次レビュー**:
- Issue命名の一貫性チェック
- テンプレートの改善点識別
- 新しいパターンの追加検討

**四半期レビュー**:
- Organization別戦略の見直し
- テンプレートの大幅改善
- 他組織のベストプラクティス取り込み

## 🎯 ベストプラクティス

### Issue作成時のチェックリスト

- [ ] 適切な絵文字とtypeを選択
- [ ] タイトルが簡潔で分かりやすい
- [ ] 重複するIssueがないか確認
- [ ] 適切な優先度を設定
- [ ] 対象Organizationを明記
- [ ] 必要に応じてチケット番号を含める

### 効率的な検索のために

```bash
# タイプ別検索
label:bug 🐛
label:enhancement 🚀

# Organization別検索  
"DevBusinessHub" in:title
"DevAcademicHub" in:title

# 優先度別検索
"Critical" in:title
"🔥" in:title
```

## ⚠️ よくある問題と解決法

**Q: 絵文字が表示されない**
```
A: GitHub、IDE、ブラウザが絵文字表示に対応していることを確認
```

**Q: どのタイプを選ぶべきか迷う**
```
A: 影響度の大きい順：security > hotfix > feat > fix > others
```

**Q: Organization名が長すぎる**
```
A: 短縮形を使用：DevBiz, DevPer, DevAca, DevEco
```

## 🌿 Branch命名規則

### 基本形式

IssueからBranchへの自動変換により、トレーサビリティを確保します。

```
feature/[PROJECT-PREFIX]-[ISSUE-NUMBER]-[short-description]
hotfix/[PROJECT-PREFIX]-[ISSUE-NUMBER]-[short-description]
```

**重要**: `[ISSUE-NUMBER]` はGitHub Issue番号を使用（連番ではない）

### Project Prefix 対応表

| Organization | Project | Prefix | 例 |
|--------------|---------|--------|-----|
| DevBusinessHub | 一般プロダクト | USER, BUG, SEC | `feature/USER-123-authentication` |
| DevBusinessHub | DevFlow Orchestrator | DEVFLOW | `feature/DEVFLOW-123-architecture-design` |
| DevPersonalHub | 実験プロジェクト | EXP, ML, AI | `feature/EXP-456-ai-integration` |
| DevAcademicHub | 研究プロジェクト | RESEARCH, THESIS | `feature/RESEARCH-789-deep-learning` |
| DevEcosystem | インフラ・ツール | INFRA, GLOBAL | `feature/GLOBAL-321-ci-cd-pipeline` |

### 自動化対応JSON設定

```json
{
  "branchNaming": {
    "patterns": {
      "feature": "feature/{prefix}-{number:03d}-{description}",
      "hotfix": "hotfix/{prefix}-{number:03d}-{description}",
      "bugfix": "bugfix/{prefix}-{number:03d}-{description}"
    },
    "prefixes": {
      "DevBusinessHub": {
        "general": ["USER", "BUG", "SEC", "PERF"],
        "devflow": ["DEVFLOW"]
      },
      "DevPersonalHub": {
        "experiment": ["EXP", "ML", "AI", "UI"]
      },
      "DevAcademicHub": {
        "research": ["RESEARCH", "THESIS", "CS", "DATA"]
      },
      "DevEcosystem": {
        "infrastructure": ["INFRA", "GLOBAL", "TEMPLATE"]
      }
    },
    "validation": {
      "maxLength": 50,
      "allowedChars": "a-z0-9-",
      "requirePrefix": true,
      "requireNumber": true
    }
  }
}
```

### DevFlow Orchestrator MVP 具体例

実際のGitHub Issue番号とBranch名の対応：

```bash
# GitHub Issue #11: 📐 DevFlow Orchestrator: Architecture Design & Foundation
📐 feat: [DEVFLOW-11] アーキテクチャ設計基盤
→ feature/DEVFLOW-11-architecture-design

# GitHub Issue #12: 🔌 Implement GitHub Projects V2 API Integration
🔌 feat: [DEVFLOW-12] GitHub Projects V2 API統合
→ feature/DEVFLOW-12-github-projects-v2-api

# GitHub Issue #13: ⚙️ DevFlow Configuration System Creation
⚙️ feat: [DEVFLOW-13] DevFlow設定システム作成
→ feature/DEVFLOW-13-configuration-system

# GitHub Issue #14: 🚀 Automatic Project Creation for New Repositories
🚀 feat: [DEVFLOW-14] 自動プロジェクト作成機能追加
→ feature/DEVFLOW-14-auto-project-creation

# GitHub Issue #15: 📊 Basic DevFlow Dashboard Integration
📊 feat: [DEVFLOW-15] 基本ダッシュボード統合
→ feature/DEVFLOW-15-basic-dashboard
```

**実例**: 実際のDevEcosystem/ecosystem-central-command Issues #11-15に基づく命名

### 自動Branch作成コマンド

```bash
# GitHub CLI使用（推奨） - Issue番号自動取得
gh issue view 123 --json title,number | jq -r '"feature/DEVFLOW-" + (.number|tostring) + "-" + (.title | ascii_downcase | gsub("[^a-z0-9]"; "-") | gsub("-+"; "-") | .[0:30])'

# 手動作成パターン（Issue #123の場合）
git checkout develop
git checkout -b feature/DEVFLOW-123-architecture-design

# 実際の使用例（DevFlow Orchestrator MVP）
git checkout -b feature/DEVFLOW-11-architecture-design   # GitHub Issue #11
git checkout -b feature/DEVFLOW-12-github-projects-v2-api # GitHub Issue #12
git checkout -b feature/DEVFLOW-13-configuration-system  # GitHub Issue #13
```

### Branch→PR自動リンク

```bash
# PR作成時にIssueを自動リンク（Issue #11の場合）
gh pr create --title "📐 feat: [DEVFLOW-11] アーキテクチャ設計基盤" --body "Closes #11"

# GitHub自動検出でも可能
gh pr create --title "📐 feat: [DEVFLOW-11] アーキテクチャ設計基盤"
# Branch名からIssue番号を自動検出してリンク
```

### ワークフロー統合例

```yaml
# .github/workflows/branch-validation.yml
name: Branch Name Validation
on:
  pull_request:
    branches: [develop, main]

jobs:
  validate-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Validate branch naming
        run: |
          if [[ ! "${{ github.head_ref }}" =~ ^(feature|hotfix|bugfix)\/[A-Z]+-[0-9]{3,}-[a-z0-9-]+$ ]]; then
            echo "Branch name does not follow naming convention"
            exit 1
          fi
```

## 🔄 継続的改善

この命名規則は運用データに基づいて継続的に改善されます：

1. **データ収集**: Issue統計、解決時間、満足度
2. **分析**: パターン認識、ボトルネック特定
3. **改善**: テンプレート更新、新パターン追加
4. **展開**: 全プロジェクトへの適用

---

**この統一規則により、全ての開発プロジェクトで一貫性のあるIssue管理を実現できます！**