const ESCALATED_STANDBY_REPLIES = [
	"Your conversation has been escalated to our support team. They'll review it and get back to you as soon as possible.",
	"Thanks for your message. A member of our support team has this and will follow up with you soon.",
	"This conversation is currently with our human support team. They'll be in touch once they've looked into it.",
];

export function getEscalatedStandbyReply(): string {
	const index = Math.floor(Math.random() * ESCALATED_STANDBY_REPLIES.length);
	return ESCALATED_STANDBY_REPLIES[index] as string;
}
