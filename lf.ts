console.log(
  await fetch(
    "https://api.langflow.astra.datastax.com/lf/7436dcd2-a480-4009-bce2-43ba959692e5/api/v1/run/reinvent_demo_app?stream=false",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer AstraCS:hWFcnBDAjDSPawJAAswgOZZL:6c33a1609be6f434dc1d1a919e2caf1b00088d1fb73744a2cfb435e5ce539235`,
        "Content-Type": "application/json",
      },
    }
  )
    .then((res) => res.json())
    .then((data) => {
      return JSON.parse(data.outputs[0].outputs[0].results.text.text);
    })
);
