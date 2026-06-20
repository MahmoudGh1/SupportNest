import SupportNest from "supportnest-server-sdk";

export async function verifyToken(widgetSecret: string, token: string, errCb) {
	try {
		const client = SupportNest.init(widgetSecret);
		const customer = await client.verifyToken(token);
		return customer;
	} catch (err) {
		errCb(err);
	}
}
