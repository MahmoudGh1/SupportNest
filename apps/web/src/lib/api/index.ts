import * as auth from "./auth";
import * as admin from "./admin";
import * as knowledge from "./knowledge";
import * as payments from "./payments";
import * as settings from "./settings";
import * as team from "./team";
import * as tools from "./tools";
import * as apiKeys from "./apiKeys";

export const api = {
	...auth,
	...admin,
	...knowledge,
	...payments,
	...settings,
	...team,
	...tools,
	...apiKeys,
};
