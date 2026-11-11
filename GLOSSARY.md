# Cadence

An online course platform where users buy courses and can ask for their money back shortly after buying.

## People

**User**:
A person with an account who buys and takes courses. When addressing them, use their name or email.
_Avoid_: Learner, customer

**Student**, **Instructor**, **Admin**:
Roles a User can have. A Student takes courses, an Instructor makes them, and an Admin runs the platform.

## Purchases

**Purchase**:
A User paying once for one course, either for their own access or for a set of Seats for a team. It records the amount paid and when.
_Avoid_: Order, transaction

## Refunds

**Refund**:
A request by the User who made a Purchase to give back all of it, or its Unclaimed Seats, and receive the money they paid for what they give back.
_Avoid_: Reversal, Chargeback, Cancellation, Cancel my purchase

**Refund Amount**:
The money a Refund returns: the amount paid for what is being given back, never the course's current price. For a Purchase for the User's own access, that's the whole amount paid. For a team Purchase, it's the amount paid per Seat times the number of Unclaimed Seats.
_Avoid_: Refundable amount, list price

**Refund Window**:
The 14 calendar days after a Purchase, including the whole of the last day, during which a Refund can be requested.
_Avoid_: Cancel window, cancellation window

**Refund Eligibility**:
Whether a Purchase can still be refunded. A Purchase for the User's own access is eligible while the Refund Window is open, the User has watched less than 2 hours, and they have completed fewer than half of the course's lessons. A team Purchase is eligible while the Refund Window is open and at least one Seat is Unclaimed.
_Avoid_: Cancellation offer, cancellable

### Refund statuses

**Requested**:
The User has asked for a Refund and nobody has decided yet.
_Avoid_: Pending, open

**Approved**:
An Admin has accepted the Refund and the Refund Amount is returned to the User.
_Avoid_: Done, completed, processed

**Declined**:
An Admin has turned the Refund down and no money is returned.
_Avoid_: Rejected, denied, done

## Teams

**Seat**:
One place on a team Purchase that a team member can take to get access to the course.
_Avoid_: Coupon, code, licence

**Claimed**:
A Seat that a team member has taken. A Claimed Seat is never refunded.
_Avoid_: Redeemed, used

**Unclaimed Seat**:
A Seat on a team Purchase that no team member has taken yet. It is the only kind of Seat a Refund can cover. While a Refund covering it is Requested, nobody can Claim it.
_Avoid_: Unused seat, spare seat, free seat
