// 1. Core Plan Config Map
export const PLANS = {
  FlexPay: {
    // We can define the sub-tiers directly inside FlexPay for clean UI rendering
    tiers: {
      mins30: {
        name: "FlexPay 30 Min",
        sessionsPerMonth: "Per Booking",
        maxCourseAccess: 1,
        price: 25,
        durationText: "30-minute intense sprint",
        educatorMessaging: false,
        downloadableResources: false,
        certificates: false,
        prioritySupport: false,
      },
      mins45: {
        name: "FlexPay 45 Min",
        sessionsPerMonth: "Per Booking",
        maxCourseAccess: 1,
        price: 35,
        durationText: "45-minute review",
        educatorMessaging: false,
        downloadableResources: true,
        certificates: false,
        prioritySupport: false,
      },
      mins60: {
        name: "FlexPay 60 Min",
        sessionsPerMonth: "Per Booking",
        maxCourseAccess: 2,
        price: 45,
        durationText: "Full 60-minute deep session",
        educatorMessaging: true,
        downloadableResources: true,
        certificates: true,
        prioritySupport: false,
      },
    },
  },

  Monthly: {
    name: "Monthly Subscription",
    sessionsPerMonth: Infinity, // Unlimited monthly access
    maxCourseAccess: Infinity,
    price: 200,
    educatorMessaging: true,
    downloadableResources: true,
    certificates: true,
    prioritySupport: true,
  },
};

// 2. Updated API / Payment Gateways Price Mapping (e.g., Stripe Price IDs)
export const PLAN_PRICES = {
  FlexPay: {
    mins30: "price_1TWGmeATTRD73z5hdM9aE0Fm",
    mins45: "price_1TWGoHATTRD73z5hHuXSvFyJ",
    mins60: "price_1TWJ3wATTRD73z5hYqAccGvw",
  },
  Monthly: "price_1TYA9TATTRD73z5hABQSDsZa",
};
