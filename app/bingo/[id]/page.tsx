"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase, Participant, BingoCheck } from "@/lib/supabase";

const ITEMS = [
  "공부할 때 최애간식 공유하기",
  "천원의 아침밥 인증하기",
  "그림이나 낙서 사담방에 공유하고 칭찬 2마디 듣기",
  "공부 계획표 인증하기",
  "캠퍼스 제일 좋아하는 장소 소개하기",
  "노트 정리본 인증하기",
  "건구스랑 셀카찍기",
  "꼬질이로 학교간거 인증하기(모자or마스크)",
  "교수님 성대모사 영상찍기",
  "1.5km 러닝하기",
  "최애 맛집 소개하기",
  "하루 15000보 이상 걷기",
  "공부 누적 40시간 인증(열품타)",
  "OOTD MZ샷으로 3장 찍기",
  "시험끝나면 하고 싶은 것 공유하기",
  "교수님이랑 셀카찍기",
  "인건 얼품타 들어오기",
  "공부 누적 20시간 인증(열품타)",
  "좌우명 공유하기",
  "영양제 챙겨먹기",
  "공부 타임랩스 올리기",
  "하루에 찍은 사진 5장 공유하기",
  "이캠퍼스 온강 인증하기",
  "도서관 인증하기",
  "길냥이랑 사진찍기",
];

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

const LINE_COLORS = [
  { bg: "#c8e6f5", color: "#1a5a8a" },
  { bg: "#c8f0d8", color: "#1a6a3a" },
  { bg: "#e8e0f5", color: "#5a2a8a" },
  { bg: "#f5f0c0", color: "#8a7a00" },
];

function getLineLabel(lineIndex: number) {
  if (lineIndex < 5) return `가로 ${lineIndex + 1}줄`;
  if (lineIndex < 10) return `세로 ${lineIndex - 4}줄`;
  if (lineIndex === 10) return "대각 \\ 줄";
  return "대각 / 줄";
}

function computeCompletedLines(checked: Set<number>) {
  const completed: number[] = [];
  for (let i = 0; i < BINGO_LINES.length; i++) {
    if (BINGO_LINES[i].every((idx) => checked.has(idx))) {
      completed.push(i);
    }
  }
  return completed;
}

function getCellColor(
  cellIndex: number,
  checked: Set<number>,
  completedLines: number[]
): { bg: string; color: string } | null {
  if (!checked.has(cellIndex)) return null;
  for (let ci = 0; ci < completedLines.length; ci++) {
    const lineIdx = completedLines[ci];
    if (BINGO_LINES[lineIdx].includes(cellIndex)) {
      return LINE_COLORS[ci % LINE_COLORS.length];
    }
  }
  return LINE_COLORS[0];
}

function getBadgeStyle(count: number) {
  if (count === 0) return { bg: "#f5f0c0", color: "#8a7a00" };
  if (count === 1) return { bg: "#c8e6f5", color: "#2a6fa8" };
  if (count === 2) return { bg: "#c8f0d8", color: "#2a7a4a" };
  return { bg: "#e8e0f5", color: "#6b3fa0" };
}

export default function BingoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    const [{ data: p }, { data: checks }] = await Promise.all([
      supabase.from("participants").select("*").eq("id", id).single(),
      supabase
        .from("bingo_checks")
        .select("cell_index, checked")
        .eq("participant_id", id)
        .eq("checked", true),
    ]);
    if (p) setParticipant(p);
    const set = new Set<number>((checks ?? []).map((c: { cell_index: number }) => c.cell_index));
    setChecked(set);
    setLoading(false);
  }

  async function deleteParticipant() {
    if (!confirm(`"${participant?.name}" 참가자를 삭제할까요?`)) return;
    await supabase.from("bingo_checks").delete().eq("participant_id", id);
    await supabase.from("participants").delete().eq("id", id);
    router.push("/");
  }

  async function toggleCell(cellIndex: number) {
    const isChecked = checked.has(cellIndex);
    const next = new Set(checked);
    if (isChecked) {
      next.delete(cellIndex);
    } else {
      next.add(cellIndex);
    }
    setChecked(next);

    await supabase.from("bingo_checks").upsert(
      { participant_id: id, cell_index: cellIndex, checked: !isChecked },
      { onConflict: "participant_id,cell_index" }
    );
  }

  const completedLines = computeCompletedLines(checked);
  const bingoCount = completedLines.length;
  const badge = getBadgeStyle(bingoCount);

  if (loading) {
    return (
      <div style={{ background: "#e8e8ed", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#999" }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#e8e8ed", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Header */}
        <div style={{ padding: "20px 16px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => router.push("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#555",
                fontSize: 14,
                padding: "4px 0",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              ← 명단으로
            </button>
            <button
              onClick={deleteParticipant}
              style={{
                background: "none",
                border: "1px solid #ffaaaa",
                borderRadius: 8,
                cursor: "pointer",
                color: "#cc3333",
                fontSize: 13,
                padding: "4px 12px",
                marginBottom: 8,
              }}
            >
              🗑 삭제
            </button>
          </div>
          <h2 className="font-heading" style={{ fontSize: 26, margin: 0, color: "#111" }}>
            {participant?.name ?? ""}
          </h2>
        </div>

        {/* Bingo status bar */}
        <div style={{ padding: "0 16px 14px" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                background: badge.bg,
                color: badge.color,
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              ✨ {bingoCount}빙고!
            </span>
          </div>
        </div>

        {/* 5x5 Grid */}
        <div style={{ padding: "0 16px 24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 6,
            }}
          >
            {ITEMS.map((item, idx) => {
              const cellColor = getCellColor(idx, checked, completedLines);
              const isChecked = checked.has(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleCell(idx)}
                  style={{
                    background: cellColor ? cellColor.bg : "#fff",
                    color: cellColor ? cellColor.color : "#333",
                    border: "none",
                    borderRadius: 12,
                    padding: "8px 4px",
                    fontSize: 10,
                    fontWeight: isChecked ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "center",
                    lineHeight: 1.3,
                    minHeight: 70,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    wordBreak: "keep-all",
                    transition: "background 0.15s",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
