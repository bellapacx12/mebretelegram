import https from "https";

export function loadReceipt({
  receiptNo,
  fullUrl,
}: {
  receiptNo?: string;
  fullUrl?: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = receiptNo
      ? `https://transactioninfo.ethiotelecom.et/receipt/${receiptNo}`
      : fullUrl;

    if (!url) return reject(new Error("No URL provided"));

    console.log("🌐 Fetching URL:", url);

    const parsedUrl = new URL(url);

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    let data = "";

    const req = https.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: "GET",
        agent,
      },
      (res) => {
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve(data);
        });

        res.on("error", (err) => {
          reject(err);
        });
      },
    );

    req.on("error", (err) => reject(err));
    req.end();
  });
}
import { parseDocument, DomUtils } from "htmlparser2";

export function parseFromHTML(html: string) {
  const document = parseDocument(html);
  const td = DomUtils.getElementsByTagName("td", document);

  const fields: any = {};

  function clean(text: string) {
    return text
      .replace(/[\n\r\s\t]/g, "")
      .trim()
      .toLowerCase();
  }

  function getNextValue(index: number) {
    const el = td[index];
    if (el) {
      return DomUtils.textContent(el)
        .replace(/[\n\r\t]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
    return "";
  }

  const names = [
    "የከፋይስም/payername",
    "የከፋይቴሌብርቁ./payertelebirrno.",
    "የከፋይአካውንትአይነት/payeraccounttype",
    "የገንዘብተቀባይስም/creditedpartyname",
    "የገንዘብተቀባይቴሌብርቁ./creditedpartyaccountno",
    "የክፍያውሁኔታ/transactionstatus",
    "የባንክአካውንትቁጥር/bankaccountnumber",
    "የክፍያቁጥር/receiptno.",
    "የክፍያቀን/paymentdate",
    "የተከፈለውመጠን/settledamount",
    "ቅናሽ/discountamount",
    "15%ቫት/vat",
    "ጠቅላላየተክፈለ/totalamountpaid",
  ];

  const keys = [
    "payer_name",
    "payer_phone",
    "payer_acc_type",
    "credited_party_name",
    "credited_party_acc_no",
    "transaction_status",
    "bank_acc_no",
    "receiptNo",
    "date",
    "settled_amount",
    "discount_amount",
    "vat_amount",
    "total_amount",
  ];

  td.forEach((value, index) => {
    const label = clean(DomUtils.textContent(value));
    const indexOf = names.indexOf(label);

    if (indexOf >= 0 && keys[indexOf]) {
      const key = keys[indexOf];

      // 🔥 THIS is the missing logic
      const offset = indexOf > 6 && indexOf <= 9 ? 2 : 1;
      const nextValue = getNextValue(index + offset);

      if (key === "bank_acc_no") {
        fields["to"] = nextValue.replace(/^[0-9]+/g, "").trim();
        fields[key] = nextValue.replace(/[A-Z]/gi, "").trim();
      } else if (key.includes("amount")) {
        fields[key] = parseFloat(nextValue.replace(/birr/gi, "").trim());
      } else {
        fields[key] = nextValue;
      }
    }
  });

  return fields;
}

export function verifyReceipt(parsed: any, expectedTo: string) {
  if (!parsed || Object.keys(parsed).length === 0) {
    return { valid: false, reason: "Empty receipt" };
  }

  if (parsed.transaction_status !== "Completed") {
    return { valid: false, reason: "Transaction not completed" };
  }

  if (
    !parsed.credited_party_name
      ?.toLowerCase()
      .includes(expectedTo.toLowerCase())
  ) {
    return {
      valid: false,
      reason: "Receiver mismatch",
    };
  }

  return { valid: true };
}
