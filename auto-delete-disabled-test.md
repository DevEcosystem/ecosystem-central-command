# Auto-Delete Disabled Test

Testing branch behavior after disabling "Automatically delete head branches".

**Test Configuration:**
- "Automatically delete head branches": **DISABLED** ✅
- Branch: `test-auto-delete-disabled` (regular branch)
- Expected: This branch should NOT be deleted after PR merge

**Previous Results:**
- ❌ `test-branch-deletion`: Was auto-deleted (when setting was ON)
- ❌ `develop`: Was deleted despite protection (when setting was ON)

**Expected Results:**
- ✅ This branch: Should remain after PR merge
- ✅ Future develop tests: Should be protected

**This test will confirm if the auto-delete setting was the root cause.**

---
*Test Date: 2025-07-13*  
*Setting: Auto-delete disabled*