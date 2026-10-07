export class InsufficientCreditsError extends Error {
  required: number;
  available: number;

  constructor(required: number, available: number) {
    super(`Insufficient credits. Required ${required}, available ${available}.`);
    this.name = "InsufficientCreditsError";
    this.required = required;
    this.available = available;
  }
}

export class CreditReservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreditReservationError";
  }
}
