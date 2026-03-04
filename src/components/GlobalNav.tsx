"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function GlobalNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      />
      <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
