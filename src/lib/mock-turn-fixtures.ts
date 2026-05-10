// src/lib/mock-turn-fixtures.ts
//
// Mock TurnResponse fixtures for the kiosk frontend. Mirror of the three
// demo scenarios from docs/refactor/2026-05-09-llm-turn-decision.md §8.
// Replaces the old triage/escalation fixtures.

import type { AgencyContact, Receipt, TurnResponse } from "@/types/goodbois";

export const mockAgencyContact: AgencyContact = {
  key: "polyclinic-bedok",
  name: "Bedok Polyclinic",
  hotline: "6555-0000",
  address: "11 Bedok North Street 1",
  category: "healthcare",
  openingHours: "Mon–Fri 8am–5pm",
  multilingualBlurb: {
    en: "Walk-in eye checks and chronic disease care.",
    "zh-Hans": "提供视力检查与慢性病护理。",
  },
  active: true,
  source: "seed",
  updatedAt: "2026-05-09T00:00:00+08:00",
};

export const mockReceipt: Receipt = {
  id: "GBR-20260509-001",
  sessionId: "demo-session-001",
  language: "zh-Hans",
  body: "Bedok Polyclinic — Eye Check\nWalk-in until 4pm, by appointment after.",
  thingsToBring: ["NRIC", "Medisave card", "current glasses"],
  signpostedAgencyKey: "polyclinic-bedok",
  generatedAt: "2026-05-09T10:01:00+08:00",
};

export const mockTurnResponses: Record<string, TurnResponse> = {
  followup_listening: {
    sessionId: "demo-session-001",
    state: "followup",
    transcript: {
      english: "where do I get my eye checked",
      srcLang: "zh-SG",
    },
    kioskMessage: "您要找一般门诊还是医院的眼科？",
  },
  done_signpost: {
    sessionId: "demo-session-001",
    state: "done",
    transcript: {
      english: "polyclinic",
      srcLang: "zh-SG",
    },
    kioskMessage:
      "勿洛综合诊疗所可以做眼睛检查，今天开到下午五点。我已经打印了地址和需要带的东西。",
    receiptUrl: `/receipts/${mockReceipt.id}`,
  },
  done_hazard: {
    sessionId: "demo-session-002",
    state: "done",
    transcript: {
      english: "the light at my void deck is broken, someone will fall",
      srcLang: "en-SG",
    },
    kioskMessage:
      "I've filed a report with the East Coast Town Council. Your reference is on the receipt. The town council usually acts within 3 working days.",
    receiptUrl: "/receipts/GBR-20260509-002",
  },
};
