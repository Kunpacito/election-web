import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update } from "firebase/database";

// ─── FIREBASE CONFIG ──────────────────────────────────────────
// TODO: Replace with your Firebase config from console.firebase.google.com
const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR-PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-PROJECT.appspot.com",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ─── SHARED STORAGE HELPERS ───────────────────────────────────
const ELECTION_REF = ref(database, "election");

async function loadElection() {
  return new Promise((resolve) => {
    onValue(ELECTION_REF, (snapshot) => {
      resolve(snapshot.val());
    }, { onlyOnce: true });
  });
}

async function saveElection(data) {
  try {
    await set(ELECTION_REF, data);
  } catch (e) {
    console.error("Save failed", e);
  }
}

async function updateElectionVotes(votes) {
  try {
    await update(ELECTION_REF, { votes });
  } catch (e) {
    console.error("Update failed", e);
  }
}

// ─── ROOT APP ─────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null);
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await loadElection();
    setElection(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial load
    refresh();

    // Real-time listener
    const unsubscribe = onValue(ELECTION_REF, (snapshot) => {
      setElection(snapshot.val());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refresh]);

  if (loading) {
    return (
      <div style={S.root}>
        <div style={S.bg} />
        <div style={{ ...S.center, color: "#64748b", fontSize: 16 }}>กำลังโลด...</div>
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
            <h1 style={S.landingTitle}>เลือกตั้ง</h1>
            <p style={S.landingSub}>หัวหน้าห้อง</p>
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
    return <AdminPage election={election} onSave={saveElection} onRefresh={refresh} onBack={() => setRole(null)} />;
  }

  return <VoterPage election={election} onSave={saveElection} onUpdate={updateElectionVotes} onRefresh={refresh} onBack={() => setRole(null)} />;
}

// ─── ADMIN PAGE ───────────────────────────────────────────────
function AdminPage({ election, onSave, onRefresh, onBack }) {
  const [roomName, setRoomName] = useState(election?.roomName || "");
  const [candidates, setCandidates] = useState(election?.candidates || []);
  const [isOpen, setIsOpen] = useState(election?.isOpen || false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRoomName(election?.roomName || "");
    setCandidates(election?.candidates || []);
    setIsOpen(election?.isOpen || false);
  }, [election]);

  const persist = async (override = {}) => {
    setSaving(true);
    const data = {
      roomName: override.roomName ?? roomName,
      candidates: override.candidates ?? candidates,
      votes: election?.votes || {},
      isOpen: override.isOpen ?? isOpen,
    };
    await onSave(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const addCandidate = async () => {
    if (!newName.trim()) return;
    const updated = [
      ...candidates,
      { id: Date.now(), name: newName.trim(), bio: newBio.trim() || "" },
    ];
    setCandidates(updated);
    setNewName("");
    setNewBio("");
    await persist({ candidates: updated });
  };

  const removeCandidate = async (id) => {
    const updated = candidates.filter((c) => c.id !== id);
    setCandidates(updated);
    await persist({ candidates: updated });
  };

  const toggleVoting = async () => {
    const next = !isOpen;
    setIsOpen(next);
    await persist({ isOpen: next });
  };

  const resetVotes = async () => {
    setSaving(true);
    await onSave({ roomName, candidates, votes: {}, isOpen });
    setSaving(false);
  };

  const votes = election?.votes || {};
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(votes), 0);
  const sortedCandidates = [...candidates].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  const winner = sortedCandidates[0] && maxVotes > 0 ? sortedCandidates[0] : null;

  return (
    <div style={S.root}>
      <div style={S.bg} />
      <div style={S.pageWrap}>
        <div style={S.topBar}>
          <button style={S.btnBack} onClick={onBack}>← กลับ</button>
          <span style={S.topBadge}>⚙️ ADMIN</span>
          <div style={{ width: 60 }} />
        </div>

        {/* Room name */}
        <div style={S.card}>
          <label style={S.label}>ชื่อห้อง</label>
          <input
            style={S.input}
            placeholder="เช่น ห้อง 5/1"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onBlur={() => persist()}
          />
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
            placeholder="Bio (optional)"
            value={newBio}
            onChange={(e) => setNewBio(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCandidate()}
          />
          <button style={S.btnDashed} onClick={addCandidate}>
            + เพิ่มผู้สมัคร
          </button>
        </div>

        {/* Candidate list */}
        {candidates.length > 0 && (
          <div style={S.card}>
            <label style={S.label}>รายชื่อผู้สมัคร ({candidates.length})</label>
            {candidates.map((c) => (
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

        {/* Voting toggle */}
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={S.label}>การลงคะแนน</div>
              <div style={{ fontSize: 13, color: isOpen ? "#4ade80" : "#64748b" }}>
                {isOpen ? "🟢 เปิดรับคะแนนอยู่" : "⚫ ยังไม่เปิด"}
              </div>
            </div>
            <div style={{ ...S.toggle, background: isOpen ? "#22c55e" : "#334155" }} onClick={toggleVoting}>
              <div style={{ ...S.toggleKnob, transform: isOpen ? "translateX(24px)" : "translateX(0)", background: "#fff" }} />
            </div>
          </div>
        </div>

        {/* Live results */}
        {totalVotes > 0 && (
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>ผลคะแนน Live ({totalVotes} คะแนน)</label>
              <button style={S.btnResetSmall} onClick={resetVotes}>Reset</button>
            </div>
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

        <div style={{ textAlign: "center", marginTop: 6 }}>
          <span style={{ fontSize: 11, color: saved ? "#4ade80" : "#475569" }}>
            {saving ? "กำลังบันทึก..." : saved ? "✓ บันทึกแล้ว" : "🔴 Live Updates"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── VOTER PAGE ───────────────────────────────────────────────
function VoterPage({ election, onUpdate, onBack }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const candidates = election?.candidates || [];
  const isOpen = election?.isOpen || false;
  const votes = election?.votes || {};
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(votes), 0);
  const sortedCandidates = [...candidates].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  const winner = sortedCandidates[0] && maxVotes > 0 ? sortedCandidates[0] : null;

  const vote = async (id) => {
    if (hasVoted || !isOpen) return;
    const updated = { ...votes, [id]: (votes[id] || 0) + 1 };
    await onUpdate(updated);
    setHasVoted(true);
    setVotedFor(id);
  };

  // ── No candidates yet ──
  if (candidates.length === 0) {
    return (
      <div style={S.root}>
        <div style={S.bg} />
        <div style={S.pageWrap}>
          <div style={S.topBar}>
            <button style={S.btnBack} onClick={onBack}>← กลับ</button>
            <span style={S.topBadge}>🗳️ VOTER</span>
            <div style={{ width: 60 }} />
          </div>
          <div style={{ textAlign: "center", marginTop: 80, color: "#64748b" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
            <p style={{ fontSize: 15 }}>รอ Admin เพิ่มผู้สมัครก่อนนะครับ</p>
            <p style={{ fontSize: 13, color: "#475569" }}>🔴 Live Updates</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not open yet ──
  if (!isOpen && !hasVoted) {
    return (
      <div style={S.root}>
        <div style={S.bg} />
        <div style={S.pageWrap}>
          <div style={S.topBar}>
            <button style={S.btnBack} onClick={onBack}>← กลับ</button>
            <span style={S.topBadge}>🗳️ VOTER</span>
            <div style={{ width: 60 }} />
          </div>
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
            <p style={{ fontSize: 16, color: "#e2e8f0", fontWeight: 600 }}>รอเปิดรับคะแนน</p>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
              การเลือกตั้ง "{election?.roomName || "—"}" ยังไม่เปิดครับ
            </p>
            <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>🔴 Live Updates</p>
          </div>
          <div style={{ ...S.card, marginTop: 32 }}>
            <label style={S.label}>ผู้สมัคร ({candidates.length} คน)</label>
            {candidates.map((c) => (
              <div key={c.id} style={S.row}>
                <div style={S.avatar}>{c.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={S.name}>{c.name}</div>
                  {c.bio && <div style={S.bio}>{c.bio}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main voter ──
  return (
    <div style={S.root}>
      <div style={S.bg} />
      <div style={S.pageWrap}>
        <div style={S.topBar}>
          <button style={S.btnBack} onClick={onBack}>← กลับ</button>
          <span style={S.topBadge}>🗳️ VOTER</span>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "#64748b" }}>{election?.roomName || ""}</div>
          <h2 style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 800, color: "#f1f5f9" }}>เลือกตั้งหัวหน้าห้อง</h2>
        </div>

        {/* Voted confirmation */}
        {hasVoted && !showResults && (
          <div style={S.card}>
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 42, marginBottom: 6 }}>✅</div>
              <p style={{ fontSize: 15, color: "#4ade80", fontWeight: 600 }}>
                คุณลงคะแนนให้ {candidates.find((c) => c.id === votedFor)?.name} แล้วครับ
              </p>
            </div>
            <button style={{ ...S.btnPrimary, marginTop: 12 }} onClick={() => setShowResults(true)}>
              📊 ดูผลคะแนน
            </button>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <>
            {winner && (
              <div style={S.winnerBanner}>
                <div style={{ fontSize: 48 }}>🏆</div>
                <div style={{ color: "#a3e635", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginTop: 6 }}>ผู้ชนะ</div>
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

        {/* Candidate vote cards */}
        {isOpen && !hasVoted && (
          <>
            <p style={{ fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 14 }}>
              เลือกคนที่คุณอยากให้เป็นหัวหน้าครับ
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
  // Landing
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
  // Cards
  card: {
    background: "rgba(30,41,59,0.65)",
    border: "1px solid rgba(51,65,85,0.5)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
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
  // Row
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "9px 0",
    borderBottom: "1px solid rgba(51,65,85,0.25)",
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
  // Toggle
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
    position: "absolute",
    top: 3,
    left: 3,
    transition: "transform 0.2s",
  },
  // Vote card
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
  // Results
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
