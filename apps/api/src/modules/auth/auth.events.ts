export class UserSignedUpEvent {
    constructor(
        public readonly userId: string,
        public readonly email: string,
        public readonly name: string
    ) { }
}

export class UserLoggedInEvent {
    constructor(public readonly userId: string, public readonly email: string) { }
}

export class PasswordResetRequestedEvent {
    constructor(public readonly email: string, public readonly token: string) { }
}

export class GmailConnectedEvent {
    constructor(public readonly userId: string) { }
}
