import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 1. Initialize Supabase
// Replace the second string with your full 'sb_publishable...' key from your screenshot
const supabase = createClient(
  "https://fueahltjaebeberasvye.supabase.co",
  "sb_publishable_dLJU-Q5qjwjQQhX7bFUQvA_Byv4T6zC"
);

function App() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 2. Background Switcher Logic
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update these URLs with your Cloudinary links
  const webBG = "https://res.cloudinary.com/dpvmewh9g/image/upload/v1775560048/WEDSITE_BACKGROUND_HORI_f1uqmi.png";
  const mobileBG = "https://res.cloudinary.com/dpvmewh9g/image/upload/v1775565539/WEDSITE_BACKGROUND_VERT_uxy1kk.png"; 

  const currentBG = isMobile ? mobileBG : webBG;

  // 3. Form Submission to Supabase
  const submitForm = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { error: dbError } = await supabase
        .from("leads")
        .insert([{ name: name.trim(), phone: phone.trim() }]);

      if (dbError) {
        // Handle Duplicate Phone Numbers (Error code 23505)
        if (dbError.code === "23505") {
          setError("This number is already registered!");
        } else {
          setError("Database connection error. Check your RLS policies.");
        }
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError("Network error. Please try again later.");
    }
  };

  const handleReset = () => {
    setName("");
    setPhone("");
    setSubmitted(false);
    setError("");
  };

  return (
    <div 
      style={{ 
        ...styles.container, 
        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('${currentBG}')` 
      }}
    >
      {!submitted ? (
        <div style={styles.card}>
          <h1 style={styles.title}>🎉 Pure Plate Turns 1!</h1>
          <p style={styles.subtitle}>🎁 Win a <b>Lucky Voucher</b></p>
          <p style={styles.desc}>🥗 Fresh • Healthy • Daily Meal Plans</p>
          <p style={styles.urgency}>⏳ Limited Time Offer</p>

          <form onSubmit={submitForm} style={styles.form}>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="tel"
              placeholder="05X XXX XXXX"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                if (value.length <= 10) setPhone(value);
              }}
              style={styles.input}
              required
              pattern="[0][5][0-9]{8}"
              maxLength="10"
              title="Please enter a 10-digit UAE number starting with 05"
              inputMode="numeric"
            />
            <button type="submit" style={styles.button}>🎁 Claim Now</button>
          </form>

          {error && <div style={styles.errorBox}>{error}</div>}
        </div>
      ) : (
        <div style={styles.successCard}>
          <h1 style={styles.title}>🎉 Done!</h1>
          <p>Thank you, <b>{name}</b>! 🎁</p>
          <p>The winner will be announced on our <b>1-year anniversary!</b></p>
          <p>Stay tuned to our socials 📱</p>
          <button onClick={handleReset} style={styles.button}>Submit Again</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    padding: "15px",
    transition: "background-image 0.5s ease-in-out",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "rgba(255, 255, 255, 0.8)",
    width: "100%",
    maxWidth: "380px",
    padding: "30px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  title: { fontSize: "24px", marginBottom: "10px", color: "#1b5e20", fontWeight: "700" },
  subtitle: { fontSize: "16px", marginBottom: "8px" },
  desc: { fontSize: "14px", color: "#444", marginBottom: "10px", fontFamily: "serif" },
  urgency: { color: "#d32f2f", fontSize: "13px", marginBottom: "20px", fontWeight: "bold" },
  form: { display: "flex", flexDirection: "column" },
  input: { padding: "15px", margin: "10px 0", borderRadius: "12px", border: "1px solid #bbb", fontSize: "16px", outline: "none" },
  button: { marginTop: "15px", padding: "15px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: "bold", cursor: "pointer" },
  errorBox: { color: "#d32f2f", backgroundColor: "rgba(255, 235, 238, 0.9)", padding: "12px", borderRadius: "10px", fontSize: "13px", marginTop: "20px", fontWeight: "bold", border: "1px solid #ffcdd2" },
  successCard: { background: "rgba(255, 255, 255, 0.9)", width: "100%", maxWidth: "380px", padding: "35px", borderRadius: "20px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" },
};

export default App;