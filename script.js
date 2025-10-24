let studentData = [];
let html5QrCode;
let scannedIds = new Set();

document.getElementById("loadSheet").addEventListener("click", async () => {
  const url = document.getElementById("sheetUrl").value;
  if (!url.includes("csv")) {
    alert("Please provide a valid Google Sheets CSV export link.");
    return;
  }

  const res = await fetch(url);
  const text = await res.text();
  const rows = text.split("\n").slice(1).map(row => row.split(","));
  studentData = rows.map(([name, address, number, section]) => ({
    name: name?.trim(),
    address: address?.trim(),
    number: number?.trim(),
    section: section?.trim()
  }));

  alert("Student data loaded. Ready to scan.");
  initCamera();
});

async function initCamera() {
  const cameras = await Html5Qrcode.getCameras();
  const select = document.getElementById("cameraSelect");
  select.innerHTML = "";

  cameras.forEach(cam => {
    const option = document.createElement("option");
    option.value = cam.id;
    option.text = cam.label;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    if (html5QrCode) html5QrCode.stop().then(() => startScanner(select.value));
  });

  if (cameras.length > 0) {
    startScanner(cameras[0].id);
  }
}

function startScanner(cameraId) {
  html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    cameraId,
    { fps: 10, qrbox: 250 },
    qrCodeMessage => handleScan(qrCodeMessage),
    error => {}
  );
}

function handleScan(qrData) {
  const match = studentData.find(s => s.number === qrData.trim());
  if (match && !scannedIds.has(match.number)) {
    scannedIds.add(match.number);

    document.getElementById("name").textContent = match.name;
    document.getElementById("address").textContent = match.address;
    document.getElementById("number").textContent = match.number;
    document.getElementById("section").textContent = match.section;
    document.getElementById("studentInfo").classList.remove("hidden");

    const now = new Date().toLocaleString();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${now}</td>
      <td>${match.name}</td>
      <td>${match.number}</td>
      <td>${match.section}</td>
    `;
    document.getElementById("logBody").appendChild(row);
    document.getElementById("attendanceLog").classList.remove("hidden");
  }
}

document.getElementById("exportCsv").addEventListener("click", () => {
  let csv = "Time,Name,Student Number,Section\n";
  document.querySelectorAll("#logBody tr").forEach(row => {
    const cells = Array.from(row.children).map(td => td.textContent);
    csv += cells.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "attendance_log.csv";
  a.click();
});
