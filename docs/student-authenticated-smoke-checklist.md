# Authenticated Student Smoke Checklist

Use a disposable or non-production environment with two student accounts, one
admin account, one public opening-soon opportunity, one public open external
opportunity, and one configured internal opportunity. Record browser, viewport,
account, and result for every executed item. Do not use production data.

## Priority 0 and Priority 1 release checks

- [ ] Student updates the existing profile and sees readiness links update.
- [ ] Student uploads a resume, selects it in a workspace, and sees the resume
      task and calculated progress update.
- [ ] Student saves and follows an opening-soon public opportunity.
- [ ] Student starts preparation for `OPENING_SOON` and receives typed tasks.
- [ ] Student cannot internally submit or externally confirm before `opensAt`.
- [ ] Student can submit the configured internal opportunity only after it is
      open and explicitly confirms the submission form.
- [ ] Student opens the host portal and explicitly confirms an open external
      submission; FP makes no host submission claim.
- [ ] Student completes, reopens, blocks, and unblocks tasks; progress and next
      action change without a manual percentage field.
- [ ] Student adds a private custom task, edits its due date, and cannot skip a
      required task.
- [ ] Student filters Tasks by application, type, due bucket, and status at a
      390px viewport using keyboard navigation.
- [ ] Student adds an external URL, creates a workspace, and sees
      “Private / added by you / not verified” labels.
- [ ] Student adds the same normalized URL again and receives a duplicate error.
- [ ] Student submits the private source for verification; admin sees the source
      metadata but not private application notes and cannot publish it from that
      review action.
- [ ] Student saves notification preferences, timezone, quiet hours, and weekly
      digest opt-in; refresh preserves the settings.
- [ ] A secret-authenticated reminder job creates exact in-app action links,
      respects preferences/timezone, and does not duplicate a repeated run.
- [ ] Student opens and dismisses a reminder; another user cannot mutate it.
- [ ] Weekly plan preview is structured, omits private content, and an empty plan
      produces no email.
- [ ] Student dashboard remains usable near 390px and shows the requested section
      order without horizontal overflow.
- [ ] Second student cannot access the first student's private opportunity,
      application, tasks, resume selection, notes, or notifications by URL or
      forged form ID.
- [ ] Partner, staff, and general admin catalog pages do not display the private
      opportunity or hidden placeholder organization.

## Deferred checks — do not mark complete in this release

These checks remain blocked until the corresponding Priority 2–4 editors and
actions are implemented. Schema presence is not a working feature.

- [ ] Student creates, duplicates, edits, archives, and deletes an activity.
- [ ] Student creates and explicitly approves a story.
- [ ] Student maintains and selects multiple named resume versions.
- [ ] Student tracks a reusable recommendation contact and explicitly sends a
      reviewed request.
- [ ] Student creates, versions, and approves an application answer from approved
      facts without automatic submission.
- [ ] Student records interview preparation and a thank-you action.
- [ ] Student optionally reports an outcome and controls anonymous aggregate use.
- [ ] Data export contains only the student's exportable records and deletion
      follows a reviewed retention workflow.

## Mobile and accessibility notes

For student home, opportunities, saved items, detail, application workspace,
Tasks, notifications, and settings, verify:

- visible focus and full keyboard operation;
- associated labels and announced form errors/success states;
- touch targets near 40px or larger;
- no hover-only essential actions;
- no clipped content or horizontal page scrolling at about 390px;
- usable loading, empty, error, and success states;
- readable contrast in status badges and callouts.
