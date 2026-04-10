import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { QRCodeSVG } from "qrcode.react";
import { useZxing } from "react-zxing"; 

// 1. Initialize Supabase
const supabase = createClient(
  "https://fueahltjaebeberasvye.supabase.co",
  "sb_publishable_dLJU-Q5qjwjQQhX7bFUQvA_Byv4T6zC"
);

// --- STAFF ADMIN COMPONENT ---
const AdminScanner = () => {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [status, setStatus] = useState("SCANNING"); 
  const [customerName, setCustomerName] = useState("");

  // ZXing Hook - Directly uses the <video> tag
  const { ref } = useZxing({
    onResult(result) {
      const qrText = result.getText();
      handleScanLogic(qrText);
    },
    paused: !isAuthorized || status !== "SCANNING",
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "2026") {
      setIsAuthorized(true);
    } else {
      alert("Wrong PIN");
      setPassword("");
    }
  };

  const handleScanLogic = async (qrText) => {
    const uuid = qrText.replace("PP-OFFER-", "").trim();
    
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

      // Check if it's already used (handles both TRUE and NOT NULL)
      if (lead.is_redeemed === true) {
        setCustomerName(lead.name);
        setStatus("USED"); // Should turn RED
      } else {
        // MARK AS USED NOW
        const { error: updateError } = await supabase
          .from("leads")
          .update({ is_redeemed: true })
          .eq("id", uuid);
        
        if (updateError) {
          alert("Update Failed: " + updateError.message);
          setStatus("ERROR");
        } else {
          setCustomerName(lead.name);
          setStatus("VALID"); // Should turn GREEN
        }
      }
    } catch (err) {
      setStatus("ERROR");
    }
  };

  if (!isAuthorized) {
    return (
      <div style={styles.adminContainer}>
        <div style={styles.card}>
          <h2 style={{color: '#1b5e20'}}>Staff Login</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="PIN" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{...styles.input, textAlign: 'center', fontSize: '24px', letterSpacing: '5px'}}
            />
            <button type="submit" style={styles.button}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.adminContainer}>
      <h2 style={{color: '#fff', marginBottom: '15px'}}>Staff Scanner</h2>
      
      {status === "SCANNING" ? (
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', borderRadius: '20px', overflow: 'hidden', background: '#000', border: '4px solid #fff' }}>
          <video 
            ref={ref} 
            style={{ width: '100%', height: '100%', minHeight: '350px', objectFit: 'cover' }} 
          />
          <div className="scan-line" />
          <style>{`
            .scan-line {
              position: absolute; top: 20%; left: 10%; width: 80%; height: 2px;
              background: red; box-shadow: 0 0 10px red; animation: scan 2s infinite;
            }
            @keyframes scan { 0% { top: 20%; } 50% { top: 80%; } 100% { top: 20%; } }
          `}</style>
          <p style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', color: '#fff', fontSize: '12px', background: 'rgba(0,0,0,0.5)', margin: 0, padding: '5px 0' }}>
            Point camera at customer QR
          </p>
        </div>
      ) : (
        <div style={{...styles.resultBox, backgroundColor: status === "VALID" ? "#2e7d32" : "#d32f2f"}}>
          <h1 style={{fontSize: '40px'}}>{status === "VALID" ? "✅ VALID" : status === "USED" ? "❌ USED" : "⚠️ ERROR"}</h1>
          <p style={{fontSize: '20px'}}>Customer: <b>{customerName}</b></p>
          <button onClick={() => setStatus("SCANNING")} style={styles.adminBtn}>Scan Next</button>
        </div>
      )}
      <button onClick={() => setIsAuthorized(false)} style={{marginTop: '30px', color: '#888', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer'}}>Logout</button>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [uniqueId, setUniqueId] = useState(""); 
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const isAdmin = window.location.pathname === "/admin";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isAdmin) return <AdminScanner />;

  const currentBG = isMobile 
    ? "https://res.cloudinary.com/dpvmewh9g/image/upload/v1775565539/WEDSITE_BACKGROUND_VERT_uxy1kk.png" 
    : "https://res.cloudinary.com/dpvmewh9g/image/upload/v1775560048/WEDSITE_BACKGROUND_HORI_f1uqmi.png";

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data, error: dbError } = await supabase
        .from("leads")
        .insert([{ name: name.trim(), phone: phone.trim() }])
        .select();

      if (dbError) {
        setError(dbError.code === "23505" ? "Already registered!" : "Error submitting.");
        return;
      }

      if (data && data.length > 0) {
        setUniqueId(data[0].id);
        setSubmitted(true);
      }
    } catch (err) {
      setError("Network error.");
    }
  };

  return (
    <div style={{ ...styles.container, backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url('${currentBG}')` }}>
      {!submitted ? (
        <div style={styles.card}>
          <h1 style={styles.title}>🎉 Pure Plate</h1>
          <p>Get your <b>35% OFF Voucher</b></p>
          <form onSubmit={submitForm} style={styles.form}>
            <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
            <input type="tel" placeholder="05X XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))} style={styles.input} required pattern="[0][5][0-9]{8}" maxLength="10" />
            <button type="submit" style={styles.button}>🎁 Get My Voucher</button>
          </form>
          {error && <div style={styles.errorBox}>{error}</div>}
        </div>
      ) : (
        <div style={styles.successCard}>
          <h2 style={styles.title}>🎉 SUCCESS!</h2>
          <p>Thank you, <b>{name}</b>!</p>
          
          <div style={styles.qrContainer}>
            {/* IMPROVED QR CODE FOR BETTER SCANNING */}
            <QRCodeSVG 
              value={`PP-OFFER-${uniqueId}`} 
              size={220}               // Bigger size
              level={"H"}              // High error correction
              includeMargin={true} 
              bgColor={"#FFFFFF"}      // Force pure white
              fgColor={"#000000"}      // Force pure black
            />
            <p style={styles.idText}>REF: {uniqueId ? String(uniqueId).substring(0, 8).toUpperCase() : "..."}</p>
          </div>

          <div style={styles.discountBadge}>35% OFF</div>
          <p style={styles.screenshotAlert}>📸 TAKE A <b>SCREENSHOT</b> NOW!</p>
          
          {/* HELPFUL TIP FOR STAFF */}
          <p style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
            💡 Tip: Increase phone brightness for faster scanning
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundSize: "cover", backgroundPosition: "center", padding: "15px", fontFamily: "'Montserrat', sans-serif" },
  card: { background: "rgba(255, 255, 255, 0.9)", width: "100%", maxWidth: "380px", padding: "30px", borderRadius: "25px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
  successCard: { background: "#fff", width: "100%", maxWidth: "380px", padding: "30px", borderRadius: "25px", textAlign: "center", border: "4px solid #2e7d32" },
  title: { fontSize: "26px", color: "#1b5e20", fontWeight: "bold" },
  form: { display: "flex", flexDirection: "column" },
  input: { padding: "15px", margin: "8px 0", borderRadius: "12px", border: "1px solid #ccc", fontSize: "16px", width: '100%', boxSizing: 'border-box' },
  button: { marginTop: "15px", padding: "16px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "12px", fontSize: "18px", fontWeight: "bold", width: '100%', cursor: 'pointer' },
  qrContainer: { background: "#f0f0f0", padding: "20px", borderRadius: "20px", margin: "15px 0", display: "inline-block" },
  discountBadge: { background: "#d32f2f", color: "white", fontSize: "24px", fontWeight: "bold", padding: "10px 20px", borderRadius: "50px", margin: "10px 0", display: "inline-block" },
  screenshotAlert: { color: "#d32f2f", fontWeight: "bold", backgroundColor: "#fff3e0", padding: "10px", borderRadius: "8px", border: "1px solid #ffe0b2" },
  errorBox: { color: "#d32f2f", marginTop: "15px", fontWeight: "bold" },
  idText: { fontSize: "10px", color: "#999", marginTop: "8px", fontFamily: "monospace" },
  adminContainer: { minHeight: "100vh", background: "#1a1a1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: 'center', padding: "20px", textAlign: "center" },
  resultBox: { width: "100%", maxWidth: "400px", padding: "40px", borderRadius: "20px", color: "#fff" },
  adminBtn: { marginTop: "20px", padding: "15px 30px", background: "#fff", color: "#000", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: 'pointer' }
};

export default App;