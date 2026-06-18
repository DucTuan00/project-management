# Git Workflow

## Purpose
Define the branching strategy, commit conventions, pull request process, and release management.

## Branching Strategy

Trunk-based development with short-lived feature branches. All branches merged frequently.

| Branch | Source | Merge Target | Lifetime | Purpose |
|--------|--------|-------------|----------|---------|
| main | - | - | Permanent | Production-ready |
| develop | main | main | Permanent | Integration |
| feature/* | develop | develop | < 3 days | Feature work |
| bugfix/* | develop | develop | < 2 days | Non-critical bugs |
| hotfix/* | main | main + develop | < 1 day | Production bugs |
| release/* | develop | main | < 1 day | Release prep |

## Branch Naming

feature/<issue-number>-<kebab-description>
bugfix/<issue-number>-<kebab-description>
hotfix/<issue-number>-<kebab-description>
release/<version>

## Commit Convention: Conventional Commits

```
<type>(<scope>): <description>
```

### Types
feat, fix, refactor, test, docs, chore, style, perf, security

### Scopes
auth, workspace, project, task, kanban, sprint, comment, notification, realtime, api, db, ci, docker, docs

### Examples
feat(workspace): add workspace CRUD endpoints
fix(kanban): correct position calculation on drag between columns
refactor(auth): extract token utilities to shared module

### Breaking Changes
Add ! after type/scope. Include BREAKING CHANGE in body.

## Pull Request Process

### Title Convention
Same as commit: type(scope): description

### Requirements
- At least 1 approval for develop, 2 for main
- All CI checks pass
- No merge conflicts
- Author cannot merge their own PR

### Merge Strategies
- feature -> develop: squash merge
- develop -> main: merge commit
- hotfix -> main: squash merge
- hotfix -> develop: regular merge

## Release Process

Semantic Versioning: MAJOR.MINOR.PATCH

Steps:
1. Create release/X.Y.Z from develop
2. Update package.json versions
3. Run full test suite
4. Create PR to main
5. After merge: git tag -a vX.Y.Z && git push origin vX.Y.Z
6. Merge release back to develop
7. Delete release branch

Hotfix: branch from main, fix, PR to main, merge main to develop, tag.

## Branch Protection

main: require PR, 2 approvals, CI passes, branches up-to-date
develop: require PR, 1 approval, CI passes

## Design Decisions

- Trunk-based over GitFlow: simpler for small teams
- Squash merge for features: clean history on develop
- Merge commit for releases: shows included features
- Conventional Commits: enables automated changelog
- Issue numbers in branches: links to GitHub issues

## Future Considerations

- Automated CHANGELOG.md from Conventional Commits
- semantic-release for automated versioning
- Husky for pre-commit lint and pre-push test hooks
