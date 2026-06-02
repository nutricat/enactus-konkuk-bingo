"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, Participant } from "@/lib/supabase";

const BINGO_LINES = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

function getBadgeStyle(count: number) {
  if (count === 0) return { bg: "#f5f0c0", color: "#8a7a00" };
  if (count === 1) return { bg: "#c8e6f5", color: "#2a6fa8" };
  if (count === 2) return { bg: "#c8f0d8", color: "#2a7a4a" };
  return { bg: "#e8e0f5", color: "#6b3fa0" };
}

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [bingoMap, setBingoMap] = useState<Record<string, number>>({});
  const [cellMap, setCellMap] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const { data: pList } = await supabase
      .from("participants")
      .select("*")
      .order("created_at");

    if (!pList) { setLoading(false); return; }
    setParticipants(pList);

    const { data: checks } = await supabase
      .from("bingo_checks")
      .select("participant_id, cell_index, checked")
      .in("participant_id", pList.map((p) => p.id))
      .eq("checked", true);

    const map: Record<string, Set<number>> = {};
    for (const p of pList) map[p.id] = new Set();
    for (const c of checks ?? []) map[c.participant_id]?.add(c.cell_index);

    const bingoCount: Record<string, number> = {};
    const cellCount: Record<string, number> = {};
    for (const p of pList) {
      const checked = map[p.id];
      let count = 0;
      for (const line of BINGO_LINES) {
        if (line.every((i) => checked.has(i))) count++;
      }
      bingoCount[p.id] = count;
      cellCount[p.id] = checked.size;
    }
    setBingoMap(bingoCount);
    setCellMap(cellCount);
    setLoading(false);
  }

  async function addParticipant() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data } = await supabase
      .from("participants")
      .insert({ name: trimmed })
      .select()
      .single();
    if (data) {
      setParticipants((prev) => [...prev, data]);
      setBingoMap((prev) => ({ ...prev, [data.id]: 0 }));
    }
    setName("");
    inputRef.current?.focus();
  }

  return (
    <div style={{ background: "#e8e8ed", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, paddingBottom: 90 }}>
        <div style={{ padding: "28px 20px 12px" }}>
          <h1 className="font-heading" style={{ fontSize: 28, margin: 0, lineHeight: 1.2, color: "#111" }}>
            기말고사 빙고 🎯
          </h1>
          <p style={{ color: "#666", fontSize: 14, marginTop: 6 }}>
            참가자 {participants.length}명 · 진행중
          </p>
        </div>

        <div style={{ padding: "0 16px" }}>
          {loading ? (
            <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>불러오는 중...</p>
          ) : participants.length === 0 ? (
            <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>참가자를 추가해보세요!</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[...participants]
                .sort((a, b) => (bingoMap[b.id] ?? 0) - (bingoMap[a.id] ?? 0))
                .map((p, rank) => {
                  const count = bingoMap[p.id] ?? 0;
                  const cells = cellMap[p.id] ?? 0;
                  const badge = getBadgeStyle(count);
                  return (
                    <button
                      key={p.id}
                      onClick={() => router.push(`/bingo/${p.id}`)}
                      style={{
                        background: "#fff",
                        borderRadius: 16,
                        border: "none",
                        padding: "14px 12px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 8,
                        cursor: "pointer",
                        textAlign: "left",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          fontSize: 11,
                          color: "#bbb",
                          fontWeight: 600,
                        }}
                      >
                        #{rank + 1}
                      </span>
                      <span className="font-heading" style={{ fontSize: 15, color: "#111", paddingRight: 20 }}>
                        {p.name}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            borderRadius: 20,
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {count}빙고
                        </span>
                        <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>
                          {cells}/25
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 480,
            padding: "12px 16px",
            background: "#e8e8ed",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addParticipant()}
            placeholder="이름 입력"
            style={{
              flex: 1,
              border: "none",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 15,
              background: "#fff",
              outline: "none",
            }}
          />
          <button
            onClick={addParticipant}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 20px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
