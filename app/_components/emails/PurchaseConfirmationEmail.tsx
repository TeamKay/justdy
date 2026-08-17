import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PurchaseItem {
  title: string;
  type: string;
  quantity: number;
  amount: number;
  accessType: "course" | "download";
}

interface PurchaseConfirmationEmailProps {
  username: string;
  email: string;
  setupUrl?: string;
  items: PurchaseItem[];
  amountPaid: string;
  dashboardUrl: string;
  isNewAccount?: boolean;
}

export default function PurchaseConfirmationEmail({
  username,
  email,
  setupUrl,
  items,
  amountPaid,
  dashboardUrl,
  isNewAccount = false,
}: PurchaseConfirmationEmailProps) {
  return (
    <Html>
      <Head />

      <Preview>
        Official Justdy purchase notice — your payment was successfully
        processed.
      </Preview>

      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#171a1c",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
        }}
      >
        <Container
          style={{
            width: "100%",
            maxWidth: "640px",
            margin: "0 auto",
            backgroundColor: "#24282b",
          }}
        >
          {/* =========================================================
              HEADER — modeled after the attached official notice
          ========================================================== */}

          <Section
            style={{
              backgroundColor: "#f28f87",
              padding: "28px 30px 30px",
              borderBottom: "1px solid #df7c74",
            }}
          >
            {/* Top label */}
            <Section
              style={{
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              <Text
                style={{
                  display: "inline-block",
                  margin: 0,
                  padding: "7px 16px",
                  border: "1px solid #9d5c58",
                  borderRadius: "20px",
                  color: "#3b2928",
                  fontSize: "11px",
                  lineHeight: "1.2",
                  fontWeight: "800",
                  letterSpacing: "1.4px",
                }}
              >
                JUSTDY PURCHASE CONFIRMATION
              </Text>
            </Section>

            <Heading
              style={{
                margin: 0,
                color: "#202326",
                fontSize: "30px",
                lineHeight: "1.2",
                fontWeight: "800",
              }}
            >
              Official Purchase Notice
            </Heading>

            <Text
              style={{
                margin: "12px 0 0",
                color: "#3f3231",
                fontSize: "15px",
                lineHeight: "1.6",
              }}
            >
              This is an official confirmation that your payment was
              successfully processed and your Justdy purchase has been recorded.
            </Text>

            {/* Learner / purchase identification */}
            <Section
              style={{
                marginTop: "24px",
                padding: "16px 18px",
                backgroundColor: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(90,50,47,0.22)",
                borderRadius: "10px",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  color: "#674442",
                  fontSize: "11px",
                  lineHeight: "1.3",
                  fontWeight: "800",
                  letterSpacing: "0.8px",
                }}
              >
                CUSTOMER
              </Text>

              <Text
                style={{
                  margin: "2px 0 12px",
                  color: "#242629",
                  fontSize: "17px",
                  lineHeight: "1.3",
                  fontWeight: "800",
                }}
              >
                {username}
              </Text>

              <Text
                style={{
                  margin: 0,
                  color: "#674442",
                  fontSize: "11px",
                  lineHeight: "1.3",
                  fontWeight: "800",
                  letterSpacing: "0.8px",
                }}
              >
                PURCHASE STATUS
              </Text>

              <Text
                style={{
                  margin: "2px 0 0",
                  color: "#242629",
                  fontSize: "15px",
                  lineHeight: "1.3",
                  fontWeight: "800",
                }}
              >
                PAYMENT SUCCESSFUL
              </Text>
            </Section>
          </Section>

          {/* =========================================================
              MAIN NOTICE
          ========================================================== */}

          <Section
            style={{
              padding: "30px 30px 0",
              backgroundColor: "#24282b",
            }}
          >
            <Text
              style={{
                margin: 0,
                color: "#e7eaed",
                fontSize: "16px",
                lineHeight: "1.7",
              }}
            >
              Dear <strong>{username}</strong>,
            </Text>

            <Text
              style={{
                margin: "16px 0 0",
                color: "#aeb6bd",
                fontSize: "15px",
                lineHeight: "1.7",
              }}
            >
              Thank you for choosing Justdy. We are pleased to confirm that your
              payment has been successfully processed.
            </Text>

            {/* Payment status box */}
            <Section
              style={{
                marginTop: "24px",
                padding: "20px",
                backgroundColor: "#3b3031",
                borderLeft: "4px solid #f28f87",
                borderRadius: "4px",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  color: "#f28f87",
                  fontSize: "14px",
                  lineHeight: "1.4",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                }}
              >
                ✓ PAYMENT CONFIRMED
              </Text>

              <Text
                style={{
                  margin: "12px 0 0",
                  color: "#e3c9c7",
                  fontSize: "14px",
                  lineHeight: "1.7",
                }}
              >
                Your order has been recorded successfully. The products listed
                below are now associated with your Justdy account.
              </Text>
            </Section>
          </Section>

          {/* =========================================================
              PURCHASE DETAILS
          ========================================================== */}

          <Section
            style={{
              padding: "28px 30px 0",
              backgroundColor: "#24282b",
            }}
          >
            <Heading
              as="h2"
              style={{
                margin: 0,
                color: "#f1f3f5",
                fontSize: "20px",
                lineHeight: "1.4",
                fontWeight: "800",
              }}
            >
              Purchase Details
            </Heading>

            <Text
              style={{
                margin: "7px 0 16px",
                color: "#8f999f",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              Items included in this successful transaction.
            </Text>

            {items.length > 0 ? (
              items.map((item, index) => (
                <Section
                  key={`${item.title}-${index}`}
                  style={{
                    marginBottom: "10px",
                    padding: "16px",
                    backgroundColor: "#2d3236",
                    border: "1px solid #3d4449",
                    borderRadius: "8px",
                  }}
                >
                  <Text
                    style={{
                      margin: 0,
                      color: "#f1f3f5",
                      fontSize: "16px",
                      lineHeight: "1.45",
                      fontWeight: "800",
                    }}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      margin: "7px 0 0",
                      color: "#9fa8ae",
                      fontSize: "13px",
                      lineHeight: "1.5",
                    }}
                  >
                    {item.type} · Quantity: {item.quantity}
                  </Text>

                  <Text
                    style={{
                      margin: "6px 0 0",
                      color: "#b9c0c5",
                      fontSize: "13px",
                      lineHeight: "1.5",
                    }}
                  >
                    {item.accessType === "course"
                      ? "Course access granted"
                      : "Digital product available in your library"}
                  </Text>

                  {typeof item.amount === "number" && (
                    <Text
                      style={{
                        margin: "8px 0 0",
                        color: "#f28f87",
                        fontSize: "14px",
                        lineHeight: "1.4",
                        fontWeight: "700",
                      }}
                    >
                      ${((item.amount * item.quantity) / 100).toFixed(2)}
                    </Text>
                  )}
                </Section>
              ))
            ) : (
              <Text
                style={{
                  margin: 0,
                  padding: "16px",
                  backgroundColor: "#2d3236",
                  borderRadius: "8px",
                  color: "#aeb6bd",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Your purchase has been successfully recorded.
              </Text>
            )}

            {/* Total */}
            <Section
              style={{
                marginTop: "20px",
                padding: "18px 0 0",
                borderTop: "1px solid #3d4449",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  color: "#f1f3f5",
                  fontSize: "20px",
                  lineHeight: "1.5",
                  fontWeight: "800",
                }}
              >
                Total Paid: ${amountPaid}
              </Text>
            </Section>
          </Section>

          {/* =========================================================
              ACCOUNT SETUP
          ========================================================== */}

          {isNewAccount && setupUrl && (
            <Section
              style={{
                margin: "28px 30px 0",
                padding: "22px",
                backgroundColor: "#30363a",
                border: "1px solid #454d52",
                borderRadius: "10px",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  color: "#f28f87",
                  fontSize: "13px",
                  lineHeight: "1.4",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                }}
              >
                ACCOUNT SETUP REQUIRED
              </Text>

              <Heading
                as="h2"
                style={{
                  margin: "8px 0 10px",
                  color: "#f1f3f5",
                  fontSize: "20px",
                  lineHeight: "1.4",
                  fontWeight: "800",
                }}
              >
                Finish Setting Up Your Justdy Account
              </Heading>

              <Text
                style={{
                  margin: 0,
                  color: "#b7c0c6",
                  fontSize: "14px",
                  lineHeight: "1.7",
                }}
              >
                We created a Justdy account for you using the email address
                below. Create your password to activate your account and access
                your purchased products.
              </Text>

              <Text
                style={{
                  margin: "14px 0 0",
                  color: "#f1f3f5",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  fontWeight: "700",
                }}
              >
                {email}
              </Text>

              <Section
                style={{
                  textAlign: "center",
                  paddingTop: "22px",
                }}
              >
                <Button
                  href={setupUrl}
                  style={{
                    display: "inline-block",
                    backgroundColor: "#f28f87",
                    color: "#24282b",
                    padding: "14px 24px",
                    borderRadius: "7px",
                    fontSize: "14px",
                    lineHeight: "1.2",
                    fontWeight: "800",
                    textDecoration: "none",
                  }}
                >
                  Set Up My Justdy Account
                </Button>
              </Section>

              <Text
                style={{
                  margin: "15px 0 0",
                  color: "#7f8a91",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  textAlign: "center",
                }}
              >
                Use the button above to create your password and activate your
                account.
              </Text>
            </Section>
          )}

          {/* =========================================================
              LIBRARY / NEXT STEP
          ========================================================== */}

          <Section
            style={{
              margin: "28px 30px 0",
              padding: "22px",
              backgroundColor: "#292e32",
              borderTop: "1px solid #3d4449",
            }}
          >
            <Text
              style={{
                margin: 0,
                color: "#e7eaed",
                fontSize: "15px",
                lineHeight: "1.6",
                fontWeight: "700",
              }}
            >
              Access your Justdy library
            </Text>

            <Text
              style={{
                margin: "8px 0 0",
                color: "#9fa8ae",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              {isNewAccount
                ? "After creating your password, sign in to access your purchased products."
                : "Sign in to your Justdy account to access your purchased products."}
            </Text>

            <Section
              style={{
                textAlign: "center",
                paddingTop: "18px",
              }}
            >
              <Button
                href={dashboardUrl}
                style={{
                  display: "inline-block",
                  backgroundColor: "#ffffff",
                  color: "#2563eb",
                  border: "1px solid #ffffff",
                  padding: "12px 22px",
                  borderRadius: "7px",
                  fontSize: "14px",
                  lineHeight: "1.2",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
              >
                Go to My Justdy Library
              </Button>
            </Section>
          </Section>

          {/* =========================================================
              FOOTER
          ========================================================== */}

          <Section
            style={{
              padding: "28px 30px 34px",
              backgroundColor: "#24282b",
            }}
          >
            <Text
              style={{
                margin: 0,
                paddingTop: "20px",
                borderTop: "1px solid #3d4449",
                color: "#7f8a91",
                fontSize: "12px",
                lineHeight: "1.6",
              }}
            >
              If you did not make this purchase, please contact Justdy support
              immediately.
            </Text>

            <Text
              style={{
                margin: "14px 0 0",
                color: "#59636a",
                fontSize: "11px",
                lineHeight: "1.5",
                textAlign: "center",
              }}
            >
              This is a system-generated purchase confirmation from Justdy.
            </Text>

            <Text
              style={{
                margin: "8px 0 0",
                color: "#59636a",
                fontSize: "11px",
                lineHeight: "1.5",
                textAlign: "center",
              }}
            >
              © {new Date().getFullYear()} Justdy. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
