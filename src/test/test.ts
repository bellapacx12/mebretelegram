import { loadReceipt, parseFromHTML } from "../utils/telebirr";

(async () => {
  console.log("🚀 Starting test...");

  try {
    const html = await loadReceipt({
      receiptNo: "DDD9UA82OF",
    });

    const parsed = parseFromHTML(html);

    console.log("✅ Parsed result:");
    console.log(parsed);
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();
