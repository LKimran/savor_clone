const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/sanity", async (req, res) => {
  try {
    const response = await fetch(
      "https://jqzja4ip.apicdn.sanity.io/v2023-08-01/graphql/production/default",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed", details: err.message });
  }
});

app.listen(4000, () => {
  console.log("CORS proxy running at http://67.211.209.122:4000/sanity");
});
