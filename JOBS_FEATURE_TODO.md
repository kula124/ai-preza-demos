# Jobs Feature - TODO & Progress

## Overview
Build a job application review system where:
1. Users create/manage open positions via UI
2. Applications received via email are processed by N8N workflow with AI
3. AI agent stores reviewed applications directly to database
4. Users view reviewed applications with position match scores

---

## Database Schema Design

### Tables

#### 1. `open_positions`
```sql
CREATE TABLE open_positions (
  id TEXT PRIMARY KEY,                    -- e.g., "JOB001"
  title TEXT NOT NULL,                    -- e.g., "Frontend Developer"
  department TEXT NOT NULL,               -- e.g., "Engineering"
  required_skills TEXT[] NOT NULL,        -- e.g., ["JavaScript", "React"]
  experience_level TEXT NOT NULL,         -- e.g., "Mid-level", "Senior"
  location TEXT NOT NULL,                 -- e.g., "Remote", "Hybrid"
  employment_type TEXT NOT NULL,          -- e.g., "Full-time", "Contract"
  salary_min INTEGER,                     -- e.g., 85000
  salary_max INTEGER,                     -- e.g., 115000
  status TEXT DEFAULT 'open',             -- 'open', 'closed', 'filled'
  description TEXT,                       -- Full job description
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `reviewed_applications`
```sql
CREATE TABLE reviewed_applications (
  id SERIAL PRIMARY KEY,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_github TEXT,
  position_applied TEXT NOT NULL,         -- Primary position applied for
  date_reviewed TIMESTAMP NOT NULL,
  overall_score INTEGER NOT NULL,         -- Overall matching score (0-100)

  -- Score breakdown
  required_skills_score INTEGER,
  experience_score INTEGER,
  technical_depth_score INTEGER,
  communication_score INTEGER,

  -- Analysis sections (markdown/text)
  strengths TEXT,                         -- Bullet points or paragraphs
  gaps_concerns TEXT,
  red_flags TEXT,
  requirements_coverage TEXT,
  code_quality_review TEXT,

  -- Final recommendation
  recommendation TEXT NOT NULL,           -- "HIRE", "MAYBE", "REJECT"
  recommendation_reasoning TEXT,
  next_steps TEXT,
  potential_fit TEXT,
  concerns_to_validate TEXT,

  -- Original data
  application_text TEXT,                  -- Original email/application
  resume_url TEXT,                        -- Link to resume if stored

  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `application_position_matches` (Junction Table)
```sql
CREATE TABLE application_position_matches (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES reviewed_applications(id) ON DELETE CASCADE,
  position_id TEXT NOT NULL REFERENCES open_positions(id) ON DELETE CASCADE,
  matching_score INTEGER NOT NULL,        -- AI's score for this specific position (0-100)
  match_reasoning TEXT,                   -- Why this position matches
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(application_id, position_id)
);
```

---

## Progress Tracking

### ✅ Phase 1: Database Setup
- [ ] Design schema (open_positions, reviewed_applications, application_position_matches)
- [ ] Update Drizzle schema file
- [ ] Generate migration on main branch
- [ ] Apply migration to local database
- [ ] Commit migration to main
- [ ] Create feature/jobs worktree branch

### 📋 Phase 2: Open Positions Management
- [ ] Create types/interfaces for positions
- [ ] Create positions page UI (`/jobs/positions`)
  - [ ] List view with all positions
  - [ ] Create new position form
  - [ ] Edit position form
  - [ ] Delete position action
- [ ] Create server actions:
  - [ ] createPositionAction
  - [ ] updatePositionAction
  - [ ] deletePositionAction
  - [ ] getPositionsAction
- [ ] Add to sidebar navigation

### 📋 Phase 3: Reviewed Applications View
- [ ] Create types/interfaces for applications
- [ ] Create applications list page (`/jobs/applications`)
  - [ ] Card/table view of all applications
  - [ ] Filter by recommendation (HIRE/MAYBE/REJECT)
  - [ ] Sort by score, date
- [ ] Create application detail page (`/jobs/applications/[id]`)
  - [ ] Full review display
  - [ ] Position matches with scores
  - [ ] All analysis sections
  - [ ] Candidate information
- [ ] Create server actions:
  - [ ] getApplicationsAction
  - [ ] getApplicationByIdAction
  - [ ] deleteApplicationAction (optional)

### 📋 Phase 4: N8N Integration Prep
- [ ] Document expected JSON structure from N8N
- [ ] Create example N8N payload for testing
- [ ] Test direct DB insert (simulate N8N)
- [ ] Verify junction table relationships work

### 📋 Phase 5: UI/UX Polish
- [ ] Dark mode support
- [ ] Responsive design
- [ ] Loading states
- [ ] Empty states
- [ ] Error handling
- [ ] Toast notifications

### 📋 Phase 6: Documentation
- [ ] Create JOBS_FEATURE.md with implementation details
- [ ] Update main README.md
- [ ] Document N8N integration requirements
- [ ] Create example payloads for testing

---

## N8N Integration Specification

### Expected Flow:
1. Email received with job application
2. N8N workflow extracts content
3. AI agent evaluates candidate against all open positions
4. N8N inserts to database:
   - Creates `reviewed_applications` record
   - Creates multiple `application_position_matches` records

### Database Insert Requirements:

**Step 1: Insert Reviewed Application**
```sql
INSERT INTO reviewed_applications (
  candidate_name, candidate_email, candidate_github,
  position_applied, date_reviewed, overall_score,
  required_skills_score, experience_score, technical_depth_score, communication_score,
  strengths, gaps_concerns, red_flags, requirements_coverage, code_quality_review,
  recommendation, recommendation_reasoning, next_steps, potential_fit, concerns_to_validate,
  application_text
) VALUES (...) RETURNING id;
```

**Step 2: Insert Position Matches**
```sql
INSERT INTO application_position_matches (
  application_id, position_id, matching_score, match_reasoning
) VALUES
  (?, 'JOB001', 85, 'Strong React skills match frontend requirements'),
  (?, 'JOB002', 65, 'Some backend experience but lacks MongoDB'),
  ...;
```

### Example N8N Payload (for testing):
```json
{
  "application": {
    "candidate_name": "Ivan Kuliš",
    "candidate_email": "kula124@gmail.com",
    "candidate_github": "kula124",
    "position_applied": "Full Stack Web Developer",
    "date_reviewed": "2024-02-07T10:00:00Z",
    "overall_score": 75,
    "required_skills_score": 30,
    "experience_score": 20,
    "technical_depth_score": 15,
    "communication_score": 10,
    "strengths": "• Diverse technology stack\n• Cloud & DevOps experience\n• Active learning",
    "gaps_concerns": "• Limited professional experience\n• Broad but not deep expertise",
    "red_flags": "• Career gaps\n• Potentially overstated skills",
    "requirements_coverage": "ReactJS: ✅, NodeJS: ⚠️, TypeScript: ✅",
    "code_quality_review": "Basic to moderate complexity projects",
    "recommendation": "MAYBE",
    "recommendation_reasoning": "Shows potential but needs validation",
    "next_steps": "1. Technical screening\n2. Live coding challenge\n3. Verify React/Node depth",
    "potential_fit": "Junior to Mid-Level role with mentorship",
    "concerns_to_validate": "Depth of skills, collaborative abilities",
    "application_text": "Original email content..."
  },
  "position_matches": [
    {
      "position_id": "JOB001",
      "matching_score": 85,
      "match_reasoning": "Strong frontend skills align with requirements"
    },
    {
      "position_id": "JOB002",
      "matching_score": 65,
      "match_reasoning": "Some backend experience but gaps in MongoDB"
    }
  ]
}
```

---

## Technical Decisions

### Routes Structure
```
/jobs/positions          - List/manage open positions
/jobs/positions/new      - Create new position
/jobs/positions/[id]     - View/edit position
/jobs/applications       - List reviewed applications
/jobs/applications/[id]  - View application detail
```

### Color Scheme
- **Primary**: Blue (jobs/professional theme)
- **Status Colors**:
  - HIRE: Green
  - MAYBE: Yellow/Orange
  - REJECT: Red
- **Score Indicators**: Gradient from red (low) to green (high)

### State Management
- Server actions for all data operations
- Client components for interactivity
- No complex state management needed (simple CRUD)

---

## Current Status
**Phase**: 1 - Database Design
**Last Updated**: 2025-10-10
**Blockers**: None
