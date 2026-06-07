async function main() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch("https://www.eventfoldstudio.com/api/broadcasts/active");
      const data = await res.json();
      console.log(new Date().toISOString(), "Response:", data);
      if (data.details) {
        console.log("Found details:", data.details);
        break;
      }
    } catch (e: any) {
      console.log("Network error", e.message);
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}
main();
