🧭 Compliance Policy: Assessment, Application, and Validation

Purpose

This policy defines a standardized approach for assessing, applying, and validating compliance policies within a target environment (e.g. a repository, project, team, tracker, or organization).

The policy itself does not prescribe specific actions. Instead, it defines:
	•	how the current state must be investigated,
	•	how compliance must be evaluated,
	•	how changes must be planned and applied safely,
	•	and how results must be documented.

This policy is intended to be applied even when:
	•	the policy may have been partially applied in the past,
	•	the application status is unclear,
	•	or full application may introduce risks or disruptions.

⸻

Scope

This compliance policy applies to any target system where governance, structure, configuration, or operational rules are expected to conform to a defined policy.

Examples of target systems include (but are not limited to):
	•	source code repositories,
	•	project workspaces,
	•	issue trackers,
	•	teams or organizational units,
	•	automation or CI/CD environments.

⸻

Principles
	1.	Assessment before action
No changes may be applied before the current state is thoroughly investigated.
	2.	Policy-driven, not action-driven
The policy defines what compliant state looks like, not how to reach it.
	3.	Safety first
Any plan to apply the policy must be evaluated for security risks and operational impact.
	4.	Incremental application
Multi-level policies must be applied level by level, never all at once.
	5.	Auditability
All actions taken during policy application must be logged and reviewable.

⸻

Compliance Process

1. Investigation Planning
Before any assessment or changes:
	•	A research plan MUST be created.
	•	The plan MUST describe how the current state of the target system will be examined.
	•	The plan SHOULD identify sources of truth, tools, and stakeholders involved in the investigation.

No conclusions about compliance may be drawn before this step is completed.

⸻

2. Compliance Assessment
After the investigation:
	•	The current state MUST be evaluated against the policy requirements.
	•	A conclusion MUST be made whether the policy is:
	•	fully applied,
	•	partially applied,
	•	or not applied at all.
	•	If the policy defines multiple compliance levels:
	•	the highest satisfied level MUST be identified.
	•	unless stated otherwise, policies are assumed to have a single level.

The assessment results MUST be documented.

⸻

3. Application Planning
If the policy is not fully satisfied:
	•	A policy application plan MUST be created.
	•	The plan MUST define:
	•	intended changes,
	•	dependencies,
	•	order of execution.

Before approval:
	•	the plan MUST be reviewed for:
	•	security risks,
	•	potential data loss,
	•	disruption to other participants or systems,
	•	reversibility of changes.

⸻

4. Policy Application
If:
	•	the plan is considered safe,
	•	no additional approvals are required,
	•	and the policy text does not require modification,

then:
	•	the policy application MAY begin.

During application:
	•	an application log MUST be maintained,
	•	the log MUST include:
	•	executed steps,
	•	timestamps or duration of steps,
	•	deviations from the original plan (if any).

⸻

5. Multi-Level Policies
If the compliance policy defines multiple levels:
	•	levels MUST be applied sequentially, one at a time.
	•	for each level:
	•	the planning and safety evaluation steps MUST be repeated.
	•	skipping levels is not permitted.

⸻

6. Post-Application Review and Reporting
After successful application:
	•	a final security and safety review MUST be performed.
	•	a compliance report MUST be produced, summarizing:
	•	achieved compliance level,
	•	applied changes,
	•	known limitations or exceptions.

⸻

7. Failure and Rollback Decision
If the policy:
	•	cannot be applied fully or partially,
	•	or introduces unacceptable risks,

then:
	•	a decision MUST be made whether to:
	•	keep partial changes,
	•	or rollback to the previous state.

The decision and rationale MUST be documented.

⸻

Outcome

A policy is considered successfully applied only when:
	•	compliance level is clearly established,
	•	risks are reassessed after application,
	•	results are documented and auditable.

