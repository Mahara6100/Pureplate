import React, { useState } from "react";
import { QrReader } from "react-qr-reader"; // Standard library
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://fueahltjaebeberasvye.supabase.co",
  "sb_publishable_dLJU-Q5qjwjQQhX7bFUQvA_Byv4T6zC"
);

const AdminScanner = () => {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("SCANNING"); // SCANNING, VALID, USED, ERROR

  const handleScan = async (data) => {
    if (data && data?.text) {
      const qrText = data.text; // e.g., "PP-OFFER-uuid-here"
      setResult(qrText);
      
      // Extract the UUID from the string
      const uuid = qrText.replace("PP-OFFER-", "");

      try {
        // 1. Check if it's already redeemed
        const { data: lead, error } = await supabase
          .from("leads")
          .select("is_redeemed, name")
          .eq("id", uuid)
          .single();

        if (error || !lead) {
          setStatus("ERROR");
          return;
        }

        if (lead.is_redeemed) {
          setStatus("USED");
        } else {
          // 2. Mark as redeemed
          await supabase
            .from("leads")
            .update({ is_redeemed: true, redeemed_at: new Date() })
            .eq("id", uuid);
          
          setStatus("VALID");
        }
      } catch (err) {
        setStatus("ERROR");
      }
    }
  };

  const resetScanner = () => {
    setResult("");
    setStatus("SCANNING");
  };

  return (
    <div style={adminStyles.container}>
      <h2 style={{color: '#fff'}}>Staff Scanner</h2>
      
      {status === "SCANNING" && (
        <div style={adminStyles.cameraBox}>
          <QrReader
            onResult={handleScan}
            constraints={{ facingMode: "environment" }}
            style={{ width: "100%" }}
          />
          <p>Align QR inside the frame</p>
        </div>
      )}

      {status !== "SCANNING" && (
        <div style={{...adminStyles.resultBox, backgroundColor: status === "VALID" ? "#2e7d32" : "#d32f2f"}}>
          <h1>{status === "VALID" ? "✅ VALID" : status === "USED" ? "❌ ALREADY USED" : "⚠️ INVALID"}</h1>
          <p style={{fontSize: '20px'}}>{result}</p>
          <button onClick={resetScanner} style={adminStyles.btn}>Scan Next</button>
        </div>
      )}
    </div>
  );
};

const adminStyles = {
  container: { minHeight: "100vh", background: "#222", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" },
  cameraBox: { width: "100%", maxWidth: "400px", background: "#fff", borderRadius: "20px", overflow: "hidden", textAlign: 'center' },
  resultBox: { width: "90%", maxWidth: "400px", padding: "40px", borderRadius: "20px", color: "#fff", textAlign: "center" },
  btn: { marginTop: "20px", padding: "15px 30px", fontSize: "18px", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }
};

export default AdminScanner;