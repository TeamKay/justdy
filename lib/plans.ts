import { PlanType } from "./generated/prisma/enums";

type PlanConfig = {
  name: string;
  sessionsPerMonth: number;
  maxCourseAccess: number;
  price: number;

  educatorMessaging: boolean;
  downloadableResources: boolean;
  certificates: boolean;
  prioritySupport: boolean;
};

export const PLANS = {
  FlexPay: {
    name: "FlexPay",
    sessionsPerMonth: 2,
    maxCourseAccess: 1,
    price: 25,
    educatorMessaging: false,
    downloadableResources: false,
    certificates: false,
    prioritySupport: false,
  },

  Standard: {
    name: "Standard",
    sessionsPerMonth: 10,
    maxCourseAccess: 10,
    price: 149,
    educatorMessaging: true,
    downloadableResources: true,
    certificates: true,
    prioritySupport: false,
  },

  Premium: {
    name: "Premium",
    sessionsPerMonth: Infinity,
    maxCourseAccess: Infinity,
    price: 249,

    educatorMessaging: true,
    downloadableResources: true,
    certificates: true,
    prioritySupport: true,
  },
} satisfies Record<PlanType, PlanConfig>;

export const PLAN_PRICES: Record<Exclude<PlanType, "Free">, string> = {
  FlexPay: "price_1TWGmeATTRD73z5hdM9aE0Fm",
  Standard: "price_1TWGoHATTRD73z5hHuXSvFyJ",
  Premium: "price_1TWJ3wATTRD73z5hYqAccGvw",
};
