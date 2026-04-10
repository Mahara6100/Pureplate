import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { QRCodeSVG } from "qrcode.react";
import { useZxing } from "react-zxing"; 
import confetti from "canvas-confetti";

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
  const [isProcessing, setIsProcessing] = useState(false);

  const { ref } = useZxing({
    onResult(result) {
      if (isProcessing || status !== "SCANNING") return;
      handleScanLogic(result.getText());
    },
    paused: !isAuthorized || status !== "SCANNING" || isProcessing,
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "2026") setIsAuthorized(true);
    else { alert("Wrong PIN"); setPassword(""); }
  };

  const handleScanLogic = async (qrText) => {
    setIsProcessing(true);
    const uuid = qrText.replace("PP-OFFER-", "").trim();
    try {
      const { data: lead, error } = await supabase
        .from("leads").select("is_redeemed, name").eq("id", uuid).single();

      if (error || !lead) { setStatus("ERROR"); setIsProcessing(false); return; }

      if (lead.is_redeemed) {
        setCustomerName(lead.name);
        setStatus("USED");
      } else {
        await supabase.from("leads").update({ is_redeemed: true }).eq("id", uuid);
        setCustomerName(lead.name);
        setStatus("VALID");
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4caf50', '#ffffff'] });
      }
    } catch (err) { setStatus("ERROR"); }
  };

  if (!isAuthorized) {
    return (
      <div style={styles.adminContainer}>
        <div style={styles.glassCard}>
          <h2 style={{color: '#fff'}}>Staff Login</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" placeholder="PIN" value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{...styles.input, textAlign: 'center', fontSize: '24px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)'}}
              autoFocus
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
        <div style={{ position: 'relative', width: '90%', maxWidth: '400px', borderRadius: '30px', overflow: 'hidden', background: '#000', border: '4px solid #fff' }}>
          <video ref={ref} style={{ width: '100%', height: '100%', minHeight: '400px', objectFit: 'cover' }} />
          <div className="neon-scan-line" />
          <style>{`
            .neon-scan-line { 
              position: absolute; top: 20%; left: 5%; width: 90%; height: 3px; 
              background: #00ff00; box-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00; 
              animation: scan 2s infinite linear; 
            }
            @keyframes scan { 0% { top: 15%; } 50% { top: 85%; } 100% { top: 15%; } }
          `}</style>
        </div>
      ) : (
        <div style={{...styles.resultBox, backgroundColor: status === "VALID" ? "#2e7d32" : "#d32f2f"}}>
          <h1 style={{fontSize: '45px'}}>{status === "VALID" ? "✅ VALID" : "❌ USED"}</h1>
          <p style={{fontSize: '22px'}}>Customer: <b>{customerName}</b></p>
          <button onClick={() => {setStatus("SCANNING"); setIsProcessing(false);}} style={styles.adminBtn}>Scan Next</button>
        </div>
      )}
      <button onClick={() => setIsAuthorized(false)} style={{marginTop: '30px', color: '#fff', opacity: 0.6, background: 'none', border: 'none', textDecoration: 'underline'}}>Logout</button>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [referral, setReferral] = useState(""); 
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
    if (!referral.trim()) { setError("Referral ID required"); return; }
    try {
      const { data, error: dbError } = await supabase.from("leads").insert([{ 
        name: name.trim(), phone: phone.trim(), lucky_code: referral.trim() 
      }]).select();
      
      if (dbError) { setError("Already registered!"); return; }
      
      setUniqueId(data[0].id);
      setSubmitted(true);
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.7 }, colors: ['#1b5e20', '#ffffff', '#ffd700'] });
    } catch (err) { setError("Network error."); }
  };

  return (
    <div style={{ ...styles.container, backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${currentBG}')` }}>
      {!submitted ? (
        <div style={styles.glassCard}>
          <h1 style={styles.title}>🌱 Pure Plate</h1>
          <p style={{color: '#fff', opacity: 0.9, marginBottom: '5px'}}>Anniversary Special</p>
          
          <a href="https://www.talabat.com/uae/pure-plate" target="_blank" rel="noreferrer" style={styles.miniMenuLink}>
            📖 Browse Our Menu
          </a>

          <form onSubmit={submitForm} style={styles.form}>
            <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
            <input type="tel" placeholder="05X XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))} style={styles.input} required pattern="[0][5][0-9]{8}" maxLength="10" />
            <input type="text" placeholder="Referral Code (Required)" value={referral} onChange={(e) => setReferral(e.target.value)} style={{...styles.input, border: '2px dashed #4caf50'}} required />
            <button type="submit" style={styles.button}>🎁 Claim My Voucher</button>
          </form>
          {error && <div style={styles.errorBox}>{error}</div>}
        </div>
      ) : (
        <div style={styles.glassCard}>
          <div style={styles.liveBadge}>
            <span className="pulse-dot"></span> 42 people joined in the last hour
          </div>

          <h2 style={{color: '#fff', fontSize: '26px', margin: '10px 0'}}>VOUCHER SECURED! 🎉</h2>
          
          {/* THE DIGITAL PASS UI */}
          <div style={styles.qrPass}>
            <QRCodeSVG value={`PP-OFFER-${uniqueId}`} size={220} level={"H"} bgColor={"#FFFFFF"} fgColor={"#000000"} />
            <div style={{marginTop: '10px'}}>
              <p style={{ color: "#000", fontWeight: "bold", fontSize: '14px', margin: 0 }}>ANNIVERSARY PASS</p>
              <p style={{ color: "#666", fontSize: '10px', fontFamily: 'monospace' }}>ID: {uniqueId.substring(0,8).toUpperCase()}</p>
            </div>
          </div>

          <div style={styles.discountBadge}>35% OFF</div>
          
          <div style={styles.actionGrid}>
            <p style={styles.screenshotAlert}>📸 STEP 1: TAKE A SCREENSHOT</p>

            <button 
              onClick={() => {
                const text = encodeURIComponent(`Hey! I just got 35% OFF at Pure Plate Anniversary event! 🌱 Get yours here: ${window.location.origin}`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }} 
              style={styles.whatsappBtn}
            >
              <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" width="18" style={{marginRight: '8px'}} alt="wa"/>
              Share on WhatsApp
            </button>
          </div>

          <a href="https://www.talabat.com/uae/pure-plate" target="_blank" rel="noreferrer" style={styles.advancedMenuBtn}>
            🍽️ BROWSE MENU & PRICES
          </a>

          <p style={{ fontSize: '11px', color: '#fff', opacity: 0.7, marginTop: '15px' }}>💡 Tip: Turn up brightness for staff to scan</p>

          <style>{`
            .pulse-dot { height: 8px; width: 8px; background-color: #4caf50; border-radius: 50%; display: inline-block; margin-right: 8px; animation: pulse-green 2s infinite; }
            @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); } 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); } }
          `}</style>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundSize: "cover", backgroundPosition: "center", padding: "15px", fontFamily: "'Montserrat', sans-serif" },
  glassCard: { background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", width: "100%", maxWidth: "380px", padding: "35px", borderRadius: "35px", textAlign: "center", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 15px 35px rgba(0,0,0,0.3)" },
  title: { fontSize: "32px", color: "#fff", fontWeight: "bold", margin: 0 },
  form: { display: "flex", flexDirection: "column", marginTop: '10px' },
  input: { padding: "16px", margin: "8px 0", borderRadius: "15px", border: "none", fontSize: "16px", width: '100%', boxSizing: 'border-box', background: 'white' },
  button: { marginTop: "15px", padding: "18px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "15px", fontSize: "18px", fontWeight: "bold", cursor: 'pointer' },
  qrPass: { background: "#FFFFFF", padding: "25px 20px 15px 20px", borderRadius: "25px", display: "inline-block", margin: "15px 0", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", border: "2px solid #4caf50" },
  discountBadge: { background: "#ff9800", color: "white", fontSize: "28px", fontWeight: "bold", padding: "12px 25px", borderRadius: "50px", margin: "15px 0", display: "inline-block" },
  actionGrid: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '15px' },
  whatsappBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25D366', color: '#fff', border: 'none', padding: '12px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  screenshotAlert: { color: "#fff", fontWeight: "bold", background: "rgba(211, 47, 47, 0.8)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.3)", fontSize: '13px' },
  miniMenuLink: { color: '#fff', fontSize: '13px', textDecoration: 'underline', display: 'block', marginBottom: '15px' },
  advancedMenuBtn: { display: 'block', marginTop: '15px', padding: '15px', background: '#fff', color: '#1b5e20', textDecoration: 'none', borderRadius: '15px', fontWeight: '900', letterSpacing: '1px' },
  liveBadge: { background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '12px', padding: '6px 15px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center' },
  errorBox: { color: "#ffcdd2", marginTop: "15px", fontWeight: "bold" },
  adminContainer: { minHeight: "100vh", background: "#0a1f0c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: 'center', padding: "20px" },
  resultBox: { width: "95%", maxWidth: "400px", padding: "40px", borderRadius: "30px", color: "#fff", textAlign: "center" },
  adminBtn: { marginTop: "20px", padding: "18px 40px", background: "#fff", color: "#0a1f0c", border: "none", borderRadius: "15px", fontWeight: "bold" }
};

export default App;