export function exportCsv(fileName, data) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  let csvText = headers.join(",") + "\n";

  data.forEach((item) => {
    const row = headers.map((key) => item[key]);
    csvText += row.join(",") + "\n";
  });

  const blob = new Blob([csvText], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}