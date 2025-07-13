# Branch Cleanup Guide

## 🎯 概要

DevFlow Orchestrator プロジェクトでは、リモートで削除されたブランチに対応するローカルブランチの定期的なクリーンアップを推奨しています。このガイドでは、安全で効率的なブランチ管理の方法を説明します。

## 📋 基本原則

### ✅ 自動化されるもの
- **リモート参照の削除**: `git fetch/pull` 時に自動実行
- **状況レポート**: GitHub Actions が毎日 9:00 AM (JST) に実行
- **通知**: 孤立ブランチ検出時に自動 Issue 作成

### ❌ 手動で行うもの
- **ローカルブランチの削除**: 開発者の判断で安全に実行

## 🔄 週次クリーンアップワークフロー

### Step 1: 状況確認
```bash
# 孤立ブランチの確認
./scripts/branch-cleanup.sh check

# または VS Code で
# Cmd+Shift+P → "Tasks: Run Task" → "DevFlow: Branch Cleanup Check"
```

**出力例:**
```
ℹ️ Found 3 local branches without remote counterparts:

Branch: feature/DEVFLOW-11-architecture-design
  📅 Last commit: 2 days ago
  ✅ Fully merged into main

Branch: feature/test-branch-protection
  📅 Last commit: 1 week ago
  ✅ Fully merged into main

Branch: feature/experimental-ui
  ⚠️  Has 2 unpushed commits
  📅 Last commit: 3 days ago
  ❌ Not merged into main
```

### Step 2: 対話的クリーンアップ
```bash
# 安全な対話式削除
./scripts/branch-cleanup.sh interactive

# または VS Code で
# Cmd+Shift+P → "Tasks: Run Task" → "DevFlow: Interactive Branch Cleanup"
```

### Step 3: 自動削除（オプション）
```bash
# マージ済みブランチのみ自動削除
./scripts/branch-cleanup.sh auto-safe
```

## 🤖 自動通知システム

### GitHub Actions による監視
毎日 9:00 AM (JST) に以下を実行：

1. **ブランチ状況チェック**
   - リモートで削除されたローカルブランチを検出
   - アクティブな feature ブランチの同期状況を確認

2. **Issue 自動作成**
   - 孤立ブランチが検出された場合
   - 週次クリーンアップリマインダーとして Issue 作成
   - 重複チェック機能付き

**自動作成される Issue 例:**
```markdown
🧹 Weekly Branch Cleanup Reminder - 2025-01-15

## Branch Cleanup Needed

5 orphaned local branches detected that have been deleted on remote.

### Action Required
1. Run `./scripts/branch-cleanup.sh check` to review branches
2. Run `./scripts/branch-cleanup.sh interactive` for cleanup
3. Or use VS Code: **Cmd+Shift+P** → "Tasks: Run Task" → "DevFlow: Branch Cleanup Check"

### Why Cleanup?
- Reduces clutter in branch listings
- Prevents accidental work on deleted branches
- Keeps repository organized

This issue will auto-close in 7 days.
```

## 🛠️ branch-cleanup.sh コマンドリファレンス

### 基本コマンド

#### `check` - 状況確認
```bash
./scripts/branch-cleanup.sh check
```
- 孤立ブランチを検出・分析
- 各ブランチの状態を表示（マージ状況、未プッシュコミット等）
- 削除は実行しない（確認のみ）

#### `interactive` - 対話的削除
```bash
./scripts/branch-cleanup.sh interactive
```
- 各ブランチを個別に確認
- ユーザーが削除可否を判断
- 未マージブランチは強制削除の確認あり

#### `auto-safe` - 安全な自動削除
```bash
./scripts/branch-cleanup.sh auto-safe
```
- マージ済みブランチのみ自動削除
- 未マージ・未プッシュブランチは保護
- バックグラウンド実行に適している

### 詳細オプション

#### ブランチ分析の詳細
各ブランチについて以下を分析：

- **マージ状況**: main ブランチにマージ済みかどうか
- **未プッシュコミット**: リモートにプッシュされていないコミットの有無
- **最終コミット日時**: 最後の活動時期
- **未コミット変更**: 作業ディレクトリの変更状況

#### 安全性チェック
- main/develop/staging ブランチは削除対象外
- 未マージブランチの削除時は追加確認
- 削除前に reflog での復旧方法を提示

## 📅 推奨スケジュール

### 個人開発者
- **PR マージ後**: 即座にローカルブランチ削除
- **週次**: `branch-cleanup.sh check` で状況確認
- **必要時**: `branch-cleanup.sh interactive` で整理

### チーム開発
- **毎日**: GitHub Actions が自動監視
- **Issue 作成時**: チームで週次クリーンアップ実施
- **スプリント終了時**: 全体的なブランチ整理

## ⚠️ 注意事項

### 削除前の確認事項
1. **未プッシュの重要な変更がないか**
2. **実験的なコードで後で参照する可能性はないか**
3. **他のブランチとの比較用に残す必要はないか**

### 復旧方法
誤って削除した場合：
```bash
# 削除されたブランチを確認
git reflog

# ブランチを復元（最後のコミットハッシュが必要）
git branch recovered-branch <commit-hash>
```

### バックアップ戦略
重要なブランチは削除前にバックアップ：
```bash
# タグとして保存
git tag archive/feature-name feature-name

# または別名でブランチ保存
git branch backup/feature-name feature-name
```

## 🔧 カスタマイズ

### 自動削除対象の除外
`branch-cleanup.sh` をカスタマイズして特定パターンを除外：

```bash
# 例: experiment- で始まるブランチを保護
if [[ "$branch" =~ ^experiment- ]]; then
    echo "  🔒 Protected branch pattern"
    continue
fi
```

### 通知設定
Slack やメール通知を追加する場合：

```bash
# Slack 通知例
if [ $ORPHANED_COUNT -gt 5 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🧹 Branch cleanup needed: '$ORPHANED_COUNT' orphaned branches"}' \
        $SLACK_WEBHOOK_URL
fi
```

## 📊 メトリクス

### 健全性指標
- **週次クリーンアップ率**: 90% 以上
- **孤立ブランチ滞留期間**: 平均 1 週間以内
- **手動削除 vs 自動削除比率**: 8:2 が理想

### 追跡可能な数値
- 削除されたブランチ数
- 保護されたブランチ数
- クリーンアップ実行頻度
- Issue 作成からクリーンアップまでの時間

## 🚀 高度な使用例

### CI/CD パイプライン統合
```yaml
# .github/workflows/cleanup-reminder.yml
name: Cleanup Reminder
on:
  schedule:
    - cron: '0 9 * * 1'  # 毎週月曜 9:00 AM

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Check and notify
        run: |
          ORPHANED=$(./scripts/branch-cleanup.sh check | grep -c "⚠️")
          if [ $ORPHANED -gt 3 ]; then
            echo "::warning::$ORPHANED orphaned branches detected"
          fi
```

### Git フック統合
```bash
# .git/hooks/post-merge
#!/bin/bash
# PR マージ後の自動リマインダー
if [ "$1" = "main" ]; then
    echo "🧹 Reminder: Clean up your feature branch"
    echo "Run: git branch -d <feature-branch-name>"
fi
```

## 📖 関連ドキュメント

- [Enterprise Conflict Management](./ENTERPRISE_CONFLICT_MANAGEMENT.md) - 競合解決の包括ガイド
- [Team Development Strategy](./TEAM_DEVELOPMENT_STRATEGY.md) - チーム開発戦略
- [Issue Naming Convention](./ISSUE_NAMING_CONVENTION.md) - Issue 命名規則

## 🤝 コントリビューション

ブランチクリーンアップ機能の改善提案は Issue または PR でお願いします：

1. **機能要望**: 新しいクリーンアップパターンの提案
2. **バグ報告**: 予期しないブランチ削除の報告
3. **ドキュメント改善**: このガイドの更新提案

---

*Last updated: 2025-01-13*  
*DevFlow Orchestrator - Enterprise Branch Management System*