# 🎯 DevFlow Orchestrator - Issue命名規則ガイド

**Version**: 1.0.0  
**Last Updated**: 2025-07-13  
**Purpose**: DevFlow Orchestrator開発におけるIssue命名の統一基準

---

## 📋 基本命名構造

```
[絵文字] [プレフィックス] [動詞] [対象] [詳細]

例: 🔌 DevFlow: Implement GitHub Projects V2 API Integration
```

## 🎨 絵文字による役割分類

### **開発フェーズ別**

| 絵文字 | 役割 | 使用場面 | 例 |
|--------|------|----------|-----|
| 📐 | **Architecture & Design** | システム設計、アーキテクチャ文書 | 📐 DevFlow: Design Projects V2 integration architecture |
| 🔌 | **API Integration** | API開発、外部サービス連携 | 🔌 DevFlow: Implement GitHub Projects V2 GraphQL client |
| ⚙️ | **Configuration** | 設定システム、環境構築 | ⚙️ DevFlow: Create organization-specific config system |
| 🚀 | **Automation & Deployment** | 自動化、CI/CD、デプロイ | 🚀 DevFlow: Add automatic project creation workflow |
| 📊 | **Analytics & Dashboard** | 分析、レポート、ダッシュボード | 📊 DevFlow: Integrate project metrics into dashboard |

### **作業タイプ別**

| 絵文字 | 役割 | 使用場面 | 例 |
|--------|------|----------|-----|
| ✨ | **New Feature** | 新機能追加 | ✨ DevFlow: Add AI-powered issue classification |
| 🐛 | **Bug Fix** | バグ修正 | 🐛 DevFlow: Fix project creation API rate limiting |
| 📝 | **Documentation** | ドキュメント作成・更新 | 📝 DevFlow: Document Projects V2 API usage patterns |
| 🧪 | **Testing** | テスト追加・改善 | 🧪 DevFlow: Add integration tests for project sync |
| ⚡ | **Performance** | パフォーマンス改善 | ⚡ DevFlow: Optimize project data fetching speed |
| 🔧 | **Maintenance** | メンテナンス・改善 | 🔧 DevFlow: Refactor configuration loading logic |
| 🔒 | **Security** | セキュリティ関連 | 🔒 DevFlow: Secure API token handling |

### **優先度・緊急度別**

| 絵文字 | 役割 | 使用場面 | 例 |
|--------|------|----------|-----|
| 🔥 | **Critical** | 緊急・致命的問題 | 🔥 DevFlow: Fix data loss in project synchronization |
| ⭐ | **High Priority** | 高優先度 | ⭐ DevFlow: Implement core MVP functionality |
| 📋 | **Normal** | 通常の作業 | 📋 DevFlow: Add project template customization |
| 💡 | **Enhancement** | 改善・提案 | 💡 DevFlow: Consider adding webhook support |
| ❓ | **Question** | 質問・議論 | ❓ DevFlow: Should we support GitLab Projects? |

### **技術領域別**

| 絵文字 | 役割 | 使用場面 | 例 |
|--------|------|----------|-----|
| 🤖 | **AI Integration** | AI・機械学習 | 🤖 DevFlow: Add AI-powered priority suggestion |
| 🔄 | **Workflow** | ワークフロー・プロセス | 🔄 DevFlow: Create cross-repository task management |
| 🔔 | **Notifications** | 通知システム | 🔔 DevFlow: Implement smart project alerts |
| 🗺️ | **Mapping** | 依存関係・可視化 | 🗺️ DevFlow: Create project dependency visualization |
| ⚠️ | **Risk Management** | リスク評価・管理 | ⚠️ DevFlow: Add project risk assessment |

## 📚 フェーズ別Issue命名例

### **Phase 1: MVP**

```
📐 DevFlow: Architecture Design & Foundation
🔌 DevFlow: Implement GitHub Projects V2 API Integration  
⚙️ DevFlow: Create DevFlow Configuration System
🚀 DevFlow: Add Automatic Project Creation for New Repositories
📊 DevFlow: Integrate Basic Dashboard with Project Overview
```

### **Phase 2: Core Features**

```
⚡ DevFlow: Implement Advanced Workflow Automation
🔄 DevFlow: Add Cross-Repository Task Management
📈 DevFlow: Create Analytics and Reporting Engine
🔔 DevFlow: Build Smart Notification System
🎯 DevFlow: Add Workflow Optimization Features
🔗 DevFlow: Create Advanced Integration Capabilities
```

### **Phase 3: Advanced Features**

```
🤖 DevFlow: Integrate AI-Powered Issue Classification
🧠 DevFlow: Add Machine Learning Priority Prediction
🔮 DevFlow: Create Predictive Analytics Engine
🗺️ DevFlow: Build Project Dependency Mapping
⚠️ DevFlow: Implement Risk Assessment System
📊 DevFlow: Add Advanced Performance Analytics
```

## 🎯 命名ベストプラクティス

### **必須要素**
1. **絵文字**: 役割の視覚的識別
2. **プレフィックス**: `DevFlow:` で統一
3. **動詞**: 明確なアクション（Implement, Add, Create, Fix など）
4. **対象**: 具体的なシステム・機能名

### **推奨パターン**
```
✅ 良い例:
🔌 DevFlow: Implement GitHub Projects V2 GraphQL API client
⚙️ DevFlow: Create organization-specific configuration schema
📊 DevFlow: Add real-time project metrics to monitoring dashboard

❌ 避けるべき:
- DevFlow stuff
- Fix things  
- Update code
- API work
```

### **一貫性チェックリスト**
- [ ] 適切な絵文字を使用
- [ ] `DevFlow:` プレフィックス付き
- [ ] 明確な動詞を含む
- [ ] 具体的な対象を指定
- [ ] 技術キーワードを含む
- [ ] 50文字以内に収める

## 🔍 検索・フィルタリング活用

### **GitHub Issues検索例**
```bash
# 絵文字による検索
is:issue 📐                    # アーキテクチャ関連
is:issue 🔌                    # API統合関連  
is:issue 🐛                    # バグ修正
is:issue 🔥                    # 緊急Issue

# ラベルとの組み合わせ
is:issue label:devflow:architecture 📐
is:issue label:devflow:projects-v2 🔌
is:issue milestone:"DevFlow Orchestrator - MVP"
```

### **Milestone別の絞り込み**
```bash
# MVP関連Issue
is:issue milestone:"DevFlow Orchestrator - MVP" 

# 特定フェーズの特定タイプ
is:issue milestone:"DevFlow Orchestrator - MVP" 🔌
```

## 📋 Issue作成テンプレート

### **新Issue作成時の確認事項**

1. **絵文字選択**
   - [ ] Issue の主要な役割に適した絵文字を選択
   - [ ] 複数の役割がある場合は主要なものを優先

2. **タイトル構成**
   - [ ] `[絵文字] DevFlow: [動詞] [対象] [詳細]` の形式
   - [ ] 動詞は明確（Implement, Add, Create, Fix, Update など）
   - [ ] 対象は具体的（API, Dashboard, Configuration など）

3. **ラベル・Milestone**
   - [ ] 適切なラベル（devflow:architecture, devflow:projects-v2 など）
   - [ ] 正しいMilestone（MVP, Core Features, Advanced Features）

4. **内容の一貫性**
   - [ ] タイトルとBody の内容が一致
   - [ ] 技術的詳細が十分

## 🔄 ガイドの更新

### **更新タイミング**
- 新しい技術領域追加時
- フェーズ移行時
- チームフィードバック反映時

### **更新手順**
1. このドキュメントを更新
2. 既存Issue の命名確認
3. チーム内での共有・合意
4. 新規Issue作成時の適用

---

**このガイドにより、DevFlow Orchestrator の全Issue が統一された命名規則で管理され、プロジェクトの可視性と管理効率が向上します。**

*Generated for DevFlow Orchestrator Project*  
*Last Updated: 2025-07-13*  
*Next Review: フェーズ移行時*