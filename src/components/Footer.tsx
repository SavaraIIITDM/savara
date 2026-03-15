"use client";

import { Mail, Phone, MapPin, Instagram } from "lucide-react";
import Image from "next/image";

const campusDirectionsUrl =
  "https://www.google.com/maps/dir/?api=1&origin=Chennai+Central+Railway+Station&destination=IIITDM+Kancheepuram&travelmode=transit";

export default function Footer() {
  const footerHeadingColor = "var(--savara-cream)";
  const footerBodyColor = "rgba(245, 230, 211, 0.72)";
  const footerLinkColor = "rgba(245, 230, 211, 0.8)";
  const footerLinkHoverColor = "rgba(245, 230, 211, 0.98)";

  return (
    <footer
      id="contact"
      className="defer-render w-full py-16 px-6 sm:px-12 lg:px-20"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Logo Section */}
          <div className="flex flex-col items-start">
            <Image
              src="/media/white_logo_small_128.webp"
              alt="Savara Logo"
              width={121}
              height={128}
              sizes="48px"
              className="mb-4 h-12 w-auto transition-transform duration-300 hover:scale-105"
            />
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-cinzel), serif",
                color: footerHeadingColor,
              }}
            >
              SAVĀRA
            </h2>
            <p
              className="mt-1 text-sm font-medium tracking-wide"
              style={{
                fontFamily: "var(--font-rajdhani), sans-serif",
                color: footerBodyColor,
              }}
            >
              Chronosync — Where Ancient Meets Future
            </p>
          </div>

          {/* Contact Us Section */}
          <div className="flex flex-col items-start">
            <h3
              className="text-lg font-bold uppercase tracking-widest mb-6"
              style={{
                fontFamily: "var(--font-cinzel), serif",
                color: footerHeadingColor,
              }}
            >
              Contact Us
            </h3>

            <div className="space-y-4">
              {/* Email */}
              <a
                href="mailto:fest@iiitdm.ac.in"
                className="group flex items-start gap-3 transition-colors duration-300"
                style={{ color: footerLinkColor }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = footerLinkHoverColor)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = footerLinkColor)
                }
              >
                <Mail className="w-5 h-5 mt-0.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span
                  className="relative text-sm font-medium"
                  style={{ fontFamily: "var(--font-rajdhani), sans-serif" }}
                >
                  fest@iiitdm.ac.in
                  <span
                    className="absolute bottom-0 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
                    style={{ background: "var(--savara-gold)" }}
                  />
                </span>
              </a>

              {/* Phone */}
              <a
                href="tel:+919391131165"
                className="group flex items-start gap-3 transition-colors duration-300"
                style={{ color: footerLinkColor }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = footerLinkHoverColor)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = footerLinkColor)
                }
              >
                <Phone className="w-5 h-5 mt-0.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span
                  className="relative text-sm font-medium"
                  style={{ fontFamily: "var(--font-rajdhani), sans-serif" }}
                >
                  +91 93911 31165
                  <span
                    className="absolute bottom-0 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
                    style={{ background: "var(--savara-gold)" }}
                  />
                </span>
              </a>

              {/* Address */}
              <div
                className="group flex items-start gap-3"
                style={{ color: footerBodyColor }}
              >
                <MapPin className="w-5 h-5 mt-0.5 shrink-0" />
                <address
                  className="text-sm font-medium not-italic leading-relaxed"
                  style={{ fontFamily: "var(--font-rajdhani), sans-serif" }}
                >
                  IIITDM Kancheepuram,
                  <br />
                  Melakottaiyur, Nellikuppam Road,
                  <br />
                  Near Kandigai,
                  <br />
                  Off Vandalur-Kelambakkam Road,
                  <br />
                  Chennai, Tamil Nadu,
                  <br />
                  India - 600127
                </address>
              </div>

              <a
                href={campusDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 transition-colors duration-300"
                style={{ color: footerLinkColor }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = footerLinkHoverColor)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = footerLinkColor)
                }
              >
                <MapPin className="w-5 h-5 mt-0.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span
                  className="relative text-sm font-semibold uppercase tracking-[0.14em]"
                  style={{ fontFamily: "var(--font-rajdhani), sans-serif" }}
                >
                  Reach Campus
                  <span
                    className="absolute bottom-0 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
                    style={{ background: "var(--savara-gold)" }}
                  />
                </span>
              </a>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="flex flex-col items-start">
            <h3
              className="text-lg font-bold uppercase tracking-widest mb-6"
              style={{
                fontFamily: "var(--font-cinzel), serif",
                color: footerHeadingColor,
              }}
            >
              Follow Us
            </h3>

            <div className="flex flex-col space-y-4">
              {[
                {
                  href: "https://www.instagram.com/savara.iiitdm/",
                  Icon: Instagram,
                  label: "Instagram",
                },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 transition-colors duration-300"
                  style={{ color: footerLinkColor }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = footerLinkHoverColor)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = footerLinkColor)
                  }
                >
                  <div
                    className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: "rgba(42, 31, 26, 0.5)",
                      border: "1px solid rgba(212, 165, 116, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(230, 81, 0, 0.15)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(230, 81, 0, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(42, 31, 26, 0.5)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(212, 165, 116, 0.1)";
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className="relative text-sm font-semibold"
                    style={{ fontFamily: "var(--font-rajdhani), sans-serif" }}
                  >
                    {label}
                    <span
                      className="absolute bottom-0 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
                      style={{ background: "var(--savara-gold)" }}
                    />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-16 pt-8"
          style={{ borderTop: "1px solid rgba(212, 165, 116, 0.1)" }}
        >
          <p
            className="text-center text-xs font-medium tracking-wider"
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              color: "rgba(245, 230, 211, 0.62)",
            }}
          >
            &copy; 2026 SAVĀRA Chronosync — IIITDM Kancheepuram. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
