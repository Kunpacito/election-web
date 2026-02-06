//ก่อนใช้ ให้เปิด terminal แล้วพิมพ์ "cd election" และ "npm run dev"
// ใช้ react.js firebase vscode googlechrome claude teams 

import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, get } from "firebase/database";

// ─── FIREBASE CONFIG ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCDE_nvtCjwxwX3ZHShAlIr4AUyiOr7Jds",
  authDomain: "election-app-87d89.firebaseapp.com",
  databaseURL: "https://election-app-87d89-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "election-app-87d89",
  storageBucket: "election-app-87d89.firebasestorage.app",
  messagingSenderId: "847637841909",
  appId: "1:847637841909:web:badeafea911de206fe02bc",
  measurementId: "G-76W6HHS52X"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ─── ADMIN CREDENTIALS (แก้ไขได้ตามต้องการ) ────────────────
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "ikunlnwza";

// ─── ROOT APP ─────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pollsRef = ref(database, "polls");
    const unsubscribe = onValue(pollsRef, (snapshot) => {
      const data = snapshot.val();
      setPolls(data ? Object.entries(data).map(([id, poll]) => ({ id, ...poll })) : []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={S.root}>
        <div style={S.bg} />
        <div style={{ ...S.center, color: "#64748b", fontSize: 16 }}>กำลังโหลด...</div>
      </div>
    );
  }

  if (!role) {
    return (
      <div style={S.root}>
        <div style={S.bg} />
        <div style={S.center}>
          <div style={S.landingBox}>
            <div style={S.logoIcon}>🗳️</div>
            <h1 style={S.landingTitle}>ระบบโหวต</h1>
            <p style={S.landingSub}>Election System</p>
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              <button style={S.btnAdmin} onClick={() => setRole("admin")}>
                <span style={{ fontSize: 20, marginRight: 10 }}>⚙️</span>
                เข้าในฐานะ Admin
              </button>
              <button style={S.btnVoter} onClick={() => setRole("voter")}>
                <span style={{ fontSize: 20, marginRight: 10 }}>🗳️</span>
                เข้าในฐานะผู้โหวต
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "admin") {
    if (!isAdminAuth) {
      return <AdminLogin onAuth={() => setIsAdminAuth(true)} onBack={() => setRole(null)} />;
    }
    return <AdminDashboard polls={polls} onBack={() => { setRole(null); setIsAdminAuth(false); }} />;
  }

  return <VoterDashboard polls={polls} onBack={() => setRole(null)} />;
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────
function AdminLogin({ onAuth, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      onAuth();
    } else {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div style={S.root}>
      <div style={S.bg} />
      <div style={S.center}>
        <div style={S.landingBox}>
          <button style={S.btnBack} onClick={onBack}>← กลับ</button>
          <div style={{ fontSize: 42, marginBottom: 12, marginTop: 20 }}>🔐</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px" }}>Admin Login</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>ยืนยันตัวตนเพื่อเข้าสู่ระบบ</p>
          
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <input
            style={S.input}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <input
            style={{ ...S.input, marginTop: 10 }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button style={{ ...S.btnAdmin, marginTop: 16 }} onClick={handleLogin}>
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────
function AdminDashboard({ polls, onBack }) {
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  if (showCreatePoll) {
    return <CreatePoll onBack={() => setShowCreatePoll(false)} />;
  }

  if (selectedPoll) {
    return <AdminPollEditor pollId={selectedPoll} onBack={() => setSelectedPoll(null)} />;
  }

  return (
    <div style={S.root}>
      <div style={S.bg} />
      <div style={S.pageWrap}>
        <div style={S.topBar}>
          <button style={S.btnBack} onClick={onBack}>← ออกจากระบบ</button>
          <span style={S.topBadge}>⚙️ ADMIN</span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>จัดการโพล</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>สร้างและแก้ไขโพลการโหวต</p>
        </div>

        <button style={{ ...S.btnAdmin, marginBottom: 20 }} onClick={() => setShowCreatePoll(true)}>
          + สร้างโพลใหม่
        </button>

        {polls.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 60, color: "#64748b" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 15 }}>ยังไม่มีโพล</p>
            <p style={{ fontSize: 13 }}>กดปุ่มด้านบนเพื่อสร้างโพลแรก</p>
          </div>
        ) : (
          <div>
            {polls.map((poll) => (
              <div key={poll.id} style={S.pollCard} onClick={() => setSelectedPoll(poll.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>{poll.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {poll.candidates?.length || 0} ผู้สมัคร • {Object.keys(poll.votedEmails || {}).length} คนโหวต
                  </div>
                  <div style={{ fontSize: 11, color: poll.isOpen ? "#4ade80" : "#64748b", marginTop: 4 }}>
                    {poll.isOpen ? "🟢 เปิดรับคะแนน" : "⚫ ปิดรับคะแนน"}
                  </div>
                </div>
                <span style={{ fontSize: 22, color: "#475569" }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CREATE POLL ──────────────────────────────────────────────
function CreatePoll({ onBack }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const pollId = Date.now().toString();
    const pollRef = ref(database, `polls/${pollId}`);
    await set(pollRef, {
      title: title.trim(),
      description: description.trim(),
      candidates: [],
      votes: {},
      votedEmails: {},
      isOpen: false,
      createdAt: Date.now(),
    });
    setCreating(false);
    onBack();
  };

  return (
    <div style={S.root}>
      <div style={S.bg} />
      <div style={S.pageWrap}>
        <div style={S.topBar}>
          <button style={S.btnBack} onClick={onBack}>← กลับ</button>
          <span style={S.topBadge}>สร้างโพลใหม่</span>
          <div style={{ width: 60 }} />
        </div>

        <div style={S.card}>
          <label style={S.label}>ชื่อโพล</label>
          <input
            style={S.input}
            placeholder="เช่น หัวหน้าห้อง 5/1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={S.card}>
          <label style={S.label}>คำอธิบาย (ไม่บังคับ)</label>
          <textarea
            style={{ ...S.input, minHeight: 80, resize: "vertical" }}
            placeholder="รายละเอียดเพิ่มเติม..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          style={{ ...S.btnAdmin, opacity: !title.trim() || creating ? 0.5 : 1 }}
          onClick={handleCreate}
          disabled={!title.trim() || creating}
        >
          {creating ? "กำลังสร้าง..." : "สร้างโพล"}
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN POLL EDITOR ────────────────────────────────────────
function AdminPollEditor({ pollId, onBack }) {
  const [poll, setPoll] = useState(null);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");

  useEffect(() => {
    const pollRef = ref(database, `polls/${pollId}`);
    const unsubscribe = onValue(pollRef, (snapshot) => {
      setPoll(snapshot.val());
    });
    return () => unsubscribe();
  }, [pollId]);

  if (!poll) return null;

  const addCandidate = async () => {
    if (!newName.trim()) return;
    const updated = [
      ...(poll.candidates || []),
      { id: Date.now(), name: newName.trim(), bio: newBio.trim() },
    ];
    await update(ref(database, `polls/${pollId}`), { candidates: updated });
    setNewName("");
    setNewBio("");
  };

  const removeCandidate = async (id) => {
    const updated = poll.candidates.filter((c) => c.id !== id);
    await update(ref(database, `polls/${pollId}`), { candidates: updated });
  };

  const toggleVoting = async () => {
    await update(ref(database, `polls/${pollId}`), { isOpen: !poll.isOpen });
  };

  const resetVoter = async (email) => {
    const votedEmails = { ...poll.votedEmails };
    delete votedEmails[email];
    const votes = { ...poll.votes };
    const candidateId = Object.keys(votes).find(id => poll.votedEmails[email] === id);
    if (candidateId && votes[candidateId] > 0) {
      votes[candidateId]--;
    }
    await update(ref(database, `polls/${pollId}`), { votedEmails, votes });
  };

  const deletePoll = async () => {
    if (confirm(`ยืนยันการลบโพล "${poll.title}"?`)) {
      await set(ref(database, `polls/${pollId}`), null);
      onBack();
    }
  };

  const votes = poll.votes || {};
  const votedEmails = poll.votedEmails || {};
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(votes), 0);
  const sortedCandidates = [...(poll.candidates || [])].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  const winner = sortedCandidates[0] && maxVotes > 0 ? sortedCandidates[0] : null;

  return (
    <div style={S.root}>
      <div style={S.bg} />
      <div style={S.pageWrap}>
        <div style={S.topBar}>
          <button style={S.btnBack} onClick={onBack}>← กลับ</button>
          <span style={S.topBadge}>แก้ไขโพล</span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>{poll.title}</h2>
          {poll.description && <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{poll.description}</p>}
        </div>

        {/* Add candidate */}
        <div style={S.card}>
          <label style={S.label}>เพิ่มผู้สมัคร</label>
          <input
            style={S.input}
            placeholder="ชื่อผู้สมัคร"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCandidate()}
          />
          <input
            style={{ ...S.input, marginTop: 8 }}
            placeholder="Bio (ไม่บังคับ)"
            value={newBio}
            onChange={(e) => setNewBio(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCandidate()}
          />
          <button style={S.btnDashed} onClick={addCandidate}>+ เพิ่มผู้สมัคร</button>
        </div>

        {/* Candidates */}
        {poll.candidates && poll.candidates.length > 0 && (
          <div style={S.card}>
            <label style={S.label}>รายชื่อผู้สมัคร ({poll.candidates.length})</label>
            {poll.candidates.map((c) => (
              <div key={c.id} style={S.row}>
                <div style={S.avatar}>{c.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={S.name}>{c.name}</div>
                  {c.bio && <div style={S.bio}>{c.bio}</div>}
                </div>
                <button style={S.btnX} onClick={() => removeCandidate(c.id)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Toggle voting */}
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={S.label}>การลงคะแนน</div>
              <div style={{ fontSize: 13, color: poll.isOpen ? "#4ade80" : "#64748b" }}>
                {poll.isOpen ? "🟢 เปิดรับคะแนน" : "⚫ ปิดรับคะแนน"}
              </div>
            </div>
            <div style={{ ...S.toggle, background: poll.isOpen ? "#22c55e" : "#334155" }} onClick={toggleVoting}>
              <div style={{ ...S.toggleKnob, transform: poll.isOpen ? "translateX(24px)" : "translateX(0)" }} />
            </div>
          </div>
        </div>

        {/* Results */}
        {totalVotes > 0 && (
          <div style={S.card}>
            <label style={S.label}>ผลคะแนน ({totalVotes} คะแนน)</label>
            {winner && (
              <div style={S.winnerSmall}>
                <span style={{ fontSize: 18, marginRight: 6 }}>🏆</span>
                <span style={{ color: "#a3e635", fontWeight: 700, fontSize: 14 }}>{winner.name}</span>
                <span style={{ color: "#64748b", fontSize: 12, marginLeft: 8 }}>{votes[winner.id]} คะแนน</span>
              </div>
            )}
            {sortedCandidates.map((c) => {
              const pct = maxVotes > 0 ? ((votes[c.id] || 0) / maxVotes) * 100 : 0;
              const isW = c.id === winner?.id;
              return (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 13, color: isW ? "#a3e635" : "#cbd5e1", fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{votes[c.id] || 0}</span>
                  </div>
                  <div style={S.barBg}>
                    <div style={{ ...S.barFill, width: `${Math.max(pct, 3)}%`, background: isW ? "linear-gradient(90deg,#a3e635,#65a30d)" : "linear-gradient(90deg,#475569,#334155)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Voted emails */}
        {Object.keys(votedEmails).length > 0 && (
          <div style={S.card}>
            <label style={S.label}>ผู้โหวตแล้ว ({Object.keys(votedEmails).length} คน)</label>
            {Object.keys(votedEmails).map((email) => (
              <div key={email} style={{ ...S.row, borderBottom: "1px solid rgba(51,65,85,0.25)", paddingBottom: 8 }}>
                <div style={{ flex: 1, fontSize: 13, color: "#cbd5e1" }}>{email}</div>
                <button style={S.btnResetSmall} onClick={() => resetVoter(email)}>รีเซ็ต</button>
              </div>
            ))}
          </div>
        )}

        <button style={{ ...S.btnX, width: "100%", height: "auto", padding: "10px", marginTop: 20 }} onClick={deletePoll}>
          🗑️ ลบโพลนี้
        </button>
      </div>
    </div>
  );
}

// ─── VOTER DASHBOARD ──────────────────────────────────────────
function VoterDashboard({ polls, onBack }) {
  const [selectedPoll, setSelectedPoll] = useState(null);

  if (selectedPoll) {
    return <VoterPollPage pollId={selectedPoll} onBack={() => setSelectedPoll(null)} />;
  }

  return (
    <div style={S.root}>
      <div style={S.bg} />
      <div style={S.pageWrap}>
        <div style={S.topBar}>
          <button style={S.btnBack} onClick={onBack}>← กลับ</button>
          <span style={S.topBadge}>🗳️ VOTER</span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>โพลทั้งหมด</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>เลือกโพลที่ต้องการโหวต</p>
        </div>

        {polls.filter(p => p.isOpen).length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 60, color: "#64748b" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
            <p style={{ fontSize: 15 }}>ยังไม่มีโพลที่เปิดรับคะแนน</p>
          </div>
        ) : (
          <div>
            {polls.filter(p => p.isOpen).map((poll) => (
              <div key={poll.id} style={S.pollCard} onClick={() => setSelectedPoll(poll.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>{poll.title}</div>
                  {poll.description && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{poll.description}</div>}
                  <div style={{ fontSize: 11, color: "#4ade80" }}>🟢 เปิดรับคะแนน</div>
                </div>
                <span style={{ fontSize: 22, color: "#475569" }}>›</span>
              </div>
            ))}
          </div>
        )}

        {polls.filter(p => !p.isOpen).length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 24, marginBottom: 12 }}>
              ปิดรับคะแนนแล้ว
            </div>
            {polls.filter(p => !p.isOpen).map((poll) => (
              <div key={poll.id} style={{ ...S.pollCard, opacity: 0.6, cursor: "default" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>{poll.title}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>⚫ ปิดรับคะแนน</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── VOTER POLL PAGE ──────────────────────────────────────────
function VoterPollPage({ pollId, onBack }) {
  const [poll, setPoll] = useState(null);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const pollRef = ref(database, `polls/${pollId}`);
    const unsubscribe = onValue(pollRef, (snapshot) => {
      setPoll(snapshot.val());
    });
    return () => unsubscribe();
  }, [pollId]);

  if (!poll) return null;

  const checkEmail = () => {
    if (!email.trim() || !email.includes("@")) {
      alert("กรุณาใส่อีเมลให้ถูกต้อง");
      return;
    }
    const votedEmails = poll.votedEmails || {};
    if (votedEmails[email.toLowerCase()]) {
      alert("อีเมลนี้โหวตไปแล้ว");
      return;
    }
    setEmailSubmitted(true);
  };

  const vote = async (candidateId) => {
    if (hasVoted) return;
    const votes = { ...poll.votes, [candidateId]: (poll.votes?.[candidateId] || 0) + 1 };
    const votedEmails = { ...poll.votedEmails, [email.toLowerCase()]: candidateId };
    await update(ref(database, `polls/${pollId}`), { votes, votedEmails });
    setHasVoted(true);
  };

  const candidates = poll.candidates || [];
  const votes = poll.votes || {};
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(votes), 0);
  const sortedCandidates = [...candidates].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  const winner = sortedCandidates[0] && maxVotes > 0 ? sortedCandidates[0] : null;

  if (!emailSubmitted) {
    return (
      <div style={S.root}>
        <div style={S.bg} />
        <div style={S.center}>
          <div style={S.landingBox}>
            <button style={S.btnBack} onClick={onBack}>← กลับ</button>
            <div style={{ fontSize: 42, marginTop: 20, marginBottom: 12 }}>📧</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>{poll.title}</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 4, marginBottom: 24 }}>
              ใส่อีเมลเพื่อยืนยันตัวตน (โหวตได้ 1 ครั้งต่อ 1 อีเมล)
            </p>
            <input
              style={S.input}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkEmail()}
            />
            <button style={{ ...S.btnAdmin, marginTop: 16 }} onClick={checkEmail}>
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <div style={S.bg} />
      <div style={S.pageWrap}>
        <div style={S.topBar}>
          <button style={S.btnBack} onClick={onBack}>← กลับ</button>
          <span style={S.topBadge}>🗳️ {email}</span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>{poll.title}</h2>
          {poll.description && <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{poll.description}</p>}
        </div>

        {hasVoted && !showResults && (
          <div style={S.card}>
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 42, marginBottom: 6 }}>✅</div>
              <p style={{ fontSize: 15, color: "#4ade80", fontWeight: 600 }}>ขอบคุณที่ร่วมโหวต!</p>
              <p style={{ fontSize: 13, color: "#64748b" }}>คะแนนของคุณถูกบันทึกแล้ว</p>
            </div>
            <button style={{ ...S.btnPrimary, marginTop: 12 }} onClick={() => setShowResults(true)}>
              📊 ดูผลคะแนน
            </button>
          </div>
        )}

        {showResults && (
          <>
            {winner && (
              <div style={S.winnerBanner}>
                <div style={{ fontSize: 48 }}>🏆</div>
                <div style={{ color: "#a3e635", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginTop: 6 }}>ผู้นำ</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", marginTop: 4 }}>{winner.name}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{votes[winner.id]} คะแนน จาก {totalVotes} คน</div>
              </div>
            )}
            <div style={S.card}>
              <label style={S.label}>คะแนนทั้งหมด ({totalVotes}) 🔴 LIVE</label>
              {sortedCandidates.map((c) => {
                const pct = maxVotes > 0 ? ((votes[c.id] || 0) / maxVotes) * 100 : 0;
                const isW = c.id === winner?.id;
                return (
                  <div key={c.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 14, color: isW ? "#a3e635" : "#cbd5e1", fontWeight: 600 }}>
                        {isW ? "🏆 " : ""}{c.name}
                      </span>
                      <span style={{ fontSize: 13, color: "#64748b" }}>{votes[c.id] || 0} คะแนน</span>
                    </div>
                    <div style={S.barBg}>
                      <div style={{ ...S.barFill, width: `${Math.max(pct, 3)}%`, background: isW ? "linear-gradient(90deg,#a3e635,#65a30d)" : "linear-gradient(90deg,#475569,#334155)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!hasVoted && candidates.length > 0 && (
          <>
            <p style={{ fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 14 }}>
              เลือกผู้สมัครที่คุณต้องการโหวต
            </p>
            {candidates.map((c) => (
              <div key={c.id} style={S.voteCard} onClick={() => vote(c.id)}>
                <div style={S.avatar}>{c.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={S.name}>{c.name}</div>
                  {c.bio && <div style={S.bio}>{c.bio}</div>}
                </div>
                <span style={{ fontSize: 22, color: "#475569", fontWeight: 700 }}>›</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────
const S = {
  root: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  bg: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(ellipse at 15% 60%, #1e293b 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, #1a2e4a 0%, transparent 50%)",
    pointerEvents: "none",
  },
  center: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  pageWrap: {
    position: "relative",
    zIndex: 1,
    maxWidth: 480,
    margin: "0 auto",
    padding: "16px 20px 40px",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  btnBack: {
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: 14,
    cursor: "pointer",
    padding: "6px 0",
  },
  topBadge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#a5b4fc",
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.25)",
    padding: "4px 12px",
    borderRadius: 16,
  },
  landingBox: { textAlign: "center", maxWidth: 340, width: "100%" },
  logoIcon: { fontSize: 56, marginBottom: 8 },
  landingTitle: { fontSize: 42, fontWeight: 800, color: "#f1f5f9", margin: 0, letterSpacing: -1 },
  landingSub: { fontSize: 16, color: "#64748b", margin: "6px 0 0" },
  btnAdmin: {
    width: "100%",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    border: "none",
    color: "#fff",
    padding: "15px 20px",
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 18px rgba(99,102,241,0.3)",
  },
  btnVoter: {
    width: "100%",
    background: "rgba(30,41,59,0.8)",
    border: "1px solid rgba(51,65,85,0.5)",
    color: "#e2e8f0",
    padding: "15px 20px",
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "rgba(30,41,59,0.65)",
    border: "1px solid rgba(51,65,85,0.5)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    backdropFilter: "blur(6px)",
  },
  pollCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(51,65,85,0.5)",
    borderRadius: 16,
    padding: "16px 18px",
    marginBottom: 10,
    cursor: "pointer",
    transition: "border-color 0.2s",
    backdropFilter: "blur(6px)",
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
    display: "block",
  },
  input: {
    width: "100%",
    background: "rgba(15,23,42,0.55)",
    border: "1px solid rgba(51,65,85,0.45)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  btnDashed: {
    width: "100%",
    marginTop: 10,
    background: "rgba(99,102,241,0.1)",
    border: "1px dashed rgba(99,102,241,0.35)",
    color: "#a5b4fc",
    padding: "9px 0",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "9px 0",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 15,
    color: "#fff",
    flexShrink: 0,
  },
  name: { fontSize: 14, fontWeight: 600, color: "#e2e8f0" },
  bio: { fontSize: 12, color: "#64748b", marginTop: 1 },
  btnX: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#f87171",
    width: 28,
    height: 28,
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  toggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    background: "#fff",
    position: "absolute",
    top: 3,
    left: 3,
    transition: "transform 0.2s",
  },
  voteCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(51,65,85,0.5)",
    borderRadius: 16,
    padding: "16px 18px",
    marginBottom: 10,
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    backdropFilter: "blur(6px)",
  },
  winnerBanner: {
    textAlign: "center",
    background: "linear-gradient(135deg, rgba(34,197,94,0.07), rgba(163,230,53,0.04))",
    border: "1px solid rgba(163,230,53,0.2)",
    borderRadius: 18,
    padding: "22px 16px",
    marginBottom: 14,
  },
  winnerSmall: {
    display: "flex",
    alignItems: "center",
    background: "rgba(34,197,94,0.08)",
    borderRadius: 10,
    padding: "8px 12px",
    marginBottom: 12,
  },
  barBg: { height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, transition: "width 0.5s ease" },
  btnPrimary: {
    width: "100%",
    background: "linear-gradient(135deg,#6366f1,#4f46e5)",
    border: "none",
    color: "#fff",
    padding: "12px 0",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnResetSmall: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#f87171",
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 6,
    cursor: "pointer",
  },
};
