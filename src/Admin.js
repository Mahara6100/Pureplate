import React, { useState } from "react";
import { QrReader } from "react-qr-reader"; 
import { createClient } from "@supabase/supabase-js";

// 1. Initialize Supabase
const supabase = createClient(
  "https://fueahltjaebeberasvye.supabase.co",
  "sb_publishable_dLJU-Q5qjwjQQhX7bFUQvA_Byv4T6zC"
);

const AdminScanner = () => {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("SCANNING"); // SCANNING, VALID, USED, ERROR
  const [passError, setPassError] = useState(false);

  // 2. Password Check Logic
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "2026") {
      setIsAuthorized(true);
      setPassError(false);
    } else {
      setPassError(true);
      setPassword("");
    }
  };

  // 3. QR Scan Logic
  const handleScan = async (data) => {
    if (data && data?.text) {
      const qrText = data.text;
      setResult(qrText);
      
      const uuid = qrText.replace("PP-OFFER-", "");

      try {
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

  // --- Login Screen ---
  if (!isAuthorized) {
    return (
      <div style={adminStyles.container}>
        <div style={adminStyles.loginCard}>
          <h2 style={{color: '#1b5e20'}}>Staff Login</h2>
          <p style={{fontSize: '14px', color: '#666'}}>Enter PIN to access scanner</p>
          <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column'}}>
            <input 
              type="password" 
              placeholder="Enter PIN" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={adminStyles.passInput}
              autoFocus
            />
            <button type="submit" style={adminStyles.loginBtn}>Login</button>
          </form>
          {passError && <p style={{color: 'red', marginTop: '10px', fontSize: '13px'}}>Incorrect PIN!</p>}
        </div>
      </div>
    );
  }

  // --- Scanner Screen ---
  return (
    <div style={adminStyles.container}>
      <h2 style={{color: '#fff', marginBottom: '20px'}}>Staff Scanner</h2>
      
      {status === "SCANNING" && (
        <div style={adminStyles.cameraBox}>
          <QrReader
            onResult={handleScan}
            constraints={{ facingMode: "environment" }}
            containerStyle={{ width: '100%' }}
            videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <p style={{padding: '10px', color: '#555', fontWeight: 'bold'}}>Align QR inside frame</p>
        </div>
      )}

      {status !== "SCANNING" && (
        <div style={{...adminStyles.resultBox, backgroundColor: status === "VALID" ? "#2e7d32" : "#d32f2f"}}>
          <h1 style={{fontSize: '40px'}}>{status === "VALID" ? "✅ VALID" : status === "USED" ? "❌ USED" : "⚠️ ERROR"}</h1>
          <p style={{fontSize: '14px', wordBreak: 'break-all'}}>Code: {result}</p>
          <button onClick={resetScanner} style={adminStyles.btn}>Scan Next</button>
        </div>
      )}
      <button onClick={() => setIsAuthorized(false)} style={adminStyles.logoutBtn}>Logout</button>
    </div>
  );
};

const adminStyles = {
  container: { minHeight: "100vh", background: "#1a1a1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: 'center', padding: "20px" },
  loginCard: { background: '#fff', padding: '40px', borderRadius: '20px', textAlign: 'center', width: '100%', maxWidth: '320px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  passInput: { padding: '15px', fontSize: '20px', textAlign: 'center', borderRadius: '10px', border: '1px solid #ccc', marginBottom: '15px', letterSpacing: '5px' },
  loginBtn: { padding: '15px', background: '#1b5e20', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  cameraBox: { width: "100%", maxWidth: "400px", background: "#fff", borderRadius: "20px", overflow: "hidden", textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  resultBox: { width: "95%", maxWidth: "400px", padding: "40px", borderRadius: "20px", color: "#fff", textAlign: "center" },
  btn: { marginTop: "20px", padding: "18px 40px", fontSize: "18px", fontWeight: "bold", border: "none", borderRadius: "12px", cursor: "pointer", background: '#fff', color: '#000' },
  logoutBtn: { marginTop: '30px', background: 'transparent', color: '#666', border: 'none', textDecoration: 'underline', cursor: 'pointer' }
};

export default AdminScanner;