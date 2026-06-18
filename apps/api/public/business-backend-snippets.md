```js
const { default: SupportNest } = require("supportnest-server-sdk");
```

```js
const client = SupportNest.init(process.env.SUPPORTNEST_WIDGET_SECRET);
```

```js
app.get("/api/generate-widget-token", async (req, res) => {
	const token = await client.generateToken({
		userId: "12345",
		email: "user@example.com",
	});
	res.status(200).json({ token });
});
```
