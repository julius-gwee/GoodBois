import type { Resource, RouteOption } from "@/types/goodbois";

export const kioskLocation = {
  latitude: 1.30218,
  longitude: 103.85092,
  label: {
    en: "Kawan kiosk at Block 123 void deck",
    "zh-Hans": "第123座组屋楼下 Kawan 服务亭",
    "nan-Hant": "Block 123 樓下 Kawan 服務亭",
    ms: "Kios Kawan di kolong Blok 123",
    ta: "பிளாக் 123 void deck Kawan நிலையம்",
  },
};

export const demoResources: Resource[] = [
  {
    id: "senior-corner",
    name: {
      en: "Senior Activity Corner",
      "zh-Hans": "乐龄活动角",
      "nan-Hant": "樂齡活動角",
      ms: "Sudut Aktiviti Warga Emas",
      ta: "மூத்தோர் செயல்பாட்டு இடம்",
    },
    category: "senior_activity",
    description: {
      en: "Drop-in exercise and befriending activities beside the RC centre.",
      "zh-Hans": "居民委员会旁的运动和邻里陪伴活动点。",
      ms: "Aktiviti senaman dan teman berbual bersebelahan pusat RC.",
    },
    address: {
      en: "Block 124, Level 1 sheltered plaza",
      "zh-Hans": "第124座一楼有盖广场",
      ms: "Blok 124, plaza berbumbung aras 1",
    },
    latitude: 1.30272,
    longitude: 103.85155,
    openingHours: {
      en: "Daily, 7:00 AM - 9:00 PM",
      "zh-Hans": "每日，早上7点至晚上9点",
      ms: "Setiap hari, 7:00 pagi - 9:00 malam",
    },
    contactPhone: "6123 4567",
    costType: "free",
    languages: ["en", "zh-Hans", "nan-Hant", "ms"],
    accessibilityFeatures: [
      { en: "Step-free access", "zh-Hans": "无台阶通道", ms: "Akses tanpa tangga" },
      { en: "Sheltered path", "zh-Hans": "有盖走道", ms: "Laluan berbumbung" },
    ],
    practicalNotes: [
      {
        en: "Good for light exercise, seated activities, and meeting volunteers.",
        "zh-Hans": "适合轻量运动、坐着参加活动，以及见义工。",
        ms: "Sesuai untuk senaman ringan, aktiviti duduk, dan bertemu sukarelawan.",
      },
    ],
    photos: [],
    verificationStatus: "verified",
    lastVerifiedAt: "2026-05-09T08:00:00+08:00",
    verifiedByRole: "RC volunteer",
    confidenceLevel: "high",
    source: "seed",
    mapProviderReference: "demo-onemap-senior-corner",
    routeNotes: [
      {
        en: "Use the sheltered walkway beside the playground.",
        "zh-Hans": "请走游乐场旁边的有盖走道。",
        ms: "Gunakan laluan berbumbung di sebelah taman permainan.",
      },
    ],
    currentHazardStatus: "none",
    details: {
      type: "senior_activity",
      activities: ["morning exercise", "befriending", "health talks"],
      sheltered: true,
      dropInFriendly: true,
    },
    createdAt: "2026-05-09T00:00:00+08:00",
    updatedAt: "2026-05-09T08:00:00+08:00",
  },
  {
    id: "kampong-glam-rc",
    name: {
      en: "Kampong Glam RC Centre",
      "zh-Hans": "甘榜格南居民委员会中心",
      ms: "Pusat RC Kampong Glam",
      ta: "கம்போங் கிளாம் RC மையம்",
    },
    category: "rc_centre",
    description: {
      en: "Local RC centre for volunteer help, forms, and community referrals.",
      "zh-Hans": "可向义工求助、处理表格和社区转介的居民委员会中心。",
    },
    address: {
      en: "Block 125, #01-12",
      "zh-Hans": "第125座 #01-12",
      ms: "Blok 125, #01-12",
    },
    latitude: 1.30165,
    longitude: 103.85116,
    openingHours: {
      en: "Mon-Fri, 10:00 AM - 6:00 PM",
      "zh-Hans": "周一至周五，上午10点至傍晚6点",
    },
    contactPhone: "6987 1100",
    languages: ["en", "zh-Hans", "ms", "ta"],
    accessibilityFeatures: [
      { en: "Lift nearby", "zh-Hans": "附近有电梯" },
      { en: "Wide entrance", "zh-Hans": "入口宽敞" },
    ],
    practicalNotes: [
      {
        en: "Ask here if you need help explaining a case to MP or RC volunteers.",
        "zh-Hans": "如果需要向议员或居民委员会义工说明个案，可到这里求助。",
      },
    ],
    photos: [],
    verificationStatus: "verified",
    lastVerifiedAt: "2026-05-09T08:00:00+08:00",
    confidenceLevel: "high",
    source: "seed",
    currentHazardStatus: "none",
    details: {
      type: "rc_centre",
      services: ["case referral", "form guidance", "community activities"],
      volunteerHours: "Weekdays 10:00 AM - 6:00 PM",
      mpSessionInfo: "Ask staff for Meet-the-People session timing.",
    },
    createdAt: "2026-05-09T00:00:00+08:00",
    updatedAt: "2026-05-09T08:00:00+08:00",
  },
  {
    id: "dialysis-support-clinic",
    name: {
      en: "Neighbourhood Health Assist Clinic",
      "zh-Hans": "邻里健康援助诊所",
      ms: "Klinik Bantuan Kesihatan Kejiranan",
      ta: "அருகாமை சுகாதார உதவி மருத்துவ நிலையம்",
    },
    category: "clinic",
    description: {
      en: "Clinic reception can help residents call ahead about dialysis transport delays.",
      "zh-Hans": "诊所柜台可协助居民致电说明洗肾交通延误。",
    },
    address: {
      en: "Block 126, #01-08",
      "zh-Hans": "第126座 #01-08",
    },
    latitude: 1.302,
    longitude: 103.85218,
    openingHours: {
      en: "Mon-Sat, 8:30 AM - 1:00 PM",
      "zh-Hans": "周一至周六，早上8点30分至下午1点",
    },
    contactPhone: "6333 9088",
    languages: ["en", "zh-Hans", "ta"],
    accessibilityFeatures: [
      { en: "Ramp at entrance", "zh-Hans": "入口有斜坡" },
      { en: "Priority seating", "zh-Hans": "优先座位" },
    ],
    practicalNotes: [
      {
        en: "Not for emergencies. Dial 995 if the resident needs urgent medical help.",
        "zh-Hans": "不适用于紧急情况。如需紧急医疗援助，请拨打995。",
      },
    ],
    photos: [],
    verificationStatus: "needs_recheck",
    confidenceLevel: "medium",
    source: "seed",
    currentHazardStatus: "caution",
    details: {
      type: "clinic",
      services: ["health advice", "call-ahead support"],
      appointmentRequired: true,
      dialysisSupportNearby: true,
    },
    createdAt: "2026-05-09T00:00:00+08:00",
    updatedAt: "2026-05-09T08:00:00+08:00",
  },
  {
    id: "accessible-toilet-124",
    name: {
      en: "Accessible Toilet at Block 124",
      "zh-Hans": "第124座无障碍厕所",
      ms: "Tandas Mudah Akses di Blok 124",
      ta: "பிளாக் 124 அணுகல் கழிப்பறை",
    },
    category: "accessible_restroom",
    description: {
      en: "Ground-floor accessible restroom near the senior activity corner.",
      "zh-Hans": "乐龄活动角附近的一楼无障碍厕所。",
    },
    address: {
      en: "Block 124, Level 1, beside lift lobby B",
      "zh-Hans": "第124座一楼，B电梯厅旁",
    },
    latitude: 1.30258,
    longitude: 103.85182,
    openingHours: {
      en: "Daily, 6:00 AM - 10:00 PM",
      "zh-Hans": "每日，早上6点至晚上10点",
    },
    costType: "free",
    languages: ["en", "zh-Hans", "ms", "ta"],
    accessibilityFeatures: [
      { en: "Grab bars", "zh-Hans": "扶手" },
      { en: "Caregiver entry possible", "zh-Hans": "照护者可陪同进入" },
    ],
    practicalNotes: [
      { en: "Last checked clean in the morning.", "zh-Hans": "早上检查时较干净。" },
    ],
    photos: [],
    verificationStatus: "community_submitted",
    confidenceLevel: "medium",
    source: "community",
    currentHazardStatus: "none",
    details: {
      type: "accessible_restroom",
      floor: "1",
      nearestLift: "Lift lobby B",
      caregiverEntryPossible: true,
      adultChangingBench: false,
    },
    createdAt: "2026-05-09T00:00:00+08:00",
    updatedAt: "2026-05-09T08:00:00+08:00",
  },
  {
    id: "kampong-glam-digital-help",
    name: {
      en: "Digital Form Help Counter",
      "zh-Hans": "数码表格协助柜台",
      ms: "Kaunter Bantuan Borang Digital",
      ta: "டிஜிட்டல் படிவ உதவி மேசை",
    },
    category: "digital_form_help",
    description: {
      en: "Volunteers help with Singpass, CDC vouchers, and government forms.",
      "zh-Hans": "义工协助处理 Singpass、CDC 邻里购物券和政府表格。",
    },
    address: {
      en: "Block 125 RC Centre, front counter",
      "zh-Hans": "第125座居民委员会中心前台",
    },
    latitude: 1.30175,
    longitude: 103.85108,
    openingHours: {
      en: "Tue and Thu, 2:00 PM - 5:00 PM",
      "zh-Hans": "周二和周四，下午2点至5点",
    },
    contactPhone: "6987 1100",
    languages: ["en", "zh-Hans", "ms"],
    accessibilityFeatures: [
      { en: "Seated waiting area", "zh-Hans": "有座位等候区" },
      { en: "Large-print forms available", "zh-Hans": "可提供大字版表格" },
    ],
    practicalNotes: [
      {
        en: "Bring phone, Singpass app, and any letter you received.",
        "zh-Hans": "请带手机、Singpass 应用和收到的信件。",
      },
    ],
    photos: [],
    verificationStatus: "verified",
    confidenceLevel: "high",
    source: "seed",
    currentHazardStatus: "none",
    details: {
      type: "digital_form_help",
      helpTypes: ["Singpass", "CDC vouchers", "online forms"],
      appointmentRequired: false,
      documentsNeeded: ["phone", "letter", "Singpass app if available"],
      singpassHelpAvailable: true,
      voucherHelpAvailable: true,
    },
    createdAt: "2026-05-09T00:00:00+08:00",
    updatedAt: "2026-05-09T08:00:00+08:00",
  },
  {
    id: "blk-123-pickup",
    name: {
      en: "Block 123 Pickup Point",
      "zh-Hans": "第123座接送点",
      ms: "Tempat Ambil Blok 123",
    },
    category: "pickup_dropoff",
    description: {
      en: "Sheltered pickup and drop-off point for taxis and family drivers.",
      "zh-Hans": "有盖德士和家人接送点。",
    },
    address: {
      en: "Block 123 service road, beside main lift lobby",
      "zh-Hans": "第123座服务路，主电梯厅旁",
    },
    latitude: 1.30198,
    longitude: 103.85068,
    openingHours: {
      en: "Always open",
      "zh-Hans": "全天开放",
    },
    languages: ["en", "zh-Hans", "ms"],
    accessibilityFeatures: [
      { en: "Sheltered curb", "zh-Hans": "有盖路边" },
      { en: "Wheelchair taxi suitable", "zh-Hans": "适合轮椅德士" },
    ],
    practicalNotes: [
      {
        en: "Best pickup point when lift lobby A is crowded.",
        "zh-Hans": "A电梯厅拥挤时，可使用此接送点。",
      },
    ],
    photos: [],
    verificationStatus: "verified",
    confidenceLevel: "high",
    source: "seed",
    currentHazardStatus: "none",
    details: {
      type: "pickup_dropoff",
      sheltered: true,
      vehicleTypeSupported: ["taxi", "wheelchair taxi", "family car"],
      wheelchairTaxiSuitable: true,
      routeToEntrance: "Follow the level walkway to lift lobby A.",
    },
    createdAt: "2026-05-09T00:00:00+08:00",
    updatedAt: "2026-05-09T08:00:00+08:00",
  },
];

const seniorCornerRoutes: RouteOption[] = [
  {
    id: "senior-corner-wheelchair",
    destinationResourceId: "senior-corner",
    mode: "wheelchair",
    durationMinutes: 6,
    distanceMeters: 280,
    isRecommended: true,
    providerLabel: "Wheelchair-friendly preview route",
    origin: kioskLocation,
    polyline: [
      { latitude: 1.30218, longitude: 103.85092 },
      { latitude: 1.30232, longitude: 103.85108 },
      { latitude: 1.3025, longitude: 103.85131 },
      { latitude: 1.30272, longitude: 103.85155 },
    ],
    notes: [
      {
        en: "Mostly sheltered and step-free. Confirm lift status before leaving.",
        "zh-Hans": "大部分有盖且无台阶。出发前请确认电梯状况。",
        ms: "Kebanyakannya berbumbung dan tanpa tangga. Sahkan lif sebelum bergerak.",
      },
    ],
    steps: [
      {
        id: "w1",
        instruction: {
          en: "Leave the kiosk and turn right toward lift lobby A.",
          "zh-Hans": "离开服务亭后右转，走向A电梯厅。",
          ms: "Keluar dari kios dan belok kanan ke lobi lif A.",
        },
        distanceMeters: 60,
        durationMinutes: 1,
        latitude: 1.30228,
        longitude: 103.85102,
      },
      {
        id: "w2",
        instruction: {
          en: "Follow the sheltered walkway beside the playground.",
          "zh-Hans": "沿着游乐场旁的有盖走道前进。",
          ms: "Ikut laluan berbumbung di sebelah taman permainan.",
        },
        distanceMeters: 150,
        durationMinutes: 3,
        latitude: 1.3025,
        longitude: 103.85131,
      },
      {
        id: "w3",
        instruction: {
          en: "Use the ramp into the senior activity corner.",
          "zh-Hans": "使用斜坡进入乐龄活动角。",
          ms: "Gunakan tanjakan masuk ke sudut aktiviti warga emas.",
        },
        distanceMeters: 70,
        durationMinutes: 2,
        latitude: 1.30272,
        longitude: 103.85155,
      },
    ],
  },
  {
    id: "senior-corner-walk",
    destinationResourceId: "senior-corner",
    mode: "walk",
    durationMinutes: 4,
    distanceMeters: 210,
    isRecommended: false,
    providerLabel: "Walking preview route",
    origin: kioskLocation,
    polyline: [
      { latitude: 1.30218, longitude: 103.85092 },
      { latitude: 1.3024, longitude: 103.8512 },
      { latitude: 1.30272, longitude: 103.85155 },
    ],
    notes: [{ en: "Shorter route with one unsheltered crossing.", "zh-Hans": "路线较短，但有一段无盖过道。" }],
    steps: [
      {
        id: "walk1",
        instruction: { en: "Walk past the playground toward Block 124.", "zh-Hans": "经过游乐场，走向第124座。" },
        distanceMeters: 140,
        durationMinutes: 3,
        latitude: 1.3024,
        longitude: 103.8512,
      },
      {
        id: "walk2",
        instruction: { en: "Turn left into the activity corner.", "zh-Hans": "左转进入活动角。" },
        distanceMeters: 70,
        durationMinutes: 1,
        latitude: 1.30272,
        longitude: 103.85155,
      },
    ],
  },
  {
    id: "senior-corner-drive",
    destinationResourceId: "senior-corner",
    mode: "drive",
    durationMinutes: 2,
    distanceMeters: 420,
    isRecommended: false,
    providerLabel: "Driving drop-off preview",
    origin: kioskLocation,
    polyline: [
      { latitude: 1.30218, longitude: 103.85092 },
      { latitude: 1.30198, longitude: 103.85068 },
      { latitude: 1.3029, longitude: 103.8516 },
    ],
    notes: [{ en: "Use the Block 124 service road drop-off.", "zh-Hans": "请使用第124座服务路接送点。" }],
    steps: [
      {
        id: "drive1",
        instruction: { en: "Drive to the Block 124 service road.", "zh-Hans": "开车到第124座服务路。" },
        distanceMeters: 420,
        durationMinutes: 2,
        latitude: 1.3029,
        longitude: 103.8516,
      },
    ],
  },
];

const defaultRoutesFor = (resourceId: string): RouteOption[] =>
  seniorCornerRoutes.map((route) => ({
    ...route,
    id: `${resourceId}-${route.mode}`,
    destinationResourceId: resourceId,
    isRecommended: route.mode === "wheelchair",
  }));

export const demoRoutes: Record<string, RouteOption[]> = Object.fromEntries(
  demoResources.map((resource) => [
    resource.id,
    resource.id === "senior-corner" ? seniorCornerRoutes : defaultRoutesFor(resource.id),
  ]),
);
