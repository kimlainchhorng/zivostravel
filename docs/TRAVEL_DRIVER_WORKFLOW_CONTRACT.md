# Travel to Driver Workflow Contract

## Scope

This is the first safe contract for connecting Zivo Travel bookings to Zivo Driver jobs. It documents and previews the workflow only. It does not create live driver jobs, change payment logic, implement payouts, change Supabase schema, or add secrets.

## Required IDs

- `travel_booking_id`: booking reference from Zivo Travel, for example `ztb_...`
- `driver_job_id`: job ID from Zivo Driver after the approved backend creates the job
- `chat_thread_id`: ZivoChat support thread for customer, driver, support, and admin
- `payment_order_id`: ZivoPay payment order placeholder until payment workflow is approved

## Preview API

`POST /api/travel/driver-request`

Returns a preview payload shaped for the future Driver job receiver:

```json
{
  "sourcePlatform": "zivo-travel",
  "targetPlatform": "zivo-driver",
  "travelBookingId": "ztb_preview",
  "driverJobId": null,
  "status": "pending_driver_request",
  "chatThreadId": null,
  "paymentOrderId": null,
  "payoutStatus": "not_eligible_until_completed"
}
```

## Workflow

1. Travel creates or confirms a booking draft.
2. Travel prepares a driver request payload.
3. Approved backend sends the payload to Zivo Driver.
4. Driver accepts or rejects the job.
5. Driver status syncs back to Travel.
6. Customer sees driver status in Travel.
7. ZivoChat links the customer, driver, support, and admin thread.
8. ZivoPay links payment order and payout state after the approved payment workflow.

## Guardrails

- No live driver job creation in this PR.
- No payment or payout implementation in this PR.
- No Supabase migrations in this PR.
- No secrets or `.env` changes.
- Future live endpoints must validate server-side and use idempotency.
