# 🤖 AGENT MANIFEST - Arbitrage Platform

This document defines the multi-agent system for the crypto arbitrage platform development.

## Agent Hierarchy

```
                    ┌─────────────────┐
                    │   MAIN AGENT     │
                    │    (Jarvis)      │
                    │  - Orchestrator  │
                    │  - Code Auditor  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
        │ FRONTEND  │ │ BACKEND   │ │  DEVOPS   │
        │   DEV     │ │   DEV     │ │  ENGINEER  │
        └───────────┘ └───────────┘ └───────────┘
                               │
                    ┌───────────▼───────────┐
                    │   SECURITY AUDITOR   │
                    │   (Reports to Main)  │
                    └─────────────────────┘
```

## Agent Roles & Responsibilities

### Main Agent (Jarvis)
- **Role:** Orchestrator and Code Auditor
- **Responsibilities:**
  - Coordinate specialist agents
  - Final code review and approval
  - Security audit coordination
  - Integration testing
  - Deployment approval

### Frontend Developer Agent
- **Role:** React Frontend Specialist
- **Responsibilities:**
  - React component development
  - Real-time dashboard UI
  - Chart implementations
  - Responsive design

### Backend Developer Agent  
- **Role:** Node.js Backend Specialist
- **Responsibilities:**
  - WebSocket services
  - Arbitrage engine
  - Redis integration
  - API development

### DevOps Engineer Agent
- **Role:** Infrastructure Specialist
- **Responsibilities:**
  - Railway deployment
  - CI/CD setup
  - Redis/PostgreSQL management
  - Monitoring configuration

### Security Auditor Agent
- **Role:** Security Specialist
- **Responsibilities:**
  - Vulnerability assessment
  - API key security review
  - Code security audit
  - Compliance verification

## Workflow Patterns

### Pattern 1: New Feature Development
```
Main Agent
    │
    ├──► Frontend DEV ──────┐
    │   "Create price ticker component"
    │                       │
    │◄──────────────────────┤
    │   "Component ready for review"
    │
    ├──► Backend DEV ───────┐
    │   "Add new exchange connector"
    │                       │
    │◄──────────────────────┤
    │   "Connector ready for integration"
    │
    ├──► Security Auditor ──┐
    │   "Review new exchange integration"
    │                       │
    │◄──────────────────────┤
    │   "Security review passed"
    │
    └──► Integration Test
        "All tests pass - Ready for deploy"
```

### Pattern 2: Bug Fix
```
Main Agent
    │
    ├──► Backend DEV ───────┐
    │   "Fix WebSocket reconnection issue"
    │                       │
    │◄──────────────────────┤
    │   "Fix implemented"
    │
    ├──► Security Auditor ──┐
    │   "Review reconnection logic security"
    │                       │
    │◄──────────────────────┤
    │   "No security concerns"
    │
    └──► DevOps
        "Deploy hotfix"
```

### Pattern 3: Security Review
```
Main Agent
    │
    └──► Security Auditor ──┐
        "Full security audit before production"
                            │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
    Frontend          Backend           DevOps
    Security          Security          Security
    Review            Review            Review
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
                  Audit Report
                          │
                          ▼
                  Main Agent Decision
                          │
            ┌─────────────┴─────────────┐
            │                           │
        Approve                      Fix Issues
            │                           │
            ▼                           │
        Deploy                       Re-assign
```

## Agent Communication Protocol

### Task Delegation Format
```markdown
## Task: [TASK_NAME]

### Description
[Brief task description]

### Target Agent
[agent-id]

### Requirements
- [Requirement 1]
- [Requirement 2]

### Files to Modify
- `path/to/file1.ts`
- `path/to/file2.ts`

### New Files
- `path/to/new/component.tsx`

### Testing Required
- [Test description 1]
- [Test description 2]

### Deliverable
[Expected output]
```

### Status Report Format
```markdown
## Status: [IN_PROGRESS|COMPLETE|BLOCKED]

### Progress
- [Completed item 1]
- [Completed item 2]

### Blocker (if any)
[Blocker description and suggested resolution]

### Files Changed
- `modified/file1.ts`
- `new/file2.ts`

### Next Steps
- [Next action 1]
- [Next action 2]

### Security Concerns (Security Auditor only)
- [Concern 1] - [Severity]
```

## Agent Selection Criteria

### When to Use Frontend DEV
- React component development
- UI/UX implementation
- Dashboard features
- Chart integration
- State management

### When to Use Backend DEV
- WebSocket services
- Exchange integrations
- Arbitrage algorithms
- Redis operations
- API endpoints

### When to Use DevOps
- Deployment configuration
- Infrastructure setup
- CI/CD pipelines
- Environment management
- Monitoring setup

### When to Use Security Auditor
- Code review before merge
- Security vulnerability scan
- API key handling review
- Infrastructure security check
- Pre-deployment audit

## Quality Gates

### Frontend Quality
- TypeScript strict mode
- Responsive design verified
- Performance < 100ms render
- Accessibility compliant
- Tests passing

### Backend Quality
- TypeScript strict mode
- Error handling complete
- Rate limiting implemented
- Connection pooling configured
- Tests passing

### DevOps Quality
- Environment variables documented
- CI/CD passing
- Health checks configured
- Backups tested
- Documentation complete

### Security Quality
- No critical/high vulnerabilities
- API keys protected
- Inputs validated
- Outputs encoded
- Audit passed

## Delegation Commands

### Create Task for Agent
```bash
# Using OpenClaw sessions
openclaw agent --to frontend-dev --message "Create price ticker component..."
```

### Check Agent Status
```bash
openclaw sessions --agent frontend-dev
```

### Get Agent Output
```bash
openclaw sessions --history [session-id]
```

## Configuration

### Agent Settings (openclaw.json)
```json
{
  "agents": {
    "list": [
      {"id": "main"},
      {"id": "frontend-dev"},
      {"id": "backend-dev"},
      {"id": "devops"},
      {"id": "security-auditor"}
    ]
  }
}
```

### Agent Workspace Mapping
- `frontend-dev` → `/arbitrage-platform/frontend`
- `backend-dev` → `/arbitrage-platform/backend`
- `devops` → `/arbitrage-platform`
- `security-auditor` → `/arbitrage-platform`

## Best Practices

### For Main Agent (Jarvis)
1. Break tasks into manageable chunks
2. Set clear acceptance criteria
3. Require security review for critical code
4. Test integrations before deployment
5. Document all decisions

### For Specialist Agents
1. Follow existing code patterns
2. Ask clarification when needed
3. Report blockers immediately
4. Suggest improvements when relevant
5. Flag security concerns

## Emergency Procedures

### Security Incident
1. Main Agent pauses all tasks
2. Security Auditor conducts rapid assessment
3. Affected components isolated
4. Fix deployed
5. Enhanced monitoring enabled
6. Post-incident review

### Production Issue
1. DevOps assesses impact
2. Backend DEV prepares fix
3. Security Auditor reviews fix
4. Hotfix deployed
5. Verification
6. Documentation

---

## 📋 Current Agent Status

| Agent | Status | Current Task |
|-------|--------|--------------|
| Main (Jarvis) | ✅ Active | Platform orchestration |
| Frontend DEV | ⏳ Waiting | Feature requests |
| Backend DEV | ⏳ Waiting | Feature requests |
| DevOps | ⏳ Waiting | Deployment setup |
| Security Auditor | ⏳ Waiting | Code reviews |

---

**Note:** All agents report to the Main Agent (Jarvis) for final decisions. The Security Auditor has veto power on production deployments for critical security issues.
