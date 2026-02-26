import { Booth } from "./types";

/**
 * Sample booth data.
 *
 * HOW TO ADD MORE BOOTHS:
 *   1. Copy any object below.
 *   2. Give it a unique `id` and `boothNumber`.
 *   3. Set `position` (top-left corner) and `dimensions` (width/height)
 *      relative to the 1200×800 floor-plan coordinate system.
 *   4. Set `status` to one of: "Available" | "Sold" | "Option" | "Reserved".
 *
 * HOW TO IMPORT FROM A SPREADSHEET / CSV:
 *   Convert rows to this JSON shape and replace this array,
 *   or call an API that returns the same shape.
 */
export const SAMPLE_BOOTHS: Booth[] = [
  // ── Row A (top row) ──────────────────────────────────────────
  {
    id: "1",
    boothNumber: "A01",
    companyName: "TechVision BV",
    status: "Sold",
    position: { x: 60, y: 60 },
    dimensions: { width: 160, height: 120 },
    category: "Technology",
    description: "AI & Machine Learning solutions for enterprise customers.",
  },
  {
    id: "2",
    boothNumber: "A02",
    companyName: "GreenEnergy Corp",
    status: "Sold",
    position: { x: 240, y: 60 },
    dimensions: { width: 160, height: 120 },
    category: "Energy",
    description: "Sustainable energy solutions and solar panel technology.",
  },
  {
    id: "3",
    boothNumber: "A03",
    status: "Available",
    position: { x: 420, y: 60 },
    dimensions: { width: 160, height: 120 },
    category: "General",
    description: "Premium corner booth with high foot traffic.",
  },
  {
    id: "4",
    boothNumber: "A04",
    companyName: "DataFlow Systems",
    status: "Option",
    position: { x: 600, y: 60 },
    dimensions: { width: 160, height: 120 },
    category: "Technology",
    description: "Cloud data integration and analytics platform.",
  },
  {
    id: "5",
    boothNumber: "A05",
    status: "Available",
    position: { x: 780, y: 60 },
    dimensions: { width: 160, height: 120 },
    category: "General",
  },

  // ── Row B (middle row) ────────────────────────────────────────
  {
    id: "6",
    boothNumber: "B01",
    companyName: "MediTech Health",
    status: "Reserved",
    position: { x: 60, y: 260 },
    dimensions: { width: 200, height: 140 },
    category: "Healthcare",
    description: "Medical devices and health-tech innovations.",
  },
  {
    id: "7",
    boothNumber: "B02",
    status: "Available",
    position: { x: 280, y: 260 },
    dimensions: { width: 140, height: 140 },
    category: "General",
  },
  {
    id: "8",
    boothNumber: "B03",
    companyName: "Creative Studio",
    status: "Sold",
    position: { x: 440, y: 260 },
    dimensions: { width: 200, height: 140 },
    category: "Design",
    description: "Award-winning design agency specialising in brand identity.",
  },
  {
    id: "9",
    boothNumber: "B04",
    companyName: "LogiPro NL",
    status: "Option",
    position: { x: 660, y: 260 },
    dimensions: { width: 140, height: 140 },
    category: "Logistics",
    description: "Smart logistics and supply-chain management.",
  },
  {
    id: "10",
    boothNumber: "B05",
    status: "Reserved",
    position: { x: 820, y: 260 },
    dimensions: { width: 160, height: 140 },
    category: "General",
    description: "Reserved for returning exhibitor.",
  },

  // ── Row C (bottom row) ────────────────────────────────────────
  {
    id: "11",
    boothNumber: "C01",
    companyName: "FoodTech International",
    status: "Sold",
    position: { x: 60, y: 480 },
    dimensions: { width: 220, height: 130 },
    category: "Food & Beverage",
    description: "Innovative food processing and packaging technology.",
  },
  {
    id: "12",
    boothNumber: "C02",
    status: "Available",
    position: { x: 300, y: 480 },
    dimensions: { width: 160, height: 130 },
    category: "General",
  },
  {
    id: "13",
    boothNumber: "C03",
    companyName: "SecureNet",
    status: "Sold",
    position: { x: 480, y: 480 },
    dimensions: { width: 180, height: 130 },
    category: "Cybersecurity",
    description: "Enterprise cybersecurity and network protection.",
  },
  {
    id: "14",
    boothNumber: "C04",
    status: "Option",
    position: { x: 680, y: 480 },
    dimensions: { width: 140, height: 130 },
    category: "General",
    description: "Compact booth near main stage.",
  },
  {
    id: "15",
    boothNumber: "C05",
    companyName: "EduLearn Platform",
    status: "Reserved",
    position: { x: 840, y: 480 },
    dimensions: { width: 160, height: 130 },
    category: "Education",
    description: "E-learning platform for professional development.",
  },
];
