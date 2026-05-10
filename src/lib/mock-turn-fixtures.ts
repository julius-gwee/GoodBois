// src/lib/mock-turn-fixtures.ts
//
// Mock TurnResponse fixtures for the kiosk frontend. Mirror of the demo
// scenarios from docs/refactor/2026-05-09-llm-turn-decision.md §8, plus the
// single-shot "divorce lawyer" flow gated behind SHOW_LAWYER_DEMO in KioskShell.

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

export const mockLegalAidAgencyContact: AgencyContact = {
  key: "legal-aid-bureau",
  name: "Legal Aid Bureau",
  hotline: "1800-2255-529",
  address: "45 Maxwell Road, #07-11 The URA Centre",
  category: "legal",
  openingHours: "Mon–Fri 8.30am–5pm",
  multilingualBlurb: {
    en: "Free legal advice and representation for divorce and family matters, subject to a means test.",
    "zh-Hans": "为离婚与家庭事务提供免费法律咨询与代理，须先通过经济状况审查。",
  },
  active: true,
  source: "seed",
  updatedAt: "2026-05-09T00:00:00+08:00",
};

export const mockLegalAidReceipt: Receipt = {
  id: "GBR-20260509-003",
  sessionId: "demo-session-003",
  language: "zh-Hans",
  body: "Legal Aid Bureau — Divorce / Family Law\nWalk-in for first advice; appointment needed for representation.",
  thingsToBring: ["NRIC", "marriage certificate", "income documents (payslips / CPF statement)"],
  signpostedAgencyKey: "legal-aid-bureau",
  generatedAt: "2026-05-09T10:01:00+08:00",
};

export const mockHazardAgencyContact: AgencyContact = {
  key: "town-council-east-coast",
  name: "East Coast Town Council",
  hotline: "6444-0000",
  address: "55 Marine Terrace, #01-100",
  category: "town_council",
  openingHours: "Mon–Fri 8.30am–5pm, Sat 8.30am–1pm",
  multilingualBlurb: {
    en: "Estate maintenance — lighting, lifts, cleaning, and common-area repairs.",
    "zh-Hans": "组屋区维护——照明、电梯、清洁与公共区域维修。",
  },
  active: true,
  source: "seed",
  updatedAt: "2026-05-09T00:00:00+08:00",
};

export const mockHazardReceipt: Receipt = {
  id: "GBR-20260509-002",
  sessionId: "demo-session-002",
  language: "en",
  body: "Hazard report — broken void-deck light\nFiled with East Coast Town Council. Usually acted on within 3 working days.",
  thingsToBring: [],
  caseSummary: "Resident reports the void-deck light at their block is out; trip/fall risk after dark.",
  signpostedAgencyKey: "town-council-east-coast",
  hazardReferenceId: "ECTC-20260509-014",
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
  // Single-shot demo: resident asks (in Mandarin) for a lawyer because their
  // spouse is filing for divorce; the kiosk signposts the Legal Aid Bureau.
  // Active by default in mock mode (see SHOW_LAWYER_DEMO in KioskShell; set
  // NEXT_PUBLIC_HIDE_LAWYER_DEMO=1 to use the eye-check / hazard sequence).
  done_lawyer: {
    sessionId: "demo-session-003",
    state: "done",
    transcript: {
      english: "我想找律师，我太太要跟我离婚",
      srcLang: "zh-SG",
    },
    kioskMessage:
      "好的，您可以去法律援助局。他们为离婚案件提供免费的法律咨询和代理，须先通过经济状况审查。我已经把地址和需要带的文件打印出来了。",
    receiptUrl: `/receipts/${mockLegalAidReceipt.id}`,
  },
};
