# Mock Data Generation Spec: K-12 Semantic Space Prototype

## Agent Team Brief

You are an AI agent team tasked with generating a realistic mock dataset for a K-12 education semantic visualization system built on RuVector. The dataset will be used to prototype a "Situation Room" dashboard where school and district leaders can see students, teachers, organizational structures, legal/compliance documents, and community data as points and clusters in semantic space — using vector embeddings, not LLM queries.

**The goal is not a database dump. The goal is a living semantic space where proximity means something.**

---

## The Fictional District

**Garden Grove Unified School District (GGUSD-Mock)**
- 1 district office
- 4 schools: 2 elementary (K-5), 1 middle (6-8), 1 high school (9-12)
- ~2,400 students total
- ~160 teachers
- ~40 administrators and support staff

### Schools

| ID | Name | Type | Grades | Students | Teachers |
|---|---|---|---|---|---|
| `sch-001` | Bolsa Grande Elementary | Elementary | K-5 | 450 | 25 |
| `sch-002` | Pacifica Elementary | Elementary | K-5 | 500 | 28 |
| `sch-003` | Alamitos Middle | Middle | 6-8 | 550 | 35 |
| `sch-004` | Omega High | High | 9-12 | 900 | 55 |
| `sch-000` | District Office | Admin | — | — | 17 admin + 23 support |

---

## Data Entities and Schemas

Every entity below will become:
1. A **graph node** (with labels, properties)
2. A **vector entry** (with a 384-dimensional embedding and metadata)
3. Connected to other entities via **graph edges**

### Embedding Strategy

Use `AllMiniLmL6V2` (384 dimensions) as the target embedding model. For mock generation, create embeddings by:

1. Composing a **semantic text profile** for each entity (described per-entity below)
2. Generating a 384-dim `Vec<f32>` embedding from that profile
3. If no embedding model is available, generate **synthetic embeddings** using the following method:
   - Hash the semantic profile text to seed a deterministic PRNG
   - Generate 384 f32 values from the PRNG
   - Add controlled noise based on entity type (so similar entities cluster)
   - L2-normalize the vector

**Clustering requirement**: Entities that are semantically similar MUST have embeddings with high cosine similarity (>0.7). Use shared base vectors with perturbation to ensure clusters form naturally.

---

## Entity 1: Students

**Count**: 2,400 total across 4 schools

### Graph Node

```
Labels: ["Student"]
Properties:
  student_id: String          // "stu-000001" through "stu-002400"
  first_name: String
  last_name: String
  grade: Integer              // 0 (K) through 12
  school_id: String           // references school
  gender: String              // "M", "F", "X"
  ethnicity: String           // realistic distribution for Garden Grove, CA
  ell_status: String          // "EO", "IFEP", "EL", "RFEP", "TBD"
  ell_language: String|Null   // "Vietnamese", "Spanish", "Korean", etc.
  sped_status: String         // "None", "IEP", "504"
  lunch_status: String        // "Free", "Reduced", "Paid"
  enrollment_date: String     // ISO date
  attendance_rate: Float      // 0.0-1.0
  gpa: Float|Null             // 0.0-4.0 (null for K-2)
  behavior_incidents: Integer // count this year
  extracurriculars: Array     // list of activity names
  neighborhood: String        // one of 8 neighborhoods
```

### Semantic Text Profile (for embedding)

Compose a natural language string that captures the student's full context:

```
"{grade}th grade {gender} student at {school_name}. {ethnicity} background.
{ell_description}. {sped_description}. {lunch_status} lunch.
Attendance: {attendance_rate_pct}%. GPA: {gpa}. {behavior_description}.
Activities: {extracurriculars_joined}. Lives in {neighborhood}."
```

### Distributions (match Garden Grove demographics)

- **Ethnicity**: Vietnamese 35%, Hispanic/Latino 35%, White 10%, Korean 8%, Filipino 5%, Other Asian 4%, Black 2%, Other 1%
- **ELL**: ~40% current or reclassified, primary languages Vietnamese and Spanish
- **SPED**: ~12% IEP, ~3% 504
- **Free/Reduced Lunch**: ~70%
- **Attendance**: Normal distribution mean=0.94, sd=0.05, clipped to [0.5, 1.0]
- **GPA** (grades 3-12): Normal distribution mean=2.8, sd=0.7, clipped to [0.0, 4.0]

### Required Clusters (must be visible in embedding space)

1. **High-performing ELL students** — Vietnamese-background, RFEP, high GPA, high attendance
2. **At-risk cluster** — low attendance (<0.85), multiple behavior incidents, low GPA
3. **SPED transition cluster** — 5th and 8th graders with IEPs approaching school transition
4. **Newcomer cluster** — recently enrolled EL students with TBD or beginning ELL status
5. **College-bound cluster** — high school students with GPA >3.5, multiple extracurriculars
6. **Disengaged middle school cluster** — 7th-8th grade, declining attendance, dropping extracurriculars

---

## Entity 2: Teachers

**Count**: 160 total (143 classroom + 17 specialists)

### Graph Node

```
Labels: ["Teacher"] or ["Teacher", "Specialist"]
Properties:
  teacher_id: String          // "tch-000001" through "tch-000160"
  first_name: String
  last_name: String
  school_id: String
  department: String          // "General" (elem), "Math", "ELA", "Science", "History", "PE", "Arts", "SPED", "ELD"
  credential_type: String     // "Multiple Subject", "Single Subject", "Education Specialist"
  years_experience: Integer   // 0-35
  education_level: String     // "BA", "MA", "EdD", "PhD"
  certifications: Array       // ["BCLAD", "CLAD", "NBCT", "AP Certified", etc.]
  bilingual: String|Null      // language if bilingual
  evaluation_rating: String   // "Highly Effective", "Effective", "Developing", "Unsatisfactory"
  pd_hours_this_year: Integer // professional development hours
  pd_topics: Array            // ["Trauma-Informed", "UDL", "AVID", "MTSS", "SEL", "Tech Integration"]
  mentoring: String           // "None", "Mentor", "Mentee"
  retention_risk: String      // "Low", "Medium", "High"
```

### Semantic Text Profile

```
"{years_experience}-year {credential_type} teacher at {school_name}.
{department} department. {education_level} degree. {bilingual_description}.
Certifications: {certs_joined}. Rated {evaluation_rating}.
PD focus: {pd_topics_joined}. {mentoring_description}.
Retention risk: {retention_risk}."
```

### Required Clusters

1. **Veteran bilingual educators** — 15+ years, BCLAD, bilingual, effective/highly effective
2. **Early-career at-risk** — 0-3 years, no mentoring, high retention risk
3. **SPED specialists** — Education Specialist credential, IEP-related PD
4. **Instructional leaders** — NBCT, mentor role, high PD hours, highly effective
5. **Tech-forward cluster** — Tech Integration PD, AP Certified, < 10 years experience

---

## Entity 3: Administrators and Staff

**Count**: 40 (17 admin + 23 classified support)

### Graph Node

```
Labels: ["Administrator"] or ["Staff"]
Properties:
  staff_id: String            // "adm-000001" through "adm-000040"
  first_name: String
  last_name: String
  role: String                // "Superintendent", "Asst Superintendent", "Principal",
                              // "Vice Principal", "Director", "Coordinator",
                              // "Counselor", "Psychologist", "Nurse",
                              // "Office Manager", "IT Specialist", "Custodial Lead"
  school_id: String           // "sch-000" for district, or school ID
  department: String          // "Executive", "Instruction", "Student Services",
                              // "HR", "Business", "IT", "Facilities", "Special Ed"
  years_in_role: Integer
  reports_to: String|Null     // staff_id of supervisor
  credential: String|Null     // Administrative credential type
  budget_authority: Float     // dollar amount they control
```

### Semantic Text Profile

```
"{role} at {school_or_district}. {department} department.
{years_in_role} years in role. Reports to {supervisor_role}.
Manages ${budget_authority} budget. {credential_description}."
```

---

## Entity 4: Courses and Programs

**Count**: ~120 courses + 15 programs

### Graph Node — Courses

```
Labels: ["Course"]
Properties:
  course_id: String           // "crs-000001" through "crs-000120"
  name: String                // "Algebra 1", "AP Biology", "ELD Level 2", etc.
  school_id: String
  department: String
  grade_levels: Array         // [9, 10] etc.
  course_type: String         // "Core", "Elective", "AP", "Honors", "ELD", "SPED"
  sections: Integer           // number of sections offered
  avg_class_size: Integer
  pass_rate: Float            // 0.0-1.0
```

### Graph Node — Programs

```
Labels: ["Program"]
Properties:
  program_id: String          // "prg-001" through "prg-015"
  name: String                // "AVID", "MTSS", "Dual Language Immersion",
                              // "GATE", "Title I", "Title III", "LCAP Priority 1",
                              // "After-School Enrichment", "College & Career",
                              // "Restorative Justice", "SEL Initiative",
                              // "Newcomer Support", "Parent University",
                              // "STEM Pathways", "Arts Integration"
  scope: String               // "District", "School"
  school_ids: Array           // which schools participate
  budget: Float
  students_served: Integer
  funding_source: String      // "LCFF Base", "LCFF Supplemental", "Title I",
                              // "Title III", "Grant", "Local"
  status: String              // "Active", "Pilot", "Under Review"
```

---

## Entity 5: Legal and Compliance Documents

**Count**: ~80 documents

### Categories

| Category | Count | Examples |
|---|---|---|
| Board Policies | 20 | BP 5144.1 Suspension/Expulsion, BP 5141.4 Child Abuse Reporting, BP 6174 Education for ELs |
| Administrative Regulations | 15 | AR matching each relevant BP |
| IEP Templates & Guides | 10 | IEP Process Guide, Transition Planning Guide, Behavior Intervention Plan Template |
| State Mandates | 15 | ESSA compliance, LCAP requirements, CAASPP testing protocols, EL reclassification criteria |
| Federal Mandates | 10 | FERPA, IDEA, Title IX, Section 504, McKinney-Vento, ADA |
| District Notices | 10 | Annual parent notifications, UCP procedures, data privacy notice |

### Graph Node

```
Labels: ["Document", "{category}"]   // e.g. ["Document", "BoardPolicy"]
Properties:
  doc_id: String              // "doc-000001" through "doc-000080"
  title: String
  category: String            // from table above
  code: String|Null           // "BP 5144.1", "AR 6174", "IDEA Part B", etc.
  effective_date: String      // ISO date
  last_reviewed: String       // ISO date
  status: String              // "Current", "Under Revision", "Archived"
  applies_to: Array           // ["All Schools", "Elementary", "High School", "SPED", "EL"]
  summary: String             // 2-3 sentence plain language summary
  compliance_area: Array      // ["Student Discipline", "Special Education", "EL Services",
                              //  "Data Privacy", "Civil Rights", "Assessment", "Governance"]
  related_programs: Array     // program_ids this document governs
```

### Semantic Text Profile

```
"{title}. {category}. Code: {code}. Status: {status}.
Applies to: {applies_to_joined}. Compliance areas: {compliance_joined}.
Summary: {summary}"
```

### Required Clusters

1. **Student discipline cluster** — suspension/expulsion policies, restorative justice docs, behavior intervention
2. **Special education compliance** — IDEA, IEP guides, 504 procedures, transition planning
3. **English learner cluster** — Title III, EL reclassification, BCLAD requirements, dual language
4. **Data privacy cluster** — FERPA, data privacy notices, EdTech vendor agreements
5. **Equity and civil rights** — Title IX, UCP, anti-discrimination, McKinney-Vento

---

## Entity 6: Community Data

**Count**: ~60 entities

### Neighborhoods (8)

```
Labels: ["Neighborhood"]
Properties:
  neighborhood_id: String     // "nbh-001" through "nbh-008"
  name: String                // "West Grove", "Brookhurst Corridor", "Magnolia Park",
                              // "Chapman District", "Garden Park", "Euclid Triangle",
                              // "Stanford Square", "Harbor Gateway"
  population: Integer
  median_income: Integer
  poverty_rate: Float
  primary_languages: Array    // top 3 languages spoken
  food_desert_score: Float    // 0.0 (full access) to 1.0 (severe desert)
  transit_score: Float        // 0.0 (no transit) to 1.0 (excellent)
  park_acres_per_1000: Float
  violent_crime_rate: Float   // per 1,000 residents
  broadband_access_pct: Float // 0.0-1.0
```

### Community Partners (25)

```
Labels: ["CommunityPartner"]
Properties:
  partner_id: String          // "prt-001" through "prt-025"
  name: String                // "Garden Grove Community Clinic", "OC Food Bank",
                              // "Boys & Girls Club of GG", "VN Community of OC",
                              // "GG Public Library", etc.
  type: String                // "Healthcare", "Food Access", "Youth Services",
                              // "Cultural Organization", "Mental Health",
                              // "Housing Assistance", "Legal Aid", "Workforce Dev"
  neighborhood_id: String
  services: Array             // specific services offered
  languages_served: Array
  school_partnerships: Array  // school_ids they partner with
  annual_referrals: Integer   // from the district
  capacity_status: String     // "Available", "Waitlist", "Full"
```

### Public Health Indicators (8 — one per neighborhood)

```
Labels: ["HealthIndicator"]
Properties:
  indicator_id: String
  neighborhood_id: String
  childhood_obesity_pct: Float
  childhood_asthma_pct: Float
  dental_care_access_pct: Float
  mental_health_referral_rate: Float  // per 1,000 youth
  food_insecurity_pct: Float
  lead_exposure_risk: String  // "Low", "Medium", "High"
  air_quality_index_avg: Float
```

### Community Events / Context (19)

```
Labels: ["CommunityEvent"]
Properties:
  event_id: String
  title: String               // "Brookhurst Corridor Affordable Housing Proposal",
                              // "New Community Health Clinic Opening in West Grove",
                              // "OC Transit Route 56 Cancellation",
                              // "Magnolia Park Lead Testing Results", etc.
  date: String
  category: String            // "Housing", "Health", "Transit", "Safety",
                              // "Economic Development", "Environment"
  affected_neighborhoods: Array
  relevance_to_schools: String  // 1-2 sentence explanation of school impact
  sentiment: String           // "Positive", "Neutral", "Concerning"
```

---

## Graph Edges (Relationships)

These edges connect the entities above into a navigable graph. Generate all applicable edges.

### Core Relationships

| From | Edge Type | To | Properties |
|---|---|---|---|
| Student | `ENROLLED_AT` | School | `enrollment_date`, `grade` |
| Student | `TAKES` | Course | `section`, `semester`, `grade_earned` |
| Student | `PARTICIPATES_IN` | Program | `start_date`, `role` |
| Student | `HAS_IEP` | Document (IEP) | `effective_date`, `annual_review_date` |
| Student | `HAS_504` | Document (504) | `effective_date` |
| Student | `LIVES_IN` | Neighborhood | — |
| Student | `REFERRED_TO` | CommunityPartner | `date`, `reason`, `status` |
| Teacher | `TEACHES_AT` | School | `start_date` |
| Teacher | `TEACHES` | Course | `sections_count`, `semester` |
| Teacher | `MENTORS` | Teacher | `start_date` |
| Teacher | `CASE_MANAGES` | Student | (SPED case managers) |
| Administrator | `WORKS_AT` | School / District | `start_date` |
| Administrator | `REPORTS_TO` | Administrator | — |
| Administrator | `OVERSEES` | Program | — |
| Program | `OPERATES_AT` | School | — |
| Program | `GOVERNED_BY` | Document | — |
| Document | `REFERENCES` | Document | `reference_type` |
| Document | `APPLIES_TO` | School | — |
| CommunityPartner | `LOCATED_IN` | Neighborhood | — |
| CommunityPartner | `PARTNERS_WITH` | School | `agreement_date`, `type` |
| CommunityPartner | `SERVES` | Neighborhood | — |
| HealthIndicator | `DESCRIBES` | Neighborhood | `year` |
| CommunityEvent | `AFFECTS` | Neighborhood | — |
| School | `LOCATED_IN` | Neighborhood | — |

### Edge Counts (approximate)

| Relationship | Expected Count |
|---|---|
| ENROLLED_AT | 2,400 |
| TAKES | ~12,000 (avg 5 courses per student) |
| PARTICIPATES_IN | ~3,600 (avg 1.5 programs per student) |
| HAS_IEP / HAS_504 | ~360 |
| LIVES_IN (students) | 2,400 |
| REFERRED_TO | ~200 |
| TEACHES_AT | 160 |
| TEACHES | ~480 (avg 3 courses per teacher) |
| MENTORS | ~30 |
| CASE_MANAGES | ~288 (SPED teachers → students) |
| REPORTS_TO | ~39 |
| OVERSEES | ~25 |
| All others | ~300 |

**Total: ~22,000+ edges**

---

## RuVector Collections Layout

Organize the data into these collections for multi-tenant access:

```
Collection: "district-students"
  Dimensions: 384
  Metric: Cosine
  Vectors: 2,400 student embeddings
  Metadata: all student properties

Collection: "district-teachers"
  Dimensions: 384
  Metric: Cosine
  Vectors: 160 teacher embeddings
  Metadata: all teacher properties

Collection: "district-staff"
  Dimensions: 384
  Metric: Cosine
  Vectors: 40 admin/staff embeddings
  Metadata: all staff properties

Collection: "district-courses"
  Dimensions: 384
  Metric: Cosine
  Vectors: 120 course embeddings
  Metadata: all course properties

Collection: "district-programs"
  Dimensions: 384
  Metric: Cosine
  Vectors: 15 program embeddings
  Metadata: all program properties

Collection: "district-legal"
  Dimensions: 384
  Metric: Cosine
  Vectors: 80 document embeddings
  Metadata: all document properties

Collection: "district-community"
  Dimensions: 384
  Metric: Cosine
  Vectors: 60 community entity embeddings
  Metadata: all community properties
```

**Per-school filtered views** use `ruvector-filter` with `Eq { field: "school_id", value: "sch-001" }`.

---

## Output Format

Generate the following files:

### 1. `mock_data/vectors/`

One JSON file per collection. Each file is an array of objects:

```json
[
  {
    "id": "stu-000001",
    "vector": [0.0123, -0.0456, ...],   // 384 floats, L2-normalized
    "metadata": {
      "student_id": "stu-000001",
      "first_name": "Minh",
      "last_name": "Nguyen",
      "grade": 10,
      "school_id": "sch-004",
      "ethnicity": "Vietnamese",
      "ell_status": "RFEP",
      "sped_status": "None",
      "lunch_status": "Free",
      "attendance_rate": 0.97,
      "gpa": 3.6,
      "neighborhood": "West Grove",
      "semantic_profile": "10th grade M student at Omega High..."
    }
  }
]
```

### 2. `mock_data/graph/nodes.json`

Array of graph nodes:

```json
[
  {
    "id": "stu-000001",
    "labels": ["Student"],
    "properties": {
      "student_id": "stu-000001",
      "first_name": "Minh",
      "last_name": "Nguyen",
      "grade": 10
    }
  }
]
```

### 3. `mock_data/graph/edges.json`

Array of graph edges:

```json
[
  {
    "id": "edge-000001",
    "from": "stu-000001",
    "to": "sch-004",
    "edge_type": "ENROLLED_AT",
    "properties": {
      "enrollment_date": "2024-08-19",
      "grade": 10
    }
  }
]
```

### 4. `mock_data/collections.json`

Collection configurations matching the layout above.

### 5. `mock_data/README.md`

Brief description of the dataset, how to load it, and what clusters to look for.

---

## Validation Criteria

The agent team should verify:

1. **Cluster coherence** — Run cosine similarity between entities in the same intended cluster. Mean intra-cluster similarity must be >0.70.
2. **Cross-cluster separation** — Mean inter-cluster similarity must be <0.40.
3. **Referential integrity** — Every `school_id`, `neighborhood_id`, `partner_id`, etc. referenced in properties and edges must correspond to an actual entity.
4. **Demographic fidelity** — Aggregate statistics should roughly match the distributions specified above.
5. **Edge completeness** — Every student has ENROLLED_AT, LIVES_IN. Every teacher has TEACHES_AT. Every admin has WORKS_AT.
6. **Vector normalization** — Every vector must have L2 norm within [0.99, 1.01].
7. **Dimensional consistency** — All vectors are exactly 384 floats.

---

## Scenario Seeds

To make the data tell stories that leaders would discover in semantic space, embed these scenarios:

### Scenario A: "The Invisible Transition Crisis"
~30 fifth-graders with IEPs at Bolsa Grande and Pacifica are about to enter Alamitos Middle. Their embeddings should cluster near each other AND near the "at-risk" middle school cluster, making the upcoming transition risk visually obvious before any report flags it.

### Scenario B: "The Mentor Gap"
~12 early-career teachers at Omega High have no mentor assignment and high retention risk. Their embeddings cluster in an isolated region — far from veteran teachers — making the mentorship gap spatially visible.

### Scenario C: "The Neighborhood Signal"
Students in the "Brookhurst Corridor" neighborhood show a distinct embedding signature: slightly lower attendance, higher food insecurity correlation, but strong community partner engagement. The community events for that neighborhood include a recent transit route cancellation that will make commuting harder.

### Scenario D: "The Policy Blind Spot"
The district's EL reclassification policy (doc cluster) sits far from the newcomer student cluster in embedding space — meaning the policy's language doesn't semantically match the reality of the students it governs. A leader exploring the space would notice the gap.

### Scenario E: "The Hidden Strength"
A group of ~15 Vietnamese-background students who are RFEP (reclassified fluent English proficient) and participating in AVID cluster very close to the college-bound cluster despite being from the lowest-income neighborhood. Their community partner connections (Vietnamese Community of OC) also cluster nearby — showing a community asset that no traditional report surfaces.

---

## Technical Notes for Agent Team

### RuVector API Compatibility

The generated data must be loadable using:

```rust
// Core vector insertion
let entry = VectorEntry {
    id: Some("stu-000001".to_string()),
    vector: vec![0.0123, -0.0456, /* ... 384 total */],
    metadata: Some(metadata_map),
};

// Graph node creation
let node = Node::builder()
    .id("stu-000001")
    .label("Student")
    .property("first_name", PropertyValue::String("Minh".into()))
    .property("grade", PropertyValue::Integer(10))
    .build();

// Graph edge creation
let edge = Edge::builder()
    .id("edge-000001")
    .from("stu-000001")
    .to("sch-004")
    .edge_type("ENROLLED_AT")
    .property("enrollment_date", PropertyValue::String("2024-08-19".into()))
    .build();
```

### Embedding Generation Priority

1. **Best**: Use `AllMiniLmL6V2` ONNX model from `/home/user/ruvector/examples/onnx-embeddings/` to generate real embeddings from the semantic text profiles
2. **Acceptable**: Use a deterministic synthetic embedding method that preserves cluster structure
3. **Minimum**: Seeded random vectors with controlled similarity injection per cluster

### File Size Estimates

| File | Records | Est. Size |
|---|---|---|
| students.json | 2,400 | ~15 MB |
| teachers.json | 160 | ~1 MB |
| staff.json | 40 | ~250 KB |
| courses.json | 120 | ~750 KB |
| programs.json | 15 | ~100 KB |
| legal.json | 80 | ~500 KB |
| community.json | 60 | ~400 KB |
| nodes.json | ~2,875 | ~3 MB |
| edges.json | ~22,000 | ~8 MB |
| **Total** | — | **~30 MB** |

---

## Definition of Done

- [ ] All JSON files generated and valid
- [ ] All 7 collections populated with correctly-dimensioned vectors
- [ ] Graph nodes cover all entities across all 6 entity types
- [ ] Graph edges cover all relationship types with referential integrity
- [ ] 5 scenario seeds are embedded and verifiable by nearest-neighbor search
- [ ] Validation script confirms all 7 criteria pass
- [ ] README documents the dataset and provides load instructions
- [ ] Data is committed to `esp32-omega/mock_data/` in the ruvector repo
